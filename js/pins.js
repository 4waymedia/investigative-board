// ============================================================================
// PINS MODULE - Pin selection, management, and information display
// ============================================================================

// ============================================================================
// PIN GEOMETRY CONSTANTS
// ============================================================================

/**
 * Default pin dimensions and hitbox settings
 */
const PIN_GEOMETRY = {
  DEFAULT_WIDTH: 46,
  DEFAULT_HEIGHT: 30,
  DEFAULT_RADIUS: 10,
  HITBOX_PADDING_RATIO: 0.2, // 20% padding around pin dimensions
  CARD_HALF_WIDTH: 75,
  CARD_HALF_HEIGHT: 50,
};

// ============================================================================
// EVENT SYSTEM
// ============================================================================

/**
 * Simple event emitter for decoupling pins module from global functions
 */
const pinEvents = {
  listeners: new Map(),

  /**
   * Add an event listener
   * @param {string} event - Event name
   * @param {Function} callback - Event handler
   */
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  },

  /**
   * Remove an event listener
   * @param {string} event - Event name
   * @param {Function} callback - Event handler to remove
   */
  off(event, callback) {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      const index = eventListeners.indexOf(callback);
      if (index !== -1) {
        eventListeners.splice(index, 1);
      }
    }
  },

  /**
   * Emit an event to all listeners
   * @param {string} event - Event name
   * @param {*} data - Event data
   */
  emit(event, data) {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in pin event listener for '${event}':`, error);
        }
      });
    }
  }
};

// ============================================================================
// PIN SELECTION MANAGEMENT
// ============================================================================

/**
 * Get all pin IDs connected to a starting pin ID
 * @param {string} startId - ID of the starting pin
 * @returns {string[]} Array of connected pin IDs
 */
function getConnectedComponent(startId) {
  if (!startId) return [];

  // 1. Build Adjacency List using IDs directly
  const adj = new Map();
  for (const c of connections) {
    // Use IDs directly (assuming connections have been migrated to ID-based)
    const connStartId = c.startId || pins[c.startIndex]?.id;
    const connEndId = c.endId || pins[c.endIndex]?.id;

    if (!connStartId || !connEndId) continue; // Skip invalid connections

    if (!adj.has(connStartId)) adj.set(connStartId, []);
    if (!adj.has(connEndId)) adj.set(connEndId, []);
    adj.get(connStartId).push(connEndId);
    adj.get(connEndId).push(connStartId);
  }

  // 2. Traversal
  const visited = new Set();
  const stack = [startId];

  while (stack.length > 0) {
    const currentId = stack.pop();
    if (visited.has(currentId)) continue;

    visited.add(currentId);

    const neighbors = adj.get(currentId) || [];
    for (const neighborId of neighbors) {
      if (!visited.has(neighborId)) {
        stack.push(neighborId);
      }
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
  if (typeof index === "number") {
    selectedPinIndex = index;
    selectedPins = [index];
  } else {
    // Clear selection for null, undefined, or invalid values
    selectedPinIndex = null;
    selectedPins = [];
  }

  // Emit events for decoupled state management
  pinEvents.emit('selectionChanged', { selectedPinIndex, selectedPins });
}

/**
 * Clear all pin selections
 */
function clearPinSelection() {
  selectedPinIndex = null;
  selectedPins = [];
  pinEvents.emit('selectionChanged', { selectedPinIndex, selectedPins });
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
  pinEvents.emit('selectionChanged', { selectedPinIndex, selectedPins });
}

/**
 * Select all pins in the current view
 */
function selectAllPins() {
  selectedPins = pins.map((_, index) => index);
  selectedPinIndex = selectedPins.length > 0 ? selectedPins[0] : null;
  pinEvents.emit('selectionChanged', { selectedPinIndex, selectedPins });
}

// ============================================================================
// ID-BASED SELECTION FUNCTIONS (New UUID Architecture)
// ============================================================================

// New State Variables for ID-based selection
let selectedPinId = null;
let selectedPinIds = [];

/**
 * Set the selected pin(s) by ID
 * @param {string|null} id - Pin ID to select, or null to clear selection
 */
function setSelectedPinById(id) {
  if (id) {
    selectedPinId = id;
    selectedPinIds = [id];
  } else {
    selectedPinId = null;
    selectedPinIds = [];
  }
  renderSelectedPinInfo();
  pinEvents.emit('selectionChanged', { selectedPinId, selectedPinIds });
}

/**
 * Clear all pin selections (ID-based)
 */
function clearPinSelectionById() {
  selectedPinId = null;
  selectedPinIds = [];
  renderSelectedPinInfo();
  pinEvents.emit('selectionChanged', { selectedPinId, selectedPinIds });
}

/**
 * Toggle pin selection by ID (for multi-select)
 * @param {string} id - Pin ID to toggle
 */
function togglePinSelectionById(id) {
  const currentIndex = selectedPinIds.indexOf(id);
  if (currentIndex !== -1) {
    // Remove from selection
    selectedPinIds.splice(currentIndex, 1);
    if (selectedPinId === id) {
      selectedPinId = selectedPinIds.length > 0 ? selectedPinIds[0] : null;
    }
  } else {
    // Add to selection
    selectedPinIds.push(id);
    selectedPinId = id;
  }
  renderSelectedPinInfo();
  pinEvents.emit('selectionChanged', { selectedPinId, selectedPinIds });
}

/**
 * Delete the currently selected pin(s) and safely update connection indices
 */
function deleteSelectedPin() {
  if (selectedPins.length === 0) return;

  saveHistory();

  // 1. Create a Map to track how indices change
  const indexMap = new Map();
  const remainingPins = [];

  // 2. Filter pins and build the index map (O(N))
  pins.forEach((pin, oldIndex) => {
    if (!selectedPins.includes(oldIndex)) {
      const newIndex = remainingPins.length;
      indexMap.set(oldIndex, newIndex);
      remainingPins.push(pin);
    }
  });

  // 3. Update or remove connections (O(M))
  connections = connections.filter((c) => {
    // Keep connection only if both start and end pins still exist
    return indexMap.has(c.startIndex) && indexMap.has(c.endIndex);
  }).map((c) => {
    // Re-map the indices to their new positions in the pins array
    return {
      ...c,
      startIndex: indexMap.get(c.startIndex),
      endIndex: indexMap.get(c.endIndex)
    };
  });

  // 4. Update state
  pins = remainingPins;
  clearPinSelection();
  pinEvents.emit('pinsDeleted', { deletedIndices: selectedPins, remainingPins: pins.length });
}

/**
 * Delete the currently selected pin(s) by ID (UUID Architecture)
 * This is the simplified version that works with unique IDs
 */
function deleteSelectedPinsById() {
  if (selectedPinIds.length === 0) return;

  saveHistory();

  // 1. Remove the pins
  pins = pins.filter(p => !selectedPinIds.includes(p.id));

  // 2. Remove connections that reference the deleted IDs
  // Note: This requires connections to store IDs, but for now we'll keep index-based
  // In a full UUID migration, this would be:
  // connections = connections.filter(c =>
  //   !selectedPinIds.includes(c.startId) &&
  //   !selectedPinIds.includes(c.endId)
  // );

  // For now, convert IDs to indices and use existing logic
  const deletedIndices = selectedPinIds.map(id => {
    // This is inefficient but works for demonstration
    return pins.findIndex(p => p.id === id);
  }).filter(idx => idx !== -1);

  if (deletedIndices.length > 0) {
    // Use the existing index-based deletion for connections
    const indexMap = new Map();
    const remainingPins = [];

    pins.forEach((pin, oldIndex) => {
      if (!deletedIndices.includes(oldIndex)) {
        const newIndex = remainingPins.length;
        indexMap.set(oldIndex, newIndex);
        remainingPins.push(pin);
      }
    });

    connections = connections.filter((c) => {
      return indexMap.has(c.startIndex) && indexMap.has(c.endIndex);
    }).map((c) => {
      return {
        ...c,
        startIndex: indexMap.get(c.startIndex),
        endIndex: indexMap.get(c.endIndex)
      };
    });

    pins = remainingPins;
  }

  selectedPinIds = [];
  selectedPinId = null;
  pinEvents.emit('pinsDeleted', { deletedIds: selectedPinIds, remainingPins: pins.length });
}

// ============================================================================
// PIN INFORMATION DISPLAY
// ============================================================================

/**
 * Render information about the currently selected pin(s) using Unique IDs
 */
function renderSelectedPinInfo() {
  // 1. Identify which pin to display
  // Fallback to the first ID in a multi-selection if the primary ID is null
  let displayId = selectedPinId;
  if (displayId === null && selectedPinIds.length > 0) {
    displayId = selectedPinIds[0];
  }

  // 2. Clear display if nothing is selected or pin isn't found
  if (displayId === null) {
    pinInfo.style.display = "none";
    return;
  }

  const pin = pins.find(p => p.id === displayId);
  if (!pin) {
    pinInfo.style.display = "none";
    return;
  }

  // 3. Resolve Card data if linked
  const card = pin.cardId != null ? cards.find((c) => c.id === pin.cardId) : null;

  // 4. Determine display text
  let title = pin.label || (card ? card.title : "Untitled Pin");
  let subtitle = card
    ? card.subtitle || ""
    : pin.cardId == null
    ? "Free pin (no source card)"
    : "";

  // Handle multi-select context
  if (selectedPinIds.length > 1) {
    title = `${selectedPinIds.length} Pins Selected`;
    subtitle = "Batch actions available";
  }

  const note = pin.note || "";
  const dateStr = pin.date || (card ? card.date : "");

  // 5. Update DOM elements
  pinInfoTitle.textContent = title;
  pinInfoSub.textContent = subtitle;
  pinInfoNote.textContent = note;
  pinInfoColor.style.backgroundColor = pin.color;
  pinInfoMeta.textContent = dateStr;

  // 6. Update image preview if pin has an image
  this.updatePinInfoImage(pin);

  pinInfo.style.display = "block";
}

/**
 * Update the image preview in the pin info display
 * @param {Object} pin - Pin object
 */
function updatePinInfoImage(pin) {
  // Find or create image preview element
  let imagePreview = document.getElementById('pin-info-image-preview');
  if (!imagePreview) {
    imagePreview = document.createElement('div');
    imagePreview.id = 'pin-info-image-preview';
    imagePreview.className = 'pin-info-image-preview';

    // Insert after the color indicator
    const pinInfoColor = document.getElementById('pin-info-color');
    if (pinInfoColor && pinInfoColor.parentNode) {
      pinInfoColor.parentNode.insertBefore(imagePreview, pinInfoColor.nextSibling);
    }
  }

  // Clear existing content
  imagePreview.innerHTML = '';

  if (pin.image && pin.image.dataUrl) {
    // Create thumbnail
    const img = document.createElement('img');
    img.src = pin.image.dataUrl;
    img.alt = 'Pin image';
    img.style.width = '32px';
    img.style.height = '32px';
    img.style.objectFit = 'cover';
    img.style.borderRadius = '2px';
    img.style.border = '1px solid #30363d';

    imagePreview.appendChild(img);
    imagePreview.style.display = 'block';
  } else {
    imagePreview.style.display = 'none';
  }
}


// ============================================================================
// PIN UTILITY FUNCTIONS
// ============================================================================

/**
 * Find a pin ID at the given world coordinates
 * @param {number} wx - World X coordinate
 * @param {number} wy - World Y coordinate
 * @returns {string|null} Pin ID or null if not found
 */
function getPinAtPosition(wx, wy) {
  // Search from topmost pin (highest index) downwards
  for (let i = pins.length - 1; i >= 0; i--) {
    const pin = pins[i];
    const metrics = getPinMetrics(i); // Use the existing source of truth
    const shape = metrics.shape;

    // Use specific geometric logic based on the shape defined in metrics
    switch (shape) {
      case "area-circle":
      case "circle": {
        const r = shape === "circle" ? (metrics.radius || 10) : metrics.radius;
        // Optimization: use squared distance to avoid expensive Math.sqrt()
        const dx = wx - pin.x;
        const dy = wy - pin.y;
        if (dx * dx + dy * dy <= r * r) return pin.id;
        break;
      }

      case "area-rect":
      case "card":
      case "pill":
      case "rect": {
        // Standardize dimensions from metrics, falling back to 0 if undefined
        const halfW = (metrics.width || 0) / 2;
        const halfH = (metrics.height || 0) / 2;

        if (
          wx >= pin.x - halfW &&
          wx <= pin.x + halfW &&
          wy >= pin.y - halfH &&
          wy <= pin.y + halfH
        ) {
          return pin.id;
        }
        break;
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
    // Simple rectangular hit test for cards using centralized geometry
    if (
      wx >= card.x - PIN_GEOMETRY.CARD_HALF_WIDTH &&
      wx <= card.x + PIN_GEOMETRY.CARD_HALF_WIDTH &&
      wy >= card.y - PIN_GEOMETRY.CARD_HALF_HEIGHT &&
      wy <= card.y + PIN_GEOMETRY.CARD_HALF_HEIGHT
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
 * Create a pin at the specified position with a Unique ID
 * @param {number} x - World X coordinate
 * @param {number} y - World Y coordinate
 */
function createPinAtPosition(x, y) {
  const newPin = {
    id: crypto.randomUUID(), // Generates a unique string like "550e8400-e29b..."
    x: x,
    y: y,
    color: selectedColor,
    label: "",
    note: "",
    date: "",
    typeId: currentTypeId,
    image: null, // { dataUrl: string, style: string, position: string, size: number, originalFileName: string }
  };

  pins.push(newPin);
  saveHistory();
  setSelectedPinById(newPin.id);
  pinEvents.emit('pinCreated', { pin: newPin });
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
    id: crypto.randomUUID(), // Generates a unique string like "550e8400-e29b..."
    x: x,
    y: y,
    color: selectedColor,
    label: "",
    note: "",
    date: "",
    typeId: currentTypeId,
    width: size,
    height: size,
    image: null, // { dataUrl: string, style: string, position: string, size: number, originalFileName: string }
  };

  pins.push(newPin);
  saveHistory();
  setSelectedPinById(newPin.id);
  pinEvents.emit('pinCreated', { pin: newPin });
}

// ============================================================================
// EVENT SYSTEM API
// ============================================================================

// ============================================================================
// ID-BASED CONNECTION FUNCTIONS
// ============================================================================

/**
 * Create a connection between two pins using their Unique IDs
 * @param {string} startId - ID of the source pin
 * @param {string} endId - ID of the target pin
 * @param {string} type - Connection type (default: "default")
 */
function createConnection(startId, endId, type = "default") {
  // 1. Validation: Prevent self-connection or duplicates
  if (startId === endId) return;

  const alreadyConnected = connections.some(c =>
    (c.startId === startId && c.endId === endId) ||
    (c.startId === endId && c.endId === startId)
  );

  if (alreadyConnected) return;

  // 2. Store the connection using stable IDs
  const newConnection = {
    startId: startId,
    endId: endId,
    type: type,
    createdAt: Date.now()
  };

  saveHistory();
  connections.push(newConnection);
  saveState();
  draw();
}

/**
 * Check if two pins are connected by their IDs
 * @param {string} startId - ID of the first pin
 * @param {string} endId - ID of the second pin
 * @returns {boolean} True if pins are connected
 */
function arePinsConnected(startId, endId) {
  return connections.some(c =>
    (c.startId === startId && c.endId === endId) ||
    (c.startId === endId && c.endId === startId)
  );
}

/**
 * Get all connections for a specific pin by ID
 * @param {string} pinId - ID of the pin
 * @returns {Array} Array of connection objects
 */
function getConnectionsForPin(pinId) {
  return connections.filter(c =>
    c.startId === pinId || c.endId === pinId
  );
}

/**
 * Remove a connection between two pins by their IDs
 * @param {string} startId - ID of the first pin
 * @param {string} endId - ID of the second pin
 */
function removeConnection(startId, endId) {
  const initialLength = connections.length;
  connections = connections.filter(c =>
    !(c.startId === startId && c.endId === endId) &&
    !(c.startId === endId && c.endId === startId)
  );

  if (connections.length < initialLength) {
    saveHistory();
    saveState();
    draw();
  }
}

/**
 * Helper function for drawing connections in the render loop
 * Creates a Map of pin IDs to pin objects for efficient lookups
 * @returns {Map<string, Object>} Map of pin IDs to pin objects
 */
function createPinLookupMap() {
  const pinMap = new Map();
  pins.forEach(pin => pinMap.set(pin.id, pin));
  return pinMap;
}

/**
 * Migrate existing index-based connections to ID-based connections
 * This function can be called once to update legacy connection data
 */
function migrateConnectionsToIds() {
  const migratedConnections = [];
  const processed = new Set();

  for (const c of connections) {
    // Skip if already migrated
    if (c.startId && c.endId) {
      migratedConnections.push(c);
      continue;
    }

    // Convert indices to IDs
    const startId = pins[c.startIndex]?.id;
    const endId = pins[c.endIndex]?.id;

    if (startId && endId) {
      // Create new ID-based connection
      const migratedConnection = {
        startId: startId,
        endId: endId,
        type: c.type || "default",
        createdAt: c.createdAt || Date.now()
      };
      migratedConnections.push(migratedConnection);
    }
    // Skip invalid connections silently
  }

  connections = migratedConnections;
  console.log(`Migrated ${connections.length} connections to ID-based format`);
}

// ============================================================================
// ID-BASED UTILITY FUNCTIONS
// ============================================================================

/**
 * Find a pin by its ID
 * @param {string} id - Pin ID to search for
 * @returns {Object|null} Pin object or null if not found
 */
function getPinById(id) {
  return pins.find(p => p.id === id) || null;
}

/**
 * Find the index of a pin by its ID
 * @param {string} id - Pin ID to search for
 * @returns {number} Pin index or -1 if not found
 */
function getPinIndexById(id) {
  return pins.findIndex(p => p.id === id);
}

/**
 * Get all pin IDs
 * @returns {string[]} Array of all pin IDs
 */
function getAllPinIds() {
  return pins.map(p => p.id);
}

/**
 * Subscribe to pin events for decoupled state management
 * Available events:
 * - 'selectionChanged': Fired when pin selection changes { selectedPinIndex, selectedPins, selectedPinId, selectedPinIds }
 * - 'pinsDeleted': Fired when pins are deleted { deletedIndices, remainingPins, deletedIds }
 * - 'pinCreated': Fired when a new pin is created { pin }
 *
 * Note: UI updates (renderSelectedPinInfo) are handled automatically by ID-based selection functions.
 * Use events for additional listeners that need to respond to selection changes.
 *
 * @param {string} event - Event name to listen for
 * @param {Function} callback - Callback function
 */
function onPinEvent(event, callback) {
  pinEvents.on(event, callback);
}

/**
 * Unsubscribe from pin events
 * @param {string} event - Event name
 * @param {Function} callback - Callback function to remove
 */
function offPinEvent(event, callback) {
  pinEvents.off(event, callback);
}
