// ============================================================================
// TOOLS MODULE - Tool selection and management system
// ============================================================================

// ============================================================================
// TOOL STATE MANAGEMENT
// ============================================================================

let currentTool = "pin"; // Current active tool: "pan", "select", "pin", or "text"
let currentTextType = "plain"; // Text type: "plain", "rectangle", "comic", "title"
let selectedTextIndex = null; // Currently selected text element

// ============================================================================
// TOOL MANAGEMENT FUNCTIONS
// ============================================================================

/**
 * Set the current active tool
 * @param {string} id - Tool ID ("pan", "select", "pin", "text")
 */
function setTool(id) {
  currentTool = id;

  // Set currentTypeId to the appropriate default for the tool
  if (id === "pin") {
    currentTypeId = "pin:circle";
  } else if (id === "card") {
    currentTypeId = "card:card";
  } else if (id === "area") {
    currentTypeId = "area:circle";
  } else if (id === "text") {
    // Text tool doesn't use currentTypeId, it uses currentTextType
    currentFamily = "pin"; // Reset to default pin family when switching to text
  }

  // Cancel any ongoing area or text creation drag when changing tools
  isDraggingArea = false;
  areaDragStart = null;
  areaDragCurrent = null;
  isCreatingText = false;
  textCreateStart = null;
  textCreateCurrent = null;
  renderMenu(); // Update both toolbar and type-bar
}

/**
 * Get the current active tool
 * @returns {string} Current tool ID
 */
function getCurrentTool() {
  return currentTool;
}

/**
 * Get the current text type
 * @returns {string} Current text type
 */
function getCurrentTextType() {
  return currentTextType;
}

/**
 * Set the current text type
 * @param {string} type - Text type to set
 */
function setCurrentTextType(type) {
  currentTextType = type;
}

/**
 * Set the current text type
 * @param {string} type - Text type ("plain", "rectangle", "comic", "title")
 */
function setCurrentTextType(type) {
  currentTextType = type;
}

/**
 * Get the currently selected text element index
 * @returns {number|null} Selected text index or null
 */
function getSelectedTextIndex() {
  return selectedTextIndex;
}

/**
 * Set the currently selected text element index
 * @param {number|null} index - Text element index or null to clear
 */
function setSelectedTextIndex(index) {
  selectedTextIndex = index;
}

// ============================================================================
// TOOL DEFINITIONS
// ============================================================================

/**
 * Available tools configuration
 */
const tools = [
  { id: "select", name: "Select", label: "S", icon: "▫", shortcut: "S" }, // Select tool for marquee
  { id: "pin", name: "Pin", label: "1", icon: "📍", shortcut: "1" }, // Pin tool
  { id: "card", name: "Card", label: "2", icon: "▤", shortcut: "2" }, // Card tool
  { id: "area", name: "Area", label: "3", icon: "🔳", shortcut: "3" }, // Area tool
  { id: "text", name: "Text", label: "4", icon: "📝", shortcut: "4" }, // Text tool
];


// ============================================================================
// TOOLBAR RENDERING
// ============================================================================

/**
 * Render the main toolbar with tool buttons
 */
function renderTools() {
  const toolset = document.getElementById("toolset");
  if (!toolset) return;

  toolset.innerHTML = "";

  tools.forEach((tool) => {
    const btn = document.createElement("div");
    btn.className = `tool-btn${currentTool === tool.id ? " active" : ""}`;
    btn.title = `${tool.name} (${tool.shortcut})`;
    btn.innerHTML = `<span class="icon">${tool.icon}</span><span>${tool.label}</span>`;
    btn.onclick = () => setTool(tool.id);
    toolset.appendChild(btn);
  });
}

/**
 * Render the type selection bar (for text and pin types)
 */
function renderTypeBar() {
  const typeBar = document.getElementById("type-bar");
  if (!typeBar) return;

  // Implementation depends on current tool and available types
  // This is a placeholder - the actual implementation would render
  // appropriate type selection buttons based on currentTool
}

// ============================================================================
// MENU RENDERING
// ============================================================================

/**
 * Render the main menu (combines toolbar, pin types, and color palette)
 */
