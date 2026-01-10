// ============================================================================
// CANVAS MODULE - Canvas interaction handlers and event management
// ============================================================================

// ============================================================================
// MOUSE EVENT HANDLERS
// ============================================================================

/**
 * Set up canvas event handlers
 */
function setupCanvasEvents() {
  const canvasContainer = document.getElementById('canvas-container');

  // Set up drop handlers on canvas container
  canvasContainer.ondragover = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  canvasContainer.ondrop = (e) => {
    e.preventDefault();
    const cardId = parseInt(e.dataTransfer.getData('cardId'));
    const card = cards.find(c => c.id === cardId);
    if (!card || card.used) return;

    // Use the canvas bounding rect for coordinate calculation (more accurate)
    const rect = canvas.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;

    const world = screenToWorld(sx, sy);
    const newIdx = pins.length;
    pins.push({
      x: world.x,
      y: world.y,
      color: card.color,
      label: card.title,
      note: '',
      date: card.date || '',
      cardId: card.id,
      typeId: currentTypeId // Use the current selected card type
    });

    card.used = true;
    renderCards();
    saveState(); // Save to localStorage

    setSelectedPin(newIdx);
  };

  // Make sure canvas doesn't interfere with drop events
  canvas.ondragover = (e) => {
    // Let the event bubble up to the container
    return true;
  };

  canvas.ondrop = (e) => {
    // Let the event bubble up to the container
    return true;
  };

  // Marquee selection functions
  function finalizeMarqueeSelection() {
    if (marqueeStart && marqueeEnd) {
      selectedPins = calculateMarqueeSelection(marqueeStart, marqueeEnd);
      selectedPinIndex = selectedPins.length > 0 ? selectedPins[0] : null;
      renderSelectedPinInfo();
      draw();
    }
  }

  function calculateMarqueeSelection(start, end) {
    const minX = Math.min(start.x, end.x);
    const maxX = Math.max(start.x, end.x);
    const minY = Math.min(start.y, end.y);
    const maxY = Math.max(start.y, end.y);
    const selected = [];

    pins.forEach((pin, index) => {
      const buffer = 5 / scale;
      if (
        pin.x >= minX - buffer &&
        pin.x <= maxX + buffer &&
        pin.y >= minY - buffer &&
        pin.y <= maxY + buffer
      ) {
        selected.push(index);
      }
    });

    return selected;
  }

  /**
   * Handle mouse down events on canvas
   */
  canvas.onmousedown = (e) => {
  e.preventDefault();
  // Get canvas position relative to viewport
  const rect = canvas.getBoundingClientRect();
  // Calculate click position relative to canvas (accounting for canvas position on page)
  const canvasX = e.clientX - rect.left;
  const canvasY = e.clientY - rect.top;
  // Convert to world coordinates
  const world = screenToWorld(canvasX, canvasY);
  prevScreenX = e.clientX;
  prevScreenY = e.clientY;
  didDrag = false;
  closeRadialMenu(); // Close radial menu on new click

  if (e.button === 0) {
    // Left mouse button
    if (currentTool === "pan") {
      isPanning = true;
      canvas.style.cursor = "grabbing";
      return;
    }

    if (currentTool === "select") {
      // Start marquee selection
      marqueeStart = { x: world.x, y: world.y };
      marqueeEnd = { x: world.x, y: world.y };
      isMarqueeSelecting = true;
      return;
    }

    if (currentTool === "pin") {
      // Check if clicking on existing pin
      const clickedPinIndex = getPinAtPosition(world.x, world.y);
      if (clickedPinIndex !== null) {
        // Clicked on existing pin
        if (e.shiftKey) {
          // Shift+click: toggle selection
          togglePinSelection(clickedPinIndex);
        } else if (selectedPins.includes(clickedPinIndex)) {
          // Clicked on already selected pin - start drag
          isDraggingSelection = true;
          dragStartOffset = {
            x: world.x - pins[clickedPinIndex].x,
            y: world.y - pins[clickedPinIndex].y,
          };
        } else {
          // Click on unselected pin - select it
          if (!e.ctrlKey && !e.metaKey) {
            clearPinSelection();
          }
          selectedPinIndex = clickedPinIndex;
          selectedPins = [clickedPinIndex];
          renderSelectedPinInfo();
        }
        return;
      }

      // Check if clicking on existing connection
      const clickedConnection = getConnectionAtPosition(world.x, world.y);
      if (clickedConnection) {
        // Select the connection
        selectedConnection = clickedConnection;
        return;
      }

      // Check if clicking on card
      const clickedCardIndex = getCardAtPosition(world.x, world.y);
      if (clickedCardIndex !== null) {
        selectCard(clickedCardIndex);
        return;
      }

      // Check if clicking on text
      const clickedTextIndex = getTextAtPosition(world.x, world.y);
      if (clickedTextIndex !== null) {
        selectedTextIndex = clickedTextIndex;
        return;
      }

      // Nothing clicked - start pin creation drag
      pinDragStart = { x: world.x, y: world.y };
      isCreatingPin = true;
      return;
    }

    if (currentTool === "connect") {
      // Start connection from pin
      connectStartIndex = getPinAtPosition(world.x, world.y);
      if (connectStartIndex !== null) {
        isConnecting = true;
      }
      return;
    }

    if (currentTool === "text") {
      // Check if clicking on existing text
      const clickedTextIndex = getTextAtPosition(world.x, world.y);
      if (clickedTextIndex !== null) {
        selectedTextIndex = clickedTextIndex;
        return;
      }

      // Start text creation
      textCreateStart = { x: world.x, y: world.y };
      textCreateCurrent = { x: world.x, y: world.y };
      isCreatingText = true;
      return;
    }

    if (currentTool === "area") {
      // Check if clicking on existing area pin
      const clickedPinIndex = getPinAtPosition(world.x, world.y);
      if (clickedPinIndex !== null && pins[clickedPinIndex].typeId.startsWith("area:")) {
        // Clicked on existing area - select it
        if (!e.ctrlKey && !e.metaKey) {
          clearPinSelection();
        }
        selectedPinIndex = clickedPinIndex;
        selectedPins = [clickedPinIndex];
        renderSelectedPinInfo();
        return;
      }

      // Start area creation drag
      areaDragStart = { x: world.x, y: world.y };
      isDraggingArea = true;
      return;
    }

    // Check for pin click (any tool)
    const clickedPinIndex = getPinAtPosition(world.x, world.y);
    if (clickedPinIndex !== null) {
      if (e.shiftKey) {
        togglePinSelection(clickedPinIndex);
      } else if (selectedPins.includes(clickedPinIndex)) {
        isDraggingSelection = true;
        dragStartOffset = {
          x: world.x - pins[clickedPinIndex].x,
          y: world.y - pins[clickedPinIndex].y,
        };
      } else {
        if (!e.ctrlKey && !e.metaKey) {
          clearPinSelection();
        }
        selectedPinIndex = clickedPinIndex;
        selectedPins = [clickedPinIndex];
        renderSelectedPinInfo();
      }
      return;
    }

    // Check for card click
    const clickedCardIndex = getCardAtPosition(world.x, world.y);
    if (clickedCardIndex !== null) {
      selectCard(clickedCardIndex);
      return;
    }

    // Check for text click
    const clickedTextIndex = getTextAtPosition(world.x, world.y);
    if (clickedTextIndex !== null) {
      selectedTextIndex = clickedTextIndex;
      return;
    }
  }

  if (e.button === 2) {
    // Right mouse button - show radial menu
    e.preventDefault();
    showRadialMenu(world.x, world.y);
  }
};

/**
 * Handle mouse move events on canvas
 */
canvas.addEventListener("pointermove", (e) => {
  const rect = canvas.getBoundingClientRect();
  mouseScreenX = e.clientX - rect.left;
  mouseScreenY = e.clientY - rect.top;

  if (e.buttons === 0) return;

  // Skip rendering during layout simulation unless user is actively interacting
  // (User interaction will set isUserInteracting flag)
  if (isLayoutSimulating && !isUserInteracting) return;

  const dx = e.clientX - prevScreenX;
  const dy = e.clientY - prevScreenY;

  if (isPanning) {
    // Pan the view
    offsetX += dx;
    offsetY += dy;
    prevScreenX = e.clientX;
    prevScreenY = e.clientY;
    draw();
    return;
  }

  if (isDraggingSelection) {
    // Drag selected pins
    const world = screenToWorld(mouseScreenX, mouseScreenY);
    const newX = world.x - dragStartOffset.x;
    const newY = world.y - dragStartOffset.y;

    selectedPins.forEach((index) => {
      if (pins[index]) {
        pins[index].x = newX;
        pins[index].y = newY;
      }
    });

    // Also drag selected text if any
    if (selectedTextIndex !== null && textElements[selectedTextIndex]) {
      textElements[selectedTextIndex].x = newX;
      textElements[selectedTextIndex].y = newY;
    }

    prevScreenX = e.clientX;
    prevScreenY = e.clientY;
    draw();
    return;
  }

  if (isMarqueeSelecting) {
    const world = screenToWorld(mouseScreenX, mouseScreenY);
    marqueeEnd = { x: world.x, y: world.y };
    updateMarqueeSelection();
    draw();
    return;
  }

  if (isCreatingPin) {
    didDrag = true;
    draw();
    return;
  }

  if (isConnecting) {
    draw();
    return;
  }

  if (isCreatingText) {
    const world = screenToWorld(mouseScreenX, mouseScreenY);
    textCreateCurrent = { x: world.x, y: world.y };
    didDrag = true;
    draw();
    return;
  }

  if (isDraggingArea) {
    const world = screenToWorld(mouseScreenX, mouseScreenY);
    areaDragCurrent = { x: world.x, y: world.y };
    draw();
    return;
  }

  prevScreenX = e.clientX;
  prevScreenY = e.clientY;
});

/**
 * Handle mouse up events on canvas
 */
canvas.addEventListener("pointerup", (e) => {
  const rect = canvas.getBoundingClientRect();
  const canvasX = e.clientX - rect.left;
  const canvasY = e.clientY - rect.top;
  const world = screenToWorld(canvasX, canvasY);

  if (isPanning) {
    isPanning = false;
    canvas.style.cursor = "grab";
    saveState();
    return;
  }

  if (isDraggingSelection) {
    isDraggingSelection = false;
    saveState();
    draw();
    return;
  }

  if (isMarqueeSelecting) {
    isMarqueeSelecting = false;
    finalizeMarqueeSelection();
    marqueeStart = null;
    marqueeEnd = null;
    draw();
    return;
  }

  if (isCreatingPin) {
    isCreatingPin = false;
    if (!didDrag) {
      // Simple click - create pin at click location
      createPinAtPosition(world.x, world.y);
    } else {
      // Drag release - create pin with size based on drag
      const dragDistance = Math.sqrt(
        Math.pow(world.x - pinDragStart.x, 2) +
        Math.pow(world.y - pinDragStart.y, 2)
      );
      if (dragDistance > 10) {
        createPinWithSize(pinDragStart.x, pinDragStart.y, dragDistance);
      }
    }
    pinDragStart = null;
    return;
  }

  if (isConnecting) {
    isConnecting = false;
    const endIndex = getPinAtPosition(world.x, world.y);
    if (endIndex !== null && endIndex !== connectStartIndex) {
      createConnection(connectStartIndex, endIndex);
    }
    connectStartIndex = null;
    draw();
    return;
  }

  if (isCreatingText) {
    isCreatingText = false;
    if (!didDrag) {
      // Simple click - open text modal
      openTextModal(null, world.x, world.y);
    } else {
      // Drag release - create text with size based on drag
      const dx = Math.abs(textCreateCurrent.x - textCreateStart.x);
      const dy = Math.abs(textCreateCurrent.y - textCreateStart.y);
      if (dx > 10 || dy > 10) {
        const centerX = (textCreateStart.x + textCreateCurrent.x) / 2;
        const centerY = (textCreateStart.y + textCreateCurrent.y) / 2;
        const width = Math.max(dx * 2, 100);
        const height = Math.max(dy * 2, 50);
        createTextWithSize(centerX, centerY, width, height);
      }
    }
    textCreateStart = null;
    textCreateCurrent = null;
    return;
  }

  if (isDraggingArea) {
    // Area drag finalization - create area pin
    if (areaDragStart && areaDragCurrent) {
      const dx = Math.abs(areaDragCurrent.x - areaDragStart.x);
      const dy = Math.abs(areaDragCurrent.y - areaDragStart.y);

      if (dx > 10 || dy > 10) {
        const centerX = (areaDragStart.x + areaDragCurrent.x) / 2;
        const centerY = (areaDragStart.y + areaDragCurrent.y) / 2;
        const width = Math.max(dx * 2, 50);
        const height = Math.max(dy * 2, 50);

        const newPin = {
          x: centerX,
          y: centerY,
          color: selectedColor,
          label: "",
          note: "",
          date: "",
          typeId: currentTypeId,
          width: width,
          height: height,
          title: "",
          description: "",
          fillColor: selectedColor + "40", // Semi-transparent fill
          borderColor: selectedColor,
          borderWidth: 2,
          textColor: "#FFFFFF",
          icon: "",
          iconColor: selectedColor,
          containedPins: [], // Array to track pins within this area
        };

        pins.push(newPin);
        const newIndex = pins.length - 1;
        setSelectedPin(newIndex);
        saveState();
      }
    }

    isDraggingArea = false;
    areaDragStart = null;
    areaDragCurrent = null;
    return;
  }

  // Check for double-click on pins/cards/text
  if (e.detail === 2) {
    // Double-click handling
    const clickedPinIndex = getPinAtPosition(world.x, world.y);
    if (clickedPinIndex !== null) {
      if (pins[clickedPinIndex].typeId.startsWith("area:")) {
        // Double-click on area pin - select all contained pins
        selectContainedPins(clickedPinIndex);
      } else {
        // Double-click on regular pin - open pin modal
        openPinModal(clickedPinIndex);
      }
      return;
    }

    const clickedCardIndex = getCardAtPosition(world.x, world.y);
    if (clickedCardIndex !== null) {
      openCardModal(clickedCardIndex);
      return;
    }

    const clickedTextIndex = getTextAtPosition(world.x, world.y);
    if (clickedTextIndex !== null) {
      openTextModal(clickedTextIndex);
      return;
    }
  }
});

// ============================================================================
// KEYBOARD EVENT HANDLERS
// ============================================================================

/**
 * Handle keyboard events
 */
window.addEventListener("keydown", (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === "z") {
    e.preventDefault();
    undo();
  }
  if (
    (selectedPinIndex !== null || selectedPins.length > 0) &&
    (e.key === "Delete" || e.key === "Backspace") &&
    !pinModalBackdrop.style.display
  ) {
    e.preventDefault();
    deleteSelectedPin();
  }
  // Delete selected text
  if (
    selectedTextIndex !== null &&
    (e.key === "Delete" || e.key === "Backspace")
  ) {
    e.preventDefault();
    deleteSelectedText();
  }

  // Ctrl+A: Select all pins
  if ((e.ctrlKey || e.metaKey) && e.key === "a") {
    e.preventDefault();
    selectAllPins();
    draw();
  }

  // Escape: Deselect all and close menus
  if (e.key === "Escape") {
    e.preventDefault();
    setSelectedPin(null); // Fully deselect active pin(s)
    connectStartIndex = null; // Clear connection state
    marqueeStart = null;
    marqueeEnd = null;
    // Cancel area drag if active
    isDraggingArea = false;
    areaDragStart = null;
    areaDragCurrent = null;
    closeRadialMenu();
    draw();
  }

  // Ctrl+S: Save state
  if ((e.ctrlKey || e.metaKey) && e.key === "s") {
    e.preventDefault();
    saveState();
  }

  // Number keys: Quick tool selection (1-9)
  if (!e.ctrlKey && !e.metaKey && !e.altKey && e.key >= "1" && e.key <= "9") {
    e.preventDefault();
    const toolIndex = parseInt(e.key) - 1; // Convert "1" to index 0, "2" to index 1, etc.

    // Check if we're already on this tool - if so, cycle variants
    if (toolIndex < tools.length) {
      const targetTool = tools[toolIndex].id;
      if (targetTool === currentTool && typeof cycleVariantInCurrentFamily === 'function') {
        cycleVariantInCurrentFamily();
      } else if (typeof setToolByIndex === 'function') {
        setToolByIndex(toolIndex);
      }
    }
  }

  // Shift + Number: Quick color selection (1-9)
  if (e.shiftKey && e.key >= "1" && e.key <= "9") {
    e.preventDefault();
    const colorIndex = parseInt(e.key) - 1; // Convert "1" to index 0, "2" to index 1, etc.
    const currentPalette = typeof getPalette === 'function' ? getPalette() : [];
    if (colorIndex < currentPalette.length) {
      if (typeof setSelectedColor === 'function') {
        setSelectedColor(currentPalette[colorIndex].value);
      }
      saveState();
      renderMenu();
      draw();
    }
  }

  // Legacy tool shortcuts (P, S, M)
  if (!e.ctrlKey && !e.metaKey && !e.altKey && !e.shiftKey) {
    if (e.key === "p" || e.key === "P") {
      e.preventDefault();
      setTool("pin");
    } else if (e.key === "s" || e.key === "S") {
      e.preventDefault();
      setTool("select");
    } else if (e.key === "m" || e.key === "M") {
      e.preventDefault();
      setTool("pan");
    }
  }

  // Text tool active + 4 key: Cycle through text types
  if (currentTool === "text" && e.key === "4" && !e.ctrlKey && !e.metaKey && !e.shiftKey && !e.altKey) {
    e.preventDefault();
    // Cycle through text types: plain → rectangle → comic → title → plain
    const textTypes = ["plain", "rectangle", "comic", "title"];
    const currentIndex = textTypes.indexOf(currentTextType);
    const nextIndex = (currentIndex + 1) % textTypes.length;
    const nextType = textTypes[nextIndex];

    if (typeof setCurrentTextType === 'function') {
      setCurrentTextType(nextType);
      renderMenu();
    }
  }

  // T: Toggle connection type (straight/curved)
  if (e.key === "t" || e.key === "T") {
    e.preventDefault();
    connectionType = connectionType === "curved" ? "straight" : "curved";
    saveState();
    renderMenu();
    draw();
  }

  // Ctrl/Cmd + Z: Undo
  if ((e.key === "z" || e.key === "Z") && (e.ctrlKey || e.metaKey) && !e.shiftKey) {
    e.preventDefault();
    undo();
  }
});

