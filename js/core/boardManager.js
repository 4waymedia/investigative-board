// ============================================================================
// BOARD MANAGER MODULE - Multi-board storage and management
// ============================================================================

/**
 * BoardManager handles all multi-board operations including:
 * - CRUD operations for boards
 * - Export/Import functionality
 * - Membership-based limits
 * - Legacy data migration
 */
class BoardManager {
  constructor() {
    // Storage keys
    this.INDEX_KEY = 'msc-board-index';
    this.BOARD_PREFIX = 'msc-board-';
    this.LEGACY_KEY = 'msc-investigativeboard';

    // Membership configurations
    this.MEMBERSHIP_CONFIG = {
      free: { maxBoards: 5, historyOptions: [10, 20] },
      pro: { maxBoards: 25, historyOptions: [10, 20, 50] },
      enterprise: { maxBoards: Infinity, historyOptions: [10, 20, 50, 100] }
    };

    // Default index structure
    this.defaultIndex = {
      version: '1.0',
      activeId: null,
      settings: {
        historyDepth: 20,
        membership: 'free'
      },
      boards: []
    };

    // Reference to AppState (set during initialize)
    this.appState = null;

    // Reference to app for thumbnail generation
    this.app = null;
  }

  // ============================================================================
  // INITIALIZATION
  // ============================================================================

  /**
   * Initialize the BoardManager
   * @param {AppState} appState - Reference to the application state
   * @param {Application} app - Reference to the main application (for thumbnails)
   */
  initialize(appState, app = null) {
    this.appState = appState;
    this.app = app;

    // Load or create the board index
    this._ensureIndex();

    // Check for legacy data migration
    if (this._hasLegacyData()) {
      this.migrateFromLegacy();
    }

    console.log('BoardManager initialized');
  }

  /**
   * Ensure the board index exists in localStorage
   * @private
   */
  _ensureIndex() {
    const index = this._loadIndex();
    if (!index) {
      this._saveIndex(this.defaultIndex);
    }
  }

  // ============================================================================
  // INDEX OPERATIONS
  // ============================================================================

