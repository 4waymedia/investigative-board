// Toolbar Module
// Handles the top menu bar with tools, colors, and type selection

class ToolbarManager {
  constructor(appState) {
    this.appState = appState;
    this.menu = document.getElementById("menu");
    this.toolset = document.getElementById("toolset");

    // Get references to global functions
    this.draw = null;
    this.saveAppState = null;
    this.openAddColorModal = null;
  }

  // Initialize toolbar
  initialize(dependencies) {
    this.draw = dependencies.draw;
    this.saveAppState = dependencies.saveAppState;
    this.openAddColorModal = dependencies.openAddColorModal;

    // Render initial toolbar
    this.render();
  }

  // Main render function
  render() {
    if (!this.menu || !this.toolset) {
      return;
    }

    // Clear existing content
    this.menu.innerHTML = "";
    this.menu.appendChild(this.toolset);

    // Render tools
    this.renderTools();

    // Render type groups (replaces old type bar)
    this.renderTypeGroups();

    // Render color palette
    this.renderColorPalette();

    // Render connection type toggle
    this.renderConnectionTypeToggle();

    // Render theme selector
    this.renderThemeSelector();
  }

  // Render the tool buttons
  renderTools() {
    this.toolset.innerHTML = "";

    // Main interaction tools
    const mainTools = [
      { id: "pan", label: "Move", icon: "🖐", key: "M" },
      { id: "select", label: "Select", icon: "🔳", key: "S" },
      { id: "text", label: "Text", icon: "📝", key: "T" },
    ];

    mainTools.forEach((tool) => {
      const btn = document.createElement("div");
      btn.className =
        "tool-btn" + (this.appState.currentTool === tool.id ? " active" : "");
      btn.innerHTML = `<span class="icon">${tool.icon}</span><span>${tool.label}</span><span class="key">${tool.key}</span>`;
      btn.onclick = () => {
        this.setTool(tool.id);
      };
      this.toolset.appendChild(btn);
    });

    // Separator
    const separator = document.createElement("div");
    separator.className = "tool-separator";
    separator.innerHTML = "|";
    this.toolset.appendChild(separator);

    // Load button
    const loadBtn = document.createElement("div");
    loadBtn.className = "tool-btn";
    loadBtn.innerHTML = `<span class="icon">📁</span><span>Load</span>`;
    loadBtn.onclick = () => {
      // Open load modal
      if (window.app && window.app.modalManager) {
        // For now, just show an alert
        alert("Load functionality - modal not implemented yet");
      }
    };
    this.toolset.appendChild(loadBtn);
  }

  // Set the current tool
  setTool(toolId) {
    this.appState.currentTool = toolId;

    // When switching to family tools (pin/card/area), set the family
    if (toolId === "pin" || toolId === "card" || toolId === "area") {
      this.appState.currentFamily = toolId;
      this.appState.selectedTypeByFamily =
        this.appState.selectedTypeByFamily || {};
      this.appState.selectedTypeByFamily[toolId] =
        this.appState.selectedTypeByFamily[toolId] || 0;
      this.updateCurrentTypeId();
    }

    this.render();
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
    const types = window.NODE_TYPES.filter((t) => t.family === family);

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
    const typeBar = document.createElement("div");
    typeBar.className = "type-bar";

    // Define families to show
    const families = [
      { id: "pin", name: "Pin", defaultIcon: "●" },
      { id: "card", name: "Card", defaultIcon: "▤" },
      { id: "area", name: "Area", defaultIcon: "⭕" },
    ];

    families.forEach((family) => {
      const typeGroup = document.createElement("div");
      typeGroup.className = "type-group";

      // Get current type for this family
      const types = window.NODE_TYPES
        ? window.NODE_TYPES.filter((t) => t.family === family.id)
        : [];
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
      typeOption.className =
        "type-option" +
        (this.appState.currentFamily === family.id ? " active" : "");
      typeOption.innerHTML = `
        <div class="type-option-icon">${currentType.icon}</div>
        <div class="label">${currentType.label || family.name}</div>
      `;

      // Clicking the type option selects this family and tool
      typeOption.onclick = () => {
        this.appState.currentTool = family.id;
        this.appState.currentFamily = family.id;
        this.updateCurrentTypeId();
        this.render();
      };

      // Create dropdown caret
      const caret = document.createElement("button");
      caret.className = "type-caret";
      caret.innerHTML = "▾";
      caret.onclick = (e) => {
        e.stopPropagation();
        this.showTypeDropdown(family.id, caret, types);
      };

      typeGroup.appendChild(typeOption);
      typeGroup.appendChild(caret);
      typeBar.appendChild(typeGroup);
    });

    this.menu.appendChild(typeBar);
  }

