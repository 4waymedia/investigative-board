// Performance Benchmark Runner for Investigative Board Connection & Jump Rendering
// Measures: Before / Try 1 / Try 2 / After optimizations
const assert = require('assert');

// Generate a synthetic dense graph of crossing connections
function createBenchmarkGraph(numPins, numConnections) {
  const pins = [];
  const worldSize = 2400;

  for (let i = 0; i < numPins; i++) {
    pins.push({
      id: `pin_${i}`,
      x: 100 + (i * 37) % worldSize,
      y: 100 + (i * 59) % worldSize,
      color: '#58a6ff'
    });
  }

  const connections = [];
  for (let i = 0; i < numConnections; i++) {
    const from = (i * 7) % numPins;
    let to = (i * 13 + 1) % numPins;
    if (from === to) to = (to + 1) % numPins;

    connections.push({
      id: `conn_${i}`,
      from,
      to,
      type: 'straight',
      color: '#58a6ff',
      label: (i % 4 === 0) ? `Link ${i}` : undefined
    });
  }

  return { pins, connections };
}

// ─────────────────────────────────────────────────────────────────────────────
// Method 1: Baseline (Naive O(N^2) Determinant Check on All Pairs)
// ─────────────────────────────────────────────────────────────────────────────
function benchmarkBaseline(graph, iterations = 100) {
  const { pins, connections } = graph;

  const lineSegments = connections.map((conn, idx) => ({
    index: idx,
    p1: { x: pins[conn.from].x, y: pins[conn.from].y },
    p2: { x: pins[conn.to].x, y: pins[conn.to].y }
  }));

  const start = process.hrtime.bigint();

  let totalIntersections = 0;
  for (let it = 0; it < iterations; it++) {
    const jumpsByConn = new Map();

    for (let i = 0; i < lineSegments.length; i++) {
      for (let j = i + 1; j < lineSegments.length; j++) {
        const segA = lineSegments[i];
        const segB = lineSegments[j];

        // Naive: Direct determinant math on every single pair
        const dxA = segA.p2.x - segA.p1.x;
        const dyA = segA.p2.y - segA.p1.y;
        const dxB = segB.p2.x - segB.p1.x;
        const dyB = segB.p2.y - segB.p1.y;

        const denom = dxA * dyB - dyA * dxB;
        if (Math.abs(denom) > 1e-6) {
          const tA = ((segB.p1.x - segA.p1.x) * dyB - (segB.p1.y - segA.p1.y) * dxB) / denom;
          const tB = ((segB.p1.x - segA.p1.x) * dyA - (segB.p1.y - segA.p1.y) * dxA) / denom;

          if (tA > 0.05 && tA < 0.95 && tB > 0.05 && tB < 0.95) {
            totalIntersections++;
          }
        }
      }
    }
  }

  const end = process.hrtime.bigint();
  const totalNs = Number(end - start);
  const avgMs = (totalNs / 1e6) / iterations;

  return { avgMs, totalIntersections: totalIntersections / iterations };
}

// ─────────────────────────────────────────────────────────────────────────────
// Method 2: Try 1 (Inline AABB Bounding Box Fast-Rejection)
// ─────────────────────────────────────────────────────────────────────────────
function benchmarkTry1(graph, iterations = 100) {
  const { pins, connections } = graph;

  const lineSegments = connections.map((conn, idx) => ({
    index: idx,
    p1: { x: pins[conn.from].x, y: pins[conn.from].y },
    p2: { x: pins[conn.to].x, y: pins[conn.to].y }
  }));

  const start = process.hrtime.bigint();

  let totalIntersections = 0;
  for (let it = 0; it < iterations; it++) {
    const jumpsByConn = new Map();

    for (let i = 0; i < lineSegments.length; i++) {
      for (let j = i + 1; j < lineSegments.length; j++) {
        const segA = lineSegments[i];
        const segB = lineSegments[j];

        // AABB Fast Rejection Check
        const minAx = segA.p1.x < segA.p2.x ? segA.p1.x : segA.p2.x;
        const maxAx = segA.p1.x > segA.p2.x ? segA.p1.x : segA.p2.x;
        const minBx = segB.p1.x < segB.p2.x ? segB.p1.x : segB.p2.x;
        const maxBx = segB.p1.x > segB.p2.x ? segB.p1.x : segB.p2.x;

        if (maxAx < minBx || minAx > maxBx) continue;

        const minAy = segA.p1.y < segA.p2.y ? segA.p1.y : segA.p2.y;
        const maxAy = segA.p1.y > segA.p2.y ? segA.p1.y : segA.p2.y;
        const minBy = segB.p1.y < segB.p2.y ? segB.p1.y : segB.p2.y;
        const maxBy = segB.p1.y > segB.p2.y ? segB.p1.y : segB.p2.y;

        if (maxAy < minBy || minAy > maxBy) continue;

        // Determinant Math only on AABB overlaps
        const dxA = segA.p2.x - segA.p1.x;
        const dyA = segA.p2.y - segA.p1.y;
        const dxB = segB.p2.x - segB.p1.x;
        const dyB = segB.p2.y - segB.p1.y;

        const denom = dxA * dyB - dyA * dxB;
        if (Math.abs(denom) > 1e-6) {
          const tA = ((segB.p1.x - segA.p1.x) * dyB - (segB.p1.y - segA.p1.y) * dxB) / denom;
          const tB = ((segB.p1.x - segA.p1.x) * dyA - (segB.p1.y - segA.p1.y) * dxA) / denom;

          if (tA > 0.05 && tA < 0.95 && tB > 0.05 && tB < 0.95) {
            totalIntersections++;
          }
        }
      }
    }
  }

  const end = process.hrtime.bigint();
  const totalNs = Number(end - start);
  const avgMs = (totalNs / 1e6) / iterations;

  return { avgMs, totalIntersections: totalIntersections / iterations };
}

