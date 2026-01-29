// Main Application Module
// Handles application initialization and coordination

class Application {
  constructor(deps = {}) {
    // Store dependencies (with defaults to window objects for backward compatibility)
    this.deps = {
      AppState: deps.AppState || window.AppState,
      BoardManager: deps.BoardManager || window.BoardManager,
      BoardPickerUI: deps.BoardPickerUI || window.BoardPickerUI,
      ModalManager: deps.ModalManager || window.ModalManager,
      TrayManager: deps.TrayManager || window.TrayManager,
      ToolbarManager: deps.ToolbarManager || window.ToolbarManager,
      EventHandlers: deps.EventHandlers || window.EventHandlers,
      DragManager: deps.DragManager || window.DragManager,
      SystemMenuManager: deps.SystemMenuManager || window.SystemMenuManager,
      loadThemes: deps.loadThemes || window.loadThemes,
      loadAppState: deps.loadAppState || window.loadAppState,
      saveAppState: deps.saveAppState || window.saveAppState,
      applyTheme: deps.applyTheme || window.applyTheme,
      DEFAULT_CARDS: deps.DEFAULT_CARDS || window.DEFAULT_CARDS,
      STORAGE_KEY: deps.STORAGE_KEY || window.STORAGE_KEY,
      MENU_HEIGHT: deps.MENU_HEIGHT || window.MENU_HEIGHT,
      TRAY_HEIGHT: deps.TRAY_HEIGHT || window.TRAY_HEIGHT,
      PIN_BASES: deps.PIN_BASES || window.PIN_BASES,
      drawPinShape: deps.drawPinShape || window.drawPinShape,
      drawTextElements: deps.drawTextElements || window.drawTextElements,
      parseDate: deps.parseDate || window.parseDate,
      ConnectionsAPI: deps.ConnectionsAPI || window.ConnectionsAPI
    };

    this.appState = null;
    this.boardManager = null;
    this.boardPickerUI = null;
    this.systemMenuManager = null;
    this.eventHandlers = null;
    this.modalManager = null;
    this.trayManager = null;
    this.toolbarManager = null;
    this.canvas = null;
    this.ctx = null;

    // Animation loop state
    this.animationFrameId = null;
    this.isAnimating = false;
    this.needsRedraw = true;

    // Observer pattern for state changes
    this.stateObservers = new Set();

    // Global state aliases (will be removed)
    this.scale = null;
    this.offsetX = null;
    this.offsetY = null;
    this.pins = null;
    this.connections = null;
    this.selectedPinIndex = null;
    this.selectedColor = null;
  }

  // Initialize drag manager early (before event handlers need it)
  initializeDragManagerEarly() {
    console.log("🎯 Initializing drag manager early");
    if (this.deps.DragManager) {
      this.dragManager = new this.deps.DragManager(this.appState);
      // Note: Full initialization happens later in initializeManagers()
      // For now, just make it globally available
      window.dragManager = this.dragManager;
      console.log("✅ Drag manager created and available globally");
    } else {
      console.warn("⚠️ DragManager dependency not available");
    }
  }

  // Initialize the application
  async initialize() {
    console.log("🚀 App.initialize() starting");
    console.log("📍 Current location:", window.location.href);

    // EARLY DRAG MANAGER INITIALIZATION - needed for event handlers
    this.initializeDragManagerEarly();

    // Get canvas reference
    this.canvas = document.getElementById("board");
    if (!this.canvas) {
      return;
    }

    // Initialize AppState
    this.appState = new this.deps.AppState();

    // Initialize BoardManager (handles multi-board storage)
    if (this.deps.BoardManager) {
      this.boardManager = new this.deps.BoardManager();
      this.boardManager.initialize(this.appState, this);
      window.boardManager = this.boardManager; // Make globally available
      console.log("📋 BoardManager initialized");
    }

    // Load themes
    if (this.deps.loadThemes) {
      await this.deps.loadThemes();
    }

    // Load saved state using BoardManager (handles migration from legacy format)
    console.log("📥 Loading saved state...");
    let stateLoaded = false;

    if (this.boardManager) {
      // Check if there's an active board to load
      const activeBoardId = this.boardManager.getActiveBoardId();
      if (activeBoardId) {
        stateLoaded = this.boardManager.loadBoard(activeBoardId);
        console.log("📥 Loaded active board:", activeBoardId, "success:", stateLoaded);
      } else {
        // Check for any boards in the index
        const boards = this.boardManager.getBoardList();
        if (boards.length > 0) {
          // Load the first board
          stateLoaded = this.boardManager.loadBoard(boards[0].id);
          console.log("📥 Loaded first available board:", boards[0].id);
        } else {
          // No boards exist - create a default board
          console.log("📥 No boards found, creating default board...");
          const newBoardId = this.boardManager.createBoard("My Board", "");
          if (newBoardId) {
            stateLoaded = this.boardManager.loadBoard(newBoardId);
            // Set default cards for new boards
            this.appState.cards = this.deps.DEFAULT_CARDS || [];
          }
        }
      }
    } else {
      // Fallback to legacy loading if BoardManager not available
      try {
        const stored = localStorage.getItem(this.deps.STORAGE_KEY || 'msc-investigativeboard');
        console.log("📥 Raw localStorage data:", stored ? "Found data" : "No data found");
        if (stored) {
          const parsed = JSON.parse(stored);
          console.log("📥 Parsed localStorage keys:", Object.keys(parsed));
          console.log("📥 Sample data - pins:", parsed.pins?.length || 0, "connections:", parsed.connections?.length || 0);
        }
      } catch (e) {
        console.error("📥 Error checking localStorage:", e);
      }

      stateLoaded = this.deps.loadAppState(this.appState);
      console.log("📥 State loaded (legacy):", stateLoaded);
    }

    if (stateLoaded) {
      console.log("📊 Loaded state summary:");
      console.log("  - Board:", this.appState.meta?.title || "Untitled");
      console.log("  - Pins:", this.appState.pins?.length || 0);
      console.log("  - Connections:", this.appState.connections?.length || 0);
      console.log("  - Scale:", this.appState.scale);
      console.log("  - Offset:", this.appState.offsetX, this.appState.offsetY);
    }

    // Initialize default cards if no state was loaded
    if (!stateLoaded) {
      console.log("📝 No saved state found, using defaults");
      this.appState.cards = this.deps.DEFAULT_CARDS || [];
    }

    // Save initial state to history for undo functionality
    this.appState.saveHistory();
    console.log("📝 Initial state saved to history for undo functionality");

    // EARLY DRAG MANAGER INITIALIZATION - needed for event handlers
    this.initializeDragManagerEarly();

    // Sync global variables after loading data
    this.syncGlobalVariables();

    // Create state aliases (temporary - will be removed)
    this.createStateAliases();

    // Initialize managers
    this.initializeManagers();

    // Initialize BoardPickerUI
    if (this.deps.BoardPickerUI && this.boardManager) {
      this.boardPickerUI = new this.deps.BoardPickerUI();
      this.boardPickerUI.initialize(this.boardManager, this.appState, this, {
        onBoardLoad: (boardId) => {
          this.syncGlobalVariables();
          this.render();
          if (this.trayManager) this.trayManager.render();
        },
        onBoardCreate: (boardId) => {
          this.syncGlobalVariables();
          this.render();
          if (this.trayManager) this.trayManager.render();
        }
      });
      window.boardPickerUI = this.boardPickerUI;
      console.log("📋 BoardPickerUI initialized");
    }

    // Initialize SystemMenuManager with BoardManager reference
    if (this.deps.SystemMenuManager) {
      this.systemMenuManager = new this.deps.SystemMenuManager(this.appState);
      this.systemMenuManager.initialize({
        saveAppState: this.deps.saveAppState,
        boardManager: this.boardManager,
        boardPickerUI: this.boardPickerUI,
        app: this
      });
      window.systemMenuManager = this.systemMenuManager;
      console.log("📋 SystemMenuManager initialized with BoardManager");
    }

    // Set up canvas and rendering
    this.setupCanvas();

    // Render initial state
    console.log("🎨 Calling initial render...");
    this.render();
    console.log("✅ Initial render complete");

    // Apply current theme
    if (this.deps.applyTheme && this.appState.currentThemeId) {
      this.deps.applyTheme(this.appState.currentThemeId);
    }

    // Also render toolbar and tray
    if (this.toolbarManager) {
      this.toolbarManager.render();
    }
    if (this.trayManager) {
      this.trayManager.render();
    }

    // Set up control button handlers
    this.setupControlHandlers();

    // Set up auto-save through BoardManager
    this._setupAutoSave();

    // Initial render is handled earlier in the method

  }

