/**
 * Drag Manager - Centralized drag handling for pins, text, and areas
 * Provides clean separation of drag logic from event handling
 */

class DragManager {
  constructor(appState) {
    this.appState = appState;
    this.isDragging = false;
    this.dragType = null; // 'pin', 'text', 'area'
    this.dragTarget = null; // index of item being dragged
    this.dragOffset = { x: 0, y: 0 };
    this.initialPositions = []; // for multi-pin drags
    this.relativeOffsets = []; // relative positions for multi-pin drags
    this.hasMoved = false; // track if drag actually moved anything
    this.screenToWorld = null;
    this.updateAreaContainment = null;
    this.draw = null;
    this.bounds = null; // optional {minX, maxX, minY, maxY} for clamping
  }

  /**
   * Initialize drag manager with required dependencies
   */
  initialize(dependencies) {
    this.screenToWorld = dependencies.screenToWorld;
    this.updateAreaContainment = dependencies.updateAreaContainment;
    this.draw = dependencies.draw;
  }

  /**
   * Start dragging a pin
   */
  startPinDrag(pinIndex, mouseWorldPos, selectedPins = []) {
    this.isDragging = true;
    this.dragType = 'pin';
    this.dragTarget = pinIndex;
    this.hasMoved = false;

    const pin = this.appState.pins[pinIndex];
    if (!pin) return false;

    // Calculate offset between mouse and pin center for smooth dragging
    this.dragOffset = {
      x: mouseWorldPos.x - pin.x,
      y: mouseWorldPos.y - pin.y
    };

    // Store initial positions and relative offsets for all selected pins
    this.initialPositions = [];
    this.relativeOffsets = [];

    if (selectedPins.length > 1 && selectedPins.includes(pinIndex)) {
      // Multi-pin drag: store relative positions to primary pin
      selectedPins.forEach(idx => {
        if (this.appState.pins[idx]) {
          this.initialPositions.push({
            index: idx,
            x: this.appState.pins[idx].x,
            y: this.appState.pins[idx].y
          });
          this.relativeOffsets.push({
            index: idx,
            offsetX: this.appState.pins[idx].x - pin.x,
            offsetY: this.appState.pins[idx].y - pin.y
          });
        }
      });
    } else {
      // Single pin drag
      this.initialPositions = [{
        index: pinIndex,
        x: pin.x,
        y: pin.y
      }];
      this.relativeOffsets = [{
        index: pinIndex,
        offsetX: 0,
        offsetY: 0
      }];
    }

    return true;
  }

  /**
   * Start dragging text
   */
  startTextDrag(textIndex, mouseWorldPos) {
    console.log(`🎯 Starting text drag: text ${textIndex}`);

    this.isDragging = true;
    this.dragType = 'text';
    this.dragTarget = textIndex;

    const textElement = this.appState.textElements[textIndex];
    if (!textElement) return false;

    this.dragOffset = {
      x: mouseWorldPos.x - textElement.x,
      y: mouseWorldPos.y - textElement.y
    };

    return true;
  }

  /**
   * Start dragging an area
   */
  startAreaDrag(areaIndex, mouseWorldPos) {
    console.log(`🎯 Starting area drag: area ${areaIndex}`);

    this.isDragging = true;
    this.dragType = 'area';
    this.dragTarget = areaIndex;
    this.hasMoved = false;

    // Assume areas are stored in appState.areas similar to pins/textElements
    const area = this.appState.areas && this.appState.areas[areaIndex];
    if (!area) {
      console.warn(`Area ${areaIndex} not found in appState.areas`);
      return false;
    }

    // Calculate offset between mouse and area center for smooth dragging
    this.dragOffset = {
      x: mouseWorldPos.x - area.x,
      y: mouseWorldPos.y - area.y
    };

    return true;
  }

  /**
   * Update drag position based on mouse movement
   */
  updateDrag(mouseWorldPos) {
    if (!this.isDragging) return;

    switch (this.dragType) {
      case 'pin':
        this.updatePinDrag(mouseWorldPos);
        break;
      case 'text':
        this.updateTextDrag(mouseWorldPos);
        break;
      case 'area':
        this.updateAreaDrag(mouseWorldPos);
        break;
    }

    // Update area containment relationships
    if (this.updateAreaContainment) {
      this.updateAreaContainment();
    }

    // Trigger redraw
    if (this.draw) {
      this.draw();
    }
  }

  /**
   * Check if a pin is part of the active timeline
   */
  isTimelinePin(pin) {
    if (!this.appState.timelineActive || !this.appState.timelinePins) return false;
    return this.appState.timelinePins.some(tp => tp.pin === pin || tp.pin.id === pin.id);
  }

