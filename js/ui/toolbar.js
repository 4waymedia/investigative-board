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

    // Line toggle container (between types and colors)
    this.lineContainer = document.createElement("div");
    this.lineContainer.className = "toolbar-section line-section";
    this.lineContainer.id = "line-container";

    this.colorsContainer = document.createElement("div");
    this.colorsContainer.className = "toolbar-section colors-section";
    this.colorsContainer.id = "colors-container";

    // Append containers to menu in order: tools, types, line, colors
    this.menu.appendChild(this.toolset);
    this.menu.appendChild(this.typesContainer);
    this.menu.appendChild(this.lineContainer);
    this.menu.appendChild(this.colorsContainer);
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
    if (this.lineContainer && this.lineContainer.parentNode) {
      this.lineContainer.parentNode.removeChild(this.lineContainer);
    }
    if (this.colorsContainer && this.colorsContainer.parentNode) {
      this.colorsContainer.parentNode.removeChild(this.colorsContainer);
    }

    // Ensure system menu and toolset exist in the menu
    if (systemMenu && !systemMenu.parentNode) {
      this.menu.appendChild(systemMenu);
    }
    if (toolset && !toolset.parentNode) {
      this.menu.appendChild(toolset);
    }

    // Add the dynamic containers in order: types, line, colors
    this.menu.appendChild(this.typesContainer);
    this.menu.appendChild(this.lineContainer);
    this.menu.appendChild(this.colorsContainer);

    // Render each section
    this.renderTools();
    this.renderTypeGroups();
    this.renderLineToggle();
    this.renderColorPalette();
  }

  // Render line toggle (icon-only, compact design)
  renderLineToggle() {
    if (!this.lineContainer) {
      console.warn('⚠️ renderLineToggle: lineContainer not found');
      return;
    }
    
    this.lineContainer.innerHTML = "";
    
    const lineToggle = document.createElement("div");
    lineToggle.className = "line-toggle";
    lineToggle.dataset.action = "toggle-connection-type";
    
    const isCurved = this.appState.connectionType === "curved";
    lineToggle.innerHTML = `<span class="line-icon">${isCurved ? "╭" : "─"}</span>`;
    lineToggle.title = `Line: ${isCurved ? "Curved" : "Straight"} (Press L to toggle)`;
    
    console.log(`🔧 renderLineToggle: connectionType=${this.appState.connectionType}, isCurved=${isCurved}`);
    
    // Add click handler
    lineToggle.addEventListener("click", () => this.toggleConnectionType());
    
    this.lineContainer.appendChild(lineToggle);
  }

  // Render the tool buttons (icon-only, minimal design)
  renderTools() {
    if (!this.toolset) {
      console.warn('⚠️ renderTools: toolset element not found');
      return;
    }
    
    this.toolset.innerHTML = "";

    this.mainTools.forEach((tool) => {
      const btn = document.createElement("div");
      btn.className = `tool-btn tool-btn-icon ${this.appState.currentTool === tool.id ? "active" : ""}`;

      // Store the ID in the DOM for event delegation
      btn.dataset.toolAction = tool.id;
      
      // Tooltip shows label and keyboard shortcut
      btn.title = `${tool.label} (${tool.key})`;

      btn.innerHTML = `<span class="icon">${tool.icon}</span>`;
      this.toolset.appendChild(btn);
    });

    // Attach a single listener to the parent
    this.toolset.removeEventListener('click', this._toolsetClickHandler);
    this._toolsetClickHandler = (e) => this.handleToolbarClick(e);
    this.toolset.addEventListener('click', this._toolsetClickHandler);
    
    console.log(`🔧 renderTools: ${this.mainTools.length} tools rendered (icon-only mode)`);
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
    }
  }

  // Update active tool UI without full re-render
  updateActiveToolUI(toolId) {
    this.toolset.querySelectorAll('.tool-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.toolAction === toolId);
    });
    console.log(`🔧 Tool activated: ${toolId}`);
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

  // Render type groups (compact icon-only design, click to open dropdown)
  renderTypeGroups() {
    this.typesContainer.innerHTML = "";
    const typeBar = document.createElement("div");
    typeBar.className = "type-bar type-bar-compact";

    this.families.forEach((family) => {
      const typeGroup = document.createElement("div");
      typeGroup.className = "type-group type-group-compact";
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

      // Create compact type option (icon only, click to open dropdown)
      const typeOption = document.createElement("div");
      typeOption.className = "type-option type-option-compact type-option-clickable";
      typeOption.dataset.familyId = family.id;
      if (this.appState.currentFamily === family.id) {
        typeOption.classList.add("active");
      }
      // Tooltip shows the current type name and hint
      typeOption.title = `${currentType.label || family.name} (click to change)`;
      typeOption.innerHTML = `<div class="type-option-icon">${currentType.icon}</div>`;

      typeGroup.appendChild(typeOption);
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
      const target = e.target.closest(".type-option");
      if (!target) return;

      e.stopPropagation();
      const familyId = target.dataset.familyId;

      // Click on type option - show dropdown menu
      const types = this.nodeTypes.filter((t) => t.family === familyId);
      this.showTypeDropdown(familyId, target, types);
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
        
        // Update the icon and tooltip to reflect current type selection
        const types = this.nodeTypes.filter((t) => t.family === family.id);
        const selectedIndex = (this.appState.selectedTypeByFamily && 
          this.appState.selectedTypeByFamily[family.id]) || 0;
        const currentType = types[selectedIndex] || { icon: family.defaultIcon, label: family.name };
        
        const iconEl = typeOption.querySelector('.type-option-icon');
        if (iconEl) iconEl.textContent = currentType.icon;
        
        // Update tooltip (for compact mode)
        typeOption.title = currentType.label || family.name;
      }
    });
  }

  // Show dropdown for type selection
  showTypeDropdown(familyId, triggerElement, types) {
    this.removeExistingDropdown();

    const dropdown = document.createElement("div");
    dropdown.className = "type-dropdown";
    dropdown.id = "active-type-dropdown";
    
    // Position below the trigger element
    const rect = triggerElement.getBoundingClientRect();
    dropdown.style.cssText = `position: absolute; left: ${rect.left}px; top: ${rect.bottom + 5}px; z-index: 1000;`;

    // Build HTML string for efficiency, using data-index
    dropdown.innerHTML = types.map((type, index) => `
      <div class="type-dropdown-option" data-index="${index}">
        <span class="icon">${type.icon}</span>
        <span>${type.label}</span>
      </div>
    `).join('');

    // Click handler for options
    dropdown.onclick = (e) => {
      const option = e.target.closest(".type-dropdown-option");
      if (!option) return;

      const index = parseInt(option.dataset.index);
      this.appState.selectedTypeByFamily = this.appState.selectedTypeByFamily || {};
      this.appState.selectedTypeByFamily[familyId] = index;
      this.appState.currentFamily = familyId;
      this.appState.currentTool = familyId;

      this.updateCurrentTypeId();
      this.closeTypeDropdown();
      this.updateTypeGroupsUI();
      this.updateActiveToolUI(familyId);
    };

    document.body.appendChild(dropdown);

    // Close on click outside (including canvas)
    const closeOnClickOutside = (e) => {
      if (!dropdown.contains(e.target) && !triggerElement.contains(e.target)) {
        this.closeTypeDropdown();
      }
    };

    // Close on ESC key
    const closeOnEscape = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        this.closeTypeDropdown();
      }
    };

    // Store listeners for cleanup
    this._dropdownCloseListener = closeOnClickOutside;
    this._dropdownEscapeListener = closeOnEscape;

    // Add listeners after a brief delay to avoid immediate close
    setTimeout(() => {
      document.addEventListener("click", closeOnClickOutside);
      document.addEventListener("keydown", closeOnEscape);
    }, 10);
  }

  // Close the type dropdown and clean up listeners
  closeTypeDropdown() {
    const dropdown = document.getElementById("active-type-dropdown");
    if (dropdown) {
      dropdown.remove();
    }
    
    // Remove event listeners
    if (this._dropdownCloseListener) {
      document.removeEventListener("click", this._dropdownCloseListener);
      this._dropdownCloseListener = null;
    }
    if (this._dropdownEscapeListener) {
      document.removeEventListener("keydown", this._dropdownEscapeListener);
      this._dropdownEscapeListener = null;
    }
  }

  // Helper method for dropdown cleanup
  removeExistingDropdown() {
    this.closeTypeDropdown();
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
      // Store both color value and slot in data attributes
      el.dataset.colorValue = col.value;
      el.dataset.colorSlot = col.slot || ""; // Color slot for theme switching
      el.innerHTML = `<div class="swatch" style="background:${col.value}" title="${col.name} (${col.slot || 'custom'})"></div>`;
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
    const colorSlot = option.dataset.colorSlot;
    const action = option.dataset.action;

    if (colorValue) {
      this.selectColor(colorValue, colorSlot);
    } else if (action === "add-color") {
      this.handleAddColorAction();
    }
  }

  // Select a color and update UI
  selectColor(colorValue, colorSlot = null) {
    this.appState.selectedColor = colorValue;
    this.appState.selectedColorSlot = colorSlot || null; // null for custom colors without slot
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


  // Toggle connection type
  toggleConnectionType() {
    this.appState.connectionType =
      this.appState.connectionType === "curved" ? "straight" : "curved";

    // Also update global connectionType variable for backward compatibility
    if (typeof window.connectionType !== "undefined") {
      window.connectionType = this.appState.connectionType;
    }

    this.saveAppState(this.appState);
    this.renderLineToggle(); // Re-render line toggle
    this.draw();
  }
}

// Export for global access
window.ToolbarManager = ToolbarManager;
