/**
 * Test Suite: Canvas Grid & Deterministic Layout Engine
 * Verifies:
 * 1. LayoutEngine master grid constants (GRID_SIZE = 40, MAJOR_GRID_FACTOR = 4)
 * 2. LayoutEngine.snap and snapPoint methods
 * 3. Optimal count-based grid positioning (1, 2, 3, 4, 5, 6, N pins)
 * 4. Symmetric centering and exact 40px grid alignment for all pin counts
 * 5. Default layout and group layout algorithms (by family, color, type)
 * 6. Visual grid rendering with viewport bounds and zoom culling
 * 7. AppState grid state persistence (toBoardData / fromBoardData)
 * 8. DragManager grid snapping on drag end
 */

const assert = require('assert');
const fs = require('fs');

global.window = global;

eval(fs.readFileSync('js/core/constants.js', 'utf8'));
eval(fs.readFileSync('js/core/state.js', 'utf8'));
eval(fs.readFileSync('js/core/dragManager.js', 'utf8'));
eval(fs.readFileSync('js/core/layoutEngine.js', 'utf8'));

console.log("📐 Testing Canvas Grid & Layout Engine...");

// Test 1: Grid constants
assert.strictEqual(LayoutEngine.GRID_SIZE, 40, "Base grid size must be 40px");
assert.strictEqual(LayoutEngine.MAJOR_GRID_FACTOR, 4, "Major grid factor must be 4");
assert.strictEqual(LayoutEngine.SPACING_X, 240, "SPACING_X must be 240px (6 * 40)");
assert.strictEqual(LayoutEngine.SPACING_Y, 160, "SPACING_Y must be 160px (4 * 40)");
console.log("  ✅ Grid constants verified");

// Test 2: Snapping scalar and 2D points
assert.strictEqual(LayoutEngine.snap(0), 0);
assert.strictEqual(LayoutEngine.snap(19), 0);
assert.strictEqual(LayoutEngine.snap(20), 40);
assert.strictEqual(LayoutEngine.snap(39), 40);
assert.strictEqual(LayoutEngine.snap(41), 40);
assert.strictEqual(LayoutEngine.snap(-19), 0);
assert.strictEqual(LayoutEngine.snap(-21), -40);
assert.strictEqual(LayoutEngine.snap(158), 160);

const pt = LayoutEngine.snapPoint({ x: 38, y: 79 });
assert.strictEqual(pt.x, 40);
assert.strictEqual(pt.y, 80);
console.log("  ✅ Snapping logic verified");

// Test 3: Optimal count-based grid calculation
const testCounts = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 16];
testCounts.forEach(count => {
  const result = LayoutEngine.calculateOptimalGrid(count);
  assert.strictEqual(result.positions.length, count, `Should compute ${count} positions`);
  assert(result.cols >= 1, "Cols must be >= 1");
  assert(result.rows >= 1, "Rows must be >= 1");
  assert(result.cols * result.rows >= count, "Grid must fit all pins");

  // Every position must be an exact multiple of GRID_SIZE (40px)
  result.positions.forEach((pos, idx) => {
    assert.strictEqual(Math.abs(pos.x) % LayoutEngine.GRID_SIZE, 0, `Pin ${idx} X (${pos.x}) must align to 40px grid for count ${count}`);
    assert.strictEqual(Math.abs(pos.y) % LayoutEngine.GRID_SIZE, 0, `Pin ${idx} Y (${pos.y}) must align to 40px grid for count ${count}`);
  });
});
console.log("  ✅ Optimal count-based grid calculation and 40px alignment verified");

// Test 4: Hand-tuned aspect ratio & centering for small counts
// 1 pin: at (0, 0)
const g1 = LayoutEngine.calculateOptimalGrid(1);
assert.strictEqual(g1.cols, 1);
assert.strictEqual(g1.rows, 1);
assert.deepStrictEqual(g1.positions[0], { col: 0, row: 0, x: 0, y: 0 });

// 2 pins: 2 cols, 1 row, symmetrically offset (-120, 0) and (+120, 0)
const g2 = LayoutEngine.calculateOptimalGrid(2);
assert.strictEqual(g2.cols, 2);
assert.strictEqual(g2.rows, 1);
assert.strictEqual(g2.positions[0].x, -120);
assert.strictEqual(g2.positions[1].x, 120);
assert.strictEqual((g2.positions[0].x + g2.positions[1].x) / 2, 0, "Centroid must be 0");

