# Investigative Board — CLI & MCP Server

A local-first CLI and Model Context Protocol (MCP) server for **Investigative Board**, enabling AI agents (Claude, Gemini, Antigravity, Cursor, etc.) and terminal users to programmatically inspect, create, query, and manipulate visual investigation boards.

---

## Quick Start

### 1. Command Line Interface (CLI)
Make the binary executable or run directly with Node:

```bash
# List all boards
node cli/index.js list

# Create a new investigation board
node cli/index.js create "Operation Mercury" --desc "Classified case file" --theme "dark"

# Add a pin / clue
node cli/index.js add-pin <boardId> --x 250 --y 200 --label "Suspect Alpha" --desc "Spotted at terminal" --color "#f85149"

# Connect two pins
node cli/index.js connect <boardId> --from 0 --to 1 --label "Transferred funds" --type curved

# Search board for clues
node cli/index.js search <boardId> "terminal"

# Show board state
node cli/index.js show <boardId>

# Auto-arrange pins (grid, circle, timeline)
node cli/index.js layout <boardId> timeline
```

---

## 2. MCP Server (AI Agent Integration)

The MCP server implements the official **Model Context Protocol (JSON-RPC 2.0)** over standard I/O (stdio).

### Connecting to Claude Desktop / Cursor / Antigravity

Add the server to your MCP client config (e.g., `claude_desktop_config.json` or your agent settings):

```json
{
  "mcpServers": {
    "investigative-board": {
      "command": "node",
      "args": ["/Users/health/Sites/investigative-board/cli/mcp-server.js"]
    }
  }
}
```

### Registered Agent Tools:
| Tool | Description |
| :--- | :--- |
| `board_list` | Lists all boards with metadata, counts, and active status |
| `board_get` | Retrieves complete board data including pins, connections, and view state |
| `board_create` | Creates a new board (`title`, `description`, `themeId`) |
| `board_delete` | Deletes a board by ID |
| `board_export` | Exports board to JSON |
| `board_import` | Imports board from JSON file path |
| `board_search` | Full-text search across labels, descriptions, and notes |
| `pin_add` | Adds a pin, card, or text bubble (`x`, `y`, `label`, `description`, `color`, `shape`, `date`) |
| `pin_update` | Updates pin coordinates, labels, or appearance |
| `pin_delete` | Deletes a pin and automatically cleans & re-indexes connected thread lines |
| `connection_add` | Connects two pins (`from`, `to`, `label`, `color`, `type`, `relationship`) |
| `connection_delete` | Deletes a connection line |
| `layout_apply` | Auto-arranges pins using `grid`, `circle`, or `timeline` layouts |

---

## 3. Live Sync Web Server

Run the built-in server to view boards in the browser while agents modify them in real time:

```bash
node cli/server.js 3000
```

1. Open `http://localhost:3000` in your browser.
2. When an AI Agent or CLI adds or updates pins, the browser canvas automatically receives the event via Server-Sent Events (`/api/events`) and re-renders live on screen.
