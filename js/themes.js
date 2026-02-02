// ============================================================================
// THEMES MODULE - Legacy compatibility layer
// ============================================================================
// This module provides backward compatibility for the old theme API.
// The main theme system is now in js/core/schema.js (SchemaManager).
// ============================================================================

// ============================================================================
// THEME BACKGROUND APPLICATION
// ============================================================================

/**
 * Apply theme background using the BackgroundBuilder
 * Called by SchemaManager.applyThemeToUI()
 * @param {Object} theme - Theme object with background property
 */
function applyThemeBackground(theme) {
  const root = document.documentElement;

  // Set text color CSS variable
  const textColor = theme?.ui?.text || theme?.textColor || "#ffffff";
  root.style.setProperty('--theme-text', textColor);
  window._currentThemeTextColor = textColor;

  // Set accent color from first color slot
  if (theme?.colorSlots) {
    const firstSlot = Object.values(theme.colorSlots)[0];
    if (firstSlot) {
      root.style.setProperty('--theme-accent', firstSlot.value);
    }
  }

  // Use BackgroundBuilder for layered backgrounds
  if (window.backgroundBuilder) {
    if (theme?.background) {
      window.backgroundBuilder.apply(theme.background);
    } else if (theme?.canvas?.background) {
      // Fallback to simple solid color
      window.backgroundBuilder.apply({ 
        layers: [{ type: "solid", color: theme.canvas.background }] 
      });
    } else {
      window.backgroundBuilder.apply('dark-default');
    }
    return;
  }

  // Fallback if backgroundBuilder not loaded
  const container = document.getElementById('canvas-container');
  if (!container) return;

  if (!theme?.background && !theme?.canvas?.background) {
    container.style.background = "#0d1117";
    root.style.setProperty('--theme-bg', "#0d1117");
    return;
  }

  const bgColor = theme.canvas?.background || "#0d1117";
  container.style.background = bgColor;
  root.style.setProperty('--theme-bg', bgColor);
}

// ============================================================================
// THEME SELECTOR RENDERING (for legacy dropdowns)
// ============================================================================

/**
 * Render theme selector dropdown
 * Used by older UI components
 */
function renderThemeSelector() {
  const themeSelector = document.getElementById("theme-selector");
  if (!themeSelector) return;

  themeSelector.innerHTML = "";

  const themes = window.schemaManager?.getThemes() || [];
  const currentId = window.schemaManager?.getCurrentThemeId() || "dark";
  
  themes.forEach((theme) => {
    const option = document.createElement("option");
    option.value = theme.id;
    option.textContent = theme.name;
    if (theme.id === currentId) {
      option.selected = true;
    }
    themeSelector.appendChild(option);
  });

  // Set up change handler
  themeSelector.onchange = (e) => {
    if (window.schemaManager) {
      window.schemaManager.setTheme(e.target.value, true);
    }
    if (window.app?.saveState) {
      window.app.saveState();
    }
  };
}

// ============================================================================
// INITIALIZATION
// ============================================================================

/**
 * Initialize themes (called on app startup)
 */
function initializeThemes() {
  // Schema system handles most initialization now
  if (window.schemaManager) {
    // Load saved theme
    const savedTheme = localStorage.getItem("msc-current-theme");
    if (savedTheme) {
      window.schemaManager.setTheme(savedTheme, false);
    }
  }
  
  // Render legacy selectors if present
  renderThemeSelector();
}

/**
 * Apply saved theme with specific color
 * @param {string} themeId - Theme ID
 * @param {string} savedSelectedColor - Previously selected color
 */
function applySavedThemeWithColor(themeId, savedSelectedColor) {
  if (window.schemaManager) {
    window.schemaManager.setTheme(themeId, false);
    
    if (savedSelectedColor) {
      window.schemaManager.setSelectedColor(savedSelectedColor);
    }
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

window.applyThemeBackground = applyThemeBackground;
window.renderThemeSelector = renderThemeSelector;
window.initializeThemes = initializeThemes;
window.applySavedThemeWithColor = applySavedThemeWithColor;

console.log("✅ Theme compatibility layer loaded");
