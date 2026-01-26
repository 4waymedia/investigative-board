// Toolbar Module
// Handles the top menu bar with tools, colors, and type selection

class ToolbarManager {
  constructor(appState, config = {}) {
    this.appState = appState;
    this.menu = document.getElementById("menu");
    this.toolset = document.getElementById("toolset");

    // Configuration data (dependency injection)
    this.nodeTypes = config.nodeTypes || [];
    this.defaultColors = config.defaultColors || [];
    this.themes = config.themes || [{ id: "default", name: "Default" }];
    this.families = config.families || [
      { id: "pin", name: "Pin", defaultIcon: "●" },
      { id: "card", name: "Card", defaultIcon: "▤" },
      { id: "area", name: "Area", defaultIcon: "⭕" },
    ];

    // Tool configurations
    this.mainTools = config.mainTools || [
      { id: "pan", label: "Move", icon: "🖐", key: "M" },
      { id: "select", label: "Select", icon: "🔳", key: "S" },
    ];

    // Family tool IDs for configuration-driven logic
    this.familyToolIds = new Set(this.families.map(f => f.id));

    // Initialize system menu manager
    this.systemMenuManager = new SystemMenuManager(appState);

    // Get references to global functions
    this.draw = null;
    this.saveAppState = null;
    this.openAddColorModal = null;
    this.loadFromFile = null;
    this.exportData = null;
    this.importData = null;
  }

  // Initialize toolbar
  initialize(dependencies) {
    this.draw = dependencies.draw;
    this.saveAppState = dependencies.saveAppState;
    this.openAddColorModal = dependencies.openAddColorModal;
    this.loadFromFile = dependencies.loadFromFile;
    this.exportData = dependencies.exportData;
    this.importData = dependencies.importData;

    // Ensure appState has safe defaults
    this.initializeAppState();

    // Create separate containers for different sections
    this.createContainers();

    // Initialize system menu manager
    this.systemMenuManager.initialize({
      saveAppState: this.saveAppState,
      loadFromFile: this.loadFromFile,
      exportData: this.exportData,
      importData: this.importData,
    });

    // Note: Initial render is handled by app.js to avoid duplicate renders
  }

  // Ensure appState has safe defaults to prevent undefined errors
  initializeAppState() {
    // Initialize nested state objects
    this.appState.selectedTypeByFamily = this.appState.selectedTypeByFamily || {};

    // Set safe defaults for required properties
    this.appState.currentTool = this.appState.currentTool || "pin";
    this.appState.currentFamily = this.appState.currentFamily || "pin";
    this.appState.currentTypeId = this.appState.currentTypeId || null;
    this.appState.selectedColor = this.appState.selectedColor || (this.defaultColors[0]?.value || "#000000");
    this.appState.connectionType = this.appState.connectionType || "curved";
    this.appState.currentThemeId = this.appState.currentThemeId || "default";

    // Ensure each family has a default selection
    this.families.forEach(family => {
      if (this.appState.selectedTypeByFamily[family.id] === undefined) {
        this.appState.selectedTypeByFamily[family.id] = 0;
      }
    });
  }

  // Create separate containers for different sections
  createContainers() {
    // Create containers for different sections to enable targeted updates
    this.toolsContainer = document.createElement("div");
    this.toolsContainer.className = "toolbar-section tools-section";
    this.toolsContainer.id = "tools-container";

    this.typesContainer = document.createElement("div");
    this.typesContainer.className = "toolbar-section types-section";
    this.typesContainer.id = "types-container";

    this.colorsContainer = document.createElement("div");
    this.colorsContainer.className = "toolbar-section colors-section";
    this.colorsContainer.id = "colors-container";

    this.controlsContainer = document.createElement("div");
    this.controlsContainer.className = "toolbar-section controls-section";
    this.controlsContainer.id = "controls-container";

    // Append containers to menu
    this.menu.appendChild(this.toolset);
    this.menu.appendChild(this.typesContainer);
    this.menu.appendChild(this.colorsContainer);
    this.menu.appendChild(this.controlsContainer);
  }

