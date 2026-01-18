// Event Handlers Module
// Manages all canvas, keyboard, and window event handlers

console.log("Loading eventHandlers.js...");
console.log("Available globals:", {
  NODE_TYPES: !!window.NODE_TYPES,
  AppState: !!window.AppState,
  DrawingUtils: !!window.DrawingUtils
});

class EventHandlers {
  constructor(appState, canvas) {
    console.log("EventHandlers constructor called with:", typeof appState, typeof canvas);
    console.log("Canvas element:", canvas, "id:", canvas ? canvas.id : "no id");
    if (!appState || !canvas) {
      throw new Error("EventHandlers constructor missing required parameters");
    }
    this.appState = appState;
    this.canvas = canvas;
    this.mouseScreenX = 0;
    this.mouseScreenY = 0;
    this.prevScreenX = 0;
    this.prevScreenY = 0;
    this.didDrag = false;
    this.clipboardPins = []; // For copy/paste functionality

    // Track modifier key states globally
    this.altKeyPressed = false;
    this.ctrlKeyPressed = false;
    this.shiftKeyPressed = false;
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

    // Marquee animation state
    this.marqueeAnimationOffset = 0;
    this.lastMarqueeUpdate = 0;
    this.marqueeAnimationSpeed = 2; // pixels per frame
    this.marqueeAnimationId = null; // Animation frame ID
    this.selectedPins = [];
    this.selectedTextIndex = null;
    this.totalMovement = 0;

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

    // Canvas event handlers - use consistent addEventListener for all
    // Temporarily disable pointer events to avoid conflicts with mouse events
    // this.canvas.addEventListener("pointermove", this.handleCanvasPointerMove.bind(this));
    // this.canvas.addEventListener("pointerup", this.handleCanvasPointerUp.bind(this));
    this.canvas.addEventListener("mousedown", this.handleCanvasMouseDown.bind(this));
    this.canvas.addEventListener("mousemove", this.handleCanvasMouseMove.bind(this));
    this.canvas.addEventListener("mouseup", this.handleCanvasMouseUp.bind(this));
    console.log("✅ Mouse up event listener attached to canvas");
    this.canvas.addEventListener("dblclick", this.handleCanvasDoubleClick.bind(this));
    console.log("🎯 Attaching context menu listener to canvas:", this.canvas);
    this.canvas.addEventListener("contextmenu", this.handleCanvasContextMenu.bind(this));

    // Aggressive context menu prevention for entire document
    document.addEventListener("contextmenu", (e) => {
      // Prevent context menu on canvas, canvas container, and any child elements
      const canvasContainer = document.getElementById("canvas-container");
      if (e.target === this.canvas ||
          (this.canvas && this.canvas.contains(e.target)) ||
          (canvasContainer && (e.target === canvasContainer || canvasContainer.contains(e.target)))) {
        console.log("🎯 Context menu prevented on canvas/container, target:", e.target.tagName, e.target.id);
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        return false;
      }
    }, true); // Use capture phase to catch events early

    // Drag and drop handlers for cards
    this.canvas.addEventListener("dragover", this.handleCanvasDragOver.bind(this));
    this.canvas.addEventListener("drop", this.handleCanvasDrop.bind(this));

    // Wheel event handler for zooming
    this.canvas.addEventListener("wheel", this.handleWheel.bind(this), { passive: false });

    // Keyboard event handlers
    window.addEventListener("keydown", this.handleKeyDown.bind(this));
    window.addEventListener("keyup", this.handleKeyUp.bind(this));
  }

