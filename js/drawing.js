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

/**
 * Draws a center pin for area pins based on the pin.icon
 * @param {Object} areaPin - The area pin object
 * @param {Object} centerPos - Screen position for center {x, y}
 */
function drawCenterPin(areaPin, centerPos) {
  // Ensure areaPin exists and has required properties
  if (!areaPin || typeof areaPin.x !== 'number' || typeof areaPin.y !== 'number') {
    console.warn('drawCenterPin: Invalid areaPin', areaPin);
    return;
  }

  // Map icon to card type (default to note card if no icon)
  let cardTypeId = 'card:card'; // Default
  if (areaPin.icon) {
    switch(areaPin.icon) {
      case '▤':
        cardTypeId = 'card:card';
        break;
      case '📄':
        cardTypeId = 'card:doc';
        break;
      case '📁':
        cardTypeId = 'card:folder';
        break;
    }
  }

  // Create temporary pin object for center pin
  const centerPin = {
    x: areaPin.x || 0, // Same position as area
    y: areaPin.y || 0,
    color: areaPin.color || '#58a6ff',
    typeId: cardTypeId,
    label: areaPin.title || '', // Use title as label for center pin
    title: areaPin.title || '', // Use area's title
    description: areaPin.description || '' // Use area's description
  };

  // Ensure centerPin has required properties
  if (!centerPin.typeId) {
    console.warn('Center pin missing typeId:', centerPin);
    return;
  }

  // Get metrics for the center pin
  const centerMetrics = getPinMetrics(centerPin);

  // Temporarily modify the center position for drawing
  const originalWorldToScreen = window.worldToScreen;
  window.worldToScreen = () => centerPos;

  // Draw the center pin
  drawPinShape(centerPin, centerMetrics, -1); // -1 means not selectable

  // Restore original function
  window.worldToScreen = originalWorldToScreen;
}

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

    // Draw center pin using drawPinShape
    drawCenterPin(pin, scr);

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

    // Note: Area pins use center pins for visual representation, no HTML icon needed

    // Description (below the area - center pin shows title above)
    // @TODO description goes below the pin
    if (pin.description) {
      ctx.font = `${12 * s}px system-ui`;
      ctx.textAlign = "center";
      ctx.fillStyle = "rgba(0,0,0,0.5)";
      ctx.fillText(pin.description, scr.x - 15 * s, scr.y + r + 22 * s);
      ctx.fillStyle = textColor + "CC"; // Slightly transparent
      ctx.fillText(pin.description, scr.x - 15 * s, scr.y + r + 20 * s);
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

    // Draw center pin using drawPinShape
    drawCenterPin(pin, scr);

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

    // Note: Area pins use center pins for visual representation, no HTML icon needed

    // Description (below the area - center pin shows title above)
    if (pin.description) {
      ctx.font = `${12 * s}px system-ui`;
      ctx.textAlign = "center";
      ctx.fillStyle = "rgba(0,0,0,0.5)";
      ctx.fillText(pin.description, scr.x - 15 * s, scr.y + h/2 + 22 * s);
      ctx.fillStyle = textColor + "CC"; // Slightly transparent
      ctx.fillText(pin.description, scr.x - 15 * s, scr.y + h/2 + 20 * s);
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
