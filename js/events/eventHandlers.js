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
    } else if (this.isDraggingArea) {
      this.isUserInteracting = true;
      // Convert mouse coordinates to canvas-relative
      const canvas = document.getElementById("board");
      const canvasContainer = document.getElementById("canvas-container");
      const rect = canvasContainer.getBoundingClientRect();
      const canvasX = e.clientX - rect.left;
      const canvasY = e.clientY - rect.top;
      this.areaDragCurrent = this.screenToWorld(canvasX, canvasY);
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

    console.log(`🎯 Mouse down: screen(${e.clientX}, ${e.clientY}) -> container(${canvasX}, ${canvasY}) -> world(${mouseWorld.x}, ${mouseWorld.y})`);
    console.log(`   Container rect: (${containerRect.left}, ${containerRect.top}, ${containerRect.width}, ${containerRect.height})`);
    console.log(`   App scale: ${this.appState.scale}, offset: (${this.appState.offsetX}, ${this.appState.offsetY})`);

    // Reset interaction flags
    this.isPanning = false;
    this.isDraggingPin = false;
    this.isDraggingText = false;
    this.isDraggingArea = false;
    this.isCreatingText = false;
    this.isMarqueeSelecting = false;
    this.didDrag = false;
    this.totalMovement = 0;

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
      console.log(`👆 Left-click: screen(${e.clientX}, ${e.clientY}) -> canvas(${canvasX}, ${canvasY}) -> world(${mouseWorld.x}, ${mouseWorld.y}), clickedPin=${clickedPinIndex}, tool=${currentTool}`);

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
      } else if (currentTool === "pin") {
        // Pin tool - select existing pin or prepare for drag
        console.log(`🎯 Pin tool: clickedPinIndex=${clickedPinIndex}, currentTool=${currentTool}`);
        if (clickedPinIndex !== null) {
          // Clicked on existing pin - select it
          this.setSelectedPin(clickedPinIndex);
          this.isDraggingPin = true;
          this.dragPinIndex = clickedPinIndex;
          this.selectedPins = [clickedPinIndex];
          // Set as connection source for next pin placement (sequential mode)
          this.appState.connectStartIndex = clickedPinIndex;
          this.appState.connectionMode = 'sequential';
        } else {
          // Clicked on empty space - will handle in mouse up for pin creation
          console.log(`👆 Left-click: Empty space clicked at (${mouseWorld.x}, ${mouseWorld.y}), will create pin on mouse up`);
        }
      } else if (currentTool === "text") {
        // Text tool - will handle in mouse up
        console.log(`👆 Left-click: Text tool on empty space`);
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

    console.log(`🎯 Right-click debug: clickedPin=${clickedPinIndex}, connectStartIndex=${this.appState.connectStartIndex}`);

    if (clickedPinIndex !== null) {
      // Right-click on pin - set as hub/parent for multiple connections
      console.log(`🎯 Right-click: Setting pin ${clickedPinIndex} as HUB for multiple connections`);
      this.setSelectedPin(clickedPinIndex);
      this.appState.connectStartIndex = clickedPinIndex;
      this.appState.connectionMode = 'parent'; // Set parent/hub mode
      this.draw(); // Update to show connection marquee
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

    if (this.isMarqueeSelecting) {
      this.marqueeEnd = this.screenToWorld(canvasX, canvasY);
      this.draw();
    }

    // Track mouse position for connection preview line
    if (this.appState.connectStartIndex !== null) {
      this.appState.connectMousePos = this.screenToWorld(canvasX, canvasY);
      this.draw();
    }

    // Handle pin dragging (moved from pointer handler)
    if (this.isDraggingPin && this.dragPinIndex !== null) {
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
    }
  }

  // Canvas mouse up handler
  handleCanvasMouseUp(e) {
    // Convert mouse coordinates to canvas-relative
    const canvasContainer = document.getElementById("canvas-container");
    const containerRect = canvasContainer.getBoundingClientRect();

    // Simple approach: use container coordinates directly
    const canvasX = e.clientX - containerRect.left;
    const canvasY = e.clientY - containerRect.top;
    const mouseWorld = this.screenToWorld(canvasX, canvasY);


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
    }

    // Handle connection creation if connectStartIndex is set
    if (!this.didDrag && !this.isMarqueeSelecting && this.appState.connectStartIndex !== null) {
      const clickedPinIndex = this.findPinAt(mouseWorld.x, mouseWorld.y);
      if (clickedPinIndex !== null && clickedPinIndex !== this.appState.connectStartIndex) {
        // Create connection between existing pins
        const connection = {
          startIndex: this.appState.connectStartIndex,
          endIndex: clickedPinIndex,
          color: this.appState.selectedColor,
          type: "straight"
        };
        this.appState.connections.push(connection);
        this.appState.saveHistory();
        // Reset connection mode after connecting to existing pin
        this.appState.connectStartIndex = null;
        this.appState.connectMousePos = null;
        this.draw();
        return; // Don't create a new pin
      }
      // If clicked on empty space or same pin, continue to pin creation logic below
      // which will handle creating a new pin and connecting it
    }

    // Create pin if clicking on empty space with a pin/card/area type selected
    if (!this.didDrag && !this.isMarqueeSelecting) {
      const clickedPinIndex = this.findPinAt(mouseWorld.x, mouseWorld.y);
      const isCreationTool = ["pin", "card", "area"].includes(this.appState.currentTool);

      // Debug logging for click registration issues
      console.log(`🖱️ Click attempt: didDrag=${this.didDrag}, isMarquee=${this.isMarqueeSelecting}, clickedPin=${clickedPinIndex}, tool=${this.appState.currentTool}, typeId=${this.appState.currentTypeId}, isCreationTool=${isCreationTool}`);

      if (clickedPinIndex === null && this.appState.currentTypeId && isCreationTool) {
        // Create new pin at click location
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
          newPin.title = "";
          newPin.description = "";
        }

        this.appState.pins.push(newPin);
        const newIndex = this.appState.pins.length - 1;

        console.log(`   Pin created at: (${newPin.x}, ${newPin.y})`);

        // Create connection if we have a connection source
        if (this.appState.connectStartIndex !== null) {
          const connection = {
            startIndex: this.appState.connectStartIndex,
            endIndex: newIndex,
            color: this.appState.selectedColor,
            type: "straight"
          };
          this.appState.connections.push(connection);
          this.appState.saveHistory();
          console.log(`🔗 Created connection: pin ${this.appState.connectStartIndex} → pin ${newIndex}, total connections: ${this.appState.connections.length}`);
        } else {
          console.log(`📍 Placed pin ${newIndex} without connection (no parent set)`);
        }

        // Set this new pin as the selected pin
        this.setSelectedPin(newIndex);

        // Handle connection mode persistence
        if (this.appState.connectionMode === 'parent') {
          // In parent mode (right-click), keep the original parent as connection source
          // This allows creating multiple children from the same parent pin
          console.log(`👨‍👩‍👧 Parent mode: Keeping pin ${this.appState.connectStartIndex} as parent for next connections`);
        } else {
          // In sequential mode (left-click on pin), update to the new pin as source
          this.appState.connectStartIndex = newIndex;
          console.log(`🔄 Sequential mode: Updated connection source to new pin ${newIndex}`);
        }

        this.saveAppState(this.appState);

        // Trigger render to show the new pin and connection
        if (window.app && window.app.render) {
          window.app.render();
        }
      } else {
        // Pin creation failed - conditions not met
      }

    this.draw();
    }

    // Reset interaction flags
    this.isPanning = false;
    this.isDraggingPin = false;
    this.isDraggingText = false;
    this.isDraggingArea = false;
    this.isCreatingText = false;
    this.isMarqueeSelecting = false;
    this.dragPinIndex = null;
    this.dragTextIndex = null;

    this.draw();
  }

  // Canvas double click handler
  handleCanvasDoubleClick(e) {
    console.log(`👆 Double-click detected at (${e.clientX}, ${e.clientY})`);
    e.preventDefault();
    // Convert mouse coordinates to canvas-relative
    const canvasContainer = document.getElementById("canvas-container");
    const containerRect = canvasContainer.getBoundingClientRect();

    // Simple approach: use container coordinates directly
    const canvasX = e.clientX - containerRect.left;
    const canvasY = e.clientY - containerRect.top;
    const mouseWorld = this.screenToWorld(canvasX, canvasY);
    const clickedPinIndex = this.findPinAt(mouseWorld.x, mouseWorld.y);

    console.log(`📍 Double-click world coords: (${mouseWorld.x}, ${mouseWorld.y}), found pin: ${clickedPinIndex}`);
    console.log(`🎯 Modal manager available:`, !!(window.app && window.app.modalManager && window.app.modalManager.openPinModal));

    if (clickedPinIndex !== null) {
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
    } else {
      console.log(`❌ No pin found at double-click location`);
    }
  }

  // Canvas context menu handler
  handleCanvasContextMenu(e) {
    console.log("🎯 Context menu prevented at:", e.clientX, e.clientY, "target:", e.target);
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
    // Convert mouse coordinates to canvas-relative
    const canvasContainer = document.getElementById("canvas-container");
    const containerRect = canvasContainer.getBoundingClientRect();

    // Simple approach: use container coordinates directly
    const canvasX = e.clientX - containerRect.left;
    const canvasY = e.clientY - containerRect.top;
    const mouseWorld = this.screenToWorld(canvasX, canvasY);


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

    // Save state
    this.saveAppState(window.appState);

    // Re-render
    this.draw();

    // Re-render tray to show card as used
    if (window.app && window.app.trayManager) {
      window.app.trayManager.render();
    }

  }

  // Keyboard handler
  handleKeyDown(e) {
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

    // Handle tool selection (M, S, P, T)
    if (e.key === 'm' || e.key === 'M') {
      e.preventDefault();
      this.selectTool('pan');
    } else if (e.key === 's' || e.key === 'S') {
      e.preventDefault();
      this.selectTool('select');
    } else if (e.key === 'p' || e.key === 'P') {
      e.preventDefault();
      this.selectTool('pin');
    } else if (e.key === 't' || e.key === 'T') {
      e.preventDefault();
      this.selectTool('text');
    }
    // Handle type cycling within families (1=cycle pin types, 2=cycle card types, 3=cycle area types)
    else if (e.key === '1' && !e.shiftKey && !e.ctrlKey && !e.altKey) {
      e.preventDefault();
      this.cycleTypeInFamily('pin');
    } else if (e.key === '2' && !e.shiftKey && !e.ctrlKey && !e.altKey) {
      e.preventDefault();
      this.cycleTypeInFamily('card');
    } else if (e.key === '3' && !e.shiftKey && !e.ctrlKey && !e.altKey) {
      e.preventDefault();
      this.cycleTypeInFamily('area');
    }
    // Handle Shift+Number: Quick color selection (Shift+1=first color, Shift+2=second color, etc.)
    else if (e.shiftKey && !e.ctrlKey && !e.altKey && e.key >= '1' && e.key <= '9') {
      e.preventDefault();
      const colorIndex = parseInt(e.key) - 1; // Convert "1" to index 0, "2" to index 1, etc.
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
    } else if (e.key === 'Delete' || e.key === 'Backspace') {
      // Delete selected pins
      if (this.appState.selectedPinIndex !== null) {
        this.appState.pins.splice(this.appState.selectedPinIndex, 1);
        this.setSelectedPin(null);
        this.saveAppState(this.appState);
        this.draw();
      }
    } else if (e.key === 'f' || e.key === 'F') {
      // Frame all pins
      this.frameAllPins();
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

      console.log(`🎯 Escape: Cleared selections and connection modes`);
      if (hadActiveConnection) console.log(`   ↳ Cancelled active marquee/connection`);
      if (hadSelectedPin) console.log(`   ↳ Deselected active pin`);

      this.draw();
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
        this.saveAppState(this.appState);
        this.draw();
      }
    } else if (e.shiftKey) {
      this.handleShiftShortcuts(e);
    }
  }

  // Select a tool
  selectTool(toolId) {
    this.appState.currentTool = toolId;

    // Update toolbar if available
    if (window.app && window.app.toolbarManager) {
      window.app.toolbarManager.render();
    }
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
          this.saveAppState(this.appState);
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

    const canvasWidth = this.canvas.width;
    const canvasHeight = this.canvas.height;
    const contentWidth = maxX - minX + padding * 2;
    const contentHeight = maxY - minY + padding * 2;

    const scaleX = canvasWidth / contentWidth;
    const scaleY = canvasHeight / contentHeight;
    const newScale = Math.min(scaleX, scaleY, 1); // Don't zoom in beyond 100%

    this.appState.scale = Math.max(newScale, 0.1); // Minimum scale
    this.appState.offsetX = canvasWidth / 2 - centerX * this.appState.scale;
    this.appState.offsetY = canvasHeight / 2 - centerY * this.appState.scale;

    this.saveAppState(this.appState);
    this.draw();
  }

  // Cleanup event handlers
  destroy() {
    // Temporarily disabled pointer events
    // this.canvas.removeEventListener("pointermove", this.handleCanvasPointerMove.bind(this));
    // this.canvas.removeEventListener("pointerup", this.handleCanvasPointerUp.bind(this));
    this.canvas.removeEventListener("mousedown", this.handleCanvasMouseDown.bind(this));
    this.canvas.removeEventListener("mousemove", this.handleCanvasMouseMove.bind(this));
    this.canvas.removeEventListener("mouseup", this.handleCanvasMouseUp.bind(this));
    this.canvas.removeEventListener("dblclick", this.handleCanvasDoubleClick.bind(this));
    this.canvas.removeEventListener("contextmenu", this.handleCanvasContextMenu.bind(this));
    this.canvas.removeEventListener("dragover", this.handleCanvasDragOver.bind(this));
    this.canvas.removeEventListener("drop", this.handleCanvasDrop.bind(this));
    this.canvas.removeEventListener("wheel", this.handleWheel.bind(this));
    window.removeEventListener("keydown", this.handleKeyDown.bind(this));
  }

  // Handle mouse wheel for zooming
  handleWheel(e) {
    e.preventDefault();

    const zoomSpeed = 1.05;
    // Determine if zooming in (deltaY < 0) or out (deltaY > 0)
    const delta = e.deltaY > 0 ? 1 / zoomSpeed : zoomSpeed;

    // Get the mouse position relative to the canvas
    const canvasContainer = document.getElementById("canvas-container");
    const rect = canvasContainer.getBoundingClientRect();
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;

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

    // Update global variables
    window.scale = this.appState.scale;
    window.offsetX = this.appState.offsetX;
    window.offsetY = this.appState.offsetY;

    // Save state
    this.saveAppState(this.appState);

    // Redraw
    if (window.app && window.app.render) {
      window.app.render();
    }
  }
}

// Export for global access
console.log("EventHandlers class defined, exporting to window...");
window.EventHandlers = EventHandlers;
console.log("EventHandlers exported successfully:", typeof window.EventHandlers);
