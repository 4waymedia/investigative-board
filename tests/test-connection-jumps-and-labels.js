// Test Line Jumps (Bridge Arcs) and Line Labels
const assert = require('assert');
const fs = require('fs');

console.log("🔗 Testing Line Jumps & Line Labels System...");

// Mock basic browser / canvas primitives
global.window = global;
global.performance = { now: () => Date.now() };

// Mock minimal Application methods for testing connection jumps and labels
class MockApp {
  constructor() {
    this.appState = {
      pins: [
        { id: 'p0', x: 100, y: 200, color: '#58a6ff' },
        { id: 'p1', x: 300, y: 200, color: '#58a6ff' },
        { id: 'p2', x: 200, y: 100, color: '#ff7b72' },
        { id: 'p3', x: 200, y: 300, color: '#ff7b72' }
      ],
      connections: [
        { from: 0, to: 1, type: 'straight', color: '#58a6ff', label: 'Financial Link' },
        { from: 2, to: 3, type: 'straight', color: '#ff7b72' }
      ],
      connectionType: 'straight',
      lineJumpsEnabled: true
    };
  }

  getPinCenter(pin) {
    return { x: pin.x, y: pin.y };
  }

  getVisibleWorldBounds() {
    return { left: -1000, top: -1000, right: 1000, bottom: 1000 };
  }

  lineSegmentIntersection(p1, p2, q1, q2) {
    const dxA = p2.x - p1.x;
    const dyA = p2.y - p1.y;
    const dxB = q2.x - q1.x;
    const dyB = q2.y - q1.y;

    const denom = dxA * dyB - dyA * dxB;
    if (Math.abs(denom) < 1e-6) return null;

    const tA = ((q1.x - p1.x) * dyB - (q1.y - p1.y) * dxB) / denom;
    const tB = ((q1.x - p1.x) * dyA - (q1.y - p1.y) * dxA) / denom;

    if (tA > 0.05 && tA < 0.95 && tB > 0.05 && tB < 0.95) {
      return {
        x: p1.x + tA * dxA,
        y: p1.y + tA * dyA,
        tA,
        tB
      };
    }
    return null;
  }

  drawStraightConnectionWithJumps(ctx, startX, startY, endX, endY, jumps = []) {
    const dx = endX - startX;
    const dy = endY - startY;
    const dist = Math.hypot(dx, dy);

    if (dist === 0 || !jumps || jumps.length === 0) {
      ctx.moveTo(startX, startY);
      ctx.lineTo(endX, endY);
      return;
    }

    const jumpRadius = 8;
    const angle = Math.atan2(dy, dx);
    const uX = Math.cos(angle);
    const uY = Math.sin(angle);

    const sortedJumps = [...jumps].sort((a, b) => a.t - b.t);
    const filteredJumps = [];
    for (const jmp of sortedJumps) {
      if (filteredJumps.length === 0) {
        filteredJumps.push(jmp);
      } else {
        const prev = filteredJumps[filteredJumps.length - 1];
        if (Math.hypot(jmp.x - prev.x, jmp.y - prev.y) >= jumpRadius * 2 + 4) {
          filteredJumps.push(jmp);
        }
      }
    }

    ctx.moveTo(startX, startY);
    for (const jmp of filteredJumps) {
      const ax = jmp.x - jumpRadius * uX;
      const ay = jmp.y - jumpRadius * uY;
      ctx.lineTo(ax, ay);
      ctx.arc(jmp.x, jmp.y, jumpRadius, angle + Math.PI, angle, true);
    }
    ctx.lineTo(endX, endY);
  }

  findConnectionNear(wx, wy) {
    const hitDistance = 8;
    let closestConnection = null;
    let closestDistance = hitDistance;

    for (let i = this.appState.connections.length - 1; i >= 0; i--) {
      const conn = this.appState.connections[i];
      if (!conn) continue;

      if (conn._labelBounds) {
        const b = conn._labelBounds;
        if (wx >= b.x && wx <= b.x + b.width && wy >= b.y && wy <= b.y + b.height) {
          return i;
        }
      }

      const startPin = this.appState.pins[conn.from];
      const endPin = this.appState.pins[conn.to];
      if (!startPin || !endPin) continue;

      const d = this.pointToLineDistance(wx, wy, startPin.x, startPin.y, endPin.x, endPin.y);
      if (d <= hitDistance && d < closestDistance) {
        closestConnection = i;
        closestDistance = d;
      }
    }
    return closestConnection;
  }

