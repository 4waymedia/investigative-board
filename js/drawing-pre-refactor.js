// ============================================================================
// DRAWING MODULE - Refactored 2025/2026 style
// ============================================================================


// ── Utility functions ────────────────────────────────────────────────────

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

// ── Shape renderers registry ─────────────────────────────────────────────
const shapeRenderers = new Map();

/**
 * Register a new shape type
 * @param {string} shapeName
 * @param {Object} config
 */
function registerShape(shapeName, config) {
  shapeRenderers.set(shapeName, {
    getMetrics: config.getMetrics || defaultGetMetrics,
    drawPhase: {
      [DRAW_PHASES.SHADOW]: config.drawShadow || defaultDrawShadow,
      [DRAW_PHASES.BACKGROUND]: config.drawBackground || defaultDrawBackground,
      [DRAW_PHASES.MAIN]: config.drawMain || defaultDrawMain,
      [DRAW_PHASES.DECORATION]: config.drawDecoration || (() => {}),
      [DRAW_PHASES.SELECTION]: config.drawSelection || defaultDrawSelection,
      [DRAW_PHASES.LABEL]: config.drawLabel || defaultDrawLabel,
    },
  });
}

// Put this back near the top of the file, before shapeRenderers
function drawCenterPin(areaPin, centerPos) {
  if (
    !areaPin ||
    typeof areaPin.x !== "number" ||
    typeof areaPin.y !== "number"
  ) {
    console.warn("drawCenterPin: Invalid areaPin", areaPin);
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

  const centerPin = {
    x: areaPin.x || 0,
    y: areaPin.y || 0,
    color: areaPin.color || "#58a6ff",
    typeId: cardTypeId,
    label: areaPin.title || "",
    title: areaPin.title || "",
    description: areaPin.description || "",
    pinScale: pinScale,
  };

  if (!centerPin.typeId) {
    console.warn("Center pin missing typeId:", centerPin);
    return;
  }

  const centerMetrics = getPinMetrics(centerPin); // ← make sure this function exists!

  // The tricky part: temporarily override worldToScreen
  const originalWorldToScreen = window.worldToScreen;
  window.worldToScreen = () => centerPos;

  drawPinShape(centerPin, centerMetrics, -1); // -1 = not selectable

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
function defaultDrawShadow(ctx, pin, metrics, scr, s) {
  const m = metrics;

  // Most common cases
  if (m.shape === "circle" || m.shape === "area-circle") {
    const r = (m.radius || 24) * s;
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.beginPath();
    ctx.arc(scr.x + 3 * s, scr.y + 4 * s, r * 1.05, 0, Math.PI * 2);
    ctx.fill();
    return;
  }

  // Rectangular / card-like shapes
  if (m.width && m.height) {
    const w = m.width * s;
    const h = m.height * s;
    const x = scr.x - w / 2;
    const y = scr.y - h / 2;
    const r = (m.baseRadius || 6) * s;

    ctx.fillStyle = "rgba(0,0,0,0.35)";
    roundRectPath(ctx, x + 3 * s, y + 4 * s, w, h, r);
    ctx.fill();
    return;
  }

  // Ultimate fallback — small circle
  ctx.fillStyle = "rgba(0,0,0,0.4)";
  ctx.beginPath();
  ctx.arc(scr.x + 3 * s, scr.y + 3 * s, 24 * s, 0, Math.PI * 2);
  ctx.fill();
}

// Default background — usually used for outline/glow/halo effects
// (many shapes skip this phase completely → empty function is also ok)
function defaultDrawBackground(ctx, pin, metrics, scr, s) {
  // Most common use-case: very faint outer glow / safety padding
  // Many modern designs actually skip this phase

  const m = metrics;
  ctx.globalAlpha = 0.15;

  if (m.shape === "circle" || m.shape === "area-circle") {
    const r = (m.radius || 24) * s;
    ctx.fillStyle = pin.color || "#58a6ff";
    ctx.beginPath();
    ctx.arc(scr.x, scr.y, r * 1.25, 0, Math.PI * 2);
    ctx.fill();
  } else if (m.width && m.height) {
    const w = m.width * s;
    const h = m.height * s;
    const x = scr.x - w / 2;
    const y = scr.y - h / 2;
    const r = (m.baseRadius || 6) * s;

    ctx.fillStyle = pin.color || "#58a6ff";
    roundRectPath(ctx, x - 4 * s, y - 4 * s, w + 8 * s, h + 8 * s, r + 4 * s);
    ctx.fill();
  }

  ctx.globalAlpha = 1.0; // always restore
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
    roundRectPath(ctx, x, y, w, h, cornerRadius);
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
    roundRectPath(ctx, x - 6 * s, y - 6 * s, w + 12 * s, h + 12 * s, r + 4 * s);
    ctx.stroke();
  }
  ctx.restore();
}

function defaultDrawLabel(ctx, pin, metrics, scr, s) {
  if (!pin.label) return;

  const m = metrics;
  let yOffset = 0;

  if (["circle", "area-circle"].includes(m.shape)) {
    yOffset = m.radius * s + 23 * s;
  } else {
    yOffset = (m.height * s) / 2 + 23 * s;
  }

  ctx.save();
  ctx.font = `bold ${15 * s}px system-ui`;
  ctx.textAlign = "center";

  // Shadow
  ctx.fillStyle = "rgba(0,0,0,0.6)";
  ctx.fillText(pin.label, scr.x, scr.y + yOffset + 2 * s);

  // Text
  ctx.fillStyle = window._currentThemeTextColor || "#ffffff";
  ctx.fillText(pin.label, scr.x, scr.y + yOffset);

  ctx.restore();
}

// ── Card shape ───────────────────────────────────────────────────────────

registerShape("card", {
  getMetrics(pin, scale) {
    return {
      shape: "card",
      width: 160,
      height: 100,
      variant: pin.variant || "default", // 'default', 'document', 'folder'
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

    roundRectPath(
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
    roundRectPath(ctx, x, y, w, h, 6 * s);
    ctx.fill();
  },

  drawDecoration(ctx, pin, m, scr, s) {
    const w = m.width * s,
      h = m.height * s;
    const x = scr.x - w / 2,
      y = scr.y - h / 2;

    if (m.variant === "document") {
      ctx.fillStyle = "rgba(0,0,0,0.16)";
      roundRectPath(ctx, x + 4 * s, y + 4 * s, w - 8 * s, h * 0.25, 4 * s);
      ctx.fill();
    } else if (m.variant === "folder") {
      const tabW = w * 0.4,
        tabH = h * 0.3;
      ctx.fillStyle = lightenColor(pin.color || "#58a6ff", 12);
      roundRectPath(ctx, x + 6 * s, y - tabH * 0.5, tabW, tabH, 4 * s);
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
  getMetrics(pin, scale) {
    return {
      shape: "circle",
      radius: pin.radius || 24,
    };
  },

  drawShadow(ctx, pin, m, scr, s) {
    const r = m.radius * s;
    ctx.fillStyle = "rgba(0,0,0,0.4)";
    ctx.beginPath();
    ctx.arc(scr.x + 3 * s, scr.y + 3 * s, r, 0, Math.PI * 2);
    ctx.fill();
  },

  drawMain(ctx, pin, m, scr, s) {
    const r = m.radius * s;
    ctx.fillStyle = pin.color || "#58a6ff";
    ctx.beginPath();
    ctx.arc(scr.x, scr.y, r, 0, Math.PI * 2);
    ctx.fill();

    // Classic highlight dot
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    ctx.beginPath();
    ctx.arc(
      scr.x - 2 * s,
      scr.y - 2 * s,
      Math.max(4 * s, r * 0.45),
      0,
      Math.PI * 2
    );
    ctx.fill();
  },
});

// ── Area Rectangle ───────────────────────────────────────────────────────

registerShape("area-rect", {
  getMetrics(pin, scale) {
    return {
      shape: "area-rect",
      width: pin.width || 100,
      height: pin.height || 100,
      borderWidth: pin.borderWidth || 2,
    };
  },

  drawShadow(ctx, pin, m, scr, s) {
    const w = m.width * s;
    const h = m.height * s;
    const x = scr.x - w / 2;
    const y = scr.y - h / 2;

    ctx.fillStyle = "rgba(0,0,0,0.2)";
    roundRectPath(ctx, x + 4 * s, y + 4 * s, w, h, 8 * s);
    ctx.fill();
  },

  drawMain(ctx, pin, m, scr, s) {
    const w = m.width * s;
    const h = m.height * s;
    const x = scr.x - w / 2;
    const y = scr.y - h / 2;
    const bw = Math.min(m.borderWidth * s, Math.min(w, h) * 0.8);
    const fillW = Math.max(w - bw, 1);
    const fillH = Math.max(h - bw, 1);
    const fillX = scr.x - fillW / 2;
    const fillY = scr.y - fillH / 2;

    // Fill
    ctx.fillStyle = pin.fillColor || pin.color + "40";
    roundRectPath(ctx, fillX, fillY, fillW, fillH, Math.max(0, 6 * s - bw / 2));
    ctx.fill();

    // Border
    if (bw > 0.1) {
      ctx.strokeStyle = pin.borderColor || pin.color;
      ctx.lineWidth = bw;
      ctx.stroke();
    }
  },

  drawDecoration(ctx, pin, m, scr, s) {
    // Center pin
    drawCenterPin(pin, scr);
  },
});

// ── Area Circle ──────────────────────────────────────────────────────────

registerShape("area-circle", {
  getMetrics(pin, scale) {
    return {
      shape: "area-circle",
      radius: pin.radius || 80,
      borderWidth: pin.borderWidth || 2,
    };
  },

  drawShadow(ctx, pin, m, scr, s) {
    const r = m.radius * s;
    ctx.fillStyle = "rgba(0,0,0,0.2)";
    ctx.beginPath();
    ctx.arc(scr.x + 4 * s, scr.y + 4 * s, r, 0, Math.PI * 2);
    ctx.fill();
  },

  drawMain(ctx, pin, m, scr, s) {
    const r = m.radius * s;
    const bw = Math.min(m.borderWidth * s, r * 0.8);
    const fillR = Math.max(r - bw / 2, 1);

    // Fill
    ctx.fillStyle = pin.fillColor || pin.color + "40";
    ctx.beginPath();
    ctx.arc(scr.x, scr.y, fillR, 0, Math.PI * 2);
    ctx.fill();

    // Border
    if (bw > 0.1) {
      ctx.strokeStyle = pin.borderColor || pin.color;
      ctx.lineWidth = bw;
      ctx.beginPath();
      ctx.arc(scr.x, scr.y, fillR, 0, Math.PI * 2);
      ctx.stroke();
    }
  },

  drawDecoration(ctx, pin, m, scr, s) {
    // Center pin
    drawCenterPin(pin, scr);
  },
});

// You can (and should) continue registering:
// 'area-rect', 'pill', 'diamond', 'triangle', 'hexagon', etc...

// ── Rectangle/Square shape ──────────────────────────────────────────────────

registerShape("rect", {
  getMetrics(pin, scale) {
    // Use metrics from getPinMetrics
    return {
      shape: "rect",
    };
  },

  drawMain(ctx, pin, m, scr, s) {
    const w = m.width * s;
    const h = m.height * s;
    const x = scr.x - w / 2;
    const y = scr.y - h / 2;
    const r = (m.baseRadius || 6) * s;

    ctx.fillStyle = pin.color || "#58a6ff";
    roundRectPath(ctx, x, y, w, h, r);
    ctx.fill();
  },
});

// ── Pill shape ─────────────────────────────────────────────────────────────

registerShape("pill", {
  getMetrics(pin, scale) {
    // Use metrics from getPinMetrics
    return {
      shape: "pill",
    };
  },

  drawMain(ctx, pin, m, scr, s) {
    const w = m.width * s;
    const h = m.height * s;
    const x = scr.x - w / 2;
    const y = scr.y - h / 2;
    const r = Math.min(w, h) / 2; // Fully rounded - pill shape

    ctx.fillStyle = pin.color || "#58a6ff";
    roundRectPath(ctx, x, y, w, h, r);
    ctx.fill();
  },
});

// ── Diamond shape ──────────────────────────────────────────────────────────

registerShape("diamond", {
  getMetrics(pin, scale) {
    // Use metrics from getPinMetrics
    return {
      shape: "diamond",
    };
  },

  drawMain(ctx, pin, m, scr, s) {
    // Create a diamond that fits within the pin dimensions
    const w = m.width * s;
    const h = m.height * s;

    // Diamond points: top, right, bottom, left
    const halfW = w / 2;
    const halfH = h / 2;

    ctx.fillStyle = pin.color || "#c084fc";
    ctx.beginPath();
    ctx.moveTo(scr.x, scr.y - halfH);     // Top
    ctx.lineTo(scr.x + halfW, scr.y);     // Right
    ctx.lineTo(scr.x, scr.y + halfH);     // Bottom
    ctx.lineTo(scr.x - halfW, scr.y);     // Left
    ctx.closePath();
    ctx.fill();
  },
});

// ── Person Shape ──────────────────────────────────────────────────────────
registerShape("person", {
  getMetrics(pin, scale) {
    const headRadius = 26;
    const bodyHeight = 40;
    const bodyWidth = 46;
    const paddingBottom = 20;
    const totalHeight = headRadius * 2 + bodyHeight + paddingBottom;

    return {
      shape: "person",
      width: bodyWidth,
      height: totalHeight,
      radius: headRadius,
      bodyH: bodyHeight,
      bodyW: bodyWidth,
      labelPadding: 10,
      headYOffset: -20, // Adjusted offset to position icon higher for better centering
    };
  },

  // drawShadow remains the same

  drawMain(ctx, pin, m, scr, s) {
    // Work with metrics from getPinMetrics: width, height, radius
    // For person pins: width=20*pinScale, height=32*pinScale, radius=6*pinScale

    const pinWidth = m.width * s;  // Apply zoom scale
    const pinHeight = m.height * s; // Apply zoom scale

    // Person icon proportions scaled to fit pin dimensions
    const headRadius = Math.min(pinWidth, pinHeight) * 0.25; // Head radius
    const bodyWidth = pinWidth * 0.7;   // Body width
    const bodyHeight = pinHeight * 0.4; // Body height

    // Position elements within the pin bounds
    const headY = scr.y - pinHeight * 0.15 - 10 * s; // Head center above pin center (raised by 10)
    const bodyY = scr.y + pinHeight * 0.1 - 10 * s;  // Body top below pin center (raised by 10)

    const fillColor = pin.color || "#6366f1"; // Head color
    const bodyColor = darkenColor(fillColor, 40); // Darker body color based on pin color

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
    // Use metrics from getPinMetrics
    return {
      shape: "business-building",
    };
  },

  drawMain(ctx, pin, m, scr, s) {
    // Work with metrics from getPinMetrics: width, height, radius
    const w = m.width * s;
    const h = m.height * s;
    const x = scr.x - w / 2;
    const y = scr.y - h / 2;

    const buildingColor = pin.color || "#475569"; // slate-600 default
    const accentColor = darkenColor(buildingColor, 25);

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
    ctx.fillRect(doorX + doorW * 0.8, doorY + doorH * 0.4, doorW * 0.05, doorH * 0.2);
  },

  drawLabel(ctx, pin, m, scr, s) {
    if (pin.label) {
      const offset = (m.height / 2 + 12) * s;
      ctx.font = `bold ${Math.round(14 * s)}px system-ui`;
      ctx.textAlign = "center";
      ctx.fillStyle = "rgba(0,0,0,0.65)";
      ctx.fillText(pin.label, scr.x, scr.y + offset + 2 * s);
      ctx.fillStyle = "#ffffff";
      ctx.fillText(pin.label, scr.x, scr.y + offset);
    }
  },
});

// ── Main drawing loop ────────────────────────────────────────────────────

function drawPinShape(pin, metrics, index) {
  const scr = worldToScreen(pin.x, pin.y);
  const s = scale;
  const isSelected = index === selectedPinIndex;
  const isMarquee = selectedPins.includes(index);

  const renderer = shapeRenderers.get(metrics.shape);
  if (!renderer) {
    console.warn(`No renderer for shape: ${metrics.shape}`);
    return;
  }

  ctx.save();

  // Common phases – order matters!
  renderer.drawPhase[DRAW_PHASES.SHADOW](ctx, pin, metrics, scr, s);
  renderer.drawPhase[DRAW_PHASES.BACKGROUND](ctx, pin, metrics, scr, s);
  renderer.drawPhase[DRAW_PHASES.MAIN](ctx, pin, metrics, scr, s);
  renderer.drawPhase[DRAW_PHASES.DECORATION](ctx, pin, metrics, scr, s);
  renderer.drawPhase[DRAW_PHASES.SELECTION](
    ctx,
    pin,
    metrics,
    scr,
    s,
    isSelected,
    isMarquee
  );
  renderer.drawPhase[DRAW_PHASES.LABEL](ctx, pin, metrics, scr, s);

  ctx.restore();
}

// ── Usage in your main draw function ─────────────────────────────────────

pins.forEach((pin, i) => {
  const metrics = getPinMetrics(i); // Get metrics using pin index
  drawPinShape(pin, metrics, i);
});

// ── Draw Text Elements ───────────────────────────────────────────────────
function drawTextElements() {
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

    const scr = worldToScreen(textEl.x, textEl.y);
    const s = scale;

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
    roundRectPath(ctx, bubbleX, bubbleY, bubbleWidth, bubbleHeight, 8 * s);
    ctx.fill();
    ctx.stroke();

    // Draw text
    ctx.fillStyle = "#000000";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(textEl.content, scr.x, scr.y);
  });
}
