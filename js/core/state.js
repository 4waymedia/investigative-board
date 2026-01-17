// ============================================================================
// STATE MANAGEMENT MODULE - Centralized application state
// ============================================================================

// Constants are available globally from constants.js

// ============================================================================
// APP STATE CLASS
// ============================================================================

class AppState {
  constructor() {
    // View/Camera State
    this.scale = 1;
    this.offsetX = 0;
    this.offsetY = 0;

    // Data State
    this.pins = [];
    this.connections = [];
    this.cards = [];
    this.textElements = [];
    this.history = [];

    // Selection State
    this.selectedPinIndex = null;
    this.selectedPins = [];
    this.selectedTextIndex = null;
    this.connectStartIndex = null;
    this.connectMousePos = null;
    this.connectionMode = null; // 'sequential' or 'hub'

    // Marquee Selection State
    this.marqueeStart = null;
    this.marqueeEnd = null;

    // Interaction State
    this.mouseScreenX = 0;
    this.mouseScreenY = 0;
    this.didDrag = false;
    this.time = 0;

    // Tool State
    this.currentTool = "pin";
    this.currentFamily = "pin";
    this.currentTypeId = "pin:circle";
    this.selectedColor = "#58a6ff";
    this.connectionType = "straight";

    // Additional tool state
    this.selectedTypeByFamily = {
      pin: 0,  // Index into pin family types
      card: 0, // Index into card family types
      area: 0, // Index into area family types
    };

    // Theme State
    this.currentThemeId = "default";
    this.palette = [
      { name: "Red", value: "#f85149" },
      { name: "Blue", value: "#58a6ff" },
      { name: "Green", value: "#3fb950" },
      { name: "Yellow", value: "#f1c40f" },
      { name: "Purple", value: "#a471f7" },
    ];

    // Timeline State (if used)
    this.timelineActive = false;
    this.timelinePins = [];
    this.timelineY = 0;
    this.timelineLeft = 0;
    this.timelineRight = 0;

    // UI State
    this.isLayoutSimulating = false;
  }

  // ============================================================================
  // HISTORY MANAGEMENT
  // ============================================================================

  /**
   * Save current state to history for undo functionality
   */
  saveHistory() {
    const snapshot = {
      pins: JSON.parse(JSON.stringify(this.pins)),
      connections: JSON.parse(JSON.stringify(this.connections)),
      cards: JSON.parse(JSON.stringify(this.cards)),
      textElements: JSON.parse(JSON.stringify(this.textElements)),
      scale: this.scale,
      offsetX: this.offsetX,
      offsetY: this.offsetY,
    };
    this.history.push(snapshot);
    if (this.history.length > window.MAX_HISTORY) {
      this.history.shift();
    }
  }

  /**
   * Undo the last action
   * @returns {boolean} True if undo was successful
   */
  undo() {
    if (this.history.length > 0) {
      const snapshot = this.history.pop();
      this.pins = snapshot.pins;
      this.connections = snapshot.connections;
      this.cards = snapshot.cards;
      this.textElements = snapshot.textElements;
      this.scale = snapshot.scale;
      this.offsetX = snapshot.offsetX;
      this.offsetY = snapshot.offsetY;

      // Clear selections after undo
      this.selectedPinIndex = null;
      this.selectedPins = [];
      this.selectedTextIndex = null;
      this.connectStartIndex = null;
      this.connectMousePos = null;

      return true;
    }
    return false;
  }

  // ============================================================================
  // SELECTION MANAGEMENT
  // ============================================================================

  /**
   * Set the selected pin
   * @param {number|null} index - Pin index to select, or null to clear
   */
  setSelectedPin(index) {
    if (typeof index === "number" && index !== null && index !== undefined) {
      this.selectedPinIndex = index;
      this.selectedPins = [index];
    } else {
      this.selectedPinIndex = null;
      this.selectedPins = [];
    }
  }

