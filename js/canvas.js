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

    const world = window.DrawingUtils.screenToWorld(sx, sy, { scale, offsetX, offsetY });

    // Add pin through AppState instead of directly modifying global array
    let newIdx;
    if (window.app && window.app.appState) {
      newIdx = window.app.appState.addPin(world.x, world.y, {
        color: card.color,
        label: card.title,
        note: '',
        date: card.date || '',
        cardId: card.id,
        typeId: currentTypeId // Use the current selected card type
      });
      // Sync global variables after AppState update
      if (window.app.syncGlobalVariables) {
        window.app.syncGlobalVariables();
      }
    } else {
      // Fallback to old method if AppState not available
      newIdx = pins.length;
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
    }

    card.used = true;
    renderCards();
    if (window.app && window.app.saveState) {
      window.app.saveState(); // Save to localStorage via AppState
    } else {
      saveState(); // Fallback to global saveState
    }

    setSelectedPin(newIdx);
  };

  // Make sure canvas doesn't interfere with drop events
  canvas.ondragover = (e) => {
    // Let the event bubble up to the container
    return true;
  };


  // Marquee selection functions
  function finalizeMarqueeSelection() {
    if (marqueeStart && marqueeEnd) {
      selectedPins = calculateMarqueeSelection(marqueeStart, marqueeEnd);
      selectedPinIndex = selectedPins.length > 0 ? selectedPins[0] : null;
      if (window.app && window.app.updatePinInfo) {
        window.app.updatePinInfo();
      }
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


// ============================================================================
// KEYBOARD EVENT HANDLERS
// ============================================================================

// All keyboard shortcuts moved to eventHandlers.js to avoid conflicts

// ============================================================================
// CANVAS SETUP AND INITIALIZATION
// ============================================================================


// ============================================================================
// COORDINATE TRANSFORMATION UTILITIES
// ============================================================================

// Coordinate transformation functions are now centralized in utils.js
// Use window.DrawingUtils.screenToWorld() and window.DrawingUtils.worldToScreen()
// with the current canvas state: { scale, offsetX, offsetY }
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
            const panAmount = PAN_SPEED / scale;
            if (e.deltaX !== 0) {
              offsetX -= e.deltaX * panAmount * scale;
            }
            if (e.deltaY !== 0) {
              offsetY -= e.deltaY * panAmount * scale;
            }
            if (window.app && window.app.saveState) {
              window.app.saveState(); // Save to localStorage via AppState
            } else {
              saveState(); // Fallback to global saveState
            }
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

          // 3. Calculate new scale and check bounds BEFORE applying offset changes
          const newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, scale * delta));

          // If scale would not change (hit min/max), do nothing
          if (newScale === scale) return;

          // 4. Apply the scale change
          scale = newScale;

          // 5. Adjust offsets (Pan) so the world coordinate (wx, wy) remains under the mouse (screenX, screenY)
          offsetX = screenX - wx * scale;
          offsetY = screenY - wy * scale;

          if (window.app && window.app.saveState) {
            window.app.saveState(); // Save to localStorage via AppState
          } else {
            saveState(); // Fallback to global saveState
          }
          draw();
        },
        { passive: false }
      ); // Set to false because we use e.preventDefault()

  // Card drop handler
  canvas.addEventListener('drop', (e) => {
    e.preventDefault();
    const cardId = parseInt(e.dataTransfer.getData('cardId'));
    const card = cards.find(c => c.id === cardId);
    if (!card || card.used) return;

    const rect = canvas.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;

    const world = window.DrawingUtils.screenToWorld(sx, sy, { scale, offsetX, offsetY });

    // Add pin through AppState instead of directly modifying global array
    let newIdx;
    if (window.app && window.app.appState) {
      newIdx = window.app.appState.addPin(world.x, world.y, {
        color: card.color,
        label: card.title,
        note: '',
        date: card.date || '',
        cardId: card.id,
        typeId: currentTypeId // Use the current selected card type
      });
      // Sync global variables after AppState update
      if (window.app.syncGlobalVariables) {
        window.app.syncGlobalVariables();
      }
    } else {
      // Fallback to old method if AppState not available
      newIdx = pins.length;
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
    }

    card.used = true;
    renderCards();

    // Handle ActivePin updates based on connection mode
    if (window.appState && window.appState.connectionMode !== 'parent') {
      // Not in Radial/Parent Mode: Set new pin as active (default behavior)
      // This includes sequential mode and default (null) mode
      setSelectedPin(newIdx);
    }
    // Radial/Parent Mode: Keep ActivePin locked (don't change it)
    if (window.app && window.app.saveState) {
      window.app.saveState(); // Save to localStorage via AppState
    } else {
      saveState(); // Fallback to global saveState
    }
    draw(); // Ensure the canvas refreshes immediately
  });
}

// ============================================================================
