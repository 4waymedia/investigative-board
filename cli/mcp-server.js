#!/usr/bin/env node
/**
 * Investigative Board - MCP (Model Context Protocol) Server
 * Allows AI agents (Claude, Gemini, Antigravity, Cursor) to control and interact with investigation boards.
 * Implements MCP JSON-RPC 2.0 protocol over stdio.
 */

const readline = require('readline');
const BoardStorage = require('./storage');

class MCPServer {
  constructor(storage = null) {
    this.storage = storage || new BoardStorage();
    this.serverInfo = {
      name: "investigative-board-mcp",
      version: "1.0.0"
    };
  }

  getTools() {
    return [
      {
        name: "board_list",
        description: "List all investigation boards with their IDs, titles, descriptions, and modification timestamps.",
        inputSchema: {
          type: "object",
          properties: {}
        }
      },
      {
        name: "board_get",
        description: "Get full details of a specific investigation board including all pins, connections, metadata, and view configuration.",
        inputSchema: {
          type: "object",
          properties: {
            boardId: {
              type: "string",
              description: "The unique ID of the board to retrieve"
            }
          },
          required: ["boardId"]
        }
      },
      {
        name: "board_create",
        description: "Create a new investigation board with a title, optional description, and visual theme.",
        inputSchema: {
          type: "object",
          properties: {
            title: {
              type: "string",
              description: "Title of the board (e.g. 'Project Mercury Investigation')"
            },
            description: {
              type: "string",
              description: "Optional description or case summary"
            },
            themeId: {
              type: "string",
              enum: ["dark", "light", "midnight", "sepia", "matrix", "cyber", "noir", "ocean"],
              description: "Visual theme (defaults to 'dark')"
            }
          },
          required: ["title"]
        }
      },
      {
        name: "board_delete",
        description: "Delete an investigation board by ID.",
        inputSchema: {
          type: "object",
          properties: {
            boardId: {
              type: "string",
              description: "The ID of the board to delete"
            }
          },
          required: ["boardId"]
        }
      },
      {
        name: "pin_add",
        description: "Add a pin, card, or text bubble to an investigation board.",
        inputSchema: {
          type: "object",
          properties: {
            boardId: {
              type: "string",
              description: "The ID of the board"
            },
            x: {
              type: "number",
              description: "X coordinate in canvas world space (e.g. 100 to 1500)"
            },
            y: {
              type: "number",
              description: "Y coordinate in canvas world space (e.g. 100 to 1200)"
            },
            label: {
              type: "string",
              description: "Short label or title for the pin"
            },
            description: {
              type: "string",
              description: "Detailed description, clue explanation, or bubble content"
            },
            note: {
              type: "string",
              description: "Optional notes or investigative remarks"
            },
            color: {
              type: "string",
              description: "Hex color code (e.g. '#f85149' for red, '#58a6ff' for blue, '#3fb950' for green, '#f1c40f' for yellow)"
            },
            shape: {
              type: "string",
              enum: [
                "circle", "rect", "pill", "diamond", "person", "business-building", "card",
                "bubble", "rectangle", "thought", "text-plain", "text-title",
                "area-rect", "area-circle",
                "service", "database", "wal-queue", "flow-container", "flow-callout",
                "star", "shield", "cross"
              ],
              description: "Shape of the pin, investigative entity, or data-flow component (defaults to 'circle')"
            },
            date: {
              type: "string",
              description: "Optional ISO date or year string for timeline alignment (e.g. '2026-01-15' or '1947')"
            }
          },
          required: ["boardId", "x", "y", "label"]
        }
      },
      {
        name: "pin_update",
        description: "Update an existing pin's properties (position, label, description, color, shape).",
        inputSchema: {
          type: "object",
          properties: {
            boardId: {
              type: "string",
              description: "The ID of the board"
            },
            pinIndexOrId: {
              type: "string",
              description: "The index (0, 1, 2...) or ID of the pin to update"
            },
            updates: {
              type: "object",
              description: "Fields to update (x, y, label, description, note, color, shape, date)"
            }
          },
          required: ["boardId", "pinIndexOrId", "updates"]
        }
      },
      {
        name: "pin_delete",
        description: "Delete a pin from the board. All connecting thread lines are automatically pruned and indices re-aligned.",
        inputSchema: {
          type: "object",
          properties: {
            boardId: {
              type: "string",
              description: "The ID of the board"
            },
            pinIndexOrId: {
              type: "string",
              description: "The pin index (0, 1, 2...) or ID to delete"
            }
          },
          required: ["boardId", "pinIndexOrId"]
        }
      },
      {
        name: "connection_add",
        description: "Connect two pins with a thread line, representing relationships, leads, or evidence links.",
        inputSchema: {
          type: "object",
          properties: {
            boardId: {
              type: "string",
              description: "The ID of the board"
            },
            from: {
              type: "number",
              description: "Source pin index"
            },
            to: {
              type: "number",
              description: "Target pin index"
            },
            label: {
              type: "string",
              description: "Optional label along the connection line (e.g. 'Seen with', 'Funded by')"
            },
            color: {
              type: "string",
              description: "Hex color code for the string/thread (defaults to '#58a6ff')"
            },
            type: {
              type: "string",
              enum: ["curved", "straight", "orthogonal"],
              description: "Connection line style ('curved', 'straight', or 'orthogonal' for Manhattan data-flow)"
            },
            relationship: {
              type: "string",
              description: "Semantic relationship type (e.g. 'relates-to', 'caused', 'witness')"
            },
            fromPort: {
              type: "string",
              enum: ["north", "south", "east", "west", "center", "auto"],
              description: "Source perimeter docking port (defaults to 'auto' for orthogonal)"
            },
            toPort: {
              type: "string",
              enum: ["north", "south", "east", "west", "center", "auto"],
              description: "Target perimeter docking port (defaults to 'auto' for orthogonal)"
            },
            arrow: {
              type: "string",
              enum: ["target", "source", "both", "none"],
              description: "Directional arrowhead mode (defaults to 'target' on orthogonal connections)"
            },
            step: {
              type: "string",
              description: "Optional step sequence badge number along connection (e.g. '1', '2', '❶')"
            },
            multiplier: {
              type: "string",
              description: "Optional rate multiplier chip badge along connection (e.g. '× 8', '× 1.5')"
            },
            dashed: {
              type: "boolean",
              description: "Render as dashed line (e.g. for async or background data flows)"
            }
          },
          required: ["boardId", "from", "to"]
        }
      },
      {
        name: "connection_delete",
        description: "Delete a connection line between pins by index.",
        inputSchema: {
          type: "object",
          properties: {
            boardId: {
              type: "string",
              description: "The ID of the board"
            },
            connectionIndex: {
              type: "number",
              description: "The index of the connection to remove"
            }
          },
          required: ["boardId", "connectionIndex"]
        }
      },
      {
        name: "board_search",
        description: "Search across all pins and connections on a board for keywords in labels, descriptions, notes, or dates.",
        inputSchema: {
          type: "object",
          properties: {
            boardId: {
              type: "string",
              description: "The ID of the board"
            },
            query: {
              type: "string",
              description: "Search keyword"
            }
          },
          required: ["boardId", "query"]
        }
      },
      {
        name: "layout_apply",
        description: "Automatically arrange pins on a board using an algorithmic layout.",
        inputSchema: {
          type: "object",
          properties: {
            boardId: {
              type: "string",
              description: "The ID of the board"
            },
            type: {
              type: "string",
              enum: ["grid", "circle", "timeline"],
              description: "Layout algorithm: 'grid' (tidy rows/cols), 'circle' (radial relationship wheel), or 'timeline' (chronological by date)"
            }
          },
          required: ["boardId", "type"]
        }
      },
      {
        name: "board_export",
        description: "Export an entire board as a standard JSON string or file.",
        inputSchema: {
          type: "object",
          properties: {
            boardId: {
              type: "string",
              description: "The ID of the board"
            },
            outputPath: {
              type: "string",
              description: "Optional file path to save the JSON export"
            }
          },
          required: ["boardId"]
        }
      },
      {
        name: "board_import",
        description: "Import a board from a JSON file path.",
        inputSchema: {
          type: "object",
          properties: {
            filePath: {
              type: "string",
              description: "Path to the JSON file to import"
            }
          },
          required: ["filePath"]
        }
      },
      // --- ArtCraft Agent Suite: AI Stencils, Themes & Custom Shapes ---
      {
        name: "stencil_list",
        description: "List all built-in and AI-generated investigative stencils with category and search filtering.",
        inputSchema: {
          type: "object",
          properties: {
            category: {
              type: "string",
              description: "Optional category filter (e.g. 'Persons', 'Physical', 'Records', 'Custom')"
            },
            query: {
              type: "string",
              description: "Optional search query matching title, badge, or description"
            }
          }
        }
      },
      {
        name: "stencil_create",
        description: "Create or customize an ArtCraft investigative stencil preset with icon, badge, shape, color, and clue schema.",
        inputSchema: {
          type: "object",
          properties: {
            id: {
              type: "string",
              description: "Unique stencil ID (e.g. 'stencil:informant' or 'stencil:forensic-knife')"
            },
            title: {
              type: "string",
              description: "Display title (e.g. 'Confidential Informant', 'Murder Weapon')"
            },
            category: {
              type: "string",
              description: "Category for stencil dock grouping (e.g. 'Persons', 'Physical', 'Custom')"
            },
            icon: {
              type: "string",
              description: "Emoji or icon symbol (e.g. '🕵️', '🩸', '📄', '🔬', '🔪')"
            },
            badge: {
              type: "string",
              description: "Uppercase stamp/badge label (e.g. 'INFORMANT', 'WEAPON', 'ALIBI')"
            },
            shape: {
              type: "string",
              description: "Shape type: 'circle', 'diamond', 'person', 'pill', 'rectangle', 'thought', 'business-building', 'area-circle', or a custom registered shape"
            },
            color: {
              type: "string",
              description: "Hex accent color code (e.g. '#e06c75', '#38bdf8', '#98c379')"
            },
            label: {
              type: "string",
              description: "Default canvas pin label"
            },
            subtitle: {
              type: "string",
              description: "Subtitle or archetype note"
            },
            description: {
              type: "string",
              description: "Detailed description or investigative prompt"
            },
            pinScale: {
              type: "number",
              description: "Visual scale multiplier (default 1.0)"
            },
            width: {
              type: "number",
              description: "Width for text/container shapes"
            },
            height: {
              type: "number",
              description: "Height for text/container shapes"
            },
            radius: {
              type: "number",
              description: "Radius for area/perimeter shapes"
            },
            customFields: {
              type: "object",
              description: "Custom key-value metadata schema for this clue type"
            }
          },
          required: ["title"]
        }
      },
      {
        name: "stencil_apply",
        description: "Stamp/instantiate an investigative stencil preset directly onto a board at canvas coordinates (x, y).",
        inputSchema: {
          type: "object",
          properties: {
            boardId: {
              type: "string",
              description: "ID of the board"
            },
            stencilId: {
              type: "string",
              description: "ID of the stencil preset (e.g. 'stencil:suspect', 'stencil:evidence')"
            },
            x: {
              type: "number",
              description: "World X position on board"
            },
            y: {
              type: "number",
              description: "World Y position on board"
            },
            label: {
              type: "string",
              description: "Optional custom label overriding stencil default"
            },
            description: {
              type: "string",
              description: "Optional custom description overriding stencil default"
            },
            color: {
              type: "string",
              description: "Optional custom color override"
            }
          },
          required: ["boardId", "stencilId", "x", "y"]
        }
      },
      {
        name: "stencil_delete",
        description: "Delete a custom AI-generated stencil preset by ID.",
        inputSchema: {
          type: "object",
          properties: {
            stencilId: {
              type: "string",
              description: "ID of the stencil to delete"
            }
          },
          required: ["stencilId"]
        }
      },
      {
        name: "theme_list",
        description: "List all built-in and AI-generated visual themes with their color palettes.",
        inputSchema: {
          type: "object",
          properties: {}
        }
      },
      {
        name: "theme_create",
        description: "Create an ArtCraft-compliant harmonious theme palette with canvas colors, UI chroming, and 8-slot role palette.",
        inputSchema: {
          type: "object",
          properties: {
            id: {
              type: "string",
              description: "Unique theme ID slug (e.g. 'tokyo-noir', 'cyber-detective')"
            },
            name: {
              type: "string",
              description: "Human readable theme title (e.g. 'Tokyo Noir 1982')"
            },
            type: {
              type: "string",
              enum: ["dark", "light"],
              description: "Base theme mode ('dark' or 'light')"
            },
            description: {
              type: "string",
              description: "Atmospheric description or case mood"
            },
            canvas: {
              type: "object",
              properties: {
                background: { type: "string", description: "Canvas background hex color" },
                gridColor: { type: "string", description: "Grid line color / rgba" },
                gridMajorColor: { type: "string", description: "Major grid cross/line color" }
              }
            },
            ui: {
              type: "object",
              properties: {
                background: { type: "string" },
                border: { type: "string" },
                text: { type: "string" },
                textMuted: { type: "string" },
                accent: { type: "string" }
              }
            },
            colorSlots: {
              type: "object",
              description: "Map of color slots c1..c8 with { name, value }"
            }
          },
          required: ["id", "name"]
        }
      },
      {
        name: "theme_apply",
        description: "Apply a visual theme to an investigation board.",
        inputSchema: {
          type: "object",
          properties: {
            boardId: {
              type: "string",
              description: "ID of the target board"
            },
            themeId: {
              type: "string",
              description: "ID of the theme to apply (e.g. 'dark', 'light', 'midnight', 'sepia', or custom ID)"
            }
          },
          required: ["boardId", "themeId"]
        }
      },
      {
        name: "shape_list",
        description: "List all registered custom geometric and vector icon shapes.",
        inputSchema: {
          type: "object",
          properties: {}
        }
      },
      {
        name: "shape_register",
        description: "Register a custom geometric, procedural, or vector icon shape into the canvas drawing engine.",
        inputSchema: {
          type: "object",
          properties: {
            name: {
              type: "string",
              description: "Unique shape name (e.g. 'star', 'shield', 'cross', 'badge')"
            },
            description: {
              type: "string",
              description: "Description of the shape and intended usage"
            },
            baseShape: {
              type: "string",
              enum: ["circle", "rect"],
              description: "Base geometry for hit-testing and metric scaling"
            },
            width: {
              type: "number",
              description: "Default width in pixels"
            },
            height: {
              type: "number",
              description: "Default height in pixels"
            },
            pathData: {
              type: "string",
              description: "Optional SVG path string (d attribute) for vector rendering"
            },
            iconSvg: {
              type: "string",
              description: "Optional inline SVG icon XML"
            }
          },
          required: ["name"]
        }
      }
    ];
  }