  /**
   * Load the board index from localStorage
   * @private
   * @returns {Object|null} The board index or null if not found
   */
  _loadIndex() {
    try {
      const stored = localStorage.getItem(this.INDEX_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error('Failed to load board index:', e);
    }
    return null;
  }

  /**
   * Save the board index to localStorage
   * @private
   * @param {Object} index - The board index to save
   */
  _saveIndex(index) {
    try {
      localStorage.setItem(this.INDEX_KEY, JSON.stringify(index));
    } catch (e) {
      console.error('Failed to save board index:', e);
    }
  }

  /**
   * Get the current board index
   * @returns {Object} The board index
   */
  getIndex() {
    return this._loadIndex() || { ...this.defaultIndex };
  }

  // ============================================================================
  // BOARD CRUD OPERATIONS
  // ============================================================================

  /**
   * Get list of all board metadata
   * @returns {Array} Array of board metadata objects
   */
  getBoardList() {
    const index = this.getIndex();
    return index.boards || [];
  }

  /**
   * Get the currently active board ID
   * @returns {string|null} The active board ID or null
   */
  getActiveBoardId() {
    const index = this.getIndex();
    return index.activeId;
  }

  /**
   * Get board metadata by ID
   * @param {string} boardId - The board ID
   * @returns {Object|null} Board metadata or null if not found
   */
  getBoardMeta(boardId) {
    const boards = this.getBoardList();
    return boards.find(b => b.id === boardId) || null;
  }

  /**
   * Create a new board
   * @param {string} title - Board title
   * @param {string} description - Board description
   * @param {string} userId - User ID (optional)
   * @returns {string|null} The new board ID or null if at limit
   */
  createBoard(title = 'Untitled Board', description = '', userId = null) {
    if (!this.canCreateBoard()) {
      console.warn('Cannot create board: at membership limit');
      return null;
    }

    const now = new Date().toISOString();
    const boardId = this._generateId();

    // Create board metadata
    const meta = {
      id: boardId,
      title: title,
      description: description,
      userId: userId,
      created: now,
      lastModified: now,
      thumbnail: null
    };

    // Create empty board data
    const boardData = {
      id: boardId,
      meta: { ...meta },
      document: {
        pins: [],
        connections: [],
        cards: [],
        textElements: [],
        areas: [],
        currentThemeId: 'default',
        palette: [
          { name: 'Red', value: '#f85149' },
          { name: 'Blue', value: '#58a6ff' },
          { name: 'Green', value: '#3fb950' },
          { name: 'Yellow', value: '#f1c40f' },
          { name: 'Purple', value: '#a471f7' }
        ],
        timelineActive: false,
        timelinePins: [],
        timelineY: 0,
        timelineLeft: 0,
        timelineRight: 0
      },
      view: {
        scale: 1,
        offsetX: 0,
        offsetY: 0,
        isLayoutSimulating: false
      },
      history: []
    };

    // Save board data
    this._saveBoardData(boardId, boardData);

    // Update index
    const index = this.getIndex();
    index.boards.push(meta);
    index.activeId = boardId;
    this._saveIndex(index);

    console.log(`Created new board: ${title} (${boardId})`);
    return boardId;
  }

  /**
   * Load a board into AppState
   * @param {string} boardId - The board ID to load
   * @returns {boolean} True if successful
   */
  loadBoard(boardId) {
    if (!this.appState) {
      console.error('AppState not initialized');
      return false;
    }

    const boardData = this._loadBoardData(boardId);
    if (!boardData) {
      console.error(`Board not found: ${boardId}`);
      return false;
    }

    // Load board data into AppState
    this.appState.fromBoardData(boardData);

    // Update active board in index
    const index = this.getIndex();
    index.activeId = boardId;
    this._saveIndex(index);

    console.log(`Loaded board: ${boardData.meta.title} (${boardId})`);
    return true;
  }

  /**
   * Save the current board
   * @param {boolean} updateThumbnail - Whether to update the thumbnail
   * @returns {boolean} True if successful
   */
  saveBoard(updateThumbnail = true) {
    if (!this.appState || !this.appState.meta?.id) {
      console.warn('No active board to save');
      return false;
    }

    const boardId = this.appState.meta.id;
    const now = new Date().toISOString();

    // Update last modified time
    this.appState.meta.lastModified = now;

    // Generate thumbnail if requested and app is available
    if (updateThumbnail && this.app && typeof this.app.generateThumbnail === 'function') {
      this.appState.meta.thumbnail = this.app.generateThumbnail();
    }

    // Get board data from AppState
    const boardData = this.appState.toBoardData();

    // Trim history to configured depth
    const maxHistory = this.getHistoryDepth();
    if (boardData.history && boardData.history.length > maxHistory) {
      boardData.history = boardData.history.slice(-maxHistory);
    }

    // Save board data
    this._saveBoardData(boardId, boardData);

    // Update metadata in index
    const index = this.getIndex();
    const boardIndex = index.boards.findIndex(b => b.id === boardId);
    if (boardIndex >= 0) {
      index.boards[boardIndex] = {
        ...index.boards[boardIndex],
        title: this.appState.meta.title,
        description: this.appState.meta.description,
        lastModified: now,
        thumbnail: this.appState.meta.thumbnail
      };
      this._saveIndex(index);
    }

    console.log(`Saved board: ${this.appState.meta.title} (${boardId})`);
    return true;
  }

  /**
   * Delete a board
   * @param {string} boardId - The board ID to delete
   * @returns {boolean} True if successful
   */
  deleteBoard(boardId) {
    // Remove board data
    try {
      localStorage.removeItem(this.BOARD_PREFIX + boardId);
    } catch (e) {
      console.error('Failed to delete board data:', e);
      return false;
    }

    // Update index
    const index = this.getIndex();
    index.boards = index.boards.filter(b => b.id !== boardId);

    // Clear active board if it was deleted
    if (index.activeId === boardId) {
      index.activeId = index.boards.length > 0 ? index.boards[0].id : null;
    }

    this._saveIndex(index);

    console.log(`Deleted board: ${boardId}`);
    return true;
  }

  /**
   * Duplicate a board
   * @param {string} boardId - The board ID to duplicate
   * @param {string} newTitle - Title for the duplicate
   * @returns {string|null} The new board ID or null if failed
   */
  duplicateBoard(boardId, newTitle = null) {
    if (!this.canCreateBoard()) {
      console.warn('Cannot duplicate board: at membership limit');
      return null;
    }

    const originalData = this._loadBoardData(boardId);
    if (!originalData) {
      console.error(`Board not found: ${boardId}`);
      return null;
    }

    const now = new Date().toISOString();
    const newBoardId = this._generateId();

    // Create new metadata
    const meta = {
      id: newBoardId,
      title: newTitle || `${originalData.meta.title} (Copy)`,
      description: originalData.meta.description,
      userId: originalData.meta.userId,
      created: now,
      lastModified: now,
      thumbnail: originalData.meta.thumbnail
    };

    // Create new board data (deep clone document and view, clear history)
    const newBoardData = {
      id: newBoardId,
      meta: { ...meta },
      document: JSON.parse(JSON.stringify(originalData.document)),
      view: { ...originalData.view },
      history: []
    };

    // Save new board
    this._saveBoardData(newBoardId, newBoardData);

    // Update index
    const index = this.getIndex();
    index.boards.push(meta);
    this._saveIndex(index);

    console.log(`Duplicated board: ${meta.title} (${newBoardId})`);
    return newBoardId;
  }

  /**
   * Update board metadata
   * @param {string} boardId - The board ID
   * @param {Object} updates - Metadata updates (title, description)
   * @returns {boolean} True if successful
   */
  updateBoardMeta(boardId, updates) {
    const index = this.getIndex();
    const boardIndex = index.boards.findIndex(b => b.id === boardId);

    if (boardIndex < 0) {
      console.error(`Board not found: ${boardId}`);
      return false;
    }

    // Update allowed fields
    if (updates.title !== undefined) {
      index.boards[boardIndex].title = updates.title;
    }
    if (updates.description !== undefined) {
      index.boards[boardIndex].description = updates.description;
    }
    index.boards[boardIndex].lastModified = new Date().toISOString();

    this._saveIndex(index);

    // Also update board data file
    const boardData = this._loadBoardData(boardId);
    if (boardData) {
      if (updates.title !== undefined) {
        boardData.meta.title = updates.title;
      }
      if (updates.description !== undefined) {
        boardData.meta.description = updates.description;
      }
      boardData.meta.lastModified = index.boards[boardIndex].lastModified;
      this._saveBoardData(boardId, boardData);
    }

    // Update AppState if this is the active board
    if (this.appState && this.appState.meta?.id === boardId) {
      if (updates.title !== undefined) {
        this.appState.meta.title = updates.title;
      }
      if (updates.description !== undefined) {
        this.appState.meta.description = updates.description;
      }
    }

    return true;
  }

  // ============================================================================
  // EXPORT / IMPORT
  // ============================================================================

  /**
   * Export a board as a downloadable JSON file
   * @param {string} boardId - The board ID to export (defaults to active board)
   */
  exportBoard(boardId = null) {
    const targetId = boardId || this.getActiveBoardId();
    if (!targetId) {
      console.error('No board to export');
      return;
    }

    const boardData = this._loadBoardData(targetId);
    if (!boardData) {
      console.error(`Board not found: ${targetId}`);
      return;
    }

    // Create export format (without history to reduce size)
    const exportData = {
      formatVersion: '1.0',
      exportedAt: new Date().toISOString(),
      exportedFrom: 'investigative-board',
      board: {
        id: boardData.id,
        meta: { ...boardData.meta },
        document: { ...boardData.document },
        view: { ...boardData.view }
        // History intentionally excluded
      }
    };

    // Generate filename
    const safeName = boardData.meta.title
      .replace(/[^a-z0-9]/gi, '_')
      .replace(/_+/g, '_')
      .toLowerCase();
    const filename = `${safeName}_${new Date().toISOString().split('T')[0]}.json`;

    // Create and trigger download
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    console.log(`Exported board: ${boardData.meta.title}`);
  }

  /**
   * Import a board from a JSON file
   * @param {File} file - The file to import
   * @returns {Promise<string|null>} The new board ID or null if failed
   */
  async importBoard(file) {
    if (!this.canCreateBoard()) {
      console.warn('Cannot import board: at membership limit');
      return null;
    }

    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const importData = JSON.parse(e.target.result);

          // Validate format
          if (!importData.formatVersion || !importData.board) {
            throw new Error('Invalid board file format');
          }

          const now = new Date().toISOString();
          const newBoardId = this._generateId();
          const importedBoard = importData.board;

          // Create new metadata
          const meta = {
            id: newBoardId,
            title: importedBoard.meta?.title || 'Imported Board',
            description: importedBoard.meta?.description || '',
            userId: importedBoard.meta?.userId || null,
            created: now,
            lastModified: now,
            thumbnail: importedBoard.meta?.thumbnail || null
          };

          // Create board data
          const boardData = {
            id: newBoardId,
            meta: { ...meta },
            document: importedBoard.document || {
              pins: [],
              connections: [],
              cards: [],
              textElements: [],
              areas: [],
              currentThemeId: 'default',
              palette: window.DEFAULT_COLORS || [],
              timelineActive: false,
              timelinePins: [],
              timelineY: 0,
              timelineLeft: 0,
              timelineRight: 0
            },
            view: importedBoard.view || {
              scale: 1,
              offsetX: 0,
              offsetY: 0,
              isLayoutSimulating: false
            },
            history: []
          };

          // Save board data
          this._saveBoardData(newBoardId, boardData);

          // Update index
          const index = this.getIndex();
          index.boards.push(meta);
          this._saveIndex(index);

          console.log(`Imported board: ${meta.title} (${newBoardId})`);
          resolve(newBoardId);

        } catch (err) {
          console.error('Failed to import board:', err);
          reject(err);
        }
      };

      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };

      reader.readAsText(file);
    });
  }

  /**
   * Open file picker and import a board
   * @returns {Promise<string|null>} The new board ID or null
   */
  async importBoardFromFile() {
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json';

      input.onchange = async (e) => {
        const file = e.target.files[0];
        if (file) {
          try {
            const boardId = await this.importBoard(file);
            resolve(boardId);
          } catch (err) {
            console.error('Import failed:', err);
            resolve(null);
          }
        } else {
          resolve(null);
        }
      };

      input.click();
    });
  }

  // ============================================================================
  // MEMBERSHIP & LIMITS
  // ============================================================================

  /**
   * Check if user can create a new board
   * @returns {boolean} True if under the limit
   */
  canCreateBoard() {
    const index = this.getIndex();
    const membership = index.settings?.membership || 'free';
    const config = this.MEMBERSHIP_CONFIG[membership] || this.MEMBERSHIP_CONFIG.free;
    return index.boards.length < config.maxBoards;
  }

  /**
   * Get the number of boards remaining
   * @returns {number} Number of boards that can still be created
   */
  getRemainingBoardSlots() {
    const index = this.getIndex();
    const membership = index.settings?.membership || 'free';
    const config = this.MEMBERSHIP_CONFIG[membership] || this.MEMBERSHIP_CONFIG.free;
    return Math.max(0, config.maxBoards - index.boards.length);
  }

  /**
   * Get current membership level
   * @returns {string} Membership level
   */
  getMembership() {
    const index = this.getIndex();
    return index.settings?.membership || 'free';
  }

  /**
   * Set membership level
   * @param {string} membership - New membership level
   */
  setMembership(membership) {
    if (!this.MEMBERSHIP_CONFIG[membership]) {
      console.error(`Invalid membership level: ${membership}`);
      return;
    }

    const index = this.getIndex();
    index.settings.membership = membership;
    this._saveIndex(index);
  }

  /**
   * Get configured history depth
   * @returns {number} History depth
   */
  getHistoryDepth() {
    const index = this.getIndex();
    return index.settings?.historyDepth || 20;
  }

  /**
   * Set history depth
   * @param {number} depth - New history depth
   * @returns {boolean} True if valid and set
   */
  setHistoryDepth(depth) {
    const index = this.getIndex();
    const membership = index.settings?.membership || 'free';
    const config = this.MEMBERSHIP_CONFIG[membership] || this.MEMBERSHIP_CONFIG.free;

    if (!config.historyOptions.includes(depth)) {
      console.error(`Invalid history depth for ${membership}: ${depth}`);
      return false;
    }

    index.settings.historyDepth = depth;
    this._saveIndex(index);
    return true;
  }

  /**
   * Get available history depth options for current membership
   * @returns {Array<number>} Available history depths
   */
  getHistoryDepthOptions() {
    const index = this.getIndex();
    const membership = index.settings?.membership || 'free';
    const config = this.MEMBERSHIP_CONFIG[membership] || this.MEMBERSHIP_CONFIG.free;
    return config.historyOptions;
  }

  // ============================================================================
  // LEGACY MIGRATION
  // ============================================================================

  /**
   * Check if legacy data exists
   * @private
   * @returns {boolean} True if legacy data found
   */
  _hasLegacyData() {
    return localStorage.getItem(this.LEGACY_KEY) !== null;
  }

  /**
   * Migrate from legacy single-board format to multi-board
   * @returns {string|null} The migrated board ID or null
   */
  migrateFromLegacy() {
    console.log('Migrating from legacy format...');

    try {
      const legacyData = localStorage.getItem(this.LEGACY_KEY);
      if (!legacyData) {
        console.log('No legacy data found');
        return null;
      }

      const parsed = JSON.parse(legacyData);
      const now = new Date().toISOString();
      const boardId = this._generateId();

      // Determine document and view from legacy format
      let document, view;

      if (parsed.document && parsed.view) {
        // New format already
        document = parsed.document;
        view = parsed.view;
      } else {
        // Old format - direct properties
        document = {
          pins: parsed.pins || [],
          connections: parsed.connections || [],
          cards: parsed.cards || [],
          textElements: parsed.textElements || [],
          areas: parsed.areas || [],
          currentThemeId: parsed.currentThemeId || 'default',
          palette: parsed.palette || window.DEFAULT_COLORS || [],
          timelineActive: parsed.timelineActive || false,
          timelinePins: parsed.timelinePins || [],
          timelineY: parsed.timelineY || 0,
          timelineLeft: parsed.timelineLeft || 0,
          timelineRight: parsed.timelineRight || 0
        };
        view = {
          scale: parsed.scale || 1,
          offsetX: parsed.offsetX || 0,
          offsetY: parsed.offsetY || 0,
          isLayoutSimulating: false
        };
      }

      // Create metadata
      const meta = {
        id: boardId,
        title: 'My Board',
        description: 'Migrated from previous version',
        userId: null,
        created: now,
        lastModified: now,
        thumbnail: null
      };

      // Create board data
      const boardData = {
        id: boardId,
        meta: { ...meta },
        document: document,
        view: view,
        history: []
      };

      // Save new board
      this._saveBoardData(boardId, boardData);

      // Update index
      const index = this.getIndex();
      index.boards.push(meta);
      index.activeId = boardId;
      this._saveIndex(index);

      // Remove legacy data
      localStorage.removeItem(this.LEGACY_KEY);

      console.log(`Migration complete. Board: ${boardId}`);
      return boardId;

    } catch (e) {
      console.error('Migration failed:', e);
      return null;
    }
  }

  // ============================================================================
  // PRIVATE HELPERS
  // ============================================================================

  /**
   * Generate a unique board ID
   * @private
   * @returns {string} UUID
   */
  _generateId() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    // Fallback
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  /**
   * Load board data from localStorage
   * @private
   * @param {string} boardId - The board ID
   * @returns {Object|null} Board data or null
   */
  _loadBoardData(boardId) {
    try {
      const stored = localStorage.getItem(this.BOARD_PREFIX + boardId);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error(`Failed to load board ${boardId}:`, e);
    }
    return null;
  }

  /**
   * Save board data to localStorage
   * @private
   * @param {string} boardId - The board ID
   * @param {Object} boardData - The board data to save
   */
  _saveBoardData(boardId, boardData) {
    try {
      localStorage.setItem(this.BOARD_PREFIX + boardId, JSON.stringify(boardData));
    } catch (e) {
      console.error(`Failed to save board ${boardId}:`, e);
    }
  }
}

// ============================================================================
// GLOBAL EXPORT
// ============================================================================

window.BoardManager = BoardManager;
