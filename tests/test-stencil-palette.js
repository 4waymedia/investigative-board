// Test: Investigative Stencil Palette & Clue Presets
const assert = require('assert');
const { StencilDock, STENCIL_PRESETS } = require('../js/ui/stencilDock.js');

console.log("🗂️ Testing Investigative Stencil Palette...");

// Mock AppState
class MockAppState {
  constructor() {
    this.pins = [];
    this.connections = [];
    this.selectedPinIndex = null;
    this.selectedPins = [];
    this.history = [];
    this.scale = 1;
    this.offsetX = 0;
    this.offsetY = 0;
  }

  addPin(x, y, props = {}) {
    const pin = {
      id: `pin_${this.pins.length}`,
      x,
      y,
      ...props
    };
    this.pins.push(pin);
    return this.pins.length - 1;
  }

  setSelectedPins(indices) {
    this.selectedPins = [...indices];
    this.selectedPinIndex = indices.length > 0 ? indices[0] : null;
  }

  saveHistory() {
    this.history.push({ pinsCount: this.pins.length });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Test 1: Stencil Catalog Integrity
// ─────────────────────────────────────────────────────────────────────────────
assert.strictEqual(STENCIL_PRESETS.length, 8, "Must contain exactly 8 investigative clue presets");

const expectedIds = [
  "stencil:suspect",
  "stencil:evidence",
  "stencil:crime-scene",
  "stencil:document",
  "stencil:timeline-event",
  "stencil:syndicate",
  "stencil:hypothesis",
  "stencil:perimeter-area"
];

expectedIds.forEach(id => {
  const found = STENCIL_PRESETS.find(s => s.id === id);
  assert.ok(found, `Preset ${id} must exist in STENCIL_PRESETS`);
  assert.ok(found.title, `${id} must have a title`);
  assert.ok(found.icon, `${id} must have an icon`);
  assert.ok(found.badge, `${id} must have a badge`);
  assert.ok(found.color, `${id} must have a color`);
  assert.ok(found.typeId, `${id} must have a typeId`);
});

console.log("  ✅ Stencil presets catalog verified (8 investigative presets)");

// ─────────────────────────────────────────────────────────────────────────────
// Test 2: Dock State Management (Open / Close / Toggle)
// ─────────────────────────────────────────────────────────────────────────────
const appState = new MockAppState();
let drawCalled = 0;
let saveStateCalled = 0;

const dock = new StencilDock(appState);
dock.initialize({
  draw: () => { drawCalled++; },
  saveAppState: () => { saveStateCalled++; }
});

assert.strictEqual(dock.isOpen, false, "Initial dock state must be closed");
dock.toggle();
assert.strictEqual(dock.isOpen, true, "Toggle must open dock");
dock.close();
assert.strictEqual(dock.isOpen, false, "Close must close dock");
dock.open();
assert.strictEqual(dock.isOpen, true, "Open must open dock");
console.log("  ✅ Stencil dock open/close/toggle lifecycle verified");

// ─────────────────────────────────────────────────────────────────────────────
// Test 3: Spawning a Stencil (Suspect Preset) with Master 40px Grid Alignment
// ─────────────────────────────────────────────────────────────────────────────
const suspectPreset = STENCIL_PRESETS.find(s => s.id === "stencil:suspect");
const spawnResult = dock.spawnStencil(suspectPreset, { x: 303, y: 198 });

assert.ok(spawnResult, "Spawn must return result");
assert.strictEqual(appState.pins.length, 1, "Must add 1 pin to appState");

const pin0 = appState.pins[0];
assert.strictEqual(pin0.x, 320, "X must snap to nearest 40px grid (303 -> 320)");
assert.strictEqual(pin0.y, 200, "Y must snap to nearest 40px grid (198 -> 200)");
assert.strictEqual(pin0.label, "Suspect Name");
assert.strictEqual(pin0.badge, "SUSPECT");
assert.strictEqual(pin0.color, "#e06c75");
assert.strictEqual(pin0.shape, "person");
assert.strictEqual(appState.selectedPinIndex, 0, "Spawned pin must be selected");
assert.strictEqual(drawCalled, 1, "Must trigger draw()");
assert.strictEqual(appState.history.length, 1, "Must record history snapshot");
console.log("  ✅ Spawning stencil with 40px grid snap & property inheritance verified");

// ─────────────────────────────────────────────────────────────────────────────
// Test 4: Drag and Drop Payload Parsing
// ─────────────────────────────────────────────────────────────────────────────
const evidencePreset = STENCIL_PRESETS.find(s => s.id === "stencil:evidence");
const serializedPayload = JSON.stringify(evidencePreset);

// Simulate eventHandlers handleCanvasDrop
const droppedStencil = JSON.parse(serializedPayload);
const dropResult = dock.spawnStencil(droppedStencil, { x: 485, y: 395 });

assert.strictEqual(appState.pins.length, 2);
const pin1 = appState.pins[1];
assert.strictEqual(pin1.x, 480, "X must snap to 480");
assert.strictEqual(pin1.y, 400, "Y must snap to 400");
assert.strictEqual(pin1.badge, "EVIDENCE");
assert.strictEqual(pin1.color, "#ff6b6b");
assert.strictEqual(pin1.shape, "diamond");
console.log("  ✅ Drag and drop payload deserialization verified");

// ─────────────────────────────────────────────────────────────────────────────
// Test 5: Benchmark / Performance (Spawning 100 Stencils)
// ─────────────────────────────────────────────────────────────────────────────
const benchState = new MockAppState();
const benchDock = new StencilDock(benchState);
benchDock.initialize();

const startNs = process.hrtime.bigint();
const spawnCount = 100;
for (let i = 0; i < spawnCount; i++) {
  const preset = STENCIL_PRESETS[i % STENCIL_PRESETS.length];
  benchDock.spawnStencil(preset, { x: 100 + (i * 40) % 2000, y: 100 + (i * 40) % 2000 });
}
const endNs = process.hrtime.bigint();
const totalMs = Number(endNs - startNs) / 1e6;
const msPerSpawn = totalMs / spawnCount;

console.log(`  ⏱️ Benchmark: 100 stencils spawned in ${totalMs.toFixed(3)}ms (${(msPerSpawn * 1000).toFixed(1)}µs / pin)`);
assert(totalMs < 10.0, "Spawning 100 stencils must execute in under 10ms");
assert.strictEqual(benchState.pins.length, 100);
console.log("  ✅ Performance budget satisfied (< 0.1ms per spawned clue stencil)");

console.log("🎉 All Stencil Palette tests passed successfully!");
