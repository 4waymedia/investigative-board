// Test BranchManager: Hold-to-Branch & 45° Radial Angular Snapping
const assert = require('assert');
const { BranchManager } = require('../js/core/branchManager.js');

console.log("🌿 Testing BranchManager & 45° Radial Branching Engine...");

// Mock AppState
class MockAppState {
  constructor() {
    this.pins = [
      { id: 'p0', x: 200, y: 200, color: '#58a6ff', typeId: 'pin:circle', radius: 15 },
      { id: 'p1', x: 500, y: 500, color: '#ff7b72', typeId: 'pin:circle', radius: 20 }
    ];
    this.connections = [];
    this.selectedPinIndex = null;
    this.selectedColor = '#58a6ff';
    this.connectionType = 'straight';
    this.history = [];
  }

  addPin(x, y, props = {}) {
    const pin = {
      id: `pin_${Date.now()}_${this.pins.length}`,
      x,
      y,
      color: props.color || this.selectedColor,
      typeId: props.typeId || 'pin:circle',
      label: props.label || '',
      title: props.title || '',
      description: props.description || '',
      pinScale: props.pinScale || 1.0
    };
    this.pins.push(pin);
    return this.pins.length - 1;
  }

  addConnection(from, to, options = {}) {
    const conn = {
      from,
      to,
      color: options.color || this.selectedColor,
      type: options.type || this.connectionType
    };
    this.connections.push(conn);
    return this.connections.length - 1;
  }

