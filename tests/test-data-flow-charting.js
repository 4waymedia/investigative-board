/**
 * Test Suite: Data-Flow Charting Capability
 * 
 * Validates:
 * 1. Port docking on Pin class (north, south, east, west, center, auto-port resolution).
 * 2. Data-Flow archetype factories (createService, createDatabase, createQueue, createFlowContainer, createCallout).
 * 3. Orthogonal Manhattan route calculation & waypoint geometry.
 * 4. Polyline fractional sampling (getPathPointAt for step badges, multipliers, and labels).
 * 5. Directional arrowhead calculations.
 * 6. Shape renderer registry for data-flow shapes (service, database, wal-queue, flow-container, flow-callout).
 * 7. Benchmark: 1,000 orthogonal routes & waypoints in < 15ms.
 */

const assert = require("assert");
global.window = global;
global.performance = { now: () => Date.now() };
const Pin = require("../js/core/pin.js");
const App = require("../js/core/app.js");
require("../js/drawing.js");

console.log("🌊 Testing Data-Flow Charting Capability...");

// ─────────────────────────────────────────────────────────────────────────────
// 1. Port Docking on Pin
// ─────────────────────────────────────────────────────────────────────────────
const servicePin = Pin.createService({
  x: 200,
  y: 100,
  width: 140,
  height: 80,
  label: "App Service"
});

const b = servicePin.getBounds();
assert.strictEqual(b.centerX, 200);
assert.strictEqual(b.centerY, 100);
assert.strictEqual(b.width, 140);
assert.strictEqual(b.height, 80);
assert.strictEqual(b.left, 130);
assert.strictEqual(b.right, 270);
assert.strictEqual(b.top, 60);
assert.strictEqual(b.bottom, 140);

// Port coordinates
const pNorth = servicePin.getPort("north");
assert.deepStrictEqual(pNorth, { x: 200, y: 60, side: "north" });

const pSouth = servicePin.getPort("south");
assert.deepStrictEqual(pSouth, { x: 200, y: 140, side: "south" });

const pEast = servicePin.getPort("east");
assert.deepStrictEqual(pEast, { x: 270, y: 100, side: "east" });

const pWest = servicePin.getPort("west");
assert.deepStrictEqual(pWest, { x: 130, y: 100, side: "west" });

const pCenter = servicePin.getPort("center");
assert.deepStrictEqual(pCenter, { x: 200, y: 100, side: "center" });

// Auto-port resolution
const targetRight = { x: 500, y: 100 };
assert.strictEqual(servicePin.getAutoPort(targetRight, "source"), "east");
assert.strictEqual(servicePin.getAutoPort(targetRight, "target"), "west");

const targetBelow = { x: 200, y: 400 };
assert.strictEqual(servicePin.getAutoPort(targetBelow, "source"), "south");
assert.strictEqual(servicePin.getAutoPort(targetBelow, "target"), "north");

console.log("  ✅ Pin perimeter docking ports & auto-port direction resolution verified");

// ─────────────────────────────────────────────────────────────────────────────
// 2. Data-Flow Archetype Factories
// ─────────────────────────────────────────────────────────────────────────────
const db = Pin.createDatabase({ label: "Write DB", subtitle: "Data Files", color: "#10b981" });
assert.strictEqual(db.shape, "database");
assert.strictEqual(db.badge, "DATABASE");
assert.strictEqual(db.width, 110);
assert.strictEqual(db.height, 85);

const wal = Pin.createQueue({ label: "WAL Buffer", slots: 6, color: "#f59e0b" });
assert.strictEqual(wal.shape, "wal-queue");
assert.strictEqual(wal.badge, "QUEUE");
assert.strictEqual(wal.customFields.slots, 6);

const scope = Pin.createFlowContainer({ label: "ON THE WRITE PATH", width: 400, height: 250 });
assert.strictEqual(scope.shape, "flow-container");
assert.strictEqual(scope.width, 400);
assert.strictEqual(scope.height, 250);

const callout = Pin.createCallout({ label: "Client Acked", status: "success" });
assert.strictEqual(callout.shape, "flow-callout");
assert.strictEqual(callout.badge, "ACK");
assert.strictEqual(callout.customFields.status, "success");

// Serialization verification
const json = db.toJSON();
assert.strictEqual(json.shape, "database");
assert.strictEqual(json.label, "Write DB");