  // Show dropdown for type selection
  showTypeDropdown(familyId, caretElement, types) {
    // Remove any existing dropdown
    const existingDropdown = document.querySelector(".type-dropdown");
    if (existingDropdown) {
      existingDropdown.remove();
    }

    // Create dropdown
    const dropdown = document.createElement("div");
    dropdown.className = "type-dropdown";

    types.forEach((type, index) => {
      const option = document.createElement("div");
      option.className = "type-dropdown-option";
      option.innerHTML = `<span class="icon">${type.icon}</span><span>${type.label}</span>`;

      option.onclick = () => {
        this.appState.selectedTypeByFamily =
          this.appState.selectedTypeByFamily || {};
        this.appState.selectedTypeByFamily[familyId] = index;
        this.appState.currentFamily = familyId;
        this.appState.currentTool = familyId;
        this.updateCurrentTypeId();
        dropdown.remove();
        this.render();
      };

      dropdown.appendChild(option);
    });

    // Position dropdown below caret
    const rect = caretElement.getBoundingClientRect();
    dropdown.style.position = "absolute";
    dropdown.style.left = rect.left + "px";
    dropdown.style.top = rect.bottom + 5 + "px";
    dropdown.style.zIndex = "1000";

    // Add to body (or menu)
    document.body.appendChild(dropdown);

    // Close dropdown when clicking elsewhere
    const closeDropdown = (e) => {
      if (!dropdown.contains(e.target) && e.target !== caretElement) {
        dropdown.remove();
        document.removeEventListener("click", closeDropdown);
      }
    };
    setTimeout(() => document.addEventListener("click", closeDropdown), 0);
  }

  // Render color palette
  renderColorPalette() {
    const palette = window.DEFAULT_COLORS || [];

    palette.forEach((col) => {
      const el = document.createElement("div");
      el.className =
        "color-option" +
        (col.value === this.appState.selectedColor ? " active" : "");
      el.innerHTML = `<div class="label">${col.name}</div><div class="swatch" style="background:${col.value}"></div>`;
      el.onclick = () => {
        this.appState.selectedColor = col.value;
        this.saveAppState(this.appState);
        this.render();
        this.draw();
      };
      this.menu.appendChild(el);
    });

    // Add color button
    const add = document.createElement("div");
    add.className = "color-option";
    add.innerHTML = `<div class="add-btn">+</div>`;
    add.onclick = () => {
      if (this.openAddColorModal) {
        this.openAddColorModal();
      }
    };
    this.menu.appendChild(add);
  }

  // Render connection type toggle
  renderConnectionTypeToggle() {
    const connTypeDiv = document.createElement("div");
    connTypeDiv.className = "connection-type-toggle";
    connTypeDiv.innerHTML = `<div class="label" style="font-size:11px;opacity:0.9">Line</div><div style="font-size:20px;margin-top:4px">${
      this.appState.connectionType === "curved" ? "📈" : "📏"
    }</div>`;
    connTypeDiv.onclick = () => {
      this.appState.connectionType =
        this.appState.connectionType === "curved" ? "straight" : "curved";
      // Also update global connectionType variable
      if (typeof window.connectionType !== "undefined") {
        window.connectionType = this.appState.connectionType;
      }
      this.saveAppState(this.appState);
      this.render();
      this.draw();
    };
    connTypeDiv.title = `Connection Type: ${this.appState.connectionType} (Press 'L' to toggle)`;
    this.menu.appendChild(connTypeDiv);
  }

  // Render theme selector (placeholder)
  renderThemeSelector() {
    const themeSelector = document.createElement("select");
    themeSelector.id = "theme-selector";
    themeSelector.className = "theme-selector";

    // Get themes from global themes
    const themes = window.THEMES || [{ id: "default", name: "Default" }];

    themes.forEach((theme) => {
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
        const currentPalette = window.DEFAULT_COLORS || [];
        if (
          currentPalette.length > 0 &&
          !currentPalette.find((c) => c.value === this.appState.selectedColor)
        ) {
          this.appState.selectedColor = currentPalette[0].value;
        }

        if (window.saveAppState) {
          window.saveAppState(this.appState);
        }
        this.render();
      }
    };

    this.menu.appendChild(themeSelector);
  }

  // Update current type ID based on selections
  updateCurrentTypeId() {
    const family = this.appState.currentFamily || "pin";
    const selectedTypeByFamily = this.appState.selectedTypeByFamily || {};
    const typeIndex = selectedTypeByFamily[family] || 0;
    const types = window.NODE_TYPES.filter((t) => t.family === family);

    if (types[typeIndex]) {
      this.appState.currentTypeId = types[typeIndex].id;
    }
  }
}

// Export for global access
window.ToolbarManager = ToolbarManager;