  async executeTool(name, args) {
    try {
      switch (name) {
        case "board_list": {
          const boards = this.storage.listBoards();
          return { boards, count: boards.length };
        }
        case "board_get": {
          const board = this.storage.getBoard(args.boardId);
          if (!board) throw new Error(`Board not found: ${args.boardId}`);
          return board;
        }
        case "board_create": {
          const newBoard = this.storage.createBoard(args);
          return { message: "Board created successfully", boardId: newBoard.id, board: newBoard };
        }
        case "board_delete": {
          const ok = this.storage.deleteBoard(args.boardId);
          return { success: ok, message: `Board ${args.boardId} deleted` };
        }
        case "pin_add": {
          const result = this.storage.addPin(args.boardId, args);
          return { message: "Pin added successfully", ...result };
        }
        case "pin_update": {
          const result = this.storage.updatePin(args.boardId, args.pinIndexOrId, args.updates);
          return { message: "Pin updated successfully", ...result };
        }
        case "pin_delete": {
          const result = this.storage.deletePin(args.boardId, args.pinIndexOrId);
          return { message: "Pin deleted and connections updated", ...result };
        }
        case "connection_add": {
          const result = this.storage.addConnection(args.boardId, args);
          return { message: "Connection created", ...result };
        }
        case "connection_delete": {
          const result = this.storage.deleteConnection(args.boardId, args.connectionIndex);
          return { message: "Connection removed", ...result };
        }
        case "board_search": {
          const results = this.storage.search(args.boardId, args.query);
          return { query: args.query, ...results };
        }
        case "layout_apply": {
          const board = this.storage.applyLayout(args.boardId, args.type);
          return { message: `Layout '${args.type}' applied to ${board.document.pins.length} pins`, pinCount: board.document.pins.length };
        }
        case "board_export": {
          const jsonStr = this.storage.exportBoard(args.boardId, args.outputPath);
          return { message: "Board exported", outputPath: args.outputPath || null, json: args.outputPath ? undefined : JSON.parse(jsonStr) };
        }
        case "board_import": {
          const board = this.storage.importBoard(args.filePath);
          return { message: "Board imported successfully", boardId: board.id, title: board.meta.title };
        }
        case "stencil_list": {
          const stencils = this.storage.listStencils({ category: args.category, query: args.query });
          return { stencils, count: stencils.length };
        }
        case "stencil_create": {
          const stencil = this.storage.saveStencil(args);
          return { message: `Stencil '${stencil.title}' created successfully`, stencil };
        }
        case "stencil_apply": {
          const result = this.storage.applyStencil(args.boardId, args);
          return { message: "Stencil stamped onto board successfully", ...result };
        }
        case "stencil_delete": {
          const ok = this.storage.deleteStencil(args.stencilId);
          return { success: ok, message: `Stencil '${args.stencilId}' deleted` };
        }
        case "theme_list": {
          const themes = this.storage.listThemes();
          return { themes, count: themes.length };
        }
        case "theme_create": {
          const theme = this.storage.saveTheme(args);
          return { message: `Theme '${theme.name}' created successfully`, theme };
        }
        case "theme_apply": {
          const result = this.storage.applyTheme(args.boardId, args.themeId);
          return { message: `Theme '${args.themeId}' applied to board`, theme: result.theme };
        }
        case "shape_list": {
          const shapes = this.storage.listShapes();
          return { shapes, count: shapes.length };
        }
        case "shape_register": {
          const shape = this.storage.saveShape(args);
          return { message: `Shape '${shape.name}' registered successfully`, shape };
        }
        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    } catch (err) {
      return { isError: true, error: err.message };
    }
  }

  handleMessage(message) {
    if (!message || typeof message !== 'object') return null;

    const { id, method, params } = message;

    // Handle JSON-RPC methods
    if (method === "initialize") {
      return {
        jsonrpc: "2.0",
        id,
        result: {
          protocolVersion: "2024-11-05",
          capabilities: {
            tools: {},
            resources: {}
          },
          serverInfo: this.serverInfo
        }
      };
    }

    if (method === "notifications/initialized") {
      return null; // No response needed for notification
    }

    if (method === "tools/list") {
      return {
        jsonrpc: "2.0",
        id,
        result: {
          tools: this.getTools()
        }
      };
    }

    if (method === "tools/call") {
      const toolName = params?.name;
      const toolArgs = params?.arguments || {};

      return this.executeTool(toolName, toolArgs).then(result => {
        if (result.isError) {
          return {
            jsonrpc: "2.0",
            id,
            result: {
              content: [
                {
                  type: "text",
                  text: `Error: ${result.error}`
                }
              ],
              isError: true
            }
          };
        }

        return {
          jsonrpc: "2.0",
          id,
          result: {
            content: [
              {
                type: "text",
                text: JSON.stringify(result, null, 2)
              }
            ]
          }
        };
      });
    }

    if (method === "resources/list") {
      const boards = this.storage.listBoards();
      const resources = boards.map(b => ({
        uri: `board://${b.id}`,
        name: b.title,
        description: b.description || `Board ${b.id}`,
        mimeType: "application/json"
      }));

      resources.push({
        uri: "stencils://all",
        name: "ArtCraft Stencils Library",
        description: "Library of investigative stencils, entities, and clue presets",
        mimeType: "application/json"
      });

      resources.push({
        uri: "themes://all",
        name: "ArtCraft Themes Library",
        description: "Studio color palettes and themes",
        mimeType: "application/json"
      });

      return {
        jsonrpc: "2.0",
        id,
        result: { resources }
      };
    }

    if (method === "resources/read") {
      const uri = params?.uri || "";
      if (uri === "stencils://all") {
        const stencils = this.storage.listStencils();
        return {
          jsonrpc: "2.0",
          id,
          result: {
            contents: [
              {
                uri,
                mimeType: "application/json",
                text: JSON.stringify(stencils, null, 2)
              }
            ]
          }
        };
      }

      if (uri === "themes://all") {
        const themes = this.storage.listThemes();
        return {
          jsonrpc: "2.0",
          id,
          result: {
            contents: [
              {
                uri,
                mimeType: "application/json",
                text: JSON.stringify(themes, null, 2)
              }
            ]
          }
        };
      }

      const match = uri.match(/^board:\/\/([a-zA-Z0-9_-]+)$/);
      if (match) {
        const board = this.storage.getBoard(match[1]);
        if (board) {
          return {
            jsonrpc: "2.0",
            id,
            result: {
              contents: [
                {
                  uri,
                  mimeType: "application/json",
                  text: JSON.stringify(board, null, 2)
                }
              ]
            }
          };
        }
      }

      return {
        jsonrpc: "2.0",
        id,
        error: { code: -32602, message: `Resource not found: ${uri}` }
      };
    }

    if (method === "ping") {
      return { jsonrpc: "2.0", id, result: {} };
    }

    // Default: method not found
    return {
      jsonrpc: "2.0",
      id,
      error: { code: -32601, message: `Method not found: ${method}` }
    };
  }

  startStdio() {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: false
    });

    const send = (obj) => {
      if (obj) {
        process.stdout.write(JSON.stringify(obj) + "\n");
      }
    };

    rl.on('line', (line) => {
      const trimmed = line.trim();
      if (!trimmed) return;

      try {
        const message = JSON.parse(trimmed);
        const res = this.handleMessage(message);
        if (res && typeof res.then === 'function') {
          res.then(send).catch(err => {
            send({ jsonrpc: "2.0", id: message.id, error: { code: -32000, message: err.message } });
          });
        } else if (res) {
          send(res);
        }
      } catch (e) {
        send({ jsonrpc: "2.0", id: null, error: { code: -32700, message: `Parse error: ${e.message}` } });
      }
    });

    process.stderr.write("🚀 Investigative Board MCP Server running on stdio\n");
  }
}

if (require.main === module) {
  const server = new MCPServer();
  server.startStdio();
}

module.exports = MCPServer;
