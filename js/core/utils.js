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
function worldToScreen(wx, wy, { scale, offsetX, offsetY }) {
  return {
    x: wx * scale + offsetX,
    y: wy * scale + offsetY,
  };
}

/**
 * Convert screen coordinates to world coordinates
 * @param {number} sx - Screen X coordinate
 * @param {number} sy - Screen Y coordinate
 * @param {Object} state - Application state with scale, offsetX, offsetY
 * @returns {Object} World coordinates {x, y}
 */
function screenToWorld(sx, sy, { scale, offsetX, offsetY }) {
  return {
    x: (sx - offsetX) / scale,
    y: (sy - offsetY) / scale,
  };
}

// ============================================================================
// COLOR MANIPULATION FUNCTIONS
// ============================================================================

function lightenColor(color, percent) {
  // Validate hex color format
  const hexRegex = /^#([A-Fa-f0-9]{3}){1,2}$/;
  if (!hexRegex.test(color)) {
    console.warn(`Invalid hex color: ${color}, returning original`);
    return color;
  }

  // Expand 3-digit hex to 6-digit
  let hex = color.slice(1);
  if (hex.length === 3) {
    hex = hex.split('').map(char => char + char).join('');
  }

  const num = parseInt(hex, 16);
  const amt = Math.round(2.55 * percent);

  const R = Math.max(0, Math.min(255, (num >> 16) + amt));
  const G = Math.max(0, Math.min(255, ((num >> 8) & 0x00ff) + amt));
  const B = Math.max(0, Math.min(255, (num & 0x0000ff) + amt));

  return "#" + ((R << 16) | (G << 8) | B).toString(16).padStart(6, '0');
}

/**
 * Darken a hex color by a percentage
 * @param {string} hex - Hex color string (e.g., "#ff0000")
 * @param {number} percent - Percentage to darken (0-100)
 * @returns {string} Darkened hex color
 */