// 3 pins: 3 cols, 1 row, centered (-240, 0, +240)
const g3 = LayoutEngine.calculateOptimalGrid(3);
assert.strictEqual(g3.cols, 3);
assert.strictEqual(g3.rows, 1);
assert.strictEqual(g3.positions[0].x, -240);
assert.strictEqual(g3.positions[1].x, 0);
assert.strictEqual(g3.positions[2].x, 240);

// 4 pins: 2x2 square/widescreen matrix
const g4 = LayoutEngine.calculateOptimalGrid(4);
assert.strictEqual(g4.cols, 2);
assert.strictEqual(g4.rows, 2);

// 5 pins: 3 in row 0, 2 in row 1, row 1 horizontally centered
const g5 = LayoutEngine.calculateOptimalGrid(5);
assert.strictEqual(g5.cols, 3);
assert.strictEqual(g5.rows, 2);
const row1Pins = g5.positions.filter(p => p.row === 1);
assert.strictEqual(row1Pins.length, 2);
assert.strictEqual((row1Pins[0].x + row1Pins[1].x) / 2, 0, "Odd last row must be horizontally centered");
console.log("  ✅ Symmetric row-centering for odd pin counts verified");

// Test 5: applyDefaultGrid modifies pin coordinates on grid around centroid
const samplePins = [
  { id: 'p1', x: 103, y: 204 },
  { id: 'p2', x: 501, y: 198 },
  { id: 'p3', x: 289, y: 612 }
];
const applied = LayoutEngine.applyDefaultGrid(samplePins);
assert.ok(applied && typeof applied.x === 'number' && typeof applied.y === 'number', "applyDefaultGrid should return center {x, y}");
samplePins.forEach(p => {
  assert.strictEqual(Math.abs(p.x) % 40, 0, `Pin x (${p.x}) must be on 40px grid`);
  assert.strictEqual(Math.abs(p.y) % 40, 0, `Pin y (${p.y}) must be on 40px grid`);
});
console.log("  ✅ applyDefaultGrid centroid and grid snap verified");

// Test 6: applyGroupLayout with grouping by family, color, and type
const mixedPins = [
  { id: 'p1', family: 'pin', color: '#ff0000', typeId: 'pin:circle', x: 0, y: 0 },
  { id: 'p2', family: 'pin', color: '#ff0000', typeId: 'pin:circle', x: 10, y: 10 },
  { id: 'c1', family: 'card', color: '#00ff00', typeId: 'card:note', x: 20, y: 20 },
  { id: 'a1', family: 'area', color: '#0000ff', typeId: 'area:circle', x: 30, y: 30 },
  { id: 't1', family: 'text', color: '#ffff00', typeId: 'text:title', x: 40, y: 40 }
];

LayoutEngine.applyGroupLayout(mixedPins, { groupBy: 'family' });
mixedPins.forEach(p => {
  assert.strictEqual(Math.abs(p.x) % 40, 0, `Group pin x (${p.x}) must be on 40px grid`);
  assert.strictEqual(Math.abs(p.y) % 40, 0, `Group pin y (${p.y}) must be on 40px grid`);
});

// Verify distinct clusters exist
const pinGroupPositions = mixedPins.filter(p => p.family === 'pin').map(p => ({ x: p.x, y: p.y }));
const cardGroupPositions = mixedPins.filter(p => p.family === 'card').map(p => ({ x: p.x, y: p.y }));
assert(Math.abs(pinGroupPositions[0].x - cardGroupPositions[0].x) >= 120 ||
       Math.abs(pinGroupPositions[0].y - cardGroupPositions[0].y) >= 100,
       "Clusters must be spaced apart on macro grid");
console.log("  ✅ applyGroupLayout multi-family clustering verified");