  // Canvas pointer move handler
  handleCanvasPointerMove(e) {
    const canvasContainer = document.getElementById("canvas-container");
    const rect = canvasContainer.getBoundingClientRect();
    this.mouseScreenX = e.clientX - rect.left;
    this.mouseScreenY = e.clientY - rect.top;

    if (e.buttons === 0) return;

    // Skip rendering during layout simulation unless user is actively interacting
    if (this.isLayoutSimulating && !this.isUserInteracting) return;

    const dx = e.clientX - this.prevScreenX;
    const dy = e.clientY - this.prevScreenY;

    // Accumulate total movement since mouse down
    this.totalMovement += Math.abs(dx) + Math.abs(dy);

    // Set didDrag if total movement exceeds threshold (indicating intentional drag)
    // Use a higher threshold for pin placement to avoid treating small movements as drags
    if (this.totalMovement > 25) {
      this.didDrag = true;
    }

    if (this.isPanning) {
      this.isUserInteracting = true;
      this.appState.offsetX += dx;
      this.appState.offsetY += dy;
      this.saveAppState(this.appState);
    } else if (this.isDraggingText && this.dragTextIndex !== null) {
      this.isUserInteracting = true;
      const worldDelta = { x: dx / this.appState.scale, y: dy / this.appState.scale };
      const textEl = this.appState.textElements[this.dragTextIndex];
      if (textEl) {
        textEl.x += worldDelta.x;
        textEl.y += worldDelta.y;
      }
      console.log(`🎯 AREA DRAGGING: Reached the else if chain for area dragging`);
    } else if (this.isDraggingArea) {
      console.log(`🎯 AREA DRAGGING: About to execute area dragging code - this.isDraggingArea = ${this.isDraggingArea}`);
      this.isUserInteracting = true;
      // Convert mouse coordinates to canvas-relative
      const canvas = document.getElementById("board");
      const canvasContainer = document.getElementById("canvas-container");
      const rect = canvasContainer.getBoundingClientRect();
      const canvasX = e.clientX - rect.left;
      const canvasY = e.clientY - rect.top;
      const newPos = this.screenToWorld(canvasX, canvasY);
      console.log(`🎯 screenToWorld(${canvasX}, ${canvasY}) returned: (${newPos.x}, ${newPos.y})`);
      console.log(`🎯 areaDragCurrent before: (${this.areaDragCurrent.x}, ${this.areaDragCurrent.y})`);
      this.areaDragCurrent = { x: newPos.x, y: newPos.y }; // Explicit assignment
      console.log(`🎯 areaDragCurrent after: (${this.areaDragCurrent.x}, ${this.areaDragCurrent.y})`);

      // Update marquee animation and draw animated marquee
      this.updateMarqueeAnimation();
      this.drawAnimatedMarquee();
    } else if (this.isCreatingText) {
      this.isUserInteracting = true;
      // Convert mouse coordinates to canvas-relative
      const canvas = document.getElementById("board");
      const canvasContainer = document.getElementById("canvas-container");
      const rect = canvasContainer.getBoundingClientRect();
      const canvasX = e.clientX - rect.left;
      const canvasY = e.clientY - rect.top;
      this.textCreateCurrent = this.screenToWorld(canvasX, canvasY);
    } else if (this.isMarqueeSelecting) {
      this.isUserInteracting = true;
      // Convert mouse coordinates to canvas-relative
      const canvas = document.getElementById("board");
      const canvasContainer = document.getElementById("canvas-container");
      const rect = canvasContainer.getBoundingClientRect();
      const canvasX = e.clientX - rect.left;
      const canvasY = e.clientY - rect.top;
      this.marqueeEnd = this.screenToWorld(canvasX, canvasY);
    }

    this.prevScreenX = e.clientX;
    this.prevScreenY = e.clientY;
    this.draw();
  }

  // Canvas pointer up handler
  handleCanvasPointerUp(e) {
    // Handle pointer up events
    this.isPanning = false;
    this.isUserInteracting = false;
  }

