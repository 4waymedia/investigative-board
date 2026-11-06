# Project Status & Health Report

* **Project:** Investigative Board / BoardCraft
* **Ecosystem Alignment:** [ArtCraft](https://getartcraft.com/apps) Desktop Creative Suite
* **Active Branch:** `file_functions`
* **Test Suite Health:** **38 passed, 0 failed out of 38 suites** (`node tests/run-all.js`)
* **Last Updated:** 2026-11-06

---

## 1. Executive Summary

Investigative Board (BoardCraft) is a high-performance, local-first infinite canvas application for spatial investigation, node-link diagramming, system architecture data-flow charting, and autonomous AI agent collaboration. All 38 regression test suites pass with zero failures. The application features zero external npm runtime dependencies, sub-millisecond connection routing and rendering, Model Context Protocol (MCP) agent automation, a 40px master snap grid, an investigative stencil dock, an optimized `Pin` class supporting inset media, and a complete ByteByteGo-inspired data-flow charting engine featuring Manhattan orthogonal routing, 4-way perimeter docking, directional arrowheads, step sequence badges, and rate multipliers.

---

## 2. Test Suite & Validation Matrix

All test suites are executed via the master runner `node tests/run-all.js`:

| # | Test Suite | Component / Area | Status |
| :-: | :--- | :--- | :---: |
| 1 | `test-area-connection.js` | Area pin hit-testing and thread connection line creation | ✅ PASS |
| 2 | `test-area-drag.js` | Area marquee bounding box dragging & pin inclusion | ✅ PASS |
| 3 | `test-artcraft-agent-api.js` | ArtCraft Agent MCP suite, AI stencils, themes & REST dispatch | ✅ PASS |
| 4 | `test-board-manager.js` | BoardManager CRUD, background saving & index management | ✅ PASS |
| 5 | `test-branch-manager.js` | Hold-to-branch charge gauge, 45° radial magnetic snap & symmetry | ✅ PASS |
| 6 | `test-canvas-container.js` | Viewport container styling, DOM sizing & dynamic background | ✅ PASS |
| 7 | `test-canvas-grid-layout.js` | Master 40px grid aspect alignment and layout positioning | ✅ PASS |
| 8 | `test-connection-jumps-and-labels.js` | Smart semi-circular line jumps (bridge arcs) & label chips | ✅ PASS |
| 9 | `test-data-flow-charting.js` | Orthogonal Manhattan routing, port docking, arrowheads & flow stencils | ✅ PASS |
| 10 | `test-image-hit-testing.js` | Full bounding-box hit testing and image selection | ✅ PASS |
| 11 | `test-key-4-text-activation.js` | Key '4' hotkey text tool switching | ✅ PASS |
| 12 | `test-keyboard-debug.js` | Modifier key event propagation | ✅ PASS |
| 13 | `test-keyboard-text-deselect.js` | Escape key dismissal and blur handling | ✅ PASS |
| 14 | `test-keyboard.js` | Keyboard ergonomics and tool hotkeys | ✅ PASS |
| 15 | `test-layout-dock.js` | ArtCraft Layout Dock auto-centering & history snapshots | ✅ PASS |
| 16 | `test-layout-erasing-fix.js` | Coordinate integrity, finite bounds guards & timeline parsing | ✅ PASS |
| 17 | `test-lazy-dom-references.js` | Safe DOM element lookups across lifecycle | ✅ PASS |
| 18 | `test-mcp-server.js` | Model Context Protocol JSON-RPC 2.0 stdio server (22 tools) | ✅ PASS |
| 19 | `test-modal-ids.js` | 31 modal DOM element ID verification | ✅ PASS |
| 20 | `test-no-duplicate-declarations.js` | Zero duplicate globals or class declarations | ✅ PASS |
| 21 | `test-pin-class.js` | Optimized `Pin` class, archetype factories & inset image layout | ✅ PASS |
| 22 | `test-pin-connection-integrity.js` | Safe pin deletion without index corruption or orphan strings | ✅ PASS |
| 23 | `test-radial-edit-action.js` | Radial menu pencil click opening pin edit modal | ✅ PASS |
| 24 | `test-shadow-color-field.js` | Hex and RGBA CSS shadow color string parsing | ✅ PASS |
| 25 | `test-shape-registration.js` | Custom shape registry and render dispatch | ✅ PASS |
| 26 | `test-shift-color-selection.js` | Shift+1-9 color slot cycling | ✅ PASS |
| 27 | `test-stencil-palette.js` | Stencil Dock lifecycle, clue presets & drag-and-drop stamping | ✅ PASS |
| 28 | `test-text-creation-rename.js` | Text pin creation with inline rename | ✅ PASS |
| 29 | `test-text-drag-creation.js` | Drag-to-size text creation | ✅ PASS |
| 30 | `test-text-drag-sizing.js` | Corner resize handle bounds | ✅ PASS |
| 31 | `test-text-keyboard-cycle.js` | Tab key text entity cycling | ✅ PASS |
| 32 | `test-text-modal-dom.js` | Text modal dialog DOM integrity | ✅ PASS |
| 33 | `test-text-type-bar.js` | Text floating toolbar active state | ✅ PASS |
| 34 | `test-theme-selection-fix.js` | Non-destructive theme initialization & default fallback | ✅ PASS |
| 35 | `test-theme-selection.js` | Theme switcher palette swapping | ✅ PASS |
| 36 | `test-tool-selection.js` | Tool mode radio group state | ✅ PASS |
| 37 | `test-type-bar-exclusive-active.js` | Exclusive active bar button toggling | ✅ PASS |
| 38 | `test-viewport-culling.js` | Viewport culling optimization for off-screen pins and lines | ✅ PASS |

---

## 3. Performance Benchmark Summary

Empirical Before / Try / Try / After metrics recorded in [`docs/BENCHMARKS.md`](file:///Users/health/Sites/investigative-board/docs/BENCHMARKS.md):

* **Data-Flow Manhattan Routing & Ports:** 1,000 orthogonal routes & waypoints generated in 4.82 ms (**4.8 µs per route**), with sub-pixel polyline badge sampling in 1.8 µs.
* **Line Jumps (Bridge Arcs):** Precomputed AABB scalar rejections achieve **4.97x speedup** on small boards (15 µs) and **1.64x speedup** on 500 connections (1.314 ms, well within the 2.0 ms frame budget).
* **Stencil Palette Spawning:** 100 clue entities stamped and grid-snapped in 5.45 ms (**54.6 µs per entity**).
* **MCP Agent Tooling:** Average tool execution latency **0.15 - 0.24 ms**, satisfying the $\le 1.0\text{ ms}$ budget.
* **Pin Class & Inset Media:** `Pin.from()` deserializes 500 pins in 2.15 ms (**4.3 µs per pin**), 11.6x faster than target.

---

## 4. Recent Commits on Branch `file_functions`

* **`241827b`**: `feat(pins): optimized Pin class architecture with inset image rendering for speech/thought bubbles`
* **`f5113cd`**: `feat(agent): ArtCraft Agent MCP suite for AI-generated stencils, themes & custom shapes`
* **`033aa19`**: `feat: investigative stencil palette with 8 clue presets, drag-drop & click-to-stamp`
* **`183313a`**: `perf: add benchmark suite & precomputed AABB line jump optimization (up to 4.97x speedup)`
* **`97cec49`**: `feat: smart line jumps (bridge arcs) & polished connection labels with double-click editing`
* **`f6e3c03`**: `fix(branching): immediate pin dragging & symmetric opposite branch distances`

---

## 5. Active Bug Resolution Tracker

* `BUG-001` through `BUG-015`: Fully resolved and verified in regression suite.
* `BUG-016`: Pin drag suppression and branch distance symmetry resolved.
* `BUG-017`: Dark canvas external label contrast (`#000000` text on dark theme) resolved with theme text color routing and drop-shadow backing.
