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
// THEME DEFINITIONS
// ============================================================================

// Theme structure: { id, name, colors: [{name, value}], background?: {type: 'color'|'image'|'gradient'|'pattern', value: string} }
const THEMES = [
  {
    id: "default",
    name: "Default",
    colors: [...defaultColors],
    // background will be undefined/null for default (uses existing canvas clear)
  },
];

// ============================================================================
// THEME STATE MANAGEMENT
// ============================================================================

let currentThemeId = "default"; // Currently active theme
let currentTheme = THEMES.find((t) => t.id === currentThemeId);

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
  const theme = THEMES.find((t) => t.id === themeId);
  if (!theme) {
    console.warn(`Theme ${themeId} not found`);
    return;
  }

  currentThemeId = themeId;
  currentTheme = theme;

  // Apply color palette
  if (theme.colors && theme.colors.length > 0) {
    palette = [...theme.colors];
    // Update global DEFAULT_COLORS so toolbar/tray use theme colors
    window.DEFAULT_COLORS = [...theme.colors];
    // Ensure selectedColor is valid for new theme
    if (!palette.find(c => c.value === selectedColor)) {
      selectedColor = palette[0].value;
    }
  }

  // Apply background
  applyThemeBackground(theme);

  // Update UI elements that depend on theme
  // Note: renderMenu() is not called here because ToolbarManager handles its own rendering
  if (window.app && window.app.updatePinInfo) {
    window.app.updatePinInfo();
  }
  draw();
}

/**
 * Get the current theme
 * @returns {Object} Current theme object
 */
function getCurrentTheme() {
  return currentTheme;
}

/**
 * Get the current theme ID
 * @returns {string} Current theme ID
 */
function getCurrentThemeId() {
  return currentThemeId;
}

/**
 * Get available themes
 * @returns {Array} Array of available themes
 */
function getThemes() {
  return THEMES;
}

/**
 * Get current color palette
 * @returns {Array} Current color palette
 */
function getPalette() {
  return palette;
}

/**
 * Get selected color
 * @returns {string} Currently selected color
 */
function getSelectedColor() {
  return selectedColor;
}

/**
 * Set selected color
 * @param {string} color - Color value to select
 */
function setSelectedColor(color) {
  selectedColor = color;
}

/**
 * Add color to palette
 * @param {Object} colorObj - Color object with name and value
 */
function addColorToPalette(colorObj) {
  if (!palette.find(c => c.value === colorObj.value)) {
    palette.push(colorObj);
  }
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

  THEMES.forEach((theme) => {
    const option = document.createElement("option");
    option.value = theme.id;
    option.textContent = theme.name;
    if (theme.id === currentThemeId) {
      option.selected = true;
    }
    themeSelector.appendChild(option);
  });

  // Set up change handler
  themeSelector.onchange = (e) => {
    applyTheme(e.target.value);
    saveState();
  };
}

// ============================================================================
// THEME LOADING
// ============================================================================

/**
 * Load themes from JSON file
 * @returns {Promise} Promise that resolves when themes are loaded
 */