  // Canvas mouse down handler
  handleCanvasMouseDown(e) {
    // Don't prevent default for left-click to allow double-click detection
    // Only prevent default for right-click to avoid context menu
    if (e.button === 2) {
      e.preventDefault();
    }
    // Convert mouse coordinates to canvas-relative
    const canvasContainer = document.getElementById("canvas-container");
    const containerRect = canvasContainer.getBoundingClientRect();

    // Simple approach: use container coordinates directly
    const canvasX = e.clientX - containerRect.left;
    const canvasY = e.clientY - containerRect.top;

    const mouseWorld = this.screenToWorld(canvasX, canvasY);
    const clickedPinIndex = this.findPinAt(mouseWorld.x, mouseWorld.y);
    console.log(`   App scale: ${this.appState.scale}, offset: (${this.appState.offsetX}, ${this.appState.offsetY})`);

    // Initialize mouse position tracking for movement detection
    this.prevScreenX = e.clientX;
    this.prevScreenY = e.clientY;

    // Handle different click scenarios based on current tool
    const currentTool = this.appState.currentTool || "pin";

    // Handle right-click separately
    if (e.button === 2) {
      this.handleCanvasRightClick(e, mouseWorld, clickedPinIndex);
      return;
    }

    // Handle left-click and middle-click
    if (e.button === 0) { // Left click

      if (currentTool === "pan") {
        // Pan tool - always pan on click and drag
        this.isPanning = true;
        this.prevScreenX = e.clientX;
        this.prevScreenY = e.clientY;
        console.log(`👆 Left-click: Pan mode activated`);
      } else if (currentTool === "select") {
        // Select tool - marquee selection (rectangular)
        this.isMarqueeSelecting = true;
        this.marqueeStart = mouseWorld;
        this.marqueeEnd = mouseWorld;
        console.log(`👆 Left-click: Marquee selection started`);
      } else {
        // Handle interactions for all other tools
        if (clickedPinIndex !== null) {
          // Clicked on existing pin - select it and prepare for drag (works in any tool)
          this.setSelectedPin(clickedPinIndex);
          this.isDraggingPin = true;
          this.dragPinIndex = clickedPinIndex;
          this.selectedPins = [clickedPinIndex];
          // Set as connection source for next pin placement (sequential mode)
          this.appState.connectStartIndex = clickedPinIndex;
          this.appState.connectionMode = 'sequential';
          this.startMarqueeAnimation(); // Start continuous animation for connection marquee
          console.log(`👆 Left-click: Pin ${clickedPinIndex} selected for dragging`);
        } else {
          // Clicked on empty space - tool-specific behavior
          if (currentTool === "pin") {
            // Pin tool - will handle in mouse up for pin creation
          } else if (currentTool === "text") {
            // Text tool - will handle in mouse up
            console.log(`👆 Left-click: Text tool on empty space`);
      } else if (currentTool === "area") {
        // Area tool - start area creation drag
        this.isDraggingArea = true;
        this.areaDragStart = { x: mouseWorld.x, y: mouseWorld.y };
        this.areaDragCurrent = { x: mouseWorld.x, y: mouseWorld.y };
        this.startMarqueeAnimation(); // Start continuous animation
        console.log(`👆 Left-click: Area creation started at (${mouseWorld.x}, ${mouseWorld.y})`);
      }
        }
      }
    } else if (e.button === 1) { // Middle click
      // Middle click - pan
      this.isPanning = true;
      this.prevScreenX = e.clientX;
      this.prevScreenY = e.clientY;
      console.log(`👆 Middle-click: Pan mode activated`);
    }
  }

