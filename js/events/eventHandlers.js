// Event Handlers Module
// Manages all canvas, keyboard, and window event handlers

console.log("Loading eventHandlers.js...");
console.log("Available globals:", {
  NODE_TYPES: !!window.NODE_TYPES,
  AppState: !!window.AppState,
  DrawingUtils: !!window.DrawingUtils
});

// Tool State Pattern - Each tool implements onMouseDown, onMouseMove, onMouseUp
class BaseTool {
  constructor(eventHandlers) {
    this.eventHandlers = eventHandlers;
    this.appState = eventHandlers.appState;
    this.app = eventHandlers.app;
  }

  onMouseDown(e, mousePos, clickedPinIndex) {
    // Default implementation - do nothing
  }

  onMouseMove(e, mousePos) {
    // Default implementation - do nothing
  }

  onMouseUp(e, mousePos) {
    // Default implementation - do nothing
  }
}

class PanTool extends BaseTool {
  onMouseDown(e, mousePos, clickedPinIndex) {
    this.eventHandlers.isPanning = true;
    this.eventHandlers.prevScreenX = e.clientX;
    this.eventHandlers.prevScreenY = e.clientY;
    console.log(`👆 Pan mode activated at (${e.clientX}, ${e.clientY})`);
  }
}

class SelectTool extends BaseTool {
  onMouseDown(e, mousePos, clickedPinIndex) {
    this.eventHandlers.isMarqueeSelecting = true;
    this.eventHandlers.marqueeStart = mousePos.world;
    this.eventHandlers.marqueeEnd = mousePos.world;
    console.log(`👆 Left-click: Marquee selection started`);
  }
}

class PinTool extends BaseTool {
  onMouseDown(e, mousePos, clickedPinIndex) {
    // Pin tool logic is handled in mouseUp for pin creation
    // MouseDown only handles pin selection and dragging
    if (clickedPinIndex !== null) {
      this.handlePinInteraction(mousePos, clickedPinIndex);
    }
  }

  handlePinInteraction(mousePos, clickedPinIndex) {
    // Check if we should connect to an existing selected pin
    // Only auto-connect in 'sequential' mode, not in 'parent' mode
    if (this.appState.selectedPinIndex !== null && this.appState.selectedPinIndex !== clickedPinIndex && this.appState.connectionMode === 'sequential') {
      // Check if connection already exists between these pins (bidirectional)
      const existingConnection = this.appState.connections.find(conn =>
        (conn.startIndex === this.appState.selectedPinIndex && conn.endIndex === clickedPinIndex) ||
        (conn.startIndex === clickedPinIndex && conn.endIndex === this.appState.selectedPinIndex)
      );

      if (existingConnection) {
        console.log(`⚠️ Connection already exists between pin ${this.appState.selectedPinIndex} and pin ${clickedPinIndex}`);
        // Reset connection state without creating duplicate
        this.appState.connectStartIndex = null;
        this.appState.connectMousePos = null;
        this.eventHandlers.stopMarqueeAnimation();
        return true; // Don't continue with selection
      }

      // Connect the selected pin to the clicked pin
      const connection = {
        startIndex: this.appState.selectedPinIndex,
        endIndex: clickedPinIndex,
        color: this.appState.selectedColor,
        type: this.appState.connectionType
      };
      this.appState.connections.push(connection);
      this.appState.saveHistory();
      if (this.saveAppState) {
        this.saveAppState(this.appState);
      }
      // Update pin scales based on new connections
      window.updatePinScales(this.appState.pins, this.appState.connections);
      // Reset connection state after connecting pins
      this.appState.connectStartIndex = null;
      this.appState.connectMousePos = null;
      this.eventHandlers.stopMarqueeAnimation();
      console.log(`🔗 Connected pin ${this.appState.selectedPinIndex} to pin ${clickedPinIndex}`);
      this.eventHandlers.draw();
      return true; // Connection made, don't continue with selection
    }

    // Clicked on existing pin - select it and prepare for drag
    this.eventHandlers.setSelectedPin(clickedPinIndex);
    this.eventHandlers.selectedPins = [clickedPinIndex];

    // Start drag using drag manager
    if (window.dragManager) {
      window.dragManager.startPinDrag(clickedPinIndex, mousePos.world, this.eventHandlers.selectedPins);
      this.eventHandlers.isDragManagerDragging = true; // Track that drag manager is active
    } else {
      // Fallback if drag manager not available
      this.eventHandlers.isDraggingPin = true;
      this.eventHandlers.dragPinIndex = clickedPinIndex;
    }

    // Set as connection source for next pin placement (sequential mode)
    this.appState.connectStartIndex = clickedPinIndex;
    this.appState.connectionMode = 'sequential';

    // Clear any existing connection timeout
    if (this.eventHandlers.connectionTimeout) {
      clearTimeout(this.eventHandlers.connectionTimeout);
      this.eventHandlers.connectionTimeout = null;
    }

    // Clear connectStartIndex after 5 seconds of inactivity to prevent lingering marquee
    this.eventHandlers.connectionTimeout = setTimeout(() => {
      if (this.appState.connectStartIndex === clickedPinIndex && !this.eventHandlers.isDraggingPin && !this.eventHandlers.isDraggingArea) {
        this.appState.connectStartIndex = null;
        this.appState.connectMousePos = null;
        this.eventHandlers.stopMarqueeAnimation();
        console.log('⏰ Cleared stale connection state after 5 seconds');
        this.eventHandlers.connectionTimeout = null;
      }
    }, 5000);

    // Start marquee animation to show connection mode is active
    this.eventHandlers.startMarqueeAnimation();
    console.log(`🎯 Marquee activated for pin ${clickedPinIndex} - ready for connections`);

    console.log(`👆 Left-click: Pin ${clickedPinIndex} selected for dragging`);
    return false; // Continue with normal flow
  }
}

class TextTool extends BaseTool {
  onMouseDown(e, mousePos, clickedPinIndex) {
    // Don't create text bubbles when clicking on existing pins
    // This should be prevented by the main pin interaction logic, but double-check here
    if (clickedPinIndex !== null) {
      console.log(`⚠️ Text tool: Pin interaction already handled for pin ${clickedPinIndex}`);
      return;
    }

    // Text tool - register center and start marquee preview for sizing
    this.eventHandlers.isDraggingTextBubble = true;
    this.eventHandlers.textBubbleDragStart = { x: mousePos.world.x, y: mousePos.world.y };
    this.eventHandlers.textBubbleDragCurrent = { x: mousePos.world.x, y: mousePos.world.y };

    // Start marquee animation for visual feedback during drag preview
    this.eventHandlers.startMarqueeAnimation();

    console.log(`👆 Left-click: Text bubble center registered at (${mousePos.world.x}, ${mousePos.world.y}), starting marquee preview`);
  }
}

class AreaTool extends BaseTool {
  onMouseDown(e, mousePos, clickedPinIndex) {
    // Check if there's already a pin at this location
    if (clickedPinIndex !== null) {
      console.log(`⚠️ Cannot start area creation: pin already exists at (${mousePos.world.x}, ${mousePos.world.y})`);
      return; // Don't start area creation
    }

    // Area tool - register center and start marquee preview
    this.eventHandlers.isDraggingArea = true;
    this.eventHandlers.areaDragStart = { x: mousePos.world.x, y: mousePos.world.y };
    this.eventHandlers.areaDragCurrent = { x: mousePos.world.x, y: mousePos.world.y };

    // Start marquee animation for visual feedback during drag preview
    this.eventHandlers.startMarqueeAnimation();

    console.log(`👆 Left-click: Area center registered at (${mousePos.world.x}, ${mousePos.world.y}), starting marquee preview`);
  }
}

class EventHandlers {
  constructor(appState, canvas, app) {
    console.log("EventHandlers constructor called with:", typeof appState, typeof canvas, typeof app);
    console.log("Canvas element:", canvas, "id:", canvas ? canvas.id : "no id");
    try {
      if (!appState || !canvas) {
        throw new Error("EventHandlers constructor missing required parameters");
      }
      this.appState = appState;
      this.canvas = canvas;
      this.app = app;

    // Cache DOM element references to avoid stale references
    this.canvasContainer = document.getElementById("canvas-container");
    this.boardElement = document.getElementById("board");

    // Initialize tool instances
    try {
      this.tools = {
        pan: new PanTool(this),
        select: new SelectTool(this),
        pin: new PinTool(this),
        text: new TextTool(this),
        area: new AreaTool(this)
      };
      console.log("EventHandlers tools initialized successfully");
    } catch (error) {
      console.error("Failed to initialize EventHandlers tools:", error);
      throw error;
    }

    this.mouseScreenX = 0;
    this.mouseScreenY = 0;
    this.prevScreenX = 0;
    this.prevScreenY = 0;
    this.didDrag = false;
    this.clipboardPins = []; // For copy/paste functionality

    // Text bubble drag properties
    this.isDraggingTextBubble = false;
    this.textBubbleDragStart = null;
    this.textBubbleDragCurrent = null;

    // Tail dragging properties
    this.isDraggingTail = false;
    this.draggingTailPinIndex = null;
    console.log("EventHandlers constructor completed successfully");
  } catch (error) {
    console.error("EventHandlers constructor failed:", error);
    throw error;
  }

  // Track modifier key states globally
    this.altKeyPressed = false;
    this.ctrlKeyPressed = false;
    this.shiftKeyPressed = false;
    this.isPanning = false;
    this.isDraggingPin = false;
    this.dragPinIndex = null;
    this.isDraggingArea = false;
    this.areaDragStart = null;
    this.areaDragCurrent = null;
    this.isDraggingTextBubble = false;
    this.textBubbleDragStart = null;
    this.textBubbleDragCurrent = null;
    this.isDraggingTail = false;
    this.draggingTailPinIndex = null;

    // Handle area resizing completion
    if (this.isResizingArea && this.resizingAreaIndex !== null) {
      const areaPin = this.appState.pins[this.resizingAreaIndex];
      if (areaPin) {
        // Ensure minimum size
        if (areaPin.typeId === "area:circle") {
          areaPin.radius = Math.max(areaPin.radius || 25, 25);
        } else {
          areaPin.width = Math.max(areaPin.width || 50, 50);
          areaPin.height = Math.max(areaPin.height || 50, 50);
        }

        // Save the final state
        this.appState.saveHistory();
        if (this.saveAppState) {
          this.saveAppState(this.appState);
        }

        console.log(`✅ Area resize completed: ${areaPin.typeId} at (${areaPin.x}, ${areaPin.y})`);
      }
    }

    this.isResizingArea = false;
    this.resizingAreaIndex = null;
    this.areaDragStart = null; // Reset area drag start position
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
    this.totalMovement = 0;

    // Drag-to-line tracking
    this.dragStartPinIndex = null;
    this.isDraggingFromPin = false;

    // Scroll direction tracking for modifier keys (since deltaY is suppressed)
    this._lastShiftScrollTime = 0;
    this._shiftScrollDirection = 1; // 1 = right, -1 = left
    this._lastAltScrollTime = 0;
    this._altScrollDirection = 1; // 1 = down, -1 = up

    // Get references to global functions that will be passed in
    this.draw = null;
    this.saveAppState = null;
    this.screenToWorld = null;
    this.findPinAt = null;
    this.findConnectionNear = null;
    this.setSelectedPin = null;
    this.updateAreaContainment = null;

    // Bind methods to preserve 'this' context and prevent memory leaks
    this.handleCanvasPointerMove = this.handleCanvasPointerMove.bind(this);
    this.handleCanvasPointerUp = this.handleCanvasPointerUp.bind(this);
    this.handleCanvasMouseDown = this.handleCanvasMouseDown.bind(this);
    this.handleCanvasMouseMove = this.handleCanvasMouseMove.bind(this);
    this.handleCanvasMouseUp = this.handleCanvasMouseUp.bind(this);
    this.handleCanvasContextMenu = this.handleCanvasContextMenu.bind(this);
    this.handleCanvasDoubleClick = this.handleCanvasDoubleClick.bind(this);
    this.handleCanvasDragOver = this.handleCanvasDragOver.bind(this);
    this.handleCanvasDrop = this.handleCanvasDrop.bind(this);
    this.handleWheel = this.handleWheel.bind(this);
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleKeyUp = this.handleKeyUp.bind(this);

    // State management for preventing stale timeouts
    this.connectionTimeout = null;

    // Double-click detection
    this.lastClickTime = 0;
    this.lastClickX = 0;
    this.lastClickY = 0;
    this.doubleClickThreshold = 300; // ms

    // Command map for cleaner key handling (will be checked with conditions)
    this.keyCommands = {
      // Tool selection
      'm': () => this.selectTool('pan'),
      'M': () => this.selectTool('pan'),
      's': () => this.selectTool('select'),
      'S': () => this.selectTool('select'),
      'p': () => this.selectTool('pin'),
      'P': () => this.selectTool('pin'),
      't': () => this.selectTool('text'),
      'T': () => this.selectTool('text'),

      // Other shortcuts
      'f': () => this.frameAllPins(),
      'F': () => this.frameAllPins(),
      'l': () => this.toggleConnectionType(),
      'L': () => this.toggleConnectionType()
    };
  }

