// ============================================================================
// DRAWING MODULE - Refactored 2025/2026 style
// ============================================================================

// Utilities are available globally from js/utilities.js via window.DrawingUtils

// ============================================================================
// COORDINATE TRANSFORMATION UTILITIES
// ============================================================================

// worldToScreen is provided globally by app.js

// screenToWorld is provided globally by app.js

// ── Global drawing phases ────────────────────────────────────────────────
const DRAW_PHASES = {
  SHADOW: "shadow",
  BACKGROUND: "background",
  MAIN: "main",
  DECORATION: "decoration",
  SELECTION: "selection",
  LABEL: "label",
  DEBUG: "debug", // optional overlay for development
};

// Helper function to convert hex color with alpha to rgba
function hexToRgba(hex, alpha = 1) {
  // Handle undefined/null hex
  if (!hex) hex = '#ffffff';
  
  // Remove # if present
  hex = hex.replace('#', '');
  
  // Handle short hex (e.g., "fff" -> "ffffff")
  if (hex.length === 3) {
    hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
  }
  
  // Parse hex values
  const r = parseInt(hex.substring(0, 2), 16) || 0;
  const g = parseInt(hex.substring(2, 4), 16) || 0;
  const b = parseInt(hex.substring(4, 6), 16) || 0;
  
  // Ensure alpha is a valid number between 0 and 1
  const a = (typeof alpha === 'number' && !isNaN(alpha)) ? Math.max(0, Math.min(1, alpha)) : 1;
  
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

// Make helper globally available
window.hexToRgba = hexToRgba;

/**
 * Calculate required dimensions for text content
 * @param {string} text - The text content
 * @param {number} fontSize - Font size in pixels
 * @param {string} fontFamily - Font family (default: system-ui)
 * @param {number} padding - Padding around text (default: 16)
 * @param {number} minWidth - Minimum width (default: 60)
 * @param {number} minHeight - Minimum height (default: 30)
 * @param {number} maxWidth - Maximum width before wrapping (default: 300)
 * @returns {Object} { width, height, lines }
 */
function calculateTextDimensions(text, fontSize = 14, fontFamily = 'system-ui', padding = 16, minWidth = 60, minHeight = 30, maxWidth = 300) {
  if (!text) {
    return { width: minWidth, height: minHeight, lines: [] };
  }

  // Create a temporary canvas for measuring
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  ctx.font = `${fontSize}px ${fontFamily}`;

  // Split text into lines (respect existing newlines)
  const paragraphs = text.split('\n');
  const lines = [];
  let maxLineWidth = 0;

  // Word wrap each paragraph
  paragraphs.forEach(paragraph => {
    if (!paragraph.trim()) {
      lines.push(''); // Empty line
      return;
    }

    const words = paragraph.split(' ');
    let currentLine = '';

    words.forEach(word => {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const metrics = ctx.measureText(testLine);
      
      if (metrics.width > maxWidth - padding * 2 && currentLine) {
        // Line is too long, start a new line
        lines.push(currentLine);
        maxLineWidth = Math.max(maxLineWidth, ctx.measureText(currentLine).width);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    });

    // Don't forget the last line
    if (currentLine) {
      lines.push(currentLine);
      maxLineWidth = Math.max(maxLineWidth, ctx.measureText(currentLine).width);
    }
  });

  // Calculate dimensions
  const lineHeight = fontSize * 1.3;
  const textHeight = lines.length * lineHeight;
  
  const width = Math.max(minWidth, Math.min(maxWidth, maxLineWidth + padding * 2));
  const height = Math.max(minHeight, textHeight + padding * 1.5);

  return { width: Math.ceil(width), height: Math.ceil(height), lines };
}

// Make globally available
window.calculateTextDimensions = calculateTextDimensions;

// ── Base shape definitions ─────────────────────────────────────────────
const baseShapes = {
  circle: {
    getMetrics: (pin, scale) => ({
      shape: "circle",
      radius: pin.radius || 9,
    }),
    drawShadow: defaultDrawShadow,
    drawBackground: defaultDrawBackground,
    drawMain: (ctx, pin, m, scr, s) => {
      const r = m.radius * s;
      ctx.save();
      ctx.fillStyle = pin.color || "#58a6ff";
      ctx.beginPath();
      // CENTERING: scr.x, scr.y is the center of the circle
      // Connection lines connect to this center point
      ctx.arc(scr.x, scr.y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#000000";
      ctx.lineWidth = 2 * s;
      ctx.stroke();
      // White highlight dot (light reflection) - 15% size, top-left quadrant, inside circle
      const highlightRadius = r * 0.15; // 15% of main circle radius
      const highlightOffset = r * 0.4; // Position toward top-left, keeping highlight inside
      ctx.fillStyle = "#FFFFFF";
      ctx.beginPath();
      ctx.arc(
        scr.x - highlightOffset,
        scr.y - highlightOffset,
        highlightRadius,
        0,
        Math.PI * 2
      );
      ctx.fill();
      ctx.restore();
    },
    drawDecoration: () => {},
    drawSelection: defaultDrawSelection,
    drawLabel: defaultDrawLabel,
  },

  rect: {
    getMetrics: (pin, scale) => ({
      shape: "rect",
      width: pin.width || 18,
      height: pin.height || 18,
      baseRadius: 3,
    }),
    drawShadow: defaultDrawShadow,
    drawBackground: defaultDrawBackground,
    drawMain: (ctx, pin, m, scr, s) => {
      const w = m.width * s;
      const h = m.height * s;
      // CENTERING FIX: Subtract half width/height so (x, y) is the CENTER of the pin
      // This ensures connection lines connect to the visual center, not the corner
      const x = scr.x - w / 2;
      const y = scr.y - h / 2;
      const r = (m.baseRadius || 3) * s;

      ctx.save();
      ctx.fillStyle = pin.color || "#58a6ff";
      window.DrawingUtils.roundRectPath(ctx, x, y, w, h, r);
      ctx.fill();
      ctx.restore();
    },
    drawDecoration: () => {},
    drawSelection: defaultDrawSelection,
    drawLabel: defaultDrawLabel,
  },

  areaCircle: {
    getMetrics: (pin, scale) => ({
      shape: "area-circle",
      radius: pin.radius || 40,
      borderWidth: pin.borderWidth || 2,
    }),
    drawShadow: (ctx, pin, m, scr, s) => {
      const r = m.radius * s;
      ctx.fillStyle = "rgba(0,0,0,0.2)";
      ctx.beginPath();
      ctx.arc(scr.x + 4 * s, scr.y + 4 * s, r, 0, Math.PI * 2);
      ctx.fill();
    },
    drawBackground: defaultDrawBackground,
    drawMain: (ctx, pin, m, scr, s) => {
      const r = m.radius * s;
      const bw = Math.min(m.borderWidth * s, r * 0.8);
      const fillR = Math.max(r - bw, 1);

      ctx.fillStyle = pin.fillColor || pin.color + "40";
      ctx.beginPath();
      ctx.arc(scr.x, scr.y, fillR, 0, Math.PI * 2);
      ctx.fill();

      if (bw > 0.1) {
        ctx.strokeStyle = pin.borderColor || pin.color;
        ctx.lineWidth = bw;
        ctx.beginPath();
        ctx.arc(scr.x, scr.y, r, 0, Math.PI * 2);
        ctx.stroke();
      }
    },
    drawDecoration: () => {},
    drawSelection: defaultDrawSelection,
    drawLabel: () => {}, // Area pins don't show labels
  },

  areaRect: {
    getMetrics: (pin, scale) => ({
      shape: "area-rect",
      width: pin.width || 100,
      height: pin.height || 100,
      borderWidth: pin.borderWidth || 2,
      baseRadius: 6,
    }),
    drawShadow: (ctx, pin, m, scr, s) => {
      const w = m.width * s;
      const h = m.height * s;
      const x = scr.x - w / 2;
      const y = scr.y - h / 2;

      ctx.fillStyle = "rgba(0,0,0,0.2)";
      window.DrawingUtils.roundRectPath(ctx, x + 4 * s, y + 4 * s, w, h, 8 * s);
      ctx.fill();
    },
    drawBackground: defaultDrawBackground,
    drawMain: (ctx, pin, m, scr, s) => {
      const w = m.width * s;
      const h = m.height * s;
      const x = scr.x - w / 2;
      const y = scr.y - h / 2;
      const bw = Math.min(m.borderWidth * s, Math.min(w, h) * 0.8);
      const fillW = Math.max(w - bw, 1);
      const fillH = Math.max(h - bw, 1);
      const fillX = scr.x - fillW / 2;
      const fillY = scr.y - fillH / 2;

      ctx.fillStyle = pin.fillColor || pin.color + "40";
      window.DrawingUtils.roundRectPath(
        ctx,
        fillX,
        fillY,
        fillW,
        fillH,
        Math.max(0, 6 * s - bw / 2)
      );
      ctx.fill();

      if (bw > 0.1) {
        ctx.strokeStyle = pin.borderColor || pin.color;
        ctx.lineWidth = bw;
        ctx.stroke();
      }
    },
    drawDecoration: () => {},
    drawSelection: defaultDrawSelection,
    drawLabel: () => {}, // Area pins don't show labels
  },
};

// Make baseShapes globally available
window.baseShapes = baseShapes;

// ── Shape renderers registry ─────────────────────────────────────────────
const shapeRenderers = new Map();
window.shapeRenderers = shapeRenderers; // Make immediately available globally

/**
 * Register a new shape type
 * @param {string} shapeName
 * @param {Object} config - Can reference baseShape or provide full implementation
 */
function registerShape(shapeName, config) {
  try {
    let rendererConfig;

    // If referencing a base shape, inherit from it
    if (config.baseShape && baseShapes[config.baseShape]) {
      const baseShape = baseShapes[config.baseShape];
      rendererConfig = {
        baseShape: config.baseShape, // Store reference to base shape
        getMetrics: config.getMetrics || baseShape.getMetrics,
        drawPhase: {
          shadow: config.drawShadow || baseShape.drawShadow,
          background: config.drawBackground || baseShape.drawBackground,
          main: config.drawMain || baseShape.drawMain,
          decoration: config.drawDecoration || baseShape.drawDecoration,
          selection: config.drawSelection || baseShape.drawSelection,
          label: config.drawLabel || baseShape.drawLabel,
        },
      };
    } else {
      // Full custom implementation - check both flat (drawBackground) and nested (drawPhase.background) formats
      const dp = config.drawPhase || {};
      rendererConfig = {
        getMetrics: config.getMetrics || defaultGetMetrics,
        drawPhase: {
          shadow: dp.shadow || config.drawShadow || defaultDrawShadow,
          background: dp.background || config.drawBackground || defaultDrawBackground,
          main: dp.main || config.drawMain || defaultDrawMain,
          decoration: dp.decoration || config.drawDecoration || (() => {}),
          selection: dp.selection || config.drawSelection || defaultDrawSelection,
          label: dp.label || config.drawLabel || defaultDrawLabel,
        },
      };
    }

    shapeRenderers.set(shapeName, rendererConfig);
  } catch (error) {
    // Shape registration failed - silently continue
  }
}

// Put this back near the top of the file, before shapeRenderers
function drawCenterPin(ctx, areaPin, centerPos) {
  if (
    !areaPin ||
    typeof areaPin.x !== "number" ||
    typeof areaPin.y !== "number"
  ) {
    return;
  }

  // Skip drawing the center shape if hideShape is enabled
  if (areaPin.hideShape) {
    return;
  }

  // Use pinType if available, otherwise determine from icon for backward compatibility
  let cardTypeId = areaPin.pinType || "card:card";
  if (!areaPin.pinType && areaPin.icon) {
    // Fallback to icon-based logic for backward compatibility
    switch (areaPin.icon) {
      case "▤":
        cardTypeId = "card:card";
        break;
      case "📄":
        cardTypeId = "card:doc";
        break;
      case "📁":
        cardTypeId = "card:folder";
        break;
      case "👤":
        cardTypeId = "pin:person";
        break;
      case "🏢":
        cardTypeId = "pin:business-building";
        break;
    }
  }

  const pinScale = areaPin.pinScale || 1;

  const title = areaPin.title || "";
  const description = areaPin.description || "";

  // Determine variant based on card type
  let variant = "card";
  if (cardTypeId === "card:doc") {
    variant = "document";
  } else if (cardTypeId === "card:folder") {
    variant = "folder";
  } else if (cardTypeId === "card:card") {
    variant = "card";
  } else if (cardTypeId.startsWith("pin:")) {
    // For pin types, use the pin type as variant
    variant = cardTypeId.replace("pin:", "");
  }

  const centerPin = {
    x: areaPin.x || 0,
    y: areaPin.y || 0,
    color: areaPin.color || "#58a6ff",
    typeId: cardTypeId,
    variant: variant,
    label: title,
    title: title,
    description: description,
    pinScale: pinScale,
  };

  if (!centerPin.typeId) {
    return;
  }

  const pinMetrics = getPinMetrics(centerPin); // Get base metrics

  // Create full metrics object for drawPinShape
  const centerMetrics = {
    x: centerPin.x,
    y: centerPin.y,
    scale: centerPin.pinScale || 1,
    color: centerPin.color,
    typeId: centerPin.typeId,
    shape: pinMetrics.shape,
    isSelected: false, // Center pins are not selectable
    isMarquee: false,
    // Include dimensions from getPinMetrics
    radius: pinMetrics.radius,
    width: pinMetrics.width,
    height: pinMetrics.height,
  };

  // The tricky part: temporarily override worldToScreen
  const originalWorldToScreen = window.worldToScreen;
  window.worldToScreen = () => centerPos;

  drawPinShape(ctx, centerPin, centerMetrics, -1); // -1 = not selectable

  // Very important: restore!
  window.worldToScreen = originalWorldToScreen;
}

// ── Default implementations (fallback) ───────────────────────────────────

function defaultGetMetrics(pin, scale) {
  return {
    width: 100,
    height: 70,
    radius: 24,
    baseRadius: 8,
    shape: pin.shape || "circle",
  };
}

// Default shadow — subtle offset drop shadow (used by most shapes)
// Performance optimized: No shadowBlur/shadowColor - uses simple offset fills instead
function defaultDrawShadow(ctx, pin, metrics, scr, s) {
  const m = metrics;

  // Most common cases - optimized shadow using simple offset fill
  if (m.shape === "circle" || m.shape === "area-circle") {
    const r = (m.radius || 24) * s;
    // Performance: Single fill operation with rgba color instead of shadow properties
    ctx.fillStyle = "rgba(0,0,0,0.25)"; // Reduced opacity for better performance
    ctx.beginPath();
    ctx.arc(scr.x + 2 * s, scr.y + 3 * s, r, 0, Math.PI * 2); // Smaller offset, no size increase
    ctx.fill();
    return;
  }

  // Rectangular / card-like shapes - optimized shadow
  if (m.width && m.height) {
    const w = m.width * s;
    const h = m.height * s;
    const x = scr.x - w / 2;
    const y = scr.y - h / 2;
    const r = (m.baseRadius || 6) * s;

    ctx.fillStyle = "rgba(0,0,0,0.25)"; // Reduced opacity
    window.DrawingUtils.roundRectPath(ctx, x + 2 * s, y + 3 * s, w, h, r); // Smaller offset
    ctx.fill();
    return;
  }

  // Ultimate fallback — small circle
  ctx.fillStyle = "rgba(0,0,0,0.3)";
  ctx.beginPath();
  ctx.arc(scr.x + 2 * s, scr.y + 2 * s, 20 * s, 0, Math.PI * 2); // Smaller, optimized
  ctx.fill();
}

// Default background — usually used for outline/glow/halo effects
// (many shapes skip this phase completely → empty function is also ok)
function defaultDrawBackground(ctx, pin, metrics, scr, s) {
  // Most common use-case: very faint outer glow / safety padding
  // Many modern designs actually skip this phase

  const m = metrics;
  const baseColor = pin.color || "#58a6ff";
  // Performance optimization: Use RGBA directly instead of globalAlpha
  const glowColor = baseColor + "26"; // 0.15 opacity in hex

  if (m.shape === "circle" || m.shape === "area-circle") {
    const r = (m.radius || 24) * s;
    ctx.fillStyle = glowColor;
    ctx.beginPath();
    ctx.arc(scr.x, scr.y, r * 1.25, 0, Math.PI * 2);
    ctx.fill();
  } else if (m.width && m.height) {
    const w = m.width * s;
    const h = m.height * s;
    const x = scr.x - w / 2;
    const y = scr.y - h / 2;
    const r = (m.baseRadius || 6) * s;

    ctx.fillStyle = glowColor;
    window.DrawingUtils.roundRectPath(
      ctx,
      x - 4 * s,
      y - 4 * s,
      w + 8 * s,
      h + 8 * s,
      r + 4 * s
    );
    ctx.fill();
  }
}

// Default main body — the actual visible filled shape
function defaultDrawMain(ctx, pin, metrics, scr, s) {
  const m = metrics;
  const color = pin.color || "#58a6ff";

  if (m.shape === "circle" || m.shape === "area-circle") {
    const r = (m.radius || 24) * s;

    // Main fill
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(scr.x, scr.y, r, 0, Math.PI * 2);
    ctx.fill();

    // Optional subtle highlight (classic pin look)
    if (r > 12 * s) {
      ctx.fillStyle = "rgba(255,255,255,0.45)";
      ctx.beginPath();
      ctx.arc(scr.x - 0.22 * r, scr.y - 0.22 * r, r * 0.38, 0, Math.PI * 2);
      ctx.fill();
    }
    return;
  }

  // Rectangular / card / pill style fallback
  if (m.width && m.height) {
    const w = m.width * s;
    const h = m.height * s;
    const x = scr.x - w / 2;
    const y = scr.y - h / 2;
    const cornerRadius = (m.baseRadius || 6) * s;

    ctx.fillStyle = color;
    window.DrawingUtils.roundRectPath(ctx, x, y, w, h, cornerRadius);
    ctx.fill();
    return;
  }

  // Ultimate minimal fallback — small circle
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(scr.x, scr.y, 20 * s, 0, Math.PI * 2);
  ctx.fill();
}
function defaultDrawSelection(
  ctx,
  pin,
  metrics,
  scr,
  s,
  isSelected,
  isMarquee
) {
  if (!isSelected && !isMarquee) return;

  const m = metrics;

  // For marquee only (not selected), use simple orange indicator
  if (isMarquee && !isSelected) {
    ctx.save();
    ctx.strokeStyle = "#f90";
    ctx.lineWidth = 3;

    if (m.shape === "circle" || m.shape === "area-circle") {
      const r = (m.radius || 24) * s;
      ctx.beginPath();
      ctx.arc(scr.x, scr.y, r + 6 * s, 0, Math.PI * 2);
      ctx.stroke();
    } else {
      const w = m.width * s,
        h = m.height * s;
      const r = m.baseRadius * s || 6 * s;
      window.DrawingUtils.roundRectPath(
        ctx,
        scr.x - w / 2 - 6 * s,
        scr.y - h / 2 - 6 * s,
        w + 12 * s,
        h + 12 * s,
        r + 4 * s
      );
      ctx.stroke();
    }
    ctx.restore();
    return;
  }

  // Use animated selection for selected items
  if (window.selectionAnimator && isSelected) {
    const selectionCount = window.app?.getSelectionCount?.() || 1;
    
    if (m.shape === "circle" || m.shape === "area-circle") {
      const r = (m.radius || 24) * s;
      window.selectionAnimator.drawSelection(
        ctx, 
        scr.x, 
        scr.y, 
        r,
        pin.color,
        selectionCount,
        { shape: m.shape, colorSlot: pin.colorSlot }
      );
    } else {
      const w = m.width * s;
      const h = m.height * s;
      window.selectionAnimator.drawSelection(
        ctx, 
        scr.x, 
        scr.y, 
        Math.max(w, h) / 2,
        pin.color,
        selectionCount,
        { shape: 'rect', width: w, height: h, colorSlot: pin.colorSlot }
      );
    }
  }
}

function defaultDrawLabel(ctx, pin, metrics, scr, s, scale) {
  if (!pin.label) return;

  // Level of Detail (LOD): Only draw labels when zoomed in enough to read them
  if (scale < 0.5) return;

  const m = metrics;
  let yOffset = 0;

  if (["circle", "area-circle"].includes(m.shape)) {
    yOffset = m.radius * s + 23 * s;
  } else {
    yOffset = (m.height * s) / 2 + 23 * s;
  }

  // Collision detection: Simple distance-based culling to prevent overlap
  // This is a basic implementation - could be enhanced with spatial partitioning
  const labelX = scr.x;
  const labelY = scr.y + yOffset;
  const minDistance = 60 * s; // Minimum distance between labels

  // Check against other pins in viewport (simplified collision detection)
  if (window._drawnLabels) {
    for (const drawnLabel of window._drawnLabels) {
      const dx = labelX - drawnLabel.x;
      const dy = labelY - drawnLabel.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance < minDistance) {
        return; // Skip drawing this label to prevent overlap
      }
    }
  }

  ctx.save();
  ctx.font = `bold ${15 * s}px system-ui`;
  ctx.textAlign = "center";

  // Shadow - optimized: single fill operation instead of separate shadow
  ctx.fillStyle = "rgba(0,0,0,0.6)";
  ctx.fillText(pin.label, scr.x, scr.y + yOffset + 2 * s);

  // Text
  ctx.fillStyle = pin.textColor || window._currentThemeTextColor || "#ffffff";
  ctx.fillText(pin.label, scr.x, scr.y + yOffset);

  // Track drawn labels for collision detection
  if (!window._drawnLabels) window._drawnLabels = [];
  window._drawnLabels.push({ x: labelX, y: labelY });

  ctx.restore();
}

// ── Card shape ───────────────────────────────────────────────────────────

registerShape("card", {
  baseShape: "rect",
  getMetrics(pin, scale) {
    const variant = pin.variant || "card";

    // Adjust dimensions based on variant (reduced by ~2.5x for proper sizing)
    if (variant === "card") {
      // Note card - wider
      return {
        shape: "card",
        width: 72,
        height: 36,
        variant: variant,
        baseRadius: 3,
      };
    } else if (variant === "document") {
      // Document card - taller
      return {
        shape: "card",
        width: 56,
        height: 48,
        variant: variant,
        baseRadius: 3,
      };
    } else if (variant === "folder") {
      // Folder card - slightly different proportions
      return {
        shape: "card",
        width: 64,
        height: 44,
        variant: variant,
        baseRadius: 3,
      };
    }

    // Default fallback
    return {
      shape: "card",
      width: 64,
      height: 40,
      variant: variant,
      baseRadius: 3,
    };

    return {
      shape: "card",
      width: width,
      height: height,
      variant: variant,
      baseRadius: 3, // Cards have slightly rounded corners
    };
  },

  drawShadow(ctx, pin, m, scr, s) {
    const w = m.width * s,
      h = m.height * s;
    const x = scr.x - w / 2,
      y = scr.y - h / 2;

    ctx.fillStyle = window._isMatrixTheme
      ? "rgba(0,255,65,0.25)"
      : "rgba(0,0,0,0.4)";

    window.DrawingUtils.roundRectPath(
      ctx,
      x + 4 * s,
      y + 4 * s,
      w + (window._isMatrixTheme ? 2 * s : 0),
      h + (window._isMatrixTheme ? 2 * s : 0),
      7 * s
    );
    ctx.fill();
  },

  drawMain(ctx, pin, m, scr, s) {
    const w = m.width * s,
      h = m.height * s;
    const x = scr.x - w / 2,
      y = scr.y - h / 2;

    ctx.fillStyle = pin.color || "#58a6ff";
    try {
      window.DrawingUtils.roundRectPath(ctx, x, y, w, h, 6 * s);
      ctx.fill();
    } catch (error) {
      // Fallback to simple rect
      ctx.fillRect(x, y, w, h);
    }
  },

  drawDecoration(ctx, pin, m, scr, s) {
    const w = m.width * s,
      h = m.height * s;
    const x = scr.x - w / 2,
      y = scr.y - h / 2;

    if (m.variant === "document") {
      ctx.fillStyle = "rgba(0,0,0,0.16)";
      window.DrawingUtils.roundRectPath(
        ctx,
        x + 4 * s,
        y + 4 * s,
        w - 8 * s,
        h * 0.25,
        4 * s
      );
      ctx.fill();
    } else if (m.variant === "folder") {
      const tabW = w * 0.4,
        tabH = h * 0.3;
      const baseColor = pin.color || "#58a6ff";
      const lightenedColor = window.DrawingUtils.lightenColor(baseColor, 12);
      ctx.fillStyle = lightenedColor;
      window.DrawingUtils.roundRectPath(
        ctx,
        x + 6 * s,
        y - tabH * 0.5,
        tabW,
        tabH,
        4 * s
      );
      ctx.fill();
    }

    // Inner lines (paper content)
    if (m.variant !== "folder") {
      const innerX = x + 0.16 * w;
      const innerW = w - 0.32 * w;
      ctx.lineWidth = 2;
      ctx.strokeStyle = "rgba(0,0,0,0.32)";
      for (let i = 0; i < 3; i++) {
        const ly = y + 0.35 * h + i * (h * 0.18);
        ctx.beginPath();
        ctx.moveTo(innerX, ly);
        ctx.lineTo(innerX + innerW, ly);
        ctx.stroke();
      }
    }
  },
});

// ── Circle shape (simple pin) ────────────────────────────────────────────

registerShape("circle", {
  baseShape: "circle", // Use base circle shape
  drawShadow(ctx, pin, m, scr, s) {
    const r = m.radius * s;
    // Use color-matched shadow if available
    const colorData = window.schemaManager?.getPinColorData?.(pin);
    const shadowColor = colorData?.shadow || "rgba(0,0,0,0.35)";
    ctx.fillStyle = shadowColor + "80"; // Add some transparency
    ctx.beginPath();
    ctx.arc(scr.x + 3 * s, scr.y + 4 * s, r * 1.05, 0, Math.PI * 2);
    ctx.fill();
  },
  drawSelection(ctx, pin, m, scr, s, isSelected, isMarquee) {
    if (!isSelected && !isMarquee) return;

    // For marquee, use simple orange indicator
    if (isMarquee && !isSelected) {
      ctx.save();
      ctx.strokeStyle = "#f90";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(scr.x, scr.y, m.radius * s * 1.1, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
      return;
    }

    // Use animated selection for selected pins
    if (window.selectionAnimator && isSelected) {
      const selectionCount = window.app?.getSelectionCount?.() || 1;
      window.selectionAnimator.drawSelection(
        ctx, 
        scr.x, 
        scr.y, 
        m.radius * s, 
        pin.color,
        selectionCount,
        { shape: 'circle', colorSlot: pin.colorSlot }
      );
    }
  },
});

// ── Area Rectangle ───────────────────────────────────────────────────────

registerShape("area-rect", {
  baseShape: "area-rect",
  drawMain(ctx, pin, m, scr, s) {
    // Draw the area rectangle boundary using areaSize
    const halfSize = pin.areaSize || 50;
    const width = pin.width || halfSize * 2;
    const height = pin.height || halfSize * 2;
    const fillColor = pin.fillColor || pin.color + "40";
    const borderColor = pin.borderColor || pin.color;
    const borderWidth = pin.borderWidth || 2;

    // Calculate rectangle bounds (centered on pin position)
    const x = scr.x - width / 2;
    const y = scr.y - height / 2;

    // Fill the area
    ctx.fillStyle = fillColor;
    ctx.fillRect(x, y, width, height);

    // Draw border
    if (borderWidth > 0) {
      ctx.strokeStyle = borderColor;
      ctx.lineWidth = borderWidth;
      ctx.strokeRect(x, y, width, height);
    }
  },
  drawDecoration(ctx, pin, m, scr, s) {
    // Center pin
    drawCenterPin(ctx, pin, scr);
  },
});

// ── Area Circle ──────────────────────────────────────────────────────────

registerShape("area-circle", {
  baseShape: "area-circle",
  drawMain(ctx, pin, m, scr, s) {
    // Draw the area circle boundary using areaSize
    const radius = pin.areaSize || pin.radius || 50;
    const fillColor = pin.fillColor || pin.color + "40";
    const borderColor = pin.borderColor || pin.color;
    const borderWidth = pin.borderWidth || 2;

    // Fill the area
    ctx.fillStyle = fillColor;
    ctx.beginPath();
    ctx.arc(scr.x, scr.y, radius, 0, Math.PI * 2);
    ctx.fill();

    // Draw border
    if (borderWidth > 0) {
      ctx.strokeStyle = borderColor;
      ctx.lineWidth = borderWidth;
      ctx.stroke();
    }
  },
  drawLabel(ctx, pin, m, scr, s) {
    // Area pins don't show their own labels - everything is handled by center pin
    return;
  },
  drawDecoration(ctx, pin, m, scr, s) {
    // Center pin
    drawCenterPin(ctx, pin, scr);
  },
});

// You can (and should) continue registering:
// 'area-rect', 'pill', 'diamond', 'triangle', 'hexagon', etc...

// ── Rectangle/Square shape ──────────────────────────────────────────────────

registerShape("rect", {
  baseShape: "rect",
});

// ── Square shape ───────────────────────────────────────────────────────────

registerShape("square", {
  baseShape: "rect",
  getMetrics(pin, scale) {
    return {
      shape: "square",
      width: pin.width || 18,
      height: pin.height || 18,
      baseRadius: 3,
    };
  },
});

// ── Pill shape ─────────────────────────────────────────────────────────────

registerShape("pill", {
  getMetrics(pin, scale) {
    // Pill shape: wider than tall, with fully rounded ends
    return {
      shape: "pill",
      width: 32 * scale, // 32px wide (elongated)
      height: 16 * scale, // 16px tall (standard pin height)
    };
  },
  drawShadow: defaultDrawShadow,
  drawBackground: defaultDrawBackground,
  drawMain(ctx, pin, m, scr, s) {
    const w = m.width * s;
    const h = m.height * s;
    const x = scr.x - w / 2;
    const y = scr.y - h / 2;
    const r = h / 2; // Fully rounded - radius equals half height for perfect pill shape

    ctx.save();
    ctx.fillStyle = pin.color || "#58a6ff";
    window.DrawingUtils.roundRectPath(ctx, x, y, w, h, r);
    ctx.fill();

    // Add subtle border for definition
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 1 * s;
    ctx.stroke();
    ctx.restore();
  },
  drawDecoration: () => {},
  drawSelection: defaultDrawSelection,
  drawLabel: defaultDrawLabel,
});

// ── Diamond shape ──────────────────────────────────────────────────────────

registerShape("diamond", {
  baseShape: "rect",
  drawMain(ctx, pin, m, scr, s) {
    // Create a diamond that fits within the pin dimensions
    const w = m.width * s;
    const h = m.height * s;

    // Diamond points: top, right, bottom, left
    const halfW = w / 2;
    const halfH = h / 2;

    ctx.fillStyle = pin.color || "#c084fc";
    ctx.beginPath();
    ctx.moveTo(scr.x, scr.y - halfH); // Top
    ctx.lineTo(scr.x + halfW, scr.y); // Right
    ctx.lineTo(scr.x, scr.y + halfH); // Bottom
    ctx.lineTo(scr.x - halfW, scr.y); // Left
    ctx.closePath();
    ctx.fill();
  },
});

// ── Person Shape ──────────────────────────────────────────────────────────
registerShape("person", {
  getMetrics(pin, scale) {
    // 2x smaller than original
    const headRadius = 13; // 26 / 2
    const bodyHeight = 2; // 40 / 2
    const bodyWidth = 25; // 46 / 2 (rounded)
    const paddingBottom = 10; // 20 / 2
    const totalHeight = headRadius * 2 + bodyHeight + paddingBottom;

    return {
      shape: "person",
      width: bodyWidth,
      height: totalHeight,
      radius: headRadius,
      bodyH: bodyHeight,
      bodyW: bodyWidth,
      labelPadding: 5, // 10 / 2
      headYOffset: -10, // -20 / 2 - adjusted offset to position icon higher for better centering
    };
  },

  // drawShadow remains the same

  drawMain(ctx, pin, m, scr, s) {
    // Work with metrics from getPinMetrics: width, height, radius
    // For person pins: width=20*pinScale, height=32*pinScale, radius=6*pinScale

    const pinWidth = m.width * s; // Apply zoom scale
    const pinHeight = m.height * s; // Apply zoom scale

    // Person icon proportions scaled to fit pin dimensions
    const headRadius = Math.min(pinWidth, pinHeight) * 0.25; // Head radius
    const bodyWidth = pinWidth * 0.7; // Body width
    const bodyHeight = pinHeight * 0.4; // Body height

    // Position elements within the pin bounds
    const headY = scr.y - pinHeight * 0.15 + m.headYOffset * s; // Head center with offset from metrics
    const bodyY = scr.y + pinHeight * 0.1 - 10 * s; // Body top below pin center (raised by 10)

    const fillColor = pin.color || "#6366f1"; // Head color
    const bodyColor = window.DrawingUtils.darkenColor(fillColor, 40); // Darker body color based on pin color

    // --- 1. DRAW THE HEAD (Circle) ---
    ctx.fillStyle = fillColor;
    ctx.beginPath();
    ctx.arc(scr.x, headY, headRadius, 0, Math.PI * 2);
    ctx.fill();

    // --- 2. DRAW THE BODY (Shoulders/Torso) ---
    ctx.fillStyle = bodyColor;
    ctx.beginPath();

    // Start at the bottom left of the body
    ctx.moveTo(scr.x - bodyWidth / 2, bodyY + bodyHeight);

    // Draw the top arc (shoulders) - quadratic curve for rounded shoulders
    ctx.quadraticCurveTo(
      scr.x - bodyWidth / 2, // Control point X (left edge)
      bodyY, // Control point Y (shoulder level)
      scr.x, // End point X (center)
      bodyY // End point Y (center top)
    );

    // Draw from center to bottom right
    ctx.quadraticCurveTo(
      scr.x + bodyWidth / 2, // Control point X (right edge)
      bodyY, // Control point Y (shoulder level)
      scr.x + bodyWidth / 2, // End point X (right edge)
      bodyY + bodyHeight // End point Y (bottom right)
    );

    ctx.closePath();
    ctx.fill();
  },

  drawDecoration(ctx, pin, m, scr, s) {
    // Draw initials below the person icon
    if (pin.initials || pin.label) {
      const initials = (
        pin.initials || (pin.label || "").substring(0, 2)
      ).toUpperCase();

      const pinHeight = m.height * s; // Apply zoom scale

      // Position initials below the body (raised to match person position)
      const initialsY = scr.y + pinHeight * 0.35 - 10 * s;

      ctx.font = `bold ${Math.round(pinHeight * 0.15)}px system-ui`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "#333333";

      ctx.fillText(initials, scr.x, initialsY);
    }
  },
});

// ── Business Building ──────────────────────────────────────────────────────────
registerShape("business-building", {
  getMetrics(pin, scale) {
    // 2x larger than default pin size
    return {
      shape: "business-building",
      width: 32, // 2x the default width (16)
      height: 32, // 2x the default height (16)
    };
  },

  drawMain(ctx, pin, m, scr, s) {
    // Work with metrics from getPinMetrics: width, height, radius
    const w = m.width * s;
    const h = m.height * s;
    const x = scr.x - w / 2;
    const y = scr.y - h / 2;

    const buildingColor = pin.color || "#475569"; // slate-600 default
    const accentColor = window.DrawingUtils.darkenColor(buildingColor, 25);

    // Main building structure (rectangular base)
    ctx.fillStyle = buildingColor;
    ctx.fillRect(x + w * 0.1, y + h * 0.3, w * 0.8, h * 0.7);

    // Building top/roof (flat roof with slight overhang)
    ctx.fillStyle = accentColor;
    ctx.fillRect(x + w * 0.05, y + h * 0.25, w * 0.9, h * 0.1);

    // Central tower/antenna
    const towerW = w * 0.1;
    const towerH = h * 0.15;
    const towerX = scr.x - towerW / 2;
    const towerY = y + h * 0.1;
    ctx.fillStyle = accentColor;
    ctx.fillRect(towerX, towerY, towerW, towerH);

    // Antenna on top
    ctx.fillStyle = "#666";
    ctx.fillRect(scr.x - 1 * s, towerY - h * 0.05, 2 * s, h * 0.05);

    // Windows - modern office building style
    ctx.fillStyle = "#87ceeb"; // sky blue for windows

    // Windows fit within building body (10% to 90% of width)
    const windowRows = 4;
    const windowCols = 2;
    const windowW = w * 0.12; // Reduced from 0.15 to 0.12
    const windowH = h * 0.08;
    const windowGapX = w * 0.02;
    const windowGapY = h * 0.03;

    // Left side windows (start at 15% of building width)
    for (let row = 0; row < windowRows; row++) {
      for (let col = 0; col < windowCols; col++) {
        const wx = x + w * 0.15 + col * (windowW + windowGapX);
        const wy = y + h * 0.35 + row * (windowH + windowGapY);
        if (wy + windowH < y + h) {
          ctx.fillRect(wx, wy, windowW, windowH);
        }
      }
    }

    // Right side windows (start at 58% to fit within building)
    for (let row = 0; row < windowRows; row++) {
      for (let col = 0; col < windowCols; col++) {
        const wx = x + w * 0.58 + col * (windowW + windowGapX);
        const wy = y + h * 0.35 + row * (windowH + windowGapY);
        if (wy + windowH < y + h) {
          ctx.fillRect(wx, wy, windowW, windowH);
        }
      }
    }

    // Entrance/main door at bottom center
    ctx.fillStyle = "#8b4513"; // brown for door
    const doorW = w * 0.15;
    const doorH = h * 0.12;
    const doorX = scr.x - doorW / 2;
    const doorY = y + h * 0.88;
    ctx.fillRect(doorX, doorY, doorW, doorH);

    // Door handle
    ctx.fillStyle = "#ffd700"; // gold
    ctx.fillRect(
      doorX + doorW * 0.8,
      doorY + doorH * 0.4,
      doorW * 0.05,
      doorH * 0.2
    );
  },

  drawLabel(ctx, pin, m, scr, s) {
    let textToShow = pin.label;
    let descriptionOffset = 0;

    // If there's a description and no label, show description
    if (!textToShow && pin.description) {
      textToShow = pin.description;
    }

    if (textToShow) {
      const offset = (m.height / 2 + 12) * s;
      ctx.font = `bold ${Math.round(14 * s)}px system-ui`;
      ctx.textAlign = "center";
      ctx.fillStyle = "rgba(0,0,0,0.65)";
      ctx.fillText(textToShow, scr.x, scr.y + offset + 2 * s);
      ctx.fillStyle = pin.textColor || "#ffffff";
      ctx.fillText(textToShow, scr.x, scr.y + offset);
      descriptionOffset = 18 * s; // Space for next line
    }

    // Show description on second line if both exist
    if (pin.label && pin.description) {
      const offset = (m.height / 2 + 12) * s + descriptionOffset;
      ctx.font = `${Math.round(11 * s)}px system-ui`;
      ctx.textAlign = "center";
      ctx.fillStyle = "rgba(0,0,0,0.8)";
      ctx.fillText(pin.description, scr.x, scr.y + offset + 2 * s);
      ctx.fillStyle = pin.textColor || "#aaaaaa";
      ctx.fillText(pin.description, scr.x, scr.y + offset);
    }

    // Show description on first line if only description exists
    if (!pin.label && pin.description) {
      const offset = (m.height / 2 + 12) * s;
      ctx.font = `bold ${Math.round(14 * s)}px system-ui`;
      ctx.textAlign = "center";
      ctx.fillStyle = "rgba(0,0,0,0.65)";
      ctx.fillText(pin.description, scr.x, scr.y + offset + 2 * s);
      ctx.fillStyle = pin.textColor || "#ffffff";
      ctx.fillText(pin.description, scr.x, scr.y + offset);
    }
  },
});

// ── Main drawing loop ────────────────────────────────────────────────────

function drawPinShape(ctx, pin, metrics, index, appScale = 1) {
  // Debug: check if pin has image
  if (window.DEBUG_IMAGES && pin.image && pin.image.dataUrl) {
    console.log(
      "drawPinShape: pin",
      index,
      "has image:",
      pin.image.originalFileName
    );
  }

  // Get complete metrics from getPinMetrics and merge with passed metrics
  const fullMetrics = window.getPinMetrics
    ? window.getPinMetrics(pin)
    : metrics;
  const mergedMetrics = { ...fullMetrics, ...metrics }; // Passed metrics override getPinMetrics

  // Use world coordinates directly since canvas is already transformed
  const scr = { x: pin.x, y: pin.y };

  // FIRST: Check for pin images (draw underneath the pin shape)
  if (pin.image && pin.image.dataUrl) {
    if (window.DEBUG_IMAGES) {
      console.log(
        "🎨 Drawing pin image for pin:",
        pin.id,
        "style:",
        pin.image.style,
        "at:",
        scr.x,
        scr.y
      );
    }
    drawPinImage(ctx, pin, mergedMetrics, scr, appScale);
    if (window.DEBUG_IMAGES) {
      console.log("🎨 Image drawn, now drawing pin shape on top");
    }
    // Continue to draw the pin shape on top of the image
  }

  // SECOND: Check for custom theme icons
  if (window.themeManager) {
    const currentTheme = window.themeManager.getCurrentTheme();
    const pinType = pin.typeId || "pin:circle";

    // Check theme-specific icons first
    const iconSrc = currentTheme?.icons?.[pinType];

    if (iconSrc) {
      // Cache the Image object so we don't reload every frame
      if (!window.themeManager.customIcons[iconSrc]) {
        const img = new Image();
        img.src = iconSrc;
        window.themeManager.customIcons[iconSrc] = img;
      }

      const cachedImg = window.themeManager.customIcons[iconSrc];
      if (cachedImg.complete && cachedImg.naturalWidth > 0) {
        // Calculate icon size and position
        const iconSize = (mergedMetrics.radius || 10) * 2 * (pin.pinScale || 1);
        const x = scr.x - iconSize / 2;
        const y = scr.y - iconSize / 2;

        ctx.save();
        ctx.drawImage(cachedImg, x, y, iconSize, iconSize);
        ctx.restore();
        return; // Skip default rendering
      }
    }
  }

  // SECOND: Try normal renderer (will draw on top if it works)
  const renderer = window.shapeRenderers?.get(mergedMetrics.shape);
  if (renderer) {
    try {
      // Get shape-specific metrics and merge them
      let pinScale = pin.pinScale || 1;

      // Validate pinScale to prevent rendering issues
      if (
        typeof pinScale !== "number" ||
        isNaN(pinScale) ||
        !isFinite(pinScale) ||
        pinScale <= 0
      ) {
        console.warn(
          `⚠️ Invalid pinScale for pin ${index}: ${pinScale}, using 1.0`
        );
        pinScale = 1.0;
        pin.pinScale = 1.0; // Fix the invalid value
      }

      // Clamp pinScale to reasonable bounds
      pinScale = Math.max(0.1, Math.min(5.0, pinScale));

      const shapeMetrics = renderer.getMetrics
        ? renderer.getMetrics(pin, pinScale)
        : {};
      const finalMetrics = { ...mergedMetrics, ...shapeMetrics };

      // Draw all phases in order
      ctx.save();

      // 1. Shadow phase
      if (renderer.drawPhase.shadow) {
        renderer.drawPhase.shadow(ctx, pin, finalMetrics, scr, pinScale);
      }

      // 2. Background phase
      if (renderer.drawPhase.background) {
        renderer.drawPhase.background(ctx, pin, finalMetrics, scr, pinScale);
      }

      // 3. Main body phase
      if (renderer.drawPhase.main) {
        renderer.drawPhase.main(ctx, pin, finalMetrics, scr, pinScale);
      }

      // 4. Decoration phase
      if (renderer.drawPhase.decoration) {
        renderer.drawPhase.decoration(ctx, pin, finalMetrics, scr, pinScale);
      }

      // 5. Selection phase (only if selected or marquee)
      if (
        renderer.drawPhase.selection &&
        (finalMetrics.isSelected || finalMetrics.isMarquee)
      ) {
        renderer.drawPhase.selection(
          ctx,
          pin,
          finalMetrics,
          scr,
          pinScale,
          finalMetrics.isSelected,
          finalMetrics.isMarquee
        );
      }

      // 6. Label phase
      if (renderer.drawPhase.label) {
        renderer.drawPhase.label(
          ctx,
          pin,
          finalMetrics,
          scr,
          pinScale,
          appScale
        );
      }

      ctx.restore();
    } catch (error) {
      console.error(`❌ Error drawing shape "${mergedMetrics.shape}":`, error);
    }
  } else {
    console.warn(`⚠️ No renderer found for shape "${mergedMetrics.shape}"`);
  }
}

/**
 * Draw a pin with an image
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {Object} pin - Pin object with image data
 * @param {Object} metrics - Pin metrics
 * @param {Object} scr - Screen coordinates {x, y}
 * @param {number} appScale - Application scale
 */
function drawPinImage(ctx, pin, metrics, scr, appScale) {
  if (!pin.image || !pin.image.dataUrl) return;

  // Debug logging (enable by setting window.DEBUG_IMAGES = true)
  if (window.DEBUG_IMAGES) {
    console.log(
      "drawPinImage called for pin with image:",
      pin.image.originalFileName,
      "style:",
      pin.image.style
    );
  }

  // Use global image cache keyed by pin ID + filename to ensure each pin has its own image
  const cacheKey = `pin_${pin.id}_${pin.image.originalFileName}`;
  if (!window.imageCache) {
    window.imageCache = new Map();
  }

  let img;
  if (window.imageCache.has(cacheKey)) {
    img = window.imageCache.get(cacheKey);
    if (window.DEBUG_IMAGES) {
      console.log(
        "Using cached image for pin",
        pin.id,
        ":",
        pin.image.originalFileName
      );
    }
  } else {
    if (window.DEBUG_IMAGES) {
      console.log(
        "Creating new cached image for pin",
        pin.id,
        ":",
        pin.image.originalFileName
      );
    }
    img = new Image();
    img.onload = function () {
      if (window.DEBUG_IMAGES) {
        console.log(
          "Image loaded successfully for pin",
          pin.id,
          ":",
          pin.image.originalFileName,
          "size:",
          img.naturalWidth,
          "x",
          img.naturalHeight
        );
      }
      // Force a redraw when image loads
      if (window.draw) window.draw();
    };
    img.onerror = function () {
      console.error(
        "Failed to load image for pin",
        pin.id,
        ":",
        pin.image.originalFileName
      );
      window.imageCache.delete(cacheKey); // Remove from cache on error
    };
    img.src = pin.image.dataUrl;
    window.imageCache.set(cacheKey, img);
  }

  if (!img.complete || img.naturalWidth === 0) {
    // Debug: only log occasionally to avoid spam
    if (window.DEBUG_IMAGES && !img._debugLogged) {
      console.log(
        "Image not ready yet for pin",
        pin.id,
        ":",
        pin.image.originalFileName,
        "complete:",
        img.complete,
        "width:",
        img.naturalWidth
      );
      img._debugLogged = true;
    }
    return;
  }

  // Debug: log successful image rendering
  if (window.DEBUG_IMAGES && !img._renderLogged) {
    console.log(
      "Rendering image:",
      pin.image.originalFileName,
      "at position:",
      scr.x,
      scr.y,
      "size:",
      img.naturalWidth,
      "x",
      img.naturalHeight
    );
    img._renderLogged = true;
  }

  ctx.save();

  // Calculate image display size - use custom size if set, otherwise up to 100px at default scale
  const pinScale = pin.pinScale || 1;
  const radius = metrics.radius || 10;
  const pinDiameter = radius * 2 * pinScale; // Actual pin size

  // Use custom size if set, otherwise calculate automatic size
  let imageSize;
  if (pin.image && pin.image.size) {
    // Use custom size, scaled by appScale
    imageSize = pin.image.size * appScale;
  } else {
    // Automatic sizing: up to 100px or 4x pin size
    imageSize = Math.min(100 * appScale, pinDiameter * 4);
  }

  // Position and size for image
  let imgX, imgY, imgWidth, imgHeight;

  // Calculate position offset based on image position setting
  const imagePosition = pin.image.position || "center";
  let positionOffsetX = 0;
  let positionOffsetY = 0;

  // We'll calculate the offset after determining imgWidth and imgHeight
  let useRoundedCorners = true;
  let cornerRadius = 4 * appScale;

  const imageStyle = pin.image.style || "circular";
  switch (imageStyle) {
    case "portrait":
      // Portrait: fit image maintaining aspect ratio, optimize for portrait images
      const portraitAspect = img.naturalWidth / img.naturalHeight;
      if (portraitAspect < 1) {
        // Image is portrait, fit to height
        imgHeight = imageSize;
        imgWidth = imageSize * portraitAspect;
      } else {
        // Image is landscape, fit to width but limit height
        imgWidth = imageSize;
        imgHeight = imageSize / portraitAspect;
      }
      break;

    case "landscape":
      // Landscape: fit image maintaining aspect ratio, optimize for landscape images
      const landscapeAspect = img.naturalWidth / img.naturalHeight;
      if (landscapeAspect > 1) {
        // Image is landscape, fit to width
        imgWidth = imageSize;
        imgHeight = imageSize / landscapeAspect;
      } else {
        // Image is portrait, fit to height but limit width
        imgHeight = imageSize;
        imgWidth = imageSize * landscapeAspect;
      }
      break;

    case "oval":
      // Oval: fit image in oval shape
      const ovalAspect = img.naturalWidth / img.naturalHeight;
      if (ovalAspect > 1) {
        // Landscape - fit to width
        imgWidth = imageSize;
        imgHeight = imageSize / ovalAspect;
      } else {
        // Portrait - fit to height
        imgHeight = imageSize;
        imgWidth = imageSize * ovalAspect;
      }
      useRoundedCorners = false; // We'll use oval clipping instead
      break;

    case "circular":
    default:
      // Circular: crop to circle, center the image
      // For circular, we want to fill the circle, so find the larger dimension
      const imgAspect = img.naturalWidth / img.naturalHeight;
      if (imgAspect > 1) {
        // Landscape - fit to height, crop width
        imgHeight = imageSize;
        imgWidth = imageSize * imgAspect;
      } else {
        // Portrait - fit to width, crop height
        imgWidth = imageSize;
        imgHeight = imageSize / imgAspect;
      }
      useRoundedCorners = false; // We'll use circular clipping instead
      break;
  }

  // Apply position offset based on the selected position
  switch (imagePosition) {
    case "center":
      positionOffsetX = 0;
      positionOffsetY = 0;
      break;
    case "top":
      positionOffsetX = 0;
      positionOffsetY = -imgHeight / 2;
      break;
    case "bottom":
      positionOffsetX = 0;
      positionOffsetY = imgHeight / 2;
      break;
    case "left":
      positionOffsetX = -imgWidth / 2;
      positionOffsetY = 0;
      break;
    case "right":
      positionOffsetX = imgWidth / 2;
      positionOffsetY = 0;
      break;
    case "top-left":
      positionOffsetX = -imgWidth / 2;
      positionOffsetY = -imgHeight / 2;
      break;
    case "top-right":
      positionOffsetX = imgWidth / 2;
      positionOffsetY = -imgHeight / 2;
      break;
    case "bottom-left":
      positionOffsetX = -imgWidth / 2;
      positionOffsetY = imgHeight / 2;
      break;
    case "bottom-right":
      positionOffsetX = imgWidth / 2;
      positionOffsetY = imgHeight / 2;
      break;
  }

  // Apply the position offset to center the image at the pin location plus offset
  imgX = scr.x - imgWidth / 2 + positionOffsetX;
  imgY = scr.y - imgHeight / 2 + positionOffsetY;

  // Draw the image based on style
  if (imageStyle === "circular") {
    // Draw circular image - clip to circle shape at offset position
    const clipCenterX = scr.x + positionOffsetX;
    const clipCenterY = scr.y + positionOffsetY;
    ctx.save();
    ctx.beginPath();
    ctx.arc(clipCenterX, clipCenterY, imageSize / 2, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(img, imgX, imgY, imgWidth, imgHeight);
    ctx.restore();
  } else if (imageStyle === "oval") {
    // Draw oval image - clip to oval shape at offset position
    const clipCenterX = scr.x + positionOffsetX;
    const clipCenterY = scr.y + positionOffsetY;
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(
      clipCenterX,
      clipCenterY,
      imgWidth / 2,
      imgHeight / 2,
      0,
      0,
      Math.PI * 2
    );
    ctx.clip();
    ctx.drawImage(img, imgX, imgY, imgWidth, imgHeight);
    ctx.restore();
  } else if (useRoundedCorners) {
    // Draw with rounded corners
    drawRoundedImage(ctx, img, imgX, imgY, imgWidth, imgHeight, cornerRadius);
  } else {
    // Draw rectangular image
    ctx.drawImage(img, imgX, imgY, imgWidth, imgHeight);
  }

  ctx.restore();
}

/**
 * Draw an image with rounded corners
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {Image} img - Image to draw
 * @param {number} x - X position
 * @param {number} y - Y position
 * @param {number} width - Width
 * @param {number} height - Height
 * @param {number} radius - Corner radius
 */
function drawRoundedImage(ctx, img, x, y, width, height, radius) {
  ctx.save();

  // Create rounded rectangle path
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();

  // Clip to rounded rectangle
  ctx.clip();

  // Draw image
  ctx.drawImage(img, x, y, width, height);

  ctx.restore();
}

// Make drawPinImage globally available
window.drawPinImage = drawPinImage;

// ── Draw Text Elements ───────────────────────────────────────────────────
function drawTextElements(
  textElements,
  viewportLeft,
  viewportRight,
  viewportTop,
  viewportBottom,
  margin
) {
  if (!textElements) return;

  textElements.forEach((textEl, index) => {
    // Skip if outside viewport
    if (
      textEl.x < viewportLeft - margin ||
      textEl.x > viewportRight + margin ||
      textEl.y < viewportTop - margin ||
      textEl.y > viewportBottom + margin
    ) {
      return;
    }

    const scr = window.worldToScreen(textEl.x, textEl.y);
    const s = 1; // Consistent with pin rendering

    // Draw text bubble background
    const textType = textEl.type || 'rectangle';
    const bubbleColor = textEl.bubbleColor || "#ffffff";
    const textColor = textEl.textColor || "#000000";

    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 2 * s;

    const padding = 8 * s;
    const fontSize = (textEl.fontSize || 16) * s;
    ctx.font = `${fontSize}px system-ui`;

    const metrics = ctx.measureText(textEl.text || '');
    const textWidth = metrics.width;
    const textHeight = fontSize;

    const bubbleWidth = textWidth + padding * 2;
    const bubbleHeight = textHeight + padding * 2;
    const bubbleX = scr.x - bubbleWidth / 2;
    const bubbleY = scr.y - bubbleHeight / 2;

    if (textType === 'bubble') {
      // Draw bubble shape (rounded rectangle with a pointer/tail)
      ctx.fillStyle = bubbleColor;

      // Draw the main bubble body
    window.DrawingUtils.roundRectPath(
      ctx,
      bubbleX,
      bubbleY,
      bubbleWidth,
      bubbleHeight,
        12 * s
      );

      // Add a small tail/pointer at the bottom
      const tailX = scr.x;
      const tailY = bubbleY + bubbleHeight;
      const tailWidth = 8 * s;
      const tailHeight = 6 * s;

      ctx.beginPath();
      ctx.moveTo(tailX - tailWidth/2, tailY);
      ctx.lineTo(tailX, tailY + tailHeight);
      ctx.lineTo(tailX + tailWidth/2, tailY);
      ctx.closePath();
    ctx.fill();
    ctx.stroke();
    } else {
      // Draw rectangle background
      ctx.fillStyle = bubbleColor;
      window.DrawingUtils.roundRectPath(
        ctx,
        bubbleX,
        bubbleY,
        bubbleWidth,
        bubbleHeight,
        4 * s
      );
      ctx.fill();
      ctx.stroke();
    }

    // Draw text
    ctx.fillStyle = textColor;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(textEl.text || '', scr.x, scr.y);
  });
}

// Bubble tail drawing function
function drawBubbleTail(ctx, pin, scr, width, height, tailType) {
  let tailPos = pin.tailPosition || { angle: 270, distance: 0.8 }; // Default: bottom
  
  // Auto-point to first connection if enabled
  if (pin.tailAutoPoint && window.app && window.app.appState) {
    const connections = window.app.appState.document.connections || [];
    const firstConnection = connections.find(c => c.from === pin.id || c.to === pin.id);
    
    if (firstConnection) {
      const otherPinId = firstConnection.from === pin.id ? firstConnection.to : firstConnection.from;
      const otherPin = window.app.appState.pins.find(p => p.id === otherPinId);
      
      if (otherPin) {
        const dx = otherPin.x - pin.x;
        const dy = otherPin.y - pin.y;
        const angleRad = Math.atan2(dy, dx);
        const angleDeg = (angleRad * 180) / Math.PI;
        tailPos = { angle: angleDeg, distance: tailPos.distance };
      }
    }
  }
  
  const tailAngle = (tailPos.angle * Math.PI) / 180; // Convert degrees to radians
  const tailDistance = tailPos.distance;

  // Calculate tail attachment point on bubble perimeter
  const tailAttachX = scr.x + Math.cos(tailAngle) * (width/2 * tailDistance);
  const tailAttachY = scr.y + Math.sin(tailAngle) * (height/2 * tailDistance);

  // Calculate tail tip point (extends outward from bubble)
  const tailLength = Math.min(width, height) * 0.3;

  switch (tailType) {
    case 'triangle':
      drawTriangleTail(ctx, tailAttachX, tailAttachY, tailAngle, tailLength);
      break;
    case 'curved':
      drawCurvedTail(ctx, tailAttachX, tailAttachY, tailAngle, tailLength);
      break;
    case 'arrow':
      drawArrowTail(ctx, tailAttachX, tailAttachY, tailAngle, tailLength);
      break;
    case 'curved-arrow':
      drawCurvedArrowTail(ctx, tailAttachX, tailAttachY, tailAngle, tailLength);
      break;
    default:
      drawTriangleTail(ctx, tailAttachX, tailAttachY, tailAngle, tailLength);
  }
}

function drawTriangleTail(ctx, attachX, attachY, angle, length) {
  const tipX = attachX + Math.cos(angle) * length;
  const tipY = attachY + Math.sin(angle) * length;
  const tailWidth = length * 0.4;

  ctx.beginPath();
  ctx.moveTo(attachX, attachY);
  ctx.lineTo(tipX - Math.sin(angle) * tailWidth/2, tipY + Math.cos(angle) * tailWidth/2);
  ctx.lineTo(tipX + Math.sin(angle) * tailWidth/2, tipY - Math.cos(angle) * tailWidth/2);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
}

function drawCurvedTail(ctx, attachX, attachY, angle, length) {
  const tipX = attachX + Math.cos(angle) * length;
  const tipY = attachY + Math.sin(angle) * length;
  const tailWidth = length * 0.35;

  // Create curved tail using quadratic curves
  const midX = attachX + Math.cos(angle) * length * 0.5;
  const midY = attachY + Math.sin(angle) * length * 0.5;

  // Control point for curve
  const cpX = midX - Math.sin(angle) * tailWidth * 0.7;
  const cpY = midY + Math.cos(angle) * tailWidth * 0.7;

  ctx.beginPath();
  ctx.moveTo(attachX, attachY);
  ctx.quadraticCurveTo(cpX, cpY, tipX, tipY);
  ctx.lineTo(tipX + Math.sin(angle) * tailWidth/2, tipY - Math.cos(angle) * tailWidth/2);
  ctx.quadraticCurveTo(cpX + Math.sin(angle) * tailWidth * 0.3, cpY - Math.cos(angle) * tailWidth * 0.3, attachX, attachY);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
}

function drawArrowTail(ctx, attachX, attachY, angle, length) {
  const tipX = attachX + Math.cos(angle) * length;
  const tipY = attachY + Math.sin(angle) * length;
  const tailWidth = length * 0.3;
  const arrowWidth = length * 0.5;

  ctx.beginPath();
  // Arrow shaft
  ctx.moveTo(attachX, attachY);
  ctx.lineTo(tipX - Math.cos(angle) * length * 0.3, tipY - Math.sin(angle) * length * 0.3);
  // Arrow head
  ctx.lineTo(tipX - Math.cos(angle) * length * 0.3 - Math.sin(angle) * arrowWidth/2,
             tipY - Math.sin(angle) * length * 0.3 + Math.cos(angle) * arrowWidth/2);
  ctx.lineTo(tipX, tipY);
  ctx.lineTo(tipX - Math.cos(angle) * length * 0.3 + Math.sin(angle) * arrowWidth/2,
             tipY - Math.sin(angle) * length * 0.3 - Math.cos(angle) * arrowWidth/2);
  ctx.lineTo(tipX - Math.cos(angle) * length * 0.3, tipY - Math.sin(angle) * length * 0.3);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
}

function drawCurvedArrowTail(ctx, attachX, attachY, angle, length) {
  const tipX = attachX + Math.cos(angle) * length;
  const tipY = attachY + Math.sin(angle) * length;
  const tailWidth = length * 0.35;
  const arrowWidth = length * 0.4;

  // Create curved arrow tail
  const midX = attachX + Math.cos(angle) * length * 0.4;
  const midY = attachY + Math.sin(angle) * length * 0.4;
  const shaftX = attachX + Math.cos(angle) * length * 0.7;
  const shaftY = attachY + Math.sin(angle) * length * 0.7;

  // Control point for curve
  const cpX = midX - Math.sin(angle) * tailWidth * 0.8;
  const cpY = midY + Math.cos(angle) * tailWidth * 0.8;

  ctx.beginPath();
  ctx.moveTo(attachX, attachY);
  ctx.quadraticCurveTo(cpX, cpY, shaftX, shaftY);
  // Arrow head
  ctx.lineTo(tipX - Math.cos(angle) * length * 0.1 - Math.sin(angle) * arrowWidth/2,
             tipY - Math.sin(angle) * length * 0.1 + Math.cos(angle) * arrowWidth/2);
  ctx.lineTo(tipX, tipY);
  ctx.lineTo(tipX - Math.cos(angle) * length * 0.1 + Math.sin(angle) * arrowWidth/2,
             tipY - Math.sin(angle) * length * 0.1 - Math.cos(angle) * arrowWidth/2);
  ctx.lineTo(shaftX, shaftY);
  ctx.quadraticCurveTo(cpX + Math.sin(angle) * tailWidth * 0.4, cpY - Math.cos(angle) * tailWidth * 0.4, attachX, attachY);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
}

/**
 * Draw a comic book style speech bubble with integrated tail
 * Based on classic comic conventions - tail is a simple pointed shape
 * seamlessly integrated into the bubble outline
 */
function drawComicBubbleTail(ctx, pin, scr, width, height, tailType, fillColor, fillAlpha, strokeColor, strokeAlpha, strokeWidth) {
  // For thought bubbles, draw cloud shape with trailing circles
  if (tailType === 'thought') {
    drawThoughtBubble(ctx, pin, scr, width, height, fillColor, fillAlpha, strokeColor, strokeAlpha, strokeWidth);
    return;
  }

  let tailPos = pin.tailPosition || { angle: 225, distance: 0.8 };
  
  // Auto-point to first connection if enabled
  if (pin.tailAutoPoint && window.app && window.app.appState) {
    const connections = window.app.appState.connections || [];
    const firstConnection = connections.find(c => c.from === pin.id || c.to === pin.id);
    
    if (firstConnection) {
      const otherPinId = firstConnection.from === pin.id ? firstConnection.to : firstConnection.from;
      const otherPin = window.app.appState.pins.find(p => p.id === otherPinId);
      
      if (otherPin) {
        const dx = otherPin.x - pin.x;
        const dy = otherPin.y - pin.y;
        tailPos = { angle: Math.atan2(dy, dx) * 180 / Math.PI, distance: tailPos.distance };
      }
    }
  }
  
  const tailAngle = tailPos.angle * Math.PI / 180;
  const rx = width / 2;
  const ry = height / 2;
  
  // Classic comic tail: small, pointed, elegant
  // Tail base is narrow (~15 degrees arc on the ellipse)
  const tailBaseArc = 12 * Math.PI / 180;
  
  // Tail length - proportional but not too long
  const tailLength = Math.min(width, height) * 0.35;
  
  // Calculate where tail attaches to ellipse
  const tailStartAngle = tailAngle - tailBaseArc;
  const tailEndAngle = tailAngle + tailBaseArc;
  
  // Tip of tail - pointed end
  const tipX = scr.x + (Math.max(rx, ry) + tailLength) * Math.cos(tailAngle);
  const tipY = scr.y + (Math.max(rx, ry) * 0.7 + tailLength) * Math.sin(tailAngle);

  ctx.save();
  ctx.fillStyle = hexToRgba(fillColor, fillAlpha);
  ctx.strokeStyle = hexToRgba(strokeColor, strokeAlpha);
  ctx.lineWidth = strokeWidth;
  ctx.lineJoin = 'miter'; // Sharp corners for the tail point
  ctx.miterLimit = 10;
  
  // Draw bubble + tail as ONE unified path
  ctx.beginPath();
  
  // Draw the ellipse arc, leaving a gap where the tail attaches
  // Start just after where tail ends, go all the way around to where tail starts
  ctx.ellipse(scr.x, scr.y, rx, ry, 0, tailEndAngle, tailStartAngle + Math.PI * 2);
  
  // Now draw the tail - straight lines to create classic pointed tail
  ctx.lineTo(tipX, tipY);
  
  // Close back to where we started (the ellipse path will close it)
  ctx.closePath();
  
  ctx.fill();
  ctx.stroke();
  
  ctx.restore();
}

/**
 * Draw a thought bubble - cloud shape with trailing small circles
 */
function drawThoughtBubble(ctx, pin, scr, width, height, fillColor, fillAlpha, strokeColor, strokeAlpha, strokeWidth) {
  let tailPos = pin.tailPosition || { angle: 225, distance: 0.8 };
  const tailAngle = tailPos.angle * Math.PI / 180;
  const rx = width / 2;
  const ry = height / 2;
  
  ctx.save();
  ctx.fillStyle = hexToRgba(fillColor, fillAlpha);
  ctx.strokeStyle = hexToRgba(strokeColor, strokeAlpha);
  ctx.lineWidth = strokeWidth;
  
  // Draw cloud-like main bubble using overlapping circles
  ctx.beginPath();
  
  // Create cloud shape with bumpy edges
  const numBumps = 12;
  const bumpSize = Math.min(rx, ry) * 0.3;
  
  for (let i = 0; i < numBumps; i++) {
    const angle = (i / numBumps) * Math.PI * 2;
    const bumpX = scr.x + (rx - bumpSize * 0.3) * Math.cos(angle);
    const bumpY = scr.y + (ry - bumpSize * 0.3) * Math.sin(angle);
    
    if (i === 0) {
      ctx.moveTo(bumpX + bumpSize, bumpY);
    }
    
    // Draw arc for each bump
    ctx.arc(bumpX, bumpY, bumpSize, angle - Math.PI/numBumps, angle + Math.PI/numBumps);
  }
  
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  
  // Draw trailing circles (thought tail)
  const numTrailingCircles = 3;
  const startDist = Math.max(rx, ry) * 0.9;
  
  for (let i = 0; i < numTrailingCircles; i++) {
    const t = (i + 1) / (numTrailingCircles + 0.5);
    const dist = startDist + t * Math.min(width, height) * 0.5;
    const cx = scr.x + dist * Math.cos(tailAngle);
    const cy = scr.y + dist * Math.sin(tailAngle);
    // Circles get smaller as they trail away
    const radius = Math.min(width, height) * 0.1 * (1 - t * 0.6);
    
    ctx.beginPath();
    ctx.arc(cx, cy, Math.max(radius, 3), 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
  
  ctx.restore();
}

// Register text pin shapes (bubble and rectangle)
// Comic book style speech bubble with oval shape
registerShape("bubble", {
  getMetrics: function(pin) {
    const width = pin.width || 140;
    const height = pin.height || 80;

    return {
      shape: pin.shape || "bubble",
      width: width,
      height: height,
      radius: Math.min(width, height) / 2,
      labelOffsetY: 0
    };
  },
  drawPhase: {
    // Empty shadow - bubble draws its own shadow if needed
    shadow: function() {},
    background: function(ctx, pin, metrics, scr, pinScale) {
      const bubbleColor = pin.color || "#ffffff";
      const bubbleColorAlpha = pin.colorAlpha !== undefined ? pin.colorAlpha : 1;
      const borderColor = pin.borderColor || "#000000";
      const borderColorAlpha = pin.borderColorAlpha !== undefined ? pin.borderColorAlpha : 1;
      const width = pin.width || 140;
      const height = pin.height || 80;
      const borderWidth = pin.borderWidth || 2;
      const dropShadow = pin.dropShadow || false;

      ctx.save();

      // Apply drop shadow if enabled
      if (dropShadow) {
        ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
        ctx.shadowBlur = 8;
        ctx.shadowOffsetX = 3;
        ctx.shadowOffsetY = 3;
      }

      const tailType = pin.tailType || 'curved';
      
      if (tailType === 'none') {
        // No tail - just draw the ellipse
        ctx.fillStyle = hexToRgba(bubbleColor, bubbleColorAlpha);
        ctx.strokeStyle = hexToRgba(borderColor, borderColorAlpha);
        ctx.lineWidth = borderWidth;
        
        ctx.beginPath();
        ctx.ellipse(scr.x, scr.y, width/2, height/2, 0, 0, Math.PI * 2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      } else {
        // Draw bubble WITH tail as ONE unified shape (no seam)
        drawComicBubbleTail(ctx, pin, scr, width, height, tailType, bubbleColor, bubbleColorAlpha, borderColor, borderColorAlpha, borderWidth);
      }

      ctx.restore();
    },
    // Empty main phase - bubble draws everything in background phase
    main: function() {},
    // Empty decoration phase
    decoration: function() {},
    label: function(ctx, pin, metrics, scr, pinScale, appScale) {
      // Separate colors for title and description (with backwards compatibility)
      const defaultTextColor = pin.textColor || "#000000";
      const defaultTextAlpha = pin.textColorAlpha !== undefined ? pin.textColorAlpha : 1;
      const titleColor = pin.titleColor || defaultTextColor;
      const titleColorAlpha = pin.titleColorAlpha !== undefined ? pin.titleColorAlpha : defaultTextAlpha;
      const descriptionColor = pin.descriptionColor || defaultTextColor;
      const descriptionColorAlpha = pin.descriptionColorAlpha !== undefined ? pin.descriptionColorAlpha : defaultTextAlpha;
      const fontSize = pin.fontSize || 14;
      const width = pin.width || 120;
      const height = pin.height || 60;

      // Save context
      ctx.save();

      // Draw description inside bubble (centered)
      if (pin.description) {
        ctx.fillStyle = hexToRgba(descriptionColor, descriptionColorAlpha);
        ctx.font = `${fontSize}px system-ui`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        // Word wrap and render text
        if (window.calculateTextDimensions) {
          const dims = window.calculateTextDimensions(pin.description, fontSize, 'system-ui', 16, 60, 30, width);
          const lineHeight = fontSize * 1.3;
          const startY = scr.y - (dims.lines.length - 1) * lineHeight / 2;
          
          dims.lines.forEach((line, index) => {
            const y = startY + index * lineHeight;
            ctx.fillText(line, scr.x, y);
          });
        } else {
          // Fallback: simple newline split
          const lines = pin.description.split('\n');
          const lineHeight = fontSize * 1.2;
          const startY = scr.y - (lines.length - 1) * lineHeight / 2;
          
          lines.forEach((line, index) => {
            const y = startY + index * lineHeight;
            ctx.fillText(line, scr.x, y);
          });
        }
      }

      // Draw title below bubble (10% larger, centered)
      if (pin.label) {
        const titleFontSize = Math.round(fontSize * 1.1); // 10% larger
        ctx.fillStyle = hexToRgba(titleColor, titleColorAlpha);
        ctx.font = `${titleFontSize}px system-ui`;
        ctx.textAlign = "center";
        ctx.textBaseline = "top"; // Start from top of text

        // Position title below the bubble with a small gap
        const titleY = scr.y + height/2 + 8; // 8px gap below bubble
        ctx.fillText(pin.label, scr.x, titleY);
      }

      // Restore context
      ctx.restore();
    }
  }
});

registerShape("rectangle", {
  getMetrics: function(pin) {
    const width = pin.width || 100;
    const height = pin.height || 40;
    return {
      shape: pin.shape || "rectangle",
      width: width,
      height: height,
      radius: Math.min(width, height) / 2,
      labelOffsetY: 0
    };
  },
  drawPhase: {
    // Empty shadow - rectangle draws its own shadow if needed
    shadow: function() {},
    background: function(ctx, pin, metrics, scr, pinScale) {
      const bubbleColor = pin.color || "#ffffff";
      const bubbleColorAlpha = pin.colorAlpha !== undefined ? pin.colorAlpha : 1;
      const borderColor = pin.borderColor || "#000000";
      const borderColorAlpha = pin.borderColorAlpha !== undefined ? pin.borderColorAlpha : 1;
      const width = pin.width || 100;
      const height = pin.height || 40;
      const borderWidth = pin.borderWidth || 2;
      const dropShadow = pin.dropShadow || false;

      // Save context
      ctx.save();

      // Apply drop shadow if enabled
      if (dropShadow) {
        ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
        ctx.shadowBlur = 5;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;
      }

      // Apply colors with alpha
      ctx.fillStyle = hexToRgba(bubbleColor, bubbleColorAlpha);
      ctx.strokeStyle = hexToRgba(borderColor, borderColorAlpha);
      ctx.lineWidth = borderWidth;

      // Draw rounded rectangle
      const cornerRadius = Math.min(width, height) * 0.2; // Adaptive corner radius
      window.DrawingUtils.roundRectPath(
        ctx,
        scr.x - width/2,
        scr.y - height/2,
        width,
        height,
        cornerRadius
      );
      ctx.fill();
      ctx.stroke();

      // Restore context
      ctx.restore();
    },
    // Empty main phase - rectangle draws everything in background phase
    main: function() {},
    // Empty decoration phase
    decoration: function() {},
    label: function(ctx, pin, metrics, scr, pinScale, appScale) {
      // Separate colors for title and description (with backwards compatibility)
      const defaultTextColor = pin.textColor || "#000000";
      const defaultTextAlpha = pin.textColorAlpha !== undefined ? pin.textColorAlpha : 1;
      const titleColor = pin.titleColor || defaultTextColor;
      const titleColorAlpha = pin.titleColorAlpha !== undefined ? pin.titleColorAlpha : defaultTextAlpha;
      const descriptionColor = pin.descriptionColor || defaultTextColor;
      const descriptionColorAlpha = pin.descriptionColorAlpha !== undefined ? pin.descriptionColorAlpha : defaultTextAlpha;
      const fontSize = pin.fontSize || 14;
      const width = pin.width || 100;
      const height = pin.height || 40;

      // Save context
      ctx.save();

      // Draw description inside rectangle (centered)
      if (pin.description) {
        ctx.fillStyle = hexToRgba(descriptionColor, descriptionColorAlpha);
        ctx.font = `${fontSize}px system-ui`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        // Word wrap and render text
        if (window.calculateTextDimensions) {
          const dims = window.calculateTextDimensions(pin.description, fontSize, 'system-ui', 16, 60, 30, width);
          const lineHeight = fontSize * 1.3;
          const startY = scr.y - (dims.lines.length - 1) * lineHeight / 2;
          
          dims.lines.forEach((line, index) => {
            const y = startY + index * lineHeight;
            ctx.fillText(line, scr.x, y);
          });
        } else {
          // Fallback: simple newline split
          const lines = pin.description.split('\n');
          const lineHeight = fontSize * 1.2;
          const startY = scr.y - (lines.length - 1) * lineHeight / 2;
          
          lines.forEach((line, index) => {
            const y = startY + index * lineHeight;
            ctx.fillText(line, scr.x, y);
          });
        }
      }

      // Draw title below rectangle (10% larger, centered)
      if (pin.label) {
        const titleFontSize = Math.round(fontSize * 1.1); // 10% larger
        ctx.fillStyle = hexToRgba(titleColor, titleColorAlpha);
        ctx.font = `${titleFontSize}px system-ui`;
        ctx.textAlign = "center";
        ctx.textBaseline = "top"; // Start from top of text

        // Position title below the rectangle with a small gap
        const titleY = scr.y + height/2 + 8; // 8px gap below rectangle
        ctx.fillText(pin.label, scr.x, titleY);
      }

      // Restore context
      ctx.restore();
    }
  }
});

// Register thought bubble shape (cloud with trailing circles)
registerShape("thought", {
  getMetrics: function(pin) {
    const width = pin.width || 140;
    const height = pin.height || 90;
    return {
      shape: pin.shape || "thought",
      width: width,
      height: height,
      radius: Math.min(width, height) / 2,
      labelOffsetY: 0
    };
  },
  drawPhase: {
    shadow: function() {},
    background: function(ctx, pin, metrics, scr, pinScale) {
      const bubbleColor = pin.color || "#ffffff";
      const bubbleColorAlpha = pin.colorAlpha !== undefined ? pin.colorAlpha : 1;
      const borderColor = pin.borderColor || "#000000";
      const borderColorAlpha = pin.borderColorAlpha !== undefined ? pin.borderColorAlpha : 1;
      const width = pin.width || 140;
      const height = pin.height || 90;
      const borderWidth = pin.borderWidth || 2;

      ctx.save();
      ctx.fillStyle = hexToRgba(bubbleColor, bubbleColorAlpha);
      ctx.strokeStyle = hexToRgba(borderColor, borderColorAlpha);
      ctx.lineWidth = borderWidth;

      const rx = width / 2;
      const ry = height / 2;

      // Draw cloud shape using overlapping circles
      // First, fill the interior with overlapping circles
      const cloudBumps = [
        // Top bumps
        { x: -0.5, y: -0.7, r: 0.45 },
        { x: 0.1, y: -0.8, r: 0.4 },
        { x: 0.55, y: -0.6, r: 0.42 },
        // Right bumps
        { x: 0.8, y: -0.2, r: 0.38 },
        { x: 0.75, y: 0.35, r: 0.4 },
        // Bottom bumps
        { x: 0.4, y: 0.7, r: 0.38 },
        { x: -0.2, y: 0.75, r: 0.42 },
        // Left bumps
        { x: -0.7, y: 0.4, r: 0.38 },
        { x: -0.8, y: -0.15, r: 0.4 },
        // Center fill
        { x: 0, y: 0, r: 0.6 },
        { x: -0.25, y: -0.2, r: 0.5 },
        { x: 0.25, y: 0.15, r: 0.48 },
      ];

      // Draw all cloud bumps as fills first (to create solid interior)
      ctx.beginPath();
      cloudBumps.forEach((bump, i) => {
        const cx = scr.x + bump.x * rx;
        const cy = scr.y + bump.y * ry;
        const cr = bump.r * Math.min(rx, ry);
        
        ctx.moveTo(cx + cr, cy);
        ctx.arc(cx, cy, cr, 0, Math.PI * 2);
      });
      ctx.fill();

      // Now draw the outline - only the outer edges of the bumps
      // Draw each bump's arc that faces outward
      cloudBumps.slice(0, 9).forEach((bump) => {
        const cx = scr.x + bump.x * rx;
        const cy = scr.y + bump.y * ry;
        const cr = bump.r * Math.min(rx, ry);
        
        // Calculate angle from center to this bump
        const angleToCenter = Math.atan2(-bump.y, -bump.x);
        // Draw arc facing away from center (roughly 180 degrees)
        const startAngle = angleToCenter - Math.PI * 0.6;
        const endAngle = angleToCenter + Math.PI * 0.6;
        
        ctx.beginPath();
        ctx.arc(cx, cy, cr, startAngle, endAngle);
        ctx.stroke();
      });

      // Draw trailing thought circles (drops)
      let tailPos = pin.tailPosition || { angle: 225, distance: 0.8 };
      const tailAngle = tailPos.angle * Math.PI / 180;
      
      // 3 circular drops, decreasing in size
      const drops = [
        { dist: 1.15, size: 0.18 },
        { dist: 1.35, size: 0.12 },
        { dist: 1.5, size: 0.07 }
      ];
      
      drops.forEach((drop) => {
        const dist = Math.max(rx, ry) * drop.dist;
        const cx = scr.x + dist * Math.cos(tailAngle);
        const cy = scr.y + dist * Math.sin(tailAngle);
        const radius = Math.min(width, height) * drop.size;
        
        ctx.beginPath();
        ctx.arc(cx, cy, Math.max(radius, 3), 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      });

      ctx.restore();
    },
    main: function() {},
    decoration: function() {},
    label: function(ctx, pin, metrics, scr, pinScale, appScale) {
      const defaultTextColor = pin.textColor || "#000000";
      const defaultTextAlpha = pin.textColorAlpha !== undefined ? pin.textColorAlpha : 1;
      const fontSize = pin.fontSize || 14;
      const width = pin.width || 140;
      const height = pin.height || 90;

      ctx.save();

      // Draw text inside thought bubble (centered)
      if (pin.description) {
        ctx.fillStyle = hexToRgba(defaultTextColor, defaultTextAlpha);
        ctx.font = `italic ${fontSize}px system-ui`; // Italic for thoughts
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        if (window.calculateTextDimensions) {
          const dims = window.calculateTextDimensions(pin.description, fontSize, 'system-ui', 16, 60, 30, width * 0.7);
          const lineHeight = fontSize * 1.3;
          const startY = scr.y - (dims.lines.length - 1) * lineHeight / 2;
          
          dims.lines.forEach((line, index) => {
            ctx.fillText(line, scr.x, startY + index * lineHeight);
          });
        } else {
          ctx.fillText(pin.description, scr.x, scr.y);
        }
      }

      // Draw label/title below bubble
      if (pin.label) {
        const titleFontSize = Math.round(fontSize * 1.1);
        ctx.fillStyle = hexToRgba(defaultTextColor, defaultTextAlpha);
        ctx.font = `${titleFontSize}px system-ui`;
        ctx.textAlign = "center";
        ctx.textBaseline = "top";
        ctx.fillText(pin.label, scr.x, scr.y + height/2 + 15);
      }

      ctx.restore();
    }
  }
});

// Register text-plain shape (just text, no background)
registerShape("text-plain", {
  getMetrics: function(pin) {
    const width = pin.width || 150;
    const height = pin.height || 30;
    return {
      shape: pin.shape || "text-plain",
      width: width,
      height: height,
      radius: 0,
      labelOffsetY: 0
    };
  },
  drawPhase: {
    background: function(ctx, pin, metrics, scr, pinScale) {
      // No background for plain text - just draw a subtle selection indicator if selected
      const isSelected = pin.isSelected || false;
      if (isSelected) {
        const width = pin.width || 150;
        const height = pin.height || 30;
        ctx.save();
        ctx.strokeStyle = 'rgba(88, 166, 255, 0.5)';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.strokeRect(scr.x - width/2 - 5, scr.y - height/2 - 5, width + 10, height + 10);
        ctx.setLineDash([]);
        ctx.restore();
      }
    },
    label: function(ctx, pin, metrics, scr, pinScale, appScale) {
      // Separate colors for title and description (with backwards compatibility)
      const defaultTextColor = pin.textColor || pin.color || "#ffffff";
      const defaultTextAlpha = pin.textColorAlpha !== undefined ? pin.textColorAlpha : 1;
      const titleColor = pin.titleColor || defaultTextColor;
      const titleColorAlpha = pin.titleColorAlpha !== undefined ? pin.titleColorAlpha : defaultTextAlpha;
      const descriptionColor = pin.descriptionColor || defaultTextColor;
      const descriptionColorAlpha = pin.descriptionColorAlpha !== undefined ? pin.descriptionColorAlpha : defaultTextAlpha;
      const fontSize = pin.fontSize || 14;
      const width = pin.width || 150;

      ctx.save();

      // Draw description (main text content) - centered in the bounds
      if (pin.description) {
        ctx.fillStyle = hexToRgba(descriptionColor, descriptionColorAlpha);
        ctx.font = `${fontSize}px system-ui`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        
        const lines = pin.description.split('\n');
        const lineHeight = fontSize * 1.2;
        const startY = scr.y - (lines.length - 1) * lineHeight / 2;

        lines.forEach((line, index) => {
          const y = startY + index * lineHeight;
          ctx.fillText(line, scr.x, y);
        });
      }

      // Draw label below if present
      if (pin.label) {
        const labelFontSize = Math.round(fontSize * 0.85);
        ctx.font = `${labelFontSize}px system-ui`;
        ctx.fillStyle = hexToRgba(titleColor, titleColorAlpha * 0.7);
        const height = pin.height || 30;
        ctx.fillText(pin.label, scr.x, scr.y + height/2 + labelFontSize);
      }

      ctx.restore();
    }
  }
});

// Register text-title shape (large title text, with underline)
registerShape("text-title", {
  getMetrics: function(pin) {
    const width = pin.width || 200;
    const height = pin.height || 40;
    return {
      shape: pin.shape || "text-title",
      width: width,
      height: height,
      radius: 0,
      labelOffsetY: 0
    };
  },
  drawPhase: {
    background: function(ctx, pin, metrics, scr, pinScale) {
      // Optional subtle underline for title
      const width = pin.width || 200;
      const height = pin.height || 40;
      const showUnderline = pin.showUnderline !== false; // Default to true
      const borderColorAlpha = pin.borderColorAlpha !== undefined ? pin.borderColorAlpha : 1;
      
      if (showUnderline) {
        ctx.save();
        const underlineColor = pin.borderColor || pin.color || '#58a6ff';
        ctx.strokeStyle = hexToRgba(underlineColor, borderColorAlpha);
        ctx.lineWidth = 3;
        
        ctx.beginPath();
        ctx.moveTo(scr.x - width/2, scr.y + height/2 - 2);
        ctx.lineTo(scr.x + width/2, scr.y + height/2 - 2);
        ctx.stroke();
        ctx.restore();
      }
      
      // Selection indicator
      const isSelected = pin.isSelected || false;
      if (isSelected) {
        ctx.save();
        ctx.strokeStyle = 'rgba(88, 166, 255, 0.5)';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.strokeRect(scr.x - width/2 - 5, scr.y - height/2 - 5, width + 10, height + 10);
        ctx.setLineDash([]);
        ctx.restore();
      }
    },
    label: function(ctx, pin, metrics, scr, pinScale, appScale) {
      // Separate colors for title and description (with backwards compatibility)
      const defaultTextColor = pin.textColor || "#ffffff";
      const defaultTextAlpha = pin.textColorAlpha !== undefined ? pin.textColorAlpha : 1;
      const titleColor = pin.titleColor || defaultTextColor;
      const titleColorAlpha = pin.titleColorAlpha !== undefined ? pin.titleColorAlpha : defaultTextAlpha;
      const descriptionColor = pin.descriptionColor || defaultTextColor;
      const descriptionColorAlpha = pin.descriptionColorAlpha !== undefined ? pin.descriptionColorAlpha : defaultTextAlpha;
      const fontSize = pin.fontSize || 24;

      ctx.save();

      // For title shape, description IS the main title text (centered)
      if (pin.description) {
        ctx.fillStyle = hexToRgba(descriptionColor, descriptionColorAlpha);
        ctx.font = `bold ${fontSize}px system-ui`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        
        const lines = pin.description.split('\n');
        const lineHeight = fontSize * 1.2;
        const startY = scr.y - (lines.length - 1) * lineHeight / 2;

        lines.forEach((line, index) => {
          const y = startY + index * lineHeight;
          ctx.fillText(line, scr.x, y);
        });
      }

      // Subtitle (label) below
      if (pin.label) {
        const subtitleFontSize = Math.round(fontSize * 0.6);
        ctx.font = `${subtitleFontSize}px system-ui`;
        ctx.fillStyle = hexToRgba(titleColor, titleColorAlpha * 0.7);
        const height = pin.height || 40;
        ctx.fillText(pin.label, scr.x, scr.y + height/2 + subtitleFontSize + 5);
      }

      ctx.restore();
    }
  }
});

// Make shapeRenderers, pin drawing, and text drawing globally available
window.shapeRenderers = shapeRenderers;
window.drawPinShape = drawPinShape;
window.drawTextElements = drawTextElements;
window.DRAW_PHASES = DRAW_PHASES;

// Shape registration verification
if (!shapeRenderers.get("card")) {
  // Card renderer not found - this would cause issues
}