  // Main render function - clears and rebuilds toolbar to prevent duplicates
  render() {
    if (!this.menu || !this.toolset) {
      return;
    }

    // If containers don't exist yet, create them
    if (!this.typesContainer) {
      this.createContainers();
    }

    // Clear only the dynamic sections, preserve system menu
    const systemMenu = document.getElementById('system-menu');
    const toolset = document.getElementById('toolset');

    // Remove existing dynamic containers if they exist
    if (this.typesContainer && this.typesContainer.parentNode) {
      this.typesContainer.parentNode.removeChild(this.typesContainer);
    }
    if (this.colorsContainer && this.colorsContainer.parentNode) {
      this.colorsContainer.parentNode.removeChild(this.colorsContainer);
    }
    if (this.controlsContainer && this.controlsContainer.parentNode) {
      this.controlsContainer.parentNode.removeChild(this.controlsContainer);
    }

    // Ensure system menu and toolset exist in the menu
    if (systemMenu && !systemMenu.parentNode) {
      this.menu.appendChild(systemMenu);
    }
    if (toolset && !toolset.parentNode) {
      this.menu.appendChild(toolset);
    }

    // Add the dynamic containers
    this.menu.appendChild(this.typesContainer);
    this.menu.appendChild(this.colorsContainer);
    this.menu.appendChild(this.controlsContainer);

    // Render each section
    this.renderTools();
    this.renderTypeGroups();
    this.renderColorPalette();
    this.renderControls();
  }

  // Render controls section (connection toggle + theme selector)
  renderControls() {
    this.controlsContainer.innerHTML = "";
    this.renderConnectionTypeToggle();
    this.renderThemeSelector();
    this.setupControlsEventDelegation();
  }

  // Render the tool buttons
  renderTools() {
    if (!this.toolset) {
      console.warn('⚠️ renderTools: toolset element not found');
      return;
    }
    
    this.toolset.innerHTML = "";

    this.mainTools.forEach((tool) => {
      const btn = document.createElement("div");
      btn.className = `tool-btn ${this.appState.currentTool === tool.id ? "active" : ""}`;

      // Key change: Store the ID in the DOM itself for event delegation
      btn.dataset.toolAction = tool.id;

      btn.innerHTML = `
        <span class="icon">${tool.icon}</span>
        <span>${tool.label}</span>
        <span class="key">${tool.key}</span>
      `;
      this.toolset.appendChild(btn);
    });

    // Functional Separator
    const separator = document.createElement("div");
    separator.className = "tool-separator";
    this.toolset.appendChild(separator);

    // Example of adding specialized action buttons (like Load)
    this.createActionButton("📁", "Load");

    // Attach a single listener to the parent (using addEventListener for reliability)
    // Remove existing listener first to prevent duplicates
    this.toolset.removeEventListener('click', this._toolsetClickHandler);
    this._toolsetClickHandler = (e) => this.handleToolbarClick(e);
    this.toolset.addEventListener('click', this._toolsetClickHandler);
    
    console.log(`🔧 renderTools: ${this.mainTools.length} tools rendered, click handler attached`);
  }

  // Helper method to keep renderTools clean
  createActionButton(icon, label) {
    const btn = document.createElement("div");
    btn.className = "tool-btn";
    btn.dataset.specialAction = "load"; // Use consistent naming
    btn.innerHTML = `<span class="icon">${icon}</span><span>${label}</span>`;
    this.toolset.appendChild(btn);
  }

  // The Centralized Click Handler - replaces dozens of individual functions
  handleToolbarClick(e) {
    // Find the button element, even if the user clicked an icon inside it
    const btn = e.target.closest(".tool-btn");
    if (!btn) return;

    const toolId = btn.dataset.toolAction;
    console.log(`🖱️ Toolbar click: toolId=${toolId}, btn=`, btn);

    if (toolId) {
      this.setTool(toolId);
    } else if (btn.dataset.specialAction === "load") {
      // Handle non-tool buttons here
      this.handleLoadAction();
    }
  }

