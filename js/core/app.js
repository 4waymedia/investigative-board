// Main Application Module
// Handles application initialization and coordination

// ============================================================================
// SELECTION ANIMATOR
// ============================================================================
// Handles animated selection indicators with performance optimization

class SelectionAnimator {
  constructor() {
    this.phase = 0;           // Current animation phase (0-1)
    this.lastUpdate = 0;      // Last update timestamp
    this.cycleDuration = 2000; // Full cycle in ms
    this.isRunning = false;
    this.animationId = null;
    
    // Ring configuration
    this.maxRings = 3;        // Max expanding rings for single selection
    this.ringSpacing = 0.33;  // Phase offset between rings
  }

  /**
   * Start the animation loop
   */
  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastUpdate = performance.now();
    this.tick();
  }

  /**
   * Stop the animation loop
   */
  stop() {
    this.isRunning = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  /**
   * Animation tick - updates phase
   */
  tick() {
    if (!this.isRunning) return;
    
    // Auto-stop if nothing is selected
    const selectionCount = window.app?.getSelectionCount?.() || 0;
    if (selectionCount === 0) {
      this.stop();
      return;
    }
    
    const now = performance.now();
    const delta = now - this.lastUpdate;
    this.lastUpdate = now;
    
    // Update phase (0-1 over cycleDuration)
    this.phase = (this.phase + delta / this.cycleDuration) % 1;
    
    // Request redraw if app exists
    if (window.app?.requestRedraw) {
      window.app.requestRedraw();
    }
    
    // Continue loop at 30fps for selection animation
    this.animationId = setTimeout(() => {
      requestAnimationFrame(() => this.tick());
    }, 33); // ~30fps
  }

  /**
   * Draw selection indicator for a pin
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {number} x - Screen X position
   * @param {number} y - Screen Y position
   * @param {number} radius - Pin radius
   * @param {string} color - Base color of the pin
   * @param {number} selectionCount - Total number of selected items
   * @param {Object} options - Additional options
   */
  drawSelection(ctx, x, y, radius, color, selectionCount = 1, options = {}) {
    const { shape = 'circle', width = 0, height = 0 } = options;
    
    // Get color data with variants
    const colorData = window.schemaManager?.getPinColorData?.({ color, colorSlot: options.colorSlot }) 
      || { selected: ColorUtils?.lighten?.(color, 20) || '#ffffff' };
    
    const selectedColor = colorData.selected || '#ffffff';
    
    if (selectionCount === 1) {
      // Full expanding rings animation
      this.drawExpandingRings(ctx, x, y, radius, selectedColor, shape, width, height);
    } else if (selectionCount <= 10) {
      // Pulsing ring (shared phase)
      this.drawPulsingRing(ctx, x, y, radius, selectedColor, shape, width, height);
    } else {
      // Static highlight for many selections
      this.drawStaticSelection(ctx, x, y, radius, selectedColor, shape, width, height);
    }
  }

  /**
   * Draw expanding rings (for single selection)
   */
  drawExpandingRings(ctx, x, y, radius, color, shape, width, height) {
    ctx.save();
    
    for (let i = 0; i < this.maxRings; i++) {
      // Stagger ring phases
      const ringPhase = (this.phase + i * this.ringSpacing) % 1;
      
      // Ring expands from 1x to 2x radius
      const expansion = 1 + ringPhase * 0.8;
      
      // Opacity fades as ring expands
      const opacity = 1 - ringPhase;
      
      // Ring thickness decreases as it expands
      const lineWidth = Math.max(1, 3 * (1 - ringPhase * 0.5));
      
      ctx.strokeStyle = this.hexToRgba(color, opacity * 0.7);
      ctx.lineWidth = lineWidth;
      
      if (shape === 'circle' || shape === 'area-circle') {
        ctx.beginPath();
        ctx.arc(x, y, radius * expansion, 0, Math.PI * 2);
        ctx.stroke();
      } else {
        // Rectangle/card shapes
        const w = (width || radius * 2) * expansion;
        const h = (height || radius * 2) * expansion;
        ctx.beginPath();
        ctx.roundRect(x - w/2, y - h/2, w, h, 8 * expansion);
        ctx.stroke();
      }
    }
    
    ctx.restore();
  }

  /**
   * Draw pulsing ring (for multi-selection, shared phase)
   */
  drawPulsingRing(ctx, x, y, radius, color, shape, width, height) {
    ctx.save();
    
    // Gentle pulse: scale oscillates between 1.0 and 1.15
    const pulse = 1 + Math.sin(this.phase * Math.PI * 2) * 0.08;
    
    // Opacity oscillates between 0.4 and 0.8
    const opacity = 0.5 + Math.sin(this.phase * Math.PI * 2) * 0.3;
    
    ctx.strokeStyle = this.hexToRgba(color, opacity);
    ctx.lineWidth = 2.5;
    
    if (shape === 'circle' || shape === 'area-circle') {
      ctx.beginPath();
      ctx.arc(x, y, radius * pulse, 0, Math.PI * 2);
      ctx.stroke();
    } else {
      const w = (width || radius * 2) * pulse;
      const h = (height || radius * 2) * pulse;
      ctx.beginPath();
      ctx.roundRect(x - w/2, y - h/2, w, h, 6);
      ctx.stroke();
    }
    
    ctx.restore();
  }

  /**
   * Draw static selection (for many selections, no animation)
   */
  drawStaticSelection(ctx, x, y, radius, color, shape, width, height) {
    ctx.save();
    
    ctx.strokeStyle = this.hexToRgba(color, 0.6);
    ctx.lineWidth = 2;
    
    if (shape === 'circle' || shape === 'area-circle') {
      ctx.beginPath();
      ctx.arc(x, y, radius * 1.1, 0, Math.PI * 2);
      ctx.stroke();
    } else {
      const w = (width || radius * 2) * 1.05;
      const h = (height || radius * 2) * 1.05;
      ctx.beginPath();
      ctx.roundRect(x - w/2, y - h/2, w, h, 6);
      ctx.stroke();
    }
    
    ctx.restore();
  }

  /**
   * Convert hex to rgba
   */
  hexToRgba(hex, alpha) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return `rgba(255, 255, 255, ${alpha})`;
    return `rgba(${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}, ${alpha})`;
  }
}

// Create global instance
const selectionAnimator = new SelectionAnimator();
window.selectionAnimator = selectionAnimator;