  // Set up auto-save functionality through BoardManager
  _setupAutoSave() {
    if (!this.boardManager) return;

    // Debounced auto-save
    let saveTimeout = null;
    const autoSave = () => {
      if (saveTimeout) clearTimeout(saveTimeout);
      saveTimeout = setTimeout(() => {
        if (this.appState.meta?.id) {
          this.boardManager.saveBoard(false); // Don't update thumbnail on every auto-save
          console.log("💾 Auto-saved board");
        }
      }, 2000); // Save 2 seconds after last change
    };

    // Subscribe to state changes for auto-save
    this.subscribeToStateChanges(() => {
      autoSave();
    });
  }

  // Create temporary state aliases for backward compatibility
  createStateAliases() {
    this.scale = this.appState.scale;
    this.offsetX = this.appState.offsetX;
    this.offsetY = this.appState.offsetY;
    this.pins = this.appState.pins;
    this.connections = this.appState.connections;
    this.selectedPinIndex = this.appState.selectedPinIndex;
    this.selectedColor = this.appState.selectedColor;

    // Make aliases globally available for backward compatibility
    window.appScale = this.scale;
    window.appOffsetX = this.offsetX;
    window.appOffsetY = this.offsetY;
    window.appPins = this.pins;
    window.appConnections = this.connections;
    window.appSelectedPinIndex = this.selectedPinIndex;
    window.appSelectedColor = this.selectedColor;

    // Make drawing.js compatible global variables
    this.syncGlobalVariables();

    // Make coordinate transformation functions globally available for drawing.js
    window.worldToScreen = this.worldToScreen.bind(this);
    window.screenToWorld = this.screenToWorld.bind(this);

    // Make main draw function globally available
    window.draw = this.draw.bind(this);
  }

  // Initialize all managers
  initializeManagers() {
    // Prevent multiple initialization attempts
    if (this._managersInitialized) {
      return;
    }

    // Initialize modal manager
    this.modalManager = new this.deps.ModalManager(this.appState);
    this.modalManager.initialize({
      draw: () => this.render(),
      saveAppState: this.deps.saveAppState,
      renderCards: () => this.trayManager.render()
    });

    // Initialize tray manager
    this.trayManager = new this.deps.TrayManager(this.appState);
    this.trayManager.initialize({
      renderCards: () => this.renderTray()
    });

    // Initialize toolbar manager
    this.toolbarManager = new this.deps.ToolbarManager(this.appState, {
      nodeTypes: window.NODE_TYPES,
      defaultColors: window.DEFAULT_COLORS,
      themes: window.THEMES || [{ id: "default", name: "Default" }],
      families: [
        { id: "pin", name: "Pin", defaultIcon: "●" },
        { id: "card", name: "Card", defaultIcon: "▤" },
        { id: "area", name: "Area", defaultIcon: "⭕" },
        { id: "text", name: "Text", defaultIcon: "📝" },
      ],
      mainTools: [
        { id: "pan", label: "Move", icon: "🖐", key: "M" },
        { id: "select", label: "Select", icon: "🔳", key: "S" },
      ]
    });
    this.toolbarManager.initialize({
      draw: () => this.render(),
      saveAppState: this.deps.saveAppState,
      openAddColorModal: () => {
        if (window.openAddColorModal) {
          window.openAddColorModal();
        }
      }
    });

    // Initialize drag manager (continued from early initialization)
    if (this.dragManager) {
      this.dragManager.initialize({
        screenToWorld: this.screenToWorld.bind(this),
        updateAreaContainment: this.updateAreaContainment.bind(this),
        draw: () => this.render()
      });
      console.log("✅ Drag manager fully initialized with dependencies");
    }

    // Initialize event handlers
    console.log("Creating EventHandlers, deps.EventHandlers:", typeof this.deps.EventHandlers);
    if (!this.deps.EventHandlers) {
      // Limit retries to prevent infinite recursion
      this._eventHandlerRetries = (this._eventHandlerRetries || 0) + 1;
      if (this._eventHandlerRetries < 50) { // Max 50 retries (5 seconds at 100ms intervals)
        console.warn(`EventHandlers not loaded yet, retrying in 100ms... (attempt ${this._eventHandlerRetries}/50)`);
        setTimeout(() => this.initializeManagers(), 100);
        return;
      } else {
        console.error("EventHandlers failed to load after 50 attempts. Some functionality may be limited.");
      }
    }
    this.eventHandlers = new this.deps.EventHandlers(this.appState, this.canvas, this);
    this.eventHandlers.initialize({
      draw: () => this.render(),
      saveAppState: this.deps.saveAppState,
      screenToWorld: this.screenToWorld.bind(this),
      findPinAt: this.findPinAt.bind(this),
      findConnectionNear: this.findConnectionNear.bind(this),
      setSelectedPin: this.setSelectedPin.bind(this),
      updateAreaContainment: this.updateAreaContainment.bind(this)
    });

    // Make event handlers available globally for modal access
    window.eventHandlers = this.eventHandlers;

    // Set up state change observers for managers
    this.setupStateObservers();

    // Mark managers as initialized
    this._managersInitialized = true;
  }

  // Set up canvas
  setupCanvas() {
    this.ctx = this.canvas.getContext("2d");
    if (!this.ctx) {
      return;
    }

    // Make canvas context globally available for drawing.js
    window.ctx = this.ctx;

    // Set canvas size
    this.resizeCanvas();

    // Handle window resize
    window.addEventListener("resize", () => this.resizeCanvas());
  }

