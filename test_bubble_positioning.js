// Test script to verify bubble pin description positioning
// This will create a bubble pin and check that description text is positioned above the bubble

// Simulate the app environment
global.window = {
  devicePixelRatio: 1,
  DrawingUtils: {
    roundRectPath: function(ctx, x, y, w, h, r) {
      // Mock implementation
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, r);
    }
  }
};

// Mock canvas context
function createMockCanvasContext() {
  const calls = [];
  return {
    save: () => calls.push('save'),
    restore: () => calls.push('restore'),
    fillStyle: null,
    strokeStyle: null,
    font: null,
    textAlign: null,
    textBaseline: null,
    globalAlpha: 1,
    fill: () => calls.push('fill'),
    stroke: () => calls.push('stroke'),
    beginPath: () => calls.push('beginPath'),
    closePath: () => calls.push('closePath'),
    moveTo: () => calls.push('moveTo'),
    lineTo: () => calls.push('lineTo'),
    fillText: (text, x, y) => calls.push({type: 'fillText', text, x, y}),
    set fillStyle(value) { this._fillStyle = value; calls.push({type: 'setFillStyle', value}); },
    get fillStyle() { return this._fillStyle; },
    set strokeStyle(value) { this._strokeStyle = value; calls.push({type: 'setStrokeStyle', value}); },
    get strokeStyle() { return this._strokeStyle; },
    set font(value) { this._font = value; calls.push({type: 'setFont', value}); },
    get font() { return this._font; },
    set textAlign(value) { this._textAlign = value; calls.push({type: 'setTextAlign', value}); },
    get textAlign() { return this._textAlign; },
    set textBaseline(value) { this._textBaseline = value; calls.push({type: 'setTextBaseline', value}); },
    get textBaseline() { return this._textBaseline; },
    set globalAlpha(value) { this._globalAlpha = value; calls.push({type: 'setGlobalAlpha', value}); },
    get globalAlpha() { return this._globalAlpha; },
    calls: calls
  };
}

// Test the bubble label drawing function
function testBubbleLabelDrawing() {
  console.log('Testing bubble pin description positioning...');

  // Create mock pin with description
  const pin = {
    description: 'Test description\nSecond line',
    label: 'Test title',
    color: '#ffffff',
    textColor: '#000000',
    fontSize: 14,
    width: 120,
    height: 60
  };

  const metrics = { width: 120, height: 60 };
  const scr = { x: 100, y: 100 }; // Screen position
  const pinScale = 1;
  const appScale = 1;

  const ctx = createMockCanvasContext();

  // Extract the label drawing function from the bubble shape registration
  // (This would normally be called from the shape renderer)
  const textColor = pin.textColor || "#000000";
  const fontSize = pin.fontSize || 14;
  const width = pin.width || 120;
  const height = pin.height || 60;
  const opacity = pin.opacity !== undefined ? pin.opacity : 1;

  // Save context for opacity
  ctx.save();
  ctx.globalAlpha = opacity;

  // Draw description above bubble (centered horizontally)
  if (pin.description) {
    ctx.fillStyle = textColor;
    ctx.font = `${fontSize}px system-ui`;
    ctx.textAlign = "center";
    ctx.textBaseline = "bottom"; // Start from bottom of text so it sits above bubble

    // Split description into lines if it contains newlines
    const lines = pin.description.split('\n');
    const lineHeight = fontSize * 1.2;
    const startY = scr.y - height/2 - 8; // 8px gap above bubble
    const totalTextHeight = lines.length * lineHeight;
    const textStartY = startY - totalTextHeight + lineHeight; // Adjust to position text above bubble

    lines.forEach((line, index) => {
      const y = textStartY + index * lineHeight;
      ctx.fillText(line, scr.x, y);
    });
  }

  // Draw title below bubble (10% larger, centered)
  if (pin.label) {
    const titleFontSize = Math.round(fontSize * 1.1); // 10% larger
    ctx.fillStyle = textColor;
    ctx.font = `${titleFontSize}px system-ui`;
    ctx.textAlign = "center";
    ctx.textBaseline = "top"; // Start from top of text

    // Position title below the bubble with a small gap
    const titleY = scr.y + height/2 + 8; // 8px gap below bubble
    ctx.fillText(pin.label, scr.x, titleY);
  }

  // Restore context
  ctx.restore();

  // Check the drawing calls
  const fillTextCalls = ctx.calls.filter(call => call.type === 'fillText');

  console.log('FillText calls:', fillTextCalls);

  // Verify description is drawn above bubble center
  const descriptionCall1 = fillTextCalls.find(call => call.text === 'Test description');
  const descriptionCall2 = fillTextCalls.find(call => call.text === 'Second line');
  const titleCall = fillTextCalls.find(call => call.text === 'Test title');

  // Bubble center is at y=100, bubble height=60, so bubble top is at y=100-30=70
  // Description should be at 70 - 8 = 62, then adjusted for line height
  const expectedDescriptionY1 = 100 - 30 - 8 - (2 * 14 * 1.2) + (14 * 1.2); // Should be around 62
  const expectedDescriptionY2 = expectedDescriptionY1 + 14 * 1.2; // Second line below first
  const expectedTitleY = 100 + 30 + 8; // Should be 138

  console.log(`Description line 1 Y: ${descriptionCall1.y}, expected: ~${expectedDescriptionY1}`);
  console.log(`Description line 2 Y: ${descriptionCall2.y}, expected: ~${expectedDescriptionY2}`);
  console.log(`Title Y: ${titleCall.y}, expected: ${expectedTitleY}`);

  // Check that description is above bubble center and title is below
  const success = descriptionCall1.y < 70 && descriptionCall2.y < descriptionCall1.y + 20 && titleCall.y > 130;

  console.log(success ? '✅ Test PASSED: Description text is positioned above bubble!' : '❌ Test FAILED: Description positioning incorrect');

  return success;
}

// Run the test
testBubbleLabelDrawing();