  // Update active tool UI without full re-render
  updateActiveToolUI(toolId) {
    this.toolset.querySelectorAll('.tool-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.toolAction === toolId);
    });
    console.log(`🔧 Tool activated: ${toolId}`);
  }

  // Handle load action
  handleLoadAction() {
    // Open load modal
    if (window.app && window.app.modalManager) {
      // For now, just show an alert
      alert("Load functionality - modal not implemented yet");
    }
  }

  // Set the current tool
  setTool(toolId) {
    console.log(`🔧 setTool called with: ${toolId}, previous: ${this.appState.currentTool}`);
    this.appState.currentTool = toolId;

    // Check if the selected tool corresponds to a known node family
    const isFamilyTool = this.nodeTypes?.some(t => t.family === toolId);

    if (isFamilyTool) {
      this.appState.currentFamily = toolId;

      // Ensure nested state objects exist
      this.appState.selectedTypeByFamily = this.appState.selectedTypeByFamily || {};

      // Default to the first type (index 0) if none is selected for this family
      if (this.appState.selectedTypeByFamily[toolId] === undefined) {
        this.appState.selectedTypeByFamily[toolId] = 0;
      }

      this.updateCurrentTypeId();
    }

    // Only update UI components that need to change
    this.updateActiveToolUI(toolId);
    this.updateTypeGroupsUI();
  }

  // Reset the canvas view to show all pins
  resetView() {
    if (!window.app || !window.app.appState) {
      return;
    }

    // Reset transforms to default
    window.app.appState.offsetX = 0;
    window.app.appState.offsetY = 0;
    window.app.appState.scale = 1;

    // Trigger render
    if (window.app.render) {
      window.app.render();
    }
  }

  // Render type selection bar
  renderTypeBar() {
    const typeBar = document.createElement("div");
    typeBar.className = "type-bar";

    // Get current family types
    const family = this.appState.currentFamily || "pin";
    const types = this.nodeTypes.filter((t) => t.family === family);

    types.forEach((type, index) => {
      const typeBtn = document.createElement("div");
      typeBtn.className =
        "type-menu-item" +
        (index === this.appState.selectedTypeByFamily?.[family]
          ? " active"
          : "");
      typeBtn.innerHTML = `<div class="icon">${type.icon}</div>`;
      typeBtn.onclick = () => {
        this.appState.selectedTypeByFamily =
          this.appState.selectedTypeByFamily || {};
        this.appState.selectedTypeByFamily[family] = index;
        this.updateCurrentTypeId();
        this.render();
      };
      typeBar.appendChild(typeBtn);
    });

    return typeBar;
  }

  // Render type groups (original prototype structure)
  renderTypeGroups() {
    this.typesContainer.innerHTML = "";
    const typeBar = document.createElement("div");
    typeBar.className = "type-bar";

    this.families.forEach((family) => {
      const typeGroup = document.createElement("div");
      typeGroup.className = "type-group";
      typeGroup.dataset.familyId = family.id;

      // Get current type for this family
      const types = this.nodeTypes.filter((t) => t.family === family.id);
      const selectedIndex =
        (this.appState.selectedTypeByFamily &&
          this.appState.selectedTypeByFamily[family.id]) ||
        0;
      const currentType = types[selectedIndex] || {
        icon: family.defaultIcon,
        label: family.name,
      };

      // Create type option (shows current selection)
      const typeOption = document.createElement("div");
      typeOption.className = "type-option";
      typeOption.dataset.familyId = family.id;
      if (this.appState.currentFamily === family.id) {
        typeOption.classList.add("active");
      }
      typeOption.innerHTML = `
        <div class="type-option-icon">${currentType.icon}</div>
        <div class="label">${currentType.label || family.name}</div>
      `;

      // Create dropdown caret
      const caret = document.createElement("button");
      caret.className = "type-caret";
      caret.dataset.familyId = family.id;
      caret.innerHTML = "▾";

      typeGroup.appendChild(typeOption);
      typeGroup.appendChild(caret);
      typeBar.appendChild(typeGroup);
    });

    this.typesContainer.appendChild(typeBar);

    // Set up event delegation for type groups
    this.setupTypeEventDelegation();
  }

  // Set up event delegation for type groups
  setupTypeEventDelegation() {
    // Remove existing listener if any
    if (this.typesContainer._typesListener) {
      this.typesContainer.removeEventListener("click", this.typesContainer._typesListener);
    }

    this.typesContainer._typesListener = (e) => {
      const target = e.target.closest(".type-option, .type-caret");
      if (!target) return;

      e.stopPropagation();
      const familyId = target.dataset.familyId;

      if (target.classList.contains("type-option")) {
        // Type option clicked - select family and tool
        this.appState.currentTool = familyId;
        this.appState.currentFamily = familyId;
        this.updateCurrentTypeId();
        this.updateActiveToolUI(familyId);
        this.updateTypeGroupsUI();
      } else if (target.classList.contains("type-caret")) {
        // Caret clicked - show dropdown
        const types = this.nodeTypes.filter((t) => t.family === familyId);
        this.showTypeDropdown(familyId, target, types);
      }
    };

    this.typesContainer.addEventListener("click", this.typesContainer._typesListener);
  }

  // Update type groups UI without full re-render
  updateTypeGroupsUI() {
    this.families.forEach((family) => {
      const typeOption = this.typesContainer.querySelector(`.type-option[data-family-id="${family.id}"]`);
      if (typeOption) {
        // Update active state
        typeOption.classList.toggle("active", this.appState.currentFamily === family.id);
        
        // Update the icon and label to reflect current type selection
        const types = this.nodeTypes.filter((t) => t.family === family.id);
        const selectedIndex = (this.appState.selectedTypeByFamily && 
          this.appState.selectedTypeByFamily[family.id]) || 0;
        const currentType = types[selectedIndex] || { icon: family.defaultIcon, label: family.name };
        
        const iconEl = typeOption.querySelector('.type-option-icon');
        const labelEl = typeOption.querySelector('.label');
        if (iconEl) iconEl.textContent = currentType.icon;
        if (labelEl) labelEl.textContent = currentType.label || family.name;
      }
    });
  }

  // Show dropdown for type selection
  showTypeDropdown(familyId, caretElement, types) {
    this.removeExistingDropdown();

    const dropdown = document.createElement("div");
    dropdown.className = "type-dropdown";
    dropdown.style.cssText = `position: absolute; left: ${caretElement.getBoundingClientRect().left}px; top: ${caretElement.getBoundingClientRect().bottom + 5}px; z-index: 1000;`;

    // Build HTML string for efficiency, using data-index
    dropdown.innerHTML = types.map((type, index) => `
      <div class="type-dropdown-option" data-index="${index}">
        <span class="icon">${type.icon}</span>
        <span>${type.label}</span>
      </div>
    `).join('');

    // Single listener for all options
    dropdown.onclick = (e) => {
      const option = e.target.closest(".type-dropdown-option");
      if (!option) return;

      const index = parseInt(option.dataset.index);
      this.appState.selectedTypeByFamily = this.appState.selectedTypeByFamily || {};
      this.appState.selectedTypeByFamily[familyId] = index;
      this.appState.currentFamily = familyId;
      this.appState.currentTool = familyId;

      this.updateCurrentTypeId();
      dropdown.remove();
      this.updateTypeGroupsUI();
      this.updateActiveToolUI(familyId);
    };

    document.body.appendChild(dropdown);

    // Use { once: true } for automatic cleanup of the document listener
    setTimeout(() => {
      document.addEventListener("click", (e) => {
        if (!dropdown.contains(e.target)) dropdown.remove();
      }, { once: true });
    }, 0);
  }

  // Helper method for dropdown cleanup
  removeExistingDropdown() {
    const existing = document.querySelector(".type-dropdown");
    if (existing) existing.remove();
  }

  // Render color palette
  renderColorPalette() {
    // Create a container specifically for delegation if it doesn't exist
    let colorContainer = this.colorsContainer.querySelector(".color-palette-container");
    if (!colorContainer) {
      colorContainer = document.createElement("div");
      colorContainer.className = "color-palette-container";
      this.colorsContainer.appendChild(colorContainer);
    }

    colorContainer.innerHTML = "";

    this.defaultColors.forEach((col) => {
      const el = document.createElement("div");
      el.className = "color-option" + (col.value === this.appState.selectedColor ? " active" : "");
      // Store the color value in a data attribute
      el.dataset.colorValue = col.value;
      el.innerHTML = `<div class="swatch" style="background:${col.value}"></div>`;
      colorContainer.appendChild(el);
    });

    // Add color button
    const add = document.createElement("div");
    add.className = "color-option add-color-option";
    add.dataset.action = "add-color";
    add.innerHTML = `<div class="add-btn">+</div>`;
    colorContainer.appendChild(add);

    // Delegate listener - replaces individual onclick handlers
    colorContainer.onclick = (e) => this.handleColorPaletteClick(e);
  }

  // Centralized color palette click handler
  handleColorPaletteClick(e) {
    const option = e.target.closest(".color-option");
    if (!option) return;

    const colorValue = option.dataset.colorValue;
    const action = option.dataset.action;

    if (colorValue) {
      this.selectColor(colorValue);
    } else if (action === "add-color") {
      this.handleAddColorAction();
    }
  }

  // Select a color and update UI
  selectColor(colorValue) {
    this.appState.selectedColor = colorValue;
    this.saveAppState(this.appState);
    this.updateActiveColorUI(colorValue);
    this.draw();
  }

  // Update the color palette with new colors (for theme changes)
  updateColorPalette(newColors) {
    this.defaultColors = newColors;
    this.renderColorPalette();
    console.log(`🔄 Toolbar color palette updated with ${newColors.length} colors`);
  }

  // Update active color UI without full re-render
  updateActiveColorUI(colorValue) {
    this.colorsContainer.querySelectorAll('.color-option').forEach(option => {
      option.classList.toggle('active', option.dataset.colorValue === colorValue);
    });
  }

  // Handle add color action
  handleAddColorAction() {
    if (this.openAddColorModal) {
      this.openAddColorModal();
    }
  }

  // Render connection type toggle
  renderConnectionTypeToggle() {
    const connTypeDiv = document.createElement("div");
    connTypeDiv.className = "connection-type-toggle";
    connTypeDiv.dataset.action = "toggle-connection-type";
    connTypeDiv.innerHTML = `<div class="label" style="font-size:11px;opacity:0.9">Line</div><div style="font-size:20px;margin-top:4px">${
      this.appState.connectionType === "curved" ? "📈" : "📏"
    }</div>`;
    connTypeDiv.title = `Connection Type: ${this.appState.connectionType} (Press 'L' to toggle)`;
    this.controlsContainer.appendChild(connTypeDiv);
  }

  // Render theme selector
  renderThemeSelector() {
    const themeSelector = document.createElement("select");
    themeSelector.id = "theme-selector";
    themeSelector.className = "theme-selector";

    console.log('🎨 Toolbar renderThemeSelector called, found', this.themes.length, 'themes:', this.themes.map(t => t.name));

    this.themes.forEach((theme) => {
      const option = document.createElement("option");
      option.value = theme.id;
      option.textContent = theme.name;
      if (theme.id === this.appState.currentThemeId) {
        option.selected = true;
      }
      themeSelector.appendChild(option);
    });

    // Set up change handler
    themeSelector.onchange = (e) => {
      if (window.applyTheme) {
        // Apply theme (updates colors and background)
        window.applyTheme(e.target.value);
        this.appState.currentThemeId = e.target.value;

        // Ensure selectedColor is valid for the new theme
        if (
          this.defaultColors.length > 0 &&
          !this.defaultColors.find((c) => c.value === this.appState.selectedColor)
        ) {
          this.appState.selectedColor = this.defaultColors[0].value;
          this.updateActiveColorUI(this.appState.selectedColor);
        }

        if (this.saveAppState) {
          this.saveAppState(this.appState);
        }
        // Only re-render controls section instead of full render
        this.renderControls();
      }
    };

    this.controlsContainer.appendChild(themeSelector);
  }

  // Update current type ID based on selections with validation
  updateCurrentTypeId() {
    const family = this.appState.currentFamily || "pin";
    const selectedTypeByFamily = this.appState.selectedTypeByFamily || {};
    const typeIndex = selectedTypeByFamily[family] || 0;
    const types = this.nodeTypes.filter((t) => t.family === family);

    console.log(`🔄 updateCurrentTypeId: family=${family}, typeIndex=${typeIndex}, types=`, types.map(t => t.id));

    // Guard against stale state - ensure typeIndex is valid
    const safeTypeIndex = Math.min(typeIndex, types.length - 1);
    if (types[safeTypeIndex]) {
      this.appState.currentTypeId = types[safeTypeIndex].id;
      console.log(`✅ Set currentTypeId to: ${this.appState.currentTypeId}`);

      // Update the selected index if it was out of bounds
      if (safeTypeIndex !== typeIndex) {
        this.appState.selectedTypeByFamily[family] = safeTypeIndex;
      }
    } else {
      console.warn(`No valid type found for family "${family}" at index ${typeIndex}`);
      this.appState.currentTypeId = null;
    }
  }

  // Set up event delegation for controls section
  setupControlsEventDelegation() {
    // Remove existing listener if any
    if (this.controlsContainer._controlsListener) {
      this.controlsContainer.removeEventListener("click", this.controlsContainer._controlsListener);
    }

    this.controlsContainer._controlsListener = (e) => {
      const target = e.target.closest(".connection-type-toggle");
      if (!target) return;

      const action = target.dataset.action;

      if (action === "toggle-connection-type") {
        this.toggleConnectionType();
      }
    };

    this.controlsContainer.addEventListener("click", this.controlsContainer._controlsListener);
  }

  // Toggle connection type
  toggleConnectionType() {
    this.appState.connectionType =
      this.appState.connectionType === "curved" ? "straight" : "curved";

    // Also update global connectionType variable for backward compatibility
    if (typeof window.connectionType !== "undefined") {
      window.connectionType = this.appState.connectionType;
    }

    this.saveAppState(this.appState);
    this.renderControls(); // Only re-render controls section
    this.draw();
  }
}

// Export for global access
window.ToolbarManager = ToolbarManager;
