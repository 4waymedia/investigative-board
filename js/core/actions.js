// ============================================================================
// ACTIONS MODULE - Centralized Action Registry & Schema System
// ============================================================================
// This module provides a single source of truth for all application actions,
// keyboard shortcuts, and pin-type behaviors. It eliminates scattered logic
// and enables user customization of shortcuts.
// ============================================================================

// ============================================================================
// PIN TYPE TO MODAL MAPPINGS
// ============================================================================
// Defines which modal/editor should open for each pin shape

const PIN_MODAL_MAPPINGS = {
  // Text-based pins use the text modal
  "bubble": "text",
  "rectangle": "text", 
  "text-plain": "text",
  "text-title": "text",
  
  // Card pins use the card modal
  "card": "card",
  
  // Area pins use area modal (or pin modal with area options)
  "area-circle": "area",
  "area-rect": "area",
  
  // Standard pins use the pin modal
  "circle": "pin",
  "rect": "pin",
  "pill": "pin",
  "diamond": "pin",
  "person": "pin",
  "business-building": "pin",
};

// ============================================================================
// ACTION CONTEXTS
// ============================================================================
// Actions can be context-specific (only available in certain states)

const ACTION_CONTEXTS = {
  GLOBAL: "global",           // Always available
  PIN_SELECTED: "pin",        // When a pin is selected
  CONNECTION_SELECTED: "connection", // When a connection is selected
  MULTI_SELECT: "multi",      // When multiple items selected
  CANVAS: "canvas",           // General canvas actions
  MODAL_OPEN: "modal",        // When a modal is open
};

// ============================================================================
// ACTION DEFINITIONS
// ============================================================================
// Central registry of all application actions

