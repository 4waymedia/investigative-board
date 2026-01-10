// ============================================================================
// PINS MODULE - Pin selection, management, and information display
// ============================================================================

// ============================================================================
// PIN SELECTION MANAGEMENT
// ============================================================================

/**
 * Get all pins connected to a starting pin (including the start pin itself)
 * @param {number} startIdx - Index of the starting pin
 * @returns {number[]} Array of connected pin indices
 */
function getConnectedComponent(startIdx) {
  const visited = new Set();
  const stack = [startIdx];
  while (stack.length) {
    const i = stack.pop();
    if (visited.has(i)) continue;
    visited.add(i);
    for (const c of connections) {
      if (c.startIndex === i && !visited.has(c.endIndex))
        stack.push(c.endIndex);
      if (c.endIndex === i && !visited.has(c.startIndex))
        stack.push(c.startIndex);
    }
  }
  return Array.from(visited);
}

/**
 * Get the target pins for operations (selected pins or connected component)
 * @returns {Object[]} Array of pin objects
 */
function getTargetPins() {
  if (selectedPins.length > 0) {
    // If multiple pins are selected, return only those
    return selectedPins.map((i) => pins[i]).filter((p) => p);
  }
  if (selectedPinIndex !== null && pins[selectedPinIndex]) {
    return getConnectedComponent(selectedPinIndex).map((i) => pins[i]);
  }
  return [...pins];
}

/**
 * Set the selected pin(s)
 * @param {number|null} index - Pin index to select, or null to clear selection
 */
function setSelectedPin(index) {
  // If a pin is selected (index is a number), set both single and marquee selection
  if (
    typeof index === "number" &&
    index !== null &&
    index !== undefined
  ) {
    selectedPinIndex = index;
    selectedPins = [index];
  } else {
    // If called with null or undefined, clear all selection state
    selectedPinIndex = null;
    selectedPins = [];
  }

  renderSelectedPinInfo();
  closeRadialMenu(); // Close radial menu if a different pin is selected
  draw();
}

/**
 * Clear all pin selections
 */
function clearPinSelection() {
  selectedPinIndex = null;
  selectedPins = [];
  renderSelectedPinInfo();
}

/**
 * Toggle pin selection (for multi-select)
 * @param {number} index - Pin index to toggle
 */
function togglePinSelection(index) {
  const currentIndex = selectedPins.indexOf(index);
  if (currentIndex !== -1) {
    // Remove from selection
    selectedPins.splice(currentIndex, 1);
    if (selectedPinIndex === index) {
      selectedPinIndex = selectedPins.length > 0 ? selectedPins[0] : null;
    }
  } else {
    // Add to selection
    selectedPins.push(index);
    selectedPinIndex = index;
  }
  renderSelectedPinInfo();
}

/**
 * Select all pins in the current view
 */
function selectAllPins() {
  selectedPins = pins.map((_, index) => index);
  selectedPinIndex = selectedPins.length > 0 ? selectedPins[0] : null;
  renderSelectedPinInfo();
}

/**
 * Delete the currently selected pin(s)
 */
function deleteSelectedPin() {
  if (selectedPins.length === 0) return;

  saveHistory();

  // Sort in descending order to delete from highest index first
  const sortedIndices = [...selectedPins].sort((a, b) => b - a);

  // Remove pins
  sortedIndices.forEach((index) => {
    pins.splice(index, 1);
  });

  // Remove connections that reference deleted pins
  connections = connections.filter((c) => {
    return (
      c.startIndex < pins.length &&
      c.endIndex < pins.length &&
      !sortedIndices.includes(c.startIndex) &&
      !sortedIndices.includes(c.endIndex)
    );
  });

  // Adjust connection indices for removed pins
  connections.forEach((c) => {
    let adjustment = 0;
    sortedIndices.forEach((removedIndex) => {
      if (c.startIndex > removedIndex) adjustment++;
    });
    c.startIndex -= adjustment;

    adjustment = 0;
    sortedIndices.forEach((removedIndex) => {
      if (c.endIndex > removedIndex) adjustment++;
    });
    c.endIndex -= adjustment;
  });

  // Clear selection
  clearPinSelection();
  saveState();
  draw();
}

// ============================================================================
// PIN INFORMATION DISPLAY
// ============================================================================

/**
 * Render information about the currently selected pin(s)
 */