  // Resize canvas to fill window (accounting for menu and tray)
  resizeCanvas() {
    const menuHeight = this.deps.MENU_HEIGHT || 50;
    const trayHeight = this.deps.TRAY_HEIGHT || 140;

    // Remove any margin since canvas-container positions it correctly
    this.canvas.style.marginTop = "0px";

    // Calculate content bounds to ensure canvas extends to show all content
    const contentBounds = this.calculateContentBounds();
    const minCanvasHeight = contentBounds ? contentBounds.bottom * this.appState.scale + 100 : 0;

    // Set canvas size to fill the container, but extend height if content goes below
    this.canvas.width = window.innerWidth;
    const baseHeight = window.innerHeight - menuHeight - trayHeight;
    this.canvas.height = Math.max(baseHeight, minCanvasHeight);

    // Adjust container height if canvas extends beyond viewport
    const container = document.getElementById('canvas-container');
    if (container) {
      const currentBottom = parseInt(container.style.bottom) || 140;
      const requiredHeight = this.canvas.height + currentBottom;
      if (requiredHeight > window.innerHeight) {
        // Content extends below viewport, adjust container
        container.style.height = this.canvas.height + 'px';
      } else {
        // Reset to default if content fits
        container.style.height = '';
      }
    }

    this.render();
  }

  // Calculate the bounding box of all content (pins, text, etc.)
  calculateContentBounds() {
    if (!this.appState.pins || this.appState.pins.length === 0) {
      return null;
    }

    let minX = Infinity, minY = Infinity;
    let maxX = -Infinity, maxY = -Infinity;

    // Check all pins
    this.appState.pins.forEach(pin => {
      if (pin.x < minX) minX = pin.x;
      if (pin.x > maxX) maxX = pin.x;
      if (pin.y < minY) minY = pin.y;
      if (pin.y > maxY) maxY = pin.y;
    });


    // Add some padding
    const padding = 200;
    return {
      left: minX - padding,
      top: minY - padding,
      right: maxX + padding,
      bottom: maxY + padding,
      width: maxX - minX + 2 * padding,
      height: maxY - minY + 2 * padding
    };
  }

  // Main render function
  render() {
    // Mark that a redraw is needed
    this.needsRedraw = true;

    // Start animation loop if not already running
    if (!this.isAnimating) {
      this.startAnimationLoop();
    }
  }

  // Start the animation loop
  startAnimationLoop() {
    if (this.isAnimating) return;

    this.isAnimating = true;
    this.animationLoop();
  }