function darkenColor(hex, percent) {
  // Validate hex color format
  const hexRegex = /^#([A-Fa-f0-9]{3}){1,2}$/;
  if (!hexRegex.test(hex)) {
    console.warn(`Invalid hex color: ${hex}, returning original`);
    return hex;
  }

  // Expand 3-digit hex to 6-digit
  let hexValue = hex.slice(1);
  if (hexValue.length === 3) {
    hexValue = hexValue.split('').map(char => char + char).join('');
  }

  const num = parseInt(hexValue, 16);
  const amt = Math.round(2.55 * percent);

  const R = Math.max(0, Math.min(255, (num >> 16) - amt));
  const G = Math.max(0, Math.min(255, ((num >> 8) & 0x00ff) - amt));
  const B = Math.max(0, Math.min(255, (num & 0x0000ff) - amt));

  return "#" + ((R << 16) | (G << 8) | B).toString(16).padStart(6, '0');
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
  // Ensure radius doesn't exceed half the dimensions to prevent invalid geometry
  r = Math.min(r, w / 2, h / 2);

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
/**
 * Update pin scales based on connection counts (connection-driven growth)
 * @param {Array} pins - Array of pin objects
 * @param {Array} connections - Array of connection objects
 */
function updatePinScales(pins, connections) {
  console.log(`🎯 updatePinScales called with ${pins.length} pins, ${connections.length} connections`);

  // Prevent excessive calls that could cause rendering loops
  const now = Date.now();
  if (window._lastScaleUpdate && now - window._lastScaleUpdate < 100) {
    console.log(`⚠️ updatePinScales called too frequently, skipping`);
    return;
  }
  window._lastScaleUpdate = now;

  // Safe guard for API dependency
  if (!window.ConnectionsAPI?.getConnectionCount) {
    console.warn(`⚠️ ConnectionsAPI not available, skipping pin scale updates`);
    return;
  }

  pins.forEach((pin, index) => {
    if (!pin) return; // Skip invalid pins

    const connectionCount = window.ConnectionsAPI.getConnectionCount(index, connections) || 0;
    console.log(`📊 Pin ${index} has ${connectionCount} connections`);

    // Scale formula: Base 1.0, add 0.1 for every 2 connections, max 1.4
    const scaleMultiplier = 1 + (Math.floor(connectionCount / 2) * 0.1);
    const newScale = clamp(scaleMultiplier, 0.5, 1.4);

    // Validate the new scale is a valid number
    if (isNaN(newScale) || !isFinite(newScale)) {
      console.error(`❌ Invalid scale calculated for pin ${index}: ${newScale}, using 1.0`);
      pin.pinScale = 1.0;
      return;
    }

    const oldScale = pin.pinScale || 1;
    pin.pinScale = newScale;

    // Debug logging for scaling changes
    if (oldScale !== newScale) {
      console.log(`📏 Pin ${index} SCALED: ${oldScale} → ${newScale} (connections: ${connectionCount})`);
    }
  });
}

function getPinMetrics(pin, config = {}) {
  // SPECIAL CASE: Text pins (bubble/rectangle) use pin.shape directly
  if (pin.shape === 'bubble' || pin.shape === 'rectangle') {
    return {
      shape: pin.shape,
      baseRadius: 9,
      variant: pin.shape,
      radius: Math.min(pin.width || 120, pin.height || 60) / 2,
      width: pin.width || (pin.shape === 'bubble' ? 120 : 100),
      height: pin.height || (pin.shape === 'bubble' ? 60 : 40),
    };
  }

  const typeId = pin.typeId || "pin:circle";
  const pinBases = config.pinBases || window.PIN_BASES;
  const base = pinBases?.[typeId];

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

  // Get node type details - prefer config API over global
  const nodeTypesAPI = config.nodeTypesAPI || window.NodeTypesAPI;
  const typeDetail = nodeTypesAPI?.getNodeType(typeId) || { variant: "circle" };

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
  if (!dateStr || typeof dateStr !== 'string') return null;

  // Trim whitespace
  dateStr = dateStr.trim();

  // Try to extract a 4-digit year more robustly
  const yearMatch = dateStr.match(/\b(\d{4})\b/);
  if (yearMatch) {
    const year = parseInt(yearMatch[1], 10);
    // Validate reasonable year range
    if (year >= 1900 && year <= 2100) {
      return new Date(year, 0, 1).getTime();
    }
  }

  // Try standard Date parsing for more complex formats
  const parsed = Date.parse(dateStr);
  if (!isNaN(parsed) && isFinite(parsed)) {
    // Additional validation - ensure the parsed date makes sense
    const date = new Date(parsed);
    const year = date.getFullYear();
    if (year >= 1900 && year <= 2100) {
      return parsed;
    }
  }

  return null;
}

// ============================================================================
// GLOBAL EXPORTS (No ES6 modules - loaded as regular script)
// ============================================================================

// Main DrawingUtils export to window
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

// Individual function exports for backward compatibility
window.worldToScreen = worldToScreen;
window.screenToWorld = screenToWorld;
window.lightenColor = lightenColor;
window.darkenColor = darkenColor;
window.generateColorVariants = generateColorVariants;
window.roundRectPath = roundRectPath;
window.clamp = clamp;
window.lerp = lerp;
window.getPinMetrics = getPinMetrics;
window.updatePinScales = updatePinScales;
window.parseDate = parseDate;

// ============================================================================
// BACKWARD COMPATIBILITY - Global exports
// ============================================================================

// Keep global exports for backward compatibility with existing code
window.DrawingUtils = DrawingUtils;
window.worldToScreen = worldToScreen;
window.screenToWorld = screenToWorld;
window.lightenColor = lightenColor;
window.darkenColor = darkenColor;
window.generateColorVariants = generateColorVariants;
window.roundRectPath = roundRectPath;
window.clamp = clamp;
window.lerp = lerp;
window.getPinMetrics = getPinMetrics;
window.updatePinScales = updatePinScales;
window.parseDate = parseDate;
