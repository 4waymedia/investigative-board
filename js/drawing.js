// ============================================================================
// DRAWING MODULE - Canvas rendering functions for the investigative board
// ============================================================================

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Creates a rounded rectangle path for canvas drawing
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {number} x - X position
 * @param {number} y - Y position
 * @param {number} w - Width
 * @param {number} h - Height
 * @param {number} r - Radius for rounded corners
 */
function roundRectPath(ctx, x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.lineTo(x + w - rr, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + rr);
  ctx.lineTo(x + w, y + h - rr);
  ctx.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
  ctx.lineTo(x + rr, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - rr);
  ctx.lineTo(x, y + rr);
  ctx.quadraticCurveTo(x, y, x + rr, y);
  ctx.closePath();
}

// ============================================================================
// PIN DRAWING FUNCTIONS
// ============================================================================

/**
 * Draws a pin shape on the canvas
 * @param {Object} pin - Pin object with properties
 * @param {Object} metrics - Shape metrics
 * @param {number} index - Pin index
 */
function drawPinShape(pin, metrics, index) {
  const scr = worldToScreen(pin.x, pin.y);
  const m = metrics;
  const isSelected = index === selectedPinIndex;

  // CRITICAL: Define scale for easy access and application
  const s = scale;

  if (m.shape === "card") {
    const s = scale;
    const w = m.width * s;
    const h = m.height * s;
    const x = scr.x - w / 2;
    const y = scr.y - h / 2;

    // --- 1. Draw Base Shadow (COMPARTMENTALIZED DRAWING) ---
    ctx.beginPath(); // **CRITICAL: Start new path**
    // Use green accent shadow for Matrix theme, otherwise default black shadow
    // Cache theme check once per draw cycle (set in draw function)
    if (window._isMatrixTheme) {
      // Green glow shadow for Matrix theme - use simple fill instead of expensive shadowBlur
      ctx.fillStyle = "rgba(0, 255, 65, 0.25)";
      // Draw a slightly larger shadow with green tint
      roundRectPath(ctx, x + 4 * s, y + 4 * s, w + 2 * s, h + 2 * s, 7 * s);
    } else {
      ctx.fillStyle = "rgba(0,0,0,0.4)";
      roundRectPath(ctx, x + 3 * s, y + 3 * s, w, h, 6 * s);
    }
    ctx.closePath();
    ctx.fill();

    // --- 2. Draw Main Card Body ---
    ctx.beginPath(); // **CRITICAL: Start new path**
    ctx.fillStyle = pin.color;
    roundRectPath(ctx, x, y, w, h, 6 * s);
    ctx.closePath();
    ctx.fill();

    // --- 3. Draw Variants (Folder Tab and Document Header) ---
    if (m.variant === "document") {
      // Document Card Header Shadow/Block
      ctx.beginPath(); // **CRITICAL: Start new path for variant**
      ctx.fillStyle = "rgba(0,0,0,0.16)";
      roundRectPath(
        ctx,
        x + 4 * s,
        y + 4 * s,
        w - 8 * s,
        h * 0.25,
        4 * s
      );
      ctx.closePath();
      ctx.fill();
    } else if (m.variant === "folder") {
      // Folder Tab (Lightened Color)
      const tabW = w * 0.4;
      const tabH = h * 0.3;
      ctx.beginPath(); // **CRITICAL: Start new path for variant**
      ctx.fillStyle = lightenColor(pin.color, 12);
      roundRectPath(ctx, x + 6 * s, y - tabH * 0.5, tabW, tabH, 4 * s);
      ctx.closePath();
      ctx.fill();
    }

    // --- 4. Inner Lines (Scaled) ---
    const innerX = x + 0.16 * w;
    const innerW = w - 0.32 * w;
    ctx.lineWidth = 2;
    ctx.strokeStyle = "rgba(0,0,0,0.32)";
    for (let row = 0; row < 3; row++) {
      const ly = y + 0.35 * h + row * (h * 0.18);
      ctx.beginPath(); // Each line needs its own path
      ctx.moveTo(innerX, ly);
      ctx.lineTo(innerX + innerW, ly);
      ctx.closePath();
      ctx.stroke();
    }

    // --- 5. Selection Border ---
    if (isSelected) {
      ctx.beginPath(); // **CRITICAL: Start new path for selection**
      ctx.strokeStyle = "rgba(255,255,255,0.9)";
      ctx.lineWidth = 2;
      roundRectPath(
        ctx,
        x - 3 * s,
        y - 6 * s,
        w + 6 * s,
        h + 10 * s,
        8 * s
      );
      ctx.closePath();
      ctx.stroke();
    }

    // Marquee Selection Highlight
    if (selectedPins.includes(index)) {
      ctx.beginPath(); // **CRITICAL: Start new path for marquee**
      ctx.strokeStyle = "#f90";
      ctx.lineWidth = 4 / s;
      roundRectPath(ctx, x, y, w, h, 6 * s);
      ctx.closePath();
      ctx.stroke();
    }

    // --- 6. Label (No path drawing needed) ---
    if (pin.label) {
      ctx.font = `bold ${15 * s}px system-ui`;
      ctx.textAlign = "center";
      ctx.fillStyle = "rgba(0,0,0,0.6)";
      ctx.fillText(pin.label, scr.x, scr.y + h / 2 + 23 * s);
      // Use theme's text color (cached in draw function)
      ctx.fillStyle = window._currentThemeTextColor || "#FFFFFF";
      ctx.fillText(pin.label, scr.x, scr.y + h / 2 + 21 * s);
    }
  } else if (m.shape === "rect" || m.shape === "pill") {
    // --- Logic for Rectangular/Pill Pins (Scaled) ---
    const w = m.width * s;
    const h = m.height * s;
    const x = scr.x - w / 2;
    const y = scr.y - h / 2;
    const r = m.shape === "pill" ? h / 2 : 6 * s;

    ctx.fillStyle = "rgba(0,0,0,0.4)";
    roundRectPath(ctx, x + 3 * s, y + 3 * s, w, h, r);
    ctx.fill();

    ctx.fillStyle = pin.color;
    roundRectPath(ctx, x, y, w, h, r);
    ctx.fill();

    if (isSelected) {
      ctx.strokeStyle = "rgba(255,255,255,0.9)";
      ctx.lineWidth = 2;
      roundRectPath(
        ctx,
        x - 3 * s,
        y - 3 * s,
        w + 6 * s,
        h + 6 * s,
        r + 2 * s
      );
      ctx.stroke();
    }

    if (selectedPins.includes(index)) {
      ctx.strokeStyle = "#f90";
      ctx.lineWidth = 4 / s;
      roundRectPath(ctx, x, y, w, h, r);
      ctx.stroke();
    }

    if (pin.label) {
      ctx.font = `bold ${15 * s}px system-ui`;
      ctx.textAlign = "center";
      ctx.fillStyle = "rgba(0,0,0,0.6)";
      ctx.fillText(pin.label, scr.x, scr.y + h / 2 + 23 * s);
      // Use theme's text color (cached in draw function)
      ctx.fillStyle = window._currentThemeTextColor || "#FFFFFF";
      ctx.fillText(pin.label, scr.x, scr.y + h / 2 + 21 * s);
    }
  } else if (m.shape === "area-circle") {
    // --- Logic for Area Circle (Scaled) ---
    const r = m.radius * s;
    const borderWidth = (pin.borderWidth || 2) * s;
    const fillColor = pin.fillColor || pin.color + "40"; // Default semi-transparent
    const borderColor = pin.borderColor || pin.color;
    const textColor = pin.textColor || (window._currentThemeTextColor || "#FFFFFF");

    // Shadow
    ctx.fillStyle = "rgba(0,0,0,0.2)";
    ctx.beginPath();
    ctx.arc(scr.x + 4 * s, scr.y + 4 * s, r, 0, Math.PI * 2);
    ctx.fill();

    // Fill
    ctx.fillStyle = fillColor;
    ctx.beginPath();
    ctx.arc(scr.x, scr.y, r - borderWidth/2, 0, Math.PI * 2);
    ctx.fill();

    // Border
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = borderWidth;
    ctx.beginPath();
    ctx.arc(scr.x, scr.y, r - borderWidth/2, 0, Math.PI * 2);
    ctx.stroke();

    // Selection highlight
    if (isSelected) {
      ctx.strokeStyle = "rgba(255,255,255,0.9)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(scr.x, scr.y, r + 6 * s, 0, Math.PI * 2);
      ctx.stroke();
    }

    if (selectedPins.includes(index)) {
      ctx.strokeStyle = "#f90";
      ctx.lineWidth = 4 / s;
      ctx.beginPath();
      ctx.arc(scr.x, scr.y, r + 6 * s, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Icon (if specified)
    if (pin.icon) {
      ctx.font = `${Math.min(24 * s, r * 0.4)}px system-ui`;
      ctx.textAlign = "center";
      ctx.fillStyle = pin.iconColor || textColor;
      ctx.fillText(pin.icon, scr.x, scr.y - r * 0.1);
    }

    // Title
    if (pin.label || pin.title) {
      const title = pin.title || pin.label;
      ctx.font = `bold ${16 * s}px system-ui`;
      ctx.textAlign = "center";
      ctx.fillStyle = "rgba(0,0,0,0.6)";
      ctx.fillText(title, scr.x, scr.y + r + 8 * s);
      ctx.fillStyle = textColor;
      ctx.fillText(title, scr.x, scr.y + r + 6 * s);
    }

    // Description (smaller text below title)
    if (pin.description) {
      ctx.font = `${12 * s}px system-ui`;
      ctx.textAlign = "center";
      ctx.fillStyle = "rgba(0,0,0,0.5)";
      ctx.fillText(pin.description, scr.x, scr.y + r + 22 * s);
      ctx.fillStyle = textColor + "CC"; // Slightly transparent
      ctx.fillText(pin.description, scr.x, scr.y + r + 20 * s);
    }
  } else if (m.shape === "area-rect") {
    // --- Logic for Area Rectangle/Square (Scaled) ---
    const w = m.width * s;
    const h = m.height * s;
    const x = scr.x - w / 2;
    const y = scr.y - h / 2;
    const r = m.baseRadius * s;
    const borderWidth = (pin.borderWidth || 2) * s;
    const fillColor = pin.fillColor || pin.color + "40"; // Default semi-transparent
    const borderColor = pin.borderColor || pin.color;
    const textColor = pin.textColor || (window._currentThemeTextColor || "#FFFFFF");

    // Shadow
    ctx.fillStyle = "rgba(0,0,0,0.2)";
    roundRectPath(ctx, x + 4 * s, y + 4 * s, w, h, r);
    ctx.fill();

    // Fill
    ctx.fillStyle = fillColor;
    roundRectPath(ctx, x + borderWidth/2, y + borderWidth/2, w - borderWidth, h - borderWidth, r - borderWidth/2);
    ctx.fill();

    // Border
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = borderWidth;
    roundRectPath(ctx, x + borderWidth/2, y + borderWidth/2, w - borderWidth, h - borderWidth, r - borderWidth/2);
    ctx.stroke();

    // Selection highlight
    if (isSelected) {
      ctx.strokeStyle = "rgba(255,255,255,0.9)";
      ctx.lineWidth = 3;
      roundRectPath(ctx, x - 6 * s, y - 6 * s, w + 12 * s, h + 12 * s, r + 3 * s);
      ctx.stroke();
    }

    if (selectedPins.includes(index)) {
      ctx.strokeStyle = "#f90";
      ctx.lineWidth = 4 / s;
      roundRectPath(ctx, x - 6 * s, y - 6 * s, w + 12 * s, h + 12 * s, r + 3 * s);
      ctx.stroke();
    }

    // Icon (if specified)
    if (pin.icon) {
      ctx.font = `${Math.min(24 * s, Math.min(w, h) * 0.25)}px system-ui`;
      ctx.textAlign = "center";
      ctx.fillStyle = pin.iconColor || textColor;
      ctx.fillText(pin.icon, scr.x, scr.y - h * 0.15);
    }

    // Title
    if (pin.label || pin.title) {
      const title = pin.title || pin.label;
      ctx.font = `bold ${16 * s}px system-ui`;
      ctx.textAlign = "center";
      ctx.fillStyle = "rgba(0,0,0,0.6)";
      ctx.fillText(title, scr.x, scr.y + h/2 + 8 * s);
      ctx.fillStyle = textColor;
      ctx.fillText(title, scr.x, scr.y + h/2 + 6 * s);
    }

    // Description (smaller text below title)
    if (pin.description) {
      ctx.font = `${12 * s}px system-ui`;
      ctx.textAlign = "center";
      ctx.fillStyle = "rgba(0,0,0,0.5)";
      ctx.fillText(pin.description, scr.x, scr.y + h/2 + 22 * s);
      ctx.fillStyle = textColor + "CC"; // Slightly transparent
      ctx.fillText(pin.description, scr.x, scr.y + h/2 + 20 * s);
    }
  } else {
    // Circle pins (original logic)
    // --- Logic for Circle Pins (Scaled) ---
    const r = m.radius * s;

    ctx.fillStyle = "rgba(0,0,0,0.4)";
    ctx.beginPath();
    ctx.arc(scr.x + 3 * s, scr.y + 3 * s, r, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = pin.color;
    ctx.beginPath();
    ctx.arc(scr.x, scr.y, r, 0, Math.PI * 2);
    ctx.fill();

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

    if (isSelected) {
      ctx.strokeStyle = "rgba(255,255,255,0.9)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(scr.x, scr.y, r + 4 * s, 0, Math.PI * 2);
      ctx.stroke();
    }

    if (selectedPins.includes(index)) {
      ctx.strokeStyle = "#f90";
      ctx.lineWidth = 4 / s;
      ctx.beginPath();
      ctx.arc(scr.x, scr.y, r + 4 * s, 0, Math.PI * 2);
      ctx.stroke();
    }

    if (pin.label) {
      ctx.font = `bold ${15 * s}px system-ui`;
      ctx.textAlign = "center";
      ctx.fillStyle = "rgba(0,0,0,0.6)";
      ctx.fillText(pin.label, scr.x, scr.y + r + 23 * s);
      // Use theme's text color (cached in draw function)
      ctx.fillStyle = window._currentThemeTextColor || "#FFFFFF";
      ctx.fillText(pin.label, scr.x, scr.y + r + 21 * s);
    }
  }
}

// ============================================================================
// TEXT DRAWING FUNCTIONS
// ============================================================================

/**
 * Draws rectangle-style text bubble
 * @param {string} content - Text content to display
 * @param {Object} textEl - Text element properties
 * @param {Object} bounds - Bounding box {x, y, w, h}
 * @param {Object} padding - Padding object
 */
function drawRectangleText(content, textEl, bounds, padding) {
  const bubbleColor = textEl.bubbleColor || "#ffffff";
  const textColor = textEl.textColor || "#000000";

  // Draw background
  ctx.fillStyle = bubbleColor;
  ctx.strokeStyle = textColor;
  ctx.lineWidth = 2;
  roundRectPath(ctx, bounds.x, bounds.y, bounds.w, bounds.h, 8);
  ctx.fill();
  ctx.stroke();

  // Draw text (centered in bubble)
  ctx.fillStyle = textColor;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const textX = bounds.x + bounds.w / 2;
  const textY = bounds.y + bounds.h / 2;
  ctx.fillText(content, textX, textY);

  // Reset text alignment for other functions
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
}

/**
 * Draws comic-style text bubble with triangular tail
 * @param {string} content - Text content to display
 * @param {Object} textEl - Text element properties
 * @param {Object} bounds - Bounding box {x, y, w, h}
 * @param {Object} padding - Padding object
 */
function drawComicText(content, textEl, bounds, padding) {
  const bubbleColor = textEl.bubbleColor || "#ffffff";
  const textColor = textEl.textColor || "#000000";

  // Draw comic bubble (rounded oval with pointer tail)
  ctx.fillStyle = bubbleColor;
  ctx.strokeStyle = textColor;
  ctx.lineWidth = 2;

  // Main bubble (rounded oval - more elongated than rectangle)
  const radius = Math.min(bounds.w, bounds.h) * 0.25; // Make it more oval-like
  roundRectPath(ctx, bounds.x, bounds.y, bounds.w, bounds.h, radius);
  ctx.fill();
  ctx.stroke();

  // Draw comic bubble tail (simple triangular pointer pointing down-left)
  const tailBaseX = bounds.x + bounds.w * 0.2; // Position near bottom-left
  const tailBaseY = bounds.y + bounds.h;
  const tailTipX = bounds.x + bounds.w * 0.1; // Point further left and down
  const tailTipY = bounds.y + bounds.h + 25; // Point downward
  const tailWidth = 15; // Width of the tail base

  ctx.beginPath();
  // Draw triangular tail
  ctx.moveTo(tailBaseX, tailBaseY); // Start at bubble edge
  ctx.lineTo(tailBaseX - tailWidth/2, tailBaseY + 5); // Left side of tail
  ctx.lineTo(tailTipX, tailTipY); // Tip of tail
  ctx.lineTo(tailBaseX + tailWidth/2, tailBaseY + 5); // Right side of tail
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Draw text (centered in bubble)
  ctx.fillStyle = textColor;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const textX = bounds.x + bounds.w / 2;
  const textY = bounds.y + bounds.h / 2;
  ctx.fillText(content, textX, textY);

  // Reset text alignment for other functions
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
}

/**
 * Draws title-style text bubble
 * @param {string} content - Text content to display
 * @param {Object} textEl - Text element properties
 * @param {Object} bounds - Bounding box {x, y, w, h}
 * @param {Object} padding - Padding object
 */
function drawTitleText(content, textEl, bounds, padding) {
  const bubbleColor = textEl.bubbleColor || "#ffffff";
  const textColor = textEl.textColor || "#000000";

  // Draw title background (can use gradient or solid)
  ctx.fillStyle = bubbleColor;
  ctx.strokeStyle = textColor;
  ctx.lineWidth = 3;
  roundRectPath(ctx, bounds.x, bounds.y, bounds.w, bounds.h, 6);
  ctx.fill();
  ctx.stroke();

  // Draw underline accent
  ctx.strokeStyle = textColor;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(bounds.x + padding.left, bounds.y + bounds.h - 8);
  ctx.lineTo(
    bounds.x + bounds.w - padding.right,
    bounds.y + bounds.h - 8
  );
  ctx.stroke();

  // Draw text (centered in bubble)
  ctx.fillStyle = textColor;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const textX = bounds.x + bounds.w / 2;
  const textY = bounds.y + bounds.h / 2;
  ctx.fillText(content, textX, textY);

  // Reset text alignment for other functions
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
}

// ============================================================================
// COLOR UTILITY FUNCTIONS
// ============================================================================

/**
 * Lighten a hex color by a percentage
 * @param {string} hex - Hex color string (e.g., "#ff0000")
 * @param {number} percent - Percentage to lighten (0-100)
 * @returns {string} Lightened hex color
 */
function lightenColor(hex, percent) {
  const num = parseInt(hex.slice(1), 16);
  const amt = Math.round(2.55 * percent);
  const R = (num >> 16) + amt;
  const G = ((num >> 8) & 0x00ff) + amt;
  const B = (num & 0x0000ff) + amt;
  return (
    "#" +
    (
      0x1000000 +
      (R < 255 ? R : 255) * 0x10000 +
      (G < 255 ? G : 255) * 0x100 +
      (B < 255 ? B : 255)
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
  return (
    "#" + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1)
  );
}

/**
 * Generate light, contrast, and dark variants of a color
 * @param {string} hex - Base hex color
 * @returns {Object} Object with light, contrast, and dark variants
 */
function generateColorVariants(hex) {
  return {
    light: lightenColor(hex, 40), // Light variant (40% lighter)
    contrast: hex, // Original color as contrast/medium
    dark: darkenColor(hex, 30), // Dark variant (30% darker)
  };
}

// ============================================================================
// TEXT RENDERING MANAGEMENT
// ============================================================================

/**
 * Draws plain text (no background/bubble)
 */
function drawPlainText(content, textEl) {
  const textColor = textEl.textColor || "#000000";
  ctx.fillStyle = textColor;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(content, 0, 0);
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
}

/**
 * Draws all text elements on the canvas with viewport culling
 */
function drawTextElements() {
  const viewportLeft = -offsetX / scale;
  const viewportRight = (canvas.width - offsetX) / scale;
  const viewportTop = -offsetY / scale;
  const viewportBottom = (canvas.height - offsetY) / scale;
  const margin = 100 / scale;

  textElements.forEach((textEl, index) => {
    if (textEl.x < viewportLeft - margin || textEl.x > viewportRight + margin ||
        textEl.y < viewportTop - margin || textEl.y > viewportBottom + margin) {
      return;
    }

    const screen = worldToScreen(textEl.x, textEl.y);
    const s = scale;
    if (scale < 0.05) return;

    ctx.save();
    ctx.translate(screen.x, screen.y);
    ctx.scale(s, s);

    const content = textEl.content || "";
    const type = textEl.type || "plain";

    ctx.font = getTextFont(type);
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    const metrics = ctx.measureText(content);
    const textWidth = metrics.width;
    const textHeight = getTextHeight(type);
    const padding = getTextPadding(type);
    const bounds = getTextBounds(type, textWidth, textHeight, padding, textEl);

    switch (type) {
      case "plain": drawPlainText(content, textEl); break;
      case "rectangle": drawRectangleText(content, textEl, bounds, padding); break;
      case "comic": drawComicText(content, textEl, bounds, padding); break;
      case "title": drawTitleText(content, textEl, bounds, padding); break;
    }

    if (selectedTextIndex === index) {
      ctx.strokeStyle = "#f90";
      ctx.lineWidth = 4 / s;
      ctx.setLineDash([5 / s, 5 / s]);
      ctx.strokeRect(bounds.x, bounds.y, bounds.w, bounds.h);
      ctx.setLineDash([]);
    }

    ctx.restore();
  });
}

function getTextFont(type) {
  switch (type) {
    case "title": return `bold ${24}px system-ui`;
    case "comic":
    case "rectangle": return `${18}px system-ui`;
    default: return `${14}px system-ui`;
  }
}

function getTextHeight(type) {
  switch (type) {
    case "title": return 30;
    case "comic": return 22;
    default: return 18;
  }
}

function getTextPadding(type) {
  switch (type) {
    case "title": return { top: 12, right: 20, bottom: 12, left: 20 };
    case "comic":
    case "rectangle": return { top: 8, right: 12, bottom: 8, left: 12 };
    default: return { top: 0, right: 0, bottom: 0, left: 0 };
  }
}

function getTextBounds(type, textWidth, textHeight, padding, textEl) {
  let w, h;
  if (textEl && textEl.bubbleWidth && textEl.bubbleHeight) {
    w = textEl.bubbleWidth;
    h = textEl.bubbleHeight;
  } else {
    w = textWidth + padding.left + padding.right;
    h = textHeight + padding.top + padding.bottom;
  }
  return { x: -w / 2, y: -h / 2, w: w, h: h };
}
    function draw(now) {
        if (now == null) now = performance.now();

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Timeline
        if (timelineActive && timelineLeft !== null && timelineRight !== null) {
            const leftScr = worldToScreen(timelineLeft, timelineY);
            const rightScr = worldToScreen(timelineRight, timelineY);

            ctx.strokeStyle = '#ffffff88';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(leftScr.x, leftScr.y);
            ctx.lineTo(rightScr.x, rightScr.y);
            ctx.stroke();

            timelinePins.forEach(tp => {
                const baseScr = worldToScreen(tp.pin.x, timelineY);
                const pinScr = worldToScreen(tp.pin.x, tp.pin.y);

                ctx.strokeStyle = '#ffffff44';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(baseScr.x, baseScr.y);
                ctx.lineTo(pinScr.x, pinScr.y);
                ctx.stroke();

                ctx.font = '12px system-ui';
                ctx.textAlign = 'center';
                ctx.fillStyle = '#ffffff88';
                const above = pinScr.y < baseScr.y;
                ctx.fillText(tp.dateStr, pinScr.x, baseScr.y + (above ? -10 : 25));
            });
        }

        // Connections (snap + wiggle)
        const nowTs = now;
        connections.forEach(c => {
            drawConnection(c, nowTs);
        });

        // Temporary connection line (when creating connections)
        if (connectStartIndex !== null) {
            const startPin = pins[connectStartIndex];
            if (startPin) {
                const startScr = worldToScreen(startPin.x, startPin.y);
                ctx.strokeStyle = '#ffffff88';
                ctx.lineWidth = 2;
                ctx.setLineDash([5, 5]);
                ctx.beginPath();
                ctx.moveTo(startScr.x, startScr.y);
                ctx.lineTo(mouseScreenX, mouseScreenY);
                ctx.stroke();
                ctx.setLineDash([]);
            }
        }

        // Area creation preview (when dragging to create area)
        if (isDraggingArea && areaDragStart && areaDragCurrent) {
            const startScr = worldToScreen(areaDragStart.x, areaDragStart.y);
            const currentScr = worldToScreen(areaDragCurrent.x, areaDragCurrent.y);

            const width = Math.abs(currentScr.x - startScr.x);
            const height = Math.abs(currentScr.y - startScr.y);
            const x = Math.min(startScr.x, currentScr.x);
            const y = Math.min(startScr.y, currentScr.y);

            ctx.strokeStyle = selectedColor;
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
            ctx.strokeRect(x, y, width, height);
            ctx.setLineDash([]);
        }

        // Marquee selection rectangle (when dragging to select multiple pins)
        if (marqueeStart && marqueeEnd) {
            ctx.beginPath();
            const startScreen = worldToScreen(marqueeStart.x, marqueeStart.y);
            const endScreen = worldToScreen(marqueeEnd.x, marqueeEnd.y);

            const x = startScreen.x;
            const y = startScreen.y;
            const w = endScreen.x - startScreen.x;
            const h = endScreen.y - startScreen.y;

            ctx.rect(x, y, w, h);
            ctx.fillStyle = "rgba(255, 153, 0, 0.1)";
            ctx.fill();
            ctx.strokeStyle = "#f90";
            ctx.lineWidth = 1;
            ctx.setLineDash([5, 5]);
            ctx.stroke();
            ctx.setLineDash([]); // Reset line dash state
        }

        // Draw timeline (if active)
        if (timelineActive && timelineLeft !== null && timelineRight !== null) {
            const leftScr = worldToScreen(timelineLeft, timelineY);
            const rightScr = worldToScreen(timelineRight, timelineY);

            // Draw timeline line
            ctx.strokeStyle = '#666666';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(leftScr.x, leftScr.y);
            ctx.lineTo(rightScr.x, rightScr.y);
            ctx.stroke();

            // Draw timeline pins with connecting lines
            timelinePins.forEach(tp => {
                const baseScr = worldToScreen(tp.pin.x, timelineY);
                const pinScr = worldToScreen(tp.pin.x, tp.pin.y);

                // Line from timeline to pin
                ctx.strokeStyle = '#999999';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(baseScr.x, baseScr.y);
                ctx.lineTo(pinScr.x, pinScr.y);
                ctx.stroke();

                // Date label on timeline
                ctx.fillStyle = '#333333';
                ctx.font = '12px Arial';
                ctx.textAlign = 'center';
                ctx.fillText(tp.dateStr, baseScr.x, baseScr.y + 20);
            });
        }

        // Pins
        pins.forEach((pin, i) => {
		    const scr = worldToScreen(pin.x, pin.y);
		    const m = getPinMetrics(i);
		
		    if (m.shape === 'card') {
		        const w = m.width;
		        const h = m.height;
		        const x = scr.x - w / 2;
		        const y = scr.y - h / 2;
		
		        // Shadow
		        ctx.fillStyle = 'rgba(0,0,0,0.4)';
		        roundRectPath(ctx, x + 3, y + 3, w, h, 6);
		        ctx.fill();
		
		        // Main card
		        ctx.fillStyle = pin.color;
		        roundRectPath(ctx, x, y, w, h, 6);
		        ctx.fill();
		
		        // Scribble lines
		        const innerX = x + 0.15 * w;
		        const innerW = w - 0.3 * w;
		        ctx.lineWidth = 2;
		        ctx.strokeStyle = 'rgba(0,0,0,0.32)';
		        for (let row = 0; row < 3; row++) {
		            const ly = y + 0.25 * h + row * (h * 0.22);
		            ctx.beginPath();
		            ctx.moveTo(innerX, ly);
		            ctx.lineTo(innerX + innerW, ly);
		            ctx.stroke();
		        }
		
		        // Selection ring
		        if (i === selectedPinIndex) {
		            ctx.strokeStyle = 'rgba(255,255,255,0.9)';
		            ctx.lineWidth = 2;
		            roundRectPath(ctx, x - 3, y - 3, w + 6, h + 6, 8);
		            ctx.stroke();
		        }
		
		        // Label
		        if (pin.label) {
		            ctx.font = 'bold 15px system-ui';
		            ctx.textAlign = 'center';
		            ctx.fillStyle = 'rgba(0,0,0,0.6)';
		            ctx.fillText(pin.label, scr.x, scr.y + h / 2 + 21);
		            ctx.fillStyle = 'white';
		            ctx.fillText(pin.label, scr.x, scr.y + h / 2 + 19);
		        }
		    } else {
		        const r = m.radius;
		
		        // Shadow
		        ctx.fillStyle = 'rgba(0,0,0,0.4)';
		        ctx.beginPath();
		        ctx.arc(scr.x + 3, scr.y + 3, r, 0, Math.PI * 2);
		        ctx.fill();
		
		        // Main pin
		        ctx.fillStyle = pin.color;
		        ctx.beginPath();
		        ctx.arc(scr.x, scr.y, r, 0, Math.PI * 2);
		        ctx.fill();
		
		        // Highlight dot
		        ctx.fillStyle = 'rgba(255,255,255,0.5)';
		        ctx.beginPath();
		        ctx.arc(scr.x - 2, scr.y - 2, Math.max(4, r * 0.45), 0, Math.PI * 2);
		        ctx.fill();
		
		        // Selection ring
		        if (i === selectedPinIndex) {
		            ctx.strokeStyle = 'rgba(255,255,255,0.9)';
		            ctx.lineWidth = 2;
		            ctx.beginPath();
		            ctx.arc(scr.x, scr.y, r + 4, 0, Math.PI * 2);
		            ctx.stroke();
		        }
		
		        // Label
		        if (pin.label) {
		            ctx.font = 'bold 15px system-ui';
		            ctx.textAlign = 'center';
		            ctx.fillStyle = 'rgba(0,0,0,0.6)';
		            ctx.fillText(pin.label, scr.x, scr.y + r + 23);
		            ctx.fillStyle = 'white';
		            ctx.fillText(pin.label, scr.x, scr.y + r + 21);
		        }
		    }
		});


        // Temporary string from last pin to mouse (wobbly)
        if (tempStartIndex !== null) {
            const start = pins[tempStartIndex];
            const startScr = worldToScreen(start.x, start.y);
            const bright = lightenColor(start.color, 40);
            drawLine(startScr.x, startScr.y, mouseScreenX, mouseScreenY, bright, true);

            ctx.fillStyle = bright;
            ctx.beginPath();
            ctx.arc(mouseScreenX, mouseScreenY, 9, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = 'rgba(255,255,255,0.6)';
            ctx.beginPath();
            ctx.arc(mouseScreenX - 2, mouseScreenY - 2, 4, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // ============================================================================
    // CONNECTION ANIMATION CONSTANTS
    // ============================================================================

    const SNAP_DURATION_MS = 220;        // snap-to target
    const WIGGLE_DURATION_MS = 420;      // damped wiggle tail
    const WIGGLE_FREQ = 12;              // wiggles per second
    const WIGGLE_DECAY = 3.0;            // higher = quicker decay
    const WIGGLE_AMPLITUDE = 12;         // px max initial bend

    // ============================================================================
    // CONNECTION ANIMATION HELPERS
    // ============================================================================

    const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));

    function easeOutBack(x) {
        const c1 = 1.70158, c3 = c1 + 1;
        return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
    }

    function lerpPoint(a, b, t) {
        return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
    }

    function perpUnit(a, b) {
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const len = Math.hypot(dx, dy) || 1;
        return { x: -dy / len, y: dx / len };
    }

    // ============================================================================
    // CONNECTION RENDERING
    // ============================================================================

    // Permanent connection with snap + wiggle
    function drawConnection(c, now) {
        const a = pins[c.startIndex];
        const b = pins[c.endIndex];
        if (!a || !b) return;

        const sa = worldToScreen(a.x, a.y);
        const sb = worldToScreen(b.x, b.y);

        // SNAP endpoint along AB with overshoot
        let end = { x: sb.x, y: sb.y };
        if (typeof c.animStart === 'number') {
            const tSnap = clamp((now - c.animStart) / SNAP_DURATION_MS, 0, 1);
            const s = easeOutBack(tSnap);
            end = lerpPoint(sa, sb, s);
        }

        // WIGGLE as a curved midpoint
        let useCurve = false;
        let ctrl = null;
        if (typeof c.animStart === 'number' && now < c.animWiggleEnd) {
            const tSec = (now - c.animStart) / 1000;
            const decay = Math.exp(-WIGGLE_DECAY * tSec);
            const amp = WIGGLE_AMPLITUDE * decay * Math.sin(2 * Math.PI * WIGGLE_FREQ * tSec);

            const mid = lerpPoint(sa, end, 0.5);
            const n = perpUnit(sa, end);

            ctrl = { x: mid.x + n.x * amp, y: mid.y + n.y * amp };
            useCurve = Math.abs(amp) > 0.3;
        }

        ctx.strokeStyle = b.color || '#ffffffaa';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(sa.x, sa.y);
        if (useCurve && ctrl) {
            ctx.quadraticCurveTo(ctrl.x, ctrl.y, end.x, end.y);
        } else {
            ctx.lineTo(end.x, end.y);
        }
        ctx.stroke();

        // Clean up animation when done
        if (typeof c.animStart === 'number' && now >= c.animWiggleEnd) {
            delete c.animStart;
            delete c.animSnapEnd;
            delete c.animWiggleEnd;
        }
    }
