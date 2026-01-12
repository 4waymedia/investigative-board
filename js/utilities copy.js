// ============================================================================
// UTILITIES - Global utility functions for the application
// ============================================================================

// ============================================================================
// COLOR UTILITIES
// ============================================================================

/**
 * Lighten a hex color by a percentage
 * @param {string} color - Hex color string
 * @param {number} percent - Percentage to lighten (0-100)
 * @returns {string} Lightened hex color
 */
function lightenColor(color, percent) {
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
 * @param {string} hex - Hex color string
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
// COORDINATE TRANSFORMATION UTILITIES
// ============================================================================

/**
 * Convert world coordinates to screen coordinates
 * @param {number} wx - World X coordinate
 * @param {number} wy - World Y coordinate
 * @returns {Object} Screen coordinates {x, y}
 */
function worldToScreen(wx, wy) {
  return {
    x: wx * scale + offsetX,
    y: wy * scale + offsetY,
  };
}

/**
 * Convert screen coordinates to world coordinates
 * @param {number} sx - Screen X coordinate
 * @param {number} sy - Screen Y coordinate
 * @returns {Object} World coordinates {x, y}
 */
function screenToWorld(sx, sy) {
  return {
    x: (sx - offsetX) / scale,
    y: (sy - offsetY) / scale,
  };
}
