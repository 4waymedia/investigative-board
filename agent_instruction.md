# Agent Instructions & ArtCraft Automation Manual

This document provides complete instructions for autonomous AI agents (Claude, Gemini, Antigravity, Cursor, OpenAI Swarm) interacting with, extending, or automating **Investigative Board (BoardCraft)**.

---

## 1. The ArtCraft Agent Standard

BoardCraft adheres to the **ArtCraft Agent Philosophy**:
1. **Local-First & Filesystem Determinism**: All boards, custom stencils, themes, and shapes live as plain JSON in `data/boards/`. Agents can inspect or write files directly or use protocol tools.
2. **Zero-Friction Stdio**: The Model Context Protocol (MCP) server operates over standard input/output (`stdio`) using JSON-RPC 2.0. Any modern agent runtime can attach natively without socket configuration.
3. **Live Visual Feedback**: Whenever an agent modifies a board or creates a stencil via MCP, the change immediately broadcasts over the Server-Sent Events (SSE) bridge on `/api/events`, updating the user's browser in real time without page reloads.
4. **Zero Runtime npm Dependencies**: Do not introduce external npm dependencies to the runtime. All features must rely on standard Web APIs and Node.js built-ins.

---

## 2. Model Context Protocol (MCP) Server

* **Entrypoint:** [`cli/mcp-server.js`](file:///Users/health/Sites/investigative-board/cli/mcp-server.js)
* **Start Command:** `node cli/mcp-server.js` (or `node cli/index.js mcp`)
* **Transport:** `stdio` (Newline-delimited JSON-RPC 2.0)
* **Protocol Version:** `2024-11-05`

### 2.1 Complete MCP Tools Reference (22 Tools)

#### Board Operations
* **`board_list`**: List all boards with IDs, titles, descriptions, and modification timestamps.
* **`board_get`**: Fetch the complete JSON document of a board (pins, connections, theme, view).
  * Inputs: `boardId` (string, required)
* **`board_create`**: Create a new investigation board.
  * Inputs: `title` (string, required), `description` (string, optional), `themeId` (string, optional)
* **`board_delete`**: Delete a board by ID.
  * Inputs: `boardId` (string, required)
* **`board_search`**: Search pins and connections on a board for keywords.
  * Inputs: `boardId` (string, required), `query` (string, required)
* **`board_export`**: Export a board as formatted JSON or to a file path.
  * Inputs: `boardId` (string, required), `outputPath` (string, optional)
* **`board_import`**: Import a board from a local JSON file path.
  * Inputs: `filePath` (string, required)
* **`layout_apply`**: Algorithmic pin arrangement.
  * Inputs: `boardId` (string, required), `type` (`"grid"` | `"circle"` | `"timeline"`, required)

#### Pin & Clue Node Operations
* **`pin_add`**: Add a pin, card, or container to a board.
  * Inputs: `boardId` (string, required), `x` (number, required), `y` (number, required), `label` (string, required), `description` (string, optional), `color` (hex string, optional), `shape` (string, optional), `date` (string, optional)
* **`pin_update`**: Update properties of an existing pin.
  * Inputs: `boardId` (string, required), `pinIndexOrId` (string/number, required), `updates` (object, required)
* **`pin_delete`**: Delete a pin and automatically prune all connecting thread lines.
  * Inputs: `boardId` (string, required), `pinIndexOrId` (string/number, required)

#### Connections & String Operations
* **`connection_add`**: Connect two pins with a thread line.
  * Inputs: `boardId` (string, required), `from` (number, required), `to` (number, required), `label` (string, optional), `color` (hex string, optional), `type` (`"straight"` | `"curved"`, optional), `relationship` (string, optional)
* **`connection_delete`**: Delete a connection between pins.
  * Inputs: `boardId` (string, required), `connectionIndex` (number, required)

#### Generative Stencils & Clue Presets (ArtCraft Extension)
* **`stencil_list`**: List all built-in and AI-generated stencils with filtering.
  * Inputs: `category` (string, optional), `query` (string, optional)
* **`stencil_create`**: Define a custom reusable investigative stencil preset.
  * Inputs: `title` (string, required), `id` (string, optional), `category` (string, optional), `icon` (string, optional), `badge` (uppercase string, optional), `shape` (string, optional), `color` (hex string, optional), `label` (string, optional), `subtitle` (string, optional), `description` (string, optional), `customFields` (object, optional)
* **`stencil_apply`**: Stamp a stencil preset directly onto canvas coordinates.
  * Inputs: `boardId` (string, required), `stencilId` (string, required), `x` (number, required), `y` (number, required), `label` (string, optional), `description` (string, optional), `color` (hex string, optional)
* **`stencil_delete`**: Delete a custom stencil preset by ID.
  * Inputs: `stencilId` (string, required)

#### Generative Themes & Palettes
* **`theme_list`**: List all available visual themes and color slots.
  * Inputs: None
* **`theme_create`**: Synthesize an ArtCraft-compliant harmonious theme palette.
  * Inputs: `id` (string, required), `name` (string, required), `type` (`"dark"` | `"light"`, optional), `canvas` (object with `background`, `gridColor`), `ui` (object), `colorSlots` (object with `c1`..`c8`)
* **`theme_apply`**: Apply a theme to an investigation board.
  * Inputs: `boardId` (string, required), `themeId` (string, required)

#### Procedural Shapes & Vector Icons
* **`shape_list`**: List registered custom canvas shape renderers.
  * Inputs: None
* **`shape_register`**: Register a geometric, procedural, or vector SVG shape into the drawing engine.
  * Inputs: `name` (string, required), `description` (string, optional), `baseShape` (`"circle"` | `"rect"`, optional), `width` (number, optional), `height` (number, optional), `pathData` (SVG path string, optional)

### 2.2 MCP Resources
Agents can read live application state via MCP resources:
* **`board://<boardId>`**: Returns the full JSON document of any board.
* **`stencils://all`**: Returns the complete catalog of active stencils.
* **`themes://all`**: Returns all registered studio color palettes.

---

## 3. Command Line Interface (CLI)

Agents executing shell commands can use [`cli/index.js`](file:///Users/health/Sites/investigative-board/cli/index.js):

```bash
# List all boards
node cli/index.js list

# Create a new board
node cli/index.js create "Case File #104" -d "Homicide investigation" -t dark

# Search board for keywords
node cli/index.js search <board-id> "suspect"

# Start the local server with real-time SSE bridge
node cli/index.js serve 3000

# Start MCP stdio server
node cli/index.js mcp
```

---

## 4. REST API & Real-Time Sync Bridge

When [`cli/server.js`](file:///Users/health/Sites/investigative-board/cli/server.js) is active:
* **`GET /api/events`**: Server-Sent Events (SSE) feed emitting `connected`, `board-updated`, `stencil-created`, `theme-applied`, and `shape-registered`.
* **`GET /api/stencils`** & **`POST /api/stencils`**: Stencil CRUD.
* **`POST /api/boards/:id/stencils/apply`**: Stamp a stencil via HTTP.
* **`GET /api/themes`** & **`POST /api/themes`**: Theme catalog.
* **`POST /api/boards/:id/theme`**: Apply a theme to a board.
* **`GET /api/shapes`** & **`POST /api/shapes`**: Custom shape registration.

---

## 5. Agent Development & Contribution Rules

When implementing code changes or optimizing existing modules:
1. **Preserve Documentation Integrity**: Do not delete existing comments, docstrings, or test assertions unrelated to your task.
2. **Run All Tests Before Declaring Done**: Execute `node tests/run-all.js`. All 37+ test suites must pass.
3. **Record Empirical Benchmarks**: Whenever auditing or refactoring performance, maintain a Before / Try / Try / After log in [`docs/BENCHMARKS.md`](file:///Users/health/Sites/investigative-board/docs/BENCHMARKS.md).
4. **Use Clickable Links**: Format file paths and symbols with clickable markdown links (`[pin.js](file:///path/to/pin.js)`).
5. **Honor Sandbox Boundaries**: Run file reads, AST transformations, tests, and non-mutating shell commands inside the secure sandbox; only elevate commands (`BypassSandbox: true`) when performing `.git/` commits or network operations that require explicit approval.
