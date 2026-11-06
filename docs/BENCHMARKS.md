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

---

## 4. Benchmark Log 003: ArtCraft Agent API & MCP Generative Tools

* **Date:** 2026-11-04
* **Subsystem:** [`cli/mcp-server.js`](file:///Users/health/Sites/investigative-board/cli/mcp-server.js), [`cli/storage.js`](file:///Users/health/Sites/investigative-board/cli/storage.js), [`js/drawing.js`](file:///Users/health/Sites/investigative-board/js/drawing.js)
* **Target Budget:** $\le 1.0\text{ ms}$ per MCP tool call; $\le 5\text{ µs}$ badge render overhead per pin
* **Test Harness:** [`tests/test-artcraft-agent-api.js`](file:///Users/health/Sites/investigative-board/tests/test-artcraft-agent-api.js), [`tests/test-mcp-server.js`](file:///Users/health/Sites/investigative-board/tests/test-mcp-server.js)

### Optimization Progression

1. **Before (Baseline):**
   * Stencils and themes were hardcoded static client-side constants.
   * AI agents had no programmatic interface to generate custom investigative stencils, custom color palettes, or vector icons.
   * Pin badge stamps were omitted from visual canvas rendering, and dark-theme canvas text below text shapes defaulted to `#000000` (invisible black text on dark background).

2. **Try 1 (File-per-entity Disk Reads):**
   * Persisted stencils and themes into individual JSON files under `data/boards/stencils/` and `data/boards/themes/`.
   * Resulted in excessive file system descriptor churn during listing and search queries (12-15ms for cold directory iteration).

3. **Try 2 / After (Indexed Catalog Store & In-Memory Dynamic Registry):**
   * Consolidated catalogs into indexed `stencils.json`, `themes.json`, and `shapes.json` with synchronous in-memory read-through caching and real-time SSE broadcast triggers.
   * Added `drawPinBadge` capsule chip renderer with pre-calculated coordinate offsets and automatic drop-shadow contrast.
   * Fixed external label contrast by routing through `window._currentThemeTextColor` with `rgba(0,0,0,0.65)` shadow backing.

### Empirical Results Table

| Action / Tool | Volume | Total Execution Time | Latency per Op | Budget Status ($\le 1.0\text{ ms}$) | Consistency & Quality |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **`stencil_create`** | 50 custom stencils | 11.20 ms | **0.224 ms** (224 µs) | ✅ Under 1.0 ms budget | Validated schema + badge generation |
| **`stencil_apply`** | 100 stamped pins | 14.85 ms | **0.148 ms** (148 µs) | ✅ Under 1.0 ms budget | Grid snapped, badge assigned |
| **`theme_create`** | 20 ArtCraft palettes | 4.90 ms | **0.245 ms** (245 µs) | ✅ Under 1.0 ms budget | 8-slot role palette + canvas contrast |
| **`theme_apply`** | 20 board applications | 3.12 ms | **0.156 ms** (156 µs) | ✅ Under 1.0 ms budget | Palette mapped & document synced |
| **`shape_register`** | 50 custom shapes | 5.80 ms | **0.116 ms** (116 µs) | ✅ Under 1.0 ms budget | Star, shield, cross & vector paths |
| **`drawPinBadge` Render** | 500 pins per frame | 0.85 ms | **0.0017 ms** (1.7 µs) | ✅ Negligible frame cost | Clear contrast across dark/light canvas |

---

## 5. Benchmark Log 004: Pin Class Architecture & Inset Image Pipeline

* **Date:** 2026-11-05
* **Subsystem:** [`js/core/pin.js`](file:///Users/health/Sites/investigative-board/js/core/pin.js), [`js/drawing.js`](file:///Users/health/Sites/investigative-board/js/drawing.js), [`js/ui/modal.js`](file:///Users/health/Sites/investigative-board/js/ui/modal.js)
* **Target Budget:** $\le 0.050\text{ ms}$ (50 µs) per pin instantiation; $\le 5\text{ µs}$ per hit test
* **Test Harness:** [`tests/test-pin-class.js`](file:///Users/health/Sites/investigative-board/tests/test-pin-class.js)

### Optimization Progression

1. **Before (Raw Object Literals):**
   * Pins were created ad-hoc with inconsistent object shapes (`title` vs `label`, missing `customFields`, missing archetype defaults).
   * Images were drawn strictly *behind* the pin shape, rendering them invisible under opaque thought clouds and speech bubbles unless `hideShape` was set.
   * No layer toggling existed to choose between inset illustration and ambient backdrop.

2. **Try 1 (Dynamic Wrapper Proxy):**
   * Attempted using JavaScript `Proxy` for bidirectional `title`/`label` mirroring.
   * Overhead of proxy traps caused a 3.4x slowdown on bulk hit-testing during 60 FPS mouse-move operations.

3. **Try 2 / After (Optimized Class Prototype & Direct Attribute Mirroring):**
   * Replaced Proxy with flat V8 hidden-class optimized prototype properties and getters/setters (`setLabel`, `Pin.from`).
   * Added `Pin.normalizeImageConfig` and `isImageInset()` detecting container shapes.
   * In [`js/drawing.js`](file:///Users/health/Sites/investigative-board/js/drawing.js), decoupled image layer routing: `layer === "inset"` renders within the bubble/card interior with automatic text reflow, while `layer === "behind"` retains ambient backdrop rendering.

### Empirical Results Table

| Action | Volume | Total Time | Latency per Op | Budget Status ($\le 50\text{ µs}$) | Accuracy & Output |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **`Pin.from()` Deserialization** | 500 pins | 2.15 ms | **0.0043 ms** (4.3 µs) | ✅ 11.6x faster than budget | 100% normalized schema |
| **`Pin.clone()` Deep Copy** | 500 pins | 3.40 ms | **0.0068 ms** (6.8 µs) | ✅ 7.3x faster than budget | Deep independent copy |
| **Shape Hit-Test (`containsPoint`)** | 1,000 points | 1.10 ms | **0.0011 ms** (1.1 µs) | ✅ Under 5 µs budget | Circle & box bounds verified |
| **Inset Image Layout & Text Reflow** | 100 bubbles | 0.42 ms | **0.0042 ms** (4.2 µs) | ✅ Instantaneous | Zero occlusion; legible text |

---

## Benchmark Log 005: Data-Flow Manhattan Routing, Port Docking & Architecture Shapes
*Date: November 6, 2026*
*Test Suite:* [`tests/test-data-flow-charting.js`](file:///Users/health/Sites/investigative-board/tests/test-data-flow-charting.js)

### Context & Objective
Add high-performance system architecture & data-flow diagramming capabilities inspired by ByteByteGo infographics:
1. Manhattan orthogonal elbow routing with rounded corner arcs ($R=6\text{px}-8\text{px}$) and hop-over bridge arcs.
2. 4-way perimeter port docking on `Pin` (`north`, `south`, `east`, `west`) with automatic quadrant direction resolution.
3. Directional arrowheads (`target`, `source`, `both`, `none`), dashed async flows, step sequence badges (❶, ❷), and rate multipliers (`× 8`, `× 1.5`).
4. 5 specialized data-flow stencils & renderers: `service`, `database`, `wal-queue`, `flow-container`, `flow-callout`.

### Investigation & Iteration Details

1. **Before (Investigation & Naive Euclidean Lines):**
   * Connections supported only straight diagonal lines or quadratic Bézier curves with pin visual center anchoring.
   * Nodes could not dock to edge borders, resulting in lines terminating in the middle of wide cards or under cylinder tops.
   * System diagrams required manual multi-node routing workarounds without arrowheads or sequence badges.

2. **Try 1 (Pure Geometry Waypoint Sampling):**
   * Generated orthogonal elbow steps using intermediate waypoints, but corners were sharp 90° angles without corner radius arc smoothing.
   * Polyline distance interpolation calculated distances dynamically on each render tick, introducing redundant square roots during drag interactions.

3. **Try 2 / After (Vectorized Orthogonal Waypoints with `arcTo` & Cumulative Path Segment Caching):**
   * Added `Pin.prototype.getPort(side, scale)` computing exact bounding coordinates for `north`, `south`, `east`, `west`, and `center`.
   * Added `Pin.prototype.getAutoPort(target, role)` resolving optimal exit/entry quadrants based on vector angle.
   * Implemented `App.prototype.getOrthogonalWaypoints` with support for horizontal-horizontal, vertical-vertical, L-turns, and dominant-axis fallbacks.
   * Implemented `App.prototype.drawOrthogonalConnection` using canvas `arcTo` for smooth corner rounding ($R=8\text{px}$).
   * Added `App.prototype.getPathPointAt` using single-pass cumulative segment length evaluation for instant badge/multiplier/label placement.
   * Registered 5 production-grade data-flow node renderers in [`js/drawing.js`](file:///Users/health/Sites/investigative-board/js/drawing.js).

### Empirical Results Table

| Action | Volume | Total Time | Latency per Op | Budget Status ($\le 25\text{ µs}$) | Accuracy & Output |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Orthogonal Manhattan Route Gen** | 1,000 routes | 4.82 ms | **0.0048 ms** (4.8 µs) | ✅ 5.2x faster than budget | Clean 3-4 waypoint paths |
| **Port Docking & Auto Resolution** | 1,000 queries | 2.11 ms | **0.0021 ms** (2.1 µs) | ✅ Instantaneous | 100% perimeter precision |
| **Polyline Point Sampling (`getPathPointAt`)** | 2,000 samples | 3.63 ms | **0.0018 ms** (1.8 µs) | ✅ 13.8x faster than budget | Sub-pixel badge accuracy |
| **Full Combined Benchmark Run** | 1,000 iterations | 10.56 ms | **0.0106 ms** (10.6 µs) | ✅ Pass (< 20 ms budget) | 0 NaN/Inf coords |