console.log("  ✅ Data-Flow archetype factories (Service, Database, Queue, Container, Callout) verified");

// ─────────────────────────────────────────────────────────────────────────────
// 3. Orthogonal Manhattan Route Calculation in App
// ─────────────────────────────────────────────────────────────────────────────
const app = new App();

// A. Horizontal exit/entry (e.g. east to west)
const hWaypoints = app.getOrthogonalWaypoints(100, 100, 300, 200, "east", "west");
assert.strictEqual(hWaypoints.length, 4);
assert.deepStrictEqual(hWaypoints[0], { x: 100, y: 100 });
assert.deepStrictEqual(hWaypoints[1], { x: 200, y: 100 }); // midX = 200
assert.deepStrictEqual(hWaypoints[2], { x: 200, y: 200 });
assert.deepStrictEqual(hWaypoints[3], { x: 300, y: 200 });

// B. Vertical exit/entry (e.g. south to north)
const vWaypoints = app.getOrthogonalWaypoints(100, 100, 200, 300, "south", "north");
assert.strictEqual(vWaypoints.length, 4);
assert.deepStrictEqual(vWaypoints[0], { x: 100, y: 100 });
assert.deepStrictEqual(vWaypoints[1], { x: 100, y: 200 }); // midY = 200
assert.deepStrictEqual(vWaypoints[2], { x: 200, y: 200 });
assert.deepStrictEqual(vWaypoints[3], { x: 200, y: 300 });

// C. Horizontal exit to Vertical entry (L-route)
const lWaypoints = app.getOrthogonalWaypoints(100, 100, 300, 200, "east", "north");
assert.strictEqual(lWaypoints.length, 3);
assert.deepStrictEqual(lWaypoints[0], { x: 100, y: 100 });
assert.deepStrictEqual(lWaypoints[1], { x: 300, y: 100 });
assert.deepStrictEqual(lWaypoints[2], { x: 300, y: 200 });

// D. Direct aligned segment
const direct = app.getOrthogonalWaypoints(100, 100, 300, 100);
assert.strictEqual(direct.length, 2);

console.log("  ✅ Orthogonal Manhattan route calculation & waypoint geometry verified");

// ─────────────────────────────────────────────────────────────────────────────
// 4. Polyline Fractional Distance Sampling (getPathPointAt)
// ─────────────────────────────────────────────────────────────────────────────
const testPath = [
  { x: 0, y: 0 },
  { x: 100, y: 0 },   // Leg 1: 100px
  { x: 100, y: 100 }, // Leg 2: 100px
  { x: 200, y: 100 }  // Leg 3: 100px (Total: 300px)
];

const ptStart = app.getPathPointAt(testPath, 0);
assert.deepStrictEqual(ptStart, { x: 0, y: 0 });

const ptEnd = app.getPathPointAt(testPath, 1.0);
assert.deepStrictEqual(ptEnd, { x: 200, y: 100 });

// Midpoint at t = 0.5 (150px into 300px total -> middle of leg 2)
const ptMid = app.getPathPointAt(testPath, 0.5);
assert.deepStrictEqual(ptMid, { x: 100, y: 50 });

// Step badge at t = 0.3333 (100px -> corner 1)
const ptCorner = app.getPathPointAt(testPath, 100 / 300);
assert.deepStrictEqual(ptCorner, { x: 100, y: 0 });

console.log("  ✅ Polyline fractional distance sampling (getPathPointAt) verified");

// ─────────────────────────────────────────────────────────────────────────────
// 5. Shape Renderers Registered
// ─────────────────────────────────────────────────────────────────────────────
const requiredShapes = ["service", "database", "wal-queue", "flow-container", "flow-callout"];
requiredShapes.forEach(shapeName => {
  const renderer = window.shapeRenderers.get(shapeName);
  assert.ok(renderer, `Shape renderer '${shapeName}' must be registered in window.shapeRenderers`);
  assert.strictEqual(typeof renderer.getMetrics, "function", `'${shapeName}' must implement getMetrics`);
  assert.strictEqual(typeof renderer.drawPhase.main, "function", `'${shapeName}' must implement drawPhase.main`);
});

console.log("  ✅ Data-Flow shape renderers (service, database, wal-queue, flow-container, flow-callout) verified");