const ACTION_REGISTRY = {
  // -------------------------------------------------------------------------
  // PIN ACTIONS
  // -------------------------------------------------------------------------
  "pin:edit": {
    id: "pin:edit",
    label: "Edit Pin",
    description: "Open the appropriate editor for the selected pin",
    context: ACTION_CONTEXTS.PIN_SELECTED,
    execute: (pinIndex) => {
      const pin = window.app?.appState?.pins[pinIndex];
      if (!pin) {
        console.error("❌ Action pin:edit - Pin not found:", pinIndex);
        return false;
      }
      
      const modalType = PIN_MODAL_MAPPINGS[pin.shape] || "pin";
      
      switch (modalType) {
        case "text":
          if (window.openTextModal) {
            window.openTextModal({
              id: pin.id,
              x: window.innerWidth / 2,
              y: window.innerHeight / 2,
              initialText: pin.label || '',
              width: pin.width || 200,
              height: pin.height || 50
            });
            return true;
          }
          break;
        case "card":
          if (window.openCardModal) {
            window.openCardModal(pinIndex);
            return true;
          }
          break;
        case "area":
          // Area pins can use pin modal for now (extend later)
          if (window.app?.modalManager?.openPinModal) {
            window.app.modalManager.openPinModal(pinIndex);
            return true;
          }
          break;
        case "pin":
        default:
          if (window.app?.modalManager?.openPinModal) {
            window.app.modalManager.openPinModal(pinIndex);
            return true;
          } else if (window.openPinModal) {
            window.openPinModal(pinIndex);
            return true;
          }
          break;
      }
      
      console.error("❌ Action pin:edit - No modal available for type:", modalType);
      return false;
    }
  },

  "pin:delete": {
    id: "pin:delete",
    label: "Delete Pin",
    description: "Delete the selected pin",
    context: ACTION_CONTEXTS.PIN_SELECTED,
    requiresConfirmation: true,
    confirmMessage: "Delete this pin?",
    execute: (pinIndex) => {
      window.app.appState.pins.splice(pinIndex, 1);
      window.app.setSelectedPin(null);
      window.app.saveState();
      window.draw();
      return true;
    }
  },

  "pin:duplicate": {
    id: "pin:duplicate",
    label: "Duplicate Pin",
    description: "Create a copy of the selected pin",
    context: ACTION_CONTEXTS.PIN_SELECTED,
    execute: (pinIndex) => {
      const pin = window.app?.appState?.pins[pinIndex];
      if (!pin) return false;
      
      const newPin = { 
        ...pin, 
        id: Date.now(),
        x: pin.x + 30,
        y: pin.y + 30
      };
      window.app.appState.pins.push(newPin);
      window.app.appState.saveHistory();
      window.app.saveState();
      window.draw();
      return true;
    }
  },

  "pin:connect": {
    id: "pin:connect",
    label: "Start Connection",
    description: "Start drawing a connection from this pin",
    context: ACTION_CONTEXTS.PIN_SELECTED,
    execute: (pinIndex) => {
      window.app.appState.connectStartIndex = pinIndex;
      window.draw();
      return true;
    }
  },

  "pin:setParent": {
    id: "pin:setParent",
    label: "Set as Parent",
    description: "Set this pin as parent for new connections",
    context: ACTION_CONTEXTS.PIN_SELECTED,
    execute: (pinIndex) => {
      window.app.appState.connectStartIndex = pinIndex;
      window.app.appState.connectionMode = 'parent';
      window.draw();
      return true;
    }
  },

  "pin:focus": {
    id: "pin:focus",
    label: "Focus on Pin",
    description: "Center view on this pin and its connections",
    context: ACTION_CONTEXTS.PIN_SELECTED,
    execute: (pinIndex) => {
      if (window.focusOnPin) {
        window.focusOnPin(pinIndex);
        return true;
      }
      return false;
    }
  },

  "pin:toggleConnectionType": {
    id: "pin:toggleConnectionType",
    label: "Toggle Connection Types",
    description: "Toggle all connections of this pin between straight and curved",
    context: ACTION_CONTEXTS.PIN_SELECTED,
    execute: (pinIndex) => {
      if (window.togglePinConnectionType) {
        window.togglePinConnectionType(pinIndex);
        return true;
      }
      return false;
    }
  },

  "pin:colorPicker": {
    id: "pin:colorPicker",
    label: "Quick Color Picker",
    description: "Open color picker radial for selected pin",
    context: ACTION_CONTEXTS.PIN_SELECTED,
    execute: (pinIndex) => {
      if (window.openColorRadialForPin) {
        window.openColorRadialForPin(pinIndex);
        return true;
      }
      return false;
    }
  },

  // -------------------------------------------------------------------------
  // CONNECTION ACTIONS
  // -------------------------------------------------------------------------
  "connection:edit": {
    id: "connection:edit",
    label: "Edit Connection",
    description: "Open the connection editor",
    context: ACTION_CONTEXTS.CONNECTION_SELECTED,
    execute: (connectionIndex) => {
      if (window.openConnectionModal) {
        window.openConnectionModal(connectionIndex);
        return true;
      }
      return false;
    }
  },

  "connection:delete": {
    id: "connection:delete",
    label: "Delete Connection",
    description: "Delete the selected connection",
    context: ACTION_CONTEXTS.CONNECTION_SELECTED,
    requiresConfirmation: true,
    confirmMessage: "Delete this connection?",
    execute: (connectionIndex) => {
      window.app.appState.connections.splice(connectionIndex, 1);
      window.app.appState.clearConnectionSelection();
      window.app.appState.saveHistory();
      window.app.saveState();
      window.draw();
      return true;
    }
  },

  "connection:toggleType": {
    id: "connection:toggleType",
    label: "Toggle Line Type",
    description: "Switch between straight and curved",
    context: ACTION_CONTEXTS.CONNECTION_SELECTED,
    execute: (connectionIndex) => {
      const connection = window.app?.appState?.connections[connectionIndex];
      if (!connection) return false;
      
      connection.type = connection.type === "curved" ? "straight" : "curved";
      window.app.appState.saveHistory();
      window.app.saveState();
      window.draw();
      return true;
    }
  },

  // -------------------------------------------------------------------------
  // SELECTION ACTIONS
  // -------------------------------------------------------------------------
  "selection:clear": {
    id: "selection:clear",
    label: "Clear Selection",
    description: "Deselect all items",
    context: ACTION_CONTEXTS.GLOBAL,
    execute: () => {
      window.app.appState.clearSelection();
      window.draw();
      return true;
    }
  },

  "selection:selectAll": {
    id: "selection:selectAll",
    label: "Select All",
    description: "Select all pins on the board",
    context: ACTION_CONTEXTS.CANVAS,
    execute: () => {
      const allIndices = window.app.appState.pins.map((_, i) => i);
      window.app.appState.setSelectedPins(allIndices);
      window.draw();
      return true;
    }
  },

  // -------------------------------------------------------------------------
  // TOOL ACTIONS
  // -------------------------------------------------------------------------
  "tool:select": {
    id: "tool:select",
    label: "Select Tool",
    description: "Switch to selection tool",
    context: ACTION_CONTEXTS.GLOBAL,
    execute: () => {
      if (window.setActiveTool) {
        window.setActiveTool("select");
        return true;
      }
      return false;
    }
  },

  "tool:pan": {
    id: "tool:pan",
    label: "Pan Tool",
    description: "Switch to pan/move tool",
    context: ACTION_CONTEXTS.GLOBAL,
    execute: () => {
      if (window.setActiveTool) {
        window.setActiveTool("pan");
        return true;
      }
      return false;
    }
  },

  "tool:pin": {
    id: "tool:pin",
    label: "Pin Tool",
    description: "Switch to pin creation tool",
    context: ACTION_CONTEXTS.GLOBAL,
    execute: () => {
      if (window.setActiveTool) {
        window.setActiveTool("pin");
        return true;
      }
      return false;
    }
  },

  "tool:text": {
    id: "tool:text",
    label: "Text Tool",
    description: "Switch to text creation tool",
    context: ACTION_CONTEXTS.GLOBAL,
    execute: () => {
      if (window.setActiveTool) {
        window.setActiveTool("text");
        return true;
      }
      return false;
    }
  },

  "tool:area": {
    id: "tool:area",
    label: "Area Tool",
    description: "Switch to area creation tool",
    context: ACTION_CONTEXTS.GLOBAL,
    execute: () => {
      if (window.setActiveTool) {
        window.setActiveTool("area");
        return true;
      }
      return false;
    }
  },

  "tool:card": {
    id: "tool:card",
    label: "Card Tool",
    description: "Switch to card creation tool",
    context: ACTION_CONTEXTS.GLOBAL,
    execute: () => {
      if (window.setActiveTool) {
        window.setActiveTool("card");
        return true;
      }
      return false;
    }
  },

  // -------------------------------------------------------------------------
  // VIEW ACTIONS
  // -------------------------------------------------------------------------
  "view:zoomIn": {
    id: "view:zoomIn",
    label: "Zoom In",
    description: "Increase zoom level",
    context: ACTION_CONTEXTS.GLOBAL,
    execute: () => {
      const currentScale = window.app.appState.scale;
      const newScale = Math.min(currentScale * 1.2, window.MAX_SCALE);
      window.app.appState.scale = newScale;
      window.draw();
      return true;
    }
  },

  "view:zoomOut": {
    id: "view:zoomOut",
    label: "Zoom Out",
    description: "Decrease zoom level",
    context: ACTION_CONTEXTS.GLOBAL,
    execute: () => {
      const currentScale = window.app.appState.scale;
      const newScale = Math.max(currentScale / 1.2, window.MIN_SCALE);
      window.app.appState.scale = newScale;
      window.draw();
      return true;
    }
  },

  "view:resetZoom": {
    id: "view:resetZoom",
    label: "Reset Zoom",
    description: "Reset zoom to 100%",
    context: ACTION_CONTEXTS.GLOBAL,
    execute: () => {
      window.app.appState.scale = 1;
      window.draw();
      return true;
    }
  },

  "view:fitAll": {
    id: "view:fitAll",
    label: "Fit All",
    description: "Fit all pins in view",
    context: ACTION_CONTEXTS.GLOBAL,
    execute: () => {
      if (window.app.fitAllPinsInView) {
        window.app.fitAllPinsInView();
        return true;
      }
      return false;
    }
  },

  // -------------------------------------------------------------------------
  // HISTORY ACTIONS
  // -------------------------------------------------------------------------
  "history:undo": {
    id: "history:undo",
    label: "Undo",
    description: "Undo last action",
    context: ACTION_CONTEXTS.GLOBAL,
    execute: () => {
      if (window.app.appState.undo) {
        window.app.appState.undo();
        window.draw();
        return true;
      }
      return false;
    }
  },

  "history:redo": {
    id: "history:redo",
    label: "Redo",
    description: "Redo last undone action",
    context: ACTION_CONTEXTS.GLOBAL,
    execute: () => {
      if (window.app.appState.redo) {
        window.app.appState.redo();
        window.draw();
        return true;
      }
      return false;
    }
  },

  // -------------------------------------------------------------------------
  // BOARD ACTIONS
  // -------------------------------------------------------------------------
  "board:new": {
    id: "board:new",
    label: "New Board",
    description: "Create a new board",
    context: ACTION_CONTEXTS.GLOBAL,
    execute: () => {
      if (window.app.appState.clearBoard) {
        window.app.appState.clearBoard();
        window.app.saveState();
        window.draw();
        return true;
      }
      return false;
    }
  },

  "board:save": {
    id: "board:save",
    label: "Save Board",
    description: "Save current board",
    context: ACTION_CONTEXTS.GLOBAL,
    execute: () => {
      window.app.saveState();
      return true;
    }
  },
};

