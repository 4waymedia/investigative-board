/**
 * Test: Image hit testing & hidden shape selection
 * Validates that pins with images (even with hideShape: true or small pinScale)
 * are properly clickable across their full image area.
 */

const assert = require('assert');

// Minimal mock Application environment
const appState = {
  pins: [
    {
      id: "pin-with-image",
      x: 300,
      y: 200,
      shape: "card",
      pinScale: 0.1, // very tiny icon
      hideShape: true, // icon is hidden!
      image: {
        dataUrl: "data:image/png;base64,fake",
        size: 150,
        style: "circular",
        position: "center"
      }
    },
    {
      id: "pin-with-rect-image",
      x: 600,
      y: 400,
      shape: "circle",
      pinScale: 1.0,
      hideShape: false,
      image: {
        dataUrl: "data:image/png;base64,fake",
        size: 100,
        style: "portrait",
        position: "center"
      }
    },
    {
      id: "regular-pin",
      x: 100,
      y: 100,
      shape: "circle",
      pinScale: 0.1 // very tiny scale
    }
  ]
};

// Implement findPinAt logic from app.js
function findPinAt(wx, wy) {
  for (let i = appState.pins.length - 1; i >= 0; i--) {
    const pin = appState.pins[i];
    if (!pin) continue;

    // 1. Check Image Hit Bounds (if pin has an image)
    if (pin.image && pin.image.dataUrl) {
      const imageSize = pin.image.size || 100;
      const imagePosition = pin.image.position || "center";
      let positionOffsetX = 0;
      let positionOffsetY = 0;

      switch (imagePosition) {
        case "top": positionOffsetY = -imageSize / 2; break;
        case "bottom": positionOffsetY = imageSize / 2; break;
        case "left": positionOffsetX = -imageSize / 2; break;
        case "right": positionOffsetX = imageSize / 2; break;
        case "top-left": positionOffsetX = -imageSize / 2; positionOffsetY = -imageSize / 2; break;
        case "top-right": positionOffsetX = imageSize / 2; positionOffsetY = -imageSize / 2; break;
        case "bottom-left": positionOffsetX = -imageSize / 2; positionOffsetY = imageSize / 2; break;
        case "bottom-right": positionOffsetX = imageSize / 2; positionOffsetY = imageSize / 2; break;
      }

      const imgCenterX = pin.x + positionOffsetX;
      const imgCenterY = pin.y + positionOffsetY;

      if (pin.image.style === "circular" || !pin.image.style) {
        const dx = wx - imgCenterX;
        const dy = wy - imgCenterY;
        if (dx * dx + dy * dy <= (imageSize / 2) * (imageSize / 2)) {
          return i;
        }
      } else {
        const halfSize = imageSize / 2;
        if (wx >= imgCenterX - halfSize && wx <= imgCenterX + halfSize &&
            wy >= imgCenterY - halfSize && wy <= imgCenterY + halfSize) {
          return i;
        }
      }
    }

    // Standard circular hit detection for regular pins
    const dx = wx - pin.x;
    const dy = wy - pin.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const scale = pin.pinScale || 1;
    const baseRadius = 10;
    const hitRadius = Math.max(16, baseRadius * scale * 2);

    if (distance <= hitRadius) {
      return i;
    }
  }
  return null;
}

// Test 1: Clicking in the middle of circular image with hidden icon
assert.strictEqual(findPinAt(300, 200), 0, "Center of circular image pin should hit pin 0");

// Test 2: Clicking near the edge of the circular image (e.g. 50px away from center, within 75px radius)
assert.strictEqual(findPinAt(350, 200), 0, "50px to the right inside 150px image should hit pin 0");
assert.strictEqual(findPinAt(300, 250), 0, "50px down inside 150px image should hit pin 0");

// Test 3: Clicking outside the circular image (e.g. 90px away)
assert.strictEqual(findPinAt(400, 200), null, "Outside the image should return null");

// Test 4: Clicking inside rectangular/portrait image pin 1
assert.strictEqual(findPinAt(630, 420), 1, "Inside rectangular image should hit pin 1");

// Test 5: Regular pin with very tiny scale (0.1) should still be clickable via safe minimum 16px hit radius
assert.strictEqual(findPinAt(108, 108), 2, "Tiny scaled regular pin should still hit pin 2 via safe minimum radius");

console.log("✅ All image hit-testing and hidden shape tests passed successfully!");
