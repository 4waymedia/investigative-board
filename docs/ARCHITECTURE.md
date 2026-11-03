# Investigative Board — System Architecture

This document defines the architectural design, data models, rendering pipeline, storage engine, and agent automation interface for the **Investigative Board** (aligned with the ArtCraft creative suite as **BoardCraft**).

---

## 1. High-Level System Architecture

The application is structured into five decoupled layers:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        AI Agents & Automation                          │
│     MCP Server (stdio)   │   CLI (ib / boardcraft-cli)   │   SSE Bridge│
└────────────────────────────────────┬───────────────────────────────────┘
                                     │ JSON-RPC / REST
┌────────────────────────────────────▼───────────────────────────────────┐
│                           UI Layer (DOM)                               │
│  Toolbar  │  Tray (Cards)  │  Modals (Pin/Text/Theme)  │  Board Picker │
└────────────────────────────────────┬───────────────────────────────────┘
                                     │ User Input / State Changes
┌────────────────────────────────────▼───────────────────────────────────┐
│                     Application & Event Layer                          │
│      Application (Coordinator)     │      EventHandlers (Canvas)       │
│      DragManager                   │      SelectionAnimator            │
└────────────────────────────────────┬───────────────────────────────────┘
                                     │ State Queries & Mutations
┌────────────────────────────────────▼───────────────────────────────────┐
│                     Domain & State Model                               │
│   AppState (Document & View)       │   ShapeRegistry (drawing.js)      │
│   SchemaManager (Theme & Color)    │   BackgroundBuilder               │
└────────────────────────────────────┬───────────────────────────────────┘
                                     │ Serialization / Deserialization
┌────────────────────────────────────▼───────────────────────────────────┐
│                      Storage & Persistence                             │
│   BoardManager (Web / localStorage)│   BoardStorage (CLI / Node / Disk)│
│   msc-board-index                  │   data/boards/{id}.json           │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Canvas Rendering Pipeline