  // Helper method to get mouse coordinates consistently across all handlers
  getMousePos(e) {
    if (!this.canvasContainer) {
      this.canvasContainer = document.getElementById("canvas-container");
    }

    const rect = this.canvasContainer.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    return {
      screen: { x, y },
      world: this.screenToWorld(x, y)
    };
  }

  // Initialize all event handlers
  initialize(dependencies) {
    this.draw = dependencies.draw;
    this.saveAppState = dependencies.saveAppState;
    this.screenToWorld = dependencies.screenToWorld;
    this.findPinAt = dependencies.findPinAt;
    this.findConnectionNear = dependencies.findConnectionNear;
    this.setSelectedPin = dependencies.setSelectedPin;
    this.updateAreaContainment = dependencies.updateAreaContainment;

    // Canvas event handlers - use pre-bound methods from constructor to prevent memory leaks
    // Temporarily disable pointer events to avoid conflicts with mouse events
    // this.canvas.addEventListener("pointermove", this.handleCanvasPointerMove);
    // this.canvas.addEventListener("pointerup", this.handleCanvasPointerUp);
    this.canvas.addEventListener("mousedown", this.handleCanvasMouseDown);
    this.canvas.addEventListener("mousemove", this.handleCanvasMouseMove);
    this.canvas.addEventListener("mouseup", this.handleCanvasMouseUp);
    console.log("✅ Mouse event listeners attached to canvas");
    this.canvas.addEventListener("dblclick", this.handleCanvasDoubleClick);
    console.log("✅ Double-click listener attached to canvas");
    this.canvas.addEventListener("contextmenu", this.handleCanvasContextMenu);

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
    this.canvas.addEventListener("dragover", this.handleCanvasDragOver);
    this.canvas.addEventListener("drop", this.handleCanvasDrop);

    // Wheel event handler for zooming
    this.canvas.addEventListener("wheel", this.handleWheel, { passive: false });

    // Keyboard event handlers
    window.addEventListener("keydown", this.handleKeyDown);
    window.addEventListener("keyup", this.handleKeyUp);
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
    // Use a reasonable threshold for drag detection (5px for better responsiveness)
    if (this.totalMovement > 5) {
      this.didDrag = true;
    }

    if (this.isPanning) {
      this.isUserInteracting = true;
      this.appState.offsetX += dx;
      this.appState.offsetY += dy;
      this.appState.saveHistory(); // Pan operations should be undoable
    } else if (this.isDraggingArea) {
      console.log(`🎯 AREA DRAGGING: Updating marquee preview - this.isDraggingArea = ${this.isDraggingArea}`);
      this.isUserInteracting = true;
      this.areaDragCurrent = { x: mousePos.world.x, y: mousePos.world.y }; // Update current drag position for marquee

      // Update marquee animation and draw animated marquee
      this.updateMarqueeAnimation();
      this.drawAnimatedMarquee();
    } else if (this.isDraggingTextBubble) {
      console.log(`💭 TEXT BUBBLE DRAGGING: Updating marquee preview`);
      this.isUserInteracting = true;
      this.textBubbleDragCurrent = { x: mousePos.world.x, y: mousePos.world.y }; // Update current drag position for marquee

      // Update marquee animation and draw animated marquee
      this.updateMarqueeAnimation();
      this.drawAnimatedMarquee();
    } else if (this.isDraggingTail && this.draggingTailPinIndex !== null) {
      console.log(`🎯 TAIL DRAGGING: Updating tail position`);
      this.isUserInteracting = true;

      const pin = this.appState.pins[this.draggingTailPinIndex];
      if (pin && pin.shape === 'bubble') {
        // Calculate angle from bubble center to mouse position
        const dx = mousePos.world.x - pin.x;
        const dy = mousePos.world.y - pin.y;
        const angle = Math.atan2(dy, dx) * 180 / Math.PI; // Convert to degrees

        // Calculate distance from center (normalized to bubble size)
        const distance = Math.sqrt(dx * dx + dy * dy);
        const maxRadius = Math.max(pin.width || 120, pin.height || 60) / 2;
        const normalizedDistance = Math.min(distance / maxRadius, 1);

        // Update tail position
        pin.tailPosition = {
          angle: angle,
          distance: normalizedDistance
        };

        console.log(`🎯 Tail moved to angle: ${angle.toFixed(1)}°, distance: ${normalizedDistance.toFixed(2)}`);
      }

      this.draw(); // Redraw to show tail movement
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

    const mousePos = this.getMousePos(e);
    const clickedPinIndex = this.findPinAt(mousePos.world.x, mousePos.world.y);
    const clickedConnectionIndex = this.findConnectionNear(mousePos.world.x, mousePos.world.y);


    // Initialize mouse position tracking for movement detection
    this.prevScreenX = e.clientX;
    this.prevScreenY = e.clientY;

    // Handle Shift+click on connection lines
    if (e.button === 0 && e.shiftKey && clickedConnectionIndex !== null && clickedPinIndex === null) {
      this.handleShiftClickOnConnection(mousePos.world, clickedConnectionIndex);
      return;
    }

    // Reset drag tracking
    this.dragStartPinIndex = null;
    this.isDraggingFromPin = false;

    // Reset drag tracking
    this.dragStartPinIndex = null;
    this.isDraggingFromPin = false;

    // Track if we're starting a drag from a pin (for drag-to-line functionality)
    if (e.button === 0 && !e.shiftKey && clickedPinIndex !== null) {
      this.dragStartPinIndex = clickedPinIndex;
      this.isDraggingFromPin = true;
    }

    // Handle right-click separately
    if (e.button === 2) {
      this.handleCanvasRightClick(e, mousePos.world, clickedPinIndex);
      return;
    }

    // Handle shift+click for direct pin-to-pin connections
    if (e.button === 0 && e.shiftKey && clickedPinIndex !== null) {
      // If we have an active connection source, create connection to clicked pin
      if (this.appState.connectStartIndex !== null && this.appState.connectStartIndex !== clickedPinIndex) {
        // Check if connection already exists (bidirectional)
        const existingConnection = this.appState.connections.find(conn =>
          (conn.startIndex === this.appState.connectStartIndex && conn.endIndex === clickedPinIndex) ||
          (conn.startIndex === clickedPinIndex && conn.endIndex === this.appState.connectStartIndex)
        );

        if (existingConnection) {
          console.log(`⚠️ Connection already exists between pin ${this.appState.connectStartIndex} and pin ${clickedPinIndex}`);
          // Reset connection state
          this.appState.connectStartIndex = null;
          this.appState.connectMousePos = null;
          this.stopMarqueeAnimation();
        } else {
          // Create connection between the two pins
          this.appState.addConnection(this.appState.connectStartIndex, clickedPinIndex, {
            color: this.appState.selectedColor,
            type: this.appState.connectionType
          });

          console.log(`🔗 Connected pin ${this.appState.connectStartIndex} to pin ${clickedPinIndex} via shift+click`);

          // Handle connection state based on mode
          if (this.appState.connectionMode === 'sequential') {
            // In sequential mode: set the connected pin as the new connection source
            this.appState.connectStartIndex = clickedPinIndex;
            this.appState.connectMousePos = null;
            console.log(`🔄 Sequential: Connected to pin ${clickedPinIndex}, now set as new connection source`);
          } else {
            // In other modes: reset connection state
            this.appState.connectStartIndex = null;
            this.appState.connectMousePos = null;
            this.stopMarqueeAnimation();
          }

          this.appState.saveHistory();
          if (this.saveAppState) {
            this.saveAppState(this.appState);
          }
          this.draw();
        }
        return; // Connection handled
      } else {
        // No active connection source, so set this pin as the connection source
        this.appState.connectStartIndex = clickedPinIndex;
        this.appState.connectionMode = 'sequential';
        this.startMarqueeAnimation();
        console.log(`🎯 Shift+click: Set pin ${clickedPinIndex} as connection source`);
        return;
      }
    }

    // Handle left-click pin interaction first (works with any tool)
    // This should prevent tool-specific actions when interacting with existing pins
    if (e.button === 0 && !e.shiftKey && clickedPinIndex !== null) {
      const pin = this.appState.pins[clickedPinIndex];

      // Check if clicked on bubble tail first
      if (pin && pin.shape === 'bubble' && this.isPointOnBubbleTail(pin, mousePos.world.x, mousePos.world.y)) {
        // Start tail dragging - this takes priority over normal pin dragging
        this.isDraggingTail = true;
        this.draggingTailPinIndex = clickedPinIndex;
        console.log(`🎯 Started dragging tail of bubble pin ${clickedPinIndex}`);
        return; // Don't continue with any other logic
      } else {
        // Normal pin interaction - select and prepare for drag
        this.setSelectedPin(clickedPinIndex);
        this.selectedPins = [clickedPinIndex];

        // Start drag using drag manager
        if (window.dragManager) {
          window.dragManager.startPinDrag(clickedPinIndex, mousePos.world, this.selectedPins);
          this.isDragManagerDragging = true; // Track that drag manager is active
        } else {
          // Fallback if drag manager not available
          this.isDraggingPin = true;
          this.dragPinIndex = clickedPinIndex;
        }

        // Set as connection source for next pin placement (sequential mode)
        this.appState.connectStartIndex = clickedPinIndex;
        this.appState.connectionMode = 'sequential';

        // Start marquee animation to show connection mode is active
        this.startMarqueeAnimation();

        console.log(`🎯 Left-click: Selected pin ${clickedPinIndex} and started drag`);
        return; // Don't continue to tool-specific logic
      }
    }

    // Handle left-click using tool pattern
    if (e.button === 0) { // Left click
      const currentTool = this.appState.currentTool || "pin";
      const tool = this.tools[currentTool];

      if (tool) {
        tool.onMouseDown(e, mousePos, clickedPinIndex);
      }
    } else if (e.button === 1) { // Middle click - always pan
      this.isPanning = true;
      this.prevScreenX = e.clientX;
      this.prevScreenY = e.clientY;
      console.log(`👆 Middle-click: Pan mode activated`);
    }
  }

  // Canvas right-click handler (separated for clarity)
  handleCanvasRightClick(e, mouseWorld, clickedPinIndex) {
    e.preventDefault(); // Prevent context menu from showing
    e.stopPropagation(); // Stop event bubbling
    e.stopImmediatePropagation(); // Stop other handlers
    e.returnValue = false; // For older browsers

    if (clickedPinIndex !== null) {
      // Check if it's a text pin (bubble or rectangle shape)
      const pin = this.appState.pins[clickedPinIndex];
      const isTextPin = pin && (pin.shape === 'bubble' || pin.shape === 'rectangle');

      if (isTextPin) {
        // Right-click on text pin - open radial menu and activate marquee for connections
        console.log(`🎯 RIGHT-CLICK: Opening radial menu AND activating marquee for text pin ${clickedPinIndex}`);

        // Clear any existing connection timeout
        if (this.connectionTimeout) {
          clearTimeout(this.connectionTimeout);
          this.connectionTimeout = null;
        }

        // Set pin as connection source
        this.appState.selectedPinIndex = clickedPinIndex;
        this.appState.connectStartIndex = clickedPinIndex;
        this.appState.connectionMode = 'parent';

        // Clear connectStartIndex after 10 seconds
        this.connectionTimeout = setTimeout(() => {
          if (this.appState.connectStartIndex === clickedPinIndex && this.appState.connectionMode === 'parent') {
            this.appState.connectStartIndex = null;
            this.appState.connectMousePos = null;
            this.stopMarqueeAnimation();
            console.log('⏰ Cleared pin parent connection state after 10 seconds');
            this.connectionTimeout = null;
          }
        }, 10000);

        // Start marquee animation to show connection mode is active
        this.startMarqueeAnimation();
        console.log(`🎯 Marquee activated for text pin ${clickedPinIndex} - ready for radial connections`);

        // Open radial menu for text pin
        if (window.openRadialMenu) {
          window.openRadialMenu(clickedPinIndex, e.clientX, e.clientY);
        }

        console.log(`🔗 Text pin ${clickedPinIndex} set as parent - marquee activated`);
        return;
      }

      // Right-click on regular pin - BOTH open radial menu AND activate marquee for connections
      // Right-click on pin - BOTH open radial menu AND activate marquee for connections
      console.log(`🎯 RIGHT-CLICK: Opening radial menu AND activating marquee for pin ${clickedPinIndex}`);

      // Clear any existing connection timeout
      if (this.connectionTimeout) {
        clearTimeout(this.connectionTimeout);
        this.connectionTimeout = null;
      }

      // 1. Set pin as parent for connections (activate marquee)
      this.setSelectedPin(clickedPinIndex);
      this.appState.connectStartIndex = clickedPinIndex;
      this.appState.connectionMode = 'parent'; // Locked parent effect

      // Clear connectStartIndex after 10 seconds for parent mode (longer since it's multi-connection)
      this.connectionTimeout = setTimeout(() => {
        if (this.appState.connectStartIndex === clickedPinIndex && this.appState.connectionMode === 'parent') {
          this.appState.connectStartIndex = null;
          this.appState.connectMousePos = null;
          this.stopMarqueeAnimation();
          console.log('⏰ Cleared parent connection state after 10 seconds');
          this.connectionTimeout = null;
        }
      }, 10000);

      // Start marquee animation to show connection mode is active
      this.startMarqueeAnimation();
      console.log(`🎯 Marquee activated for parent pin ${clickedPinIndex} - ready for radial connections`);

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
      newPin.pinType = "card:card"; // Default center pin type for areas
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

    // Validate pin data before adding to appState
    const validatedPin = this.app.validatePin(newPin);
    this.appState.pins.push(validatedPin);
    const newIndex = this.appState.pins.length - 1;

    // Set this pin as hub for subsequent connections
    this.setSelectedPin(newIndex);
    this.appState.connectStartIndex = newIndex;
    this.appState.connectionMode = 'parent'; // Set parent/hub mode

    // Start marquee animation to show connection mode is active
    this.startMarqueeAnimation();
    console.log(`🎯 Marquee activated for hub pin ${newIndex} - ready for radial connections`);

    console.log(`   Pin created at: (${newPin.x}, ${newPin.y}) and set as HUB`);
    this.draw();
  }

  // Check if a point is on the tail of a bubble pin
  isPointOnBubbleTail(pin, worldX, worldY) {
    if (pin.shape !== 'bubble') return false;

    const tailPos = pin.tailPosition || { angle: 270, distance: 0.8 };
    const tailAngle = (tailPos.angle * Math.PI) / 180;
    const tailDistance = tailPos.distance;

    const scr = { x: pin.x, y: pin.y };
    const width = pin.width || 120;
    const height = pin.height || 60;

    // Calculate tail attachment point
    const tailAttachX = scr.x + Math.cos(tailAngle) * (width/2 * tailDistance);
    const tailAttachY = scr.y + Math.sin(tailAngle) * (height/2 * tailDistance);

    // Calculate tail tip point
    const tailLength = Math.min(width, height) * 0.3;
    const tailTipX = tailAttachX + Math.cos(tailAngle) * tailLength;
    const tailTipY = tailAttachY + Math.sin(tailAngle) * tailLength;

    // Check if point is within the tail triangle
    const tailWidth = tailLength * 0.4;

    // Use point-in-triangle test
    const area = Math.abs((tailAttachX*(tailTipY - tailAttachY + Math.cos(tailAngle)*tailWidth/2) +
                          tailTipX*(tailAttachY - tailTipY + Math.cos(tailAngle)*tailWidth/2) +
                          (tailTipX - Math.sin(tailAngle)*tailWidth/2)*(tailAttachY - tailAttachY)) / 2);

    const area1 = Math.abs((worldX*(tailTipY - tailAttachY) + tailAttachX*(tailAttachY - tailTipY) + tailTipX*(tailAttachY - worldY)) / 2);
    const area2 = Math.abs((worldX*(tailAttachY - tailTipY + Math.cos(tailAngle)*tailWidth/2) + tailTipX*(tailTipY + Math.cos(tailAngle)*tailWidth/2 - worldY) + (tailTipX - Math.sin(tailAngle)*tailWidth/2)*(worldY - tailAttachY)) / 2);
    const area3 = Math.abs((worldX*(tailTipY - tailAttachY - Math.cos(tailAngle)*tailWidth/2) + (tailTipX + Math.sin(tailAngle)*tailWidth/2)*(tailAttachY - tailTipY) + tailAttachX*(tailTipY - worldY)) / 2);

    return Math.abs(area - (area1 + area2 + area3)) < 1; // Small tolerance
  }

  // Find the closest point on a line segment to a given point
  findClosestPointOnLine(px, py, x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;

    if (dx === 0 && dy === 0) {
      // Line segment is a point
      return { x: x1, y: y1 };
    }

    // Calculate the parameter t that gives the closest point on the infinite line
    const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / (dx * dx + dy * dy)));

    // Calculate the closest point on the line segment
    const closestX = x1 + t * dx;
    const closestY = y1 + t * dy;

    return { x: closestX, y: closestY };
  }


