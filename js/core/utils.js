// ============================================================================
// UTILS MODULE - Utility functions for coordinate transforms and color manipulation
// ============================================================================

// DrawingUtils will be exported at the end after all functions are defined

// ============================================================================
// COORDINATE TRANSFORMATION FUNCTIONS
// ============================================================================

/**
 * Convert world coordinates to screen coordinates
 * @param {number} wx - World X coordinate
 * @param {number} wy - World Y coordinate
 * @param {Object} state - Application state with scale, offsetX, offsetY
 * @returns {Object} Screen coordinates {x, y}
 */
function worldToScreen(wx, wy, state) {
  return {
    x: wx * state.scale + state.offsetX,
    y: wy * state.scale + state.offsetY,
  };
}

/**
 * Convert screen coordinates to world coordinates
 * @param {number} sx - Screen X coordinate
 * @param {number} sy - Screen Y coordinate
 * @param {Object} state - Application state with scale, offsetX, offsetY
 * @returns {Object} World coordinates {x, y}
 */
function screenToWorld(sx, sy, state) {
  return {
    x: (sx - state.offsetX) / state.scale,
    y: (sy - state.offsetY) / state.scale,
  };
}

// ============================================================================
// COLOR MANIPULATION FUNCTIONS
// ============================================================================

function lightenColor(color, percent) {
  // Simple color lightening
  const num = parseInt(color.replace("#", ""), 16);
  const amt = Math.round(2.55 * percent);
  const R = (num >> 16) + amt;
  const G = ((num >> 8) & 0x00ff) + amt;
  const B = (num & 0x0000ff) + amt;
  return (
    "#" +
    (
      0x1000000 +
      (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 +
      (G < 255 ? (G < 1 ? 0 : G) : 255) * 0x100 +
      (B < 255 ? (B < 1 ? 0 : B) : 255)
    )
      .toString(16)
      .slice(1)
  );
}

/**
 * Darken a hex color by a percentage
 * @param {string} hex - Hex color string (e.g., "#ff0000")
 * @param {number} percent - Percentage to darken (0-100)
 * @returns {string} Darkened hex color
 */
function darkenColor(hex, percent) {
  const num = parseInt(hex.slice(1), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.max(0, Math.min(255, (num >> 16) - amt));
  const G = Math.max(0, Math.min(255, ((num >> 8) & 0x00ff) - amt));
  const B = Math.max(0, Math.min(255, (num & 0x0000ff) - amt));
  return "#" + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
}

/**
 * Generate light, dark, and contrast variants of a color
 * @param {string} hex - Base hex color
 * @returns {Object} Object with light, contrast, and dark variants
 */
function generateColorVariants(hex) {
  return {
    light: lightenColor(hex, 40),
    contrast: hex,
    dark: darkenColor(hex, 30),
  };
}

// ============================================================================
// CANVAS DRAWING UTILITIES
// ============================================================================

/**
 * Create a rounded rectangle path on a canvas context
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {number} x - X position
 * @param {number} y - Y position
 * @param {number} w - Width
 * @param {number} h - Height
 * @param {number} r - Corner radius
 */
function roundRectPath(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

// ============================================================================
// MATH UTILITIES
// ============================================================================

/**
 * Clamp a value between min and max
 * @param {number} value - Value to clamp
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} Clamped value
 */
function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

/**
 * Linear interpolation between two values
 * @param {number} a - Start value
 * @param {number} b - End value
 * @param {number} t - Interpolation factor (0-1)
 * @returns {number} Interpolated value
 */
function lerp(a, b, t) {
  return a + (b - a) * t;
}

// ============================================================================
// GLOBAL EXPORTS
// ============================================================================

// ============================================================================
// PIN METRICS UTILITIES
// ============================================================================

/**
 * Get metrics for a pin including shape, dimensions, and visual properties
 * @param {Object} pin - Pin object with typeId, pinScale, etc.
 * @returns {Object} Metrics object with shape, radius, width, height, etc.
 */
function getPinMetrics(pin) {
  const typeId = pin.typeId || "pin:circle";
  const base = window.PIN_BASES?.[typeId];

  if (!base) {
    return {
      shape: "circle",
      baseRadius: 9,
      variant: "circle",
      radius: 9,
      width: 18,
      height: 18,
    };
  }

  // Get node type details
  const typeDetail = window.NodeTypesAPI?.getNodeType(typeId) || { variant: "circle" };

  // All pins can scale, but area pins use areaScale for the area size and pinScale for the icon
  const pinScale = pin.pinScale || 1;
  const areaScale = pin.areaScale || 1;

  // For area pins, area dimensions use areaScale, icon uses pinScale
  // For regular pins, everything uses pinScale
  const isArea = typeId.startsWith("area:");
  const dimensionScale = isArea ? areaScale : pinScale;

  return {
    shape: base.shape,
    baseRadius: base.baseRadius,
    variant: typeDetail.variant,
    radius: (pin.radius || base.baseRadius) * dimensionScale,
    width: (pin.width || base.baseRadius * 2) * dimensionScale,
    height: (pin.height || base.baseRadius * 2) * dimensionScale,
  };
}

/**
 * Parse a date string into a timestamp
 * @param {string} dateStr - Date string to parse
 * @returns {number|null} Timestamp or null if invalid
 */
function parseDate(dateStr) {
  if (!dateStr) return null;
  const yearMatch = dateStr.match(/\d{4}/);
  if (yearMatch) return new Date(yearMatch[0], 0, 1).getTime();
  const parsed = Date.parse(dateStr);
  return isNaN(parsed) ? null : parsed;
}

// ============================================================================
// GLOBAL EXPORTS
// ============================================================================

// Make utilities available globally
window.DrawingUtils = {
  // Coordinate transformation functions
  worldToScreen,
  screenToWorld,

  // Color manipulation functions
  lightenColor,
  darkenColor,
  generateColorVariants,

  // Canvas drawing utilities
  roundRectPath,

  // Math utilities
  clamp,
  lerp,
};

// Individual exports for backward compatibility
window.worldToScreen = worldToScreen;
window.screenToWorld = screenToWorld;
window.lightenColor = lightenColor;
window.darkenColor = darkenColor;
window.generateColorVariants = generateColorVariants;
window.roundRectPath = roundRectPath;
window.clamp = clamp;
window.lerp = lerp;
window.getPinMetrics = getPinMetrics;
window.parseDate = parseDate;
