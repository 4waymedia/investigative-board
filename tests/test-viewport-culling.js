// Test Viewport Culling logic
const assert = require("assert");

function testViewportCulling() {
  console.log("=== Testing Viewport Culling ===");

  const appState = {
    scale: 1,
    offsetX: 0,
    offsetY: 0
  };

  const canvas = {
    width: 800,
    height: 600
  };

  function getVisibleWorldBounds(padding = 100) {
    const scale = appState.scale || 1;
    const ox = appState.offsetX || 0;
    const oy = appState.offsetY || 0;

    return {
      left: (0 - ox) / scale - padding,
      top: (0 - oy) / scale - padding,
      right: (canvas.width - ox) / scale + padding,
      bottom: (canvas.height - oy) / scale + padding
    };
  }

  function isPinVisible(pin, viewport) {
    const boundRadius = (pin.width ? Math.max(pin.width, pin.height || 0) : 60) * (pin.pinScale || 1);
    if (
      pin.x + boundRadius < viewport.left ||
      pin.x - boundRadius > viewport.right ||
      pin.y + boundRadius < viewport.top ||
      pin.y - boundRadius > viewport.bottom
    ) {
      return false;
    }
    return true;
  }

  const vp = getVisibleWorldBounds(100);
  // Viewport with 100px padding: left: -100, top: -100, right: 900, bottom: 700

  const onScreenPin = { x: 400, y: 300, pinScale: 1 };
  const offScreenPin = { x: 2500, y: 3000, pinScale: 1 };
  const edgePin = { x: 850, y: 300, pinScale: 1 }; // within padding

  assert.strictEqual(isPinVisible(onScreenPin, vp), true, "Onscreen pin should be visible");
  assert.strictEqual(isPinVisible(offScreenPin, vp), false, "Far offscreen pin should be culled");
  assert.strictEqual(isPinVisible(edgePin, vp), true, "Edge pin within padding should be visible");

  console.log("✅ Viewport culling calculations verified successfully");
}

testViewportCulling();