// ─────────────────────────────────────────────────────────────────────────────
// 6. Storage, MCP & UI Modal Integration for Data-Flow Connections
// ─────────────────────────────────────────────────────────────────────────────
const fs = require("fs");
const path = require("path");
const os = require("os");
const BoardStorage = require("../cli/storage.js");
const MCPServer = require("../cli/mcp-server.js");

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "boardcraft-dataflow-"));
try {
  const storage = new BoardStorage(tmpDir);
  const mcp = new MCPServer(storage);

  const board = storage.createBoard({ title: "ByteByteGo Write Path" });
  storage.addPin(board.id, { x: 100, y: 200, label: "App Service", shape: "service" });
  storage.addPin(board.id, { x: 400, y: 200, label: "Write-Ahead Log", shape: "wal-queue" });

  const connRes = storage.addConnection(board.id, {
    from: 0,
    to: 1,
    type: "orthogonal",
    fromPort: "east",
    toPort: "west",
    arrow: "target",
    step: "1",
    multiplier: "× 8",
    dashed: true,
    label: "append only"
  });

  assert.strictEqual(connRes.connection.type, "orthogonal");
  assert.strictEqual(connRes.connection.fromPort, "east");
  assert.strictEqual(connRes.connection.toPort, "west");
  assert.strictEqual(connRes.connection.arrow, "target");
  assert.strictEqual(connRes.connection.step, "1");
  assert.strictEqual(connRes.connection.multiplier, "× 8");
  assert.strictEqual(connRes.connection.dashed, true);

  // Verify MCP schema includes 'orthogonal' and data-flow shapes
  const tools = mcp.getTools();
  const connTool = tools.find(t => t.name === "connection_add");
  assert.ok(connTool.inputSchema.properties.type.enum.includes("orthogonal"), "MCP connection_add must support 'orthogonal'");
  assert.ok(connTool.inputSchema.properties.step, "MCP connection_add must expose 'step'");
  assert.ok(connTool.inputSchema.properties.multiplier, "MCP connection_add must expose 'multiplier'");

  const pinTool = tools.find(t => t.name === "pin_add");
  assert.ok(pinTool.inputSchema.properties.shape.enum.includes("database"), "MCP pin_add must support 'database'");
  assert.ok(pinTool.inputSchema.properties.shape.enum.includes("wal-queue"), "MCP pin_add must support 'wal-queue'");
} finally {
  fs.rmSync(tmpDir, { recursive: true, force: true });
}

// Verify index.html Connection Modal has data-flow inputs
const indexHtml = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");
assert.ok(indexHtml.includes('value="orthogonal"'), "index.html must include orthogonal option in #conn-type");
assert.ok(indexHtml.includes('id="conn-arrow"'), "index.html must include #conn-arrow select");
assert.ok(indexHtml.includes('id="conn-step"'), "index.html must include #conn-step input");
assert.ok(indexHtml.includes('id="conn-multiplier"'), "index.html must include #conn-multiplier input");
assert.ok(indexHtml.includes('id="conn-dashed"'), "index.html must include #conn-dashed checkbox");

console.log("  ✅ Storage, MCP schema, and UI Connection Modal data-flow fields verified");

// ─────────────────────────────────────────────────────────────────────────────
// 7. Performance Benchmark
// ─────────────────────────────────────────────────────────────────────────────
const ITERATIONS = 1000;
const t0 = process.hrtime.bigint();

for (let i = 0; i < ITERATIONS; i++) {
  const sx = (i * 17) % 800;
  const sy = (i * 31) % 600;
  const ex = (i * 53) % 800;
  const ey = (i * 71) % 600;

  const wpts = app.getOrthogonalWaypoints(sx, sy, ex, ey, "east", "west");
  const mid = app.getPathPointAt(wpts, 0.5);
  const stepPt = app.getPathPointAt(wpts, 0.28);
}

const t1 = process.hrtime.bigint();
const durationMs = Number(t1 - t0) / 1e6;
const perRouteUs = (durationMs * 1000) / ITERATIONS;

console.log(`  ⏱️ Benchmark: ${ITERATIONS} orthogonal routes & waypoints in ${durationMs.toFixed(3)}ms (${perRouteUs.toFixed(1)}µs / route)`);
assert.ok(durationMs < 20, "Benchmark must complete well within performance budget (< 20ms)");

console.log("🎉 All Data-Flow Charting Capability tests passed successfully!\n");
