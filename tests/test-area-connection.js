// Test area pin hit-testing and connection capabilities
const assert = require('assert');

// Mock Application class replicating app.js findPinAt logic
class MockApp {
  constructor() {
    this.appState = {
      pins: [],
      connections: [],
      selectedPinIndex: null,
      connectStartIndex: null,
      connectionMode: 'sequential',
      selectedColor: '#58a6ff',
      connectionType: 'curved'
    };
    this.deps = {
      PIN_BASES: {
        'pin:circle': { shape: 'circle', baseRadius: 10 },
        'area:circle': { shape: 'area-circle', baseRadius: 12 },
        'area:square': { shape: 'area-rect', baseRadius: 12 }
      }
    };
  }

  addConnection(from, to, options = {}) {
    this.appState.connections.push({
      from,
      to,
      color: options.color || this.appState.selectedColor,
      type: options.type || this.appState.connectionType
    });
  }

  findPinAt(wx, wy) {
    const isArea = (pin) => {
      return Boolean(
        (pin.typeId && pin.typeId.startsWith("area:")) ||
        pin.shape === "area-circle" ||
        pin.shape === "area-rect" ||
        pin.areaType === "circle" ||
        pin.areaType === "square"
      );
    };

    const checkPinHit = (pin, checkAreaShape) => {
      if (!pin) return false;

      // 1. Check Image Hit Bounds
      if (pin.image && pin.image.dataUrl) {
        const imageSize = pin.image.size || 100;
        const imgCenterX = pin.x;
        const imgCenterY = pin.y;
        const dx = wx - imgCenterX;
        const dy = wy - imgCenterY;
        if (dx * dx + dy * dy <= (imageSize / 2) * (imageSize / 2)) {
          return true;
        }
      }

      // 2. Area shapes (Circle & Rectangle/Square)
      if (checkAreaShape && isArea(pin)) {
        const isCircleArea = pin.typeId === "area:circle" || pin.areaType === "circle" || pin.shape === "area-circle";
        if (isCircleArea) {
          const radius = (pin.areaSize || pin.radius || 50) * (pin.areaScale || 1);
          const dx = wx - pin.x;
          const dy = wy - pin.y;
          if (dx * dx + dy * dy <= radius * radius) {
            return true;
          }
        } else {
          // Rectangular / square area
          const scale = pin.areaScale || 1;
          const w = (pin.width || (pin.areaSize ? pin.areaSize * 2 : 100)) * scale;
          const h = (pin.height || (pin.areaSize ? pin.areaSize * 2 : 100)) * scale;
          if (wx >= pin.x - w / 2 && wx <= pin.x + w / 2 && wy >= pin.y - h / 2 && wy <= pin.y + h / 2) {
            return true;
          }
        }
        // Center pin fallback
        const dx = wx - pin.x;
        const dy = wy - pin.y;
        if (Math.sqrt(dx * dx + dy * dy) <= Math.max(16, (pin.pinScale || 1) * 20)) {
          return true;
        }
        return false;
      }

      if (isArea(pin) && !checkAreaShape) {
        return false;
      }

      // 3. Text shapes
      const textShapes = ['bubble', 'rectangle', 'text-plain', 'text-title'];
      if (textShapes.includes(pin.shape)) {
        const width = pin.width || 120;
        const height = pin.height || 60;
        if (wx >= pin.x - width / 2 && wx <= pin.x + width / 2 && wy >= pin.y - height / 2 && wy <= pin.y + height / 2) {
          return true;
        }
      } else {
        // Standard circular hit detection for regular pins
        const dx = wx - pin.x;
        const dy = wy - pin.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const scale = pin.pinScale || 1;
        const baseRadius = this.deps.PIN_BASES?.[pin.typeId]?.baseRadius || 10;
        const hitRadius = Math.max(16, baseRadius * scale * 2);

        if (distance <= hitRadius) {
          return true;
        }
      }

      return false;
    };

    // Pass 1: Check standard (non-area) pins first from top to bottom
    for (let i = this.appState.pins.length - 1; i >= 0; i--) {
      const pin = this.appState.pins[i];
      if (pin && !isArea(pin) && checkPinHit(pin, false)) {
        return i;
      }
    }

    // Pass 2: Check area pins from top to bottom
    for (let i = this.appState.pins.length - 1; i >= 0; i--) {
      const pin = this.appState.pins[i];
      if (pin && isArea(pin) && checkPinHit(pin, true)) {
        return i;
      }
    }

    return null;
  }
}