async function loadThemes() {
  try {
    const response = await fetch('themes/themes.json');
    if (!response.ok) {
      console.warn('Could not load themes.json, using default themes');
      return;
    }

    const themeData = await response.json();

    // Convert JSON theme format to internal format
    Object.entries(themeData).forEach(([key, theme]) => {
      const themeObj = {
        id: key,
        name: theme.name || key,
        colors: (theme['color-list'] || []).map(color => ({
          name: color,
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
          // Direct value (solid colors, CSS gradients)
          themeObj.background.value = bg.value;
        } else if (bg.colors && Array.isArray(bg.colors)) {
          // Gradient from colors array
          if (bg.type === 'linear-gradient') {
            const direction = bg.direction || 'to bottom';
            themeObj.background.value = `linear-gradient(${direction}, ${bg.colors.join(', ')})`;
          } else if (bg.type === 'radial-gradient') {
            themeObj.background.value = `radial-gradient(circle, ${bg.colors.join(', ')})`;
          } else {
            // Fallback
            themeObj.background.value = `linear-gradient(to bottom, ${bg.colors.join(', ')})`;
          }
        } else {
          // Default fallback
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
        // Investigative Noir
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
        // Sci-Fi Futuristic
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

      // Add to THEMES array if not already present
      const existingIndex = THEMES.findIndex(t => t.id === key);
      if (existingIndex >= 0) {
        THEMES[existingIndex] = themeObj;
      } else {
        THEMES.push(themeObj);
      }
    });

    console.log(`Loaded ${Object.keys(themeData).length} themes from themes.json`);

    // Apply default theme colors to global DEFAULT_COLORS
    const defaultTheme = THEMES.find(t => t.id === 'default');
    if (defaultTheme && defaultTheme.colors) {
      window.DEFAULT_COLORS = [...defaultTheme.colors];
    }
  } catch (error) {
    console.error('Error loading themes:', error);
  }
}

// ============================================================================
// THEME INITIALIZATION
// ============================================================================

/**
 * Initialize theme system
 */
function initializeThemes() {
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
 * Apply saved theme with color restoration (called after state loading)
 * @param {string} themeId - Theme ID to apply
 * @param {string} selectedColor - Previously selected color
 */
function applySavedThemeWithColor(themeId, selectedColor) {
  const themes = getThemes();
  const savedTheme = themes.find((t) => t.id === themeId);

  if (savedTheme) {
    // Apply theme colors without calling applyTheme to avoid saveState recursion
    // Apply CSS background
    applyThemeBackground(savedTheme);

    // Update theme state
    // Clear current palette and add theme colors
    palette.length = 0; // Clear array
    savedTheme.colors.forEach(color => addColorToPalette(color)); // Add each color

    // Set selected color
    const currentPalette = getPalette();
    if (currentPalette.length > 0 && selectedColor) {
      // Check if saved color exists in theme, otherwise use first theme color
      const colorExists = currentPalette.some(
        (c) => c.value === selectedColor
      );
      setSelectedColor(colorExists
        ? selectedColor
        : currentPalette[0].value);
    } else if (currentPalette.length > 0) {
      setSelectedColor(currentPalette[0].value);
    }
  } else {
    // No saved theme found, apply default theme background
    const defaultTheme = themes[0];
    if (defaultTheme) {
      applyThemeBackground(defaultTheme);
    }
  }
}

/**
 * Apply saved theme (called after state loading)
 * @param {string} themeId - Theme ID to apply
 */
function applySavedTheme(themeId) {
  if (themeId && themeId !== currentThemeId) {
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
 * Apply theme background to canvas container
 * @param {Object} theme - Theme object with background property
 */
function applyThemeBackground(theme) {
  const canvasContainer = document.getElementById("canvas-container");

  if (!theme || !theme.background || !canvasContainer) {
    // Set default background
    if (canvasContainer) {
      canvasContainer.style.background = "#0d1117"; // Default
    }
    return;
  }

  const bg = theme.background;
  let cssBackground = "";

  // Convert theme background to CSS
  if (bg.type === "solid" || bg.type === "color") {
    cssBackground = bg.value || "#0d1117";
  } else if (bg.type === "gradient" || bg.type === "linear-gradient") {
    cssBackground = bg.value || `linear-gradient(to bottom, #0d1117, #1a1f2e)`;
  } else if (bg.type === "radial-gradient") {
    cssBackground = bg.value || `radial-gradient(circle at center, #0d1117 0%, #1a1f2e 100%)`;
  } else if (bg.type === "pattern") {
    // For patterns, we might need more complex logic
    cssBackground = bg.value || "#0d1117";
  } else {
    cssBackground = bg.value || "#0d1117";
  }

  canvasContainer.style.background = cssBackground;
}

// ============================================================================
// LEGACY COMPATIBILITY
// ============================================================================

// Export functions that might be called from other modules
// These maintain backward compatibility

// Global exports for theme functionality
window.THEMES = THEMES;
window.applyTheme = applyTheme;
window.getCurrentTheme = getCurrentTheme;
window.initializeThemes = initializeThemes;