// ============================================================================
// CANVAS SETUP AND INITIALIZATION
// ============================================================================


// ============================================================================
// UTILITY FUNCTIONS (Canvas-specific)
// ============================================================================

/**
 * Convert screen coordinates to world coordinates
 */
function screenToWorld(sx, sy) {
  return {
    x: (sx - offsetX) / scale,
    y: (sy - offsetY) / scale,
  };
}

/**
 * Convert world coordinates to screen coordinates
 */
function worldToScreen(wx, wy) {
  return {
    x: wx * scale + offsetX,
    y: wy * scale + offsetY,
  };
}
      // ZOOM & PAN (Mouse Wheel)
      // ============================================================================
      canvas.addEventListener(
        "wheel",
        (e) => {
          e.preventDefault();

          // --- NEW LOGIC: Keyboard Panning ---
          if (e.ctrlKey || e.shiftKey || e.metaKey) {
            // Pan left/right if deltaX is available, otherwise use deltaY for vertical pan.
            // Pan amount scaled correctly with current zoom level
            const panAmount = 2 / scale;
            if (e.deltaX !== 0) {
              offsetX -= e.deltaX * panAmount * scale;
            }
            if (e.deltaY !== 0) {
              offsetY -= e.deltaY * panAmount * scale;
            }
            saveState();
            draw();
            return;
          }
          // --- END NEW LOGIC ---

          const zoomSpeed = 1.05;
          // Determine if zooming in (deltaY < 0) or out (deltaY > 0)
          const delta = e.deltaY > 0 ? 1 / zoomSpeed : zoomSpeed;

          // 1. Get the mouse position relative to the CANVAS's top-left corner
          const rect = canvas.getBoundingClientRect();
          const screenX = e.clientX - rect.left;
          const screenY = e.clientY - rect.top;

          // 2. Calculate the world coordinate UNDER the mouse *before* scaling
          const wx = (screenX - offsetX) / scale;
          const wy = (screenY - offsetY) / scale;

          // 3. Apply the scale change
          const oldScale = scale;
          scale *= delta;
          scale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, scale));

          // If scale didn't change (hit min/max), do nothing
          if (scale === oldScale) return;

          // 4. Adjust offsets (Pan) so the world coordinate (wx, wy) remains under the mouse (screenX, screenY)
          offsetX = screenX - wx * scale;
          offsetY = screenY - wy * scale;

          saveState();
          draw();
        },
        { passive: false }
      ); // Set to false because we use e.preventDefault()

  // Card drop handler
  canvas.ondrop = (e) => {
    e.preventDefault();
    const cardId = parseInt(e.dataTransfer.getData('cardId'));
    const card = cards.find(c => c.id === cardId);
    if (!card || card.used) return;

    const rect = canvas.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;

    const world = screenToWorld(sx, sy);
    const newIdx = pins.length;
    pins.push({
      x: world.x,
      y: world.y,
      color: card.color,
      label: card.title,
      note: '',
      date: card.date || '',
      cardId: card.id,
      typeId: currentTypeId // Use the current selected card type
    });

    card.used = true;
    renderCards();
    saveState(); // Save to localStorage

    setSelectedPin(newIdx);
  };
}

// ============================================================================
