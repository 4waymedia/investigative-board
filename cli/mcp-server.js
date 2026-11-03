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
              enum: ["circle", "rect", "pill", "diamond", "bubble", "rectangle", "thought", "text-plain", "text-title", "area-rect", "area-circle"],
              description: "Shape of the pin or container (defaults to 'circle')"
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
              enum: ["curved", "straight"],
              description: "Connection line style ('curved' or 'straight')"
            },
            relationship: {
              type: "string",
              description: "Semantic relationship type (e.g. 'relates-to', 'caused', 'witness')"
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

      return {
        jsonrpc: "2.0",
        id,
        result: { resources }
      };
    }

    if (method === "resources/read") {
      const uri = params?.uri || "";
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
