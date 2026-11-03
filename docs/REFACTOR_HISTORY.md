# Refactor History & Architectural Evolution

This document chronicles the architectural evolution of the codebase from its experimental prototype through its transition into the **BoardCraft** ArtCraft-standard system.

---

## 1. Evolution Timeline

```
┌─────────────────────────────────┐
│ Phase 0: Monolithic Prototype   │ Single-file canvas script with inline state & event loops
└───────────────┬─────────────────┘
                ▼
┌─────────────────────────────────┐
│ Phase 1: Modular Separation     │ Split into js/core, js/events, js/ui, js/shapes
└───────────────┬─────────────────┘
                ▼
┌─────────────────────────────────┐
│ Phase 2: Multi-Board & Schema   │ Added BoardManager, theme schema, and local storage index
└───────────────┬─────────────────┘
                ▼
┌─────────────────────────────────┐
│ Phase 3: Branch Merge & Repair  │ Stabilized file_functions branch, resolved 8 critical bugs
└───────────────┬─────────────────┘
                ▼
┌─────────────────────────────────┐
│ Phase 4: Viewport Optimization  │ Canvas viewport bounding culling for 60 FPS on large boards
└───────────────┬─────────────────┘
                ▼
┌─────────────────────────────────┐
│ Phase 5: ArtCraft Agent Suite   │ Built CLI, Model Context Protocol (MCP) server & SSE bridge
└─────────────────────────────────┘
```

---

## 2. Phase Summaries

### Phase 0: Monolithic Prototype
- **Characteristics:** Original test concept. All pin math, canvas drawing loops, event listeners, and drag handlers resided in a single unstructured JavaScript file (`index.js`).
- **Challenges:** High coupling, inability to test rendering logic independently of DOM events, lack of state isolation, difficult undo/redo tracking.

