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
      // Full custom implementation
      rendererConfig = {
        getMetrics: config.getMetrics || defaultGetMetrics,
        drawPhase: {
          shadow: config.drawShadow || defaultDrawShadow,
          background: config.drawBackground || defaultDrawBackground,
          main: config.drawMain || defaultDrawMain,
          decoration: config.drawDecoration || (() => {}),
          selection: config.drawSelection || defaultDrawSelection,
          label: config.drawLabel || defaultDrawLabel,
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

  let cardTypeId = "card:card";
  if (areaPin.icon) {
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

  const centerPin = {
    x: areaPin.x || 0,
    y: areaPin.y || 0,
    color: areaPin.color || "#58a6ff",
    typeId: cardTypeId,
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

  ctx.save();
  ctx.strokeStyle = isMarquee ? "#f90" : "rgba(255,255,255,0.9)";
  ctx.lineWidth = isMarquee ? 4 / s : 2.5;

  const m = metrics;

  if (m.shape === "circle" || m.shape === "area-circle") {
    const r = (m.radius || 24) * s;
    ctx.beginPath();
    ctx.arc(scr.x, scr.y, r + 6 * s, 0, Math.PI * 2);
    ctx.stroke();
  } else {
    const w = m.width * s,
      h = m.height * s;
    const x = scr.x - w / 2,
      y = scr.y - h / 2;
    const r = m.baseRadius * s || 6 * s;
    window.DrawingUtils.roundRectPath(
      ctx,
      x - 6 * s,
      y - 6 * s,
      w + 12 * s,
      h + 12 * s,
      r + 4 * s
    );
    ctx.stroke();
  }
  ctx.restore();
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
    ctx.fillStyle = "rgba(0,0,0,0.35)"; // Match default shadow opacity
    ctx.beginPath();
    ctx.arc(scr.x + 3 * s, scr.y + 4 * s, r * 1.05, 0, Math.PI * 2); // Match default offset and size
    ctx.fill();
  },
  drawSelection(ctx, pin, m, scr, s, isSelected, isMarquee) {
    if (!isSelected && !isMarquee) return;

    ctx.save();
    // Prioritize selection (white) over marquee (orange)
    ctx.strokeStyle = isSelected ? "rgba(255,255,255,0.5)" : "#f90";
    ctx.lineWidth = isSelected ? 4 : 4 / s; // Thicker for selection

    // Circle selection - on top of the circle, not outside
    const circleRadius = m.radius * s; // Same radius as the circle

    ctx.beginPath();
    ctx.arc(scr.x, scr.y, circleRadius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  },
});

// ── Area Rectangle ───────────────────────────────────────────────────────

registerShape("area-rect", {
  baseShape: "area-rect",
  drawDecoration(ctx, pin, m, scr, s) {
    // Center pin
    drawCenterPin(ctx, pin, scr);
  },
});

// ── Area Circle ──────────────────────────────────────────────────────────

registerShape("area-circle", {
  baseShape: "area-circle",
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

// ── Pill shape ─────────────────────────────────────────────────────────────

registerShape("pill", {
  getMetrics(pin, scale) {
    // Pill shape: wider than tall, with fully rounded ends
    return {
      shape: "pill",
      width: 32 * scale,  // 32px wide (elongated)
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
    const bodyHeight = 15; // 40 / 2
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
      headYOffset: -5, // -20 / 2 - adjusted offset to position icon higher for better centering
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
  // Get complete metrics from getPinMetrics and merge with passed metrics
  const fullMetrics = window.getPinMetrics
    ? window.getPinMetrics(pin)
    : metrics;
  const mergedMetrics = { ...fullMetrics, ...metrics }; // Passed metrics override getPinMetrics

  // Use world coordinates directly since canvas is already transformed
  const scr = { x: pin.x, y: pin.y };

  // FIRST: Check for custom theme icons
  if (window.themeManager) {
    const currentTheme = window.themeManager.getCurrentTheme();
    const pinType = pin.typeId || 'pin:circle';

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
      if (typeof pinScale !== 'number' || isNaN(pinScale) || !isFinite(pinScale) || pinScale <= 0) {
        console.warn(`⚠️ Invalid pinScale for pin ${index}: ${pinScale}, using 1.0`);
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
        renderer.drawPhase.label(ctx, pin, finalMetrics, scr, pinScale, appScale);
      }

      ctx.restore();
    } catch (error) {}
  } else {
  }
}

// ── Draw Text Elements ───────────────────────────────────────────────────
function drawTextElements(
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
    ctx.fillStyle = textEl.color || "#ffffff";
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 2 * s;

    const padding = 8 * s;
    const fontSize = (textEl.fontSize || 16) * s;
    ctx.font = `${fontSize}px system-ui`;

    const metrics = ctx.measureText(textEl.content);
    const textWidth = metrics.width;
    const textHeight = fontSize;

    const bubbleWidth = textWidth + padding * 2;
    const bubbleHeight = textHeight + padding * 2;
    const bubbleX = scr.x - bubbleWidth / 2;
    const bubbleY = scr.y - bubbleHeight / 2;

    // Draw rounded rectangle background
    window.DrawingUtils.roundRectPath(
      ctx,
      bubbleX,
      bubbleY,
      bubbleWidth,
      bubbleHeight,
      8 * s
    );
    ctx.fill();
    ctx.stroke();

    // Draw text
    ctx.fillStyle = "#000000";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(textEl.content, scr.x, scr.y);
  });
}

// Make shapeRenderers, pin drawing, and text drawing globally available
window.shapeRenderers = shapeRenderers;
window.drawPinShape = drawPinShape;
window.drawTextElements = drawTextElements;
window.DRAW_PHASES = DRAW_PHASES;

// Shape registration verification
if (!shapeRenderers.get("card")) {
  // Card renderer not found - this would cause issues
}
