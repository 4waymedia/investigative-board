# API & Agent Specification

This specification defines the developer and autonomous agent interfaces for **Investigative Board / BoardCraft**, including the **Model Context Protocol (MCP)** server, the command-line interface (**CLI**), and the real-time **Sync Bridge HTTP/SSE API**.

---

## 1. Overview & Agent Integration Philosophy

BoardCraft implements the **ArtCraft Agent Standard**:
- **Zero-Friction Stdio**: MCP servers communicate over standard input/output (`stdio`) using JSON-RPC 2.0, allowing native attachment by any modern agent runtime (Claude Desktop, Antigravity, Cursor, Gemini, OpenAI Swarm).
- **Filesystem Determinism**: Board state is persisted in deterministic, human-readable JSON files in `data/boards/`.
- **Live Visual Feedback**: Agent modifications in the background immediately emit events over a Server-Sent Events (SSE) bridge, updating any open browser or desktop canvas without manual page refreshes.

---

## 2. Model Context Protocol (MCP) Server

- **Server Entrypoint:** [`cli/mcp-server.js`](file:///Users/health/Sites/investigative-board/cli/mcp-server.js)
- **Transport:** `stdio` (newline-delimited JSON-RPC 2.0)
- **Protocol Version:** `2024-11-05`

### 2.1 Server Capabilities

```json
{
  "capabilities": {
    "tools": {},
    "resources": {}
  },
  "serverInfo": {
    "name": "boardcraft-mcp-server",
    "version": "1.0.0"
  }
}
```

### 2.2 Tools Reference

#### `list_boards`
List all boards stored on disk.
- **Inputs:** None
- **Returns:** Array of board summaries:
  ```json
  [
    {
      "id": "main",
      "name": "Primary Investigation",
      "description": "Main case board",
      "updatedAt": "2026-11-01T19:00:00.000Z",
      "pinCount": 12,
      "connectionCount": 8
    }
  ]
  ```

#### `create_board`
Create a new board.
- **Inputs:**
  - `id` *(optional, string)*: Unique slug identifier. Auto-generated if omitted.
  - `name` *(required, string)*: Human-readable board name.
  - `description` *(optional, string)*: Context or purpose.
  - `themeId` *(optional, string)*: `"dark"`, `"light"`, `"sepia"`, `"nord"`, or `"midnight"`. Default: `"dark"`.

#### `get_board`
Fetch the complete data of a specific board.
- **Inputs:**
  - `boardId` *(required, string)*: Board identifier.
- **Returns:** Complete board document (metadata, pins, connections, settings).

#### `delete_board`
Permanently delete a board and its files from storage.
- **Inputs:**
  - `boardId` *(required, string)*: Board identifier.

#### `add_pin`
Add a single pin or card to a board.
- **Inputs:**
  - `boardId` *(required, string)*: Target board.
  - `text` *(required, string)*: Label or markdown note.
  - `x` *(optional, number)*: World X coordinate (defaults to centroid).
  - `y` *(optional, number)*: World Y coordinate (defaults to centroid).
  - `color` *(optional, string)*: Hex code (e.g. `"#e74c3c"`).
  - `shape` *(optional, string)*: `"pin"`, `"circle"`, `"square"`, or `"text"`.
  - `fontSize` *(optional, number)*: Default `16`.
- **Returns:** Created pin object including assigned index.

#### `update_pin`
Update properties of an existing pin.
- **Inputs:**
  - `boardId` *(required, string)*
  - `pinIndex` *(required, integer)*: 0-based index of the pin.
  - `text` *(optional, string)*
  - `x` *(optional, number)*
  - `y` *(optional, number)*
  - `color` *(optional, string)*
  - `shape` *(optional, string)*
  - `fontSize` *(optional, number)*

#### `delete_pin`
Delete a pin and automatically prune all referencing connections without corrupting index topology.
- **Inputs:**
  - `boardId` *(required, string)*
  - `pinIndex` *(required, integer)*

#### `batch_add_pins`
Batch-insert multiple pins atomically.
- **Inputs:**
  - `boardId` *(required, string)*
  - `pins` *(required, array of pin objects)*: Array of `{ text, x, y, color, shape, fontSize }`.

#### `connect_pins`
Create a visual thread/connection between two pins.
- **Inputs:**
  - `boardId` *(required, string)*
  - `fromIndex` *(required, integer)*: Starting pin index.
  - `toIndex` *(required, integer)*: Ending pin index.
  - `color` *(optional, string)*: Line color. Default `"#e74c3c"`.
  - `label` *(optional, string)*: Relationship note.

#### `delete_connection`
Remove a connection line.
- **Inputs:**
  - `boardId` *(required, string)*
  - `fromIndex` *(required, integer)*
  - `toIndex` *(required, integer)*

#### `auto_layout`
Automatically re-arrange pins in a clean grid, circle, or radial cluster.
- **Inputs:**
  - `boardId` *(required, string)*
  - `layoutType` *(required, string)*: `"grid"` or `"circle"`.
  - `spacing` *(optional, number)*: Spacing in pixels. Default `200`.

#### `search_board`
Search text across all pins and connections on a board.
- **Inputs:**
  - `boardId` *(required, string)*
  - `query` *(required, string)*: Search substring (case-insensitive).
- **Returns:** Matching pins and connected relationship pairs.

#### `set_theme`
Change the theme of a board.
- **Inputs:**
  - `boardId` *(required, string)*
  - `themeId` *(required, string)*: `"dark"`, `"light"`, `"sepia"`, `"nord"`, `"midnight"`.

---

### 2.3 Resources

The MCP server exposes boards as readable resources:
- **URI Template:** `board://{id}`
- **MIME Type:** `application/json`
- **Example Read:**
  ```json
  {
    "method": "resources/read",
    "params": { "uri": "board://main" }
  }
  ```

---

## 3. Command Line Interface (CLI)

The CLI binary is executable directly via Node:
```bash
node cli/index.js [command] [options]
```

### 3.1 Subcommand Reference

| Command | Usage & Arguments | Description |
| :--- | :--- | :--- |
| `list` | `list` | List all boards with counts |
| `show` | `show <boardId>` | Output board details in formatted JSON |
| `create` | `create <name> [description]` | Create a new board document |
| `delete` | `delete <boardId>` | Delete a board |
| `add-pin` | `add-pin <text> --board <id> [-x <num>] [-y <num>] [--color <hex>] [--shape <shape>]` | Add a pin to the board |
| `update-pin` | `update-pin <index> --board <id> [--text <text>] [-x <num>] [-y <num>]` | Update an existing pin |
| `delete-pin` | `delete-pin <index> --board <id>` | Delete pin and prune connections |
| `connect` | `connect <fromIndex> <toIndex> --board <id> [--color <hex>]` | Connect two pins |
| `delete-conn`| `delete-conn <fromIndex> <toIndex> --board <id>` | Remove connection |
| `layout` | `layout <type> --board <id> [--spacing <px>]` | Auto-layout pins (`grid`/`circle`) |
| `search` | `search <query> --board <id>` | Search text in board elements |
| `export` | `export <boardId> [outPath]` | Export board JSON |
| `import` | `import <filePath> [name]` | Import external JSON file |
| `mcp` | `mcp` | Launch MCP JSON-RPC stdio server |
| `serve` | `serve [--port <num>]` | Launch web server with live SSE bridge |

---

## 4. Live Synchronization Bridge & HTTP API

When `node cli/index.js serve` (or `node cli/server.js`) is running (default port `8080`), it exposes both a static web server and an agent event bridge.

### 4.1 HTTP REST Endpoints

- `GET /api/boards`: Returns JSON index of all boards.
- `GET /api/boards/:id`: Returns full JSON data of board `:id`.
- `POST /api/boards`: Creates or overwrites a board document. Body: Full board JSON.
- `POST /api/events`: Broadcasts an action event to all connected browser clients.
  - Body:
    ```json
    {
      "type": "board_updated",
      "boardId": "main",
      "action": "add_pin",
      "payload": { ... }
    }
    ```

### 4.2 Server-Sent Events (SSE) Stream

- **Endpoint:** `GET /api/events`
- **Headers:**
  ```http
  Content-Type: text/event-stream
  Cache-Control: no-cache
  Connection: keep-alive
  ```
- **Client Implementation:** Handled automatically in the browser by [`js/core/syncBridge.js`](file:///Users/health/Sites/investigative-board/js/core/syncBridge.js). When an agent adds or shifts a pin via CLI or MCP, the browser canvas smoothly re-renders the updated state in real time.

---

## 5. Storage Schema Reference

Board JSON files in `data/boards/<id>.json` adhere to the following schema:

```json
{
  "id": "main",
  "name": "Investigation Alpha",
  "description": "Suspect graph and timeline",
  "version": "1.0.0",
  "createdAt": "2026-11-01T18:00:00.000Z",
  "updatedAt": "2026-11-01T19:15:00.000Z",
  "theme": "dark",
  "viewport": {
    "cameraOffset": { "x": 0, "y": 0 },
    "zoom": 1.0
  },
  "pins": [
    {
      "text": "Suspect A",
      "x": 250,
      "y": 180,
      "color": "#e74c3c",
      "colorSlot": 0,
      "shape": "pin",
      "fontSize": 16,
      "width": 120,
      "height": 40
    }
  ],
  "connections": [
    {
      "from": 0,
      "to": 1,
      "color": "#e74c3c",
      "label": "Phone record match"
    }
  ]
}
```