    // Handle Shift+click on connection lines
    handleShiftClickOnConnection(worldPos, connectionIndex) {
    console.log(`🔗 Shift+click on connection ${connectionIndex} at (${worldPos.x}, ${worldPos.y})`);

    // Get the connection details
    const connection = this.appState.connections[connectionIndex];
    if (!connection) {
      console.error(`❌ No connection found at index ${connectionIndex}`);
      return;
    }

    const startPin = this.appState.pins[connection.startIndex];
    const endPin = this.appState.pins[connection.endIndex];

    if (!startPin || !endPin) {
      console.error(`❌ Invalid connection: missing start or end pin`);
      return;
    }

    // Find the closest point on the line segment to the click position
    const closestPoint = this.findClosestPointOnLine(worldPos.x, worldPos.y, startPin.x, startPin.y, endPin.x, endPin.y);

    // Create a new pin at the closest point on the line
    const newPin = {
      x: closestPoint.x,
      y: closestPoint.y,
      color: this.appState.selectedColor,
      label: "",
      note: "",
      date: "",
      typeId: "pin:circle", // Default pin type
      pinScale: 1
    };

    // Check for collision with existing pins at the closest point
    const existingPinIndex = this.findPinAt(closestPoint.x, closestPoint.y);
    if (existingPinIndex !== null) {
      console.log(`⚠️ Cannot place pin on line: pin already exists at location (${closestPoint.x.toFixed(2)}, ${closestPoint.y.toFixed(2)})`);
      return;
    }

    this.appState.pins.push(newPin);
    const newIndex = this.appState.pins.length - 1;

    // Connect the new pin to both ends of the connection
    if (connection) {
      // Replace the original connection with the start-to-middle connection
      this.appState.connections[connectionIndex] = {
        startIndex: connection.startIndex,
        endIndex: newIndex,
        color: connection.color, // Preserve original color
        type: connection.type    // Preserve original type
      };

      // Add the middle-to-end connection
      const endConnection = {
        startIndex: newIndex,
        endIndex: connection.endIndex,
        color: connection.color, // Preserve original color
        type: connection.type    // Preserve original type
      };
      this.appState.connections.push(endConnection);

      console.log(`🔗 Split connection: ${connection.startIndex} → ${newIndex} → ${connection.endIndex}`);
    }

    this.appState.saveHistory();
    if (this.saveAppState) {
      this.saveAppState(this.appState);
    }

    // Select the newly created pin and activate marquee for connections
    this.setSelectedPin(newIndex);
    this.appState.connectStartIndex = newIndex;
    this.appState.connectionMode = 'parent';
    this.startMarqueeAnimation();

    this.draw();
  }

