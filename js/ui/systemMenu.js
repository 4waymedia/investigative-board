// System Menu Manager
// Handles the app logo, file menu, and app info modal

class SystemMenuManager {
  constructor(appState) {
    this.appState = appState;

    // Get references to system menu elements
    this.systemMenu = document.getElementById("system-menu");
    this.appLogo = document.getElementById("app-logo");
    this.fileMenu = document.getElementById("file-menu");

    // App info modal elements
    this.appInfoModal = document.getElementById("app-info-modal");
    this.appInfoModalBackdrop = document.getElementById("app-info-modal-backdrop");
    this.appInfoModalClose = document.getElementById("app-info-modal-close");

    // File menu dropdown state
    this.fileMenuDropdown = null;
    this.isFileMenuOpen = false;

    // References to managers (set during initialize)
    this.boardManager = null;
    this.boardPickerUI = null;
    this.app = null;

    // Get references to global functions
    this.saveAppState = null;
    this.loadFromFile = null;
    this.exportData = null;
    this.importData = null;
  }

  // Initialize the system menu
  initialize(dependencies) {
    this.saveAppState = dependencies.saveAppState;
    this.loadFromFile = dependencies.loadFromFile;
    this.exportData = dependencies.exportData;
    this.importData = dependencies.importData;
    this.boardManager = dependencies.boardManager;
    this.boardPickerUI = dependencies.boardPickerUI;
    this.app = dependencies.app;

    // Set up event handlers
    this.setupEventHandlers();
    this.setupAppInfoModal();
  }