// ============================================================================
// DEFAULT KEYBOARD SHORTCUTS
// ============================================================================
// Maps key combinations to action IDs
// Format: "modifier+key" or just "key"
// Modifiers: ctrl, alt, shift, meta (cmd on Mac)

const DEFAULT_KEYBOARD_SHORTCUTS = {
  // Tool shortcuts
  "v": "tool:select",
  "h": "tool:pan",
  "p": "tool:pin",
  "t": "tool:text",
  "a": "tool:area",
  "c": "tool:card",
  
  // View shortcuts
  "=": "view:zoomIn",
  "+": "view:zoomIn",
  "-": "view:zoomOut",
  "0": "view:resetZoom",
  "f": "view:fitAll",
  
  // History shortcuts
  "ctrl+z": "history:undo",
  "meta+z": "history:undo",
  "ctrl+shift+z": "history:redo",
  "meta+shift+z": "history:redo",
  "ctrl+y": "history:redo",
  "meta+y": "history:redo",
  
  // Selection shortcuts
  "Escape": "selection:clear",
  "ctrl+a": "selection:selectAll",
  "meta+a": "selection:selectAll",
  
  // Pin shortcuts (when pin selected)
  "e": "pin:edit",
  "x": "pin:colorPicker",
  "Delete": "pin:delete",
  "Backspace": "pin:delete",
  "ctrl+d": "pin:duplicate",
  "meta+d": "pin:duplicate",
  
  // Board shortcuts
  "ctrl+s": "board:save",
  "meta+s": "board:save",
};

