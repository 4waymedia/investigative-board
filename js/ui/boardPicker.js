// ============================================================================
// BOARD PICKER UI - Modal for managing multiple boards
// ============================================================================

/**
 * BoardPickerUI handles the modal interface for board management:
 * - Grid view of saved boards with thumbnails
 * - Create, load, duplicate, export, delete boards
 * - Membership limit warnings
 */
class BoardPickerUI {
  constructor() {
    this.boardManager = null;
    this.appState = null;
    this.app = null;
    this.isOpen = false;
    
    // Callbacks
    this.onBoardLoad = null;
    this.onBoardCreate = null;
    
    // DOM elements (created on first open)
    this.backdrop = null;
    this.modal = null;
  }

  // ============================================================================
  // INITIALIZATION
  // ============================================================================

  /**
   * Initialize the BoardPickerUI
   * @param {BoardManager} boardManager - Reference to BoardManager
   * @param {AppState} appState - Reference to AppState
   * @param {Application} app - Reference to main application
   * @param {Object} callbacks - Callback functions
   */
  initialize(boardManager, appState, app, callbacks = {}) {
    this.boardManager = boardManager;
    this.appState = appState;
    this.app = app;
    this.onBoardLoad = callbacks.onBoardLoad;
    this.onBoardCreate = callbacks.onBoardCreate;
    
    // Create the modal DOM structure
    this._createModal();
    
    // Set up keyboard handler
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) {
        this.close();
      }
    });

    console.log('BoardPickerUI initialized');
  }

  // ============================================================================
  // MODAL MANAGEMENT
  // ============================================================================

  /**
   * Create the modal DOM structure
   * @private
   */
  _createModal() {
    // Create backdrop
    this.backdrop = document.createElement('div');
    this.backdrop.className = 'board-picker-backdrop';
    this.backdrop.style.display = 'none';
    this.backdrop.addEventListener('click', (e) => {
      if (e.target === this.backdrop) {
        this.close();
      }
    });

    // Create modal container
    this.modal = document.createElement('div');
    this.modal.className = 'board-picker-modal';
    this.modal.innerHTML = this._getModalHTML();

    this.backdrop.appendChild(this.modal);
    document.body.appendChild(this.backdrop);

    // Set up event delegation for modal actions
    this.modal.addEventListener('click', (e) => this._handleModalClick(e));
  }

  /**
   * Get the modal HTML structure
   * @private
   * @returns {string} Modal HTML
   */
  _getModalHTML() {
    return `
      <div class="board-picker-header">
        <h2 class="board-picker-title">My Boards</h2>
        <button class="board-picker-close" data-action="close">&times;</button>
      </div>
      <div class="board-picker-toolbar">
        <button class="board-picker-btn board-picker-btn-primary" data-action="new-board">
          <span class="board-picker-btn-icon">+</span>
          New Board
        </button>
        <button class="board-picker-btn" data-action="import-board">
          <span class="board-picker-btn-icon">📥</span>
          Import
        </button>
        <div class="board-picker-limit-info"></div>
      </div>
      <div class="board-picker-content">
        <div class="board-picker-grid"></div>
        <div class="board-picker-empty" style="display: none;">
          <div class="board-picker-empty-icon">📋</div>
          <h3>No boards yet</h3>
          <p>Create your first board to get started!</p>
          <button class="board-picker-btn board-picker-btn-primary" data-action="new-board">
            Create Board
          </button>
        </div>
      </div>
    `;
  }

  /**
   * Open the board picker modal
   */
  open() {
    if (this.isOpen) return;
    
    // Refresh thumbnail for current active board before rendering
    if (this.boardManager && this.appState?.meta?.id) {
      this.boardManager.saveBoard(true);
    }

    this.isOpen = true;
    this.backdrop.style.display = 'flex';
    this._render();
    
    // Focus trap
    this.modal.querySelector('.board-picker-close').focus();
  }

  /**
   * Close the board picker modal
   */
  close() {
    if (!this.isOpen) return;
    
    this.isOpen = false;
    this.backdrop.style.display = 'none';
  }

  /**
   * Toggle the board picker modal
   */
  toggle() {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  // ============================================================================
  // RENDERING
  // ============================================================================

  /**
   * Render the board picker content
   * @private
   */
  _render() {
    if (!this.boardManager) return;

    const boards = this.boardManager.getBoardList();
    const activeId = this.boardManager.getActiveBoardId();
    const canCreate = this.boardManager.canCreateBoard();
    const remaining = this.boardManager.getRemainingBoardSlots();
    const membership = this.boardManager.getMembership();

    // Update limit info
    const limitInfo = this.modal.querySelector('.board-picker-limit-info');
    if (remaining === Infinity) {
      limitInfo.textContent = 'Unlimited boards';
    } else {
      limitInfo.textContent = `${remaining} board${remaining !== 1 ? 's' : ''} remaining`;
      if (remaining <= 1) {
        limitInfo.classList.add('board-picker-limit-warning');
      } else {
        limitInfo.classList.remove('board-picker-limit-warning');
      }
    }

    // Update new board button state
    const newBoardBtns = this.modal.querySelectorAll('[data-action="new-board"]');
    newBoardBtns.forEach(btn => {
      btn.disabled = !canCreate;
      if (!canCreate) {
        btn.title = `Upgrade to ${membership === 'free' ? 'Pro' : 'Enterprise'} for more boards`;
      } else {
        btn.title = '';
      }
    });

    // Render board grid or empty state
    const grid = this.modal.querySelector('.board-picker-grid');
    const empty = this.modal.querySelector('.board-picker-empty');

    if (boards.length === 0) {
      grid.style.display = 'none';
      empty.style.display = 'flex';
    } else {
      grid.style.display = 'grid';
      empty.style.display = 'none';
      grid.innerHTML = boards.map(board => this._renderBoardCard(board, activeId)).join('');
    }
  }

  /**
   * Render a single board card
   * @private
   * @param {Object} board - Board metadata
   * @param {string} activeId - Currently active board ID
   * @returns {string} Board card HTML
   */
  _renderBoardCard(board, activeId) {
    const isActive = board.id === activeId;
    const lastModified = this._formatDate(board.lastModified);
    const thumbnail = board.thumbnail || this._getPlaceholderThumbnail();
    
    return `
      <div class="board-card ${isActive ? 'board-card-active' : ''}" data-board-id="${board.id}">
        <div class="board-card-thumbnail" style="background-image: url('${thumbnail}')">
          ${isActive ? '<div class="board-card-active-badge">Current</div>' : ''}
        </div>
        <div class="board-card-info">
          <h3 class="board-card-title">${this._escapeHtml(board.title)}</h3>
          <p class="board-card-meta">${lastModified}</p>
        </div>
        <div class="board-card-actions">
          ${!isActive ? `<button class="board-card-btn" data-action="load" data-board-id="${board.id}" title="Load board">
            <span>📂</span>
          </button>` : ''}
          <button class="board-card-btn" data-action="duplicate" data-board-id="${board.id}" title="Duplicate board">
            <span>📋</span>
          </button>
          <button class="board-card-btn" data-action="export" data-board-id="${board.id}" title="Export board">
            <span>📤</span>
          </button>
          <button class="board-card-btn" data-action="edit" data-board-id="${board.id}" title="Edit board info">
            <span>✏️</span>
          </button>
          ${!isActive ? `<button class="board-card-btn board-card-btn-danger" data-action="delete" data-board-id="${board.id}" title="Delete board">
            <span>🗑️</span>
          </button>` : ''}
        </div>
      </div>
    `;
  }

  /**
   * Get a placeholder thumbnail for boards without one
   * @private
   * @returns {string} Data URL for placeholder image
   */
  _getPlaceholderThumbnail() {
    // Create a simple placeholder canvas
    const canvas = document.createElement('canvas');
    canvas.width = 200;
    canvas.height = 150;
    const ctx = canvas.getContext('2d');
    
    // Dark background
    ctx.fillStyle = '#1e1e2e';
    ctx.fillRect(0, 0, 200, 150);
    
    // Grid pattern
    ctx.strokeStyle = '#2a2a3e';
    ctx.lineWidth = 1;
    for (let x = 0; x < 200; x += 20) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 150);
      ctx.stroke();
    }
    for (let y = 0; y < 150; y += 20) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(200, y);
      ctx.stroke();
    }
    
    // Placeholder icon
    ctx.fillStyle = '#4a4a5e';
    ctx.font = '40px system-ui';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('📋', 100, 75);
    
    return canvas.toDataURL('image/png');
  }

  /**
   * Format a date string for display
   * @private
   * @param {string} dateStr - ISO date string
   * @returns {string} Formatted date
   */
  _formatDate(dateStr) {
    if (!dateStr) return 'Never modified';
    
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      if (diffHours === 0) {
        const diffMins = Math.floor(diffMs / (1000 * 60));
        if (diffMins < 1) return 'Just now';
        return `${diffMins} min${diffMins !== 1 ? 's' : ''} ago`;
      }
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString(undefined, { 
        month: 'short', 
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
      });
    }
  }

  /**
   * Escape HTML to prevent XSS
   * @private
   * @param {string} str - String to escape
   * @returns {string} Escaped string
   */
  _escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // ============================================================================
  // EVENT HANDLING
  // ============================================================================

  /**
   * Handle clicks within the modal
   * @private
   * @param {Event} e - Click event
   */
  _handleModalClick(e) {
    const action = e.target.closest('[data-action]')?.dataset.action;
    const boardId = e.target.closest('[data-board-id]')?.dataset.boardId;

    if (!action) return;

    switch (action) {
      case 'close':
        this.close();
        break;
      case 'new-board':
        this._handleNewBoard();
        break;
      case 'import-board':
        this._handleImportBoard();
        break;
      case 'load':
        if (boardId) this._handleLoadBoard(boardId);
        break;
      case 'duplicate':
        if (boardId) this._handleDuplicateBoard(boardId);
        break;
      case 'export':
        if (boardId) this._handleExportBoard(boardId);
        break;
      case 'edit':
        if (boardId) this._handleEditBoard(boardId);
        break;
      case 'delete':
        if (boardId) this._handleDeleteBoard(boardId);
        break;
    }
  }

  /**
   * Handle creating a new board
   * @private
   */
  async _handleNewBoard() {
    if (!this.boardManager.canCreateBoard()) {
      this._showToast('Board limit reached. Upgrade your membership for more boards.', 'warning');
      return;
    }

    const title = prompt('Enter board name:', 'Untitled Board');
    if (title === null) return; // Cancelled

    const boardId = this.boardManager.createBoard(title.trim() || 'Untitled Board');
    if (boardId) {
      // Load the new board
      this.boardManager.loadBoard(boardId);
      
      // Trigger callback
      if (this.onBoardCreate) {
        this.onBoardCreate(boardId);
      }
      
      this._showToast(`Created "${title}"`, 'success');
      this.close();
    } else {
      this._showToast('Failed to create board', 'error');
    }
  }

  /**
   * Handle importing a board
   * @private
   */
  async _handleImportBoard() {
    if (!this.boardManager.canCreateBoard()) {
      this._showToast('Board limit reached. Upgrade your membership for more boards.', 'warning');
      return;
    }

    try {
      const boardId = await this.boardManager.importBoardFromFile();
      if (boardId) {
        this._render();
        this._showToast('Board imported successfully', 'success');
      }
    } catch (err) {
      this._showToast('Failed to import board: ' + err.message, 'error');
    }
  }

  /**
   * Handle loading a board
   * @private
   * @param {string} boardId - Board ID to load
   */
  _handleLoadBoard(boardId) {
    // Save current board first
    if (this.appState.meta?.id) {
      this.boardManager.saveBoard();
    }

    // Load the selected board
    if (this.boardManager.loadBoard(boardId)) {
      // Trigger callback
      if (this.onBoardLoad) {
        this.onBoardLoad(boardId);
      }
      
      this._showToast('Board loaded', 'success');
      this.close();
    } else {
      this._showToast('Failed to load board', 'error');
    }
  }

  /**
   * Handle duplicating a board
   * @private
   * @param {string} boardId - Board ID to duplicate
   */
  _handleDuplicateBoard(boardId) {
    if (!this.boardManager.canCreateBoard()) {
      this._showToast('Board limit reached. Upgrade your membership for more boards.', 'warning');
      return;
    }

    const board = this.boardManager.getBoardMeta(boardId);
    const newTitle = prompt('Enter name for duplicate:', `${board.title} (Copy)`);
    if (newTitle === null) return; // Cancelled

    const newBoardId = this.boardManager.duplicateBoard(boardId, newTitle.trim());
    if (newBoardId) {
      this._render();
      this._showToast('Board duplicated', 'success');
    } else {
      this._showToast('Failed to duplicate board', 'error');
    }
  }

  /**
   * Handle exporting a board
   * @private
   * @param {string} boardId - Board ID to export
   */
  _handleExportBoard(boardId) {
    this.boardManager.exportBoard(boardId);
    this._showToast('Board exported', 'success');
  }

  /**
   * Handle editing board info
   * @private
   * @param {string} boardId - Board ID to edit
   */
  _handleEditBoard(boardId) {
    const board = this.boardManager.getBoardMeta(boardId);
    if (!board) return;

    const newTitle = prompt('Board name:', board.title);
    if (newTitle === null) return; // Cancelled

    const newDescription = prompt('Board description:', board.description || '');
    if (newDescription === null) return; // Cancelled

    this.boardManager.updateBoardMeta(boardId, {
      title: newTitle.trim() || board.title,
      description: newDescription.trim()
    });

    this._render();
    this._showToast('Board updated', 'success');
  }

  /**
   * Handle deleting a board
   * @private
   * @param {string} boardId - Board ID to delete
   */
  _handleDeleteBoard(boardId) {
    const board = this.boardManager.getBoardMeta(boardId);
    if (!board) return;

    if (!confirm(`Are you sure you want to delete "${board.title}"?\n\nThis action cannot be undone.`)) {
      return;
    }

    if (this.boardManager.deleteBoard(boardId)) {
      this._render();
      this._showToast('Board deleted', 'success');
    } else {
      this._showToast('Failed to delete board', 'error');
    }
  }

  /**
   * Show a toast notification
   * @private
   * @param {string} message - Toast message
   * @param {string} type - Toast type (success, error, warning, info)
   */
  _showToast(message, type = 'info') {
    // Use SystemMenuManager's toast if available, otherwise create our own
    if (window.systemMenuManager && typeof window.systemMenuManager.showToast === 'function') {
      window.systemMenuManager.showToast(message, type);
      return;
    }

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => toast.classList.add('show'), 100);
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }
}

// ============================================================================
// GLOBAL EXPORT
// ============================================================================

window.BoardPickerUI = BoardPickerUI;