function renderMenu() {
  const menu = document.getElementById("menu");
  if (!menu) return;

  // Clear menu except for toolset
  const toolset = document.getElementById("toolset");
  menu.innerHTML = "";
  if (toolset) {
    menu.appendChild(toolset);
  } else {
    // Re-create toolset if it doesn't exist
    const newToolset = document.createElement("div");
    newToolset.id = "toolset";
    menu.appendChild(newToolset);
  }

  renderTools();

  // Type bar (dynamic based on current tool)
  const typeBar = document.createElement('div');
  typeBar.className = 'type-bar';

  if (currentTool === 'text') {
    // Text type options
    const textTypes = [
      {id:'plain', name:'Plain', icon:'📝'},
      {id:'rectangle', name:'Rectangle', icon:'▭'},
      {id:'comic', name:'Comic', icon:'💬'},
      {id:'title', name:'Title', icon:'📰'}
    ];

    textTypes.forEach(t => {
      const el = document.createElement('div');
      el.className = 'type-option' + (t.id === currentTextType ? ' active' : '');
      el.innerHTML = `
        <div class="type-option-icon">${t.icon}</div>
        <div class="label">${t.name}</div>
      `;
      el.onclick = () => {
        setCurrentTextType(t.id);
        renderMenu();
      };
      typeBar.appendChild(el);
    });
  } else if (currentTool === 'pin') {
    // Pin type options
    const pinTypes = [
      {id:'pin:circle', name:'Circle', icon:'●'},
      {id:'pin:square', name:'Square', icon:'■'},
      {id:'pin:pill', name:'Pill', icon:'▭'}
    ];

    pinTypes.forEach(t => {
      const el = document.createElement('div');
      el.className = 'type-option' + (t.id === currentTypeId ? ' active' : '');
      el.innerHTML = `
        <div class="type-option-icon">${t.icon}</div>
        <div class="label">${t.name}</div>
      `;
      el.onclick = () => {
        currentTypeId = t.id;
        renderMenu();
      };
      typeBar.appendChild(el);
    });
  } else if (currentTool === 'card') {
    // Card type options
    const cardTypes = [
      {id:'card:card', name:'Card', icon:'▤'},
      {id:'card:doc', name:'Doc', icon:'📄'},
      {id:'card:folder', name:'Folder', icon:'📁'}
    ];

    cardTypes.forEach(t => {
      const el = document.createElement('div');
      el.className = 'type-option' + (t.id === currentTypeId ? ' active' : '');
      el.innerHTML = `
        <div class="type-option-icon">${t.icon}</div>
        <div class="label">${t.name}</div>
      `;
      el.onclick = () => {
        currentTypeId = t.id;
        renderMenu();
      };
      typeBar.appendChild(el);
    });
  } else if (currentTool === 'area') {
    // Area type options
    const areaTypes = [
      {id:'area:circle', name:'Circle', icon:'⭕'},
      {id:'area:square', name:'Square', icon:'▢'}
    ];

    areaTypes.forEach(t => {
      const el = document.createElement('div');
      el.className = 'type-option' + (t.id === currentTypeId ? ' active' : '');
      el.innerHTML = `
        <div class="type-option-icon">${t.icon}</div>
        <div class="label">${t.name}</div>
      `;
      el.onclick = () => {
        currentTypeId = t.id;
        renderMenu();
      };
      typeBar.appendChild(el);
    });
  }

  menu.appendChild(typeBar);

  // Theme selector
  const themeSelector = document.createElement('select');
  themeSelector.id = 'theme-selector';
  themeSelector.style.marginLeft = '16px';
  const themes = getThemes();
  themes.forEach(theme => {
    const option = document.createElement('option');
    option.value = theme.id;
    option.textContent = theme.name;
    if (theme.id === getCurrentThemeId()) {
      option.selected = true;
    }
    themeSelector.appendChild(option);
  });
  themeSelector.onchange = (e) => {
    applyTheme(e.target.value);
    saveState();
  };
  menu.appendChild(themeSelector);

  // Color palette
  const palette = getPalette();
  palette.forEach(col => {
    const el = document.createElement('div');
    el.className = 'color-option' + (col.value === getSelectedColor() ? ' active' : '');
    el.innerHTML = `<div class="label">${col.name}</div><div class="swatch" style="background:${col.value}"></div>`;
    el.onclick = () => {
      setSelectedColor(col.value);
      renderMenu();
      draw();
    };
    menu.appendChild(el);
  });

  // Add color button
  const add = document.createElement('div');
  add.className = 'color-option';
  add.innerHTML = `<div class="add-btn">+</div>`;
  add.onclick = () => {
    const hex = prompt("Hex color:", "#ff9500");
    if (hex && /^#[0-9A-F]{6}$/i.test(hex)) {
      const name = prompt("Name:", "Custom") || "Custom";
      addColorToPalette({name, value: hex.toLowerCase()});
      setSelectedColor(hex.toLowerCase());
      renderMenu();
      draw();
    }
  };
  menu.appendChild(add);
}

