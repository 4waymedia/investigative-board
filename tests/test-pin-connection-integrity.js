// Test Pin & Connection Integrity
const assert = require("assert");
const fs = require("fs");

global.window = global;
eval(fs.readFileSync("js/core/constants.js", "utf8"));
eval(fs.readFileSync("js/core/state.js", "utf8"));

function testPinConnectionIntegrity() {
  console.log("=== Testing Pin & Connection Integrity ===");

  const state = new window.AppState();

  // Add 4 pins
  const p0 = state.addPin(100, 100, { label: "Pin 0" });
  const p1 = state.addPin(200, 100, { label: "Pin 1" });
  const p2 = state.addPin(300, 100, { label: "Pin 2" });
  const p3 = state.addPin(400, 100, { label: "Pin 3" });

  // Connect: 0 -> 1, 1 -> 2, 2 -> 3
  state.addConnection(p0, p1);
  state.addConnection(p1, p2);
  state.addConnection(p2, p3);

  assert.strictEqual(state.pins.length, 4);
  assert.strictEqual(state.connections.length, 3);

  // Remove pin 1:
  // - Connections referencing pin 1 (0->1 and 1->2) must be deleted
  // - The connection 2->3 references pins at index 2 and 3, which must shift down to 1 and 2!
  state.removePin(p1);

  assert.strictEqual(state.pins.length, 3, "Should have 3 pins remaining");
  assert.strictEqual(state.pins[0].label, "Pin 0");
  assert.strictEqual(state.pins[1].label, "Pin 2");
  assert.strictEqual(state.pins[2].label, "Pin 3");

  assert.strictEqual(state.connections.length, 1, "Only 1 connection should remain");
  assert.strictEqual(state.connections[0].from, 1, "Connection 'from' should shift from 2 to 1");
  assert.strictEqual(state.connections[0].to, 2, "Connection 'to' should shift from 3 to 2");

  console.log("✅ Pin & connection integrity verified successfully");
}

testPinConnectionIntegrity();
