// ============================================================================
// STATE MANAGEMENT MODULE - Centralized application state
// ============================================================================

// Constants are available globally from constants.js

// ============================================================================
// APP STATE CLASS
// ============================================================================

class AppState {
  constructor() {
    // ============================================================================
    // BOARD METADATA - Identity and management info for multi-board system
    // ============================================================================
    this.meta = {
      id: null,
      title: "Untitled Board",
      description: "",
      userId: null,
      created: null,
      lastModified: null,
      thumbnail: null
    };

    // ============================================================================
    // VIEW STATE - Camera, zoom, and rendering
    // ============================================================================
    this.view = {
      scale: 1,
      offsetX: 0,
      offsetY: 0,
      isLayoutSimulating: false,
    };

    // ============================================================================
    // DOCUMENT STATE - Persistent data that gets saved/loaded
    // ============================================================================
    this.document = {
      pins: [],
      connections: [],
      cards: [],
      textElements: [],
      areas: [], // Future: for area objects
      currentThemeId: "default",
      palette: [
        { name: "Red", value: "#f85149" },
        { name: "Blue", value: "#58a6ff" },
        { name: "Green", value: "#3fb950" },
        { name: "Yellow", value: "#f1c40f" },
        { name: "Purple", value: "#a471f7" },
      ],
      // Timeline State (if used)
      timelineActive: false,
      timelinePins: [],
      timelineY: 0,
      timelineLeft: 0,
      timelineRight: 0,
    };

    // ============================================================================
    // SESSION STATE - Transient state that resets on page load
    // ============================================================================
    this.session = {
      // Selection State
      selectedPins: [], // Primary selection array (replaces selectedPinIndex)
      selectedTextIndex: null,
      connectStartIndex: null,
      connectMousePos: null,
      connectionMode: null, // 'sequential' or 'hub'

      // Marquee Selection State
      marqueeStart: null,
      marqueeEnd: null,

      // Interaction State (resets on page load)
      mouseScreenX: 0,
      mouseScreenY: 0,
      didDrag: false,
      time: 0,

      // Tool State
      currentTool: "pin",
      currentFamily: "pin",
      currentTypeId: "pin:circle",
      selectedColor: "#58a6ff",
      connectionType: "straight",

      // Additional tool state
      selectedTypeByFamily: {
        pin: 0,   // Index into pin family types
        card: 0,  // Index into card family types
        area: 0,  // Index into area family types
        text: 0,  // Index into text family types
      },
    };

    // ============================================================================
    // HISTORY STATE - Undo/Redo functionality
    // ============================================================================
    this.history = [];
  }

  // ============================================================================
  // BACKWARD COMPATIBILITY GETTERS/SETTERS
  // ============================================================================

  // View state backward compatibility
  get scale() { return this.view.scale; }
  set scale(value) { this.view.scale = value; }

  get offsetX() { return this.view.offsetX; }
  set offsetX(value) { this.view.offsetX = value; }

  get offsetY() { return this.view.offsetY; }
  set offsetY(value) { this.view.offsetY = value; }

  get isLayoutSimulating() { return this.view.isLayoutSimulating; }
  set isLayoutSimulating(value) { this.view.isLayoutSimulating = value; }

  // Document state backward compatibility
  get pins() { return this.document.pins; }
  set pins(value) { this.document.pins = value; }

  get connections() { return this.document.connections; }
  set connections(value) { this.document.connections = value; }

  get cards() { return this.document.cards; }
  set cards(value) { this.document.cards = value; }


  get areas() { return this.document.areas; }
  set areas(value) { this.document.areas = value; }

  get currentThemeId() { return this.document.currentThemeId; }
  set currentThemeId(value) { this.document.currentThemeId = value; }

  get palette() { return this.document.palette; }
  set palette(value) { this.document.palette = value; }

  get timelineActive() { return this.document.timelineActive; }
  set timelineActive(value) { this.document.timelineActive = value; }

  get timelinePins() { return this.document.timelinePins; }
  set timelinePins(value) { this.document.timelinePins = value; }