  /**
   * Clear all selections
   */
  clearSelection() {
    this.selectedPinIndex = null;
    this.selectedPins = [];
    this.selectedTextIndex = null;
    this.connectStartIndex = null;
    this.marqueeStart = null;
    this.marqueeEnd = null;
  }

  /**
   * Add a pin to the current selection (for multi-select)
   * @param {number} index - Pin index to add
   */
  addToSelection(index) {
    if (!this.selectedPins.includes(index)) {
      this.selectedPins.push(index);
      if (this.selectedPinIndex === null) {
        this.selectedPinIndex = index;
      }
    }
  }

  /**
   * Remove a pin from the current selection
   * @param {number} index - Pin index to remove
   */
  removeFromSelection(index) {
    this.selectedPins = this.selectedPins.filter(i => i !== index);
    if (this.selectedPinIndex === index) {
      this.selectedPinIndex = this.selectedPins.length > 0 ? this.selectedPins[0] : null;
    }
  }

  // ============================================================================
  // STATE SERIALIZATION
  // ============================================================================

  /**
   * Convert state to a serializable object for localStorage
   * @returns {Object} Serializable state object
   */
  toSerializable() {
    return {
      pins: this.pins,
      connections: this.connections,
      cards: this.cards,
      textElements: this.textElements,
      scale: this.scale,
      offsetX: this.offsetX,
      offsetY: this.offsetY,
      selectedColor: this.selectedColor,
      palette: this.palette,
      currentThemeId: this.currentThemeId,
      timelineActive: this.timelineActive,
      timelinePins: this.timelinePins,
      timelineY: this.timelineY,
      timelineLeft: this.timelineLeft,
      timelineRight: this.timelineRight,
    };
  }

  /**
   * Load state from a serializable object
   * @param {Object} data - Serializable state object
   */
  fromSerializable(data) {
    Object.assign(this, data);
    // Ensure arrays exist
    this.pins = this.pins || [];
    this.connections = this.connections || [];
    this.cards = this.cards || [];
    this.textElements = this.textElements || [];
    this.history = [];
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  /**
   * Get the currently selected pin object
   * @returns {Object|null} Selected pin or null
   */
  getSelectedPin() {
    return this.selectedPinIndex !== null && this.pins[this.selectedPinIndex]
      ? this.pins[this.selectedPinIndex]
      : null;
  }

  /**
   * Get all currently selected pin objects
   * @returns {Array} Array of selected pin objects
   */
  getSelectedPins() {
    return this.selectedPins.map(i => this.pins[i]).filter(p => p);
  }

  /**
   * Check if a pin index is currently selected
   * @param {number} index - Pin index to check
   * @returns {boolean} True if selected
   */
  isPinSelected(index) {
    return this.selectedPins.includes(index);
  }
}

// ============================================================================
// APPSTATE INTEGRATION FUNCTIONS
// ============================================================================

/**
 * Save AppState instance to localStorage
 * @param {AppState} appState - The AppState instance to save
 */
function saveAppState(appState) {
  if (!appState) {
    console.warn("No appState provided to saveAppState");
    return;
  }

  const stateData = appState.toSerializable();

  try {
    localStorage.setItem(window.STORAGE_KEY, JSON.stringify(stateData));
  } catch (e) {
    console.error("Failed to save AppState to localStorage:", e);
  }
}

/**
 * Load state from localStorage into AppState instance
 * @param {AppState} appState - The AppState instance to load into
 */
function loadAppState(appState) {
  if (!appState) {
    console.warn("No appState provided to loadAppState");
    return false;
  }

  try {
    const stored = localStorage.getItem(window.STORAGE_KEY);
    if (stored) {
      const stateData = JSON.parse(stored);
      appState.fromSerializable(stateData);
      return true;
    }
  } catch (e) {
    console.error("Failed to load AppState from localStorage:", e);
  }
  return false;
}

// ============================================================================
// GLOBAL EXPORT
// ============================================================================

window.AppState = AppState;
window.saveAppState = saveAppState;
window.loadAppState = loadAppState;
