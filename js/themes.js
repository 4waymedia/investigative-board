// ============================================================================
// THEMES MODULE - Color palettes, themes, and visual styling
// ============================================================================

// ============================================================================
// COLOR PALETTES & CONSTANTS
// ============================================================================

const defaultColors = [
  { name: "Red", value: "#f85149" },
  { name: "Blue", value: "#58a6ff" },
  { name: "Green", value: "#3fb950" },
  { name: "Yellow", value: "#f1c40f" },
  { name: "Purple", value: "#a471f7" },
];

let palette = [...defaultColors]; // Current active color palette
let selectedColor = palette[0].value; // Currently selected color

// ============================================================================
// EMBEDDED THEME DATA FALLBACK
// ============================================================================
// This module uses CSS variables for theming. Add to your CSS:
// :root {
//   --theme-bg: #0d1117;
//   --theme-text: #ffffff;
//   --theme-accent: #58a6ff;
// }
// #canvas-container {
//   background: var(--theme-bg);
//   color: var(--theme-text);
//   transition: background 0.3s ease;
// }
const EMBEDDED_THEME_DATA = {
  "G1": {
    "name": "Investigative Noir",
    "color-list": ["#000000", "#1A1A1A", "#4A4A4A", "#FF4500", "#FFD700", "#00BFFF", "#228B22", "#8A2BE2", "#DC143C"],
    "textColor": "#FFFFFF",
    "background": { "type": "solid", "value": "#000000" }
  },
  "G2": {
    "name": "Sci-Fi Futuristic",
    "color-list": ["#0A0F1A", "#1C2331", "#00FFFF", "#FF00FF", "#00FF00", "#FFFF00", "#FF69B4", "#4B0082", "#20B2AA"],
    "textColor": "#FFFFFF",
    "background": { "type": "linear-gradient", "colors": ["#0A0F1A", "#1C2331"] }
  },
  "G3": {
    "name": "Watercolor Exploration",
    "color-list": ["#F5F5F5", "#A8DADC", "#457B9D", "#E63946", "#F1FAEE", "#1D3557", "#F4A261", "#2A9D8F", "#E76F51", "#264653"],
    "textColor": "#1D3557",
    "background": { "type": "solid", "value": "#F5F5F5" }
  },
  "C1": {
    "name": "Signal Noir",
    "color_list": ["#0B0F14", "#161B22", "#58A6FF", "#F78166", "#7EE787", "#D2A8FF", "#E3B341", "#8B949E"],
    "textColor": "#E6EDF3",
    "background": { "type": "gradient", "value": "radial-gradient(circle at center, #0F141A 0%, #0B0F14 70%)" }
  },
  "C2": {
    "name": "Architect's Desk",
    "color_list": ["#F7F5F2", "#E6E2DC", "#2F3E46", "#52796F", "#84A98C", "#BC6C25", "#6D6875", "#ADB5BD"],
    "textColor": "#2F3E46",
    "background": { "type": "pattern", "value": "#3B82F6" }
  }
};

// ============================================================================
// THEME MANAGER CLASS
// ============================================================================

class ThemeManager {
  constructor() {
    this.themes = [
      {
        id: "default",
        name: "Default",
        colors: [...defaultColors],
        // background will be undefined/null for default (uses existing canvas clear)
      },
    ];
    this.currentTheme = null;
    this.customIcons = {}; // Cache for loaded Image objects: { dataURL: Image }

    // Load custom themes on initialization
    this.loadFromStorage();
  }

  /**
   * Creates a new theme object and adds it to the registry
   */
  createTheme({ id, name, colors, background, icons = {} }) {
    const newTheme = {
      id: id || `custom-${Date.now()}`,
      name: name || "New Theme",
      colors: colors.map((c, i) => ({ name: `Color ${i + 1}`, value: c })),
      background: this._parseBackground(background),
      icons: icons, // Map of pinType -> iconDataURL
      isCustom: true
    };

    this.themes.push(newTheme);
    this.saveCustomThemes(); // Persist to localStorage
    return newTheme;
  }

  /**
   * Standardizes background input
   */
  _parseBackground(bg) {
    if (typeof bg === 'string') return { type: 'color', value: bg };
    return bg; // Already an object {type, value}
  }

