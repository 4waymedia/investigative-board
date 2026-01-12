// Event Handlers Module
// Manages all canvas, keyboard, and window event handlers

class EventHandlers {
  constructor(appState, canvas) {
    this.appState = appState;
    this.canvas = canvas;
    this.mouseScreenX = 0;
    this.mouseScreenY = 0;
    this.prevScreenX = 0;
    this.prevScreenY = 0;
    this.didDrag = false;
    this.isPanning = false;
    this.isDraggingPin = false;
    this.dragPinIndex = null;
    this.isDraggingText = false;
    this.dragTextIndex = null;
    this.isDraggingArea = false;
    this.areaDragStart = null;
    this.areaDragCurrent = null;
    this.isCreatingText = false;
    this.textCreateStart = null;
    this.textCreateCurrent = null;
    this.isMarqueeSelecting = false;
    this.marqueeStart = null;
    this.marqueeEnd = null;
    this.isLayoutSimulating = false;
    this.isUserInteracting = false;
    this.selectedPins = [];
    this.selectedTextIndex = null;

    // Get references to global functions that will be passed in
    this.draw = null;
    this.saveAppState = null;
    this.screenToWorld = null;
    this.findPinAt = null;
    this.setSelectedPin = null;
    this.updateAreaContainment = null;

    // Bind methods to preserve 'this' context
    this.handleCanvasPointerMove = this.handleCanvasPointerMove.bind(this);
    this.handleCanvasPointerUp = this.handleCanvasPointerUp.bind(this);
    this.handleCanvasMouseDown = this.handleCanvasMouseDown.bind(this);
    this.handleCanvasMouseMove = this.handleCanvasMouseMove.bind(this);
    this.handleCanvasMouseUp = this.handleCanvasMouseUp.bind(this);
    this.handleCanvasContextMenu = this.handleCanvasContextMenu.bind(this);
    this.handleKeyDown = this.handleKeyDown.bind(this);
  }

  // Initialize all event handlers
  initialize(dependencies) {
    this.draw = dependencies.draw;
    this.saveAppState = dependencies.saveAppState;
    this.screenToWorld = dependencies.screenToWorld;
    this.findPinAt = dependencies.findPinAt;
    this.setSelectedPin = dependencies.setSelectedPin;
    this.updateAreaContainment = dependencies.updateAreaContainment;

    // Canvas event handlers
    this.canvas.addEventListener("pointermove", this.handleCanvasPointerMove);
    this.canvas.addEventListener("pointerup", this.handleCanvasPointerUp);
    this.canvas.onmousedown = this.handleCanvasMouseDown;
    this.canvas.onmousemove = this.handleCanvasMouseMove;
    this.canvas.onmouseup = this.handleCanvasMouseUp;
    this.canvas.oncontextmenu = this.handleCanvasContextMenu;

    // Keyboard event handlers
    window.addEventListener("keydown", this.handleKeyDown);
  }

  // Canvas pointer move handler
  handleCanvasPointerMove(e) {
    const rect = this.canvas.getBoundingClientRect();
    this.mouseScreenX = e.clientX - rect.left;
    this.mouseScreenY = e.clientY - rect.top;

    if (e.buttons === 0) return;

    // Skip rendering during layout simulation unless user is actively interacting
    if (this.isLayoutSimulating && !this.isUserInteracting) return;

    const dx = e.clientX - this.prevScreenX;
    const dy = e.clientY - this.prevScreenY;

    if (Math.abs(dx) > 2 || Math.abs(dy) > 2) this.didDrag = true;

    if (this.isPanning) {
      this.isUserInteracting = true;
      this.appState.offsetX += dx;
      this.appState.offsetY += dy;
      this.saveAppState(this.appState);
    } else if (this.isDraggingPin && this.dragPinIndex !== null) {
      this.isUserInteracting = true;
      const worldDelta = { x: dx / this.appState.scale, y: dy / this.appState.scale };

      // Check if the dragged pin is part of a multi-selection
      if (this.selectedPins.length > 0 && this.selectedPins.includes(this.dragPinIndex)) {
        // Drag all selected pins
        this.selectedPins.forEach((idx) => {
          if (this.appState.pins[idx]) {
            this.appState.pins[idx].x += worldDelta.x;
            this.appState.pins[idx].y += worldDelta.y;
          }
        });
      } else if (this.appState.pins[this.dragPinIndex]) {
        // Drag single pin
        this.appState.pins[this.dragPinIndex].x += worldDelta.x;
        this.appState.pins[this.dragPinIndex].y += worldDelta.y;
      }

      // Update area containment after moving pins
      this.updateAreaContainment();
    } else if (this.isDraggingText && this.dragTextIndex !== null) {
      this.isUserInteracting = true;
      const worldDelta = { x: dx / this.appState.scale, y: dy / this.appState.scale };
      const textEl = this.appState.textElements[this.dragTextIndex];
      if (textEl) {
        textEl.x += worldDelta.x;
        textEl.y += worldDelta.y;
      }
    } else if (this.isDraggingArea) {
      this.isUserInteracting = true;
      const rect = this.canvas.getBoundingClientRect();
      const sx = e.clientX - rect.left;
      const sy = e.clientY - rect.top;
      this.areaDragCurrent = this.screenToWorld(sx, sy);
    } else if (this.isCreatingText) {
      this.isUserInteracting = true;
      const rect = this.canvas.getBoundingClientRect();
      const sx = e.clientX - rect.left;
      const sy = e.clientY - rect.top;
      this.textCreateCurrent = this.screenToWorld(sx, sy);
    } else if (this.isMarqueeSelecting) {
      this.isUserInteracting = true;
      const rect = this.canvas.getBoundingClientRect();
      const sx = e.clientX - rect.left;
      const sy = e.clientY - rect.top;
      this.marqueeEnd = this.screenToWorld(sx, sy);
    }

    this.prevScreenX = e.clientX;
    this.prevScreenY = e.clientY;
    this.draw();
  }

  // Canvas pointer up handler
  handleCanvasPointerUp(e) {
    // This will be implemented with the full logic from index.html
    console.log("Canvas pointer up - to be implemented");
  }

  // Canvas mouse down handler
  handleCanvasMouseDown(e) {
    // This will be implemented with the full logic from index.html
    console.log("Canvas mouse down - to be implemented");
  }

  // Canvas mouse move handler
  handleCanvasMouseMove(e) {
    // This will be implemented with the full logic from index.html
    console.log("Canvas mouse move - to be implemented");
  }

  // Canvas mouse up handler
  handleCanvasMouseUp(e) {
    // This will be implemented with the full logic from index.html
    console.log("Canvas mouse up - to be implemented");
  }

  // Canvas context menu handler
  handleCanvasContextMenu(e) {
    // This will be implemented with the full logic from index.html
    console.log("Canvas context menu - to be implemented");
  }

  // Keyboard handler
  handleKeyDown(e) {
    // This will be implemented with the full logic from index.html
    console.log("Key down - to be implemented");
  }

  // Cleanup event handlers
  destroy() {
    this.canvas.removeEventListener("pointermove", this.handleCanvasPointerMove);
    this.canvas.removeEventListener("pointerup", this.handleCanvasPointerUp);
    this.canvas.onmousedown = null;
    this.canvas.onmousemove = null;
    this.canvas.onmouseup = null;
    this.canvas.oncontextmenu = null;
    window.removeEventListener("keydown", this.handleKeyDown);
  }
}

// Export for global access
window.EventHandlers = EventHandlers;
