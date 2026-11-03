#!/usr/bin/env node
/**
 * Investigative Board - CLI Tool & Agent Controller
 * Command line interface for querying, creating, and manipulating boards.
 */

const BoardStorage = require('./storage');
const MCPServer = require('./mcp-server');
const BoardServer = require('./server');

const storage = new BoardStorage();

function parseArgs(args) {
  const flags = {};
  const positional = [];
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith('--')) {
      const key = arg.slice(2);
      const next = args[i + 1];
      if (next && !next.startsWith('--')) {
        flags[key] = next;
        i++;
      } else {
        flags[key] = true;
      }
    } else {
      positional.push(arg);
    }
  }
  return { flags, positional };
}

function printHelp() {
  console.log(`
📋 Investigative Board - CLI & Agent Tooling

USAGE:
  ib <command> [arguments] [flags]

COMMANDS:
  list                          List all investigation boards
  show <boardId>                Show details, pins, and connections of a board
  create <title>                Create a new board (--desc, --theme)
  delete <boardId>              Delete a board by ID
  add-pin <boardId>             Add a pin (--x, --y, --label, --desc, --color, --shape, --date)
  update-pin <boardId> <idx>    Update a pin (--label, --desc, --color, --x, --y)
  delete-pin <boardId> <idx>    Delete a pin and update connections
  connect <boardId>             Connect two pins (--from, --to, --label, --color, --type)
  delete-conn <boardId> <idx>   Delete a connection line
  layout <boardId> <type>       Auto-arrange pins: grid, circle, or timeline
  search <boardId> <query>      Search pins and connections for text
  export <boardId> [file.json]  Export board to JSON
  import <file.json>            Import board from JSON
  mcp                           Start the MCP (Model Context Protocol) stdio server
  serve [--port 3000]           Start the web server with live sync bridge

EXAMPLES:
  ib list
  ib create "Operation Redline" --desc "Classified investigation"
  ib add-pin <id> --x 200 --y 150 --label "Target Alpha" --color "#f85149"
  ib connect <id> --from 0 --to 1 --label "Associate"
  ib mcp
`);
}