  // Canvas mouse move handler
  handleCanvasMouseMove(e) {
    const mousePos = this.getMousePos(e);
    const canvasX = mousePos.screen.x;
    const canvasY = mousePos.screen.y;

    // Accumulate movement for drag detection (moved from pointer handler)
    if (e.buttons !== 0) {
      const dx = e.clientX - this.prevScreenX;
      const dy = e.clientY - this.prevScreenY;
      this.totalMovement += Math.abs(dx) + Math.abs(dy);

      // Set didDrag if total movement exceeds threshold
      if (this.totalMovement > 5) {
        this.didDrag = true;
      }

      this.prevScreenX = e.clientX;
      this.prevScreenY = e.clientY;
    }

    if (this.isMarqueeSelecting) {
      this.marqueeEnd = mousePos.world;
      this.draw();
    }

    // Track mouse position for connection preview line
    if (this.appState.connectStartIndex !== null) {
      this.appState.connectMousePos = this.screenToWorld(canvasX, canvasY);
      // Only start marquee animation if mouse has moved significantly (indicating active preview intent)
      const startPin = this.appState.pins[this.appState.connectStartIndex];
      if (startPin) {
        const distanceFromStart = Math.sqrt(
          Math.pow(this.appState.connectMousePos.x - startPin.x, 2) +
          Math.pow(this.appState.connectMousePos.y - startPin.y, 2)
        );
        if (distanceFromStart > 20 && !this.marqueeAnimationId) { // Only start if moved > 20 units from pin
          this.startMarqueeAnimation();
        }
      }
      // Don't call draw() here - let the marquee animation handle drawing
    }

    // Handle pin dragging using drag manager
    if (window.dragManager && this.isDragManagerDragging) {
      window.dragManager.updateDrag(this.screenToWorld(canvasX, canvasY));
    }

    if (this.isDraggingArea) {
      console.log(`🎯 AREA DRAGGING: About to execute area dragging code - this.isDraggingArea = ${this.isDraggingArea}`);
      this.isUserInteracting = true;
      console.log(`🎯 screenToWorld(${canvasX}, ${canvasY}) returned: (${mousePos.world.x}, ${mousePos.world.y})`);
      console.log(`🎯 areaDragCurrent before: (${this.areaDragCurrent.x}, ${this.areaDragCurrent.y})`);
      this.areaDragCurrent = { x: mousePos.world.x, y: mousePos.world.y }; // Explicit assignment
      console.log(`🎯 areaDragCurrent after: (${this.areaDragCurrent.x}, ${this.areaDragCurrent.y})`);

      // Update marquee animation and draw animated marquee
      this.updateMarqueeAnimation();
      this.drawAnimatedMarquee();
    }
  }

