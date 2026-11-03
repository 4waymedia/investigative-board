# Investigative Board (BoardCraft)

> A high-performance, local-first infinite canvas for visual investigation, node-link diagramming, and autonomous AI agent collaboration. Designed following the [ArtCraft](https://getartcraft.com/apps) desktop ecosystem philosophy.

---

## 🌟 Highlights

- **Infinite 60 FPS Canvas**: Hardware-accelerated HTML5 canvas with viewport culling, smooth zooming, and sub-millisecond response times across thousands of pins.
- **Local-First & Private**: Works completely offline. Boards are stored locally on your filesystem in clean JSON schemas.
- **ArtCraft Agent Integration**:
  - **Model Context Protocol (MCP)**: Native stdio server exposing 13 tools and resource inspection for AI agents.
  - **Full CLI Suite**: Batch create, connect, auto-layout, and query boards from any terminal or script with zero external dependencies.
  - **Live Sync Bridge**: Real-time Server-Sent Events (SSE) bridge that updates the browser canvas live as an AI agent modifies the board in the background.
- **5 Studio Themes**: Dark, Light, Sepia, Nord, and Midnight palettes with high-contrast accessibility.
- **Multi-Board Management**: Create, switch, rename, duplicate, and export investigative boards with auto-generated canvas thumbnails.
- **25/25 Passing Regression Suites**: Verified end-to-end test runner guaranteeing state integrity, connection topology, and DOM safety.

---

## 🚀 Quick Start

### 1. Launch the Visual Canvas
You can open [`index.html`](file:///Users/health/Sites/investigative-board/index.html) directly in any modern browser, or launch the integrated local server with live agent synchronization:

```bash
# Start the local server and live sync bridge (default port: 8080)
node cli/index.js serve

# Or using npm
npm start
```

Visit `http://localhost:8080` in your browser.

---

### 2. Using the CLI
The project includes a pure Node.js command-line interface:

```bash
# List all boards
node cli/index.js list

# Create a new board
node cli/index.js create "Operation Nightfall" "Suspect network and timeline"

# Add pins
node cli/index.js add-pin "Suspect Alpha" --board operation-nightfall -x 300 -y 200 --color "#e74c3c"
node cli/index.js add-pin "Safehouse B" --board operation-nightfall -x 550 -y 320 --color "#3498db"

# Connect the two pins with red string
node cli/index.js connect 0 1 --board operation-nightfall --color "#e74c3c"

# Automatically arrange pins in a neat circle
node cli/index.js layout circle --board operation-nightfall

# Search board elements
node cli/index.js search "Alpha" --board operation-nightfall
```

---

### 3. Connecting AI Agents via MCP

BoardCraft implements the official Model Context Protocol (MCP) JSON-RPC 2.0 stdio server. To attach it to an agent runtime (e.g. Claude Desktop, Antigravity, or Cursor), add the following entry to your MCP configuration file:

```json
{
  "mcpServers": {
    "boardcraft": {
      "command": "node",
      "args": ["/Users/health/Sites/investigative-board/cli/mcp-server.js"]
    }
  }
}
```

The agent will instantly gain access to 13 spatial canvas tools (`create_board`, `add_pin`, `batch_add_pins`, `connect_pins`, `auto_layout`, `search_board`, etc.) and the `board://{id}` resource protocol.

---

## 🧪 Testing & Verification

Run the entire automated regression test suite:

```bash
npm test
# or
node tests/run-all.js
```

All 25 test suites run headlessly, validating:
- Multi-board state switching and index persistence
- Graph pointer integrity when pins are deleted
- Canvas viewport culling on large node sets
- Keyboard hotkeys (`1`-`5`, `Shift+[1-9]`, `Tab`, `Esc`, `Delete`)
- MCP JSON-RPC protocol compliance

---

## 📚 Project Documentation System

Complete technical documentation is organized in the [`docs/`](file:///Users/health/Sites/investigative-board/docs/) directory:

- 🏗️ **[Architecture Guide (`docs/ARCHITECTURE.md`)](file:///Users/health/Sites/investigative-board/docs/ARCHITECTURE.md)**: System design, module structure, rendering lifecycle, and synchronization topology.
- 📈 **[Progress & Test Matrix (`docs/PROGRESS.md`)](file:///Users/health/Sites/investigative-board/docs/PROGRESS.md)**: 25-suite test matrix, living bug tracker (`[RESOLVED]` / `[VERIFIED]`), and root-cause fix logs.
- 🗺️ **[Strategic Roadmap (`docs/ROADMAP.md`)](file:///Users/health/Sites/investigative-board/docs/ROADMAP.md)**: ArtCraft ecosystem alignment, `.craftboard` document bundle format, and Tauri desktop shell milestones.
- 📜 **[Refactor History (`docs/REFACTOR_HISTORY.md`)](file:///Users/health/Sites/investigative-board/docs/REFACTOR_HISTORY.md)**: Complete chronological transformation from prototype to modular architecture and merge stabilization.
- 🔌 **[API & Agent Specification (`docs/API_AND_AGENT_SPEC.md`)](file:///Users/health/Sites/investigative-board/docs/API_AND_AGENT_SPEC.md)**: Formal MCP tools reference, CLI options, and HTTP/SSE synchronization protocols.

---

## ⌨️ Keyboard Shortcuts Reference

| Shortcut | Action |
| :--- | :--- |
| `1` | Select / Move Tool |
| `2` | Pin Placement Tool |
| `3` | Connection String Tool |
| `4` | Text Pin Tool |
| `5` | Canvas Pan Tool |
| `Shift + [1-9]` | Select Color Slot 1 through 9 |
| `Delete` / `Backspace` | Safely Delete Selected Pin (pruning connections) |
| `Escape` | Deselect Active Element / Close Modal |
| `Tab` / `Shift + Tab` | Cycle Selection to Next / Previous Pin |
| `Cmd/Ctrl + Z` | Undo |
| `Cmd/Ctrl + Shift + Z` | Redo |
| `Scroll Wheel` | Zoom in / out centered on cursor |
| `Middle Mouse Click + Drag` | Pan canvas |

---

## 🛡️ License

MIT License. Designed and maintained for local-first desktop creativity.