  get timelineY() { return this.document.timelineY; }
  set timelineY(value) { this.document.timelineY = value; }

  get timelineLeft() { return this.document.timelineLeft; }
  set timelineLeft(value) { this.document.timelineLeft = value; }

  get timelineRight() { return this.document.timelineRight; }
  set timelineRight(value) { this.document.timelineRight = value; }

  // Session state backward compatibility (selection state updated)
  get selectedPins() { return this.session.selectedPins; }
  set selectedPins(value) { this.session.selectedPins = value; }

  get selectedTextIndex() { return this.session.selectedTextIndex; }
  set selectedTextIndex(value) { this.session.selectedTextIndex = value; }

  get connectStartIndex() { return this.session.connectStartIndex; }
  set connectStartIndex(value) { this.session.connectStartIndex = value; }

  get connectMousePos() { return this.session.connectMousePos; }
  set connectMousePos(value) { this.session.connectMousePos = value; }

  get connectionMode() { return this.session.connectionMode; }
  set connectionMode(value) { this.session.connectionMode = value; }

  get marqueeStart() { return this.session.marqueeStart; }
  set marqueeStart(value) { this.session.marqueeStart = value; }

  get marqueeEnd() { return this.session.marqueeEnd; }
  set marqueeEnd(value) { this.session.marqueeEnd = value; }

  get mouseScreenX() { return this.session.mouseScreenX; }
  set mouseScreenX(value) { this.session.mouseScreenX = value; }

  get mouseScreenY() { return this.session.mouseScreenY; }
  set mouseScreenY(value) { this.session.mouseScreenY = value; }

  get didDrag() { return this.session.didDrag; }
  set didDrag(value) { this.session.didDrag = value; }

  get time() { return this.session.time; }
  set time(value) { this.session.time = value; }

  get currentTool() { return this.session.currentTool; }
  set currentTool(value) { this.session.currentTool = value; }

  get currentFamily() { return this.session.currentFamily; }
  set currentFamily(value) { this.session.currentFamily = value; }

  get currentTypeId() { return this.session.currentTypeId; }
  set currentTypeId(value) { this.session.currentTypeId = value; }

  get selectedColor() { return this.session.selectedColor; }
  set selectedColor(value) { this.session.selectedColor = value; }

  get connectionType() { return this.session.connectionType; }
  set connectionType(value) { this.session.connectionType = value; }

  get selectedTypeByFamily() { return this.session.selectedTypeByFamily; }
  set selectedTypeByFamily(value) { this.session.selectedTypeByFamily = value; }

  // Computed properties for backward compatibility
  get selectedPinIndex() {
    return this.session.selectedPins.length > 0 ? this.session.selectedPins[0] : null;
  }
  set selectedPinIndex(value) {
    if (value === null || value === undefined) {
      this.session.selectedPins = [];
    } else {
      this.session.selectedPins = [value];
    }
  }

  // ============================================================================
  // ENCAPSULATED SETTER METHODS
  // ============================================================================

  /**
   * Add a pin to the document with validation and ID generation
   * @param {number} x - World X coordinate
   * @param {number} y - World Y coordinate
   * @param {Object} properties - Additional pin properties
   * @returns {number} Index of the added pin
   */
  addPin(x, y, properties = {}) {
    const pin = {
      id: this._generateId('pin'),
      x: x,
      y: y,
      typeId: properties.typeId || this.session.currentTypeId,
      color: properties.color || this.session.selectedColor,
      label: properties.label || '',
      note: properties.note || '',
      date: properties.date || '',
      shape: properties.shape || 'circle', // New: circle, bubble, rectangle, etc.
      textColor: properties.textColor, // New: auto-calculated for readability
      borderColor: properties.borderColor, // New: optional border color
      image: properties.image || null,
      ...properties
    };

    this.document.pins.push(pin);
    return this.document.pins.length - 1;
  }