// ============================================================================
// TOOL INITIALIZATION
// ============================================================================

/**
 * Initialize the tool system
 */
function initializeTools() {
  renderMenu();
  // Set up keyboard shortcuts for tools
  setupToolKeyboardShortcuts();
}

/**
 * Set tool by index (for keyboard shortcuts 1-9)
 * @param {number} index - Tool index (0-8)
 */
function setToolByIndex(index) {
  if (index >= 0 && index < tools.length) {
    setTool(tools[index].id);
  }
}

/**
 * Cycle through variants within the current tool family
 */
function cycleVariantInCurrentFamily() {
  if (currentTool === 'text') {
    // Cycle through text types: plain → rectangle → comic → title → plain
    const textTypes = ["plain", "rectangle", "comic", "title"];
    const currentIndex = textTypes.indexOf(currentTextType);
    const nextIndex = (currentIndex + 1) % textTypes.length;
    setCurrentTextType(textTypes[nextIndex]);
  } else if (currentTool === 'pin') {
    // Cycle through pin types: circle → square → pill → circle
    const pinTypes = ["pin:circle", "pin:square", "pin:pill"];
    const currentIndex = pinTypes.indexOf(currentTypeId);
    if (currentIndex !== -1) {
      const nextIndex = (currentIndex + 1) % pinTypes.length;
      currentTypeId = pinTypes[nextIndex];
    } else {
      currentTypeId = pinTypes[0]; // Default to circle
    }

    // If a pin is selected, update its type
    if (selectedPinIndex !== null && pins[selectedPinIndex]) {
      pins[selectedPinIndex].typeId = currentTypeId;
      saveState();
    }
  } else if (currentTool === 'card') {
    // Cycle through card types: card → doc → folder → card
    const cardTypes = ["card:card", "card:doc", "card:folder"];
    const currentIndex = cardTypes.indexOf(currentTypeId);
    if (currentIndex !== -1) {
      const nextIndex = (currentIndex + 1) % cardTypes.length;
      currentTypeId = cardTypes[nextIndex];
    } else {
      currentTypeId = cardTypes[0]; // Default to card
    }

    // If a pin is selected and it's a card pin, update its type
    if (selectedPinIndex !== null && pins[selectedPinIndex] && pins[selectedPinIndex].typeId.startsWith('card:')) {
      pins[selectedPinIndex].typeId = currentTypeId;
      saveState();
    }
  } else if (currentTool === 'area') {
    // Cycle through area types: circle → square → circle
    const areaTypes = ["area:circle", "area:square"];
    const currentIndex = areaTypes.indexOf(currentTypeId);
    if (currentIndex !== -1) {
      const nextIndex = (currentIndex + 1) % areaTypes.length;
      currentTypeId = areaTypes[nextIndex];
    } else {
      currentTypeId = areaTypes[0]; // Default to circle
    }

    // If a pin is selected and it's an area pin, update its type
    if (selectedPinIndex !== null && pins[selectedPinIndex] && pins[selectedPinIndex].typeId.startsWith('area:')) {
      pins[selectedPinIndex].typeId = currentTypeId;
      saveState();
    }
  }
  renderMenu();
  draw();
}

/**
 * Set up keyboard shortcuts for tool switching
 */
function setupToolKeyboardShortcuts() {
  // Tool shortcuts are handled in the main keyboard event handler
  // This function can be used for any additional tool shortcut setup
}
