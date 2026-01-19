// ============================================================================
// TOOLS MODULE - Tool selection and management system
// ============================================================================

// ============================================================================
// TOOL STATE MANAGEMENT
// ============================================================================

let currentTool = "pin"; // Current active tool: "pan", "select", "pin", or "text"
let currentFamily = "pin"; // Current tool family for keyboard shortcuts
let currentTypeId = "pin:circle"; // Current type within the active tool family
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
  const toolConfig = tools.find(t => t.id === id);
  if (!toolConfig) {
    console.warn(`Tool ${id} not found`);
    return;
  }

  currentTool = id;
  currentFamily = id; // Update current family for keyboard shortcuts

  // Set the appropriate type based on tool
  if (id === "text") {
    // Text tool uses currentTextType instead of currentTypeId
    currentTextType = toolConfig.defaultVariant || "plain";
  } else {
    // Other tools use currentTypeId
    currentTypeId = toolConfig.defaultVariant || toolConfig.variants[0] || null;
  }

  // Cancel any ongoing area or text creation drag when changing tools
  // These variables may be defined in other files, so check before setting
  if (typeof isDraggingArea !== 'undefined') isDraggingArea = false;
  if (typeof areaDragStart !== 'undefined') areaDragStart = null;
  if (typeof areaDragCurrent !== 'undefined') areaDragCurrent = null;
  if (typeof isCreatingText !== 'undefined') isCreatingText = false;
  if (typeof textCreateStart !== 'undefined') textCreateStart = null;
  if (typeof textCreateCurrent !== 'undefined') textCreateCurrent = null;

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
 * Available tools configuration with variants
 */
const tools = [
  {
    id: "select",
    name: "Select",
    label: "S",
    icon: "▫",
    shortcut: "S",
    variants: [], // Select tool has no variants
    defaultVariant: null
  },
  {
    id: "pin",
    name: "Pin",
    label: "1",
    icon: "📍",
    shortcut: "1",
    variants: ["pin:circle", "pin:square", "pin:pill"],
    defaultVariant: "pin:circle"
  },
  {
    id: "card",
    name: "Card",
    label: "2",
    icon: "▤",
    shortcut: "2",
    variants: ["card:card", "card:doc", "card:folder"],
    defaultVariant: "card:card"
  },
  {
    id: "area",
    name: "Area",
    label: "3",
    icon: "🔳",
    shortcut: "3",
    variants: ["area:circle", "area:square"],
    defaultVariant: "area:circle"
  },
  {
    id: "text",
    name: "Text",
    label: "4",
    icon: "📝",
    shortcut: "4",
    variants: ["plain", "rectangle", "comic", "title"],
    defaultVariant: "plain"
  }
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
// TYPE RENDERING STRATEGIES
// ============================================================================

/**
 * Strategy map for rendering different tool types
 */
const typeRenderers = {
  text: (container) => {
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
      container.appendChild(el);
    });
  },

  pin: (container) => {
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
      container.appendChild(el);
    });
  },

  card: (container) => {
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
      container.appendChild(el);
    });
  },

  area: (container) => {
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
      container.appendChild(el);
    });
  }
};

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

  // Use strategy pattern to render tool types
  const renderer = typeRenderers[currentTool];
  if (renderer) {
    renderer(typeBar);
  }

  menu.appendChild(typeBar);

  // Theme selector
  if (typeof getThemes === 'function' && typeof getCurrentThemeId === 'function' &&
      typeof applyTheme === 'function' && typeof saveState === 'function') {
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
  }

  // Color palette
  if (typeof getPalette === 'function' && typeof getSelectedColor === 'function' &&
      typeof setSelectedColor === 'function' && typeof draw === 'function') {
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
    if (typeof addColorToPalette === 'function') {
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
  }
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
  const toolConfig = tools.find(t => t.id === currentTool);
  if (!toolConfig || !toolConfig.variants || toolConfig.variants.length === 0) {
    return; // No variants to cycle through
  }

  let currentValue, setter;

  if (currentTool === 'text') {
    currentValue = currentTextType;
    setter = setCurrentTextType;
  } else {
    currentValue = currentTypeId;
    setter = (value) => { currentTypeId = value; };
  }

  const variants = toolConfig.variants;
  const currentIndex = variants.indexOf(currentValue);
  const nextIndex = (currentIndex + 1) % variants.length;
  const nextValue = variants[nextIndex];

  setter(nextValue);

  // Update selected element if applicable
  if (typeof selectedPinIndex !== 'undefined' && selectedPinIndex !== null &&
      typeof pins !== 'undefined' && pins[selectedPinIndex]) {
    if (currentTool !== 'text' && pins[selectedPinIndex].typeId.startsWith(currentTool + ':')) {
      pins[selectedPinIndex].typeId = nextValue;
      if (typeof saveState === 'function') {
        saveState();
      }
    }
  }

  renderMenu();
  if (typeof draw === 'function') {
    draw();
  }
}

/**
 * Set up keyboard shortcuts for tool switching
 */
function setupToolKeyboardShortcuts() {
  document.addEventListener('keydown', (e) => {
    // Tool shortcuts (1-5 for tools, S for select)
    const tool = tools.find(t => t.shortcut === e.key);
    if (tool && !e.ctrlKey && !e.metaKey && !e.altKey) {
      e.preventDefault();
      setTool(tool.id);
      return;
    }

    // Variant cycling (Tab key)
    if (e.key === 'Tab' && !e.ctrlKey && !e.metaKey && !e.altKey) {
      e.preventDefault();
      cycleVariantInCurrentFamily();
      return;
    }
  });
}