// ============================================================================
// DEFAULT MOUSE ACTIONS
// ============================================================================
// Maps mouse events to action IDs based on context

const DEFAULT_MOUSE_ACTIONS = {
  // Double-click actions
  "dblclick:pin": "pin:edit",
  "dblclick:connection": "connection:edit",
  "dblclick:canvas": null, // Could be "tool:text" to create text at click
  
  // Right-click opens radial menu (handled separately)
  "rightclick:pin": "radial:pin",
  "rightclick:connection": "radial:connection",
  "rightclick:canvas": "radial:canvas",
  
  // Shift+click on connection creates pin
  "shift+click:connection": "connection:insertPin",
};

// ============================================================================
// ACTION SYSTEM CLASS
// ============================================================================

class ActionSystem {
  constructor() {
    this.actions = { ...ACTION_REGISTRY };
    this.keyboardShortcuts = { ...DEFAULT_KEYBOARD_SHORTCUTS };
    this.mouseActions = { ...DEFAULT_MOUSE_ACTIONS };
    this.userOverrides = {};
    
    // Load user overrides from storage
    this.loadUserOverrides();
  }

  /**
   * Execute an action by ID
   * @param {string} actionId - The action ID to execute
   * @param {*} context - Context data (pinIndex, connectionIndex, etc.)
   * @param {Object} options - Additional options
   * @returns {boolean} - Whether the action executed successfully
   */
  execute(actionId, context = null, options = {}) {
    const action = this.actions[actionId];
    
    if (!action) {
      console.warn(`⚠️ Action not found: ${actionId}`);
      return false;
    }

    // Check if confirmation is required
    if (action.requiresConfirmation && !options.skipConfirmation) {
      if (!confirm(action.confirmMessage || `Execute ${action.label}?`)) {
        return false;
      }
    }

    try {
      console.log(`🎬 Executing action: ${actionId}`, context);
      return action.execute(context);
    } catch (error) {
      console.error(`❌ Action failed: ${actionId}`, error);
      return false;
    }
  }