  // Canvas right-click handler (separated for clarity)
  handleCanvasRightClick(e, mouseWorld, clickedPinIndex) {
    e.preventDefault(); // Prevent context menu from showing

    if (clickedPinIndex !== null) {
      // Right-click on pin - BOTH open radial menu AND activate marquee for connections
      console.log(`🎯 RIGHT-CLICK: Opening radial menu AND activating marquee for pin ${clickedPinIndex}`);

      // 1. Set pin as parent for connections (activate marquee)
      this.setSelectedPin(clickedPinIndex);
      this.appState.connectStartIndex = clickedPinIndex;
      this.appState.connectionMode = 'parent'; // Locked parent effect

      // Start continuous marquee animation
      this.startMarqueeAnimation();

      // 2. Open radial menu
      if (window.openRadialMenu) {
        window.openRadialMenu(clickedPinIndex, e.clientX, e.clientY);
      }

      console.log(`🔗 Pin ${clickedPinIndex} set as parent - marquee activated + radial menu open`);
      return;
    }

    // Check if connection marquee is active (no pin clicked, but marquee showing)
    const hasActiveConnection = this.appState.connectStartIndex !== null;

    if (hasActiveConnection) {
      // Right-click on empty canvas when marquee is active - cancel connection mode
      console.log(`🎯 Right-click: Canceling active connection marquee`);
      this.appState.connectStartIndex = null;
      this.appState.connectMousePos = null;
      this.appState.connectionMode = null;
      this.stopMarqueeAnimation(); // Stop marquee animation
      this.draw();
      return;
    }

    // Right-click on empty canvas - create pin and set as hub
    console.log(`🎯 Right-click: Creating pin on empty canvas and setting as HUB`);

    // Look up the node type to get variant and other properties
    const nodeType = window.NODE_TYPES?.find(nt => nt.id === this.appState.currentTypeId);

    const newPin = {
      x: mouseWorld.x,
      y: mouseWorld.y,
      color: this.appState.selectedColor,
      label: "",
      note: "",
      date: "",
      typeId: this.appState.currentTypeId,
      variant: nodeType?.variant || "default", // Set variant from NODE_TYPES
      pinScale: 1
    };

    // Add pin-specific properties based on type
    if (this.appState.currentTypeId.startsWith("area:")) {
      newPin.width = 100;
      newPin.height = 100;
      newPin.fillColor = this.appState.selectedColor + "40";
      newPin.borderColor = this.appState.selectedColor;
      newPin.borderWidth = 2;
      newPin.textColor = window._currentThemeTextColor || "#ffffff";
      newPin.icon = "▤";
      newPin.iconColor = this.appState.selectedColor;
      newPin.containedPins = [];
    }

    this.appState.pins.push(newPin);
    const newIndex = this.appState.pins.length - 1;

    // Set this pin as hub for subsequent connections
    this.setSelectedPin(newIndex);
    this.appState.connectStartIndex = newIndex;
    this.appState.connectionMode = 'parent'; // Set parent/hub mode

    console.log(`   Pin created at: (${newPin.x}, ${newPin.y}) and set as HUB`);
    this.draw();
  }

