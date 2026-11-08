# Investigative Board (BoardCraft)

> A high-performance, local-first infinite canvas for visual investigation, node-link diagramming, and autonomous AI agent collaboration. Designed following the [ArtCraft](https://getartcraft.com/apps) desktop ecosystem philosophy.

---

## 🌟 Highlights

- **Infinite 60 FPS Canvas**: Hardware-accelerated HTML5 canvas with viewport culling, smooth zooming, 40px master grid snapping, and sub-millisecond response times across thousands of pins.
- **Data-Flow & System Architecture Engine**: ByteByteGo-inspired diagramming with orthogonal Manhattan elbow routing ($R=8\text{px}$ rounded corners), 4-way perimeter port docking (`north`, `south`, `east`, `west`), directional arrowheads, step sequence badges (❶, ❷), rate multipliers (`× 8`), and specialized shapes (`service`, `database`, `wal-queue`, `flow-container`, `flow-callout`).
- **Smart Line Jumps & Interactive Labels**: Automatic semi-circular bridge arcs ($R=8\text{px}$) over crossing connections (precomputed AABB scalar rejection at 4.97x speedup) and double-clickable relationship label chips.
- **Investigative & Architecture Stencil Dock**: Bottom dock (`Shift + S`) with 13 built-in presets (8 investigative + 5 data-flow) supporting drag-and-drop and click-to-stamp, plus extensible AI-generated custom stencils.
- **Optimized `Pin` Class & Inset Media**: Canonical domain model supporting inset photos directly inside speech/thought bubbles with automatic text reflow, alongside ambient backdrop mode.
- **ArtCraft Agent Integration**:
  - **Model Context Protocol (MCP)**: Native stdio server exposing **22 tools** and resource inspection (`board://`, `stencils://all`, `themes://all`) for AI agents.
  - **Full CLI Suite**: Batch create, connect, auto-layout, and query boards from any terminal or script with zero external dependencies.
  - **Live Sync Bridge**: Real-time Server-Sent Events (SSE) bridge that updates the browser canvas live as an AI agent modifies boards, stencils, or themes in the background.
- **Studio Themes & 8-Slot Semantic Palettes**: Studio Dark, Gallery Light, Sepia Dossier, and Deep Midnight palettes with semantic color slot mapping (`c1`..`c8`).
- **38/38 Passing Regression Suites**: Verified end-to-end test runner guaranteeing state integrity, connection topology, Manhattan routing math, and DOM safety.

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

The agent will instantly gain access to **22 spatial canvas & ArtCraft tools** (`board_create`, `pin_add`, `connection_add`, `layout_apply`, `stencil_create`, `stencil_apply`, `theme_create`, `shape_register`, etc.) and the `board://{id}`, `stencils://all`, and `themes://all` resource protocols.

---

## 🧪 Testing & Verification

Run the entire automated regression test suite:

```bash
npm test
# or
node tests/run-all.js
```

All **38 test suites** run headlessly, validating:
- Multi-board state switching and index persistence
- Canonical `Pin` class, archetype factories, and inset image layout
- Orthogonal Manhattan routing, 4-way port docking, arrowheads, and data-flow shapes
- Smart line jumps (bridge arcs) and connection label chips
- Investigative & Data-Flow Stencil Palette lifecycle (`Shift + S`)
- Hold-to-branch 45° radial magnetic snapping and opposite branch symmetry
- Graph pointer integrity when pins are deleted
- Canvas viewport culling on large node sets
- Keyboard hotkeys (`1`-`5`, `Shift+S`, `Shift+[1-9]`, `Tab`, `Esc`, `Delete`)
- MCP JSON-RPC 2.0 protocol compliance (22 tools)

---

## 📚 Project Documentation System

Complete technical and operational documentation is organized across the root and [`docs/`](file:///Users/health/Sites/investigative-board/docs/) directory:

- 📊 **[Project Status (`status.md`)](file:///Users/health/Sites/investigative-board/status.md)**: 38/38 test validation matrix, active branch status, benchmark summary, and resolved bug tracker.
- ✨ **[Feature Catalog (`feature.md`)](file:///Users/health/Sites/investigative-board/feature.md)**: Comprehensive breakdown of all canvas, pin, data-flow, stencil, branching, theme, and layout capabilities.
- 🤖 **[Agent Automation Manual (`agent_instruction.md`)](file:///Users/health/Sites/investigative-board/agent_instruction.md)**: Full reference for all 22 MCP tools, CLI commands, and real-time REST/SSE endpoints.
- 🧭 **[Developer & Agent Guide (`CLAUDE.md`)](file:///Users/health/Sites/investigative-board/CLAUDE.md)**: Master engineering instructions, directory map, and operational rules.
- ⚡ **[Performance Benchmarks (`docs/BENCHMARKS.md`)](file:///Users/health/Sites/investigative-board/docs/BENCHMARKS.md)**: Empirical Before / Try / Try / After performance audits (Logs 001 through 005).
- 🏗️ **[Architecture Guide (`docs/ARCHITECTURE.md`)](file:///Users/health/Sites/investigative-board/docs/ARCHITECTURE.md)**: System design, module structure, rendering lifecycle, and synchronization topology.
- 📈 **[Progress & Bug History (`docs/PROGRESS.md`)](file:///Users/health/Sites/investigative-board/docs/PROGRESS.md)**: Historical bug tracker (`BUG-001` through `BUG-017`) and root-cause fix logs.
- 🗺️ **[Strategic Roadmap (`docs/ROADMAP.md`)](file:///Users/health/Sites/investigative-board/docs/ROADMAP.md)**: ArtCraft ecosystem alignment, `.craftboard` document bundle format, and Tauri desktop shell milestones.
- 📜 **[Refactor History (`docs/REFACTOR_HISTORY.md`)](file:///Users/health/Sites/investigative-board/docs/REFACTOR_HISTORY.md)**: Chronological transformation from prototype to modular architecture.
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
| `Shift + S` | Toggle Stencil Palette Dock (Investigative & Data-Flow Presets) |
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