  /**
   * Get action for a keyboard shortcut
   * @param {KeyboardEvent} event - The keyboard event
   * @returns {string|null} - Action ID or null
   */
  getActionForKeyboard(event) {
    const key = this.normalizeKey(event);
    
    // Check user overrides first
    if (this.userOverrides.keyboard?.[key]) {
      return this.userOverrides.keyboard[key];
    }
    
    return this.keyboardShortcuts[key] || null;
  }

  /**
   * Normalize a keyboard event to a shortcut string
   * @param {KeyboardEvent} event
   * @returns {string}
   */
  normalizeKey(event) {
    const parts = [];
    
    if (event.ctrlKey) parts.push("ctrl");
    if (event.altKey) parts.push("alt");
    if (event.shiftKey) parts.push("shift");
    if (event.metaKey) parts.push("meta");
    
    // Normalize key name
    let key = event.key;
    if (key === " ") key = "Space";
    
    parts.push(key);
    
    return parts.join("+");
  }

  /**
   * Get action for a mouse event
   * @param {string} eventType - Event type (dblclick, rightclick, etc.)
   * @param {string} target - Target type (pin, connection, canvas)
   * @returns {string|null} - Action ID or null
   */
  getActionForMouse(eventType, target) {
    const key = `${eventType}:${target}`;
    
    // Check user overrides first
    if (this.userOverrides.mouse?.[key]) {
      return this.userOverrides.mouse[key];
    }
    
    return this.mouseActions[key] || null;
  }

  /**
   * Register a custom action
   * @param {Object} action - Action definition
   */
  registerAction(action) {
    if (!action.id || !action.execute) {
      console.error("❌ Invalid action definition:", action);
      return;
    }
    
    this.actions[action.id] = action;
    console.log(`✅ Registered action: ${action.id}`);
  }

  /**
   * Set a keyboard shortcut override
   * @param {string} shortcut - Key combination
   * @param {string} actionId - Action ID
   */
  setKeyboardShortcut(shortcut, actionId) {
    if (!this.userOverrides.keyboard) {
      this.userOverrides.keyboard = {};
    }
    
    this.userOverrides.keyboard[shortcut] = actionId;
    this.saveUserOverrides();
  }

  /**
   * Remove a keyboard shortcut override
   * @param {string} shortcut - Key combination
   */
  removeKeyboardShortcut(shortcut) {
    if (this.userOverrides.keyboard) {
      delete this.userOverrides.keyboard[shortcut];
      this.saveUserOverrides();
    }
  }

  /**
   * Get all available actions
   * @returns {Object} - All registered actions
   */
  getAllActions() {
    return { ...this.actions };
  }

  /**
   * Get all keyboard shortcuts (merged defaults + overrides)
   * @returns {Object} - All keyboard shortcuts
   */
  getAllKeyboardShortcuts() {
    return {
      ...this.keyboardShortcuts,
      ...this.userOverrides.keyboard
    };
  }

  /**
   * Get the modal type for a pin shape
   * @param {string} shape - Pin shape
   * @returns {string} - Modal type (text, card, pin, area)
   */
  getModalTypeForPin(shape) {
    return PIN_MODAL_MAPPINGS[shape] || "pin";
  }

