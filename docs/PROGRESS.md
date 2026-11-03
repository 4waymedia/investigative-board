# System Progress, Tests & Bug Tracker

This document provides a comprehensive progress tracking system for the **Investigative Board** project (evolving into **BoardCraft**). It tracks test suites, active and resolved bug logs, technical root cause analyses, and verification benchmarks.

---

## 1. Test Suite Matrix

The project utilizes an automated node-based integration and regression testing runner: [`tests/run-all.js`](file:///Users/health/Sites/investigative-board/tests/run-all.js).

| Suite | File | Category | Focus & Validation Criteria | Status |
| :--- | :--- | :--- | :--- | :--- |
| **01** | [`tests/test-area-drag.js`](file:///Users/health/Sites/investigative-board/tests/test-area-drag.js) | Interactions | Box multi-selection, coordinate transforms, pin inclusion bounding boxes | ✅ PASS |
| **02** | [`tests/test-board-manager.js`](file:///Users/health/Sites/investigative-board/tests/test-board-manager.js) | Storage / Core | Multi-board CRUD, board index persistence, active board switching, description retention | ✅ PASS |
| **03** | [`tests/test-canvas-container.js`](file:///Users/health/Sites/investigative-board/tests/test-canvas-container.js) | UI / DOM | Canvas viewport resizing, DPI scaling, container element lifecycle | ✅ PASS |
| **04** | [`tests/test-key-4-text-activation.js`](file:///Users/health/Sites/investigative-board/tests/test-key-4-text-activation.js) | Shortcuts | Keyboard digit `4` hotkey switching tool mode to text pin creation | ✅ PASS |
| **05** | [`tests/test-keyboard-debug.js`](file:///Users/health/Sites/investigative-board/tests/test-keyboard-debug.js) | Shortcuts | Modifier keys (`Shift`, `Alt`, `Meta`), event propagation, and suppression in text inputs | ✅ PASS |
| **06** | [`tests/test-keyboard-text-deselect.js`](file:///Users/health/Sites/investigative-board/tests/test-keyboard-text-deselect.js) | Shortcuts | `Escape` key dismissing active selection and blurring open inline inputs | ✅ PASS |
| **07** | [`tests/test-keyboard.js`](file:///Users/health/Sites/investigative-board/tests/test-keyboard.js) | Shortcuts | Core hotkeys (`1`-`5` tools, `Delete`/`Backspace`, `Cmd+Z`, `Cmd+Shift+Z`) | ✅ PASS |
| **08** | [`tests/test-lazy-dom-references.js`](file:///Users/health/Sites/investigative-board/tests/test-lazy-dom-references.js) | UI / DOM | Safe DOM lookup guards, ensuring non-null element bindings across lifecycle stages | ✅ PASS |
| **09** | [`tests/test-mcp-server.js`](file:///Users/health/Sites/investigative-board/tests/test-mcp-server.js) | Agent / MCP | Model Context Protocol JSON-RPC 2.0 stdio initialization, 13 tools, resources, and storage | ✅ PASS |
| **10** | [`tests/test-no-duplicate-declarations.js`](file:///Users/health/Sites/investigative-board/tests/test-no-duplicate-declarations.js) | Architecture | Static AST/regex scan ensuring no duplicate class, function, or global namespace declarations | ✅ PASS |
| **11** | [`tests/test-pin-connection-integrity.js`](file:///Users/health/Sites/investigative-board/tests/test-pin-connection-integrity.js) | Engine / Math | Connection integrity on pin removal, re-indexing of `from`/`to` pointers, pruning orphaned lines | ✅ PASS |
| **12** | [`tests/test-shadow-color-field.js`](file:///Users/health/Sites/investigative-board/tests/test-shadow-color-field.js) | Engine / Render | Schema theme definition validation ensuring `shadowColor` exists and formats valid CSS strings | ✅ PASS |
| **13** | [`tests/test-shape-registration.js`](file:///Users/health/Sites/investigative-board/tests/test-shape-registration.js) | Engine / Registry | Custom shape registration (`pin`, `circle`, `star`, etc.) with stroke and hit-testing | ✅ PASS |
| **14** | [`tests/test-shift-color-selection.js`](file:///Users/health/Sites/investigative-board/tests/test-shift-color-selection.js) | Interaction | `Shift + [1-9]` hotkey cycling color slots for active pin or tool default | ✅ PASS |
| **15** | [`tests/test-text-creation-rename.js`](file:///Users/health/Sites/investigative-board/tests/test-text-creation-rename.js) | State / Undo | Text pin creation with inline rename workflow, undo/redo state preservation | ✅ PASS |
| **16** | [`tests/test-text-drag-creation.js`](file:///Users/health/Sites/investigative-board/tests/test-text-drag-creation.js) | Interaction | Drag-to-size text box creation mechanics, minimum dimensions guard | ✅ PASS |
| **17** | [`tests/test-text-drag-sizing.js`](file:///Users/health/Sites/investigative-board/tests/test-text-drag-sizing.js) | Interaction | Text frame boundary handles, corner resize constraints, font auto-wrap | ✅ PASS |
| **18** | [`tests/test-text-keyboard-cycle.js`](file:///Users/health/Sites/investigative-board/tests/test-text-keyboard-cycle.js) | Shortcuts | `Tab` / `Shift+Tab` cycling between text entities on canvas | ✅ PASS |
| **19** | [`tests/test-text-modal-dom.js`](file:///Users/health/Sites/investigative-board/tests/test-text-modal-dom.js) | UI / Modals | Modal dialog creation, focus trapping, form validation, and backdrop teardown | ✅ PASS |
| **20** | [`tests/test-text-type-bar.js`](file:///Users/health/Sites/investigative-board/tests/test-text-type-bar.js) | UI / Toolbar | Floating toolbar state matching active text selection properties (font, align, size) | ✅ PASS |
| **21** | [`tests/test-theme-selection-fix.js`](file:///Users/health/Sites/investigative-board/tests/test-theme-selection-fix.js) | Themes | Verified fix for `themeId: "default"` fallback mapping and non-destructive board load | ✅ PASS |
| **22** | [`tests/test-theme-selection.js`](file:///Users/health/Sites/investigative-board/tests/test-theme-selection.js) | Themes | Theme switcher UI, palette swapping, background canvas redraw triggers | ✅ PASS |
| **23** | [`tests/test-tool-selection.js`](file:///Users/health/Sites/investigative-board/tests/test-tool-selection.js) | Toolbar | Tool radio group state switching (`select`, `pin`, `string`, `text`, `pan`) | ✅ PASS |
| **24** | [`tests/test-type-bar-exclusive-active.js`](file:///Users/health/Sites/investigative-board/tests/test-type-bar-exclusive-active.js) | UI / Toolbar | Exclusive active states for UI bar items, preventing multi-toggle collision | ✅ PASS |
| **25** | [`tests/test-viewport-culling.js`](file:///Users/health/Sites/investigative-board/tests/test-viewport-culling.js) | Performance | Viewport bounding-box culling for 1,000+ pins and lines outside camera view | ✅ PASS |
| **26** | [`tests/test-modal-ids.js`](file:///Users/health/Sites/investigative-board/tests/test-modal-ids.js) | UI / DOM | Comprehensive check of all 31 element IDs utilized by `ModalManager` in `index.html` | ✅ PASS |
| **27** | [`tests/test-radial-edit-action.js`](file:///Users/health/Sites/investigative-board/tests/test-radial-edit-action.js) | UI / Actions | Radial menu pencil click and `pin:edit` action dispatching to `ModalManager.openPinModal` | ✅ PASS |
| **28** | [`tests/test-image-hit-testing.js`](file:///Users/health/Sites/investigative-board/tests/test-image-hit-testing.js) | Engine / Interaction | Full-area image click hit-testing, hidden shape selection, and safe minimum click targets | ✅ PASS |
| **29** | [`tests/test-layout-dock.js`](file:///Users/health/Sites/investigative-board/tests/test-layout-dock.js) | UI / Algorithms | ArtCraft Layout Dock organization algorithms (Grid, Radial, Force, Clusters, Timeline) and undo snapshots | ✅ PASS |
| **30** | [`tests/test-area-connection.js`](file:///Users/health/Sites/investigative-board/tests/test-area-connection.js) | Engine / Interaction | Area pins (circle, rectangle) hit-testing, contained pin priority, and connection lines creation | ✅ PASS |
| **31** | [`tests/test-layout-erasing-fix.js`](file:///Users/health/Sites/investigative-board/tests/test-layout-erasing-fix.js) | UI / Camera | Layout reorganization resilience, finite coordinate validation, container viewport alignment, and area pin culling | ✅ PASS |
| **32** | [`tests/test-canvas-grid-layout.js`](file:///Users/health/Sites/investigative-board/tests/test-canvas-grid-layout.js) | Engine / Layout | Master 40px grid, count-based optimal aspect alignment, drag-release snapping, and group sub-grids | ✅ PASS |

---

## 2. Bug Tracker & Resolution Log

### Status Definitions
- `[RESOLVED]` Issue has been identified, code patched, and regression tests passing.
- `[VERIFIED]` Confirmed passing in end-to-end integration and headless test runs.
- `[OPEN]` Active issue under investigation or pending implementation.

| ID | Severity | Component | Summary | Status | Verified In |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **BUG-001** | High | `js/core/schema.js` | Missing `"default"` theme ID throwing startup warning and corrupting palette fallback | `[VERIFIED]` | `test-theme-selection-fix.js` |
| **BUG-002** | Critical | `js/core/app.js` | Destructive pin recoloring on startup due to `applyTheme()` defaulting `updatePins = true` | `[VERIFIED]` | `test-theme-selection-fix.js` |
| **BUG-003** | Medium | `js/drawing.js` | Invalid CSS shadow color generation (`"rgba(...)80"`) breaking canvas shadow rendering | `[VERIFIED]` | `test-shadow-color-field.js` |
| **BUG-004** | Critical | `js/events/eventHandlers.js` | `Delete`/`Backspace` calling array splice directly, corrupting connection pointers | `[VERIFIED]` | `test-pin-connection-integrity.js` |
| **BUG-005** | Low | `js/ui/newBoardModal.js` | Board descriptions dropped during creation via modal dialog | `[VERIFIED]` | `test-board-manager.js` |
| **BUG-006** | High | `js/core/app.js` | UI freeze during drag/draw operations caused by synchronous thumbnail rasterization in `saveState` | `[VERIFIED]` | `test-board-manager.js` |
| **BUG-007** | Medium | `js/core/state.js` | Text pin color slot and color value dropped during creation and deserialization | `[VERIFIED]` | `test-shift-color-selection.js` |
| **BUG-008** | High | `js/core/app.js` | Duplicate global declaration `window.Application = Application` causing scope collisions | `[VERIFIED]` | `test-no-duplicate-declarations.js` |
| **BUG-009** | High | `js/core/actions.js` & `js/ui.js` | Radial menu pencil click fails to open Pin Modal due to card shape mapping to defunct tray modal and unhandled TypeError in `renderCardColorPicker` | `[VERIFIED]` | `test-radial-edit-action.js` |
| **BUG-010** | High | `js/core/app.js` & `js/drawing.js` | Pins with images unclickable/unmovable when shape is hidden or scaled down; shape rendering ignoring `pin.hideShape` | `[VERIFIED]` | `test-image-hit-testing.js` |
| **BUG-011** | Medium | `js/core/app.js` | Layout algorithms (Grid, Radial, Force, Clusters, Timeline) did not center canvas camera/viewport on arranged pins | `[VERIFIED]` | `test-layout-dock.js` |
| **BUG-012** | High | `js/core/app.js` & `js/events/eventHandlers.js` | Area pins ('circle', 'rectangle') unable to connect with lines on creation or through interaction | `[VERIFIED]` | `test-area-connection.js` |
| **BUG-013** | Critical | `js/core/app.js` | Changing layout erased pins due to timeline `parseDate` returning object instead of timestamp, unconstrained canvas height pushing pins off-screen, and strict viewport bounds culling area pins | `[VERIFIED]` | `test-layout-erasing-fix.js` |
| **BUG-014** | High | `js/core/app.js` & `js/core/layoutEngine.js` | Grid and Radial layouts not centered on screen due to `minCanvasHeight` inflating DOM height, percentage `image.size` producing NaN in bounds, and radial root offset | `[VERIFIED]` | `test-canvas-grid-layout.js` |

---

## 3. Detailed Root Cause Analysis & Fixes

### BUG-001: `"default"` Theme ID Fallback Error
- **Root Cause:** [`js/core/state.js`](file:///Users/health/Sites/investigative-board/js/core/state.js) initializes `currentThemeId` to `"default"`. However, [`js/core/schema.js`](file:///Users/health/Sites/investigative-board/js/core/schema.js) only defined keys `"dark"`, `"light"`, `"sepia"`, `"nord"`, `"midnight"`. Calling `schemaManager.getTheme("default")` logged warnings and fell back unpredictably.
- **Fix:** Added alias check in [`SchemaManager.getTheme(themeId)`](file:///Users/health/Sites/investigative-board/js/core/schema.js):
  ```javascript
  if (themeId === 'default' || !this.themes[themeId]) {
      return this.themes['dark'];
  }
  ```

### BUG-002: Destructive Pin Recoloring on Startup
- **Root Cause:** When [`Application.initialize()`](file:///Users/health/Sites/investigative-board/js/core/app.js) booted, it invoked `this.deps.applyTheme(currentThemeId)`. Because `applyTheme(themeId, updatePins = true)` defaulted `updatePins` to `true`, it iterated over all existing pins, converted their custom colors to match the theme palette slots, and pushed a redundant snapshot into the undo stack on page load.
- **Fix:** Changed initialization to pass `false`:
  ```javascript
  this.deps.applyTheme(initialThemeId, false);
  ```

### BUG-003: Invalid CSS Shadow Alpha Concatenation
- **Root Cause:** In [`js/drawing.js`](file:///Users/health/Sites/investigative-board/js/drawing.js), canvas dropshadows were generated via `shadowColor + "80"`. If `shadowColor` was a 6-character hex code (`#000000`), `#00000080` was valid 8-digit hex. However, modern themes in `schema.js` defined `shadowColor` as an `rgba(...)` string, resulting in `"rgba(0,0,0,0.35)80"`, which HTML5 Canvas fails to parse, dropping the shadow entirely.
- **Fix:** Added hex format detection:
  ```javascript
  const shadowAlpha = (theme.shadowColor && theme.shadowColor.startsWith('#'))
      ? theme.shadowColor + "80"
      : (theme.shadowColor || 'rgba(0,0,0,0.35)');
  ```

### BUG-004: Connection Index Corruption on Pin Deletion
- **Root Cause:** In [`js/events/eventHandlers.js`](file:///Users/health/Sites/investigative-board/js/events/eventHandlers.js) and `actions.js`, the keyboard delete handler directly executed `appState.pins.splice(index, 1)`. Canvas connections store endpoints as integer indices `from` and `to`. Splicing the array without shifting connection indices caused connections pointing to pins after `index` to point to the wrong pin, and connections pointing to the deleted pin to dangle or cause null pointer exceptions during `drawConnections()`.
- **Fix:** Replaced direct array splice with `appState.removePin(index)`. The method prunes all connections referencing `index` and decrements any index greater than `index`.

### BUG-005: Board Description Dropped on Creation
- **Root Cause:** [`js/ui/newBoardModal.js`](file:///Users/health/Sites/investigative-board/js/ui/newBoardModal.js) and [`js/ui/systemMenu.js`](file:///Users/health/Sites/investigative-board/js/ui/systemMenu.js) gathered `name` and `description` from the user, but called `boardManager.createBoard(name)` with only one argument.
- **Fix:** Updated callers to pass `(name, description)`. Updated [`BoardManager.createBoard(name, description = '')`](file:///Users/health/Sites/investigative-board/js/core/boardManager.js) to store `description` in the board header and index table.

### BUG-006: UI Freeze on Micro-Interactions (Synchronous Thumbnail Render)
- **Root Cause:** Every pin drag, drop, or text keystroke triggers `saveState()`. `saveState()` invoked `boardManager.saveBoard()`, which defaulted `updateThumbnail` to `true`. This caused a 256x256 offscreen canvas draw and synchronous `toDataURL('image/png')` encoding on every mouse-move event.
- **Fix:** Set `updateThumbnail = false` for micro-interaction saves (`saveState(false)`). Defer thumbnail rasterization to board switcher open, manual export, or blur events.

### BUG-009: Radial Menu Pencil Click Not Firing Pin Modal
- **Root Cause:** When right-clicking on a canvas pin and clicking the pencil (`✏️`), `executeRadialAction("edit", pinIndex)` invokes `window.executeAction("pin:edit", pinIndex)`. In [`js/core/actions.js`](file:///Users/health/Sites/investigative-board/js/core/actions.js), `PIN_MODAL_MAPPINGS` mapped `"card"` shapes to `"card"`, routing to `window.openCardModal(pinIndex)`. In [`js/ui.js`](file:///Users/health/Sites/investigative-board/js/ui.js), `openCardModal` was a legacy tray-only helper that invoked `renderCardColorPicker()`, which attempted `document.getElementById("cm-color-picker").innerHTML = ""`. Because `#cm-color-picker` does not exist in the DOM, an uncaught TypeError was thrown and caught by `actionSystem.execute`, silently aborting before the modal could open. Furthermore, all canvas card/document/folder/area nodes were intended to use the comprehensive 4-tab `#pin-modal` (`ModalManager.openPinModal`).
- **Fix:**
  1. Updated `PIN_MODAL_MAPPINGS` in `actions.js` to route all canvas node shapes (`card`, `doc`, `folder`, `area-circle`, `area-rect`, `circle`, etc.) to `"pin"`.
  2. Updated `pin:edit` action handler to resolve target pin indices properly (falling back to `selectedPin`) and invoke `modalManager.openPinModal(targetIndex)`.
  3. Added null safety guards in `renderCardColorPicker` and `ModalManager.closeAllModals`.
  4. Added dynamic DOM re-query guards in `ModalManager.openPinModal`.
  5. Verified with new test suite: [`tests/test-radial-edit-action.js`](file:///Users/health/Sites/investigative-board/tests/test-radial-edit-action.js).

### BUG-010: Image Pins Unclickable When Shape Hidden or Scaled Down
- **Root Cause:**
  1. `findPinAt()` in [`js/core/app.js`](file:///Users/health/Sites/investigative-board/js/core/app.js) only evaluated hit detection against `baseRadius * pinScale`. It completely ignored `pin.image` bounds. If a user scaled down `pinScale` to 0.1 or toggled `hideShape: true`, the click target shrank to 2px or became a dead zone, making it impossible to select, drag, or right-click to edit.
  2. `drawPinShape()` in [`js/drawing.js`](file:///Users/health/Sites/investigative-board/js/drawing.js) lacked a `!pin.hideShape` guard for regular pins, drawing the shape icon directly over the center of uploaded images even when the user toggled "Hide Shape".
- **Fix:**
  1. Updated `findPinAt()` to detect clicks across the entire geometric bounds of `pin.image` (taking into account image size, position offsets, and circular/rectangular clipping).
  2. Enforced a safe minimum hit radius of `Math.max(16, baseRadius * scale * 2)` so even icon-only pins never become unclickable.
  3. Added `shouldDrawShape = !pin.hideShape` to `drawPinShape()` to properly hide the shape when requested.
  4. Added selection and marquee highlight rings around images in `drawPinImage()` so selected image cards provide immediate visual feedback.
  5. Verified with new test suite: [`tests/test-image-hit-testing.js`](file:///Users/health/Sites/investigative-board/tests/test-image-hit-testing.js).

### BUG-011: Layout Algorithms Not Centering Canvas on Newly Arranged Pins
- **Root Cause:** When running layout routines (`layoutGrid`, `layoutRadial`, `layoutForce`, `layoutClusters`, `layoutTimeline`), the algorithms computed coordinates relative to a virtual canvas center or cluster average, but never adjusted `appState.offsetX`, `appState.offsetY`, or `appState.scale`. If the board was panned away or the layout expanded beyond the current view, pins would rearrange partially or completely off-screen, requiring manual panning.
- **Fix:**
  1. Implemented [`Application.centerViewOnPins(padding = 120)`](file:///Users/health/Sites/investigative-board/js/core/app.js) which calculates the full bounding box `[minX, maxX, minY, maxY]` of all pins (including widths, heights, and image dimensions), finds the centroid, calculates the optimal zoom scale (`[0.3, 1.0]`), and smoothly centers `offsetX` and `offsetY` on the screen.
  2. Anchored all layout algorithms around the existing pin centroid and invoked `this.centerViewOnPins()` before triggering `render()` and saving undo history.
  3. Verified with [`tests/test-layout-dock.js`](file:///Users/health/Sites/investigative-board/tests/test-layout-dock.js).

### BUG-012: Area Pins ('circle', 'rectangle') Unable to Connect with Lines
- **Root Cause:**
  1. **Hit-Testing Failure:** `findPinAt` only checked a hardcoded 24px circular hit radius for all non-text pins, completely ignoring area dimensions (`radius` for `area:circle`, `width`/`height` for `area:square`). Clicking anywhere inside an area pin (or right-clicking to open the connection menu) returned `null`.
  2. **Connection Skipped During Creation:** When creating an area pin while a connection source was active (`connectStartIndex !== null`), `eventHandlers.js` line 1317 hijacked single-click area creations to create standard pins, while drag creations created the area pin but never called `addConnection(connectStartIndex, newIndex)`.
  3. **Sequential Connection Uninitialized:** Newly created area pins never set `connectStartIndex = newIndex` in sequential mode, preventing subsequent click-to-connect interactions.
  4. **AreaTool Event Dropping:** `AreaTool.onMouseDown` discarded clicks on existing pins with an error log rather than handling selection and connection dispatch.
- **Fix:**
  1. Updated [`Application.findPinAt`](file:///Users/health/Sites/investigative-board/js/core/app.js) with two-pass hit-testing: Pass 1 tests non-area pins (so contained child pins receive priority), and Pass 2 tests area circles (using `radius`) and area rectangles (using `width`/`height`).
  2. Updated [`EventHandlers.handleCanvasMouseUp`](file:///Users/health/Sites/investigative-board/js/events/eventHandlers.js) so area tool actions are guarded with `!this.isDraggingArea`, and area creation automatically calls `addConnection(connectStartIndex, newIndex)` when a connection is active.
  3. Initialized `connectStartIndex = newIndex` and `connectionMode = 'sequential'` on newly placed area pins.
  4. Updated `AreaTool.onMouseDown` to delegate to `PinTool.handlePinInteraction` when an existing pin is clicked.
  5. Verified with new test suite: [`tests/test-area-connection.js`](file:///Users/health/Sites/investigative-board/tests/test-area-connection.js).

### BUG-013: Changing Layout Erasing Pins
- **Root Causes:**
  1. **Timeline Layout NaN coordinates:** In [`layoutTimeline()`](file:///Users/health/Sites/investigative-board/js/core/app.js), `this.deps.parseDate(tp.dateStr)` returns an object `{ dateObj, dateStr, timestamp }`. The code assigned `tp.timestamp = this.deps.parseDate(...)` directly, resulting in object operands during subtraction (`object - object = NaN`). This set `pin.x` and `pin.y` to `NaN`, permanently erasing pins and making all future canvas transforms degenerate (`translate(NaN, NaN)`).
  2. **Camera Viewport Misalignment:** `centerViewOnPins()` calculated viewport size from `this.canvas.height` instead of visible container geometry (`#canvas-container.clientHeight`). When canvas buffer height had been resized larger than the viewport, `canvasHeight / 2` placed pin centroids below the visible screen.
  3. **Premature Viewport Culling of Area Pins:** `drawPins()` computed `boundRadius` using only `pin.width`. For area circles, `pin.width` was `undefined`, defaulting radius to 60. When large area circles had centers slightly outside the window, their borders were prematurely culled.
  4. **Missing Finite Guards:** Layout centroid calculations (`currentCenterX`, `currentCenterY`) did not defend against non-numeric coordinates, allowing any non-finite pin property to corrupt all pins.
- **Fix:**
  1. In `layoutTimeline()`, safely unwrap `parsed.timestamp || Date.parse(dateStr) || Date.now()`, ensuring numeric timestamps.
  2. In `centerViewOnPins()`, query `#canvas-container` client dimensions and guard with `Number.isFinite(...)` checks before writing camera scale and offsets.
  3. In `drawPins()`, expand `boundRadius` calculation to inspect `radius`, `areaSize`, `width`, `height`, and `image.size`.
  4. In all 5 layout routines, added finite coordinate checks, called `appState.saveHistory()` for full undoability, and invoked `this.draw()` and `this.render()`.
  5. Verified with new test suite: [`tests/test-layout-erasing-fix.js`](file:///Users/health/Sites/investigative-board/tests/test-layout-erasing-fix.js).

### BUG-014: Viewport Mis-Centering and Radial Layout Root Offset
- **Root Causes:**
  1. **Canvas DOM Height Inflation:** In `resizeCanvas()`, `minCanvasHeight = contentBounds.bottom * scale + 100` dynamically grew `canvas.height` and forced `container.style.height = this.canvas.height + 'px'`. This inflated `container.clientHeight` (e.g., from 600px to 1400px), causing `centerViewOnPins()` to calculate `viewHeight / 2` based on an invisible, oversized buffer rather than the active browser viewport between the 50px top header and 140px bottom tray.
  2. **`Math.max` NaN Poisoning:** In `centerViewOnPins()`, pin image sizes formatted as percentages (e.g. `"100%"`) or non-numeric strings produced `NaN` when converted via `Number(pin.image.size)`. This poisoned `Math.max(w, h, ...)` to `NaN`, causing `centerViewOnPins()` to silently abort at the `Number.isFinite(minX)` guard without centering.
  3. **Radial Centering & Starburst Skew:** `layoutRadial()` used to center on the geometric bounding box rather than the radial root pin. For asymmetric connection graphs, this displaced the hub pin off-center.
- **Fix:**
  1. In `resizeCanvas()`, locked canvas buffer height to true viewport height `Math.max(300, window.innerHeight - menuHeight - trayHeight)` and reset `container.style.height = ''`.
  2. In `centerViewOnPins(padding = 100, targetCenter = null)`, added optional `targetCenter` anchor. When provided, symmetric extents around `targetCenter` are used so the focal pin sits dead-center on screen. Safe-parsed `parseFloat(pin.image?.size) || 0`.
  3. Implemented `LayoutEngine.applyRadialLayout(pins, connections, rootIndex, options)` which locks root pin at `centerX, centerY`, places rings at 200px / 360px radii, snaps all pins to the master 40px grid, and returns `{ x: centerX, y: centerY }`.
  4. Verified in [`tests/test-canvas-grid-layout.js`](file:///Users/health/Sites/investigative-board/tests/test-canvas-grid-layout.js) and [`tests/test-layout-dock.js`](file:///Users/health/Sites/investigative-board/tests/test-layout-dock.js).

---

## 4. Verification & Health History

| Timestamp | Event | Results | Environment |
| :--- | :--- | :--- | :--- |
| **2026-11-01 18:30** | Branch Merge Audit | Identified 7 merge collisions across `state.js` and `app.js` | macOS / Node v20.19.6 |
| **2026-11-01 18:45** | Theme & Drawing Patch | Fixed `BUG-001`, `BUG-002`, `BUG-003` | macOS / Node v20.19.6 |
| **2026-11-01 19:00** | Connection & Storage Patch | Fixed `BUG-004`, `BUG-005`, `BUG-006`, added `test-pin-connection-integrity.js` | macOS / Node v20.19.6 |
| **2026-11-01 19:15** | Viewport Culling & MCP Server | Added `syncBridge.js`, `cli/mcp-server.js`, 25/25 suites passing | macOS / Node v20.19.6 |
| **2026-11-02 13:58** | Pin Modal & Hit-Testing Patch | Fixed `BUG-009` (pencil edit) & `BUG-010` (image hit testing) | macOS / Node v20.19.6 |
| **2026-11-02 14:40** | Layout Dock & Viewport Centering | Added ArtCraft Layout Dock, fixed `BUG-011` camera centering | macOS / Node v20.19.6 |
| **2026-11-02 17:30** | Area Pin Connection Fix | Fixed `BUG-012` area hit-testing and line creation | macOS / Node v20.19.6 |
| **2026-11-02 18:10** | Layout Erasing & Viewport Fix | Fixed `BUG-013` timeline timestamps, camera viewport, area culling | macOS / Node v20.19.6 |
| **2026-11-02 18:12** | Full Regression Suite Run | **31/31 suites passed, 0 failures** | macOS / Node v20.19.6 |
| **2026-11-02 19:05** | L-SDF Project Structure | Added Latent-Structured Documentation Format indexes (`INDEX.lsdf`, `INDEX.detail.lsdf`, subsystem maps) | macOS / Node v20.19.6 |
| **2026-11-02 21:00** | Master Grid & Centering Verification | Fixed `BUG-014` (viewport height inflation & radial root centering), **32/32 suites passed, 0 failures** | macOS / Node v20.19.6 |

---

## 5. Ongoing Monitoring & Checklist

- [x] All 32 automated regression tests pass in CI/local runner (`node tests/run-all.js`).
- [x] Zero duplicate global declarations in any module (`test-no-duplicate-declarations.js`).
- [x] Theme system completely non-destructive on initialization.
- [x] Pin removal preserves connection graph topology.
- [x] Model Context Protocol server verifies against JSON-RPC 2.0 specs.
- [x] Real-time bi-directional synchronization bridge active for CLI and GUI pairing.
- [x] Full bounding box hit-testing and image selection enabled.
- [x] Layout organization (Grid, Radial, Force, Clusters, Timeline) preserves all pins and centers viewport reliably.
- [x] Layout Dock algorithms auto-center viewport and fit all pins cleanly.
- [x] Area pins ('circle', 'rectangle') fully hit-testable and connectable via drag, click, shift+click, and radial menu.
- [x] Master 40px grid with count-based aspect alignment and drag-release snapping active.
- [x] Radial and Grid layouts center exactly within active viewport between 50px top header and 140px bottom tray.
- [x] Latent-Structured Documentation Format (L-SDF) active across root, core, events, ui, and test suites.