Rendering is orchestrated by [`Application.draw()`](file:///Users/health/Sites/investigative-board/js/core/app.js) running on an on-demand animation loop via `requestAnimationFrame`. When static, the loop halts to preserve CPU/battery; when interacting (dragging, panning, marquee, pulsing selections), it operates at 60 FPS.

### Coordinate Spaces

* **Screen Space:** Pixel coordinates relative to the canvas element `(0, 0)` at top-left.
* **World Space:** Virtual canvas coordinates independent of pan offset and zoom scale.

Transformation formulas:
$$\text{worldX} = \frac{\text{screenX} - \text{offsetX}}{\text{scale}}$$
$$\text{worldY} = \frac{\text{screenY} - \text{offsetY}}{\text{scale}}$$
$$\text{screenX} = \text{worldX} \times \text{scale} + \text{offsetX}$$
$$\text{screenY} = \text{worldY} \times \text{scale} + \text{offsetY}$$

### Frame Render Order

Each draw cycle executes in strict visual hierarchy:
1. **Background Layer:** CSS-driven layered gradients, solid colors, patterns, and logo overlays rendered by [`BackgroundBuilder`](file:///Users/health/Sites/investigative-board/js/core/backgroundBuilder.js).
2. **World-Space Context:** `ctx.save()`, `ctx.translate(offsetX, offsetY)`, `ctx.scale(scale, scale)`.
   - **Connection Previews:** Active drag line connecting source pin to mouse cursor.
   - **Connections:** All pin-to-pin thread lines with bezier fan-out curvature.
   - **Selected Connection Highlighting:** Animated dashed highlight (marching ants).
   - **Timeline Axis:** Chronological date milestones and marker lines (when timeline mode is active).
   - **Pins & Nodes:** Pin bases, icons, badges, labels, and text bubbles (drawn on top of lines to mask connection endpoints).
   - `ctx.restore()`
3. **Screen-Space Overlays:**
   - Active marquee selection box.
   - Area drag-to-size creation previews.
   - Tail adjustment handles for comic/thought bubbles.
4. **UI Chrome:** Floating pin inspection pill (`#pin-info`), radial context menus, and toolbars.

### Performance Optimizations

* **Viewport Culling:** Before calculating paths, text metrics, or shapes, [`getVisibleWorldBounds()`](file:///Users/health/Sites/investigative-board/js/core/app.js) determines the viewport in world coordinates. Pins and connections outside this boundary are skipped entirely.
* **Sub-Pixel Coordinate Rounding:** Line coordinates are rounded to integer pixels to prevent anti-aliasing blur and flickering during translation.
* **Debounced Persistence:** User micro-interactions trigger state saves without heavy synchronous thumbnail generation. Full PNG thumbnails are only produced during explicit saves, modal launches, or board switches.

---

## 3. Data Models & Schemas

### Pin / Node Schema
```typescript
interface Pin {
  id: string;              // Unique identifier (timestamp + random)
  x: number;               // World coordinate X
  y: number;               // World coordinate Y
  label: string;           // Title or keyword
  description?: string;    // Expanded text or thought bubble text
  note?: string;           // Investigative notes / metadata
  date?: string;           // Date string for chronological timeline layout
  typeId: string;          // e.g. "pin:circle", "card:doc", "area:rect", "text:comic"
  shape: string;           // "circle" | "rect" | "pill" | "diamond" | "bubble" | "thought"
  color: string;           // Hex color (e.g. "#58a6ff")
  colorSlot?: string;      // Theme slot (e.g. "c1", "c2", "c3")
  pinScale?: number;       // Scaling factor (default 1.0)
  width?: number;          // Card / bubble width
  height?: number;         // Card / bubble height
  tailPosition?: {         // Comic/thought bubble tail direction
    angle: number;         // 0 - 360 degrees
    distance: number;      // Distance multiplier
  };
  imageSrc?: string;       // Attached evidence image (data URL or path)
  hideShape?: boolean;     // Whether to hide center icon in area pins
}
```

### Connection Schema
```typescript
interface Connection {
  id: string;              // Unique identifier
  from: number;            // Index into document.pins array
  to: number;              // Index into document.pins array
  label?: string;          // Relationship label (e.g., "Accomplice", "Financial link")
  color: string;           // Thread color
  colorSlot?: string;      // Theme color slot
  type: "curved" | "straight";
  relationship?: string;   // Semantic tag (e.g. "relates-to", "suspect-in")
  confidenceScore?: number;// 0 - 100 (adjusts thread line width)
  validationPercent?: number;// 0 - 100 (controls subtle glow effect)
  useGradient?: boolean;   // Blend line color from start pin color to end pin color
}
```

### Board Document Schema
```typescript
interface BoardDocument {
  id: string;              // UUID
  meta: {
    id: string;
    title: string;
    description: string;
    userId?: string;
    created: string;       // ISO 8601
    lastModified: string;  // ISO 8601
    thumbnail?: string;    // Base64 PNG snapshot
  };
  document: {
    pins: Pin[];
    connections: Connection[];
    cards: Card[];
    textElements: TextElement[];
    areas: Area[];
    currentThemeId: string;
    palette: Array<{ name: string; value: string }>;
    timelineActive: boolean;
    timelinePins: number[];
  };
  view: {
    scale: number;
    offsetX: number;
    offsetY: number;
    isLayoutSimulating: boolean;
  };
  history: Array<{ document: any; view: any }>;
}
```

---

## 4. Theme & Appearance Engine

The theming system is controlled by [`SchemaManager`](file:///Users/health/Sites/investigative-board/js/core/schema.js) and supports:
* **Slot-Based Theming:** Pins and connections can be tagged with color slots (`c1` through `c8`). Changing the board theme seamlessly shifts all slotted elements to match the new palette without manual recoloring.
* **Built-in Palettes:** `dark` (default), `light`, `midnight`, `sepia`, `matrix`, `cyber`, `noir`, `ocean`.
* **BackgroundBuilder:** Multi-layered canvas backgrounds supporting solid colors, linear/radial gradients, grid textures, noise, and animated watermark logos.
* **Dynamic Palette Export/Import:** Themes can be saved, exported, and imported as independent JSON specs.

---

## 5. Storage & Persistence

The persistence layer is dual-homed for Web and Desktop/Agent usage:

1. **Web / Browser (`js/core/boardManager.js`):**
   - Uses `localStorage` split across keys to prevent hitting single-item storage ceilings:
     - `msc-board-index`: Metadata index for all boards and membership limits.
     - `msc-board-{uuid}`: Full document data for individual boards.
   - Includes legacy data migration from single-board formats (`msc-investigativeboard`).
2. **Node / CLI / Agent (`cli/storage.js`):**
   - Direct filesystem storage under `data/boards/`:
     - `index.json`: Global board catalog.
     - `{uuid}.json`: Standalone board documents.
   - Provides identical serialization format as browser storage for seamless bidirectional import/export.

---

## 6. Agent Automation Interface (ArtCraft Standard)

The application implements the **Model Context Protocol (MCP)** specification:
* **Protocol:** JSON-RPC 2.0 over `stdio` (`cli/mcp-server.js`).
* **CLI Wrapper:** `node cli/index.js` (`ib` / `boardcraft-cli`).
* **Live SSE Sync Bridge:** `cli/server.js` running `/api/events`, allowing AI agents to push real-time edits into active browser sessions.