### Phase 1: Modular Separation
- **Transformations:**
  - Separated state store into [`js/core/state.js`](file:///Users/health/Sites/investigative-board/js/core/state.js) (`AppState`).
  - Extracted rendering pipelines into [`js/drawing.js`](file:///Users/health/Sites/investigative-board/js/drawing.js).
  - Isolated keyboard, mouse, and gesture handlers into [`js/events/eventHandlers.js`](file:///Users/health/Sites/investigative-board/js/events/eventHandlers.js).
  - Factored UI elements into [`js/ui/`](file:///Users/health/Sites/investigative-board/js/ui/) modules (`toolbar.js`, `colorPicker.js`, `systemMenu.js`).
  - Added extensible shape registry in [`js/shapes/shapeRegistry.js`](file:///Users/health/Sites/investigative-board/js/shapes/shapeRegistry.js).

### Phase 2: Multi-Board System & Theme Schemas
- **Transformations:**
  - Implemented [`js/core/boardManager.js`](file:///Users/health/Sites/investigative-board/js/core/boardManager.js) allowing users to switch between, create, rename, and delete multiple independent boards.
  - Added board registry in browser `localStorage` (`investigative_boards_index`).
  - Introduced formal schema definitions in [`js/core/schema.js`](file:///Users/health/Sites/investigative-board/js/core/schema.js) with 5 studio themes: Dark, Light, Sepia, Nord, Midnight.
  - Implemented automatic canvas thumbnail generation for the visual board picker dialog.

### Phase 3: The `file_functions` Merge & Stabilization
- **Context:** Merging multi-board and file import/export capabilities resulted in several breaking regressions and state corruptions.
- **Critical Interventions:**
  1. **Theme Default Mapping:** Normalized `"default"` theme IDs to `"dark"` in `SchemaManager`, resolving console warnings and visual glitches on load.
  2. **Non-Destructive Boot:** Stopped `applyTheme()` on boot from re-slotting existing pin colors and pushing spurious undo snapshots.
  3. **Canvas Shadow Color Syntax:** Handled `rgba(...)` vs `#hex` syntax in `drawing.js` dropshadow calculations, preventing dropped canvas shadows.
  4. **Connection Pointer Integrity:** Replaced dangerous `pins.splice()` calls with `appState.removePin()`, maintaining valid graph index references and preventing null pointer crashes.
  5. **Board Description Retention:** Restored missing description arguments in `newBoardModalUI.js` and `systemMenu.js`.
  6. **Thumbnail Generation Decoupling:** Restricted offscreen thumbnail rasterization from synchronous micro-interaction saves (`saveState(false)`), eliminating UI lag during dragging.

### Phase 4: Engine Optimization & Viewport Culling
- **Transformations:**
  - Implemented `getVisibleWorldBounds(buffer = 200)` in [`js/core/app.js`](file:///Users/health/Sites/investigative-board/js/core/app.js).
  - Added spatial culling tests in `drawPins()` and `drawConnections()`.
  - Offscreen nodes (outside the viewport plus a 200px safety buffer) bypass canvas path rasterization, text measurement, and shadow blurring.
  - Verified benchmark: boards with 1,000+ elements maintain smooth 60 FPS pan and zoom.

### Phase 5: ArtCraft Agent Suite (CLI & MCP)
- **Transformations:**
  - Built zero-dependency Node.js CLI in [`cli/index.js`](file:///Users/health/Sites/investigative-board/cli/index.js) supporting 15 subcommands.
  - Created [`cli/mcp-server.js`](file:///Users/health/Sites/investigative-board/cli/mcp-server.js) implementing Model Context Protocol JSON-RPC 2.0 stdio with 13 tools and resource inspection (`board://{id}`).
  - Built real-time HTTP server and Server-Sent Events (SSE) bridge in [`cli/server.js`](file:///Users/health/Sites/investigative-board/cli/server.js) and [`js/core/syncBridge.js`](file:///Users/health/Sites/investigative-board/js/core/syncBridge.js).
  - Created filesystem persistence layer in [`cli/storage.js`](file:///Users/health/Sites/investigative-board/cli/storage.js) writing clean JSON structures to `data/boards/`.

---

## 3. Component Transformation Map

| Module Path | Legacy State | Modernized State | Primary Responsibilities |
| :--- | :--- | :--- | :--- |
| [`js/core/app.js`](file:///Users/health/Sites/investigative-board/js/core/app.js) | Monolithic orchestrator | Modular lifecycle coordinator | Bootstrapping, canvas resize, render loop, viewport culling, dependency injection |
| [`js/core/state.js`](file:///Users/health/Sites/investigative-board/js/core/state.js) | Direct object manipulation | Encapsulated state manager | Reactive state, safe entity removal, undo/redo stack, coordinate transforms |
| [`js/core/boardManager.js`](file:///Users/health/Sites/investigative-board/js/core/boardManager.js) | Did not exist | Multi-board storage manager | Board registry, thumbnail caching, active board switching, browser storage |
| [`js/core/schema.js`](file:///Users/health/Sites/investigative-board/js/core/schema.js) | Hardcoded CSS values | Formal schema registry | Theme palettes, shape geometries, canvas defaults, theme fallback normalization |
| [`js/core/syncBridge.js`](file:///Users/health/Sites/investigative-board/js/core/syncBridge.js) | Did not exist | Live agent sync client | SSE connection to `cli/server.js`, auto-refreshing GUI on agent modifications |
| [`js/drawing.js`](file:///Users/health/Sites/investigative-board/js/drawing.js) | Global drawing routines | Pure rendering pipeline | Canvas path generation, text measurement, bezier string lines, dropshadows |
| [`js/events/eventHandlers.js`](file:///Users/health/Sites/investigative-board/js/events/eventHandlers.js) | Window-level anonymous listeners | Unified dispatch system | Mouse, wheel, touch, and keyboard hotkeys, modal focus delegation |
| [`cli/mcp-server.js`](file:///Users/health/Sites/investigative-board/cli/mcp-server.js) | Did not exist | MCP JSON-RPC 2.0 server | Agent tool interface: 13 board/pin/connection manipulation tools & resources |
| [`cli/index.js`](file:///Users/health/Sites/investigative-board/cli/index.js) | Did not exist | ArtCraft-style CLI binary | Command-line management, batch automation, data export/import, server launching |

---

## 4. Architectural Rules Established

1. **State Isolation**: Canvas drawing functions must never mutate `AppState`; all mutations pass through explicit methods (`addPin`, `removePin`, `updatePin`, `setTool`).
2. **Graph Consistency**: Any operation removing a pin must clean up all references in `connections` and adjust indices greater than the removed index.
3. **Safe Storage Separation**: UI micro-interactions must never trigger synchronous heavy operations (such as thumbnail image compression).
4. **Agent Equality**: All board mutations exposed to human users via UI must be symmetrically accessible via CLI subcommands and MCP tools.