  // Canvas mouse move handler
  handleCanvasMouseMove(e) {
    console.log(`🎯 MOUSE MOVE: Called with isDraggingArea=${this.isDraggingArea}, buttons=${e.buttons}`);
    // Convert mouse coordinates to canvas-relative
    const canvasContainer = document.getElementById("canvas-container");
    const containerRect = canvasContainer.getBoundingClientRect();

    // Simple approach: use container coordinates directly
    const canvasX = e.clientX - containerRect.left;
    const canvasY = e.clientY - containerRect.top;

    // Accumulate movement for drag detection (moved from pointer handler)
    if (e.buttons !== 0) {
      const dx = e.clientX - this.prevScreenX;
      const dy = e.clientY - this.prevScreenY;
      this.totalMovement += Math.abs(dx) + Math.abs(dy);

      // Set didDrag if total movement exceeds threshold
      if (this.totalMovement > 25) {
        this.didDrag = true;
      }

      this.prevScreenX = e.clientX;
      this.prevScreenY = e.clientY;
    }

    console.log(`🎯 Mouse move branches: marquee=${this.isMarqueeSelecting}, connection=${this.appState.connectStartIndex !== null}, pinDrag=${this.isDraggingPin && this.dragPinIndex !== null}, textDrag=${this.isDraggingText && this.dragTextIndex !== null}, areaDrag=${this.isDraggingArea}`);

    if (this.isMarqueeSelecting) {
      console.log(`🎯 Executing: MARQUEE branch`);
      this.marqueeEnd = this.screenToWorld(canvasX, canvasY);
      this.draw();
    }

    // Track mouse position for connection preview line
    if (this.appState.connectStartIndex !== null) {
      console.log(`🎯 Executing: CONNECTION branch`);
      this.appState.connectMousePos = this.screenToWorld(canvasX, canvasY);
      this.draw(); // Just redraw to show marquee in main draw function
    }

    // Handle pin dragging (moved from pointer handler)
    console.log(`🎯 PIN DRAGGING: About to check pin dragging condition`);
    if (this.isDraggingPin && this.dragPinIndex !== null) {
      console.log(`🎯 Executing: PIN DRAGGING branch`);
      // Convert current mouse position to world coordinates
      const canvas = document.getElementById("board");
      const canvasContainer = document.getElementById("canvas-container");
      const rect = canvasContainer.getBoundingClientRect();
      const canvasX = e.clientX - rect.left;
      const canvasY = e.clientY - rect.top;
      const mouseWorld = this.screenToWorld(canvasX, canvasY);

      // Set pin position to mouse position (1:1 mapping)
      if (this.selectedPins.length > 0 && this.selectedPins.includes(this.dragPinIndex)) {
        // Drag all selected pins, maintaining their relative positions
        const basePin = this.appState.pins[this.dragPinIndex];
        if (basePin) {
          const offsetX = mouseWorld.x - basePin.x;
          const offsetY = mouseWorld.y - basePin.y;

          this.selectedPins.forEach((idx) => {
            if (this.appState.pins[idx]) {
              this.appState.pins[idx].x += offsetX;
              this.appState.pins[idx].y += offsetY;
            }
          });
        }
      } else if (this.appState.pins[this.dragPinIndex]) {
        // Drag single pin to mouse position
        this.appState.pins[this.dragPinIndex].x = mouseWorld.x;
        this.appState.pins[this.dragPinIndex].y = mouseWorld.y;
      }

      // Update area containment after moving pins
      this.updateAreaContainment();
      this.draw();
    } else if (this.isDraggingText && this.dragTextIndex !== null) {
      this.isUserInteracting = true;
      const worldDelta = { x: dx / this.appState.scale, y: dy / this.appState.scale };
      const textEl = this.appState.textElements[this.dragTextIndex];
      if (textEl) {
        textEl.x += worldDelta.x;
        textEl.y += worldDelta.y;
      }
    } else if (this.isDraggingArea) {
      console.log(`🎯 AREA DRAGGING: About to execute area dragging code - this.isDraggingArea = ${this.isDraggingArea}`);
      this.isUserInteracting = true;
      // Convert mouse coordinates to canvas-relative
      const canvas = document.getElementById("board");
      const canvasContainer = document.getElementById("canvas-container");
      const rect = canvasContainer.getBoundingClientRect();
      const canvasX = e.clientX - rect.left;
      const canvasY = e.clientY - rect.top;
      const newPos = this.screenToWorld(canvasX, canvasY);
      console.log(`🎯 screenToWorld(${canvasX}, ${canvasY}) returned: (${newPos.x}, ${newPos.y})`);
      console.log(`🎯 areaDragCurrent before: (${this.areaDragCurrent.x}, ${this.areaDragCurrent.y})`);
      this.areaDragCurrent = { x: newPos.x, y: newPos.y }; // Explicit assignment
      console.log(`🎯 areaDragCurrent after: (${this.areaDragCurrent.x}, ${this.areaDragCurrent.y})`);

      // Update marquee animation and draw animated marquee
      this.updateMarqueeAnimation();
      this.drawAnimatedMarquee();
    }

  // Canvas mouse up handler
}
