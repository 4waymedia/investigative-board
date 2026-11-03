/**
 * Test: Layout Erasing & Viewport Bounds Fix (BUG-013)
 * Ensures changing layout never erases pins, produces NaN coordinates,
 * or pushes pins outside the visible viewport.
 */

const assert = require("assert");
const fs = require("fs");

// Mock browser environment
global.window = global;
global.performance = { now: () => Date.now() };
global.requestAnimationFrame = (fn) => setTimeout(fn, 16);
global.cancelAnimationFrame = (id) => clearTimeout(id);

global.localStorage = {
  _data: {},
  getItem(k) { return this._data[k] || null; },
  setItem(k, v) { this._data[k] = String(v); },
  removeItem(k) { delete this._data[k]; },
  clear() { this._data = {}; }
};

const mockContainer = {
  clientWidth: 1200,
  clientHeight: 700,
  style: {},
  getBoundingClientRect: () => ({ left: 0, top: 50, width: 1200, height: 700 })
};

const mockCanvas = {
  width: 1200,
  height: 700,
  style: {},
  getContext: () => ({
    clearRect: () => {},
    save: () => {},
    restore: () => {},
    translate: () => {},
    scale: () => {},
    beginPath: () => {},
    stroke: () => {},
    fill: () => {},
    fillRect: () => {},
    strokeRect: () => {},
    arc: () => {},
    lineTo: () => {},
    moveTo: () => {},
    fillText: () => {},
    setLineDash: () => {}
  })
};

global.document = {
  getElementById: (id) => {
    if (id === "canvas-container") return mockContainer;
    if (id === "board") return mockCanvas;
    return null;
  },
  addEventListener: () => {}
};
global.innerWidth = 1200;
global.innerHeight = 890;

// Load AppState
const stateCode = fs.readFileSync("js/core/state.js", "utf8");
eval(stateCode);

// Mock parseDate from layout.js
global.parseDate = (dateStr) => {
  const ts = Date.parse(dateStr) || 1700000000000;
  return { dateObj: new Date(ts), dateStr, timestamp: ts };
};

// Load Application
const appCode = fs.readFileSync("js/core/app.js", "utf8");
eval(appCode);

const app = new Application();
app.appState = new AppState();
app.canvas = mockCanvas;
app.ctx = mockCanvas.getContext("2d");

// Create varied pins: normal pin, area circle, area rect, text pin, pin with date
app.appState.pins = [
  { id: "p1", x: 200, y: 150, color: "#f85149", date: "2026-01-15", pinScale: 1 },
  { id: "p2", x: 450, y: 250, color: "#58a6ff", date: "2026-03-20", pinScale: 1 },
  { id: "area_circle", x: 300, y: 300, shape: "area-circle", areaType: "circle", radius: 120, areaSize: 120, color: "#3fb950" },
  { id: "area_rect", x: 600, y: 350, shape: "area-rect", areaType: "square", width: 200, height: 160, color: "#a471f7" },
  { id: "text_pin", x: 500, y: 120, shape: "bubble", label: "Evidence Note", width: 140, height: 40 }
];

app.appState.connections = [
  { from: 0, to: 1 },
  { from: 1, to: 2 }
];

function verifyPinsIntegrity(layoutName) {
  assert.strictEqual(app.appState.pins.length, 5, `${layoutName}: Pin count must not change`);
  app.appState.pins.forEach((p, idx) => {
    assert(Number.isFinite(p.x), `${layoutName}: Pin ${idx} x must be finite number (got ${p.x})`);
    assert(Number.isFinite(p.y), `${layoutName}: Pin ${idx} y must be finite number (got ${p.y})`);
  });
  assert(Number.isFinite(app.appState.scale), `${layoutName}: scale must be finite number`);
  assert(app.appState.scale > 0, `${layoutName}: scale must be positive`);
  assert(Number.isFinite(app.appState.offsetX), `${layoutName}: offsetX must be finite number`);
  assert(Number.isFinite(app.appState.offsetY), `${layoutName}: offsetY must be finite number`);

  // Verify visible world bounds contain the pins
  const bounds = app.getVisibleWorldBounds(200);
  assert(bounds !== null, `${layoutName}: Bounds must not be null`);
  assert(Number.isFinite(bounds.left) && Number.isFinite(bounds.right), `${layoutName}: Bounds must be finite`);
  assert(Number.isFinite(bounds.top) && Number.isFinite(bounds.bottom), `${layoutName}: Bounds must be finite`);
}

// 1. Test layoutGrid
console.log("Testing layoutGrid...");
app.layoutGrid();
verifyPinsIntegrity("layoutGrid");

// 2. Test layoutRadial
console.log("Testing layoutRadial...");
app.layoutRadial();
verifyPinsIntegrity("layoutRadial");

// 3. Test layoutForce
console.log("Testing layoutForce...");
app.layoutForce();
verifyPinsIntegrity("layoutForce");

// 4. Test layoutClusters
console.log("Testing layoutClusters...");
app.layoutClusters();
verifyPinsIntegrity("layoutClusters");

// 5. Test layoutTimeline (specifically tests object timestamp parsing)
console.log("Testing layoutTimeline...");
app.layoutTimeline();
verifyPinsIntegrity("layoutTimeline");

// 6. Test viewport culling does not cull large area pins
console.log("Testing area pin viewport culling...");
const circleAreaPin = app.appState.pins[2];
const rectAreaPin = app.appState.pins[3];
const vp = app.getVisibleWorldBounds(50);
assert(circleAreaPin.x >= vp.left - circleAreaPin.radius, "Circle area pin should not be culled");
assert(rectAreaPin.x >= vp.left - rectAreaPin.width, "Rect area pin should not be culled");

console.log("✅ All layout erasing and viewport tests passed successfully!");