  saveHistory() {
    this.history.push({ pinsCount: this.pins.length, connsCount: this.connections.length });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Test 1: Instantiation & Defaults
// ─────────────────────────────────────────────────────────────────────────────
const appState = new MockAppState();
const bm = new BranchManager(appState);

assert.strictEqual(bm.holdDuration, 900, "Default hold duration must be 900ms");
assert.strictEqual(bm.snapAngleDeg, 45, "Default angular snapping must be 45 degrees");
assert.strictEqual(bm.minBranchDistance, 160, "Default min branch distance must be 160px (4x40 master grid)");
assert.strictEqual(bm.state, 'idle', "Initial state must be idle");
console.log("  ✅ Instantiation and default configurations verified");

// ─────────────────────────────────────────────────────────────────────────────
// Test 2: Start Hold
// ─────────────────────────────────────────────────────────────────────────────
const started = bm.startHold(0, 100, 100, { x: 200, y: 200 });
assert.strictEqual(started, true);
assert.strictEqual(bm.state, 'charging');
assert.strictEqual(bm.sourcePinIndex, 0);
assert.strictEqual(bm.chargeProgress, 0);
console.log("  ✅ startHold initiates charging state on pin 0");

// ─────────────────────────────────────────────────────────────────────────────
// Test 3: Drag Jitter Cancels Hold Early (allows regular pin dragging)
// ─────────────────────────────────────────────────────────────────────────────
// User moves 20px before timer completes -> should cancel hold
const handledMoved = bm.updateMove(120, 100, { x: 220, y: 200 });
assert.strictEqual(handledMoved, false, "updateMove must return false when drag jitter threshold is exceeded");
assert.strictEqual(bm.state, 'idle', "Hold must cancel into idle so standard drag manager takes over");
console.log("  ✅ Early drag jitter threshold cancels hold for regular pin drag");

// ─────────────────────────────────────────────────────────────────────────────
// Test 4: Full Charge to 'ready' State
// ─────────────────────────────────────────────────────────────────────────────
bm.startHold(0, 100, 100, { x: 200, y: 200 });
// Mock time passing by 950ms
bm.chargeStartTime = Date.now() - 950;
const handledCharge = bm.updateMove(102, 101, { x: 202, y: 201 });
assert.strictEqual(handledCharge, true);
assert.strictEqual(bm.state, 'ready', "State must transition to 'ready' after 900ms hold");
assert.strictEqual(bm.chargeProgress, 1.0, "Charge progress must be at 100%");
assert.ok(bm.handles.length > 0 && bm.handles.some(h => h.x > 200), "'+' handles must be placed on open edges of pin");
console.log("  ✅ Hold charge completion transitions cleanly to 'ready' state with edge handle");

// ─────────────────────────────────────────────────────────────────────────────
// Test 5: Safe Cancellation on Release ("if user releases, nothing happens")
// ─────────────────────────────────────────────────────────────────────────────
const initialPinsCount = appState.pins.length;
const initialConnsCount = appState.connections.length;
const releaseResult = bm.handleMouseUp();
assert.strictEqual(releaseResult.handled, true, "Release while ready must be handled");
assert.strictEqual(releaseResult.action, 'cancel', "Action must be cancel");
assert.strictEqual(bm.state, 'idle', "State must return to idle");
assert.strictEqual(appState.pins.length, initialPinsCount, "No new pin must be created on release without drag");
assert.strictEqual(appState.connections.length, initialConnsCount, "No connection must be created");
console.log("  ✅ Safe cancellation verified: releasing while ready creates zero pins or connections");

// ─────────────────────────────────────────────────────────────────────────────
// Test 6: Drag Out Transitions to 'branching' with 45° Snapping
// ─────────────────────────────────────────────────────────────────────────────
bm.startHold(0, 100, 100, { x: 200, y: 200 });
bm.chargeStartTime = Date.now() - 1000;
bm.updateMove(100, 100, { x: 200, y: 200 }); // becomes ready

// User drags out towards the East (e.g. world x = 400, y = 205 -> roughly 0 degrees)
bm.updateMove(300, 100, { x: 400, y: 205 });
assert.strictEqual(bm.state, 'branching');
assert.strictEqual(bm.branchTarget.snappedDegrees, 0, "Roughly East must snap to 0°");
assert.strictEqual(bm.branchTarget.x % 40, 0, "Target X must align to 40px grid");
assert.strictEqual(bm.branchTarget.y % 40, 0, "Target Y must align to 40px grid");
console.log("  ✅ Drag out engages 'branching' mode and snaps to 0° on 40px grid");

// ─────────────────────────────────────────────────────────────────────────────
// Test 7: Verify 45° Radial Snap Across All 8 Cardinal and Diagonal Quadrants
// ─────────────────────────────────────────────────────────────────────────────
const testAngles = [
  { target: { x: 400, y: 200 }, expectedDeg: 0, desc: "East (0°)" },
  { target: { x: 350, y: 350 }, expectedDeg: 45, desc: "South-East (45°)" },
  { target: { x: 200, y: 400 }, expectedDeg: 90, desc: "South (90°)" },
  { target: { x: 50, y: 350 }, expectedDeg: 135, desc: "South-West (135°)" },
  { target: { x: 0, y: 200 }, expectedDeg: 180, desc: "West (180°)" },
  { target: { x: 50, y: 50 }, expectedDeg: 225, desc: "North-West (225°)" },
  { target: { x: 200, y: 0 }, expectedDeg: 270, desc: "North (270°)" },
  { target: { x: 350, y: 50 }, expectedDeg: 315, desc: "North-East (315°)" }
];

testAngles.forEach(({ target, expectedDeg, desc }) => {
  bm.computeBranchTarget(target);
  assert.strictEqual(
    bm.branchTarget.snappedDegrees,
    expectedDeg,
    `${desc} must snap to ${expectedDeg}°, got ${bm.branchTarget.snappedDegrees}°`
  );
  assert.strictEqual(Math.abs(bm.branchTarget.x) % 40, 0, `Target X for ${desc} must snap to 40px grid`);
  assert.strictEqual(Math.abs(bm.branchTarget.y) % 40, 0, `Target Y for ${desc} must snap to 40px grid`);
});
console.log("  ✅ Full 360° circular rotation across all 8 45° spokes verified");

// ─────────────────────────────────────────────────────────────────────────────
// Test 8: Commit Branch on Mouse Up
// ─────────────────────────────────────────────────────────────────────────────
// Place at 45° (SE)
bm.computeBranchTarget({ x: 350, y: 350 });
let selectedIndex = null;
bm.setSelectedPin = (idx) => { selectedIndex = idx; };

const commitResult = bm.handleMouseUp();
assert.strictEqual(commitResult.handled, true);
assert.strictEqual(commitResult.action, 'branch');
assert.strictEqual(appState.pins.length, initialPinsCount + 1, "New child pin must be added to pins array");
assert.strictEqual(appState.connections.length, initialConnsCount + 1, "New connection must be created");

const newPin = appState.pins[appState.pins.length - 1];
const newConn = appState.connections[appState.connections.length - 1];
assert.strictEqual(newConn.from, 0, "Connection from must be parent pin index 0");
assert.strictEqual(newConn.to, appState.pins.length - 1, "Connection to must be new child pin");
assert.strictEqual(selectedIndex, appState.pins.length - 1, "New pin must become selected");
assert.strictEqual(appState.history.length, 1, "Undo history snapshot must be recorded");
assert.strictEqual(bm.state, 'idle', "State must reset to idle after branch creation");
console.log("  ✅ Branch commit spawns child pin, adds connection, and saves undo history");

// ─────────────────────────────────────────────────────────────────────────────
// Test 9: Cancel via Escape
// ─────────────────────────────────────────────────────────────────────────────
bm.startHold(1, 200, 200, { x: 500, y: 500 });
assert.strictEqual(bm.state, 'charging');
bm.cancel();
assert.strictEqual(bm.state, 'idle');
assert.strictEqual(bm.sourcePinIndex, null);
console.log("  ✅ Cancellation (e.g. Escape key) resets state cleanly");

// ─────────────────────────────────────────────────────────────────────────────
// Test 10: Hover Detection & Open-Side Handles (Left & Right)
// ─────────────────────────────────────────────────────────────────────────────
bm.showHoverHandles(0);
assert.strictEqual(bm.hoverPinIndex, 0);
assert.strictEqual(bm.handles.length, 2, "Must spawn both left and right handles on open sides");

const rightHandle = bm.handles.find(h => h.side === 'right');
const leftHandle = bm.handles.find(h => h.side === 'left');
assert.ok(rightHandle, "Right '+' handle must exist");
assert.ok(leftHandle, "Left '+' handle must exist");
assert(rightHandle.x > appState.pins[0].x, "Right handle must be to the right of pin");
assert(leftHandle.x < appState.pins[0].x, "Left handle must be to the left of pin");
console.log("  ✅ Hover on pin creates '+' handles on open left/right sides");

// ─────────────────────────────────────────────────────────────────────────────
// Test 11: Handles Auto-Remove After 4 Seconds
// ─────────────────────────────────────────────────────────────────────────────
assert.strictEqual(bm.hoverDuration, 4000, "Hover duration must be 4000ms (4 seconds)");
// Simulate mouse moving away and 4100ms passing
bm.hoverTimestamp = Date.now() - 4100;
bm.updateHover({ x: 9999, y: 9999 });
assert.strictEqual(bm.handles.length, 0, "Handles must be removed after 4 seconds of inactivity");
assert.strictEqual(bm.hoverPinIndex, null);
console.log("  ✅ Handles auto-remove after 4 seconds of inactivity");

// ─────────────────────────────────────────────────────────────────────────────
// Test 12: Instant Click Left / Right '+' Handles
// ─────────────────────────────────────────────────────────────────────────────
// Re-show handles
bm.showHoverHandles(0);
const hitRight = bm.hitTestHandle(rightHandle.x, rightHandle.y);
assert.ok(hitRight, "hitTestHandle must detect click on right handle");
assert.strictEqual(hitRight.handle.side, 'right');

// Click right handle -> spawns child to the East (Right)
bm.startFromHandle(hitRight.handle, { x: rightHandle.x, y: rightHandle.y });
const spawnEastResult = bm.handleMouseUp();
assert.strictEqual(spawnEastResult.handled, true);
assert.strictEqual(spawnEastResult.action, 'branch');
const eastPin = appState.pins[appState.pins.length - 1];
assert(eastPin.x > appState.pins[0].x, "Right handle click must spawn child to the East");
assert.strictEqual(eastPin.y, appState.pins[0].y, "Spawned child must be horizontally aligned");

// Now test Left handle click
bm.showHoverHandles(0);
const currentLeftHandle = bm.handles.find(h => h.side === 'left');
assert.ok(currentLeftHandle, "Left handle must be available");
const hitLeft = bm.hitTestHandle(currentLeftHandle.x, currentLeftHandle.y);
assert.ok(hitLeft);
assert.strictEqual(hitLeft.handle.side, 'left');

bm.startFromHandle(hitLeft.handle, { x: currentLeftHandle.x, y: currentLeftHandle.y });
const spawnWestResult = bm.handleMouseUp();
assert.strictEqual(spawnWestResult.handled, true);
assert.strictEqual(spawnWestResult.action, 'branch');
const westPin = appState.pins[appState.pins.length - 1];
assert(westPin.x < appState.pins[0].x, "Left handle click must spawn child to the West");
assert.strictEqual(westPin.y, appState.pins[0].y, "Spawned child must be horizontally aligned");
console.log("  ✅ Left and Right '+' handle instant clicks spawn aligned connected branches");

// ─────────────────────────────────────────────────────────────────────────────
// Test 13: Match Opposite Side Distance for Symmetrical Branch Creation
// ─────────────────────────────────────────────────────────────────────────────
// Setup: Root pin at (400, 400). Left pin at (160, 400) -> distance is 240px.
const symAppState = new MockAppState();
symAppState.pins = [
  { id: 'root', x: 400, y: 400, color: '#58a6ff', typeId: 'pin:circle', radius: 20 },
  { id: 'left_child', x: 160, y: 400, color: '#58a6ff', typeId: 'pin:circle', radius: 20 }
];
symAppState.connections = [
  { from: 0, to: 1 } // Connection from root to left child (distance = 240px, angle = 180° / West)
];

const symBm = new BranchManager(symAppState);

// Opposite distance when branching Right (0° / East) must be 240px to match left side
const rightMatchedDist = symBm.getOppositeDistance(0, 0);
assert.strictEqual(rightMatchedDist, 240, `Right branch distance must match opposite left side distance of 240px, got ${rightMatchedDist}`);

// When hovering root pin, Right handle's default target must be at 400 + 240 = 640px
symBm.showHoverHandles(0);
const symRightHandle = symBm.handles.find(h => h.side === 'right');
assert.ok(symRightHandle, "Right handle must exist");
assert.strictEqual(symRightHandle.defaultTarget.distance, 240, "Right handle target distance must be 240px");
assert.strictEqual(symRightHandle.defaultTarget.x, 640, "Right handle target X must be 640 (400 + 240)");
assert.strictEqual(symRightHandle.defaultTarget.matchedOpposite, true, "Must be flagged as matched opposite");

// Clicking right handle must place new pin at x = 640
symBm.startFromHandle(symRightHandle, { x: symRightHandle.x, y: symRightHandle.y });
const symResult = symBm.handleMouseUp();
assert.strictEqual(symResult.handled, true);
const rightChild = symAppState.pins[symAppState.pins.length - 1];
assert.strictEqual(rightChild.x, 640, "New pin must be at x = 640, matching the opposite side distance (240px)");
assert.strictEqual(rightChild.y, 400, "New pin must be at y = 400");
console.log("  ✅ Matching opposite side distance for symmetrical branch creation verified (240px ↔ 240px)");

// ─────────────────────────────────────────────────────────────────────────────
// Test 14: Magnetic Lock to Opposite Distance During Drag
// ─────────────────────────────────────────────────────────────────────────────
// Drag slightly past or under opposite distance (e.g. raw dist = 225px near 240px)
symBm.sourcePinIndex = 0;
symBm.state = 'branching';
symBm.computeBranchTarget({ x: 625, y: 400 }); // raw dist = 225px from (400, 400)
assert.strictEqual(symBm.branchTarget.distance, 240, "Drag within 35px of opposite distance must magnetically lock to 240px");
assert.strictEqual(symBm.branchTarget.x, 640, "Target X must lock to 640");
assert.strictEqual(symBm.branchTarget.matchedOpposite, true);

// Pull far out (e.g. x = 760 -> raw dist = 360px)
symBm.computeBranchTarget({ x: 760, y: 400 });
assert.strictEqual(symBm.branchTarget.distance, 360, "Pulling far beyond opposite distance must extend to 360px on 40px grid");
assert.strictEqual(symBm.branchTarget.x, 760);
console.log("  ✅ Magnetic distance locking to opposite distance during rotation and drag verified");

console.log("🎉 All BranchManager tests passed successfully!");
