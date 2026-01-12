// ============================================================================
// UTILS MODULE - Utility functions for coordinate transforms and color manipulation
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
export function worldToScreen(wx, wy, state) {
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
export function screenToWorld(sx, sy, state) {
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

function darkenColor(hex, percent) {
  const num = parseInt(hex.slice(1), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.max(0, Math.min(255, (num >> 16) - amt));
  const G = Math.max(0, Math.min(255, ((num >> 8) & 0x00ff) - amt));
  const B = Math.max(0, Math.min(255, (num & 0x0000ff) - amt));
  return "#" + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
}

/**
 * Darken a hex color by a percentage
 * @param {string} hex - Hex color string (e.g., "#ff0000")
 * @param {number} percent - Percentage to darken (0-100)
 * @returns {string} Darkened hex color
 */
export function darkenColor(hex, percent) {
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
export function generateColorVariants(hex) {
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
export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

/**
 * Linear interpolation between two values
 * @param {number} a - Start value
 * @param {number} b - End value
 * @param {number} t - Interpolation factor (0-1)
 * @returns {number} Interpolated value
 */
export function lerp(a, b, t) {
  return a + (b - a) * t;
}