  /**
   * Update pin drag positions
   */
  updatePinDrag(mouseWorld) {
    // Calculate new position for primary pin
    let newX = mouseWorld.x - this.dragOffset.x;
    let newY = mouseWorld.y - this.dragOffset.y;

    // Apply boundary clamping if bounds are set
    if (this.bounds) {
      newX = Math.max(this.bounds.minX, Math.min(this.bounds.maxX, newX));
      newY = Math.max(this.bounds.minY, Math.min(this.bounds.maxY, newY));
    }

    // Check if position actually changed
    const primaryPin = this.appState.pins[this.dragTarget];
    if (!primaryPin) return;

    // Check if this is a timeline pin - constrain to horizontal movement only
    const isOnTimeline = this.isTimelinePin(primaryPin);
    if (isOnTimeline) {
      // Constrain X to timeline bounds
      newX = Math.max(this.appState.timelineLeft, Math.min(this.appState.timelineRight, newX));
      // Keep Y fixed (don't change vertical position - maintains connection to timeline)
      newY = primaryPin.y;
    }

    const moved = (newX !== primaryPin.x || newY !== primaryPin.y);
    if (moved) {
      this.hasMoved = true;
    }

    // Update all selected pins
    if (this.relativeOffsets.length > 1) {
      // Multi-pin drag: maintain relative positions
      this.relativeOffsets.forEach(({ index, offsetX, offsetY }) => {
        const pin = this.appState.pins[index];
        if (pin) {
          let pinNewX = newX + offsetX;
          let pinNewY = newY + offsetY;

          // Check if this secondary pin is also a timeline pin
          if (this.isTimelinePin(pin)) {
            pinNewX = Math.max(this.appState.timelineLeft, Math.min(this.appState.timelineRight, pinNewX));
            pinNewY = pin.y; // Keep Y fixed for timeline pins
          }

          // Apply bounds to secondary pins too
          if (this.bounds) {
            pinNewX = Math.max(this.bounds.minX, Math.min(this.bounds.maxX, pinNewX));
            pinNewY = Math.max(this.bounds.minY, Math.min(this.bounds.maxY, pinNewY));
          }

          pin.x = pinNewX;
          pin.y = pinNewY;
        }
      });
    } else {
      // Single pin drag
      primaryPin.x = newX;
      primaryPin.y = newY;
    }
  }

  /**
   * Update text drag position
   */
  updateTextDrag(mouseWorld) {
    const textElement = this.appState.textElements[this.dragTarget];
    if (textElement) {
      textElement.x = mouseWorld.x - this.dragOffset.x;
      textElement.y = mouseWorld.y - this.dragOffset.y;
    }
  }

  /**
   * Update area drag position
   */
  updateAreaDrag(mouseWorld) {
    const area = this.appState.areas && this.appState.areas[this.dragTarget];
    if (!area) return;

    // Calculate new position
    let newX = mouseWorld.x - this.dragOffset.x;
    let newY = mouseWorld.y - this.dragOffset.y;

    // Apply boundary clamping if bounds are set
    if (this.bounds) {
      newX = Math.max(this.bounds.minX, Math.min(this.bounds.maxX, newX));
      newY = Math.max(this.bounds.minY, Math.min(this.bounds.maxY, newY));
    }

    // Check if position actually changed
    const moved = (newX !== area.x || newY !== area.y);
    if (moved) {
      this.hasMoved = true;
    }

    // Update area position
    area.x = newX;
    area.y = newY;
  }

  /**
   * End current drag operation
   */
  endDrag() {
    if (!this.isDragging) return;

    console.log(`🎯 Ending ${this.dragType} drag`);

    // Save state for undo only if something actually moved
    if (this.hasMoved && this.appState && this.appState.saveHistory) {
      this.appState.saveHistory();
    }

    // Reset drag state
    this.isDragging = false;
    this.dragType = null;
    this.dragTarget = null;
    this.dragOffset = { x: 0, y: 0 };
    this.initialPositions = [];
    this.relativeOffsets = [];
    this.hasMoved = false;
  }

  /**
   * Check if currently dragging
   */
  isCurrentlyDragging() {
    return this.isDragging;
  }

  /**
   * Check if dragging a specific type
   */
  isDraggingType(type) {
    return this.isDragging && this.dragType === type;
  }

  /**
   * Set boundary constraints for dragging
   */
  setBounds(bounds) {
    this.bounds = bounds; // {minX, maxX, minY, maxY}
  }

  /**
   * Clear boundary constraints
   */
  clearBounds() {
    this.bounds = null;
  }

  /**
   * Get current drag info for debugging
   */
  getDragInfo() {
    return {
      isDragging: this.isDragging,
      dragType: this.dragType,
      dragTarget: this.dragTarget,
      offset: this.dragOffset,
      hasMoved: this.hasMoved,
      bounds: this.bounds
    };
  }
}

// Export for global use
window.DragManager = DragManager;