  /**
   * Add a text pin (comic-style bubble or rectangle)
   * @param {number} x - World X coordinate
   * @param {number} y - World Y coordinate
   * @param {string} description - Description text (shown inside bubble)
   * @param {Object} properties - Additional pin properties (including label for title)
   * @returns {number} Index of the added pin
   */
  addTextPin(x, y, description = '', properties = {}) {
    const bubbleColor = properties.color || this.session.selectedColor;
    const textColor = properties.textColor || this.calculateTextColor(bubbleColor);

    // Always create a fresh tailPosition object to avoid shared references
    const defaultTailPosition = { angle: 270, distance: 0.8 };
    const tailPosition = properties.tailPosition 
      ? { ...defaultTailPosition, ...properties.tailPosition } // Merge with defaults, creating new object
      : { ...defaultTailPosition }; // Fresh copy of defaults

    // Create properties without tailPosition to avoid ...properties overriding our fresh copy
    const { tailPosition: _ignoredTailPos, ...restProperties } = properties;

    return this.addPin(x, y, {
      description: description, // Description text (inside bubble)
      label: properties.label || '', // Title text (below bubble)
      shape: properties.shape || 'bubble', // Default to comic bubble
      tailType: properties.tailType || 'curved', // Default tail type (classic comic style)
      textColor: textColor,
      borderColor: properties.borderColor,
      fontSize: properties.fontSize || 16,
      width: properties.width || 200,
      height: properties.height || 50,
      tailPosition: tailPosition, // Always a fresh object
      ...restProperties
    });
  }


  /**
   * Calculate optimal text color for readability against a background color
   * @param {string} backgroundColor - Hex color of the background
   * @returns {string} Hex color for text
   */
  calculateTextColor(backgroundColor) {
    // Convert hex to RGB
    const hex = backgroundColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);

    // Calculate brightness (YIQ formula)
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;