// Test 6b: applyRadialLayout places root at center and snaps all to 40px grid
const radialPins = [
  { id: 'r0', x: 100, y: 100 },
  { id: 'r1', x: 200, y: 200 },
  { id: 'r2', x: 300, y: 300 },
  { id: 'r3', x: 400, y: 400 },
  { id: 'r4', x: 500, y: 500 }
];
const radialCenter = LayoutEngine.applyRadialLayout(radialPins, [], 0, { center: { x: 400, y: 400 } });
assert.strictEqual(radialCenter.x, 400);
assert.strictEqual(radialCenter.y, 400);
assert.strictEqual(radialPins[0].x, 400, "Root pin must be at radial center X");
assert.strictEqual(radialPins[0].y, 400, "Root pin must be at radial center Y");
radialPins.forEach((p, idx) => {
  assert.strictEqual(Math.abs(p.x) % 40, 0, `Radial pin ${idx} X (${p.x}) must be on 40px grid`);
  assert.strictEqual(Math.abs(p.y) % 40, 0, `Radial pin ${idx} Y (${p.y}) must be on 40px grid`);
});
console.log("  ✅ applyRadialLayout root positioning and grid snap verified");

// Test 7: Canvas visual grid rendering & zoom culling
let arcCount = 0;
let crossCount = 0;
const mockCtx = {
  save() {},
  restore() {},
  beginPath() {},
  fill() {},
  stroke() {},
  arc(x, y, r) { arcCount++; },
  moveTo(x, y) { crossCount++; },
  lineTo(x, y) {}
};

const viewport = { left: -400, top: -300, right: 400, bottom: 300 };
// Normal zoom (scale = 1.0): both minor dots and major crosshairs drawn
LayoutEngine.drawGrid(mockCtx, viewport, 1.0, {});
assert(arcCount > 0, "Minor dots must be drawn at normal scale");
assert(crossCount > 0, "Major crosshairs must be drawn");

// Zoomed out (scale = 0.2): minor dots culled to avoid visual clutter & lag
arcCount = 0;
crossCount = 0;
LayoutEngine.drawGrid(mockCtx, viewport, 0.2, {});
assert.strictEqual(arcCount, 0, "Minor dots must be culled at scale < 0.35");
assert(crossCount > 0, "Major crosshairs must still be drawn when zoomed out");
console.log("  ✅ Visual grid drawing and zoom-level culling verified");

// Test 8: AppState gridVisible, gridSnap, gridSize getters/setters & serialization
const state = new AppState();
assert.strictEqual(state.gridVisible, true, "gridVisible must default to true");
assert.strictEqual(state.gridSnap, true, "gridSnap must default to true");
assert.strictEqual(state.gridSize, 40, "gridSize must default to 40");

state.gridVisible = false;
assert.strictEqual(state.gridVisible, false);
state.gridVisible = true;

const boardData = state.toBoardData();
assert.strictEqual(boardData.view.gridVisible, true);
assert.strictEqual(boardData.view.gridSnap, true);
assert.strictEqual(boardData.view.gridSize, 40);

const state2 = new AppState();
state2.fromBoardData({
  view: { scale: 1.5, offsetX: 10, offsetY: 20, gridVisible: false, gridSnap: false, gridSize: 50 }
});
assert.strictEqual(state2.gridVisible, false);
assert.strictEqual(state2.gridSnap, false);
assert.strictEqual(state2.gridSize, 50);
console.log("  ✅ AppState grid properties and serialization verified");

// Test 9: DragManager snaps to grid on endDrag
const appStateForDrag = new AppState();
appStateForDrag.pins = [
  { id: 'dp1', x: 0, y: 0 }
];
const dragManager = new DragManager(appStateForDrag);
dragManager.startPinDrag(0, { x: 0, y: 0 }, { x: 0, y: 0 });
// Move pin to unaligned coordinate (e.g., 73, 114)
dragManager.updatePinDrag({ x: 73, y: 114 });
assert.strictEqual(dragManager.hasMoved, true);
assert.strictEqual(appStateForDrag.pins[0].x, 73);
assert.strictEqual(appStateForDrag.pins[0].y, 114);

// End drag -> should snap to 80, 120
dragManager.endDrag();
assert.strictEqual(appStateForDrag.pins[0].x, 80, "Pin X must snap to nearest 40px (80)");
assert.strictEqual(appStateForDrag.pins[0].y, 120, "Pin Y must snap to nearest 40px (120)");
console.log("  ✅ DragManager drag-release grid snapping verified");

console.log("🎉 All Canvas Grid & Layout Engine tests passed successfully!");