  /**
   * Saves only user-created themes to localStorage
   */
  saveCustomThemes() {
    const custom = this.themes.filter(t => t.isCustom);
    localStorage.setItem('user_custom_themes', JSON.stringify(custom));
  }

  /**
   * Loads custom themes from localStorage
   */
  loadCustomThemes() {
    try {
      const stored = localStorage.getItem('user_custom_themes');
      if (stored) {
        const customThemes = JSON.parse(stored);
        customThemes.forEach(theme => {
          // Avoid duplicates
          if (!this.themes.find(t => t.id === theme.id)) {
            this.themes.push(theme);
          }
        });
      }
    } catch (error) {
      console.warn('Failed to load custom themes:', error);
    }
  }

  /**
   * Get all available themes
   */
  getThemes() {
    return this.themes;
  }

  /**
   * Get current theme
   */
  getCurrentTheme() {
    return this.currentTheme || this.themes.find((t) => t.id === "default");
  }

  /**
   * Get current theme ID
   */
  getCurrentThemeId() {
    return this.currentTheme?.id || "default";
  }

  /**
   * Apply a theme by ID
   */
  applyTheme(themeId) {
    const theme = this.themes.find((t) => t.id === themeId);
    if (!theme) {
      console.warn(`Theme ${themeId} not found`);
      return;
    }

    this.currentTheme = theme;
    applyThemeBackground(theme);

    // Update global state for backward compatibility
    window.palette = [...theme.colors];
    window.selectedColor = window.palette[0]?.value || "#58a6ff";
    window.DEFAULT_COLORS = [...theme.colors];

    // Update UI elements
    if (window.app && window.app.updatePinInfo) {
      window.app.updatePinInfo();
    }
    if (typeof draw === 'function') {
      draw();
    }

    console.log(`Applied theme: ${theme.name} (${theme.colors?.length || 0} colors)`);
  }

  /**
   * Get current color palette
   */
  getPalette() {
    return this.currentTheme?.colors || defaultColors;
  }

  /**
   * Get selected color
   */
  getSelectedColor() {
    return window.selectedColor || defaultColors[0].value;
  }

  /**
   * Set selected color
   */
  setSelectedColor(color) {
    window.selectedColor = color;
  }

  /**
   * Add color to current theme's palette
   */
  addColorToPalette(colorObj) {
    if (this.currentTheme) {
      this.currentTheme.colors.push(colorObj);
      this.saveCustomThemes();
    }
  }