    // Return light text for dark backgrounds, dark text for light backgrounds
    return brightness > 128 ? '#000000' : '#ffffff';
  }

  /**
   * Update a pin's position with optional bounds checking
   * @param {number} index - Pin index
   * @param {number} x - New X coordinate
   * @param {number} y - New Y coordinate
   * @param {Object} bounds - Optional bounds {minX, maxX, minY, maxY}
   * @returns {boolean} True if update was successful
   */
  updatePinPosition(index, x, y, bounds = null) {
    if (index < 0 || index >= this.document.pins.length) return false;

    let finalX = x;
    let finalY = y;

    // Apply bounds if provided
    if (bounds) {
      finalX = Math.max(bounds.minX, Math.min(bounds.maxX, x));
      finalY = Math.max(bounds.minY, Math.min(bounds.maxY, y));
    }

    this.document.pins[index].x = finalX;
    this.document.pins[index].y = finalY;
    return true;
  }


  /**
   * Add a connection between two pins
   * @param {number} fromIndex - Source pin index
   * @param {number} toIndex - Target pin index
   * @param {Object} properties - Additional connection properties
   * @returns {number} Index of the added connection
   */
  addConnection(fromIndex, toIndex, properties = {}) {
    const connection = {
      id: this._generateId('connection'),
      from: fromIndex,
      to: toIndex,
      type: properties.type || this.session.connectionType,
      color: properties.color || '#666666',
      ...properties
    };

    console.log(`🔗 Adding connection: ${fromIndex} → ${toIndex} (${connection.color})`);
    this.document.connections.push(connection);
    console.log(`🔗 Total connections: ${this.document.connections.length}`);
    return this.document.connections.length - 1;
  }

  /**
   * Remove a pin and clean up related connections
   * @param {number} index - Pin index to remove
   * @returns {boolean} True if removal was successful
   */
  removePin(index) {
    if (index < 0 || index >= this.document.pins.length) return false;

    // Remove the pin
    this.document.pins.splice(index, 1);

    // Remove connections that reference this pin
    this.document.connections = this.document.connections.filter(conn =>
      conn.from !== index && conn.to !== index
    );

    // Update connection indices that reference higher indices
    this.document.connections.forEach(conn => {
      if (conn.from > index) conn.from--;
      if (conn.to > index) conn.to--;
    });

    // Update selection indices
    this.session.selectedPins = this.session.selectedPins
      .filter(i => i !== index)
      .map(i => i > index ? i - 1 : i);

    return true;
  }

  /**
   * Generate a unique ID for a given type
   * @param {string} type - Type of object ('pin', 'text', 'connection')
   * @returns {string} Unique ID
   * @private
   */
  _generateId(type) {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 5);
    return `${type}_${timestamp}_${random}`;
  }

  // ============================================================================
  // COORDINATE TRANSFORMATION HELPERS
  // ============================================================================

  /**
   * Get the current view transformation
   * @returns {Object} Transform object with scale, offsetX, offsetY
   */
  get transform() {
    return {
      scale: this.view.scale,
      x: this.view.offsetX,
      y: this.view.offsetY
    };
  }

  /**
   * Convert screen coordinates to world coordinates
   * @param {number} screenX - Screen X coordinate
   * @param {number} screenY - Screen Y coordinate
   * @returns {Object} World coordinates {x, y}
   */
  screenToWorld(screenX, screenY) {
    return {
      x: (screenX - this.view.offsetX) / this.view.scale,
      y: (screenY - this.view.offsetY) / this.view.scale
    };
  }

  /**
   * Convert world coordinates to screen coordinates
   * @param {number} worldX - World X coordinate
   * @param {number} worldY - World Y coordinate
   * @returns {Object} Screen coordinates {x, y}
   */
  worldToScreen(worldX, worldY) {
    return {
      x: worldX * this.view.scale + this.view.offsetX,
      y: worldY * this.view.scale + this.view.offsetY
    };
  }

  // ============================================================================
  // HISTORY MANAGEMENT
  // ============================================================================

  /**
   * Save current state to history for undo functionality
   * Uses surgical cloning for better performance
   * Respects configurable history depth from BoardManager
   */
  saveHistory() {
    const snapshot = {
      // Surgical clone: only copy the essential data properties
      document: {
        pins: this.document.pins.map(pin => ({ ...pin })),
        connections: this.document.connections.map(conn => ({ ...conn })),
        cards: this.document.cards.map(card => ({ ...card })),
        textElements: this.document.textElements.map(text => ({ ...text })),
        areas: this.document.areas.map(area => ({ ...area })),
        currentThemeId: this.document.currentThemeId,
        palette: [...this.document.palette],
        timelineActive: this.document.timelineActive,
        timelinePins: [...this.document.timelinePins],
        timelineY: this.document.timelineY,
        timelineLeft: this.document.timelineLeft,
        timelineRight: this.document.timelineRight,
      },
      view: {
        scale: this.view.scale,
        offsetX: this.view.offsetX,
        offsetY: this.view.offsetY,
        isLayoutSimulating: this.view.isLayoutSimulating,
      }
    };
    this.history.push(snapshot);
    
    // Use BoardManager's configured history depth, or fall back to MAX_HISTORY
    const maxHistory = window.boardManager?.getHistoryDepth() || window.MAX_HISTORY || 20;
    if (this.history.length > maxHistory) {
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

      // Restore document and view state
      this.document = { ...snapshot.document };
      this.view = { ...snapshot.view };

      // Clear transient session state after undo
      this.session.selectedPins = [];
      this.session.selectedTextIndex = null;
      this.session.connectStartIndex = null;
      this.session.connectMousePos = null;
      this.session.marqueeStart = null;
      this.session.marqueeEnd = null;

      return true;
    }
    return false;
  }

  // ============================================================================
  // SELECTION MANAGEMENT
  // ============================================================================

  /**
   * Set the selected pins (standardized selection method)
   * @param {number|number[]|null} selection - Pin index, array of indices, or null to clear
   */
  setSelectedPins(selection) {
    if (selection === null || selection === undefined) {
      this.session.selectedPins = [];
    } else if (Array.isArray(selection)) {
      this.session.selectedPins = [...selection];
    } else if (typeof selection === "number") {
      this.session.selectedPins = [selection];
    }
  }

  /**
   * Select a single pin (clears previous selection)
   * @param {number|null} index - Pin index to select, or null to clear
   */
  setSelectedPin(index) {
    this.setSelectedPins(index);
  }

  /**
   * Clear all selections
   */
  clearSelection() {
    this.session.selectedPins = [];
    this.session.selectedTextIndex = null;
    this.session.connectStartIndex = null;
    this.session.marqueeStart = null;
    this.session.marqueeEnd = null;
  }

  /**
   * Add a pin to the current selection (for multi-select)
   * @param {number} index - Pin index to add
   */
  addToSelection(index) {
    if (!this.session.selectedPins.includes(index)) {
      this.session.selectedPins.push(index);
    }
  }

  /**
   * Remove a pin from the current selection
   * @param {number} index - Pin index to remove
   */
  removeFromSelection(index) {
    this.session.selectedPins = this.session.selectedPins.filter(i => i !== index);
  }

  /**
   * Toggle pin selection (add if not selected, remove if selected)
   * @param {number} index - Pin index to toggle
   */
  togglePinSelection(index) {
    if (this.session.selectedPins.includes(index)) {
      this.removeFromSelection(index);
    } else {
      this.addToSelection(index);
    }
  }

  // ============================================================================
  // STATE SERIALIZATION
  // ============================================================================

  /**
   * Convert persistent state to a serializable object for localStorage
   * Only serializes document and view state, not transient session state
   * @returns {Object} Serializable state object
   */
  toSerializable() {
    return {
      document: { ...this.document },
      view: { ...this.view },
    };
  }

  /**
   * Load state from a serializable object
   * @param {Object} data - Serializable state object
   */
  fromSerializable(data) {
    // Handle both old format (direct properties) and new format (document/view objects)
    if (data.document && data.view) {
      // New format
      this.document = { ...data.document };
      this.view = { ...data.view };
    } else {
      // Backward compatibility: old format with direct properties
      this.document = {
        pins: data.pins || [],
        connections: data.connections || [],
        cards: data.cards || [],
        textElements: data.textElements || [],
        areas: data.areas || [],
        currentThemeId: data.currentThemeId || "default",
        palette: data.palette || this.document.palette,
        timelineActive: data.timelineActive || false,
        timelinePins: data.timelinePins || [],
        timelineY: data.timelineY || 0,
        timelineLeft: data.timelineLeft || 0,
        timelineRight: data.timelineRight || 0,
      };
      this.view = {
        scale: data.scale || 1,
        offsetX: data.offsetX || 0,
        offsetY: data.offsetY || 0,
        isLayoutSimulating: false,
      };
    }

    // Reset session state and history
    this.session = {
      selectedPins: [],
      selectedTextIndex: null,
      connectStartIndex: null,
      connectMousePos: null,
      connectionMode: null,
      marqueeStart: null,
      marqueeEnd: null,
      mouseScreenX: 0,
      mouseScreenY: 0,
      didDrag: false,
      time: 0,
      currentTool: "pin",
      currentFamily: "pin",
      currentTypeId: "pin:circle",
      selectedColor: data.selectedColor || "#58a6ff",
      connectionType: "straight",
      selectedTypeByFamily: {
        pin: 0,
        card: 0,
        area: 0,
        text: 0,
      },
    };
    this.history = [];
  }

  // ============================================================================
  // MULTI-BOARD SERIALIZATION
  // ============================================================================

  /**
   * Convert state to full board data format (for BoardManager)
   * Includes metadata and history for complete board persistence
   * @returns {Object} Complete board data object
   */
  toBoardData() {
    return {
      id: this.meta.id,
      meta: {
        id: this.meta.id,
        title: this.meta.title,
        description: this.meta.description,
        userId: this.meta.userId,
        created: this.meta.created,
        lastModified: this.meta.lastModified,
        thumbnail: this.meta.thumbnail
      },
      document: {
        pins: this.document.pins.map(pin => ({ ...pin })),
        connections: this.document.connections.map(conn => ({ ...conn })),
        cards: this.document.cards.map(card => ({ ...card })),
        textElements: this.document.textElements.map(text => ({ ...text })),
        areas: this.document.areas.map(area => ({ ...area })),
        currentThemeId: this.document.currentThemeId,
        palette: [...this.document.palette],
        timelineActive: this.document.timelineActive,
        timelinePins: [...this.document.timelinePins],
        timelineY: this.document.timelineY,
        timelineLeft: this.document.timelineLeft,
        timelineRight: this.document.timelineRight,
      },
      view: {
        scale: this.view.scale,
        offsetX: this.view.offsetX,
        offsetY: this.view.offsetY,
        isLayoutSimulating: this.view.isLayoutSimulating,
      },
      history: this.history.map(snapshot => ({
        document: { ...snapshot.document },
        view: { ...snapshot.view }
      }))
    };
  }

  /**
   * Load state from full board data format (from BoardManager)
   * Restores metadata, document, view, and history
   * @param {Object} boardData - Complete board data object
   */
  fromBoardData(boardData) {
    // Load metadata
    if (boardData.meta) {
      this.meta = {
        id: boardData.meta.id || boardData.id,
        title: boardData.meta.title || "Untitled Board",
        description: boardData.meta.description || "",
        userId: boardData.meta.userId || null,
        created: boardData.meta.created || null,
        lastModified: boardData.meta.lastModified || null,
        thumbnail: boardData.meta.thumbnail || null
      };
    } else {
      this.meta.id = boardData.id;
    }

    // Load document
    if (boardData.document) {
      this.document = {
        pins: boardData.document.pins || [],
        connections: boardData.document.connections || [],
        cards: boardData.document.cards || [],
        textElements: boardData.document.textElements || [],
        areas: boardData.document.areas || [],
        currentThemeId: boardData.document.currentThemeId || "default",
        palette: boardData.document.palette || [
          { name: "Red", value: "#f85149" },
          { name: "Blue", value: "#58a6ff" },
          { name: "Green", value: "#3fb950" },
          { name: "Yellow", value: "#f1c40f" },
          { name: "Purple", value: "#a471f7" },
        ],
        timelineActive: boardData.document.timelineActive || false,
        timelinePins: boardData.document.timelinePins || [],
        timelineY: boardData.document.timelineY || 0,
        timelineLeft: boardData.document.timelineLeft || 0,
        timelineRight: boardData.document.timelineRight || 0,
      };
    }

    // Load view
    if (boardData.view) {
      this.view = {
        scale: boardData.view.scale || 1,
        offsetX: boardData.view.offsetX || 0,
        offsetY: boardData.view.offsetY || 0,
        isLayoutSimulating: boardData.view.isLayoutSimulating || false,
      };
    }

    // Load history
    this.history = boardData.history || [];

    // Reset session state (transient)
    this.session = {
      selectedPins: [],
      selectedTextIndex: null,
      connectStartIndex: null,
      connectMousePos: null,
      connectionMode: null,
      marqueeStart: null,
      marqueeEnd: null,
      mouseScreenX: 0,
      mouseScreenY: 0,
      didDrag: false,
      time: 0,
      currentTool: "pin",
      currentFamily: "pin",
      currentTypeId: "pin:circle",
      selectedColor: "#58a6ff",
      connectionType: "straight",
      selectedTypeByFamily: {
        pin: 0,
        card: 0,
        area: 0,
        text: 0,
      },
    };
  }

  /**
   * Clear the board (for "New Board" or "Close Board" actions)
   * Resets to a fresh empty state while preserving session preferences
   */
  clearBoard() {
    const selectedColor = this.session.selectedColor;
    const connectionType = this.session.connectionType;

    // Reset meta to defaults
    this.meta = {
      id: null,
      title: "Untitled Board",
      description: "",
      userId: null,
      created: null,
      lastModified: null,
      thumbnail: null
    };

    // Reset document to empty
    this.document = {
      pins: [],
      connections: [],
      cards: [],
      textElements: [],
      areas: [],
      currentThemeId: "default",
      palette: [
        { name: "Red", value: "#f85149" },
        { name: "Blue", value: "#58a6ff" },
        { name: "Green", value: "#3fb950" },
        { name: "Yellow", value: "#f1c40f" },
        { name: "Purple", value: "#a471f7" },
      ],
      timelineActive: false,
      timelinePins: [],
      timelineY: 0,
      timelineLeft: 0,
      timelineRight: 0,
    };

    // Reset view to defaults
    this.view = {
      scale: 1,
      offsetX: 0,
      offsetY: 0,
      isLayoutSimulating: false,
    };

    // Clear history
    this.history = [];

    // Reset session but preserve some preferences
    this.session = {
      selectedPins: [],
      selectedTextIndex: null,
      connectStartIndex: null,
      connectMousePos: null,
      connectionMode: null,
      marqueeStart: null,
      marqueeEnd: null,
      mouseScreenX: 0,
      mouseScreenY: 0,
      didDrag: false,
      time: 0,
      currentTool: "pin",
      currentFamily: "pin",
      currentTypeId: "pin:circle",
      selectedColor: selectedColor,
      connectionType: connectionType,
      selectedTypeByFamily: {
        pin: 0,
        card: 0,
        area: 0,
        text: 0,
      },
    };
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  /**
   * Get the primary selected pin object (first in selection)
   * @returns {Object|null} Primary selected pin or null
   */
  getSelectedPin() {
    const primaryIndex = this.getPrimarySelectedPinIndex();
    return primaryIndex !== null && this.document.pins[primaryIndex]
      ? this.document.pins[primaryIndex]
      : null;
  }

  /**
   * Get the primary selected pin index
   * @returns {number|null} Primary selected pin index or null
   */
  getPrimarySelectedPinIndex() {
    return this.session.selectedPins.length > 0 ? this.session.selectedPins[0] : null;
  }

  /**
   * Get all currently selected pin objects
   * @returns {Array} Array of selected pin objects
   */
  getSelectedPins() {
    return this.session.selectedPins
      .map(i => this.document.pins[i])
      .filter(p => p !== undefined);
  }

  /**
   * Check if a pin index is currently selected
   * @param {number} index - Pin index to check
   * @returns {boolean} True if selected
   */
  isPinSelected(index) {
    return this.session.selectedPins.includes(index);
  }

  /**
   * Get the count of selected pins
   * @returns {number} Number of selected pins
   */
  getSelectedPinCount() {
    return this.session.selectedPins.length;
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

  console.log("🔍 saveAppState called, appState type:", typeof appState);
  console.log("🔍 appState.pins:", appState.pins, "length:", appState.pins?.length);
  console.log("🔍 appState.document:", appState.document, "document.pins:", appState.document?.pins);

  const stateData = appState.toSerializable();
  console.log("🔍 saveAppState serialized data:", {
    hasDocument: !!stateData.document,
    pinsCount: stateData.document?.pins?.length || 0,
    connectionsCount: stateData.document?.connections?.length || 0,
    pinsType: typeof stateData.document?.pins,
    isPinsArray: Array.isArray(stateData.document?.pins),
    storageKey: window.STORAGE_KEY
  });

  try {
    const jsonString = JSON.stringify(stateData);
    console.log("🔍 Attempting to save JSON string of length:", jsonString.length);
    localStorage.setItem(window.STORAGE_KEY, jsonString);
    console.log("✅ Successfully saved to localStorage with key:", window.STORAGE_KEY);

    // Verify the save worked immediately
    const verifyStored = localStorage.getItem(window.STORAGE_KEY);
    if (verifyStored) {
      try {
        const verifyParsed = JSON.parse(verifyStored);
        console.log("✅ Verification: localStorage contains", verifyParsed.document?.pins?.length || 0, "pins");
      } catch (parseError) {
        console.error("❌ Verification failed: could not parse stored data:", parseError);
        console.log("❌ Stored data:", verifyStored.substring(0, 500));
      }
    } else {
      console.error("❌ Verification failed: localStorage.getItem returned null after save");
    }
  } catch (e) {
    console.error("❌ Failed to save AppState to localStorage:", e);
    console.error("❌ Error details:", e.message, e.stack);
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
