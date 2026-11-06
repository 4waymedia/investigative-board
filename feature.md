# Investigative Board (BoardCraft) - Feature Catalog

This document provides a comprehensive catalog of all implemented features, user capabilities, and architectural components of **Investigative Board (BoardCraft)**.

---

## 1. Infinite Canvas & Spatial Engine
* **High-Performance 2D Canvas**: HTML5 Canvas rendering engine with viewport culling, rendering hundreds of nodes and connections at locked 60+ FPS.
* **Master 40px Grid**: Universal spatial alignment grid with aspect-ratio snapping, magnetic lock during drag-and-drop, and clean visual grid markers.
* **Pan & Zoom**: Smooth infinite navigation with mouse wheel, trackpad pinch, middle-click pan, and spacebar-drag ergonomics.
* **Zero Runtime npm Dependencies**: Pure local execution using standard Web APIs and native Node.js libraries.

---

## 2. Pins & Node Entity System
* **Optimized `Pin` Class ([`js/core/pin.js`](file:///Users/health/Sites/investigative-board/js/core/pin.js))**:
  * Unified domain model with bidirectional property aliasing (`label` / `title`, `customFields` / `metadata`).
  * Shape-aware bounding box calculations and high-speed point-in-polygon hit-testing.
* **Specialized Archetypes**:
  * **Entity / Suspect**: Person avatar nodes with badges and threat-level metadata.
  * **Physical Evidence**: Forensic diamonds with chain-of-custody tracking.
  * **Hypothesis & Speech Bubbles**: Thought clouds and comic dialogue bubbles with text reflow and inset media.
  * **Document / Dossier**: Rectangular subpoenaed records, wire transcripts, and financial files.
  * **Timeline Event**: Timestamped pill nodes for corroborated alibis and incident logs.
  * **Perimeter Area**: Circular and rectangular cordon zones with containment radii.
* **Investigative Corner Badges (`drawPinBadge`)**:
  * Uppercase stamped chips (`[SUSPECT]`, `[EVIDENCE]`, `[ALIBI]`, `[DOSSIER]`, `[THEORY]`, `[PERIMETER]`) with translucent dark backgrounds and borders matching pin accent colors.
* **Inset Media & Image Pipeline**:
  * **Inset Layer Mode**: Places uploaded photos (circular headshots, ovals, portraits) directly **inside** speech and thought bubbles, reflowing description text below the image.
  * **Behind Layer Mode**: Places images underneath the shape for ambient backdrop, gradient glow, or drop-shadow effects.

---

## 3. Connectors & Thread Lines
* **Smart Line Jumps (Bridge Arcs)**:
  * Detects intersecting straight connection lines and dynamically renders semi-circular $R=8\text{px}$ bridge arcs over crossing threads.
  * Pre-computed Axis-Aligned Bounding Box (AABB) scalar comparisons achieve a **4.97x speedup**, processing 500 connections in 1.31 ms.
* **Connection Labels**:
  * Interactive rounded pill chips displaying semantic relationship labels (e.g., `"Seen with"`, `"Funded by"`, `"Alibi for"`).
  * Hover highlight effects and cached collision bounds.
  * **Double-Click Editing**: Double-clicking any connection label opens the connection modal or edit prompt directly.
* **Curved vs. Straight Threads**: Full support for straight forensic strings or natural bezier curves with color slot binding.

---

## 4. Data-Flow Charting & System Architecture Engine
* **ByteByteGo-Style Architecture Diagrams**:
  * Full support for professional system architecture diagrams, data pipelines, and distributed systems infographics.
* **Orthogonal Manhattan Elbow Routing**:
  * Automatic horizontal-horizontal, vertical-vertical, and L-turn elbow calculations.
  * Rounded corner arcs ($R=6\text{px}-8\text{px}$) rendered via HTML5 canvas `arcTo` at intermediate bends.
  * Seamless integration with hop-over bridge arcs across intersecting flow paths.
* **4-Way Perimeter Port Docking**:
  * Pins provide perimeter docking coordinates via `pin.getPort("north" | "south" | "east" | "west" | "center")`.
  * Automatic quadrant direction resolution via `pin.getAutoPort(target, role)` dynamically docking exit and entry ports to face connected components.
* **Directional Arrowheads**:
  * Precision arrowheads supporting `target` (forward), `source` (backward), `both` (bidirectional), and `none` modes.
  * Automatic endpoint tangent angle alignment across orthogonal waypoints, curved beziers, and straight lines.
* **Line Badges & Annotations**:
  * **Step Sequence Badges** (`connection.step`): Circular high-contrast sequence numbers (e.g. ❶, ❷, 1, 2, 3) placed along the path.
  * **Rate Multipliers** (`connection.multiplier`): Vibrant chip badges (e.g. `× 8`, `× 1.5`, `12 GB`) indicating amplification, batching, or memory/disk ratios.
  * **Dashed Flow Lines**: Solid or dashed (`[6, 4]`) line styles for async event streams, background replays, or crash checkpoints.
* **Specialized Architecture Stencils & Shapes**:
  * **Service (`flow:service`)**: Process and microservice component cards with header bars and 4-way docking anchor indicators.
  * **Database (`flow:database`)**: Cylinder storage shape with elliptical disc caps and horizontal partition bands.
  * **Write-Ahead Log (`flow:queue`)**: Append-only log and message queue with partitioned slot cells `[ ][ ][ ][ ]`.
  * **Scope Container / Swimlane (`flow:container`)**: Dashed boundary container with rounded corners and uppercase header pill (`"ON THE WRITE PATH"`, `"LATER, IN THE BACKGROUND"`).
  * **Status Callout (`flow:callout`)**: Status verification chip with circular icon indicator (`✓ Client Acked`).

---

## 4. Stencil Palette & Clue Presets ([`js/ui/stencilDock.js`](file:///Users/health/Sites/investigative-board/js/ui/stencilDock.js))
* **OmniGraffle-Inspired Stencil Dock**: Bottom dock palette providing ready-to-stamp investigative archetypes.
* **8 Built-in Presets**: Suspect, Evidence, Crime Scene, Document, Timeline Event, Syndicate, Hypothesis, and Search Zone.
* **Drag-and-Drop & Click-to-Stamp**:
  * Drag any stencil directly from the dock onto canvas coordinates.
  * Single-click any card in the dock to stamp at the viewport center or next to the active selection with 40px grid snapping.
* **Keyboard Shortcut**: <kbd>Shift</kbd>+<kbd>S</kbd> to instantly toggle the stencil dock.
* **Extensible & AI-Ready**: Supports custom stencils generated dynamically by AI agents or users, persisted locally and synchronized over SSE.

---

## 5. Branching & Node Growth ([`js/core/branchManager.js`](file:///Users/health/Sites/investigative-board/js/core/branchManager.js))
* **Hold-to-Branch Interaction**: Hold a pin for 900ms to display a radial progress charge ring, revealing an edge `+` branching handle.
* **45° Radial Angular Snapping**: Magnetic snapping to 8 compass directions ($0^\circ, 45^\circ, 90^\circ, \dots, 315^\circ$) aligned to the 40px master grid.
* **Opposite Branch Distance Symmetry**: Automatically detects opposite connected pins and locks symmetrical branch distances for tidy mind-map trees.
* **Instant Drag Ergonomics**: Normal pin clicks and drags start immediately without hold suppression.

---

## 6. Theme & Color System ([`js/core/schema.js`](file:///Users/health/Sites/investigative-board/js/core/schema.js))
* **Semantic 8-Slot Color Roles**:
  * `c1`: Suspect / Critical (Red)
  * `c2`: Lead / Primary (Blue)
  * `c3`: Safe / Corroborated (Green)
  * `c4`: Scene / Warning (Yellow)
  * `c5`: Syndicate / Organization (Purple)
  * `c6`: Hazard / Urgent (Orange)
  * `c7`: Forensic / Trace (Pink)
  * `c8`: Intel / Digital (Cyan)
* **Studio Themes**: Studio Dark, Gallery Light, Deep Midnight, and Vintage Sepia Dossier.
* **Non-Destructive Swapping**: Switching themes preserves pin color slot assignments and updates canvas backgrounds, grid contrast, and UI chroming.

---

## 7. Layout Dock & Auto-Centering
* **Algorithmic Layouts**:
  * **Grid**: Tidy matrix rows and columns.
  * **Radial**: Circular relationship wheel centered on target coordinates.
  * **Timeline**: Chronological chronological axis sorting timestamped pins.
* **Camera Viewport Auto-Centering**: Automatically recalculates bounding boxes and centers the canvas camera without pushing pins off-screen.
* **History Snapshots**: Full undo/redo integration for all layout executions.

---

## 8. Multi-Board Storage & CLI
* **Deterministic Filesystem Storage**: Boards saved as clean JSON in `data/boards/<id>.json`.
* **Board Index**: Central catalog in `data/boards/index.json` tracking titles, descriptions, and modification timestamps.
* **Import / Export**: Full JSON board export and import capability.
* **CLI Tooling (`cli/index.js`)**: Standalone terminal interface to list, create, search, and export boards.

---

## 9. Real-Time Sync Bridge & Local Server ([`cli/server.js`](file:///Users/health/Sites/investigative-board/cli/server.js))
* **Server-Sent Events (SSE)**: Live event feed on `/api/events` broadcasting canvas updates, board creation, and stencil generation.
* **Zero-Refresh Collaboration**: Background modifications made by AI agents or CLI commands immediately update any active browser tab.
* **REST API**: Clean HTTP endpoints for boards, pins, connections, stencils, themes, and shapes.