async function main() {
  const argv = process.argv.slice(2);
  if (argv.length === 0 || argv[0] === 'help' || argv[0] === '--help' || argv[0] === '-h') {
    printHelp();
    return;
  }

  const command = argv[0];
  const { flags, positional } = parseArgs(argv.slice(1));

  try {
    switch (command) {
      case 'mcp': {
        const mcp = new MCPServer(storage);
        mcp.startStdio();
        break;
      }

      case 'serve': {
        const port = flags.port ? parseInt(flags.port) : 3000;
        const server = new BoardServer(port, storage);
        server.start();
        break;
      }

      case 'list': {
        const boards = storage.listBoards();
        const activeId = storage.getActiveBoardId();
        if (boards.length === 0) {
          console.log("No boards found. Create one with: ib create \"Board Name\"");
          return;
        }
        console.log(`\n📋 Investigation Boards (${boards.length}):\n`);
        boards.forEach((b, i) => {
          const isActive = b.id === activeId ? " [ACTIVE]" : "";
          const date = b.lastModified ? new Date(b.lastModified).toLocaleString() : "N/A";
          console.log(`  ${i + 1}. ${b.title}${isActive}`);
          console.log(`     ID:       ${b.id}`);
          if (b.description) console.log(`     Summary:  ${b.description}`);
          console.log(`     Updated:  ${date}\n`);
        });
        break;
      }

      case 'show': {
        const boardId = positional[0] || storage.getActiveBoardId();
        if (!boardId) {
          console.error("Error: Specify a board ID or create an active board");
          process.exit(1);
        }
        const board = storage.getBoard(boardId);
        if (!board) {
          console.error(`Error: Board not found: ${boardId}`);
          process.exit(1);
        }
        console.log(`\n📋 ${board.meta.title} (${board.id})`);
        if (board.meta.description) console.log(`Description: ${board.meta.description}`);
        console.log(`Theme: ${board.document.currentThemeId || 'dark'} | Created: ${board.meta.created}`);

        console.log(`\n📍 Pins (${board.document.pins.length}):`);
        board.document.pins.forEach((p, idx) => {
          const date = p.date ? ` [${p.date}]` : '';
          const shape = p.shape || 'circle';
          console.log(`  [${idx}] "${p.label || 'Untitled'}" (${shape}, ${p.color || '#fff'}) at (${p.x}, ${p.y})${date}`);
          if (p.description) console.log(`       ↳ ${p.description}`);
        });

        console.log(`\n🔗 Connections (${board.document.connections.length}):`);
        board.document.connections.forEach((c, idx) => {
          const fromPin = board.document.pins[c.from]?.label || `Pin ${c.from}`;
          const toPin = board.document.pins[c.to]?.label || `Pin ${c.to}`;
          const label = c.label ? ` --[ ${c.label} ]--> ` : ` ----> `;
          console.log(`  [${idx}] ${fromPin} (${c.from})${label}${toPin} (${c.to}) [${c.type || 'curved'}, ${c.color || '#fff'}]`);
        });
        console.log("");
        break;
      }

      case 'create': {
        const title = positional[0];
        if (!title) {
          console.error("Error: Title is required (e.g. ib create \"Case Alpha\")");
          process.exit(1);
        }
        const created = storage.createBoard({
          title,
          description: flags.desc || flags.description || "",
          themeId: flags.theme || "dark"
        });
        console.log(`✅ Board created: "${created.meta.title}" (${created.id})`);
        break;
      }

      case 'delete': {
        const boardId = positional[0];
        if (!boardId) {
          console.error("Error: Board ID required");
          process.exit(1);
        }
        storage.deleteBoard(boardId);
        console.log(`🗑️ Board ${boardId} deleted`);
        break;
      }

      case 'add-pin': {
        const boardId = positional[0] || storage.getActiveBoardId();
        if (!boardId) {
          console.error("Error: Board ID required");
          process.exit(1);
        }
        const result = storage.addPin(boardId, {
          x: flags.x !== undefined ? parseFloat(flags.x) : 150,
          y: flags.y !== undefined ? parseFloat(flags.y) : 150,
          label: flags.label || positional[1] || "New Pin",
          description: flags.desc || flags.description || "",
          note: flags.note || "",
          color: flags.color || "#58a6ff",
          shape: flags.shape || "circle",
          date: flags.date || ""
        });
        console.log(`📍 Pin added at index [${result.index}]: "${result.pin.label}" (${result.pin.id})`);
        break;
      }

      case 'update-pin': {
        const boardId = positional[0];
        const pinIdx = positional[1];
        if (!boardId || pinIdx === undefined) {
          console.error("Error: Board ID and pin index/ID required");
          process.exit(1);
        }
        const updates = {};
        if (flags.label) updates.label = flags.label;
        if (flags.desc || flags.description) updates.description = flags.desc || flags.description;
        if (flags.note) updates.note = flags.note;
        if (flags.color) updates.color = flags.color;
        if (flags.shape) updates.shape = flags.shape;
        if (flags.date) updates.date = flags.date;
        if (flags.x) updates.x = parseFloat(flags.x);
        if (flags.y) updates.y = parseFloat(flags.y);

        const result = storage.updatePin(boardId, pinIdx, updates);
        console.log(`✏️ Pin [${result.index}] updated: "${result.pin.label}"`);
        break;
      }

      case 'delete-pin': {
        const boardId = positional[0];
        const pinIdx = positional[1];
        if (!boardId || pinIdx === undefined) {
          console.error("Error: Board ID and pin index required");
          process.exit(1);
        }
        const result = storage.deletePin(boardId, pinIdx);
        console.log(`🗑️ Pin deleted: "${result.removed?.label || 'Pin'}". Remaining pins: ${result.remainingCount}`);
        break;
      }

      case 'connect': {
        const boardId = positional[0] || storage.getActiveBoardId();
        if (!boardId) {
          console.error("Error: Board ID required");
          process.exit(1);
        }
        const from = flags.from !== undefined ? flags.from : positional[1];
        const to = flags.to !== undefined ? flags.to : positional[2];

        if (from === undefined || to === undefined) {
          console.error("Error: Specify --from <index> and --to <index>");
          process.exit(1);
        }

        const result = storage.addConnection(boardId, {
          from: parseInt(from),
          to: parseInt(to),
          label: flags.label || "",
          color: flags.color || "#58a6ff",
          type: flags.type || "curved",
          relationship: flags.rel || flags.relationship || "relates-to"
        });
        console.log(`🔗 Connected pin ${from} → ${to} (connection index: [${result.index}])`);
        break;
      }

      case 'delete-conn': {
        const boardId = positional[0];
        const connIdx = positional[1];
        if (!boardId || connIdx === undefined) {
          console.error("Error: Board ID and connection index required");
          process.exit(1);
        }
        const result = storage.deleteConnection(boardId, connIdx);
        console.log(`🗑️ Connection [${connIdx}] deleted. Remaining connections: ${result.remainingCount}`);
        break;
      }

      case 'layout': {
        const boardId = positional[0];
        const layoutType = positional[1] || flags.type || "grid";
        if (!boardId) {
          console.error("Error: Board ID required");
          process.exit(1);
        }
        storage.applyLayout(boardId, layoutType);
        console.log(`📐 Applied '${layoutType}' layout to board ${boardId}`);
        break;
      }

      case 'search': {
        const boardId = positional[0];
        const query = positional[1] || flags.q || flags.query;
        if (!boardId || !query) {
          console.error("Error: Board ID and search query required");
          process.exit(1);
        }
        const results = storage.search(boardId, query);
        console.log(`🔍 Search results for "${query}" on board ${boardId}:`);
        console.log(`   Found ${results.pins.length} pin(s) and ${results.connections.length} connection(s):\n`);
        results.pins.forEach(({ pin, index }) => {
          console.log(`   📍 [${index}] ${pin.label} (${pin.x}, ${pin.y})`);
          if (pin.description) console.log(`      ↳ ${pin.description}`);
        });
        results.connections.forEach(({ conn, index }) => {
          console.log(`   🔗 [${index}] ${conn.from} → ${conn.to} "${conn.label}"`);
        });
        break;
      }

      case 'export': {
        const boardId = positional[0];
        const outPath = positional[1] || flags.out;
        if (!boardId) {
          console.error("Error: Board ID required");
          process.exit(1);
        }
        const jsonStr = storage.exportBoard(boardId, outPath);
        if (outPath) {
          console.log(`📤 Board exported to file: ${outPath}`);
        } else {
          console.log(jsonStr);
        }
        break;
      }

      case 'import': {
        const filePath = positional[0];
        if (!filePath) {
          console.error("Error: File path required");
          process.exit(1);
        }
        const imported = storage.importBoard(filePath);
        console.log(`📥 Board imported successfully: "${imported.meta.title}" (${imported.id})`);
        break;
      }

      default:
        console.error(`Unknown command: ${command}`);
        printHelp();
        process.exit(1);
    }
  } catch (err) {
    console.error(`❌ Error: ${err.message}`);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { storage, parseArgs };