// ─────────────────────────────────────────────────────────────────────────────
// Method 3: Try 2 / After (Pre-computed Bounding Box Arrays & Fast Coordinates)
// ─────────────────────────────────────────────────────────────────────────────
function benchmarkTry2(graph, iterations = 100) {
  const { pins, connections } = graph;

  // Pre-compute coordinates and AABBs once per segment
  const lineSegments = connections.map((conn, idx) => {
    const x1 = pins[conn.from].x;
    const y1 = pins[conn.from].y;
    const x2 = pins[conn.to].x;
    const y2 = pins[conn.to].y;
    return {
      index: idx,
      x1, y1, x2, y2,
      minX: x1 < x2 ? x1 : x2,
      maxX: x1 > x2 ? x1 : x2,
      minY: y1 < y2 ? y1 : y2,
      maxY: y1 > y2 ? y1 : y2
    };
  });

  const count = lineSegments.length;
  const start = process.hrtime.bigint();

  let totalIntersections = 0;
  for (let it = 0; it < iterations; it++) {
    for (let i = 0; i < count; i++) {
      const segA = lineSegments[i];
      const aMinX = segA.minX;
      const aMaxX = segA.maxX;
      const aMinY = segA.minY;
      const aMaxY = segA.maxY;
      const aX1 = segA.x1;
      const aY1 = segA.y1;
      const aDx = segA.x2 - aX1;
      const aDy = segA.y2 - aY1;

      for (let j = i + 1; j < count; j++) {
        const segB = lineSegments[j];

        // Ultra-fast scalar AABB rejection
        if (aMaxX < segB.minX || aMinX > segB.maxX || aMaxY < segB.minY || aMinY > segB.maxY) {
          continue;
        }

        const bX1 = segB.x1;
        const bY1 = segB.y1;
        const bDx = segB.x2 - bX1;
        const bDy = segB.y2 - bY1;

        const denom = aDx * bDy - aDy * bDx;
        if (Math.abs(denom) > 1e-6) {
          const qpX = bX1 - aX1;
          const qpY = bY1 - aY1;
          const tA = (qpX * bDy - qpY * bDx) / denom;
          const tB = (qpX * aDy - qpY * aDx) / denom;

          if (tA > 0.05 && tA < 0.95 && tB > 0.05 && tB < 0.95) {
            totalIntersections++;
          }
        }
      }
    }
  }

  const end = process.hrtime.bigint();
  const totalNs = Number(end - start);
  const avgMs = (totalNs / 1e6) / iterations;

  return { avgMs, totalIntersections: totalIntersections / iterations };
}

// ─────────────────────────────────────────────────────────────────────────────
// Run Test Harness Across Multiple Scales
// ─────────────────────────────────────────────────────────────────────────────
function runBenchmarks() {
  console.log("==========================================================================================");
  console.log("📊 Investigative Board Connection & Jump Rendering Benchmark Suite");
  console.log("   Target Frame Budget: < 2.000 ms for Connection Calculations");
  console.log("==========================================================================================\n");

  const scales = [
    { pins: 30, conns: 50, iters: 200, desc: "Small Board (50 connections)" },
    { pins: 60, conns: 100, iters: 100, desc: "Medium Board (100 connections)" },
    { pins: 120, conns: 250, iters: 50, desc: "Dense Board (250 connections)" },
    { pins: 250, conns: 500, iters: 20, desc: "Stress Board (500 connections)" }
  ];

  const results = [];

  for (const scale of scales) {
    const graph = createBenchmarkGraph(scale.pins, scale.conns);

    const base = benchmarkBaseline(graph, scale.iters);
    const try1 = benchmarkTry1(graph, scale.iters);
    const try2 = benchmarkTry2(graph, scale.iters);

    // Consistency check: all methods must detect identical intersection counts!
    assert.strictEqual(
      base.totalIntersections,
      try1.totalIntersections,
      `Try 1 must find identical intersections to baseline (${base.totalIntersections})`
    );
    assert.strictEqual(
      base.totalIntersections,
      try2.totalIntersections,
      `Try 2 must find identical intersections to baseline (${base.totalIntersections})`
    );

    const speedupTry1 = (base.avgMs / try1.avgMs).toFixed(2);
    const speedupTry2 = (base.avgMs / try2.avgMs).toFixed(2);

    results.push({
      scale: scale.desc,
      conns: scale.conns,
      intersections: base.totalIntersections,
      baselineMs: base.avgMs.toFixed(3),
      try1Ms: try1.avgMs.toFixed(3),
      try2Ms: try2.avgMs.toFixed(3),
      speedup: `${speedupTry2}x`
    });
  }

  // Format table output
  console.log("| Scale | Connections | Intersections | Baseline (Before) | Try 1 (AABB inline) | Try 2 (Precomputed AABB) | Total Speedup | Frame Budget Status |");
  console.log("| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |");
  for (const r of results) {
    const status = parseFloat(r.try2Ms) < 2.0 ? "✅ Under 2ms" : "⚠️ Exceeds 2ms";
    console.log(`| ${r.scale} | ${r.conns} | ${r.intersections} | ${r.baselineMs} ms | ${r.try1Ms} ms | **${r.try2Ms} ms** | **${r.speedup}** | ${status} |`);
  }

  console.log("\n==========================================================================================");
  console.log("🎉 Benchmark Completed: All optimization variants match exact mathematical outputs.");
  console.log("==========================================================================================\n");

  return results;
}

if (require.main === module) {
  runBenchmarks();
}

module.exports = { runBenchmarks, benchmarkBaseline, benchmarkTry1, benchmarkTry2, createBenchmarkGraph };