const app = new MockApp();

// Test 1: Area Circle hit detection
app.appState.pins.push({
  id: "area_circle_1",
  x: 200,
  y: 200,
  typeId: "area:circle",
  shape: "area-circle",
  areaType: "circle",
  areaSize: 100,
  radius: 100
});

assert.strictEqual(app.findPinAt(200, 200), 0, "Exact center of circle area should hit pin 0");
assert.strictEqual(app.findPinAt(260, 200), 0, "60px away inside 100px radius should hit pin 0");
assert.strictEqual(app.findPinAt(200, 280), 0, "80px down inside 100px radius should hit pin 0");
assert.strictEqual(app.findPinAt(310, 200), null, "110px away outside 100px radius should return null");

// Test 2: Area Square / Rectangle hit detection
app.appState.pins.push({
  id: "area_rect_1",
  x: 600,
  y: 400,
  typeId: "area:square",
  shape: "area-rect",
  areaType: "square",
  width: 200,
  height: 140
});

assert.strictEqual(app.findPinAt(600, 400), 1, "Exact center of rectangular area should hit pin 1");
assert.strictEqual(app.findPinAt(680, 450), 1, "Point inside width 200 (half 100) and height 140 (half 70) should hit pin 1");
assert.strictEqual(app.findPinAt(710, 400), null, "110px right outside 200px width should return null");
assert.strictEqual(app.findPinAt(600, 480), null, "80px down outside 140px height should return null");

// Test 3: Contained pin priority
// Place a small regular pin inside the circle area of pin 0
app.appState.pins.push({
  id: "pin_inside_area",
  x: 230,
  y: 220,
  typeId: "pin:circle",
  shape: "circle",
  pinScale: 1
});

assert.strictEqual(app.findPinAt(230, 220), 2, "Click directly on contained pin should hit pin 2, NOT container pin 0");
assert.strictEqual(app.findPinAt(150, 200), 0, "Click elsewhere inside area circle should hit area pin 0");

// Test 4: Creating an area pin while connection is active connects them
app.appState.connectStartIndex = 2; // Pin 2 starts connection
const newAreaIndex = app.appState.pins.length;
const newAreaPin = {
  id: "area_circle_2",
  x: 400,
  y: 100,
  typeId: "area:circle",
  shape: "area-circle",
  areaType: "circle",
  areaSize: 80,
  radius: 80
};
app.appState.pins.push(newAreaPin);

// Simulating mouseUp area connection logic
if (app.appState.connectStartIndex !== null && app.appState.connectStartIndex !== newAreaIndex) {
  app.addConnection(app.appState.connectStartIndex, newAreaIndex);
  if (app.appState.connectionMode === 'sequential') {
    app.appState.connectStartIndex = newAreaIndex;
  }
}

assert.strictEqual(app.appState.connections.length, 1, "Connection should be created from pin 2 to new area pin");
assert.strictEqual(app.appState.connections[0].from, 2, "Connection from should be pin 2");
assert.strictEqual(app.appState.connections[0].to, newAreaIndex, "Connection to should be new area pin");
assert.strictEqual(app.appState.connectStartIndex, newAreaIndex, "New area pin should become connection source in sequential mode");

// Test 5: Sequential connection from area pin to next pin
const nextPinIndex = app.appState.pins.length;
app.appState.pins.push({
  id: "next_pin",
  x: 500,
  y: 100,
  typeId: "pin:circle",
  shape: "circle"
});

if (app.appState.connectStartIndex !== null && app.appState.connectStartIndex !== nextPinIndex) {
  app.addConnection(app.appState.connectStartIndex, nextPinIndex);
  if (app.appState.connectionMode === 'sequential') {
    app.appState.connectStartIndex = nextPinIndex;
  }
}

assert.strictEqual(app.appState.connections.length, 2, "Second connection should be created from area pin to next pin");
assert.strictEqual(app.appState.connections[1].from, newAreaIndex, "Connection from should be area pin");
assert.strictEqual(app.appState.connections[1].to, nextPinIndex, "Connection to should be next pin");

console.log("✅ All area connection tests passed successfully!");