  pointToLineDistance(px, py, x1, y1, x2, y2) {
    const l2 = (x2 - x1) ** 2 + (y2 - y1) ** 2;
    if (l2 === 0) return Math.hypot(px - x1, py - y1);
    let t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / l2;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(px - (x1 + t * (x2 - x1)), py - (y1 + t * (y2 - y1)));
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Test 1: Line Segment Intersection Math
// ─────────────────────────────────────────────────────────────────────────────
const app = new MockApp();
const p1 = { x: 100, y: 200 };
const p2 = { x: 300, y: 200 };
const q1 = { x: 200, y: 100 };
const q2 = { x: 200, y: 300 };

const hit = app.lineSegmentIntersection(p1, p2, q1, q2);
assert.ok(hit, "Perpendicular crossing lines must intersect");
assert.strictEqual(hit.x, 200);
assert.strictEqual(hit.y, 200);
assert.strictEqual(hit.tA, 0.5);
assert.strictEqual(hit.tB, 0.5);

// Parallel lines
const parallelHit = app.lineSegmentIntersection({ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 0, y: 20 }, { x: 100, y: 20 });
assert.strictEqual(parallelHit, null, "Parallel lines must return null");

// Non-intersecting segments
const noHit = app.lineSegmentIntersection({ x: 0, y: 0 }, { x: 10, y: 10 }, { x: 50, y: 50 }, { x: 100, y: 100 });
assert.strictEqual(noHit, null, "Separated segments must return null");
console.log("  ✅ Line segment intersection detection verified");

// ─────────────────────────────────────────────────────────────────────────────
// Test 2: Hop-Over Bridge Arc Execution
// ─────────────────────────────────────────────────────────────────────────────
const mockCtxOps = [];
const mockCtx = {
  moveTo: (x, y) => mockCtxOps.push({ op: 'moveTo', x, y }),
  lineTo: (x, y) => mockCtxOps.push({ op: 'lineTo', x, y }),
  arc: (x, y, r, s, e, cc) => mockCtxOps.push({ op: 'arc', x, y, r, s, e, cc })
};

// Line from (200, 100) to (200, 300) with jump at (200, 200) (t = 0.5)
const jumps = [{ x: 200, y: 200, t: 0.5 }];
app.drawStraightConnectionWithJumps(mockCtx, 200, 100, 200, 300, jumps);

assert.strictEqual(mockCtxOps[0].op, 'moveTo');
assert.strictEqual(mockCtxOps[0].x, 200);
assert.strictEqual(mockCtxOps[0].y, 100);

// Line approaches the base of jump at 200, 200 - 8 = 192
assert.strictEqual(mockCtxOps[1].op, 'lineTo');
assert.strictEqual(mockCtxOps[1].x, 200);
assert.strictEqual(mockCtxOps[1].y, 192);

// Semi-circular arc hops over
assert.strictEqual(mockCtxOps[2].op, 'arc');
assert.strictEqual(mockCtxOps[2].x, 200);
assert.strictEqual(mockCtxOps[2].y, 200);
assert.strictEqual(mockCtxOps[2].r, 8);
assert.strictEqual(mockCtxOps[2].cc, true);

// Line finishes to end point (200, 300)
assert.strictEqual(mockCtxOps[3].op, 'lineTo');
assert.strictEqual(mockCtxOps[3].x, 200);
assert.strictEqual(mockCtxOps[3].y, 300);
console.log("  ✅ Bridge arc geometry and tangent continuity verified");

// ─────────────────────────────────────────────────────────────────────────────
// Test 3: Multiple Sorted Jumps and Close-Proximity Filtering
// ─────────────────────────────────────────────────────────────────────────────
mockCtxOps.length = 0;
const multiJumps = [
  { x: 200, y: 250, t: 0.75 },
  { x: 200, y: 150, t: 0.25 },
  { x: 200, y: 152, t: 0.26 } // Colliding jump (distance 2px < 20px)
];
app.drawStraightConnectionWithJumps(mockCtx, 200, 100, 200, 300, multiJumps);

const arcOps = mockCtxOps.filter(o => o.op === 'arc');
assert.strictEqual(arcOps.length, 2, "Colliding jump must be filtered out, leaving exactly 2 bridge arcs");
assert.strictEqual(arcOps[0].y, 150, "First jump must be at y=150");
assert.strictEqual(arcOps[1].y, 250, "Second jump must be at y=250");
console.log("  ✅ Multiple jumps sorting and proximity deduplication verified");

// ─────────────────────────────────────────────────────────────────────────────
// Test 4: Line Label Chip Bounds & Hit-Testing
// ─────────────────────────────────────────────────────────────────────────────
const conn0 = app.appState.connections[0];
// Midpoint of (100, 200) to (300, 200) is (200, 200)
// Label badge width ~80px, height 20px
conn0._labelBounds = {
  x: 160,
  y: 190,
  width: 80,
  height: 20
};

// Hit-test click at (170, 195) - inside label badge, 5px above the connection center line!
// Normally 5px above line without label might be near edge, but label bounds makes it 100% reliable
const hitConnIdx = app.findConnectionNear(170, 195);
assert.strictEqual(hitConnIdx, 0, "Click inside label badge must select connection 0");

// Hit-test click outside badge and far from line
const missConnIdx = app.findConnectionNear(170, 230);
assert.strictEqual(missConnIdx, null, "Click far outside label and line must return null");
console.log("  ✅ Line label badge hit-testing verified");

console.log("🎉 All Line Jumps & Line Labels tests passed successfully!");
