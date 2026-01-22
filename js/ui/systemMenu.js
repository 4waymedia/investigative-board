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
    return `
      <div class="file-menu-section">
        <div class="file-menu-item" data-action="save">
          <span class="file-menu-icon">💾</span>
          <span class="file-menu-label">Save</span>
        </div>
      </div>
      <div class="file-menu-separator"></div>
      <div class="file-menu-section">
        <div class="file-menu-header">Data</div>
        <div class="file-menu-item" data-action="export">
          <span class="file-menu-icon">📤</span>
          <span class="file-menu-label">Export</span>
        </div>
        <div class="file-menu-item" data-action="import">
          <span class="file-menu-icon">📥</span>
          <span class="file-menu-label">Import</span>
        </div>
      </div>
      <div class="file-menu-separator"></div>
      <div class="file-menu-section">
        <div class="file-menu-header">Load</div>
        <div class="file-menu-item" data-action="load-shapes">
          <span class="file-menu-icon">🔷</span>
          <span class="file-menu-label">Shapes</span>
        </div>
        <div class="file-menu-item" data-action="load-board">
          <span class="file-menu-icon">📋</span>
          <span class="file-menu-label">Board</span>
        </div>
        <div class="file-menu-item" data-action="load-assets">
          <span class="file-menu-icon">🖼️</span>
          <span class="file-menu-label">Assets</span>
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
      case "save":
        this.handleSave();
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
      case "load-board":
        this.handleLoadBoard();
        break;
      case "load-assets":
        this.handleLoadAssets();
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
  handleSave() {
    if (this.saveAppState) {
      this.saveAppState(this.appState);
      this.showToast("Board saved successfully!", "success");
    } else {
      this.showToast("Save functionality not available", "error");
    }
  }

  handleExport() {
    if (this.exportData) {
      this.exportData();
      this.showToast("Data exported successfully!", "success");
    } else {
      this.showToast("Export functionality not implemented yet", "info");
    }
  }

  handleImport() {
    if (this.importData) {
      this.importData();
      this.showToast("Import functionality not implemented yet", "info");
    } else {
      this.showToast("Import functionality not implemented yet", "info");
    }
  }

  handleLoadShapes() {
    this.showToast("Load Shapes - Feature coming soon!", "info");
  }

  handleLoadBoard() {
    if (this.loadFromFile) {
      this.loadFromFile();
    } else {
      this.showToast("Load Board functionality not available", "error");
    }
  }

  handleLoadAssets() {
    this.showToast("Load Assets - Feature coming soon!", "info");
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