// ============================================================================
// APPLICATION CLASS
// ============================================================================

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
      BranchManager: deps.BranchManager || window.BranchManager,
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
    this.dragManager = null;
    this.branchManager = null;
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

  // Initialize drag manager & branch manager early (before event handlers need it)
  initializeDragManagerEarly() {
    console.log("🎯 Initializing drag manager early");
    if (this.deps.DragManager) {
      this.dragManager = new this.deps.DragManager(this.appState);
      window.dragManager = this.dragManager;
      console.log("✅ Drag manager created and available globally");
    } else {
      console.warn("⚠️ DragManager dependency not available");
    }

    if (this.deps.BranchManager) {
      this.branchManager = new this.deps.BranchManager(this.appState);
      window.branchManager = this.branchManager;
      console.log("✅ Branch manager created and available globally");
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

    // Apply current theme without converting existing custom pin colors on startup
    if (this.deps.applyTheme && this.appState.currentThemeId) {
      this.deps.applyTheme(this.appState.currentThemeId, false);
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
      themes: window.THEMES || (typeof window.getThemes === "function" ? window.getThemes() : null) || [{ id: "dark", name: "Dark" }],
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

    // Initialize branch manager (hold-to-branch & 45° angular snapping)
    if (this.branchManager) {
      this.branchManager.initialize({
        draw: () => this.render(),
        saveAppState: this.deps.saveAppState,
        setSelectedPin: (idx) => {
          if (this.eventHandlers && typeof this.eventHandlers.setSelectedPin === 'function') {
            this.eventHandlers.setSelectedPin(idx);
          } else if (this.appState) {
            this.appState.selectedPinIndex = idx;
          }
        }
      });
      console.log("✅ Branch manager fully initialized with dependencies");
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

    // Keep canvas dimensions locked to true visible viewport
    this.canvas.width = window.innerWidth || 1200;
    const baseHeight = Math.max(300, (window.innerHeight - menuHeight - trayHeight) || 700);
    this.canvas.height = baseHeight;

    const container = document.getElementById('canvas-container');
    if (container) {
      container.style.height = ''; // Ensure CSS top:50px; bottom:140px governs viewport
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
      (eh && eh.isDraggingTextBubble) || // Text bubble creation preview
      (this.appState.connectStartIndex !== null && this.appState.connectMousePos) || // Connection preview
      (this.appState.selectedConnectionIndex !== null) || // Selected connection (marching ants)
      (selectionAnimator && selectionAnimator.isRunning) // Selection animation
    );
  }

  /**
   * Request a redraw on the next frame
   * Used by SelectionAnimator and other animation systems
   */
  requestRedraw() {
    this.needsRedraw = true;
    if (!this.isAnimating) {
      this.startAnimationLoop();
    }
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

    // Clear canvas first
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw all rendering layers in correct order
    this.drawWorldSpaceElements();
    this.drawScreenSpaceElements();
    this.drawUIElements();
  }

  // Draw world-space elements (scaled and translated)
  drawWorldSpaceElements() {
    this.ctx.save();
    this.ctx.translate(this.appState.offsetX, this.appState.offsetY);
    this.ctx.scale(this.appState.scale, this.appState.scale);

    // Draw canvas grid in world space behind all connections, areas, and pins
    if (this.appState.gridVisible !== false) {
      this.drawCanvasGrid(this.ctx);
    }

    // Draw connection preview first (behind other elements)
    this.drawConnectionPreview();

    // LAYERING FIX: Draw connections BEFORE pins so pins sit on top and mask line ends
    // This creates clean center-to-center connections with pins covering any line overlap
    this.drawConnections(this.ctx);

    // Draw selected connection highlight (marching ants) on top of connections
    this.drawSelectedConnectionHighlight(this.ctx);

    // Draw timeline if active
    this.drawTimeline(this.ctx);

    // Draw pins AFTER connections so they mask the connection line ends
    this.drawPins(this.ctx);

    // Draw hold-to-branch guides, charge ring, 45-degree reticle, and preview pin
    if (this.branchManager) {
      this.branchManager.drawWorld(this.ctx, this.appState);
    }

    this.ctx.restore();
  }

  // Draw subtle world-space alignment grid
  drawCanvasGrid(ctx) {
    if (typeof LayoutEngine === 'undefined') return;
    const viewport = this.getVisibleWorldBounds(100);
    if (!viewport) return;
    const theme = window.themeManager?.getCurrentTheme() || {};
    LayoutEngine.drawGrid(ctx, viewport, this.appState.scale, theme);
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

    // Viewport bounds for culling offscreen connections
    const viewport = this.getVisibleWorldBounds(100);

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

      // All connections are now pin-to-pin
      const startPin = this.appState.pins[startIndex];
      const endPin = this.appState.pins[endIndex];

      if (!startPin || !endPin) {
        return;
      }

      // Viewport culling: skip if both endpoints are offscreen on the same side
      if (viewport) {
        if (
          (startPin.x < viewport.left && endPin.x < viewport.left) ||
          (startPin.x > viewport.right && endPin.x > viewport.right) ||
          (startPin.y < viewport.top && endPin.y < viewport.top) ||
          (startPin.y > viewport.bottom && endPin.y > viewport.bottom)
        ) {
          return;
        }
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

      // Determine stroke style (gradient or solid color)
      const fromColor = startPin.color || "#666666";
      const toColor = endPin.color || "#666666";
      const useGradient = connection.useGradient && fromColor.toLowerCase() !== toColor.toLowerCase();

      if (useGradient) {
        // Create gradient from start pin to end pin
        const gradient = ctx.createLinearGradient(startX, startY, endX, endY);
        gradient.addColorStop(0, fromColor);
        gradient.addColorStop(1, toColor);
        ctx.strokeStyle = gradient;
      } else {
        ctx.strokeStyle = connection.color || "#666";
      }

      // Line width varies based on confidence score (1.5 to 4px)
      const confidence = connection.confidenceScore ?? 50;
      const baseLineWidth = 1.5 + (confidence / 100) * 2.5; // 1.5px at 0%, 4px at 100%
      ctx.lineWidth = baseLineWidth;

      // Glow effect based on validation percent
      const validation = connection.validationPercent ?? 0;
      if (validation > 0) {
        ctx.shadowColor = connection.color || "#58a6ff";
        ctx.shadowBlur = (validation / 100) * 10; // 0 to 10px blur
      } else {
        ctx.shadowColor = "transparent";
        ctx.shadowBlur = 0;
      }

      ctx.setLineDash([]); // Ensure solid line (not dashed)
      ctx.beginPath();

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

      // Reset shadow
      ctx.shadowColor = "transparent";
      ctx.shadowBlur = 0;

      // Draw label at midpoint if exists
      if (connection.label) {
        const connType = connection.type || this.appState.connectionType;
        let labelX, labelY;

        if (connType === "curved") {
          // For curved lines, calculate point at t=0.5 on the Bezier curve
          const dx = endX - startX;
          const dy = endY - startY;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist > 0) {
            const midX = (startX + endX) / 2;
            const midY = (startY + endY) / 2;
            const perpX = -dy / dist;
            const perpY = dx / dist;
            const curveAmount = 40;
            const ctrlX = midX + perpX * curveAmount;
            const ctrlY = midY + perpY * curveAmount;
            // Quadratic Bezier at t=0.5
            labelX = 0.25 * startX + 0.5 * ctrlX + 0.25 * endX;
            labelY = 0.25 * startY + 0.5 * ctrlY + 0.25 * endY;
          } else {
            labelX = (startX + endX) / 2;
            labelY = (startY + endY) / 2;
          }
        } else {
          // For straight lines, use midpoint
          labelX = (startX + endX) / 2;
          labelY = (startY + endY) / 2;
        }

        // Draw label background
        ctx.font = "12px -apple-system, BlinkMacSystemFont, sans-serif";
        const textMetrics = ctx.measureText(connection.label);
        const padding = 4;
        const bgWidth = textMetrics.width + padding * 2;
        const bgHeight = 16;

        ctx.fillStyle = "rgba(22, 27, 34, 0.9)";
        ctx.fillRect(labelX - bgWidth / 2, labelY - bgHeight / 2, bgWidth, bgHeight);

        // Draw label text
        ctx.fillStyle = "#e6edf3";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(connection.label, labelX, labelY);
      }
    });
  }

  // Draw selected connection highlight with marching ants effect
  drawSelectedConnectionHighlight(ctx) {
    const selectedIndex = this.appState.selectedConnectionIndex;
    if (selectedIndex === null || selectedIndex === undefined) return;

    const connection = this.appState.connections[selectedIndex];
    if (!connection) return;

    const startIndex = connection.from !== undefined ? connection.from : connection.startIndex;
    const endIndex = connection.to !== undefined ? connection.to : connection.endIndex;

    const startPin = this.appState.pins[startIndex];
    const endPin = this.appState.pins[endIndex];

    if (!startPin || !endPin) return;

    // Get pin centers
    const startAnchor = this.getPinCenter(startPin);
    const endAnchor = this.getPinCenter(endPin);

    if (!startAnchor || !endAnchor) return;

    const startX = Math.round(startAnchor.x);
    const startY = Math.round(startAnchor.y);
    const endX = Math.round(endAnchor.x);
    const endY = Math.round(endAnchor.y);

    // Get connection type
    const connType = connection.type || this.appState.connectionType;

    // Calculate control point for curved lines
    let controlX, controlY;
    if (connType === "curved") {
      const dx = endX - startX;
      const dy = endY - startY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > 0) {
        const midX = (startX + endX) / 2;
        const midY = (startY + endY) / 2;
        const perpX = -dy / dist;
        const perpY = dx / dist;
        const curveAmount = 40;
        controlX = midX + perpX * curveAmount;
        controlY = midY + perpY * curveAmount;
      }
    }

    // Animated marching ants offset (uses time from appState or performance.now)
    const time = performance.now() / 1000;
    const dashOffset = (time * 20) % 16; // Animate at 20 pixels per second

    // Draw two passes for black and white marching ants effect
    // First pass: white dashes (background)
    ctx.save();
    ctx.lineWidth = 4; // Slightly thicker than normal connection
    ctx.strokeStyle = '#ffffff';
    ctx.setLineDash([8, 8]);
    ctx.lineDashOffset = -dashOffset;
    ctx.beginPath();
    if (connType === "curved" && controlX !== undefined) {
      ctx.moveTo(startX, startY);
      ctx.quadraticCurveTo(controlX, controlY, endX, endY);
    } else {
      ctx.moveTo(startX, startY);
      ctx.lineTo(endX, endY);
    }
    ctx.stroke();

    // Second pass: black dashes (offset by half to create marching effect)
    ctx.strokeStyle = '#000000';
    ctx.lineDashOffset = -dashOffset - 8; // Offset by dash length
    ctx.beginPath();
    if (connType === "curved" && controlX !== undefined) {
      ctx.moveTo(startX, startY);
      ctx.quadraticCurveTo(controlX, controlY, endX, endY);
    } else {
      ctx.moveTo(startX, startY);
      ctx.lineTo(endX, endY);
    }
    ctx.stroke();

    ctx.setLineDash([]);
    ctx.restore();
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

  // Get visible world-space bounds with optional padding for viewport culling
  getVisibleWorldBounds(padding = 100) {
    if (!this.canvas) return null;
    const scale = (Number.isFinite(this.appState?.scale) && this.appState.scale > 0) ? this.appState.scale : 1;
    const ox = Number.isFinite(this.appState?.offsetX) ? this.appState.offsetX : 0;
    const oy = Number.isFinite(this.appState?.offsetY) ? this.appState.offsetY : 0;
    const container = document.getElementById("canvas-container");
    const width = (container && container.clientWidth) ? container.clientWidth : (this.canvas.width || 1200);
    const height = (container && container.clientHeight) ? container.clientHeight : (this.canvas.height || 700);

    return {
      left: (0 - ox) / scale - padding,
      top: (0 - oy) / scale - padding,
      right: (width - ox) / scale + padding,
      bottom: (height - oy) / scale + padding
    };
  }

  // Draw all pins
  drawPins(ctx) {
    if (!this.appState.pins) {
      return;
    }

    // Viewport bounds for culling offscreen pins
    const viewport = this.getVisibleWorldBounds(200);

    // Initialize label collision tracking for this frame
    window._drawnLabels = [];

    this.appState.pins.forEach((pin, index) => {
      if (!pin || !Number.isFinite(pin.x) || !Number.isFinite(pin.y)) return;

      // Viewport culling optimization: skip rendering pins outside view
      if (viewport) {
        const size = Math.max(
          Number(pin.width) || 0,
          Number(pin.height) || 0,
          Number(pin.radius) ? Number(pin.radius) * 2 : 0,
          Number(pin.areaSize) ? Number(pin.areaSize) * 2 : 0,
          pin.image?.size ? Number(pin.image.size) : 0,
          60
        );
        const boundRadius = (size / 2) * (Number(pin.pinScale) || 1);
        if (
          pin.x + boundRadius < viewport.left ||
          pin.x - boundRadius > viewport.right ||
          pin.y + boundRadius < viewport.top ||
          pin.y - boundRadius > viewport.bottom
        ) {
          return;
        }
      }
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
      }

      ctx.stroke();
      ctx.setLineDash([]); // Reset
    }

    // Draw bubble/thought preview with tail positioning
    if (window.app && window.app.eventHandlers && window.app.eventHandlers.isDraggingTextBubble &&
        window.app.eventHandlers.textBubbleDragStart && window.app.eventHandlers.textBubbleDragCurrent) {
      const eh = window.app.eventHandlers;
      const textTypeConfig = eh.getTextTypeConfig ? eh.getTextTypeConfig() : { shape: 'bubble' };
      
      // Show preview for bubble or thought shapes
      if (textTypeConfig.shape === 'bubble') {
        this.drawBubblePreview(ctx, eh);
      } else if (textTypeConfig.shape === 'thought') {
        this.drawThoughtPreview(ctx, eh);
      }
    }
  }

  /**
   * Draw a preview of a speech bubble with tail following mouse
   * Uses animated marching ants and shows classic comic-style pointed tail
   */
  drawBubblePreview(ctx, eventHandlers) {
    const startScreen = this.worldToScreen(
      eventHandlers.textBubbleDragStart.x, 
      eventHandlers.textBubbleDragStart.y
    );
    const currentScreen = this.worldToScreen(
      eventHandlers.textBubbleDragCurrent.x, 
      eventHandlers.textBubbleDragCurrent.y
    );

    // Default bubble size (scaled)
    const width = 140 * this.appState.scale;
    const height = 80 * this.appState.scale;
    const rx = width / 2;
    const ry = height / 2;

    // Calculate tail angle from bubble center to mouse
    const worldDx = eventHandlers.textBubbleDragCurrent.x - eventHandlers.textBubbleDragStart.x;
    const worldDy = eventHandlers.textBubbleDragCurrent.y - eventHandlers.textBubbleDragStart.y;
    const tailAngle = Math.atan2(worldDy, worldDx);
    const worldDragDistance = Math.sqrt(worldDx * worldDx + worldDy * worldDy);
    
    // Show tail if dragged more than 10 world units
    const showTail = worldDragDistance > 10;

    ctx.save();

    const bubbleColor = this.appState.selectedColor || "#58a6ff";
    
    // Animated marching ants
    const time = Date.now();
    ctx.lineDashOffset = -((time * 0.5) % 16);
    ctx.fillStyle = bubbleColor + "30";
    ctx.strokeStyle = bubbleColor;
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 8]);

    if (showTail) {
      // Draw bubble + tail as ONE shape (like the final result)
      // Classic comic tail: narrow base, pointed tip
      const tailBaseArc = 12 * Math.PI / 180;
      const tailLength = Math.min(width, height) * 0.35;
      
      const tailStartAngle = tailAngle - tailBaseArc;
      const tailEndAngle = tailAngle + tailBaseArc;
      
      const tipX = startScreen.x + (Math.max(rx, ry) + tailLength) * Math.cos(tailAngle);
      const tipY = startScreen.y + (Math.max(rx, ry) * 0.7 + tailLength) * Math.sin(tailAngle);
      
      ctx.beginPath();
      // Draw ellipse arc, leaving gap for tail
      ctx.ellipse(startScreen.x, startScreen.y, rx, ry, 0, tailEndAngle, tailStartAngle + Math.PI * 2);
      // Draw pointed tail
      ctx.lineTo(tipX, tipY);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      
      // Draw dot at tail tip
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.arc(tipX, tipY, 4, 0, Math.PI * 2);
      ctx.fillStyle = bubbleColor;
      ctx.fill();
    } else {
      // No tail yet - just draw ellipse
      ctx.beginPath();
      ctx.ellipse(startScreen.x, startScreen.y, rx, ry, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    ctx.setLineDash([]);

    // Helper text
    ctx.fillStyle = bubbleColor;
    ctx.font = "12px system-ui";
    ctx.textAlign = "center";
    ctx.fillText(
      showTail ? "Release to place" : "Drag to position tail",
      startScreen.x,
      startScreen.y + ry + 25
    );

    ctx.restore();
  }

  /**
   * Draw a preview of a thought bubble with cloud shape and trailing circles
   */
  drawThoughtPreview(ctx, eventHandlers) {
    const startScreen = this.worldToScreen(
      eventHandlers.textBubbleDragStart.x, 
      eventHandlers.textBubbleDragStart.y
    );

    // Default thought bubble size (scaled)
    const width = 140 * this.appState.scale;
    const height = 90 * this.appState.scale;
    const rx = width / 2;
    const ry = height / 2;

    // Calculate tail angle from drag
    const worldDx = eventHandlers.textBubbleDragCurrent.x - eventHandlers.textBubbleDragStart.x;
    const worldDy = eventHandlers.textBubbleDragCurrent.y - eventHandlers.textBubbleDragStart.y;
    const tailAngle = Math.atan2(worldDy, worldDx);
    const worldDragDistance = Math.sqrt(worldDx * worldDx + worldDy * worldDy);
    const showTail = worldDragDistance > 10;

    ctx.save();

    const bubbleColor = this.appState.selectedColor || "#58a6ff";
    
    // Animated marching ants
    const time = Date.now();
    ctx.lineDashOffset = -((time * 0.5) % 16);
    ctx.fillStyle = bubbleColor + "30";
    ctx.strokeStyle = bubbleColor;
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 8]);

    // Draw clean continuous cloud body preview
    const numLobes = 10;
    const bumpH = Math.min(rx, ry) * 0.26;

    ctx.beginPath();
    const startX = startScreen.x + (rx - 2);
    const startY = startScreen.y;
    ctx.moveTo(startX, startY);

    for (let i = 0; i < numLobes; i++) {
      const nextAngle = ((i + 1) / numLobes) * Math.PI * 2;
      const midAngle = (i + 0.5) * (Math.PI * 2 / numLobes);

      const ctrlX = startScreen.x + (rx + bumpH) * Math.cos(midAngle);
      const ctrlY = startScreen.y + (ry + bumpH) * Math.sin(midAngle);

      const nextX = startScreen.x + (rx - 2) * Math.cos(nextAngle);
      const nextY = startScreen.y + (ry - 2) * Math.sin(nextAngle);

      ctx.quadraticCurveTo(ctrlX, ctrlY, nextX, nextY);
    }

    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Draw trailing circular drops preview
    if (showTail) {
      ctx.setLineDash([]);
      const minDim = Math.min(rx, ry);
      const dropRadii = [minDim * 0.20, minDim * 0.13, minDim * 0.08];
      const attachX = startScreen.x + (rx + bumpH * 0.4) * Math.cos(tailAngle);
      const attachY = startScreen.y + (ry + bumpH * 0.4) * Math.sin(tailAngle);

      let currentDist = 0;
      dropRadii.forEach((radius, idx) => {
        if (idx === 0) {
          currentDist += radius + 8;
        } else {
          currentDist += dropRadii[idx - 1] + radius + 7;
        }
        const cx = attachX + currentDist * Math.cos(tailAngle);
        const cy = attachY + currentDist * Math.sin(tailAngle);

        ctx.beginPath();
        ctx.arc(cx, cy, Math.max(radius, 4), 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      });
    }

    ctx.setLineDash([]);

    // Helper text
    ctx.fillStyle = bubbleColor;
    ctx.font = "12px system-ui";
    ctx.textAlign = "center";
    ctx.fillText(
      showTail ? "Release to place" : "Drag to position circles",
      startScreen.x,
      startScreen.y + ry + 25
    );

    ctx.restore();
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
    // Helper to determine if a pin is an area pin
    const isArea = (pin) => {
      return Boolean(
        (pin.typeId && pin.typeId.startsWith("area:")) ||
        pin.shape === "area-circle" ||
        pin.shape === "area-rect" ||
        pin.areaType === "circle" ||
        pin.areaType === "square"
      );
    };

    // Helper to test if world coordinate (wx, wy) hits a specific pin
    const checkPinHit = (pin, checkAreaShape) => {
      if (!pin) return false;

      // 1. Check Image Hit Bounds (if pin has an image)
      if (pin.image && pin.image.dataUrl) {
        const imageSize = pin.image.size || 100;
        const imagePosition = pin.image.position || "center";
        let positionOffsetX = 0;
        let positionOffsetY = 0;

        switch (imagePosition) {
          case "top": positionOffsetY = -imageSize / 2; break;
          case "bottom": positionOffsetY = imageSize / 2; break;
          case "left": positionOffsetX = -imageSize / 2; break;
          case "right": positionOffsetX = imageSize / 2; break;
          case "top-left": positionOffsetX = -imageSize / 2; positionOffsetY = -imageSize / 2; break;
          case "top-right": positionOffsetX = imageSize / 2; positionOffsetY = -imageSize / 2; break;
          case "bottom-left": positionOffsetX = -imageSize / 2; positionOffsetY = imageSize / 2; break;
          case "bottom-right": positionOffsetX = imageSize / 2; positionOffsetY = imageSize / 2; break;
        }

        const imgCenterX = pin.x + positionOffsetX;
        const imgCenterY = pin.y + positionOffsetY;

        if (pin.image.style === "circular" || !pin.image.style) {
          const dx = wx - imgCenterX;
          const dy = wy - imgCenterY;
          if (dx * dx + dy * dy <= (imageSize / 2) * (imageSize / 2)) {
            return true;
          }
        } else {
          // Oval, portrait, landscape, or rounded rectangle bounds
          const halfSize = imageSize / 2;
          if (wx >= imgCenterX - halfSize && wx <= imgCenterX + halfSize &&
              wy >= imgCenterY - halfSize && wy <= imgCenterY + halfSize) {
            return true;
          }
        }
      }

      // 2. Area shapes (Circle & Rectangle/Square)
      if (checkAreaShape && isArea(pin)) {
        const isCircleArea = pin.typeId === "area:circle" || pin.areaType === "circle" || pin.shape === "area-circle";
        if (isCircleArea) {
          const radius = (pin.areaSize || pin.radius || 50) * (pin.areaScale || 1);
          const dx = wx - pin.x;
          const dy = wy - pin.y;
          if (dx * dx + dy * dy <= radius * radius) {
            return true;
          }
        } else {
          // Rectangular / square area
          const scale = pin.areaScale || 1;
          const w = (pin.width || (pin.areaSize ? pin.areaSize * 2 : 100)) * scale;
          const h = (pin.height || (pin.areaSize ? pin.areaSize * 2 : 100)) * scale;
          if (wx >= pin.x - w / 2 && wx <= pin.x + w / 2 && wy >= pin.y - h / 2 && wy <= pin.y + h / 2) {
            return true;
          }
        }
        // Center pin fallback
        const dx = wx - pin.x;
        const dy = wy - pin.y;
        if (Math.sqrt(dx * dx + dy * dy) <= Math.max(16, (pin.pinScale || 1) * 20)) {
          return true;
        }
        return false;
      }

      if (isArea(pin) && !checkAreaShape) {
        // In non-area pass, skip area pins so smaller contained pins get priority
        return false;
      }

      // 3. Text shapes that use rectangular hit detection
      const textShapes = ['bubble', 'rectangle', 'text-plain', 'text-title'];
      if (textShapes.includes(pin.shape)) {
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

        const left = pin.x - width/2;
        const right = pin.x + width/2;
        const top = pin.y - height/2;
        const bottom = pin.y + height/2 + titleHeight;

        if (wx >= left && wx <= right && wy >= top && wy <= bottom) {
          return true;
        }
      } else {
        // Standard circular hit detection for regular pins
        const dx = wx - pin.x;
        const dy = wy - pin.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        const scale = pin.pinScale || 1;
        const baseRadius = this.deps.PIN_BASES?.[pin.typeId]?.baseRadius || 10;
        const hitRadius = Math.max(16, baseRadius * scale * 2);

        if (distance <= hitRadius) {
          return true;
        }
      }

      return false;
    };

    // Pass 1: Check standard (non-area) pins first from top to bottom
    // so pins contained inside an area can be clicked/selected easily
    for (let i = this.appState.pins.length - 1; i >= 0; i--) {
      const pin = this.appState.pins[i];
      if (pin && !isArea(pin) && checkPinHit(pin, false)) {
        return i;
      }
    }

    // Pass 2: Check area pins from top to bottom
    for (let i = this.appState.pins.length - 1; i >= 0; i--) {
      const pin = this.appState.pins[i];
      if (pin && isArea(pin) && checkPinHit(pin, true)) {
        return i;
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

      // Get pin centers
      const startAnchor = this.getPinCenter(startPin);
      const endAnchor = this.getPinCenter(endPin);
      
      if (!startAnchor || !endAnchor) continue;

      const startX = startAnchor.x;
      const startY = startAnchor.y;
      const endX = endAnchor.x;
      const endY = endAnchor.y;

      // Check connection type
      const connType = conn.type || this.appState.connectionType;
      let distance;

      if (connType === "curved") {
        // For curved connections, calculate distance to the quadratic Bezier curve
        distance = this.pointToCurvedConnectionDistance(wx, wy, startX, startY, endX, endY);
      } else {
        // For straight connections, use line distance
        distance = this.pointToLineDistance(wx, wy, startX, startY, endX, endY);
      }

      if (distance <= hitDistance && distance < closestDistance) {
        closestConnection = i;
        closestDistance = distance;
      }
    }

    return closestConnection;
  }

  // Calculate distance from a point to a quadratic Bezier curve by sampling
  pointToCurvedConnectionDistance(px, py, x1, y1, x2, y2) {
    // Calculate the control point (same as in drawConnections)
    const dx = x2 - x1;
    const dy = y2 - y1;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist === 0) {
      return Math.sqrt((px - x1) ** 2 + (py - y1) ** 2);
    }

    const midX = (x1 + x2) / 2;
    const midY = (y1 + y2) / 2;

    // Perpendicular vector
    const perpX = -dy / dist;
    const perpY = dx / dist;

    // Control point with same curve amount as rendering
    const curveAmount = 40;
    const ctrlX = midX + perpX * curveAmount;
    const ctrlY = midY + perpY * curveAmount;

    // Sample points along the Bezier curve and find minimum distance
    let minDistance = Infinity;
    const numSamples = 20; // More samples = more accurate but slower

    for (let i = 0; i <= numSamples; i++) {
      const t = i / numSamples;
      
      // Quadratic Bezier formula: B(t) = (1-t)²P0 + 2(1-t)tP1 + t²P2
      const oneMinusT = 1 - t;
      const bx = oneMinusT * oneMinusT * x1 + 2 * oneMinusT * t * ctrlX + t * t * x2;
      const by = oneMinusT * oneMinusT * y1 + 2 * oneMinusT * t * ctrlY + t * t * y2;

      const distance = Math.sqrt((px - bx) ** 2 + (py - by) ** 2);
      if (distance < minDistance) {
        minDistance = distance;
      }
    }

    return minDistance;
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
    
    // Manage selection animation
    this.updateSelectionAnimation();
  }

  /**
   * Get total count of selected items (pins + connections)
   */
  getSelectionCount() {
    let count = 0;
    if (this.appState.selectedPinIndex !== null) count++;
    if (this.appState.selectedPins?.length > 0) count += this.appState.selectedPins.length;
    if (this.appState.selectedConnectionIndex !== null) count++;
    return count;
  }

  /**
   * Start or stop selection animation based on selection state
   */
  updateSelectionAnimation() {
    const count = this.getSelectionCount();
    if (count > 0) {
      if (!selectionAnimator.isRunning) {
        selectionAnimator.start();
      }
    } else {
      selectionAnimator.stop();
    }
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
      // Use BoardManager for multi-board system (skip synchronous thumbnail generation for performance)
      this.boardManager.saveBoard(false);
    } else if (this.boardManager) {
      // Multi-board system active but no board ID - don't save to legacy key
      // This happens after clearBoard() - board needs to be created/selected first
      console.log("⚠️ No active board to save (board was cleared or not created yet)");
    } else if (this.deps.saveAppState && this.appState) {
      // Fallback to legacy save (only when NOT using multi-board system)
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
    // Layout Dock controls
    const layoutDock = document.getElementById("layout-dock");
    const layoutDockToggle = document.getElementById("layout-dock-toggle");
    if (layoutDockToggle && layoutDock) {
      layoutDockToggle.onclick = () => {
        layoutDock.classList.toggle("collapsed");
      };
    }

    const gridBtn = document.getElementById("btn-layout-grid");
    if (gridBtn) {
      gridBtn.onclick = () => this.layoutGrid();
    }

    // Radial layout button
    const radialBtn = document.getElementById("radial");
    if (radialBtn) {
      radialBtn.onclick = () => this.layoutRadial();
    }

    // Force-directed physics layout button
    const magicBtn = document.getElementById("magic");
    if (magicBtn) {
      magicBtn.onclick = () => this.layoutForce();
    }

    // Timeline button
    const timelineBtn = document.getElementById("timeline");
    if (timelineBtn) {
      timelineBtn.onclick = () => this.layoutTimeline();
    }

    // Clusters layout button
    const clustersBtn = document.getElementById("clusters");
    if (clustersBtn) {
      clustersBtn.onclick = () => this.layoutClusters();
    }

    // Group layout button (Organize by group/family)
    const groupsBtn = document.getElementById("btn-layout-groups");
    if (groupsBtn) {
      groupsBtn.onclick = () => this.layoutByGroup("family");
    }

    // Canvas grid toggle button
    const toggleGridBtn = document.getElementById("btn-toggle-grid");
    if (toggleGridBtn) {
      if (this.appState.gridVisible !== false) {
        toggleGridBtn.classList.add("active");
      }
      toggleGridBtn.onclick = () => {
        this.appState.gridVisible = !this.appState.gridVisible;
        toggleGridBtn.classList.toggle("active", this.appState.gridVisible);
        this.draw();
      };
    }

    const resetBtn = document.getElementById("reset");
    if (resetBtn) {
      resetBtn.onclick = () => this.resetBoard();
    }
  }

  // Center and fit canvas camera on all pins
  centerViewOnPins(padding = 100, targetCenter = null) {
    if (!this.appState.pins || this.appState.pins.length === 0) return;

    if (typeof this.resizeCanvas === 'function') {
      this.resizeCanvas();
    }

    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;
    let validCount = 0;

    this.appState.pins.forEach(pin => {
      const px = Number(pin.x);
      const py = Number(pin.y);
      if (!Number.isFinite(px) || !Number.isFinite(py)) return;

      validCount++;
      const w = Number.isFinite(Number(pin.width)) ? Number(pin.width) : 0;
      const h = Number.isFinite(Number(pin.height)) ? Number(pin.height) : 0;
      const r = Number.isFinite(Number(pin.radius)) ? Number(pin.radius) * 2 : 0;
      const a = Number.isFinite(Number(pin.areaSize)) ? Number(pin.areaSize) * 2 : 0;
      const rawImgSize = pin.image?.size;
      const imgSize = Number.isFinite(Number(rawImgSize)) ? Number(rawImgSize) : (parseFloat(rawImgSize) || 0);
      const size = Math.max(w, h, r, a, imgSize, 60);

      const halfSize = (Number.isFinite(size) ? size : 60) / 2;
      minX = Math.min(minX, px - halfSize);
      maxX = Math.max(maxX, px + halfSize);
      minY = Math.min(minY, py - halfSize);
      maxY = Math.max(maxY, py + halfSize);
    });

    if (validCount === 0 || !Number.isFinite(minX) || !Number.isFinite(maxX) || !Number.isFinite(minY) || !Number.isFinite(maxY)) {
      return;
    }

    const centerX = (targetCenter && Number.isFinite(targetCenter.x)) ? targetCenter.x : (minX + maxX) / 2;
    const centerY = (targetCenter && Number.isFinite(targetCenter.y)) ? targetCenter.y : (minY + maxY) / 2;

    const maxExtentX = Math.max(Math.abs(maxX - centerX), Math.abs(centerX - minX));
    const maxExtentY = Math.max(Math.abs(maxY - centerY), Math.abs(centerY - minY));
    const contentWidth = Math.max(80, maxExtentX * 2 + padding * 2);
    const contentHeight = Math.max(80, maxExtentY * 2 + padding * 2);

    const container = document.getElementById("canvas-container");
    const menuHeight = this.deps?.MENU_HEIGHT || 50;
    const trayHeight = this.deps?.TRAY_HEIGHT || 140;
    const viewWidth = (container && container.clientWidth) ? container.clientWidth : (this.canvas ? this.canvas.width : (window.innerWidth || 1200));
    const viewHeight = (container && container.clientHeight && !container.style.height)
      ? container.clientHeight
      : Math.max(300, (window.innerHeight - menuHeight - trayHeight) || 700);

    const scaleX = viewWidth / contentWidth;
    const scaleY = viewHeight / contentHeight;
    const newScale = Math.max(0.2, Math.min(scaleX, scaleY, 1.0));

    if (Number.isFinite(newScale) && Number.isFinite(centerX) && Number.isFinite(centerY)) {
      this.appState.scale = newScale;
      this.appState.offsetX = Math.round(viewWidth / 2 - centerX * newScale);
      this.appState.offsetY = Math.round(viewHeight / 2 - centerY * newScale);
    }

    if (typeof this.syncGlobalVariables === "function") {
      this.syncGlobalVariables();
    }
  }

  // Grid layout - arrange pins in a neat, balanced matrix and center view
  layoutGrid() {
    if (!this.appState.pins || this.appState.pins.length === 0) return;
    this.appState.timelineActive = false;
    if (typeof this.appState.saveHistory === "function") {
      this.appState.saveHistory();
    }
    this.saveState();

    let center = null;
    if (typeof LayoutEngine !== "undefined") {
      center = LayoutEngine.applyDefaultGrid(this.appState.pins);
    } else {
      const pins = this.appState.pins;
      const count = pins.length;
      const cols = Math.ceil(Math.sqrt(count));
      const rows = Math.ceil(count / cols);

      const spacingX = 220;
      const spacingY = 160;

      let currentCenterX = 0;
      let currentCenterY = 0;
      let validCount = 0;
      pins.forEach(p => {
        const px = Number(p.x);
        const py = Number(p.y);
        if (Number.isFinite(px) && Number.isFinite(py)) {
          currentCenterX += px;
          currentCenterY += py;
          validCount++;
        }
      });

      if (validCount > 0) {
        currentCenterX = Math.round(currentCenterX / validCount);
        currentCenterY = Math.round(currentCenterY / validCount);
      } else {
        const container = document.getElementById("canvas-container");
        currentCenterX = Math.round((container?.clientWidth || window.innerWidth || 1200) / 2);
        currentCenterY = Math.round(((container?.clientHeight || window.innerHeight - 190) || 700) / 2);
      }

      center = { x: currentCenterX, y: currentCenterY };
      const totalWidth = (cols - 1) * spacingX;
      const totalHeight = (rows - 1) * spacingY;
      const startX = currentCenterX - totalWidth / 2;
      const startY = currentCenterY - totalHeight / 2;

      pins.forEach((pin, i) => {
        const col = i % cols;
        const row = Math.floor(i / cols);
        pin.x = Math.round(startX + col * spacingX);
        pin.y = Math.round(startY + row * spacingY);
      });
    }

    this.centerViewOnPins(100, center);
    this.saveState();
    this.draw();
    this.render();
  }

  // Group layout - organize pins by family, color, or type into aligned sub-grids on a macro-grid
  layoutByGroup(groupBy = "family") {
    if (!this.appState.pins || this.appState.pins.length === 0) return;
    this.appState.timelineActive = false;
    if (typeof this.appState.saveHistory === "function") {
      this.appState.saveHistory();
    }
    this.saveState();

    let center = null;
    if (typeof LayoutEngine !== "undefined") {
      center = LayoutEngine.applyGroupLayout(this.appState.pins, { groupBy });
    }

    this.centerViewOnPins(100, center);
    this.saveState();
    this.draw();
    this.render();
  }

  // Radial / Starburst layout - positions root in center, neighbors in concentric rings
  layoutRadial() {
    if (!this.appState.pins || this.appState.pins.length === 0) return;
    this.appState.timelineActive = false;
    if (typeof this.appState.saveHistory === "function") {
      this.appState.saveHistory();
    }
    this.saveState();

    // Determine root: active selected pin, or highest connection degree
    const pins = this.appState.pins;
    const connections = this.appState.connections || [];
    let rootIndex = 0;
    if (this.appState.selectedPinIndex !== null && this.appState.selectedPinIndex >= 0 && this.appState.selectedPinIndex < pins.length) {
      rootIndex = this.appState.selectedPinIndex;
    } else {
      const degree = new Array(pins.length).fill(0);
      connections.forEach(c => {
        const from = Number(c.from !== undefined ? c.from : c.startIndex);
        const to = Number(c.to !== undefined ? c.to : c.endIndex);
        if (Number.isInteger(from) && from >= 0 && from < pins.length &&
            Number.isInteger(to) && to >= 0 && to < pins.length) {
          degree[from]++;
          degree[to]++;
        }
      });
      let maxDeg = -1;
      degree.forEach((deg, idx) => {
        if (deg > maxDeg) {
          maxDeg = deg;
          rootIndex = idx;
        }
      });
    }

    let center = null;
    if (typeof LayoutEngine !== "undefined" && typeof LayoutEngine.applyRadialLayout === "function") {
      center = LayoutEngine.applyRadialLayout(pins, connections, rootIndex);
    } else {
      let currentCenterX = 0;
      let currentCenterY = 0;
      let validCount = 0;
      pins.forEach(p => {
        const px = Number(p.x);
        const py = Number(p.y);
        if (Number.isFinite(px) && Number.isFinite(py)) {
          currentCenterX += px;
          currentCenterY += py;
          validCount++;
        }
      });

      if (validCount > 0) {
        currentCenterX = Math.round(currentCenterX / validCount);
        currentCenterY = Math.round(currentCenterY / validCount);
      } else {
        const container = document.getElementById("canvas-container");
        currentCenterX = Math.round((container?.clientWidth || window.innerWidth || 1200) / 2);
        currentCenterY = Math.round(((container?.clientHeight || window.innerHeight - 190) || 700) / 2);
      }

      center = { x: currentCenterX, y: currentCenterY };
      pins[rootIndex].x = currentCenterX;
      pins[rootIndex].y = currentCenterY;

      // Find immediate connections
      const neighbors = new Set();
      connections.forEach(c => {
        const from = Number(c.from !== undefined ? c.from : c.startIndex);
        const to = Number(c.to !== undefined ? c.to : c.endIndex);
        if (from === rootIndex && to !== rootIndex && to >= 0 && to < pins.length) neighbors.add(to);
        if (to === rootIndex && from !== rootIndex && from >= 0 && from < pins.length) neighbors.add(from);
      });

      const ring1Pins = Array.from(neighbors).map(i => pins[i]).filter(Boolean);
      const otherPins = pins.filter((p, i) => i !== rootIndex && !neighbors.has(i));

      if (ring1Pins.length > 0) {
        const r1 = Math.max(200, ring1Pins.length * 36);
        const step1 = (Math.PI * 2) / ring1Pins.length;
        ring1Pins.forEach((p, i) => {
          p.x = Math.round(currentCenterX + r1 * Math.cos(i * step1));
          p.y = Math.round(currentCenterY + r1 * Math.sin(i * step1));
        });
      }

      if (otherPins.length > 0) {
        const r2 = Math.max(380, ring1Pins.length * 36 + otherPins.length * 28);
        const step2 = (Math.PI * 2) / otherPins.length;
        otherPins.forEach((p, i) => {
          p.x = Math.round(currentCenterX + r2 * Math.cos(i * step2));
          p.y = Math.round(currentCenterY + r2 * Math.sin(i * step2));
        });
      }
    }

    this.centerViewOnPins(100, center);
    this.saveState();
    this.draw();
    this.render();
  }

  // Force-directed layout - untangles overlapping nodes using spring-embedder simulation
  layoutForce() {
    if (!this.appState.pins || this.appState.pins.length < 2) return;
    this.appState.timelineActive = false;
    if (typeof this.appState.saveHistory === "function") {
      this.appState.saveHistory();
    }
    this.saveState();

    const pins = this.appState.pins;
    const connections = this.appState.connections || [];
    const n = pins.length;

    let currentCenterX = 0;
    let currentCenterY = 0;
    let validCount = 0;
    pins.forEach(p => {
      const px = Number(p.x);
      const py = Number(p.y);
      if (Number.isFinite(px) && Number.isFinite(py)) {
        currentCenterX += px;
        currentCenterY += py;
        validCount++;
      }
    });

    if (validCount > 0) {
      currentCenterX = Math.round(currentCenterX / validCount);
      currentCenterY = Math.round(currentCenterY / validCount);
    } else {
      const container = document.getElementById("canvas-container");
      currentCenterX = Math.round((container?.clientWidth || window.innerWidth || 1200) / 2);
      currentCenterY = Math.round(((container?.clientHeight || window.innerHeight - 190) || 700) / 2);
    }

    const K = 190; // Equilibrium distance
    const iterations = 80;
    const dt = 0.35;

    for (let it = 0; it < iterations; it++) {
      const fx = new Float32Array(n);
      const fy = new Float32Array(n);

      // Repulsion between all node pairs
      for (let i = 0; i < n; i++) {
        for (let j = i + 1; j < n; j++) {
          let dx = pins[i].x - pins[j].x;
          let dy = pins[i].y - pins[j].y;
          let dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 1 || !Number.isFinite(dist)) {
            dx = (Math.random() - 0.5) * 10;
            dy = (Math.random() - 0.5) * 10;
            dist = Math.sqrt(dx * dx + dy * dy) || 1;
          }
          const repForce = (K * K) / dist;
          const fxi = (dx / dist) * repForce;
          const fyi = (dy / dist) * repForce;
          if (Number.isFinite(fxi) && Number.isFinite(fyi)) {
            fx[i] += fxi; fy[i] += fyi;
            fx[j] -= fxi; fy[j] -= fyi;
          }
        }
      }

      // Attraction along connection springs
      connections.forEach(c => {
        const from = Number(c.from !== undefined ? c.from : c.startIndex);
        const to = Number(c.to !== undefined ? c.to : c.endIndex);
        if (Number.isInteger(from) && from >= 0 && from < n &&
            Number.isInteger(to) && to >= 0 && to < n && from !== to &&
            pins[from] && pins[to]) {
          let dx = pins[from].x - pins[to].x;
          let dy = pins[from].y - pins[to].y;
          let dist = Math.max(1, Math.sqrt(dx * dx + dy * dy));
          const attForce = (dist * dist) / K;
          const fxi = (dx / dist) * attForce;
          const fyi = (dy / dist) * attForce;
          if (Number.isFinite(fxi) && Number.isFinite(fyi)) {
            fx[from] -= fxi; fy[from] -= fyi;
            fx[to] += fxi; fy[to] += fyi;
          }
        }
      });

      // Gravity pulling toward centroid
      for (let i = 0; i < n; i++) {
        fx[i] -= (pins[i].x - currentCenterX) * 0.04;
        fy[i] -= (pins[i].y - currentCenterY) * 0.04;
      }

      // Cooling factor
      const temp = 1.0 - (it / iterations) * 0.85;
      for (let i = 0; i < n; i++) {
        const dispLen = Math.sqrt(fx[i] * fx[i] + fy[i] * fy[i]);
        if (dispLen > 0 && Number.isFinite(dispLen)) {
          const step = Math.min(dispLen, 35 * temp);
          const nx = pins[i].x + Math.round((fx[i] / dispLen) * step * dt);
          const ny = pins[i].y + Math.round((fy[i] / dispLen) * step * dt);
          if (Number.isFinite(nx)) pins[i].x = nx;
          if (Number.isFinite(ny)) pins[i].y = ny;
        }
      }
    }

    this.centerViewOnPins();
    this.saveState();
    this.draw();
    this.render();
  }

  // Affinity Clusters layout - groups pins into clusters by color/theme
  layoutClusters() {
    if (!this.appState.pins || this.appState.pins.length === 0) return;
    this.appState.timelineActive = false;
    if (typeof this.appState.saveHistory === "function") {
      this.appState.saveHistory();
    }
    this.saveState();

    if (typeof LayoutEngine !== "undefined") {
      LayoutEngine.applyGroupLayout(this.appState.pins, { groupBy: "color" });
    } else {
      const pins = this.appState.pins;
      const count = pins.length;

      let currentCenterX = 0;
      let currentCenterY = 0;
      let validCount = 0;
      pins.forEach(p => {
        const px = Number(p.x);
        const py = Number(p.y);
        if (Number.isFinite(px) && Number.isFinite(py)) {
          currentCenterX += px;
          currentCenterY += py;
          validCount++;
        }
      });

      if (validCount > 0) {
        currentCenterX = Math.round(currentCenterX / validCount);
        currentCenterY = Math.round(currentCenterY / validCount);
      } else {
        const container = document.getElementById("canvas-container");
        currentCenterX = Math.round((container?.clientWidth || window.innerWidth || 1200) / 2);
        currentCenterY = Math.round(((container?.clientHeight || window.innerHeight - 190) || 700) / 2);
      }

      // Group pins by color or slot
      const groups = new Map();
      pins.forEach(pin => {
        const key = pin.color || (pin.colorSlot !== undefined ? `slot_${pin.colorSlot}` : "default");
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key).push(pin);
      });

      const groupKeys = Array.from(groups.keys());
      const numGroups = groupKeys.length;

      if (numGroups === 1) {
        this.layoutGrid();
        return;
      }

      const clusterRingRadius = Math.max(260, numGroups * 85);
      const angleStep = (Math.PI * 2) / numGroups;

      groupKeys.forEach((key, gIdx) => {
        const groupPins = groups.get(key);
        const gCenterX = currentCenterX + clusterRingRadius * Math.cos(gIdx * angleStep);
        const gCenterY = currentCenterY + clusterRingRadius * Math.sin(gIdx * angleStep);

        if (groupPins.length === 1) {
          groupPins[0].x = Math.round(gCenterX);
          groupPins[0].y = Math.round(gCenterY);
        } else {
          const subRadius = Math.max(70, groupPins.length * 24);
          const subStep = (Math.PI * 2) / groupPins.length;
          groupPins.forEach((p, pIdx) => {
            p.x = Math.round(gCenterX + subRadius * Math.cos(pIdx * subStep));
            p.y = Math.round(gCenterY + subRadius * Math.sin(pIdx * subStep));
          });
        }
      });
    }

    this.centerViewOnPins();
    this.saveState();
    this.draw();
    this.render();
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
    if (typeof this.appState.saveHistory === "function") {
      this.appState.saveHistory();
    }
    this.saveState();

    // Parse dates and sort chronologically - robustly extract numeric timestamp
    timedPins.forEach((tp) => {
      const parsed = typeof this.deps.parseDate === "function" ? this.deps.parseDate(tp.dateStr) : null;
      if (parsed && typeof parsed === "object" && typeof parsed.timestamp === "number" && !isNaN(parsed.timestamp)) {
        tp.timestamp = parsed.timestamp;
      } else if (typeof parsed === "number" && !isNaN(parsed)) {
        tp.timestamp = parsed;
      } else {
        const parsedTime = Date.parse(tp.dateStr);
        tp.timestamp = !isNaN(parsedTime) ? parsedTime : Date.now();
      }
    });
    timedPins.sort((a, b) => a.timestamp - b.timestamp);
    this.appState.timelinePins = timedPins;

    const minTime = timedPins[0].timestamp;
    const maxTime = timedPins[timedPins.length - 1].timestamp;
    const timeSpan = maxTime - minTime || 1;

    // Calculate timeline span based on number of pins (ensure good spacing)
    const pinSpacing = 150; // World units between pins
    const timelineWidth = Math.max(pinSpacing * (timedPins.length - 1), 500);
    const horizontalPadding = 100; // Padding on each end

    // Center the timeline around the current view center
    const container = document.getElementById("canvas-container");
    const viewWidth = (container && container.clientWidth) ? container.clientWidth : (this.canvas ? this.canvas.width : (window.innerWidth || 1200));
    const currentScale = this.appState.scale || 1;
    const viewCenterX = (viewWidth / 2 - (this.appState.offsetX || 0)) / currentScale;
    this.appState.timelineLeft = viewCenterX - timelineWidth / 2 - horizontalPadding;
    this.appState.timelineRight = viewCenterX + timelineWidth / 2 + horizontalPadding;

    // Position timeline below existing pins (using fixed world coordinates)
    const lowestY = this.appState.pins.length ? Math.max(...this.appState.pins.map((p) => Number(p.y) || 0)) : 0;
    const footerMarginWorld = 200; // Fixed world units below the lowest pin
    this.appState.timelineY = lowestY + footerMarginWorld;

    // Distance from timeline to pins (alternating above/below)
    const offsetWorld = 100; // Fixed world units

    // Activate timeline
    this.appState.timelineActive = true;

    // Position pins along timeline chronologically
    const worldSpan = this.appState.timelineRight - this.appState.timelineLeft - (2 * horizontalPadding);
    timedPins.forEach((tp, i) => {
      const t = (tp.timestamp - minTime) / timeSpan;
      tp.pin.x = Math.round(this.appState.timelineLeft + horizontalPadding + (t * worldSpan));
      tp.pin.y = Math.round(this.appState.timelineY + (i % 2 === 0 ? -offsetWorld : offsetWorld));
    });

    // Center camera on the timeline and all pins
    this.centerViewOnPins();

    // Save state and redraw
    this.saveState();
    this.draw();
    this.render();
  }


  // Reset the entire board (clears contents but keeps the board)
  resetBoard() {
    if (confirm("Are you sure you want to reset the entire board? This cannot be undone!")) {
      // Preserve board identity
      const boardMeta = this.appState.meta ? { ...this.appState.meta } : null;
      
      // Clear pins and connections
      this.appState.pins = [];
      this.appState.connections = [];
      
      // Clear selection state
      this.appState.selectedPinIndex = null;
      this.appState.selectedPins = [];
      this.appState.selectedTextIndex = null;
      this.appState.connectStartIndex = null;
      this.appState.connectMousePos = null;
      this.appState.connectionMode = null;
      this.appState.clearConnectionSelection();
      
      // Reset view
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

      // Restore board identity (keep the same board, just cleared)
      if (boardMeta) {
        this.appState.meta = boardMeta;
      }

      // Clear image cache
      if (window.imageCache) {
        window.imageCache.clear();
      }

      // Clear history
      this.appState.history = [];

      // Save the reset state
      if (this.boardManager && this.appState.meta?.id) {
        this.boardManager.saveBoard();
        console.log("✅ Board reset and saved via BoardManager");
      } else if (!this.boardManager) {
        // Legacy mode - save to localStorage
        this.deps.saveAppState(this.appState);
      }

      // Redraw
      this.render();
      
      // Update tray if available
      if (this.trayManager) {
        this.trayManager.render();
      }
      
      console.log("✅ Board reset complete");
    }
  }
}

// Export for global access
window.Application = Application;