function renderSelectedPinInfo() {
  // Handle selection for single pin or the first pin in a group selection
  let displayIndex = selectedPinIndex;
  if (displayIndex === null && selectedPins.length > 0) {
    displayIndex = selectedPins[0];
  }

  if (displayIndex === null || !pins[displayIndex]) {
    pinInfo.style.display = "none";
    return;
  }

  const pin = pins[displayIndex];
  const card =
    pin.cardId != null ? cards.find((c) => c.id === pin.cardId) : null;

  let title = pin.label || (card ? card.title : "Untitled Pin");
  let subtitle = card
    ? card.subtitle || ""
    : pin.cardId == null
    ? "Free pin (no source card)"
    : "";

  if (selectedPins.length > 1) {
    title = `${selectedPins.length} Pins Selected`;
    subtitle = "Use batch actions in the future!";
  }

  const note = pin.note || "";
  const dateStr = pin.date || (card ? card.date : "");

  pinInfoTitle.textContent = title;
  pinInfoSub.textContent = subtitle;
  pinInfoNote.textContent = note;
  pinInfoColor.style.backgroundColor = pin.color;
  pinInfoMeta.textContent = dateStr;

  pinInfo.style.display = "block";
}

// ============================================================================
// PIN UTILITY FUNCTIONS
// ============================================================================

/**
 * Find a pin at the given world coordinates
 * @param {number} wx - World X coordinate
 * @param {number} wy - World Y coordinate
 * @returns {number|null} Pin index or null if not found
 */
function getPinAtPosition(wx, wy) {
  // Search from topmost pin (highest z-index) downwards
  for (let i = pins.length - 1; i >= 0; i--) {
    const pin = pins[i];
    const metrics = getPinMetrics(i);
    const shape = metrics.shape;

    if (shape === "area-circle") {
      const distance = Math.sqrt(
        (wx - pin.x) ** 2 + (wy - pin.y) ** 2
      );
      if (distance <= metrics.radius) return i;
    } else if (shape === "area-rect") {
      const halfWidth = metrics.width / 2;
      const halfHeight = metrics.height / 2;
      if (
        wx >= pin.x - halfWidth &&
        wx <= pin.x + halfWidth &&
        wy >= pin.y - halfHeight &&
        wy <= pin.y + halfHeight
      ) {
        return i;
      }
    } else {
      // Regular pins (circle, card, pill, rect)
      const w = metrics.width || 46;
      const h = metrics.height || 30;
      const padding = Math.max(w, h) * 0.2;
      const halfW = w / 2 + padding;
      const halfH = h / 2 + padding;
      const r = metrics.radius || 10;

      if (shape === "circle") {
        const distance = Math.sqrt(
          (wx - pin.x) ** 2 + (wy - pin.y) ** 2
        );
        if (distance <= r + padding) return i;
      } else {
        // Rectangular shapes (card, pill, rect)
        if (
          wx >= pin.x - halfW &&
          wx <= pin.x + halfW &&
          wy >= pin.y - halfH &&
          wy <= pin.y + halfH
        ) {
          return i;
        }
      }
    }
  }
  return null;
}

/**
 * Find a card at the given world coordinates
 * @param {number} wx - World X coordinate
 * @param {number} wy - World Y coordinate
 * @returns {number|null} Card index or null if not found
 */
function getCardAtPosition(wx, wy) {
  // Search from topmost card downwards
  for (let i = cards.length - 1; i >= 0; i--) {
    const card = cards[i];
    // Simple rectangular hit test for cards
    const halfWidth = 75; // Approximate card width
    const halfHeight = 50; // Approximate card height
    if (
      wx >= card.x - halfWidth &&
      wx <= card.x + halfWidth &&
      wy >= card.y - halfHeight &&
      wy <= card.y + halfHeight
    ) {
      return i;
    }
  }
  return null;
}

/**
 * Select a card
 * @param {number} index - Card index to select
 */
function selectCard(index) {
  // Implementation depends on card selection logic
  // This is a placeholder for card selection functionality
}

/**
 * Create a pin at the specified position
 * @param {number} x - World X coordinate
 * @param {number} y - World Y coordinate
 */
function createPinAtPosition(x, y) {
  const newPin = {
    x: x,
    y: y,
    color: selectedColor,
    label: "",
    note: "",
    date: "",
    typeId: currentTypeId,
  };

  pins.push(newPin);
  const newIndex = pins.length - 1;
  setSelectedPin(newIndex);
  saveState();
  draw();
}

/**
 * Create a pin with size based on drag distance
 * @param {number} x - World X coordinate
 * @param {number} y - World Y coordinate
 * @param {number} dragDistance - Distance dragged
 */
function createPinWithSize(x, y, dragDistance) {
  const size = Math.max(20, Math.min(100, dragDistance));
  const newPin = {
    x: x,
    y: y,
    color: selectedColor,
    label: "",
    note: "",
    date: "",
    typeId: currentTypeId,
    width: size,
    height: size,
  };

  pins.push(newPin);
  const newIndex = pins.length - 1;
  setSelectedPin(newIndex);
  saveState();
  draw();
}