  /**
   * Load user overrides from localStorage
   */
  loadUserOverrides() {
    try {
      const stored = localStorage.getItem("msc-action-overrides");
      if (stored) {
        this.userOverrides = JSON.parse(stored);
        console.log("📥 Loaded action overrides:", this.userOverrides);
      }
    } catch (error) {
      console.warn("⚠️ Failed to load action overrides:", error);
      this.userOverrides = {};
    }
  }

  /**
   * Save user overrides to localStorage
   */
  saveUserOverrides() {
    try {
      localStorage.setItem("msc-action-overrides", JSON.stringify(this.userOverrides));
      console.log("💾 Saved action overrides");
    } catch (error) {
      console.error("❌ Failed to save action overrides:", error);
    }
  }

  /**
   * Reset all overrides to defaults
   */
  resetToDefaults() {
    this.userOverrides = {};
    this.saveUserOverrides();
    console.log("🔄 Reset all action overrides to defaults");
  }

  /**
   * Export current configuration (for sharing/backup)
   * @returns {Object} - Configuration object
   */
  exportConfig() {
    return {
      version: 1,
      overrides: this.userOverrides,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Import configuration
   * @param {Object} config - Configuration object
   */
  importConfig(config) {
    if (config.version !== 1) {
      console.warn("⚠️ Unknown config version:", config.version);
    }
    
    this.userOverrides = config.overrides || {};
    this.saveUserOverrides();
    console.log("📥 Imported action configuration");
  }
}

// ============================================================================
// GLOBAL INSTANCE & EXPORTS
// ============================================================================

// Create singleton instance
const actionSystem = new ActionSystem();

// ============================================================================
// KEYBOARD SHORTCUTS UI
// ============================================================================

class KeyboardShortcutsUI {
  constructor(actionSystem) {
    this.actionSystem = actionSystem;
    this.modal = null;
    this.backdrop = null;
    this.isRecording = false;
    this.recordingCallback = null;
    this.searchQuery = "";
  }

  /**
   * Initialize the shortcuts UI (call after DOM ready)
   */
  init() {
    this.backdrop = document.getElementById("shortcuts-modal-backdrop");
    this.modal = document.getElementById("shortcuts-modal");
    
    if (!this.backdrop || !this.modal) {
      console.warn("⚠️ Shortcuts modal elements not found");
      return;
    }

    // Set up event handlers
    this.setupEventHandlers();
  }

  /**
   * Set up event handlers for the modal
   */
  setupEventHandlers() {
    // Close button
    const closeBtn = document.getElementById("shortcuts-modal-close");
    if (closeBtn) {
      closeBtn.onclick = () => this.close();
    }

    // Close button in actions
    const closeActionBtn = document.getElementById("shortcuts-close");
    if (closeActionBtn) {
      closeActionBtn.onclick = () => this.close();
    }

    // Reset button
    const resetBtn = document.getElementById("shortcuts-reset");
    if (resetBtn) {
      resetBtn.onclick = () => this.resetToDefaults();
    }

    // Search input
    const searchInput = document.getElementById("shortcuts-search");
    if (searchInput) {
      searchInput.oninput = (e) => {
        this.searchQuery = e.target.value.toLowerCase();
        this.renderShortcutsList();
      };
    }

    // Cancel recording button
    const cancelBtn = document.getElementById("recording-cancel");
    if (cancelBtn) {
      cancelBtn.onclick = () => this.cancelRecording();
    }

    // Backdrop click to close
    if (this.backdrop) {
      this.backdrop.onclick = (e) => {
        if (e.target === this.backdrop) {
          this.close();
        }
      };
    }

    // Global key handler for recording
    document.addEventListener("keydown", (e) => this.handleKeyDown(e));
  }

  /**
   * Open the shortcuts modal
   */
  open() {
    if (!this.backdrop) {
      this.init();
    }
    
    if (this.backdrop) {
      this.backdrop.style.display = "flex";
      this.renderShortcutsList();
      
      // Focus search input
      const searchInput = document.getElementById("shortcuts-search");
      if (searchInput) {
        searchInput.value = "";
        this.searchQuery = "";
        searchInput.focus();
      }
    }
  }

  /**
   * Close the shortcuts modal
   */
  close() {
    if (this.backdrop) {
      this.backdrop.style.display = "none";
    }
    this.cancelRecording();
  }

  /**
   * Render the shortcuts list
   */
  renderShortcutsList() {
    const listContainer = document.getElementById("shortcuts-list");
    if (!listContainer) return;

    const allShortcuts = this.actionSystem.getAllKeyboardShortcuts();
    const actions = this.actionSystem.getAllActions();
    const overrides = this.actionSystem.userOverrides.keyboard || {};

    // Group shortcuts by category
    const categories = {
      "Tools": [],
      "View": [],
      "History": [],
      "Selection": [],
      "Pin Actions": [],
      "Connection Actions": [],
      "Board": [],
      "Other": []
    };

    // Build reverse map: actionId -> shortcut
    const actionToShortcut = {};
    for (const [shortcut, actionId] of Object.entries(allShortcuts)) {
      actionToShortcut[actionId] = shortcut;
    }

    // Categorize actions
    for (const [actionId, action] of Object.entries(actions)) {
      const shortcut = actionToShortcut[actionId];
      const isModified = overrides[shortcut] !== undefined || 
        (shortcut && DEFAULT_KEYBOARD_SHORTCUTS[shortcut] !== actionId);

      const item = {
        actionId,
        action,
        shortcut: shortcut || null,
        isModified
      };

      // Filter by search query
      if (this.searchQuery) {
        const searchText = `${action.label} ${action.description || ""} ${shortcut || ""}`.toLowerCase();
        if (!searchText.includes(this.searchQuery)) {
          continue;
        }
      }

      // Categorize
      if (actionId.startsWith("tool:")) {
        categories["Tools"].push(item);
      } else if (actionId.startsWith("view:")) {
        categories["View"].push(item);
      } else if (actionId.startsWith("history:")) {
        categories["History"].push(item);
      } else if (actionId.startsWith("selection:")) {
        categories["Selection"].push(item);
      } else if (actionId.startsWith("pin:")) {
        categories["Pin Actions"].push(item);
      } else if (actionId.startsWith("connection:")) {
        categories["Connection Actions"].push(item);
      } else if (actionId.startsWith("board:")) {
        categories["Board"].push(item);
      } else {
        categories["Other"].push(item);
      }
    }

    // Render HTML
    let html = "";
    for (const [categoryName, items] of Object.entries(categories)) {
      if (items.length === 0) continue;

      html += `<div class="shortcut-category">`;
      html += `<div class="shortcut-category-title">${categoryName}</div>`;
      
      for (const item of items) {
        const modifiedClass = item.isModified ? "modified" : "";
        const shortcutDisplay = item.shortcut ? this.formatShortcut(item.shortcut) : "<em>None</em>";
        
        html += `
          <div class="shortcut-item ${modifiedClass}" data-action-id="${item.actionId}">
            <div class="shortcut-info">
              <div class="shortcut-label">${item.action.label}</div>
              <div class="shortcut-description">${item.action.description || ""}</div>
            </div>
            <div class="shortcut-keys">
              <span class="shortcut-key">${shortcutDisplay}</span>
              <button class="shortcut-edit-btn" data-action-id="${item.actionId}">Edit</button>
            </div>
          </div>
        `;
      }
      
      html += `</div>`;
    }

    listContainer.innerHTML = html;

    // Add edit button handlers
    listContainer.querySelectorAll(".shortcut-edit-btn").forEach(btn => {
      btn.onclick = (e) => {
        e.stopPropagation();
        const actionId = btn.dataset.actionId;
        this.startRecording(actionId);
      };
    });
  }

  /**
   * Format a shortcut for display
   */
  formatShortcut(shortcut) {
    if (!shortcut) return "";
    
    return shortcut
      .split("+")
      .map(part => {
        switch (part.toLowerCase()) {
          case "ctrl": return "Ctrl";
          case "alt": return "Alt";
          case "shift": return "Shift";
          case "meta": return "⌘";
          case "escape": return "Esc";
          case "delete": return "Del";
          case "backspace": return "⌫";
          case "arrowup": return "↑";
          case "arrowdown": return "↓";
          case "arrowleft": return "←";
          case "arrowright": return "→";
          case " ": return "Space";
          default: return part.length === 1 ? part.toUpperCase() : part;
        }
      })
      .join(" + ");
  }

  /**
   * Start recording a new shortcut
   */
  startRecording(actionId) {
    this.isRecording = true;
    this.recordingActionId = actionId;
    
    const action = this.actionSystem.actions[actionId];
    const listContainer = document.getElementById("shortcuts-list");
    const recordingContainer = document.getElementById("shortcuts-recording");
    const preview = document.getElementById("recording-preview");
    
    if (listContainer) listContainer.style.display = "none";
    if (recordingContainer) {
      recordingContainer.style.display = "block";
      recordingContainer.querySelector(".recording-message").textContent = 
        `Press a key combination for "${action?.label || actionId}"...`;
    }
    if (preview) preview.textContent = "";
  }

  /**
   * Cancel recording
   */
  cancelRecording() {
    this.isRecording = false;
    this.recordingActionId = null;
    
    const listContainer = document.getElementById("shortcuts-list");
    const recordingContainer = document.getElementById("shortcuts-recording");
    
    if (listContainer) listContainer.style.display = "block";
    if (recordingContainer) recordingContainer.style.display = "none";
  }

  /**
   * Handle key down event for recording
   */
  handleKeyDown(e) {
    if (!this.isRecording) return;
    if (this.backdrop?.style.display !== "flex") return;

    e.preventDefault();
    e.stopPropagation();

    // Ignore modifier-only keys
    if (["Control", "Alt", "Shift", "Meta"].includes(e.key)) {
      return;
    }

    // Build shortcut string
    const shortcut = this.actionSystem.normalizeKey(e);
    
    // Update preview
    const preview = document.getElementById("recording-preview");
    if (preview) {
      preview.textContent = this.formatShortcut(shortcut);
    }

    // Check for conflicts
    const existingAction = this.actionSystem.getActionForKeyboard(e);
    if (existingAction && existingAction !== this.recordingActionId) {
      const existingLabel = this.actionSystem.actions[existingAction]?.label || existingAction;
      if (!confirm(`"${shortcut}" is already assigned to "${existingLabel}". Replace it?`)) {
        this.cancelRecording();
        return;
      }
      // Remove the old assignment
      this.actionSystem.removeKeyboardShortcut(shortcut);
    }

    // Set the new shortcut
    this.actionSystem.setKeyboardShortcut(shortcut, this.recordingActionId);
    
    // Done recording
    this.cancelRecording();
    this.renderShortcutsList();
  }

  /**
   * Reset all shortcuts to defaults
   */
  resetToDefaults() {
    if (confirm("Reset all keyboard shortcuts to defaults?")) {
      this.actionSystem.resetToDefaults();
      this.renderShortcutsList();
    }
  }
}

// Create shortcuts UI instance
const shortcutsUI = new KeyboardShortcutsUI(actionSystem);

// Initialize when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => shortcutsUI.init());
} else {
  shortcutsUI.init();
}

// Export to window for global access
window.actionSystem = actionSystem;
window.ACTION_REGISTRY = ACTION_REGISTRY;
window.ACTION_CONTEXTS = ACTION_CONTEXTS;
window.PIN_MODAL_MAPPINGS = PIN_MODAL_MAPPINGS;
window.DEFAULT_KEYBOARD_SHORTCUTS = DEFAULT_KEYBOARD_SHORTCUTS;
window.shortcutsUI = shortcutsUI;

// Convenience functions
window.executeAction = (actionId, context, options) => {
  return actionSystem.execute(actionId, context, options);
};

window.openKeyboardShortcutsModal = () => {
  shortcutsUI.open();
};

console.log("✅ Action system initialized with", Object.keys(ACTION_REGISTRY).length, "actions");