  // Canvas mouse up handler
  handleCanvasMouseUp(e) {
    console.log("👆 Mouse up event detected", e);

    const mousePos = this.getMousePos(e);
    const mouseWorld = mousePos.world;

    // END DRAG OPERATIONS FIRST - this must happen regardless of double-click detection
    if (window.dragManager) {
      window.dragManager.endDrag();
    }
    this.isDragManagerDragging = false; // Reset our drag tracking flag
    this.stopMarqueeAnimation(); // Stop any marquee that might be running

    // Check for potential double-click to avoid conflicts
    const now = Date.now();
    const clickX = e.clientX;
    const clickY = e.clientY;
    const timeDiff = now - this.lastClickTime;
    const distance = Math.sqrt(
      Math.pow(clickX - this.lastClickX, 2) +
      Math.pow(clickY - this.lastClickY, 2)
    );

    // If this might be part of a double-click, delay single-click actions
    const isPotentialDoubleClick = timeDiff < this.doubleClickThreshold && distance < 10;

    // Update click tracking
    this.lastClickTime = now;
    this.lastClickX = clickX;
    this.lastClickY = clickY;

    console.log(`👆 Click release at (${mouseWorld.x}, ${mouseWorld.y})`);

    // If this might be part of a double-click, don't perform single-click actions
    if (isPotentialDoubleClick) {
      console.log(`👆 Suppressing single-click actions due to potential double-click`);
      return;
    }

    // Handle drag-to-line: if we dragged a pin and released on a line, connect it
    if (this.isDraggingFromPin && this.dragStartPinIndex !== null && this.didDrag) {
      const connectionIndex = this.findConnectionNear(mouseWorld.x, mouseWorld.y);
      if (connectionIndex !== null) {
        const connection = this.appState.connections[connectionIndex];
        if (connection) {
          // Get the dragged pin
          const draggedPin = this.appState.pins[this.dragStartPinIndex];
          if (!draggedPin) {
            console.error(`❌ Drag-to-line: dragged pin ${this.dragStartPinIndex} not found`);
            return;
          }

          // Check if connection already exists
          const existingStart = this.appState.connections.find(conn =>
            (conn.startIndex === connection.startIndex && conn.endIndex === this.dragStartPinIndex) ||
            (conn.startIndex === this.dragStartPinIndex && conn.endIndex === connection.startIndex)
          );
          const existingEnd = this.appState.connections.find(conn =>
            (conn.startIndex === connection.endIndex && conn.endIndex === this.dragStartPinIndex) ||
            (conn.startIndex === this.dragStartPinIndex && conn.endIndex === connection.endIndex)
          );

          if (!existingStart) {
            const startConnection = {
              startIndex: connection.startIndex,
              endIndex: this.dragStartPinIndex,
              color: this.appState.selectedColor,
              type: this.appState.connectionType
            };
            this.appState.connections.push(startConnection);
            console.log(`🔗 Drag-to-line: Connected ${connection.startIndex} to dragged pin ${this.dragStartPinIndex}`);
          }

          if (!existingEnd) {
            const endConnection = {
              startIndex: this.dragStartPinIndex,
              endIndex: connection.endIndex,
              color: this.appState.selectedColor,
              type: this.appState.connectionType
            };
            this.appState.connections.push(endConnection);
            console.log(`🔗 Drag-to-line: Connected dragged pin ${this.dragStartPinIndex} to ${connection.endIndex}`);
          }

          this.appState.saveHistory();
          if (this.saveAppState) {
            this.saveAppState(this.appState);
          }

          // Update pin scales
          window.updatePinScales(this.appState.pins, this.appState.connections);

          this.draw();
          return; // Don't continue with other mouse up logic
        }
      }
    }

    let areaCreated = false;

    if (this.isMarqueeSelecting) {
      // Complete marquee selection
      const start = this.marqueeStart;
      const end = this.marqueeEnd;
      if (start && end) {
        const minX = Math.min(start.x, end.x);
        const maxX = Math.max(start.x, end.x);
        const minY = Math.min(start.y, end.y);
        const maxY = Math.max(start.y, end.y);

        this.selectedPins = [];
        for (let i = 0; i < this.appState.pins.length; i++) {
          const pin = this.appState.pins[i];
          if (pin.x >= minX && pin.x <= maxX && pin.y >= minY && pin.y <= maxY) {
            this.selectedPins.push(i);
          }
        }
        if (this.selectedPins.length > 0) {
          this.setSelectedPin(this.selectedPins[0]);
        }
      }

      // Clear marquee immediately to prevent ghost marquee
      this.marqueeStart = null;
      this.marqueeEnd = null;
      this.isMarqueeSelecting = false;
    }

    // Handle connection creation if connectStartIndex is set
    if (!this.didDrag && !this.isMarqueeSelecting && this.appState.connectStartIndex !== null) {
      const clickedPinIndex = this.findPinAt(mouseWorld.x, mouseWorld.y);

      if (clickedPinIndex !== null && clickedPinIndex !== this.appState.connectStartIndex) {
        // Create connection between two different pins
        const connection = {
          startIndex: this.appState.connectStartIndex,
          endIndex: clickedPinIndex,
          color: this.appState.selectedColor,
          type: this.appState.connectionType
        };
        this.appState.connections.push(connection);
        this.appState.saveHistory();
        if (this.saveAppState) {
          this.saveAppState(this.appState);
        }
        // Update pin scales based on new connections
        window.updatePinScales(this.appState.pins, this.appState.connections);

        console.log(`🔗 Connected pin ${this.appState.connectStartIndex} to pin ${clickedPinIndex}`);

        // Handle connection state based on mode
        if (this.appState.connectionMode === 'sequential') {
          // In sequential mode: set the connected pin as the new connection source
          this.appState.connectStartIndex = clickedPinIndex;
          this.appState.connectMousePos = null; // Clear mouse pos but keep connection active
          console.log(`🔄 Sequential: Connected to pin ${clickedPinIndex}, now set as new connection source`);
        } else {
          // In other modes: reset connection state
          this.appState.connectStartIndex = null;
          this.appState.connectMousePos = null;
          this.stopMarqueeAnimation(); // Stop marquee animation
        }

        this.draw();
        return; // Don't create a new pin
      }
      // If clicked on empty space or same element, continue to pin creation logic below
      // which will handle creating a new pin and connecting it
    }

    // Handle area creation from marquee drag
    if (this.isDraggingArea && this.areaDragStart && this.areaDragCurrent) {
      const dx = Math.abs(this.areaDragCurrent.x - this.areaDragStart.x);
      const dy = Math.abs(this.areaDragCurrent.y - this.areaDragStart.y);

      // Check for collision with existing pins at the center location
      const centerX = this.areaDragStart.x;
      const centerY = this.areaDragStart.y;
      const existingPinIndex = this.findPinAt(centerX, centerY);

      if (existingPinIndex !== null) {
        console.log(`⚠️ Cannot create area: pin already exists at center location (${centerX}, ${centerY})`);
        areaCreated = false; // Prevent area creation
      } else {
        // Always create area in area mode, even for clicks (minimum size)
        areaCreated = true;
      }

      const newPin = {
        id: `area_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        x: centerX,
        y: centerY,
        areaType: this.appState.currentTypeId === "area:circle" ? "circle" : "square",
      pinType: "card:card", // Default center pin type for areas
        color: this.appState.selectedColor,
        label: "",
        note: "",
        date: "",
        typeId: this.appState.currentTypeId, // Keep for backward compatibility
        title: "",
        description: "",
        fillColor: this.appState.selectedColor + "40", // Semi-transparent fill
        borderColor: this.appState.selectedColor,
        borderWidth: 2,
        textColor: "#FFFFFF",
        icon: "",
        iconColor: this.appState.selectedColor,
        containedPins: [], // Array to track pins within this area
        pinScale: 1, // Default scale for area pins
        areaScale: 1, // Separate scale for the area itself
      };

      // Set area-specific properties based on drag dimensions
      if (newPin.areaType === "circle") {
        // For circles, use the diagonal distance as radius
        const distance = Math.sqrt(dx * dx + dy * dy);
        newPin.areaSize = Math.max(distance, 25);
        newPin.radius = newPin.areaSize;
      } else {
        // For rectangles, use the actual drag dimensions
        newPin.width = Math.max(Math.abs(dx) * 2, 50);
        newPin.height = Math.max(Math.abs(dy) * 2, 50);
        // areaSize can be used for other calculations if needed
        newPin.areaSize = Math.max(newPin.width, newPin.height) / 2;
      }

      this.appState.pins.push(newPin);
      const newIndex = this.appState.pins.length - 1;
      this.setSelectedPin(newIndex);
      this.appState.saveHistory();
      if (this.saveAppState) {
        this.saveAppState(this.appState);
      }
      this.draw();
      this.stopMarqueeAnimation(); // Stop animation after area creation

      console.log(`✅ Area pin created at center (${centerX}, ${centerY}) with size ${newPin.areaSize}`);
    }

    // Handle text creation when text tool is active (single clicks only)
    // Drag creation is handled in the text bubble drag section above
    // Don't create new pins if we just interacted with an existing pin
    if (!this.isMarqueeSelecting && !this.didDrag && this.appState.currentTool === "text" && this.dragStartPinIndex === null) {
      const clickedPinIndex = this.findPinAt(mouseWorld.x, mouseWorld.y);
      if (clickedPinIndex === null) {
        // Create new text pin at click location (default size)
        const newPinIndex = this.appState.addTextPin(mouseWorld.x, mouseWorld.y, "Text", {
          color: this.appState.selectedColor,
          shape: "bubble",
          fontSize: 16,
          width: 120,  // Default width
          height: 60   // Default height
        });

        console.log(`📝 Created text bubble at (${mouseWorld.x}, ${mouseWorld.y})`);
        this.appState.saveHistory();
        if (this.saveAppState) {
          this.saveAppState(this.appState);
        }
        this.draw();
        return; // Don't continue with other creation logic
      }
    }

    // Handle text bubble creation from marquee drag
    if (this.isDraggingTextBubble && this.textBubbleDragStart && this.textBubbleDragCurrent) {
      const dx = Math.abs(this.textBubbleDragCurrent.x - this.textBubbleDragStart.x);
      const dy = Math.abs(this.textBubbleDragCurrent.y - this.textBubbleDragStart.y);

      // Check for collision with existing pins at the center location
      const centerX = this.textBubbleDragStart.x;
      const centerY = this.textBubbleDragStart.y;
      const existingPinIndex = this.findPinAt(centerX, centerY);

      if (existingPinIndex !== null) {
        console.log(`⚠️ Cannot create text bubble: pin already exists at center location (${centerX}, ${centerY})`);
      } else {
        // Create text bubble with drag dimensions
        const width = Math.max(dx * 2, 120); // Minimum width
        const height = Math.max(dy * 2, 60);  // Minimum height

        const newPinIndex = this.appState.addTextPin(centerX, centerY, "", {
          color: this.appState.selectedColor,
          shape: "bubble",
          width: width,
          height: height,
          tailPosition: { angle: 270, distance: 0.8 } // Default tail at bottom
        });

        // Set as connection source for next pin placement
        this.appState.connectStartIndex = newPinIndex;
        this.appState.connectionMode = 'parent';

        // Start marquee animation to show connection mode is active
        this.startMarqueeAnimation();

        console.log(`💭 Created text bubble at (${centerX}, ${centerY}) with size ${width}x${height}`);
        this.appState.saveHistory();
        if (this.saveAppState) {
          this.saveAppState(this.appState);
        }
        this.draw();
        return; // Don't create a new pin
      }
    }

    // Create pin if clicking on empty space with a pin/card type selected
    // Note: Area tools handle their own pin creation in AreaTool.onMouseDown
    if (!this.isMarqueeSelecting) {
      const clickedPinIndex = this.findPinAt(mouseWorld.x, mouseWorld.y);
      const isCreationTool = ["pin", "card"].includes(this.appState.currentTool); // Removed "area"

      if (!areaCreated && clickedPinIndex === null && this.appState.currentTypeId && isCreationTool) {
        // Create new pin at click location
        // Look up the node type to get variant and other properties
        const nodeType = window.NODE_TYPES?.find(nt => nt.id === this.appState.currentTypeId);

        const pinProperties = {
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
          pinProperties.pinType = "card:card"; // Default center pin type for areas
          pinProperties.width = 100;
          pinProperties.height = 100;
          pinProperties.fillColor = this.appState.selectedColor + "40";
          pinProperties.borderColor = this.appState.selectedColor;
          pinProperties.borderWidth = 2;
          pinProperties.textColor = window._currentThemeTextColor || "#ffffff";
          pinProperties.icon = "▤";
          pinProperties.iconColor = this.appState.selectedColor;
          pinProperties.containedPins = [];
          pinProperties.title = "";
          pinProperties.description = "";
        }

        // Use addPin method for consistent pin creation
        const newIndex = this.appState.addPin(mouseWorld.x, mouseWorld.y, pinProperties);
        const newPin = this.appState.pins[newIndex];
        console.log(`📍 Pin added to appState.pins at index ${newIndex}:`, newPin);

        // Check if we should connect this new pin to an active connection source
        let connectionCreated = false;
        if (this.appState.connectStartIndex !== null && this.appState.connectStartIndex !== newIndex) {
          // Check if connection already exists (shouldn't happen for new pin, but safety check)
          const existingConnection = this.appState.connections.find(conn =>
            (conn.startIndex === this.appState.connectStartIndex && conn.endIndex === newIndex) ||
            (conn.startIndex === newIndex && conn.endIndex === this.appState.connectStartIndex)
          );

          if (!existingConnection) {
            // Create connection between active source and new pin
            const connection = {
              startIndex: this.appState.connectStartIndex,
              endIndex: newIndex,
              color: this.appState.selectedColor,
              type: this.appState.connectionType
            };
            this.appState.connections.push(connection);
            this.appState.saveHistory();
            if (this.saveAppState) {
              this.saveAppState(this.appState);
            }
            // Update pin scales based on new connections
            window.updatePinScales(this.appState.pins, this.appState.connections);
            connectionCreated = true;
            console.log(`🔗 Connected pin ${this.appState.connectStartIndex} to new pin ${newIndex}`);
          }
        }

        if (connectionCreated) {
          console.log(`📍 Placed pin ${newIndex} and connected to pin ${this.appState.connectStartIndex}`);
        } else {
          console.log(`📍 Placed pin ${newIndex} without automatic connection`);
        }

        // Handle ActivePin updates based on connection mode
        if (this.appState.connectionMode !== 'parent') {
          // Not in Radial/Parent Mode: Set new pin as active (sequential behavior)
          this.setSelectedPin(newIndex);

          // If we just created a connection, update connection state for sequential mode
          if (connectionCreated && this.appState.connectionMode === 'sequential') {
            // In sequential mode: the new pin becomes the connection source for the next pin
            this.appState.connectStartIndex = newIndex;
            console.log(`🔄 Sequential: New pin ${newIndex} is now the connection source`);
          } else if (!connectionCreated) {
            // No connection was created: set as connection source for next pin placement
            this.appState.connectStartIndex = newIndex;
            this.appState.connectionMode = 'sequential';
          }

          // Start marquee animation to show connection mode is active
          this.startMarqueeAnimation();
          console.log(`🎯 Marquee activated for pin ${newIndex} - ready for connections`);

          // Clear any existing connection timeout
          if (this.connectionTimeout) {
            clearTimeout(this.connectionTimeout);
            this.connectionTimeout = null;
          }

          // Clear connectStartIndex after 5 seconds of inactivity to prevent lingering marquee
          this.connectionTimeout = setTimeout(() => {
            if (this.appState.connectStartIndex === newIndex && !this.isDraggingPin && !this.isDraggingArea) {
              this.appState.connectStartIndex = null;
              this.appState.connectMousePos = null;
              this.stopMarqueeAnimation();
              console.log('⏰ Cleared sequential connection state after 5 seconds');
              this.connectionTimeout = null;
            }
          }, 5000);

          console.log(`🔄 Sequential mode: Updated ActivePin to new pin ${newIndex}`);
        } else {
          // Radial/Parent Mode: Keep ActivePin locked to current pin (1 -> 2, 1 -> 3, 1 -> 4)
          // Don't change selectedPin or connectStartIndex
          console.log(`👨‍👩‍👧 Parent mode: Keeping ActivePin locked to pin ${this.appState.connectStartIndex} for radial connections`);
        }

        console.log(`   Pin created at: (${newPin.x}, ${newPin.y})`);

        console.log(`💾 Saving app state after pin creation: pins=${this.appState.pins.length}, connections=${this.appState.connections.length}`);
        console.log(`💾 AppState before save:`, {
          pinsCount: this.appState.pins.length,
          connectionsCount: this.appState.connections.length,
          selectedPinIndex: this.appState.selectedPinIndex,
          connectStartIndex: this.appState.connectStartIndex,
          actualPinsType: typeof this.appState.pins,
          isArray: Array.isArray(this.appState.pins),
          samplePin: this.appState.pins.length > 0 ? this.appState.pins[0] : null
        });

        // Pin creation should be part of history for undo/redo
        setTimeout(() => {
          // Sync appState to global variables before saving
          if (window.app && window.app.syncGlobalVariables) {
            window.app.syncGlobalVariables();
          }
          this.appState.saveHistory();

          // Debug: Check data integrity before save
          console.log(`🔍 Pre-save data check:`, {
            appStatePinsLength: this.appState.pins.length,
            windowPinsLength: window.pins?.length || 'undefined',
            saveAppStateAvailable: !!this.saveAppState,
            storageKey: window.STORAGE_KEY,
            firstPin: this.appState.pins.length > 0 ? { id: this.appState.pins[0].id, x: this.appState.pins[0].x, y: this.appState.pins[0].y } : 'no pins',
            pinsIsArray: Array.isArray(this.appState.pins),
            pinsType: typeof this.appState.pins
          });

          // Test JSON serialization
          try {
            const testJson = JSON.stringify(this.appState.pins);
            console.log(`🔍 JSON serialization test: success, length=${testJson.length}`);
          } catch (e) {
            console.error(`🔍 JSON serialization test: FAILED`, e);
          }

          // Also save to localStorage for persistence
          if (this.saveAppState) {
            console.log(`💾 Calling saveAppState...`);
            this.saveAppState(this.appState);
          } else {
            console.error(`❌ saveAppState function not available!`);
          }
          console.log(`✅ History saved after delay`);
        }, 50);

        // Verify localStorage was updated
        setTimeout(() => {
          try {
            console.log(`🔍 Checking localStorage with key:`, window.STORAGE_KEY || 'msc-investigativeboard');
            const stored = localStorage.getItem(window.STORAGE_KEY || 'msc-investigativeboard');
            console.log(`🔍 Raw localStorage data:`, stored ? stored.substring(0, 200) + '...' : 'null');

            if (stored) {
              const parsed = JSON.parse(stored);
              console.log(`🔍 Parsed localStorage structure:`, {
                hasDocument: !!parsed.document,
                hasView: !!parsed.view,
                documentKeys: parsed.document ? Object.keys(parsed.document) : [],
                pinsCount: parsed.document?.pins?.length || 0,
                connectionsCount: parsed.document?.connections?.length || 0
              });

              console.log(`🔍 Post-save localStorage check: pins=${parsed.document?.pins?.length || 0}, connections=${parsed.document?.connections?.length || 0}`);
            } else {
              console.log(`🔍 Post-save localStorage check: no data found in localStorage`);
            }
          } catch (e) {
            console.error(`🔍 Error checking localStorage:`, e);
          }
        }, 100);

        // Trigger render to show the new pin and connection
        if (window.app && window.app.render) {
          window.app.render();
        }
        // Stop marquee animation briefly after connection creation, but restart if still in parent mode
        this.stopMarqueeAnimation();
        if (this.appState.connectionMode === 'parent') {
          // Restart animation for parent mode (brief pause to avoid spam)
          setTimeout(() => this.startMarqueeAnimation(), 100);
        }
      } else {
        // Pin creation failed - conditions not met
      }

    this.draw();
    }


    // Reset interaction flags (legacy support)
    this.isPanning = false;
    this.isDraggingPin = false;
    this.isDraggingArea = false;
    this.isCreatingText = false;
    this.isMarqueeSelecting = false;
    this.dragPinIndex = null;
    this.isDragManagerDragging = false; // Track drag manager state

    // Reset area drag state
    this.areaDragStart = null;
    this.areaDragCurrent = null;

    // Reset drag-to-line tracking
    this.dragStartPinIndex = null;
    this.isDraggingFromPin = false;
    this.isDragManagerDragging = false; // Clear drag manager tracking

    this.draw();
  }

  // Update marquee animation offset for "marching ants" effect
  updateMarqueeAnimation() {
    const now = Date.now();
    if (now - this.lastMarqueeUpdate > 50) { // Update every 50ms
      this.marqueeAnimationOffset = (this.marqueeAnimationOffset + this.marqueeAnimationSpeed) % 20;
      this.lastMarqueeUpdate = now;
    }
  }

  // Start continuous marquee animation
  startMarqueeAnimation() {
    if (this.marqueeAnimationId) return; // Already running

    // Clear any existing marquee animation to prevent conflicts
    this.stopMarqueeAnimation();

    let lastDrawTime = 0;
    let frameCount = 0;
    const startTime = Date.now();

    const animate = (timestamp) => {
      frameCount++;

      // Safety check: stop animation after 5 minutes to prevent infinite loops
      if (Date.now() - startTime > 300000) { // 5 minutes
        console.warn("Marquee animation running for too long, stopping automatically");
        this.stopMarqueeAnimation();
        return;
      }

      // Check if we still need to animate
      const hasActiveMarquee = this.appState.connectStartIndex !== null ||
                              this.isDraggingArea ||
                              this.isResizingArea;

      if (hasActiveMarquee) {
        // Throttle drawing to ~10fps to reduce CPU usage significantly
        // Only draw every 6th frame to further reduce frequency
        if (timestamp - lastDrawTime > 100 && frameCount % 6 === 0) { // ~10fps, every 6th frame
          // Only draw if we're not in the middle of another draw operation
          if (window.app && !window.app.isDrawing) {
            window.app.isDrawing = true;
            try {
              window.app.draw();
            } finally {
              window.app.isDrawing = false;
            }
            lastDrawTime = timestamp;
          }
        }
        this.marqueeAnimationId = requestAnimationFrame(animate);
      } else {
        this.stopMarqueeAnimation();
      }
    };

    this.marqueeAnimationId = requestAnimationFrame(animate);
  }

  // Stop marquee animation
  stopMarqueeAnimation() {
    if (this.marqueeAnimationId) {
      cancelAnimationFrame(this.marqueeAnimationId);
      this.marqueeAnimationId = null;
    }
  }

  // Force stop marquee animation and clear related state
  forceStopMarqueeAnimation() {
    this.stopMarqueeAnimation();
    // Clear any stale connection state
    if (this.appState) {
      this.appState.connectStartIndex = null;
      this.appState.connectMousePos = null;
      this.appState.connectionMode = null;
    }
  }

  // Draw animated marquee (marching ants) - now only handles connection marquees
  // Area marquees are drawn in the main app.js draw loop
  drawAnimatedMarquee() {
    // Connection marquee drawing is now handled in the main app.js draw function
    // This function is kept for the animation loop structure but doesn't draw anything
  }

  // Canvas double click handler
  handleCanvasDoubleClick(e) {
    console.log(`👆 Double-click detected at (${e.clientX}, ${e.clientY})`);
    e.preventDefault();
    const mousePos = this.getMousePos(e);
    const mouseWorld = mousePos.world;
    const clickedPinIndex = this.findPinAt(mouseWorld.x, mouseWorld.y);

    console.log(`📍 Double-click world coords: (${mouseWorld.x}, ${mouseWorld.y}), found pin: ${clickedPinIndex}`);

    if (clickedPinIndex !== null) {
      // Check if it's a text pin (bubble or rectangle shape)
      const pin = this.appState.pins[clickedPinIndex];
      const isTextPin = pin && (pin.shape === 'bubble' || pin.shape === 'rectangle');

      if (isTextPin) {
        // Stop marquee animation when opening modal
        this.stopMarqueeAnimation();

        // Open text modal for text pin editing
        if (window.openTextModal) {
          console.log(`📝 Opening text modal for text pin ${clickedPinIndex}`);
          window.openTextModal({
            id: pin.id,
            x: e.clientX,
            y: e.clientY,
            initialText: pin.label || '',
            width: pin.width || 200,
            height: pin.height || 50
          });
        } else {
          console.error(`❌ Text modal not available`);
        }
      } else {
        // Stop marquee animation when opening modal
        this.stopMarqueeAnimation();

        // Open modal for pin editing
        if (window.app && window.app.modalManager && window.app.modalManager.openPinModal) {
          console.log(`📝 Opening modal for pin ${clickedPinIndex}`);
          window.app.modalManager.openPinModal(clickedPinIndex);
        } else {
          console.error(`❌ Modal manager not available:`, {
            app: !!window.app,
            modalManager: !!(window.app && window.app.modalManager),
            openPinModal: !!(window.app && window.app.modalManager && window.app.modalManager.openPinModal)
          });
        }
      }
    } else {
      console.log(`❌ No pin found at double-click location`);
    }
  }

  // Canvas context menu handler
  handleCanvasContextMenu(e) {
    console.log("🎯 Context menu prevented at:", e.clientX, e.clientY, "target:", e.target, "altKey:", e.altKey);
    e.preventDefault(); // Prevent default context menu
    e.stopPropagation(); // Stop event bubbling
    e.stopImmediatePropagation(); // Stop other handlers
    return false; // Extra prevention for browser context menu

    // Right-click handling is done in mouseDown handler to set parent pins
    // Context menu event is prevented to avoid browser menu
    // Modal opening is handled by double-click, not right-click
  }

  // Canvas drag over handler (allows dropping)
  handleCanvasDragOver(e) {
    e.preventDefault(); // Allow drop
    e.dataTransfer.dropEffect = "copy";
  }

  // Canvas drop handler (handles dropped cards)
  handleCanvasDrop(e) {
    e.preventDefault();

    const cardId = e.dataTransfer.getData("cardId");
    if (!cardId) {
      return;
    }

    // Get drop position
    const mousePos = this.getMousePos(e);
    const mouseWorld = mousePos.world;


    // Find the card data
    const card = window.appState?.cards?.find(c => c.id === parseInt(cardId));
    if (!card) {
      return;
    }


    // Create a pin from the card
    const newPin = {
      x: mouseWorld.x,
      y: mouseWorld.y,
      color: card.color,
      label: card.title,
      note: card.subtitle + "\n" + card.date,
      date: card.date,
      typeId: "card:card", // Use card type instead of pin type
      pinScale: 1
    };

    // Mark card as used
    card.used = true;

    // Add pin to state
    window.appState.pins.push(newPin);
    const newIndex = window.appState.pins.length - 1;

    // Select the new pin
    window.appState.selectedPinIndex = newIndex;

    // Card drop should be undoable
    window.appState.saveHistory();

    // Re-render
    this.draw();

    // Re-render tray to show card as used
    if (window.app && window.app.trayManager) {
      window.app.trayManager.render();
    }

  }

  // Keyboard handler
  handleKeyDown(e) {
    // Track modifier key states
    if (e.key === 'Alt') this.altKeyPressed = true;
    if (e.key === 'Control') this.ctrlKeyPressed = true;
    if (e.key === 'Shift') this.shiftKeyPressed = true;

    // Don't process shortcuts when typing in input fields, but allow ESC
    const activeElement = document.activeElement;
    const isInputField = activeElement && (
      activeElement.tagName === 'INPUT' ||
      activeElement.tagName === 'TEXTAREA' ||
      activeElement.contentEditable === 'true'
    );

    // Allow ESC key even in input fields (it's a cancel action, not a shortcut)
    if (isInputField && e.key !== 'Escape') {
      // Allow normal typing behavior in input fields for non-ESC keys
      return;
    }

    // Handle key commands using command map
    const command = this.keyCommands[e.key];
    if (command) {
      e.preventDefault();
      command();
      return;
    }

    // Handle conditional keys (numbers with modifier checks)
    if (e.key >= '1' && e.key <= '3' && !e.shiftKey && !e.ctrlKey && !e.altKey) {
      e.preventDefault();
      const typeMap = { '1': 'pin', '2': 'card', '3': 'area' };
      this.cycleTypeInFamily(typeMap[e.key]);
      return;
    }
    // Handle text tool cycling (4 key when text tool is active)
    else if (this.appState.currentTool === 'text' && e.key === '4' && !e.ctrlKey && !e.metaKey && !e.shiftKey && !e.altKey) {
      e.preventDefault();
      this.cycleTextType();
    }
    // Handle Shift+1,2,3: Change selected pin type (if pin is selected)
    else if ((e.key === '!' || (e.key === '1' && e.shiftKey)) && !e.ctrlKey && !e.altKey) {
      e.preventDefault();
      this.cycleSelectedPinType('pin');
    } else if ((e.key === '@' || (e.key === '2' && e.shiftKey)) && !e.ctrlKey && !e.altKey) {
      e.preventDefault();
      this.cycleSelectedPinType('card');
    }
    // Handle Shift+Number: Quick color selection (Shift+1=first color, Shift+2=second color, etc.)
    // Note: This conflicts with Shift+1,2,3 for pin type selection - prioritize pin type selection
    else if (e.shiftKey && !e.ctrlKey && !e.altKey && e.key >= '4' && e.key <= '9') {
      e.preventDefault();
      const colorIndex = parseInt(e.key) - 1; // Convert "4" to index 3, "5" to index 4, etc.
      const currentPalette = typeof getPalette === 'function' ? getPalette() : [];
      if (colorIndex < currentPalette.length) {
        if (typeof setSelectedColor === 'function') {
          setSelectedColor(currentPalette[colorIndex].value);
          console.log(`🎨 Shift+${e.key}: Selected color ${currentPalette[colorIndex].value}`);
          // Update toolbar if it exists
          if (typeof renderToolbar === 'function') {
            renderToolbar();
          }
        }
      }
    }
    // Handle radial menu navigation when menu is open
    else if (window.isRadialMenuOpen) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (typeof window.executeSelectedRadialItem === 'function') {
          window.executeSelectedRadialItem();
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        if (typeof window.closeRadialMenu === 'function') {
          window.closeRadialMenu();
        }
      }
    } else if (e.key === 'Delete' || e.key === 'Backspace') {
      // Delete selected pin
      if (this.appState.selectedPinIndex !== null) {
        // Delete selected pin
        this.appState.pins.splice(this.appState.selectedPinIndex, 1);
        this.setSelectedPin(null);
        this.appState.saveHistory();
        if (this.saveAppState) {
          this.saveAppState(this.appState);
        }
        this.draw();
      }
    } else if (e.key === 'f' || e.key === 'F') {
      // Frame all pins
      this.frameAllPins();
    } else if (e.key === 'Escape' && (this.appState.connectStartIndex !== null || this.marqueeAnimationId)) {
      // Force stop marquee animation if it's stuck
      console.log("🎯 Force stopping marquee animation");
      this.forceStopMarqueeAnimation();
      this.draw();
    } else if (e.key === 'Escape') {
      console.log(`🎯 ESC key pressed - checking for modals/marquee to cancel`);

      // First check if any modals are open
      const pinModal = document.getElementById("pin-modal");
      const cardModal = document.getElementById("card-modal");
      const addColorModal = document.getElementById("add-color-modal");
      const loadModal = document.getElementById("load-modal");

      let modalClosed = false;

      // Close pin modal if open
      if (pinModal && pinModal.style.display !== "none") {
        if (typeof closePinModal === 'function') {
          closePinModal();
          modalClosed = true;
          console.log(`🎯 Escape: Closed pin modal`);
        }
      }

      // Close card modal if open
      if (cardModal && cardModal.style.display !== "none") {
        if (typeof closeCardModal === 'function') {
          closeCardModal();
          modalClosed = true;
          console.log(`🎯 Escape: Closed card modal`);
        }
      }

      // Close add color modal if open
      if (addColorModal && addColorModal.style.display !== "none") {
        if (typeof closeAddColorModal === 'function') {
          closeAddColorModal();
          modalClosed = true;
          console.log(`🎯 Escape: Closed add color modal`);
        }
      }

      // Close load modal if open
      if (loadModal && loadModal.style.display !== "none") {
        if (typeof closeLoadModal === 'function') {
          closeLoadModal();
          modalClosed = true;
          console.log(`🎯 Escape: Closed load modal`);
        }
      }

      // If no modal was closed, check for radial menu
      if (!modalClosed) {
        if (typeof closeRadialMenu === 'function' && typeof radialMenuEl !== 'undefined' &&
            radialMenuEl && radialMenuEl.style.display !== 'none') {
          console.log(`🎯 Escape: Closing radial menu`);
          closeRadialMenu();
        }
      }

      // Always cancel marquee and deselect active pins
      const hadActiveConnection = this.appState.connectStartIndex !== null;
      const hadSelectedPin = this.appState.selectedPinIndex !== null;

      this.setSelectedPin(null);
      this.selectedPins = [];
      this.appState.connectStartIndex = null;
      this.appState.connectMousePos = null;
      this.appState.connectionMode = null;

      // Clear all drag states
      this.isDragManagerDragging = false;
      this.isDraggingPin = false;
      this.isDraggingArea = false;
      this.dragPinIndex = null;

      // End any active drag operations
      if (window.dragManager) {
        window.dragManager.endDrag();
      }

      this.stopMarqueeAnimation(); // Stop marquee animation

      console.log(`🎯 Escape: Cleared selections and connection modes`);
      if (hadActiveConnection) console.log(`   ↳ Cancelled active marquee/connection`);
      if (hadSelectedPin) console.log(`   ↳ Deselected active pin`);

      this.draw();
    } else if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
      // Undo (Ctrl+Z / Cmd+Z)
      e.preventDefault();
      if (this.appState && this.appState.undo) {
        const success = this.appState.undo();
        if (success) {
          // Update global state after undo
          if (window.app && window.app.syncGlobalVariables) {
            window.app.syncGlobalVariables();
          }
          // Update UI after undo
          if (window.app && window.app.updatePinInfo) {
            window.app.updatePinInfo();
          }
          this.draw();
          console.log('↶ Undo performed');
        }
      }
    } else if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
      // Select all pins (Ctrl+A)
      e.preventDefault();
      this.selectedPins = this.appState.pins.map((_, index) => index);
      if (this.selectedPins.length > 0) {
        this.setSelectedPin(this.selectedPins[0]);
      }
      this.draw();
    } else if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
      // Copy selected pins (Ctrl+C)
      e.preventDefault();
      if (this.selectedPins.length > 0) {
        this.clipboardPins = this.selectedPins.map(index => ({
          ...this.appState.pins[index],
          x: this.appState.pins[index].x + 20, // Offset for paste position
          y: this.appState.pins[index].y + 20
        }));
      }
    } else if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
      // Paste pins (Ctrl+V)
      e.preventDefault();
      if (this.clipboardPins.length > 0) {
        this.clipboardPins.forEach(pinData => {
          const newPin = { ...pinData };
          this.appState.pins.push(newPin);
        });
        this.appState.saveHistory();
        if (this.saveAppState) {
          this.saveAppState(this.appState);
        }
        this.draw();
      }
    } else if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      // Save state (Ctrl+S)
      e.preventDefault();
      if (this.appState && this.appState.saveState) {
        this.appState.saveState();
        console.log('💾 State saved');
      }
    } else if (e.key === 'l' || e.key === 'L') {
      // Toggle connection type (L)
      e.preventDefault();
      if (this.appState) {
        this.appState.connectionType = this.appState.connectionType === "curved" ? "straight" : "curved";
        this.appState.saveState();
        console.log(`🔗 Connection type: ${this.appState.connectionType}`);
        this.draw();
      }
    } else if (e.shiftKey) {
      this.handleShiftShortcuts(e);
    }
  }

  // Handle key up events to track modifier key releases
  handleKeyUp(e) {
    if (e.key === 'Alt') this.altKeyPressed = false;
    if (e.key === 'Control') this.ctrlKeyPressed = false;
    if (e.key === 'Shift') this.shiftKeyPressed = false;
  }

  // Select a tool
  selectTool(toolId) {
    this.appState.currentTool = toolId;

    // Update toolbar if available
    if (window.app && window.app.toolbarManager) {
      window.app.toolbarManager.render();
    }
  }

  // Cycle through text types
  cycleTextType() {
    if (this.appState.currentTextType) {
      const textTypes = ["plain", "rectangle", "comic", "title"];
      const currentIndex = textTypes.indexOf(this.appState.currentTextType);
      const nextIndex = (currentIndex + 1) % textTypes.length;
      this.appState.currentTextType = textTypes[nextIndex];
      console.log(`📝 Text type cycled to: ${this.appState.currentTextType}`);

      // Update UI if available
      if (window.renderMenu) {
        window.renderMenu();
      }
    }
  }

  // Toggle connection type (straight/curved)
  toggleConnectionType() {
    if (this.appState) {
      this.appState.connectionType = this.appState.connectionType === "curved" ? "straight" : "curved";
      this.appState.saveState();
      console.log(`🔗 Connection type: ${this.appState.connectionType}`);
      this.draw();
    }
  }

  // Frame all pins in view
  frameAllPins() {
    if (this.appState.pins.length === 0) return;

    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;

    this.appState.pins.forEach(pin => {
      minX = Math.min(minX, pin.x);
      maxX = Math.max(maxX, pin.x);
      minY = Math.min(minY, pin.y);
      maxY = Math.max(maxY, pin.y);
    });

    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    const padding = 50;

    const canvasWidth = this.canvas.width / window.devicePixelRatio;
    const canvasHeight = this.canvas.height / window.devicePixelRatio;
    const contentWidth = maxX - minX + padding * 2;
    const contentHeight = maxY - minY + padding * 2;

    const scaleX = canvasWidth / contentWidth;
    const scaleY = canvasHeight / contentHeight;
    const newScale = Math.min(scaleX, scaleY, 1); // Don't zoom in beyond 100%

    this.appState.scale = Math.max(newScale, 0.1); // Minimum scale
    this.appState.offsetX = canvasWidth / 2 - centerX * this.appState.scale;
    this.appState.offsetY = canvasHeight / 2 - centerY * this.appState.scale;

    // Sync globals and save
    if (window.app && window.app.syncGlobalVariables) {
      window.app.syncGlobalVariables();
    }
    this.appState.saveHistory(); // View changes should be undoable
    this.draw();

    console.log(`📐 Framed all pins: scale=${this.appState.scale.toFixed(2)}, center=(${centerX.toFixed(0)}, ${centerY.toFixed(0)})`);
  }

  // Cycle through types within a family
  cycleTypeInFamily(family) {
    const types = window.NODE_TYPES ? window.NODE_TYPES.filter(t => t.family === family) : [];
    if (types.length === 0) {
      return;
    }

    // Ensure we have a selectedTypeByFamily object
    this.appState.selectedTypeByFamily = this.appState.selectedTypeByFamily || {};

    // Get current type index for this family
    let currentIndex = this.appState.selectedTypeByFamily[family] || 0;

    // Cycle to next type
    currentIndex = (currentIndex + 1) % types.length;
    this.appState.selectedTypeByFamily[family] = currentIndex;

    // Set this family as active and update current type ID
    this.appState.currentTool = family;
    this.appState.currentFamily = family;

    // Update current type ID via toolbar manager
    if (window.app && window.app.toolbarManager) {
      window.app.toolbarManager.updateCurrentTypeId();
      window.app.toolbarManager.render();
    }
  }

  cycleSelectedPinType(family) {
    // Check if there's a selected pin
    const selectedPinIndex = this.appState.selectedPinIndex;
    if (selectedPinIndex === null || selectedPinIndex === undefined) {
      return; // No pin selected
    }

    const pin = this.appState.pins[selectedPinIndex];
    if (!pin) {
      return; // Pin not found
    }

    // Special handling for area pins: change the center pin type, not the area shape
    if (pin.typeId && pin.typeId.startsWith('area:')) {
      if (family === 'card') {
        // Shift+2: Cycle through card types
        const cardTypes = [
          'card:card',
          'card:doc',
          'card:folder'
        ];

        const currentPinType = pin.pinType || 'card:card';
        let currentIndex = cardTypes.indexOf(currentPinType);

        if (currentIndex === -1) {
          // If current type is not a card type, start from first card type
          currentIndex = 0;
        } else {
          currentIndex = (currentIndex + 1) % cardTypes.length;
        }

        pin.pinType = cardTypes[currentIndex];
        console.log(`🔄 Area pin card type cycled to: ${pin.pinType}`);
      } else {
        // Shift+1: Cycle through pin types
        const pinTypes = [
          'pin:circle',
          'pin:square',
          'pin:pill',
          'pin:diamond',
          'pin:person',
          'pin:business-building'
        ];

        const currentPinType = pin.pinType || 'pin:circle';
        let currentIndex = pinTypes.indexOf(currentPinType);

        if (currentIndex === -1) {
          // If current type is not a pin type, start from first pin type
          currentIndex = 0;
        } else {
          currentIndex = (currentIndex + 1) % pinTypes.length;
        }

        pin.pinType = pinTypes[currentIndex];
        console.log(`🔄 Area pin center type cycled to: ${pin.pinType}`);
      }
    } else {
      // Regular pins: change the typeId as before
      // Get all types for this family
      const types = window.NODE_TYPES ? window.NODE_TYPES.filter(t => t.family === family) : [];
      if (types.length === 0) {
        return;
      }

      // Find current type index within this family
      const currentTypeId = pin.typeId || pin.id;
      let currentIndex = types.findIndex(t => t.id === currentTypeId);

      // If current type not found in family, start from beginning
      if (currentIndex === -1) {
        currentIndex = 0;
      } else {
        // Cycle to next type
        currentIndex = (currentIndex + 1) % types.length;
      }

      // Update pin type
      const newType = types[currentIndex];
      pin.typeId = newType.id;
      pin.variant = newType.variant; // Also update the variant for proper rendering
    }

    // Save history (handles persistence automatically)
    this.appState.saveHistory();
    if (this.saveAppState) {
      this.saveAppState(this.appState);
    }
    this.draw();

    // Update pin info panel if visible
    if (window.app && window.app.updatePinInfo) {
      window.app.updatePinInfo();
    }
  }


  // Handle Shift+key shortcuts
  handleShiftShortcuts(e) {
    // Shift+1: Cycle pin shapes
    if (e.key === '1') {
      e.preventDefault();
      if (this.appState.selectedPinIndex !== null) {
        const pin = this.appState.pins[this.appState.selectedPinIndex];
        if (pin && pin.typeId && pin.typeId.startsWith("pin:")) {
          const pinTypes = ["pin:circle", "pin:square", "pin:pill", "pin:diamond", "pin:person", "pin:business-building"];
          const currentIndex = pinTypes.indexOf(pin.typeId);
          const nextIndex = (currentIndex + 1) % pinTypes.length;
          pin.typeId = pinTypes[nextIndex];
          this.appState.saveHistory(); // Type changes should be undoable
          this.draw();
        } else {
        }
      } else {
      }
    }
    // Shift+2: Cycle card shapes
    else if (e.key === '2') {
      e.preventDefault();
      if (this.appState.selectedPinIndex !== null) {
        const pin = this.appState.pins[this.appState.selectedPinIndex];
        if (pin && pin.typeId && pin.typeId.startsWith("card:")) {
          const cardTypes = ["card:card", "card:doc", "card:folder"];
          const currentIndex = cardTypes.indexOf(pin.typeId);
          const nextIndex = (currentIndex + 1) % cardTypes.length;
          pin.typeId = cardTypes[nextIndex];
          this.saveAppState(this.appState);
          this.draw();
        }
      }
    }
    // Shift+3: Cycle area shapes
    else if (e.key === '3') {
      e.preventDefault();
      if (this.appState.selectedPinIndex !== null) {
        const pin = this.appState.pins[this.appState.selectedPinIndex];
        if (pin && pin.typeId && pin.typeId.startsWith("area:")) {
          const areaTypes = ["area:circle"];
          // For now, only one area type, but can be extended
          const currentIndex = areaTypes.indexOf(pin.typeId);
          const nextIndex = (currentIndex + 1) % areaTypes.length;
          pin.typeId = areaTypes[nextIndex];
          this.saveAppState(this.appState);
          this.draw();
        }
      }
    }
  }


  // Cleanup event handlers
  destroy() {
    // Remove event listeners using pre-bound methods to prevent memory leaks
    // Temporarily disabled pointer events
    // this.canvas.removeEventListener("pointermove", this.handleCanvasPointerMove);
    // this.canvas.removeEventListener("pointerup", this.handleCanvasPointerUp);
    this.canvas.removeEventListener("mousedown", this.handleCanvasMouseDown);
    this.canvas.removeEventListener("mousemove", this.handleCanvasMouseMove);
    this.canvas.removeEventListener("mouseup", this.handleCanvasMouseUp);
    this.canvas.removeEventListener("dblclick", this.handleCanvasDoubleClick);
    this.canvas.removeEventListener("contextmenu", this.handleCanvasContextMenu);
    this.canvas.removeEventListener("dragover", this.handleCanvasDragOver);
    this.canvas.removeEventListener("drop", this.handleCanvasDrop);
    this.canvas.removeEventListener("wheel", this.handleWheel);
    window.removeEventListener("keydown", this.handleKeyDown);
    window.removeEventListener("keyup", this.handleKeyUp);

    // Clear any pending timeouts
    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout);
      this.connectionTimeout = null;
    }

    console.log("🧹 Event handlers destroyed - memory leaks prevented");
  }

  // Handle mouse wheel for zooming and scrolling
  handleWheel(e) {
    // Completely ignore wheel events during any drag operation to prevent accidental actions
    if ((window.dragManager && window.dragManager.isCurrentlyDragging()) ||
        this.isMarqueeSelecting) {
      return; // Ignore wheel events during drag operations
    }

    e.preventDefault();


    // Handle scrolling with modifier keys
    if (e.shiftKey) {
      // Shift + wheel = horizontal pan (left/right)
      const panSpeed = 30;

      // Try to detect direction from any available wheel properties
      let direction = 1; // Default

      // Check various wheel properties that might contain direction info
      if (e.deltaX !== undefined && Math.abs(e.deltaX) > 0) {
        direction = Math.sign(e.deltaX);
      } else if (e.deltaY !== undefined && Math.abs(e.deltaY) > 0) {
        // Sometimes deltaY has small values even with modifiers
        direction = Math.sign(e.deltaY);
      } else if (e.wheelDelta !== undefined && Math.abs(e.wheelDelta) > 0) {
        direction = Math.sign(e.wheelDelta);
      } else if (e.wheelDeltaY !== undefined && Math.abs(e.wheelDeltaY) > 0) {
        direction = Math.sign(e.wheelDeltaY);
      } else if (e.detail !== undefined && Math.abs(e.detail) > 0) {
        direction = Math.sign(e.detail);
      } else {
        // Fallback: alternate directions based on timing
        const now = Date.now();
        if (now - this._lastShiftScrollTime < 300) {
          this._shiftScrollDirection *= -1;
        }
        this._lastShiftScrollTime = now;
        direction = this._shiftScrollDirection;
      }

      this.appState.offsetX += direction * panSpeed;
      this.draw();
      return;
    } else if (e.altKey || e.metaKey) {
      // Alt/Cmd + wheel = vertical pan (up/down)
      const panSpeed = 30;

      let direction = 1; // Default

      if (e.deltaX !== undefined && Math.abs(e.deltaX) > 0) {
        direction = Math.sign(e.deltaX);
      } else if (e.deltaY !== undefined && Math.abs(e.deltaY) > 0) {
        direction = Math.sign(e.deltaY);
      } else if (e.wheelDelta !== undefined && Math.abs(e.wheelDelta) > 0) {
        direction = Math.sign(e.wheelDelta);
      } else if (e.wheelDeltaY !== undefined && Math.abs(e.wheelDeltaY) > 0) {
        direction = Math.sign(e.wheelDeltaY);
      } else if (e.detail !== undefined && Math.abs(e.detail) > 0) {
        direction = Math.sign(e.detail);
      } else {
        // Fallback: alternate directions
        const now = Date.now();
        if (now - this._lastAltScrollTime < 300) {
          this._altScrollDirection *= -1;
        }
        this._lastAltScrollTime = now;
        direction = this._altScrollDirection;
      }

      this.appState.offsetY += direction * panSpeed;
      this.draw();
      return;
    }

    // No modifier = zoom (original behavior)
    const zoomSpeed = 1.05;
    // Determine if zooming in (deltaY < 0) or out (deltaY > 0)
    const delta = e.deltaY > 0 ? 1 / zoomSpeed : zoomSpeed;

    // Get the mouse position relative to the canvas
    if (!this.canvasContainer) {
      this.canvasContainer = document.getElementById("canvas-container");
      if (!this.canvasContainer) {
        console.error("Canvas container not found for wheel event!");
        return;
      }
    }

    const rect = this.canvasContainer.getBoundingClientRect();
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;

    // Validate coordinates are within reasonable bounds
    const containerWidth = rect.width;
    const containerHeight = rect.height;
    if (screenX < -100 || screenX > containerWidth + 100 ||
        screenY < -100 || screenY > containerHeight + 100) {
      console.warn("Wheel event coordinates outside canvas bounds:", screenX, screenY, "container:", containerWidth, containerHeight);
      return;
    }

    // Calculate the world coordinate under the mouse before scaling
    const worldBeforeZoom = this.screenToWorld(screenX, screenY);
    const wx = worldBeforeZoom.x;
    const wy = worldBeforeZoom.y;

    // Apply the scale change
    const oldScale = this.appState.scale;
    this.appState.scale *= delta;
    this.appState.scale = Math.max(window.MIN_SCALE || 0.1, Math.min(window.MAX_SCALE || 5, this.appState.scale));

    // If scale didn't change (hit min/max), do nothing
    if (this.appState.scale === oldScale) return;

    // Adjust the offset to keep the zoom centered on the mouse cursor
    // After scaling, the world coordinate (wx, wy) should still be at the same screen position
    this.appState.offsetX = screenX - wx * this.appState.scale;
    this.appState.offsetY = screenY - wy * this.appState.scale;

    // Sync global variables and save state (single source of truth)
    if (window.app && window.app.syncGlobalVariables) {
      window.app.syncGlobalVariables();
    }
    this.saveAppState(this.appState);

    // Redraw
    if (window.app && window.app.render) {
      window.app.render();
    }
  }
}

// Export for global access
console.log("EventHandlers class defined, exporting to window...");
try {
  window.EventHandlers = EventHandlers;
  console.log("EventHandlers exported successfully:", typeof window.EventHandlers);
} catch (error) {
  console.error("Failed to export EventHandlers:", error);
}