  /**
   * Convert file to DataURL for icon storage
   */
  async fileToDataURL(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  /**
   * Generates a new theme object and registers it
   */
  async createTheme(themeData) {
    const newTheme = {
      id: `custom_${Date.now()}`,
      name: themeData.name || "My New Theme",
      colors: themeData.colors.map((hex, i) => ({ name: `Color ${i + 1}`, value: hex })),
      background: themeData.background, // {type: 'solid'|'gradient', value: '...'}
      icons: themeData.icons || {}, // Map: { pinType: dataURL_or_Path }
      isCustom: true
    };

    this.themes.push(newTheme);
    this.saveToStorage();
    return newTheme;
  }

  /**
   * Helper to convert File objects to usable strings
   */
  async processFileUpload(file) {
    return new Promise((resolve, reject) => {
      // @TODO: UPLOAD INTEGRATION
      // Currently: Converting to DataURL for localStorage.
      // Future: Upload to '/api/user-folder/upload' and return the server path.

      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  /**
   * Save custom themes to storage
   */
  saveToStorage() {
    const customOnly = this.themes.filter(t => t.isCustom);

    // @TODO: BACKEND INTEGRATION
    // Currently: Saving JSON string to localStorage.
    // Future: POST to '/api/user-folder/themes.json'.
    localStorage.setItem('user_themes', JSON.stringify(customOnly));
  }

  /**
   * Load custom themes from storage
   */
  loadFromStorage() {
    try {
      const stored = localStorage.getItem('user_themes');
      if (stored) {
        const customThemes = JSON.parse(stored);
        customThemes.forEach(theme => {
          // Avoid duplicates
          if (!this.themes.find(t => t.id === theme.id)) {
            this.themes.push(theme);
          }
        });
      }
    } catch (error) {
      console.warn('Failed to load custom themes from storage:', error);
    }
  }

  /**
   * Set custom icon for a pin type
   */
  setCustomIcon(pinType, dataURL) {
    this.customIcons[pinType] = dataURL;
    // Save to localStorage
    localStorage.setItem('theme_custom_icons', JSON.stringify(this.customIcons));
  }

  /**
   * Get custom icon for a pin type
   */
  getCustomIcon(pinType) {
    return this.customIcons[pinType];
  }

  /**
   * Load custom icons from localStorage
   */
  loadCustomIcons() {
    try {
      const stored = localStorage.getItem('theme_custom_icons');
      if (stored) {
        this.customIcons = JSON.parse(stored);
      }
    } catch (error) {
      console.warn('Failed to load custom icons:', error);
    }
  }
}

// Create global instance
window.themeManager = new ThemeManager();

/*
 * USAGE EXAMPLES:
 *
 * Creating a custom theme:
 * const newTheme = window.themeManager.createTheme({
 *   id: 'my-theme',
 *   name: 'My Custom Theme',
 *   colors: ['#ff0000', '#00ff00', '#0000ff'],
 *   background: { type: 'solid', value: '#f0f0f0' },
 *   icons: { 'pin:circle': 'data:image/svg+xml;base64,...' }
 * });
 *
 * Setting custom icons:
 * const dataURL = await window.themeManager.fileToDataURL(fileInput.files[0]);
 * window.themeManager.setCustomIcon('pin:circle', dataURL);
 *
 * Getting custom icon:
 * const iconDataURL = window.themeManager.getCustomIcon('pin:circle');
 */

/**
 * Logic for the Theme Creator Modal
 */
async function onSaveNewTheme() {
  const nameInput = document.getElementById('theme-name-input');
  const bgColorInput = document.getElementById('theme-bg-color');

  if (!nameInput || !bgColorInput) {
    console.error('Theme creator inputs not found');
    return;
  }

  const name = nameInput.value.trim();
  const selectedBg = bgColorInput.value;

  if (!name) {
    alert('Please enter a theme name');
    return;
  }

  const iconMap = {};
  const iconInputs = document.querySelectorAll('.pin-icon-upload');

  // Process all icon uploads
  for (const input of iconInputs) {
    if (input.files && input.files[0]) {
      const pinType = input.dataset.pinType;
      try {
        // Convert file to string (DataURL for now, path later)
        iconMap[pinType] = await window.themeManager.processFileUpload(input.files[0]);
      } catch (error) {
        console.error(`Failed to process icon for ${pinType}:`, error);
      }
    }
  }

  // Get colors from UI (placeholder - implement based on your color picker UI)
  const colors = ['#FF0000', '#00FF00', '#0000FF']; // @TODO: Map from UI color pickers

  try {
    const newTheme = await window.themeManager.createTheme({
      name: name,
      colors: colors,
      background: { type: 'solid', value: selectedBg },
      icons: iconMap
    });

    // Apply the newly created theme
    applyTheme(newTheme.id);

    // Close modal and show success
    console.log(`Theme "${name}" created and applied successfully!`);

    // Reset form
    nameInput.value = '';
    bgColorInput.value = '#ffffff';
    iconInputs.forEach(input => {
      input.value = '';
    });

  } catch (error) {
    console.error('Failed to create theme:', error);
    alert('Failed to create theme. Please try again.');
  }
}

// Export theme creator function
window.onSaveNewTheme = onSaveNewTheme;

// ============================================================================
// THEME STATE MANAGEMENT
// ============================================================================

/**
 * Centralized theme state management
 */
const ThemeState = {
  // Current active theme
  currentThemeId: "default",
  currentTheme: null,

  // Color palette state
  palette: [...defaultColors],
  selectedColor: defaultColors[0].value,

  // Getters
  getCurrentTheme() {
    return this.currentTheme || THEMES.find((t) => t.id === this.currentThemeId);
  },

  getPalette() {
    return this.palette;
  },

  getSelectedColor() {
    return this.selectedColor;
  },

  // Setters
  setCurrentTheme(themeId) {
    this.currentThemeId = themeId;
    this.currentTheme = THEMES.find((t) => t.id === themeId);
  },

  setSelectedColor(color) {
    this.selectedColor = color;
  },

  setPalette(newPalette) {
    this.palette = [...newPalette];
  },

  addColorToPalette(colorObj) {
    if (!this.palette.find(c => c.value === colorObj.value)) {
      this.palette.push(colorObj);
    }
  }
};

// Initialize current theme (THEMES will be set later by themeManager)
if (typeof THEMES !== 'undefined') {
  ThemeState.currentTheme = THEMES.find((t) => t.id === ThemeState.currentThemeId);
}

// ============================================================================
// BACKGROUND PARSING & RENDERING
// ============================================================================

/**
 * Parse background description to standard format
 * @param {any} description - Background description from theme
 * @param {string} themeKey - Theme identifier for error messages
 * @returns {Object|null} Standardized background object
 */
function parseBackground(description, themeKey) {
  if (!description) return null;

  // If already an object with type/value, use it (for C1, C3)
  if (typeof description === "object" && description.type) {
    return description;
  }

  // Handle string descriptions
  if (typeof description === "string") {
    // Simple color
    if (description.startsWith("#") || description.startsWith("rgb")) {
      return { type: "color", value: description };
    }

    // Gradient (assumed to be CSS gradient string)
    if (description.includes("gradient")) {
      return { type: "gradient", value: description };
    }

    // Pattern
    if (description.includes("pattern") || description.includes("grid") || description.includes("dots")) {
      return { type: "pattern", value: description };
    }

    // Image URL
    if (description.startsWith("http") || description.startsWith("data:") || description.includes(".")) {
      return { type: "image", value: description };
    }
  }

  console.warn(`Unrecognized background format in theme ${themeKey}:`, description);
  return null;
}

/**
 * Apply a theme to the application
 * @param {string} themeId - Theme ID to apply
 */
function applyTheme(themeId) {
  window.themeManager.applyTheme(themeId);
}

/**
 * Get the current theme
 * @returns {Object} Current theme object
 */
function getCurrentTheme() {
  return window.themeManager.getCurrentTheme();
}

/**
 * Get the current theme ID
 * @returns {string} Current theme ID
 */
function getCurrentThemeId() {
  return window.themeManager.getCurrentThemeId();
}

/**
 * Get available themes
 * @returns {Array} Array of available themes
 */
function getThemes() {
  return window.themeManager.getThemes();
}

/**
 * Get current color palette
 * @returns {Array} Current color palette
 */
function getPalette() {
  return window.themeManager.getPalette();
}

/**
 * Get selected color
 * @returns {string} Currently selected color
 */
function getSelectedColor() {
  return window.themeManager.getSelectedColor();
}

/**
 * Set selected color
 * @param {string} color - Color value to select
 */
function setSelectedColor(color) {
  window.themeManager.setSelectedColor(color);
}

/**
 * Add color to palette
 * @param {Object} colorObj - Color object with name and value
 */
function addColorToPalette(colorObj) {
  window.themeManager.addColorToPalette(colorObj);
}

// ============================================================================
// THEME RENDERING
// ============================================================================

/**
 * Render theme selector UI
 */
function renderThemeSelector() {
  const themeSelector = document.getElementById("theme-selector");
  if (!themeSelector) return;

  themeSelector.innerHTML = "";

  const themes = window.themeManager.getThemes();
  themes.forEach((theme) => {
    const option = document.createElement("option");
    option.value = theme.id;
    option.textContent = theme.name;
    if (theme.id === window.themeManager.getCurrentThemeId()) {
      option.selected = true;
    }
    themeSelector.appendChild(option);
  });

  // Set up change handler
  themeSelector.onchange = (e) => {
    applyTheme(e.target.value);
    if (typeof saveState === 'function') {
      saveState();
    }
  };
}

// ============================================================================
// THEME LOADING
// ============================================================================

/**
 * Load embedded fallback themes
 */
async function loadEmbeddedThemes() {
  const themeData = EMBEDDED_THEME_DATA;

  // Process the embedded theme data
  Object.entries(themeData).forEach(([key, theme]) => {
    const themeObj = {
      id: key,
      name: theme.name || theme['theme-name'] || key,
      colors: (theme['color-list'] || theme['color_list'] || []).map((color, index) => ({
        name: `Theme Color ${index + 1}`,
        value: color
      })),
      textColor: theme.textColor || '#FFFFFF'
    };

    // Handle background
    if (theme.background) {
      const bg = theme.background;
      themeObj.background = {
        type: bg.type || 'solid'
      };

      // Handle different background formats
      if (bg.value) {
        themeObj.background.value = bg.value;
      } else if (bg.colors && Array.isArray(bg.colors)) {
        if (bg.type === 'linear-gradient') {
          const direction = bg.direction || 'to bottom';
          themeObj.background.value = `linear-gradient(${direction}, ${bg.colors.join(', ')})`;
        } else if (bg.type === 'radial-gradient') {
          themeObj.background.value = `radial-gradient(circle, ${bg.colors.join(', ')})`;
        } else {
          themeObj.background.value = `linear-gradient(to bottom, ${bg.colors.join(', ')})`;
        }
      } else {
        themeObj.background.value = '#0d1117';
      }

      // Handle additional background properties
      if (bg.texture) {
        themeObj.background.texture = bg.texture;
      }
      if (typeof bg.textureOpacity === 'number') {
        themeObj.background.textureOpacity = bg.textureOpacity;
      }
    }

    // Special handling for known themes
    if (key === 'G1') {
      themeObj.colors = [
        { name: "Black", value: "#000000" },
        { name: "Dark Gray", value: "#1A1A1A" },
        { name: "Gray", value: "#4A4A4A" },
        { name: "Orange", value: "#FF4500" },
        { name: "Gold", value: "#FFD700" },
        { name: "Sky Blue", value: "#00BFFF" },
        { name: "Forest Green", value: "#228B22" },
        { name: "Blue Violet", value: "#8A2BE2" },
        { name: "Crimson", value: "#DC143C" }
      ];
    } else if (key === 'G2') {
      themeObj.colors = [
        { name: "Dark Blue", value: "#0A0F1A" },
        { name: "Dark Blue Gray", value: "#1C2331" },
        { name: "Cyan", value: "#00FFFF" },
        { name: "Magenta", value: "#FF00FF" },
        { name: "Lime Green", value: "#00FF00" },
        { name: "Yellow", value: "#FFFF00" },
        { name: "Hot Pink", value: "#FF69B4" },
        { name: "Indigo", value: "#4B0082" },
        { name: "Light Sea Green", value: "#20B2AA" }
      ];
    }

    // Add to THEMES array
    const existingIndex = THEMES.findIndex(t => t.id === key);
    if (existingIndex >= 0) {
      THEMES[existingIndex] = themeObj;
    } else {
      THEMES.push(themeObj);
    }
  });

  console.log(`Loaded ${Object.keys(themeData).length} embedded themes`);
  THEMES.forEach(theme => {
    console.log(`Theme ${theme.id}: ${theme.name} (${theme.colors?.length || 0} colors)`);
  });

  // Apply default theme colors to global DEFAULT_COLORS
  const defaultTheme = THEMES.find(t => t.id === 'default');
  if (defaultTheme && defaultTheme.colors) {
    window.DEFAULT_COLORS = [...defaultTheme.colors];
  }
}

/**
 * Helper to process raw theme objects into the themeManager
 * @param {Object} themeData - Raw theme data object
 */
function processThemeData(themeData) {
  Object.entries(themeData).forEach(([key, theme]) => {
    const themeObj = {
      id: key,
      name: theme.name || theme['theme-name'] || key,
      colors: (theme['color-list'] || theme['color_list'] || []).map((color, index) => ({
        name: `Color ${index + 1}`,
        value: color
      })),
      textColor: theme.textColor || '#FFFFFF',
      background: theme.background ? parseBackground(theme.background, key) : null
    };

    // Add to themeManager (it handles duplicates)
    const existingIndex = window.themeManager.themes.findIndex(t => t.id === key);
    if (existingIndex >= 0) {
      window.themeManager.themes[existingIndex] = themeObj;
    } else {
      window.themeManager.themes.push(themeObj);
    }
  });
}

/**
 * Load themes from JSON file or fallback to embedded
 * @returns {Promise} Promise that resolves when themes are loaded
 */
/**
 * Main entry point for loading theme data
 */
async function loadThemes() {
  console.log('🔄 Loading themes...');

  try {
    const response = await fetch('themes/themes.json');
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const themeData = await response.json();
    processThemeData(themeData);
    console.log('✅ Themes loaded from server');
  } catch (error) {
    console.warn('⚠️ Fetch failed, using embedded fallback');
    processThemeData(EMBEDDED_THEME_DATA);
  }

  // Load custom themes and icons
  window.themeManager.loadFromStorage();
  window.themeManager.loadCustomIcons();

  // Ensure UI is synced after data is processed
  renderThemeSelector();
}

// ============================================================================
// THEME INITIALIZATION
// ============================================================================

/**
 * Apply saved theme with color restoration (called after state loading)
 * @param {string} themeId - Theme ID to apply
 * @param {string} savedSelectedColor - Previously selected color hex
 */
function applySavedThemeWithColor(themeId, savedSelectedColor) {
  const themes = window.themeManager.getThemes();
  const targetTheme = themes.find((t) => t.id === themeId) || themes[0];

  if (targetTheme) {
    // Apply theme through themeManager
    window.themeManager.applyTheme(targetTheme.id);

    // Override the selected color if it was explicitly saved
    if (savedSelectedColor) {
      window.themeManager.setSelectedColor(savedSelectedColor);
    }
  }
}

// ============================================================================
// THEME INITIALIZATION
// ============================================================================

/**
 * Initialize theme system
 */
function initializeThemes() {
  console.log('🎨 initializeThemes() called');
  // Load saved theme if available
  loadSavedTheme();
  renderThemeSelector();
}

/**
 * Load saved theme from localStorage
 */
function loadSavedTheme() {
  // This is handled in state.js loadState function
  // Theme application happens after state is loaded
}

/**
 * Apply saved theme (called after state loading)
 * @param {string} themeId - Theme ID to apply
 */
function applySavedTheme(themeId) {
  if (themeId && themeId !== ThemeState.currentThemeId) {
    applyTheme(themeId);
  }
}

/**
 * Draw theme background on canvas (for canvas-based backgrounds)
 */
function drawThemeBackground() {
  // This function would handle canvas-based background drawing
  // For now, it can be a placeholder since most backgrounds are CSS-based
  // The canvas is typically cleared with ctx.clearRect() in the main draw function
}

/**
 * Apply theme background to the application using CSS variables
 * @param {Object} theme - Theme object with background and textColor property
 */
function applyThemeBackground(theme) {
  const root = document.documentElement;

  if (!theme || !theme.background) {
    root.style.setProperty('--theme-bg', "#0d1117");
    root.style.setProperty('--theme-text', "#ffffff");
    return;
  }

  const bg = theme.background;
  let cssValue = bg.value || "#0d1117";

  // Handle specific formatting for gradients if they aren't pre-formatted
  if (bg.type === "linear-gradient" && Array.isArray(bg.colors)) {
    cssValue = `linear-gradient(${bg.direction || 'to bottom'}, ${bg.colors.join(', ')})`;
  }

  root.style.setProperty('--theme-bg', cssValue);
  root.style.setProperty('--theme-text', theme.textColor || "#ffffff");

  // Optional: Update a primary accent color from the first palette color
  if (theme.colors && theme.colors.length > 0) {
    root.style.setProperty('--theme-accent', theme.colors[0].value);
  }
}

// ============================================================================
// LEGACY COMPATIBILITY
// ============================================================================

// Export functions that might be called from other modules
// These maintain backward compatibility

// Global exports for theme functionality (backward compatibility)
window.THEMES = window.themeManager.getThemes();
window.applyTheme = applyTheme;
window.getCurrentTheme = getCurrentTheme;
window.initializeThemes = initializeThemes;
window.applySavedThemeWithColor = applySavedThemeWithColor;