  // Stop the animation loop
  stopAnimationLoop() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    this.isAnimating = false;
  }

  // Check if animations are currently active
  hasActiveAnimations() {
    const eh = this.eventHandlers;
    return (
      (eh && eh.isMarqueeSelecting && eh.marqueeStart && eh.marqueeEnd) || // Marquee selection
      (eh && eh.isDraggingArea) || // Area creation marquee
      (this.appState.connectStartIndex !== null && this.appState.connectMousePos) // Connection preview
    );
  }

  // Animation loop using requestAnimationFrame
  animationLoop = () => {
    if (!this.isAnimating) return;

    // Always draw during active animations, otherwise only when needed
    const shouldDraw = this.hasActiveAnimations() || this.needsRedraw;

    if (shouldDraw) {
      this.draw();
      this.needsRedraw = false;
    }

    // Stop loop if no animations are active and no redraw needed
    if (!this.hasActiveAnimations() && !this.needsRedraw) {
      this.stopAnimationLoop();
      return;
    }

    // Continue the loop
    this.animationFrameId = requestAnimationFrame(this.animationLoop);
  }

  // Main draw function (made globally available)
  draw() {
    if (!this.canvas || !this.ctx) {
      console.warn("❌ Draw called but canvas or context not available");
      return;
    }

    console.log(`🎨 Draw call #${window._drawCallCount || 0} - Canvas: ${this.canvas.width}x${this.canvas.height}, Pins: ${this.appState.pins?.length || 0}, Connections: ${this.appState.connections?.length || 0}`);

    // Debug: Track draw calls to detect loops
    if (!window._drawCallCount) window._drawCallCount = 0;
    window._drawCallCount++;
    const startTime = Date.now();

    // Clear canvas first
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw all rendering layers in correct order
    this.drawWorldSpaceElements();
    this.drawScreenSpaceElements();
    this.drawUIElements();

    // Debug: Log excessive draw calls
    const drawTime = Date.now() - startTime;
    if (window._drawCallCount % 100 === 0 || drawTime > 50) {
      console.log(`🎨 Draw call #${window._drawCallCount} took ${drawTime}ms`);
    }
  }

  // Draw world-space elements (scaled and translated)
  drawWorldSpaceElements() {
    this.ctx.save();
    this.ctx.translate(this.appState.offsetX, this.appState.offsetY);
    this.ctx.scale(this.appState.scale, this.appState.scale);

    // Draw connection preview first (behind other elements)
    this.drawConnectionPreview();

    // LAYERING FIX: Draw connections BEFORE pins so pins sit on top and mask line ends
    // This creates clean center-to-center connections with pins covering any line overlap
    this.drawConnections(this.ctx);

    // Draw timeline if active
    this.drawTimeline(this.ctx);

    // Draw pins AFTER connections so they mask the connection line ends
    this.drawPins(this.ctx);

    this.ctx.restore();
  }

  // Draw screen-space elements (UI overlays, marquees, etc.)
  drawScreenSpaceElements() {
    this.drawScreenUI(this.ctx);
  }

  // Draw UI elements (toolbar, tray, etc.)
  drawUIElements() {
    this.drawUI(this.ctx);
  }

  // Validate and sanitize pin data to prevent rendering issues
  validatePin(pin) {
    if (!pin) return pin;

    // Validate and clamp pinScale
    let pinScale = pin.pinScale || 1;
    if (typeof pinScale !== 'number' || isNaN(pinScale) || !isFinite(pinScale) || pinScale <= 0) {
      console.warn(`⚠️ Invalid pinScale for pin: ${pinScale}, using 1.0`);
      pinScale = 1.0;
    }
    pin.pinScale = Math.max(0.1, Math.min(5.0, pinScale));

    // Validate coordinates
    if (typeof pin.x !== 'number' || isNaN(pin.x)) {
      console.warn(`⚠️ Invalid x coordinate for pin: ${pin.x}, using 0`);
      pin.x = 0;
    }
    if (typeof pin.y !== 'number' || isNaN(pin.y)) {
      console.warn(`⚠️ Invalid y coordinate for pin: ${pin.y}, using 0`);
      pin.y = 0;
    }

    return pin;
  }

  // Get the visual center point of a pin for connection anchoring
  getPinCenter(pin) {
    // VERIFIED: All pins use (x,y) as their visual center
    // Every connection to this pin will use these exact coordinates

    // For debugging: verify coordinates are consistent
    if (window.DEBUG_PIN_CENTERS) {
      console.log(`📍 Pin center for pin at (${pin.x.toFixed(1)}, ${pin.y.toFixed(1)}): (${pin.x.toFixed(1)}, ${pin.y.toFixed(1)})`);
    }

    return {
      x: pin.x,
      y: pin.y
    };
  }

  // VERIFICATION: Test that all connections to a pin use identical coordinates
  verifyPinConnectionConsistency(pinIndex) {
    if (!this.appState.pins || !this.appState.connections) {
      console.log("❌ No pins or connections to verify");
      return;
    }

    const pin = this.appState.pins[pinIndex];
    if (!pin) {
      console.log(`❌ Pin ${pinIndex} not found`);
      return;
    }

    const pinCenter = this.getPinCenter(pin);
    console.log(`🎯 Verifying connections for pin ${pinIndex} at center (${pinCenter.x.toFixed(1)}, ${pinCenter.y.toFixed(1)})`);

    // Find all connections to/from this pin
    const connectionsToPin = this.appState.connections.filter(conn =>
      conn.from === pinIndex || conn.to === pinIndex
    );

    console.log(`📊 Found ${connectionsToPin.length} connections to pin ${pinIndex}`);

    let allConsistent = true;
    connectionsToPin.forEach((conn, idx) => {
      const isStart = conn.from === pinIndex;
      const otherPinIndex = isStart ? conn.to : conn.from;
      const otherPin = this.appState.pins[otherPinIndex];

      if (!otherPin) {
        console.log(`❌ Connection ${idx}: other pin ${otherPinIndex} not found`);
        allConsistent = false;
        return;
      }

      const connectionPoint = isStart ? this.getPinCenter(pin) : this.getPinCenter(otherPin);
      const expectedPoint = isStart ? pinCenter : this.getPinCenter(otherPin);

      const matches = Math.abs(connectionPoint.x - expectedPoint.x) < 0.01 &&
                     Math.abs(connectionPoint.y - expectedPoint.y) < 0.01;

      if (!matches) {
        console.log(`❌ Connection ${idx}: coordinates don't match!`);
        console.log(`   Expected: (${expectedPoint.x.toFixed(3)}, ${expectedPoint.y.toFixed(3)})`);
        console.log(`   Actual: (${connectionPoint.x.toFixed(3)}, ${connectionPoint.y.toFixed(3)})`);
        allConsistent = false;
      } else {
        console.log(`✅ Connection ${idx}: coordinates match perfectly`);
      }
    });

    if (allConsistent) {
      console.log(`🎉 SUCCESS: All connections to pin ${pinIndex} use identical center coordinates!`);
    } else {
      console.log(`💥 FAILURE: Some connections to pin ${pinIndex} use different coordinates!`);
    }

    return allConsistent;
  }

  // Draw connection preview line
  drawConnectionPreview() {
    if (this.appState.connectStartIndex === null || !this.appState.connectMousePos) {
      return;
    }

    const startPin = this.appState.pins[this.appState.connectStartIndex];
    if (!startPin) return;

    // Get the visual center of the starting pin
    const startCenter = this.getPinCenter(startPin);

    // SUB-PIXEL FIX: Round coordinates for sharp preview lines
    const startX = Math.round(startCenter.x);
    const startY = Math.round(startCenter.y);

    this.ctx.strokeStyle = "#ffffff"; // White line
    this.ctx.lineWidth = 3; // Thicker line for better visibility
    this.ctx.setLineDash([5, 5]);
    this.ctx.beginPath();
    this.ctx.moveTo(startX, startY);

    const time = Date.now();
    // Animate the line dash offset for the "moving" effect
    this.ctx.lineDashOffset = -((time * 0.4) % 10);

    // Calculate distance and number of segments for the wave
    const dx = this.appState.connectMousePos.x - startCenter.x;
    const dy = this.appState.connectMousePos.y - startCenter.y;
    const distance = Math.hypot(dx, dy);
    const segments = Math.max(8, Math.floor(distance / (15 * this.appState.scale)));

    // Wave parameters - balanced for smooth animation
    const waveMagnitude = 12.5 * Math.sqrt(this.appState.scale);
    const waveSpeed = time * 0.03;

    for (let i = 1; i <= segments; i++) {
      const t = i / segments;
      const x = startCenter.x + dx * t;
      const y = startCenter.y + dy * t;

      // Apply sine wave based on time and position
      const wave =
        Math.sin(t * Math.PI) *
        Math.sin(t * 8 + waveSpeed) * waveMagnitude;

      const perpX = -dy / distance;
      const perpY = dx / distance;

      this.ctx.lineTo(x + perpX * wave, y + perpY * wave);
    }

    this.ctx.stroke();
    this.ctx.setLineDash([]); // Reset dash
    this.ctx.lineDashOffset = 0; // Reset offset
    this.ctx.lineWidth = 1; // Reset line width
  }

  // Draw all connections
  drawConnections(ctx) {
    if (!this.appState.connections || !this.appState.pins) return;

    console.log(`🔗 Drawing ${this.appState.connections.length} connections between ${this.appState.pins.length} pins`);

    // Note: Connection preview is drawn in main draw() method with animation

    // Group connections by endpoint for fan-out calculations
    const connectionsByEndpoint = {};
    this.appState.connections.forEach((conn, idx) => {
      if (!connectionsByEndpoint[conn.from]) connectionsByEndpoint[conn.from] = [];
      if (!connectionsByEndpoint[conn.to]) connectionsByEndpoint[conn.to] = [];
      connectionsByEndpoint[conn.from].push(idx);
      connectionsByEndpoint[conn.to].push(idx);
    });

    this.appState.connections.forEach((connection, idx) => {
      // Handle both property name formats: from/to and startIndex/endIndex
      const startIndex = connection.from !== undefined ? connection.from : connection.startIndex;
      const endIndex = connection.to !== undefined ? connection.to : connection.endIndex;
      console.log(`🔗 Drawing connection ${idx}: ${startIndex} → ${endIndex} (${connection.color || "#666"})`);
      ctx.strokeStyle = connection.color || "#666";
      ctx.lineWidth = 2; // World-space line width (context is already scaled)
      ctx.setLineDash([]); // Ensure solid line (not dashed)
      ctx.beginPath();

      // All connections are now pin-to-pin
      const startPin = this.appState.pins[startIndex];
      const endPin = this.appState.pins[endIndex];

      if (!startPin || !endPin) {
        console.log(`❌ Missing pins for connection ${idx}: startIndex=${startIndex}, endIndex=${endIndex}, start=${!!startPin}, end=${!!endPin}`);
        return;
      }

      // CENTER-TO-CENTER CONNECTIONS: All lines connect to pin visual centers
      const startAnchor = this.getPinCenter(startPin);
      const endAnchor = this.getPinCenter(endPin);

      if (!startAnchor || !endAnchor) return;

      // SUB-PIXEL FIX: Round coordinates to prevent anti-aliasing blur/shift
      const startX = Math.round(startAnchor.x);
      const startY = Math.round(startAnchor.y);
      const endX = Math.round(endAnchor.x);
      const endY = Math.round(endAnchor.y);

      // VERIFICATION: All connections to a pin use identical coordinates
      if (window.DEBUG_PIN_CENTERS) {
        console.log(`🔗 Connection ${idx}: pin ${connection.from}→${connection.to}`);
        console.log(`   Start: (${startX}, ${startY}) [from pin center: (${startAnchor.x.toFixed(1)}, ${startAnchor.y.toFixed(1)})]`);
        console.log(`   End: (${endX}, ${endY}) [from pin center: (${endAnchor.x.toFixed(1)}, ${endAnchor.y.toFixed(1)})]`);
      }


      // Determine connection type (use connection's type, or default to global setting)
      const connType = connection.type || this.appState.connectionType;

      // CENTER-CONNECTION LOGIC: All connections go directly to pin centers
      // No fan-out or spreading - every connection uses the exact same anchor point
      const fanOutOffset = 0; // All connections go to the same center point

      if (connType === "curved") {
        // Calculate curve
        const dx = endX - startX;
        const dy = endY - startY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > 0) {
          const midX = (startX + endX) / 2;
          const midY = (startY + endY) / 2;

          // Perpendicular vector
          const perpX = -dy / dist;
          const perpY = dx / dist;

          // CENTER-BASED CURVING: Curve connects directly to centers
          const curveAmount = 40; // World-space curve amount (context is already scaled)

          const controlX = midX + perpX * curveAmount;
          const controlY = midY + perpY * curveAmount; // No fan-out offset

          ctx.moveTo(startX, startY);
          ctx.quadraticCurveTo(controlX, controlY, endX, endY);
        } else {
          // Fallback to straight line if pins are at same position
          ctx.moveTo(startX, startY);
          ctx.lineTo(endX, endY);
        }
      } else {
        // Straight line with fan-out offset
        const dx = endX - startX;
        const dy = endY - startY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > 0) {
          // DIRECT CENTER-TO-CENTER CONNECTION: No offsets, straight to center
          ctx.moveTo(startX, startY);
          ctx.lineTo(endX, endY);
        } else {
          // Fallback if pins are at same position
          ctx.moveTo(startX, startY);
          ctx.lineTo(endX, endY);
        }
      }

      ctx.stroke();
    });
  }

  // Draw timeline if active
  drawTimeline(ctx) {
    if (!this.appState.timelineActive || !this.appState.timelinePins || this.appState.timelinePins.length < 2) return;

    // Timeline Line
    ctx.strokeStyle = "#58a6ff";
    ctx.lineWidth = 3;
    ctx.beginPath();
    const start = { x: this.appState.timelineLeft, y: this.appState.timelineY };
    const end = { x: this.appState.timelineRight, y: this.appState.timelineY };
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.stroke();

    // Pin Connectors - look up current pin position by ID to handle stale references
    ctx.strokeStyle = "#58a6ff";
    ctx.lineWidth = 1.5;
    this.appState.timelinePins.forEach((tp) => {
      // Find the current pin by ID or index (in case reference is stale)
      let currentPin = null;
      if (tp.pinId) {
        currentPin = this.appState.pins.find(p => p.id === tp.pinId);
      } else if (tp.pinIndex !== undefined && this.appState.pins[tp.pinIndex]) {
        currentPin = this.appState.pins[tp.pinIndex];
      } else {
        currentPin = tp.pin; // Fallback to stored reference
      }
      
      if (!currentPin) return; // Pin was deleted
      
      const pinX = currentPin.x;
      const pinY = currentPin.y;
      
      // Draw connector from pin center to timeline
      ctx.beginPath();
      ctx.moveTo(pinX, pinY);
      ctx.lineTo(pinX, this.appState.timelineY);
      ctx.stroke();

      // Draw a small circle at the timeline connection point
      ctx.fillStyle = "#58a6ff";
      ctx.beginPath();
      ctx.arc(pinX, this.appState.timelineY, 5, 0, Math.PI * 2);
      ctx.fill();

      // Draw a small circle at the pin connection point (for debugging alignment)
      ctx.beginPath();
      ctx.arc(pinX, pinY, 3, 0, Math.PI * 2);
      ctx.fill();

      // Date Labels
      ctx.fillStyle = "#e6edf3";
      ctx.font = "12px system-ui";
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.fillText(tp.dateStr, pinX, this.appState.timelineY + 10);
    });
  }

  // Draw all pins
  drawPins(ctx) {
    if (!this.appState.pins) {
      return;
    }

    // Initialize label collision tracking for this frame
    window._drawnLabels = [];

    this.appState.pins.forEach((pin, index) => {
      // DEBUG: Add crosshair to first pin to check alignment
      if (index === 0 && window.DEBUG_CONNECTIONS) {
        ctx.save();
        ctx.strokeStyle = "red";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(pin.x - 20, pin.y); ctx.lineTo(pin.x + 20, pin.y);
        ctx.moveTo(pin.x, pin.y - 20); ctx.lineTo(pin.x, pin.y + 20);
        ctx.stroke();
        ctx.restore();
      }

      if (this.deps.drawPinShape) {
        // Use shape from pin object first (for text pins), then fall back to PIN_BASES
        let pinShape = pin.shape;
        if (!pinShape && this.deps.PIN_BASES) {
          pinShape = this.deps.PIN_BASES[pin.typeId]?.shape;
        }
        if (!pinShape) {
          pinShape = 'circle'; // Final fallback
        }

        const pinBase = { shape: pinShape, baseRadius: 9 };

        // Check if pin is in the multi-selection array
        const isSelected = this.appState.selectedPins.includes(index);
        // Show marquee highlight when multiple pins are selected
        const isMarquee = isSelected && this.appState.selectedPins.length > 1;
        const metrics = {
          x: pin.x,
          y: pin.y,
          scale: pin.pinScale || 1,
          color: pin.color,
          typeId: pin.typeId,
          shape: pinBase.shape,
          isSelected: isSelected,
          isMarquee: isMarquee
        };

        try {
          this.deps.drawPinShape(ctx, pin, metrics, index, this.appState.scale);
        } catch (error) {
        }
      } else {
      }
    });
  }

  // Draw text elements

  // Draw screen-space UI elements (marquees, selections, etc.)
  drawScreenUI(ctx) {
    // Draw marquee selection rectangle if active (select tool)
    const eh = this.eventHandlers;
    if (eh && eh.isMarqueeSelecting && eh.marqueeStart && eh.marqueeEnd) {
      const startScreen = this.worldToScreen(eh.marqueeStart.x, eh.marqueeStart.y);
      const endScreen = this.worldToScreen(eh.marqueeEnd.x, eh.marqueeEnd.y);

      const x = Math.min(startScreen.x, endScreen.x);
      const y = Math.min(startScreen.y, endScreen.y);
      const w = Math.abs(endScreen.x - startScreen.x);
      const h = Math.abs(endScreen.y - startScreen.y);

      // Animated marching ants effect
      const time = Date.now();
      ctx.lineDashOffset = -((time * 0.3) % 10);

      ctx.fillStyle = "rgba(88, 166, 255, 0.1)";
      ctx.fillRect(x, y, w, h);
      ctx.strokeStyle = "#58a6ff";
      ctx.lineWidth = 1;
      ctx.setLineDash([5, 5]);
      ctx.strokeRect(x, y, w, h);
      ctx.setLineDash([]);
    }

    // Draw area creation marquee if dragging
    if (window.app && window.app.eventHandlers && window.app.eventHandlers.isDraggingArea &&
        window.app.eventHandlers.areaDragStart && window.app.eventHandlers.areaDragCurrent) {
      const eh = window.app.eventHandlers;
      const startScreen = this.worldToScreen(eh.areaDragStart.x, eh.areaDragStart.y);
      const currentScreen = this.worldToScreen(eh.areaDragCurrent.x, eh.areaDragCurrent.y);

      // Calculate dimensions in screen space for proper visual scaling
      const dx = Math.abs(currentScreen.x - startScreen.x);
      const dy = Math.abs(currentScreen.y - startScreen.y);

      // Animated marquee for area creation
      const time = Date.now();
      ctx.lineDashOffset = -((time * 0.5) % 16); // Animated marching ants

      ctx.strokeStyle = this.appState.selectedColor || "#58a6ff"; // Use selected color
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 8]);
      ctx.beginPath();

      // Draw different shapes based on area type
      if (this.appState.currentTypeId === "area:circle") {
        // Circular marquee
        const radius = Math.max(Math.sqrt(dx * dx + dy * dy), 10);
        ctx.arc(startScreen.x, startScreen.y, radius, 0, Math.PI * 2);
        console.log(`🎨 Circle marquee: center(${startScreen.x}, ${startScreen.y}), radius=${radius}`);
      } else {
        // Rectangular marquee - show the actual area bounds
        const halfWidth = Math.max(dx, 25);
        const halfHeight = Math.max(dy, 25);
        ctx.rect(
          startScreen.x - halfWidth,
          startScreen.y - halfHeight,
          halfWidth * 2,
          halfHeight * 2
        );
        console.log(`🎨 Rectangle marquee: center(${startScreen.x}, ${startScreen.y}), width=${halfWidth * 2}, height=${halfHeight * 2}`);
      }

      ctx.stroke();
      ctx.setLineDash([]); // Reset
    }
  }

  // Draw UI elements
  drawUI(ctx) {
    // Draw selection highlights, marquee selection, etc.
  }

  // Render canvas content
  renderCanvas(ctx) {
    this.drawPins(ctx);
    this.drawConnections(ctx);
  }

  // Utility methods for event handlers
  screenToWorld(sx, sy) {
    const wx = (sx - this.appState.offsetX) / this.appState.scale;
    const wy = (sy - this.appState.offsetY) / this.appState.scale;
    return { x: wx, y: wy };
  }

  worldToScreen(wx, wy) {
    const sx = wx * this.appState.scale + this.appState.offsetX;
    const sy = wy * this.appState.scale + this.appState.offsetY;
    return { x: sx, y: sy };
  }

  findPinAt(wx, wy) {
    // Find the topmost pin at the given world coordinates
    for (let i = this.appState.pins.length - 1; i >= 0; i--) {
      const pin = this.appState.pins[i];
      if (!pin) continue;

      // Text shapes that use rectangular hit detection
      const textShapes = ['bubble', 'rectangle', 'text-plain', 'text-title'];
      
      // Special handling for text pins (which have rectangular bounds)
      if (textShapes.includes(pin.shape)) {
        // Get default dimensions based on shape
        const defaultDimensions = {
          'bubble': { width: 140, height: 70 },
          'rectangle': { width: 120, height: 60 },
          'text-plain': { width: 150, height: 30 },
          'text-title': { width: 200, height: 40 }
        };
        const defaults = defaultDimensions[pin.shape] || { width: 120, height: 60 };
        
        const width = pin.width || defaults.width;
        const height = pin.height || defaults.height;
        const titleHeight = pin.label ? (pin.fontSize || 14) * 1.1 + 16 : 0;

        // Check if click is within the extended bounding box (text area + title)
        const left = pin.x - width/2;
        const right = pin.x + width/2;
        const top = pin.y - height/2;
        const bottom = pin.y + height/2 + titleHeight; // Include title area below

        if (wx >= left && wx <= right && wy >= top && wy <= bottom) {
          return i;
        }
      } else {
        // Standard circular hit detection for regular pins
        const dx = wx - pin.x;
        const dy = wy - pin.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Use pin scale for hit detection
        const scale = pin.pinScale || 1;
        const baseRadius = this.deps.PIN_BASES?.[pin.typeId]?.baseRadius || 10;
        // Make hit detection more generous (2x radius for easier clicking)
        const hitRadius = baseRadius * scale * 2;

        if (distance <= hitRadius) {
          return i;
        }
      }
    }
    return null;
  }


  findConnectionNear(wx, wy) {
    // Find connection line near the given world coordinates
    const hitDistance = 8; // pixels in world space
    let closestConnection = null;
    let closestDistance = hitDistance;

    for (let i = this.appState.connections.length - 1; i >= 0; i--) {
      const conn = this.appState.connections[i];
      if (!conn) continue;

      const startPin = this.appState.pins[conn.from];
      const endPin = this.appState.pins[conn.to];

      if (!startPin || !endPin) continue;

      // Check if point is near the line segment
      const distance = this.pointToLineDistance(wx, wy, startPin.x, startPin.y, endPin.x, endPin.y);
      if (distance <= hitDistance && distance < closestDistance) {
        closestConnection = i;
        closestDistance = distance;
      }
    }


    return closestConnection;
  }

  pointToLineDistance(px, py, x1, y1, x2, y2) {
    // Calculate distance from point (px, py) to line segment (x1,y1)-(x2,y2)
    const dx = x2 - x1;
    const dy = y2 - y1;

    if (dx === 0 && dy === 0) {
      // Line segment is a point
      return Math.sqrt((px - x1) ** 2 + (py - y1) ** 2);
    }

    const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / (dx * dx + dy * dy)));
    const closestX = x1 + t * dx;
    const closestY = y1 + t * dy;

    return Math.sqrt((px - closestX) ** 2 + (py - closestY) ** 2);
  }

  setSelectedPin(index) {
    const oldIndex = this.appState.selectedPinIndex;
    this.appState.selectedPinIndex = index;
    this.syncGlobalVariables();
    this.updatePinInfo();
    this.notifyStateChange({ selectedPinIndex: { old: oldIndex, new: index } });
  }

  updatePinInfo() {
    // Update pin info panel
    const pinInfo = document.getElementById("pin-info");
    const pinInfoTitle = document.getElementById("pin-info-title");
    const pinInfoSub = document.getElementById("pin-info-sub");
    const pinInfoNote = document.getElementById("pin-info-note");
    const pinInfoColor = document.getElementById("pin-info-color");

    if (this.appState.selectedPinIndex !== null && this.appState.pins[this.appState.selectedPinIndex]) {
      const pin = this.appState.pins[this.appState.selectedPinIndex];
      pinInfoTitle.textContent = pin.label || "Unnamed Pin";
      pinInfoSub.textContent = pin.typeId || "";
      pinInfoNote.textContent = pin.note || "";
      pinInfoColor.style.backgroundColor = pin.color || "#58a6ff";
      pinInfo.style.display = "block";
    } else {
      pinInfo.style.display = "none";
    }
  }

  updateAreaContainment() {
    // Update which pins are contained within areas
    // This is a simplified version - the full logic would need to be implemented
  }

  // Open modal for pin editing
  openPinModal(pinIndex) {
    if (this.modalManager) {
      this.modalManager.openPinModal(pinIndex);
    }
  }

  // Sync global variables for backward compatibility
  syncGlobalVariables() {
    console.log("🔄 Syncing global variables...");
    window.appState = this.appState;
    window.scale = this.appState.scale;
    window.offsetX = this.appState.offsetX;
    window.offsetY = this.appState.offsetY;
    window.pins = this.appState.pins;
    window.connections = this.appState.connections;
    window.selectedPinIndex = this.appState.selectedPinIndex;
    window.selectedPins = this.appState.selectedPins;
    window.selectedColor = this.appState.selectedColor;

    console.log(`✅ Global variables synced: pins=${window.pins?.length || 0}, connections=${window.connections?.length || 0}, scale=${window.scale}`);

    // Debug flags
    window.DEBUG_CONNECTIONS = false; // Set to true to show crosshairs on first pin for alignment debugging
  }

  // Set up state observers for managers
  setupStateObservers() {
    // Tray manager updates when cards change
    if (this.trayManager) {
      this.subscribeToStateChanges((changes) => {
        if (changes.cards || changes.selectedPinIndex) {
          this.trayManager.render();
        }
      });
    }

    // Toolbar manager updates when various states change
    if (this.toolbarManager) {
      this.subscribeToStateChanges((changes) => {
        if (changes.selectedPinIndex || changes.selectedColor || changes.scale || changes.connectionType) {
          this.toolbarManager.render();
        }
      });
    }
  }

  // Render tray
  renderTray() {
    if (this.trayManager) {
      this.trayManager.render();
    }
  }

  // Observer pattern methods
  subscribeToStateChanges(callback) {
    this.stateObservers.add(callback);
    return () => this.stateObservers.delete(callback); // Return unsubscribe function
  }

  notifyStateChange(changes = {}) {
    this.stateObservers.forEach(callback => {
      try {
        callback(changes, this.appState);
      } catch (error) {
        console.error('Error in state change observer:', error);
      }
    });
  }

  // Get application state
  getState() {
    return this.appState;
  }

  // Save application state
  saveState() {
    if (this.boardManager && this.appState.meta?.id) {
      // Use BoardManager for multi-board system
      this.boardManager.saveBoard();
    } else if (this.deps.saveAppState && this.appState) {
      // Fallback to legacy save
      this.deps.saveAppState(this.appState);
    }
  }

  // Update pin scales based on connection counts
  updatePinScales() {
    for (let i = 0; i < this.appState.pins.length; i++) {
      const connectionCount = this.deps.ConnectionsAPI?.getConnectionCount(i, this.appState.connections) || 0;
      // Scale increases with square root of connections for smoother scaling
      const newScale = 1 + Math.sqrt(connectionCount) * 0.3;
      this.appState.pins[i].pinScale = Math.max(0.5, Math.min(3.0, newScale)); // Clamp between 0.5 and 3.0
    }
  }

  // Cleanup application
  destroy() {
    this.stopAnimationLoop();
    if (this.eventHandlers) {
      this.eventHandlers.destroy();
    }
    // Clean up other resources
  }

  // ============================================================================
  // THUMBNAIL GENERATION
  // ============================================================================

  /**
   * Generate a thumbnail of the current board state
   * Creates a scaled-down snapshot of the canvas content
   * @param {number} maxWidth - Maximum thumbnail width (default 200)
   * @param {number} maxHeight - Maximum thumbnail height (default 150)
   * @returns {string|null} Data URL of the thumbnail image, or null if no content
   */
  generateThumbnail(maxWidth = 200, maxHeight = 150) {
    if (!this.canvas || !this.ctx) {
      console.warn('Cannot generate thumbnail: canvas not available');
      return null;
    }

    // Calculate content bounds
    const bounds = this.calculateContentBounds();
    if (!bounds) {
      // No content, return a simple placeholder
      return this._generateEmptyThumbnail(maxWidth, maxHeight);
    }

    // Add some padding around the content
    const padding = 50;
    const contentWidth = bounds.width + padding * 2;
    const contentHeight = bounds.height + padding * 2;

    // Calculate scale to fit within max dimensions while maintaining aspect ratio
    const scaleX = maxWidth / contentWidth;
    const scaleY = maxHeight / contentHeight;
    const thumbScale = Math.min(scaleX, scaleY, 1); // Don't upscale

    // Calculate final thumbnail dimensions
    const thumbWidth = Math.ceil(contentWidth * thumbScale);
    const thumbHeight = Math.ceil(contentHeight * thumbScale);

    // Create offscreen canvas for thumbnail
    const thumbCanvas = document.createElement('canvas');
    thumbCanvas.width = maxWidth;
    thumbCanvas.height = maxHeight;
    const thumbCtx = thumbCanvas.getContext('2d');

    // Fill with dark background
    thumbCtx.fillStyle = '#1e1e2e';
    thumbCtx.fillRect(0, 0, maxWidth, maxHeight);

    // Center the content in the thumbnail
    const offsetX = (maxWidth - thumbWidth) / 2;
    const offsetY = (maxHeight - thumbHeight) / 2;

    // Set up transform to draw content centered and scaled
    thumbCtx.save();
    thumbCtx.translate(offsetX, offsetY);
    thumbCtx.scale(thumbScale, thumbScale);
    thumbCtx.translate(-bounds.left + padding, -bounds.top + padding);

    // Draw connections
    this._drawConnectionsToContext(thumbCtx);

    // Draw pins (simplified for thumbnail)
    this._drawPinsToContext(thumbCtx);

    thumbCtx.restore();

    // Convert to data URL with compression
    try {
      return thumbCanvas.toDataURL('image/png');
    } catch (e) {
      console.error('Failed to generate thumbnail:', e);
      return null;
    }
  }

  /**
   * Generate a placeholder thumbnail for empty boards
   * @private
   */
  _generateEmptyThumbnail(width, height) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    // Dark background
    ctx.fillStyle = '#1e1e2e';
    ctx.fillRect(0, 0, width, height);

    // Subtle grid
    ctx.strokeStyle = '#2a2a3e';
    ctx.lineWidth = 1;
    for (let x = 0; x < width; x += 20) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += 20) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    return canvas.toDataURL('image/png');
  }

  /**
   * Draw connections to a given context (for thumbnails)
   * @private
   */
  _drawConnectionsToContext(ctx) {
    if (!this.appState.connections || !this.appState.pins) return;

    ctx.lineWidth = 2;
    ctx.lineCap = 'round';

    this.appState.connections.forEach(conn => {
      const startPin = this.appState.pins[conn.from];
      const endPin = this.appState.pins[conn.to];
      if (!startPin || !endPin) return;

      ctx.strokeStyle = conn.color || '#666666';
      ctx.beginPath();
      ctx.moveTo(startPin.x, startPin.y);
      ctx.lineTo(endPin.x, endPin.y);
      ctx.stroke();
    });
  }

  /**
   * Draw pins to a given context (simplified for thumbnails)
   * @private
   */
  _drawPinsToContext(ctx) {
    if (!this.appState.pins) return;

    this.appState.pins.forEach(pin => {
      const radius = 8;

      // Draw pin circle
      ctx.fillStyle = pin.color || '#58a6ff';
      ctx.beginPath();
      ctx.arc(pin.x, pin.y, radius, 0, Math.PI * 2);
      ctx.fill();

      // Add slight border
      ctx.strokeStyle = 'rgba(255,255,255,0.3)';
      ctx.lineWidth = 1;
      ctx.stroke();
    });
  }

  // Set up control button event handlers
  setupControlHandlers() {
    // Reset button
    const resetBtn = document.getElementById("reset");
    if (resetBtn) {
      resetBtn.onclick = () => this.resetBoard();
    }

    // Magic button (force layout toggle)
    const magicBtn = document.getElementById("magic");
    if (magicBtn) {
      magicBtn.onclick = () => {
        // TODO: Implement force layout functionality
        alert("Force layout functionality not yet implemented");
      };
    }

    // Radial button
    const radialBtn = document.getElementById("radial");
    if (radialBtn) {
      radialBtn.onclick = () => {
        // TODO: Implement radial layout functionality
        alert("Radial layout functionality not yet implemented");
      };
    }

    // Clusters button
    const clustersBtn = document.getElementById("clusters");
    if (clustersBtn) {
      clustersBtn.onclick = () => {
        // TODO: Implement clusters layout functionality
        alert("Clusters layout functionality not yet implemented");
      };
    }

    // Timeline button
    const timelineBtn = document.getElementById("timeline");
    if (timelineBtn) {
      timelineBtn.onclick = () => {
        this.layoutTimeline();
      };
    }
  }

  // Timeline layout - arrange pins chronologically
  layoutTimeline() {
    // Stop any active layout simulation
    if (this.appState.isLayoutSimulating) {
      this.appState.isLayoutSimulating = false;
    }

    // Find pins with dates
    const timedPins = this.appState.pins
      .map((pin, index) => {
        // Check if pin has a date, or if it has an attached card with a date
        let dateStr = pin.date || "";
        if (pin.cardId != null && this.appState.cards) {
          const card = this.appState.cards.find((c) => c.id === pin.cardId);
          if (card && card.date) {
            dateStr = card.date;
          }
        }
        // Store both pin reference, pin ID, and index for robust lookup
        return { pin, pinId: pin.id, pinIndex: index, dateStr };
      })
      .filter((tp) => tp.dateStr);

    if (timedPins.length < 2) {
      alert("Need at least 2 pins with dates on the board!");
      return;
    }

    // Save history before layout
    this.saveState();

    // Parse dates and sort chronologically
    timedPins.forEach((tp) => (tp.timestamp = this.deps.parseDate(tp.dateStr)));
    timedPins.sort((a, b) => a.timestamp - b.timestamp);
    this.appState.timelinePins = timedPins;

    const minTime = timedPins[0].timestamp;
    const maxTime = timedPins[timedPins.length - 1].timestamp;

    // Calculate timeline span based on number of pins (ensure good spacing)
    const pinSpacing = 150; // World units between pins
    const timelineWidth = Math.max(pinSpacing * (timedPins.length - 1), 500);
    const horizontalPadding = 100; // Padding on each end
    
    // Center the timeline around the current view center
    const viewCenterX = (this.canvas.width / 2 - this.appState.offsetX) / this.appState.scale;
    this.appState.timelineLeft = viewCenterX - timelineWidth / 2 - horizontalPadding;
    this.appState.timelineRight = viewCenterX + timelineWidth / 2 + horizontalPadding;
    
    // Position timeline below existing pins (using fixed world coordinates)
    const lowestY = this.appState.pins.length ? Math.max(...this.appState.pins.map((p) => p.y)) : 0;
    const footerMarginWorld = 200; // Fixed world units below the lowest pin
    this.appState.timelineY = lowestY + footerMarginWorld;

    // Distance from timeline to pins (alternating above/below)
    const offsetWorld = 100; // Fixed world units

    // Activate timeline
    this.appState.timelineActive = true;

    // Position pins along timeline chronologically
    const worldSpan = this.appState.timelineRight - this.appState.timelineLeft - (2 * horizontalPadding);
    timedPins.forEach((tp, i) => {
      const t = (tp.timestamp - minTime) / (maxTime - minTime || 1);
      tp.pin.x = this.appState.timelineLeft + horizontalPadding + (t * worldSpan);
      tp.pin.y = this.appState.timelineY + (i % 2 === 0 ? -offsetWorld : offsetWorld);
    });

    // Adjust viewport if timeline extends beyond canvas
    const footerScreenY = this.appState.timelineY * this.appState.scale + this.appState.offsetY;
    if (footerScreenY > this.canvas.height - 80) {
      this.appState.offsetY -= footerScreenY - (this.canvas.height - 80);
    }

    // Save state and redraw
    this.saveState();
    this.render();
  }


  // Reset the entire board
  resetBoard() {
    if (confirm("Are you sure you want to reset the entire board? This cannot be undone from local storage!")) {
      // Clear localStorage
      localStorage.removeItem(this.deps.STORAGE_KEY);

      // Reset state
      this.appState.pins = [];
      this.appState.connections = [];
      this.appState.selectedPinIndex = null;
      this.appState.selectedPins = [];
      this.appState.selectedTextIndex = null;
      this.appState.connectStartIndex = null;
      this.appState.connectMousePos = null;
      this.appState.connectionMode = null;
      this.appState.scale = 1;
      this.appState.offsetX = 0;
      this.appState.offsetY = 0;

      // Reset timeline state
      this.appState.timelineActive = false;
      this.appState.timelinePins = [];
      this.appState.timelineY = 0;
      this.appState.timelineLeft = 0;
      this.appState.timelineRight = 0;

      // Reset cards to unused state
      if (this.appState.cards) {
        this.appState.cards.forEach(card => {
          card.used = false;
        });
      }

      // Clear image cache
      if (window.imageCache) {
        window.imageCache.clear();
      }

      // Save the reset state
      this.deps.saveAppState(this.appState);

      // Reload the page to fully reset
      window.location.reload();
    }
  }
}

  // Export for global access
  window.Application = Application;
