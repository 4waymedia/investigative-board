# Performance Benchmarks & Optimization Log

This document records all performance audits, speed metrics, and before/try/try/after benchmark results for **Investigative Board (BoardCraft)**.

---

## 1. Frame Budget & Target Thresholds

To guarantee smooth rendering across displays (including 120Hz ProMotion on macOS):

| Metric | Target Budget | Stress Target | Rationale |
| :--- | :---: | :---: | :--- |
| **Total Frame Time** | $\le 16.6\text{ ms}$ | $\le 33.3\text{ ms}$ | Locked 60 FPS minimum; ideally $\le 8.3\text{ ms}$ for 120 FPS |
| **Connection Calculations (Jumps/Routing)** | $\le 2.0\text{ ms}$ | $\le 4.0\text{ ms}$ | Leaves 85%+ frame budget for pins, cards, text, and canvas redraw |
| **Intersection Detection Scaling** | Sub-linear | $O(N)$ effective | Bounding-box pre-filtering prevents $O(N^2)$ quadratic spikes |

---

## 2. Benchmark Log 001: Connection Line Jumps (Bridge Arcs)

* **Date:** 2026-11-04
* **Subsystem:** [`js/core/app.js`](file:///Users/health/Sites/investigative-board/js/core/app.js) (`drawConnections`, `lineSegmentIntersection`)
* **Hardware:** Apple Silicon (macOS) / Node.js runtime
* **Test Harness:** [`tests/benchmark-render-speed.js`](file:///Users/health/Sites/investigative-board/tests/benchmark-render-speed.js)
* **Conditions:** Synthetic dense graphs with 50 to 500 crossing straight connections in a 2400×2400px world.

### Optimization Progression

1. **Before (Baseline - Naive Pairwise Check):**
   * Performed full determinant calculation (`dxA * dyB - dyA * dxB`) on all $\frac{N(N-1)}{2}$ line pairs.
   * For 500 connections, required ~124,750 determinant evaluations every frame.

2. **Try 1 (Inline AABB Bounding Box Check):**
   * Added dynamic `Math.min` / `Math.max` bounding box checks inline before calculating determinants.
   * Successfully eliminated non-overlapping segment math, but recomputed min/max repeatedly inside the inner loop.

3. **Try 2 / After (Pre-computed AABB Coordinates & Scalar Rejections):**
   * Pre-calculated `minX, maxX, minY, maxY, dx, dy` once per segment into flat object attributes.
   * Inner loop reduced to 4 raw scalar comparisons (`aMaxX < segB.minX || aMinX > segB.maxX || aMaxY < segB.minY || aMinY > segB.maxY`).
   * Bypasses 90%+ of non-crossing line pairs with single CPU cycle register comparisons.

### Empirical Results Table

| Scale | Connections | Intersections Detected | Baseline (Before) | Try 1 (Inline AABB) | Try 2 / After (Precomputed AABB) | Speedup Factor | Budget Status ($\le 2.0\text{ ms}$) |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Small Board** | 50 | 0 | 0.074 ms | 0.123 ms | **0.015 ms** | **4.97x** | ✅ Under Budget (0.015 ms) |
| **Medium Board** | 100 | 553 | 0.290 ms | 0.099 ms | **0.110 ms** | **2.63x** | ✅ Under Budget (0.110 ms) |
| **Dense Board** | 250 | 5,524 | 0.499 ms | 0.342 ms | **0.303 ms** | **1.65x** | ✅ Under Budget (0.303 ms) |
| **Stress Board** | 500 | 23,344 | 2.155 ms | 2.018 ms | **1.314 ms** | **1.64x** | ✅ Under Budget (1.314 ms) |

### Key Findings & Takeaways
* **Small/Medium Boards:** Pre-computed bounding boxes achieved up to **4.97x speedup**, taking connection jump routing down to **15 microseconds**.
* **Stress Scale (500 connections):** Baseline exceeded the 2.0ms frame budget (2.155ms). Try 2 pulled it down to **1.314ms**, keeping even massive 500-string conspiracy boards well within 60 FPS real-time panning/zooming.
* **Accuracy:** All 3 variants verified identical intersection counts across all runs, ensuring zero visual artifacts or missed bridge arcs.

---

## 3. Benchmark Log 002: Stencil Palette & Clue Spawning

* **Date:** 2026-11-04
* **Subsystem:** [`js/ui/stencilDock.js`](file:///Users/health/Sites/investigative-board/js/ui/stencilDock.js), [`js/events/eventHandlers.js`](file:///Users/health/Sites/investigative-board/js/events/eventHandlers.js)
* **Target Budget:** $\le 0.100\text{ ms}$ (100 µs) per spawned stencil pin
* **Test Harness:** [`tests/test-stencil-palette.js`](file:///Users/health/Sites/investigative-board/tests/test-stencil-palette.js)

### Results Table

| Action | Volume | Total Time | Time / Entity | Budget Status | Output Consistency |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Stencil Deserialization & Grid Snap** | 100 entities | **5.625 ms** | **0.056 ms** (56.2 µs) | ✅ Under 100 µs budget | 100% 40px grid aligned |
| **Drag & Drop Serialization** | 100 payloads | **0.840 ms** | **0.008 ms** (8.4 µs) | ✅ Instantaneous | Valid MIME type & JSON |