  // Set up event handlers for the system menu
  setupEventHandlers() {
    // App logo click - show app info modal
    if (this.appLogo) {
      this.appLogo.addEventListener("click", () => {
        this.showAppInfoModal();
      });
    }

    // File menu click - toggle dropdown
    if (this.fileMenu) {
      this.fileMenu.addEventListener("click", (e) => {
        e.stopPropagation();
        this.toggleFileMenu();
      });
    }

    // Close dropdown when clicking elsewhere
    document.addEventListener("click", (e) => {
      if (this.isFileMenuOpen && !this.fileMenu.contains(e.target)) {
        this.closeFileMenu();
      }
    });

    // Close modal on escape key
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        this.closeAppInfoModal();
        this.closeFileMenu();
      }
    });
  }

  // Set up app info modal event handlers
  setupAppInfoModal() {
    if (this.appInfoModalClose) {
      this.appInfoModalClose.addEventListener("click", () => {
        this.closeAppInfoModal();
      });
    }

    if (this.appInfoModalBackdrop) {
      this.appInfoModalBackdrop.addEventListener("click", (e) => {
        if (e.target === this.appInfoModalBackdrop) {
          this.closeAppInfoModal();
        }
      });
    }
  }

  // Show app info modal
  showAppInfoModal() {
    if (this.appInfoModal && this.appInfoModalBackdrop) {
      this.appInfoModal.style.display = "block";
      this.appInfoModalBackdrop.style.display = "flex";
    }
  }

  // Close app info modal
  closeAppInfoModal() {
    if (this.appInfoModal && this.appInfoModalBackdrop) {
      this.appInfoModal.style.display = "none";
      this.appInfoModalBackdrop.style.display = "none";
    }
  }

  // Toggle file menu dropdown
  toggleFileMenu() {
    if (this.isFileMenuOpen) {
      this.closeFileMenu();
    } else {
      this.openFileMenu();
    }
  }

  // Open file menu dropdown
  openFileMenu() {
    if (this.isFileMenuOpen) return;

    this.closeFileMenu(); // Close any existing dropdown

    // Create dropdown element
    this.fileMenuDropdown = document.createElement("div");
    this.fileMenuDropdown.className = "file-menu-dropdown";
    this.fileMenuDropdown.innerHTML = this.getFileMenuHTML();

    // Position the dropdown
    const rect = this.fileMenu.getBoundingClientRect();
    this.fileMenuDropdown.style.position = "absolute";
    this.fileMenuDropdown.style.left = `${rect.left}px`;
    this.fileMenuDropdown.style.top = `${rect.bottom + 5}px`;
    this.fileMenuDropdown.style.zIndex = "10000";

    // Add to document
    document.body.appendChild(this.fileMenuDropdown);

    // Set up dropdown event handlers
    this.setupFileMenuEventHandlers();

    this.isFileMenuOpen = true;
    this.fileMenu.classList.add("active");
  }

  // Close file menu dropdown
  closeFileMenu() {
    if (this.fileMenuDropdown) {
      this.fileMenuDropdown.remove();
      this.fileMenuDropdown = null;
    }
    this.isFileMenuOpen = false;
    if (this.fileMenu) {
      this.fileMenu.classList.remove("active");
    }
  }

  // Get HTML for file menu dropdown
  getFileMenuHTML() {
    const boardTitle = this.appState?.meta?.title || 'Untitled Board';
    const canCreateBoard = this.boardManager?.canCreateBoard() ?? true;
    
    return `
      <div class="file-menu-section">
        <div class="file-menu-board-info">
          <span class="file-menu-board-icon">📋</span>
          <span class="file-menu-board-title">${this._escapeHtml(boardTitle)}</span>
        </div>
      </div>
      <div class="file-menu-separator"></div>
      <div class="file-menu-section">
        <div class="file-menu-item ${!canCreateBoard ? 'file-menu-item-disabled' : ''}" data-action="new-board" ${!canCreateBoard ? 'title="Board limit reached"' : ''}>
          <span class="file-menu-icon">➕</span>
          <span class="file-menu-label">New Board</span>
        </div>
        <div class="file-menu-item" data-action="open-boards">
          <span class="file-menu-icon">📂</span>
          <span class="file-menu-label">Open Board...</span>
        </div>
        <div class="file-menu-item" data-action="save">
          <span class="file-menu-icon">💾</span>
          <span class="file-menu-label">Save</span>
        </div>
        <div class="file-menu-item" data-action="close-board">
          <span class="file-menu-icon">✖️</span>
          <span class="file-menu-label">Close Board</span>
        </div>
        <div class="file-menu-item" data-action="clear-board" style="color: #f85149;">
          <span class="file-menu-icon">🗑️</span>
          <span class="file-menu-label">Clear Board...</span>
        </div>
      </div>
      <div class="file-menu-separator"></div>
      <div class="file-menu-section">
        <div class="file-menu-header">Import / Export</div>
        <div class="file-menu-item" data-action="export">
          <span class="file-menu-icon">📤</span>
          <span class="file-menu-label">Export Board...</span>
        </div>
        <div class="file-menu-item ${!canCreateBoard ? 'file-menu-item-disabled' : ''}" data-action="import" ${!canCreateBoard ? 'title="Board limit reached"' : ''}>
          <span class="file-menu-icon">📥</span>
          <span class="file-menu-label">Import Board...</span>
        </div>
      </div>
      <div class="file-menu-separator"></div>
      <div class="file-menu-section">
        <div class="file-menu-header">Load</div>
        <div class="file-menu-item" data-action="load-shapes">
          <span class="file-menu-icon">🔷</span>
          <span class="file-menu-label">Shapes</span>
        </div>
        <div class="file-menu-item" data-action="load-assets">
          <span class="file-menu-icon">🖼️</span>
          <span class="file-menu-label">Assets</span>
        </div>
      </div>
      <div class="file-menu-separator"></div>
      <div class="file-menu-section">
        <div class="file-menu-header">Themes</div>
        <div class="file-menu-item" data-action="theme-builder">
          <span class="file-menu-icon">🎨</span>
          <span class="file-menu-label">Theme Builder</span>
        </div>
        <div class="file-menu-item" data-action="theme-export">
          <span class="file-menu-icon">📤</span>
          <span class="file-menu-label">Export Theme...</span>
        </div>
        <div class="file-menu-item" data-action="theme-import">
          <span class="file-menu-icon">📥</span>
          <span class="file-menu-label">Import Theme...</span>
        </div>
      </div>
      <div class="file-menu-separator"></div>
      <div class="file-menu-section">
        <div class="file-menu-header">Settings</div>
        <div class="file-menu-item" data-action="keyboard-shortcuts">
          <span class="file-menu-icon">⌨️</span>
          <span class="file-menu-label">Keyboard Shortcuts</span>
        </div>
      </div>
      <div class="file-menu-separator"></div>
      <div class="file-menu-section">
        <div class="file-menu-header">Help</div>
        <div class="file-menu-item" data-action="help-instructions">
          <span class="file-menu-icon">📖</span>
          <span class="file-menu-label">Instructions</span>
        </div>
        <div class="file-menu-item" data-action="help-mapping">
          <span class="file-menu-icon">🗺️</span>
          <span class="file-menu-label">Mapping</span>
        </div>
        <div class="file-menu-item" data-action="help-data">
          <span class="file-menu-icon">📊</span>
          <span class="file-menu-label">Data</span>
        </div>
      </div>
      <div class="file-menu-separator"></div>
      <div class="file-menu-section">
        <div class="file-menu-item" data-action="print">
          <span class="file-menu-icon">🖨️</span>
          <span class="file-menu-label">Print</span>
        </div>
      </div>
    `;
  }

  // Escape HTML to prevent XSS
  _escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // Set up event handlers for file menu items
  setupFileMenuEventHandlers() {
    if (!this.fileMenuDropdown) return;

    this.fileMenuDropdown.addEventListener("click", (e) => {
      const menuItem = e.target.closest(".file-menu-item");
      if (!menuItem) return;

      const action = menuItem.dataset.action;
      this.handleFileMenuAction(action);
      this.closeFileMenu();
    });
  }

  // Handle file menu actions
  handleFileMenuAction(action) {
    switch (action) {
      case "new-board":
        this.handleNewBoard();
        break;
      case "open-boards":
        this.handleOpenBoards();
        break;
      case "save":
        this.handleSave();
        break;
      case "close-board":
        this.handleCloseBoard();
        break;
      case "clear-board":
        this.handleClearBoard();
        break;
      case "export":
        this.handleExport();
        break;
      case "import":
        this.handleImport();
        break;
      case "load-shapes":
        this.handleLoadShapes();
        break;
      case "load-assets":
        this.handleLoadAssets();
        break;
      case "theme-builder":
        this.handleThemeBuilder();
        break;
      case "theme-export":
        this.handleThemeExport();
        break;
      case "theme-import":
        this.handleThemeImport();
        break;
      case "keyboard-shortcuts":
        this.handleKeyboardShortcuts();
        break;
      case "help-instructions":
        this.handleHelpInstructions();
        break;
      case "help-mapping":
        this.handleHelpMapping();
        break;
      case "help-data":
        this.handleHelpData();
        break;
      case "print":
        this.handlePrint();
        break;
      default:
        console.warn(`Unknown file menu action: ${action}`);
    }
  }

  // File menu action handlers
  
  handleNewBoard() {
    if (!this.boardManager) {
      this.showToast("Board manager not available", "error");
      return;
    }

    if (!this.boardManager.canCreateBoard()) {
      this.showToast("Board limit reached. Upgrade your membership for more boards.", "warning");
      return;
    }

    // Open new board modal
    if (window.openNewBoardModal) {
      window.openNewBoardModal((boardData) => {
        // Save current board first
        if (this.appState.meta?.id) {
          this.boardManager.saveBoard();
        }

        const boardId = this.boardManager.createBoard(boardData.name, boardData.description);
        if (boardId) {
          this.boardManager.loadBoard(boardId);
          this.appState.meta.description = boardData.description;
          
          // Apply selected theme
          if (window.schemaManager) {
            window.schemaManager.setTheme(boardData.themeId, false);
          }
          
          this._notifyBoardChange();
          this.showToast(`Created "${boardData.name}"`, "success");
        } else {
          this.showToast("Failed to create board", "error");
        }
      });
    } else {
      // Fallback to prompt
      const title = prompt("Enter board name:", "Untitled Board");
      if (title === null) return;

      if (this.appState.meta?.id) {
        this.boardManager.saveBoard();
      }

      const boardId = this.boardManager.createBoard(title.trim() || "Untitled Board");
      if (boardId) {
        this.boardManager.loadBoard(boardId);
        this._notifyBoardChange();
        this.showToast(`Created "${title}"`, "success");
      } else {
        this.showToast("Failed to create board", "error");
      }
    }
  }

  handleOpenBoards() {
    if (this.boardPickerUI) {
      this.boardPickerUI.open();
    } else {
      this.showToast("Board picker not available", "error");
    }
  }

  handleSave() {
    if (this.boardManager && this.appState.meta?.id) {
      this.boardManager.saveBoard();
      this.showToast("Board saved successfully!", "success");
    } else if (this.saveAppState) {
      this.saveAppState(this.appState);
      this.showToast("Board saved successfully!", "success");
    } else {
      this.showToast("Save functionality not available", "error");
    }
  }

  handleCloseBoard() {
    if (!this.boardManager) {
      this.showToast("Board manager not available", "error");
      return;
    }

    // Confirm if there's an active board
    if (this.appState.meta?.id) {
      if (!confirm("Close the current board? Unsaved changes will be saved automatically.")) {
        return;
      }
      
      // Save before closing
      this.boardManager.saveBoard();
    }

    // Clear the board
    this.appState.clearBoard();
    this._notifyBoardChange();
    this.showToast("Board closed", "info");
  }

  handleClearBoard() {
    this.closeFileMenu();
    if (this.app && typeof this.app.resetBoard === 'function') {
      this.app.resetBoard();
    } else if (window.app && typeof window.app.resetBoard === 'function') {
      window.app.resetBoard();
    }
  }

  handleExport() {
    if (this.boardManager) {
      this.boardManager.exportBoard();
      this.showToast("Board exported successfully!", "success");
    } else if (this.exportData) {
      this.exportData();
      this.showToast("Data exported successfully!", "success");
    } else {
      this.showToast("Export functionality not available", "error");
    }
  }

  async handleImport() {
    if (!this.boardManager) {
      this.showToast("Board manager not available", "error");
      return;
    }

    if (!this.boardManager.canCreateBoard()) {
      this.showToast("Board limit reached. Upgrade your membership for more boards.", "warning");
      return;
    }

    try {
      const boardId = await this.boardManager.importBoardFromFile();
      if (boardId) {
        this.showToast("Board imported successfully!", "success");
        // Optionally load the imported board
        if (confirm("Load the imported board now?")) {
          this.boardManager.loadBoard(boardId);
          this._notifyBoardChange();
        }
      }
    } catch (err) {
      this.showToast("Failed to import board: " + err.message, "error");
    }
  }

  handleLoadShapes() {
    this.showToast("Load Shapes - Feature coming soon!", "info");
  }

  handleLoadAssets() {
    this.showToast("Load Assets - Feature coming soon!", "info");
  }

  // Notify the application that the board has changed
  _notifyBoardChange() {
    // Sync global variables
    if (this.app && this.app.syncGlobalVariables) {
      this.app.syncGlobalVariables();
    }
    
    // Trigger redraw
    if (this.app && this.app.render) {
      this.app.render();
    }
    
    // Re-render tray with cards
    if (this.app && this.app.trayManager) {
      this.app.trayManager.render();
    }
  }

  handleThemeBuilder() {
    if (window.openThemeBuilderModal) {
      window.openThemeBuilderModal();
    } else {
      this.showToast("Theme builder not available", "error");
    }
  }

  handleThemeExport() {
    if (!window.schemaManager) {
      this.showToast("Schema manager not available", "error");
      return;
    }
    
    const currentTheme = window.schemaManager.currentTheme;
    const json = window.schemaManager.exportTheme(currentTheme.id);
    
    if (json) {
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `theme-${currentTheme.id}.json`;
      a.click();
      URL.revokeObjectURL(url);
      this.showToast(`Exported "${currentTheme.name}"`, "success");
    }
  }

  async handleThemeImport() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      
      try {
        const text = await file.text();
        const themeId = window.schemaManager.importTheme(text);
        
        if (themeId) {
          this.showToast("Theme imported successfully!", "success");
          // Optionally open theme builder to show it
          if (window.openThemeBuilderModal) {
            window.openThemeBuilderModal();
          }
        } else {
          this.showToast("Failed to import theme", "error");
        }
      } catch (err) {
        this.showToast("Failed to read theme file: " + err.message, "error");
      }
    };
    
    input.click();
  }

  handleKeyboardShortcuts() {
    if (window.openKeyboardShortcutsModal) {
      window.openKeyboardShortcutsModal();
    } else {
      this.showToast("Keyboard shortcuts panel not available", "error");
    }
  }

  handleHelpInstructions() {
    this.showToast("Help: Instructions - Feature coming soon!", "info");
  }

  handleHelpMapping() {
    this.showToast("Help: Mapping - Feature coming soon!", "info");
  }

  handleHelpData() {
    this.showToast("Help: Data - Feature coming soon!", "info");
  }

  handlePrint() {
    window.print();
    this.showToast("Print dialog opened", "info");
  }

  // Show toast notification
  showToast(message, type = "info") {
    // Create toast element
    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    toast.textContent = message;

    // Add to document
    document.body.appendChild(toast);

    // Show toast
    setTimeout(() => toast.classList.add("show"), 100);

    // Hide and remove toast after 3 seconds
    setTimeout(() => {
      toast.classList.remove("show");
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }
}

// Export for global access
window.SystemMenuManager = SystemMenuManager;
