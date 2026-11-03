/**
 * Investigative Board - Storage Engine
 * Handles persistent board files, metadata index, and JSON import/export
 * Compatible with the multi-board storage specification
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class BoardStorage {
  constructor(dataDir = null) {
    this.dataDir = dataDir || path.resolve(process.cwd(), 'data', 'boards');
    this.indexPath = path.join(this.dataDir, 'index.json');
    this._ensureDirectories();
  }

  _ensureDirectories() {
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }
    if (!fs.existsSync(this.indexPath)) {
      const initialIndex = {
        version: "1.0",
        activeId: null,
        settings: {
          historyDepth: 20,
          membership: "enterprise"
        },
        boards: []
      };
      fs.writeFileSync(this.indexPath, JSON.stringify(initialIndex, null, 2), 'utf8');
    }
  }

  _generateId() {
    if (typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
    return 'board_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  _readIndex() {
    this._ensureDirectories();
    try {
      const content = fs.readFileSync(this.indexPath, 'utf8');
      return JSON.parse(content);
    } catch (e) {
      return { version: "1.0", activeId: null, settings: {}, boards: [] };
    }
  }

  _writeIndex(indexData) {
    fs.writeFileSync(this.indexPath, JSON.stringify(indexData, null, 2), 'utf8');
  }

  _getBoardPath(boardId) {
    return path.join(this.dataDir, `${boardId}.json`);
  }

  listBoards() {
    const index = this._readIndex();
    return index.boards || [];
  }

  getActiveBoardId() {
    const index = this._readIndex();
    return index.activeId;
  }

  setActiveBoardId(boardId) {
    const index = this._readIndex();
    index.activeId = boardId;
    this._writeIndex(index);
  }

  getBoard(boardId) {
    const filePath = this._getBoardPath(boardId);
    if (!fs.existsSync(filePath)) {
      return null;
    }
    try {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      return data;
    } catch (e) {
      console.error(`Error loading board ${boardId}:`, e.message);
      return null;
    }
  }

  createBoard({ title = "Untitled Board", description = "", themeId = "dark" } = {}) {
    const boardId = this._generateId();
    const now = new Date().toISOString();

    const meta = {
      id: boardId,
      title: title.trim() || "Untitled Board",
      description: description.trim(),
      created: now,
      lastModified: now,
      thumbnail: null
    };

    const boardData = {
      id: boardId,
      meta,
      document: {
        pins: [],
        connections: [],
        cards: [],
        textElements: [],
        areas: [],
        currentThemeId: themeId || "dark",
        palette: [
          { name: "Red", value: "#f85149" },
          { name: "Blue", value: "#58a6ff" },
          { name: "Green", value: "#3fb950" },
          { name: "Yellow", value: "#f1c40f" },
          { name: "Purple", value: "#a471f7" }
        ],
        timelineActive: false,
        timelinePins: [],
        timelineY: 0,
        timelineLeft: 0,
        timelineRight: 0
      },
      view: {
        scale: 1,
        offsetX: 0,
        offsetY: 0,
        isLayoutSimulating: false
      },
      history: []
    };

    fs.writeFileSync(this._getBoardPath(boardId), JSON.stringify(boardData, null, 2), 'utf8');

    const index = this._readIndex();
    index.boards.push({
      id: meta.id,
      title: meta.title,
      description: meta.description,
      created: meta.created,
      lastModified: meta.lastModified,
      thumbnail: null
    });
    index.activeId = boardId;
    this._writeIndex(index);

    return boardData;
  }

  saveBoard(boardData) {
    if (!boardData || !boardData.id) return false;
    boardData.meta.lastModified = new Date().toISOString();

    fs.writeFileSync(this._getBoardPath(boardData.id), JSON.stringify(boardData, null, 2), 'utf8');

    const index = this._readIndex();
    const entry = index.boards.find(b => b.id === boardData.id);
    if (entry) {
      entry.title = boardData.meta.title;
      entry.description = boardData.meta.description;
      entry.lastModified = boardData.meta.lastModified;
      entry.thumbnail = boardData.meta.thumbnail;
      this._writeIndex(index);
    }
    return true;
  }

  deleteBoard(boardId) {
    const filePath = this._getBoardPath(boardId);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    const index = this._readIndex();
    index.boards = index.boards.filter(b => b.id !== boardId);
    if (index.activeId === boardId) {
      index.activeId = index.boards.length > 0 ? index.boards[0].id : null;
    }
    this._writeIndex(index);
    return true;
  }

  addPin(boardId, {
    x = 100,
    y = 100,
    label = "",
    note = "",
    description = "",
    color = "#58a6ff",
    shape = "circle",
    typeId = "pin:circle",
    date = "",
    width = 120,
    height = 60
  } = {}) {
    const board = this.getBoard(boardId);
    if (!board) throw new Error(`Board not found: ${boardId}`);

    const newPin = {
      id: Date.now() + "_" + Math.random().toString(36).substr(2, 4),
      x: Number(x) || 0,
      y: Number(y) || 0,
      label: label || "",
      note: note || "",
      description: description || "",
      color: color || "#58a6ff",
      colorSlot: "c2",
      shape: shape || "circle",
      typeId: typeId || "pin:circle",
      date: date || "",
      width: Number(width) || 120,
      height: Number(height) || 60,
      pinScale: 1
    };

    board.document.pins.push(newPin);
    this.saveBoard(board);
    return { pin: newPin, index: board.document.pins.length - 1 };
  }

  updatePin(boardId, pinIndexOrId, updates = {}) {
    const board = this.getBoard(boardId);
    if (!board) throw new Error(`Board not found: ${boardId}`);

    let index = -1;
    if (typeof pinIndexOrId === 'number' || !isNaN(Number(pinIndexOrId))) {
      index = Number(pinIndexOrId);
    } else {
      index = board.document.pins.findIndex(p => p.id === pinIndexOrId);
    }

    if (index < 0 || index >= board.document.pins.length) {
      throw new Error(`Pin not found at index/id: ${pinIndexOrId}`);
    }

    board.document.pins[index] = {
      ...board.document.pins[index],
      ...updates
    };

    this.saveBoard(board);
    return { pin: board.document.pins[index], index };
  }

  deletePin(boardId, pinIndexOrId) {
    const board = this.getBoard(boardId);
    if (!board) throw new Error(`Board not found: ${boardId}`);

    let index = -1;
    if (typeof pinIndexOrId === 'number' || !isNaN(Number(pinIndexOrId))) {
      index = Number(pinIndexOrId);
    } else {
      index = board.document.pins.findIndex(p => p.id === pinIndexOrId);
    }

    if (index < 0 || index >= board.document.pins.length) {
      throw new Error(`Pin not found at index/id: ${pinIndexOrId}`);
    }

    const removed = board.document.pins.splice(index, 1)[0];

    // Clean up connections referencing this pin
    board.document.connections = board.document.connections.filter(conn =>
      conn.from !== index && conn.to !== index
    );

    // Shift higher indices
    board.document.connections.forEach(conn => {
      if (conn.from > index) conn.from--;
      if (conn.to > index) conn.to--;
    });

    this.saveBoard(board);
    return { removed, remainingCount: board.document.pins.length };
  }

  addConnection(boardId, {
    from,
    to,
    label = "",
    color = "#58a6ff",
    type = "curved",
    relationship = "relates-to"
  } = {}) {
    const board = this.getBoard(boardId);
    if (!board) throw new Error(`Board not found: ${boardId}`);

    const fromIdx = Number(from);
    const toIdx = Number(to);

    if (isNaN(fromIdx) || fromIdx < 0 || fromIdx >= board.document.pins.length) {
      throw new Error(`Invalid 'from' pin index: ${from}`);
    }
    if (isNaN(toIdx) || toIdx < 0 || toIdx >= board.document.pins.length) {
      throw new Error(`Invalid 'to' pin index: ${to}`);
    }

    const newConnection = {
      id: "conn_" + Date.now() + "_" + Math.random().toString(36).substr(2, 4),
      from: fromIdx,
      to: toIdx,
      label: label || "",
      color: color || "#58a6ff",
      type: type || "curved",
      relationship: relationship || "relates-to"
    };

    board.document.connections.push(newConnection);
    this.saveBoard(board);
    return { connection: newConnection, index: board.document.connections.length - 1 };
  }

  deleteConnection(boardId, connIndex) {
    const board = this.getBoard(boardId);
    if (!board) throw new Error(`Board not found: ${boardId}`);

    const idx = Number(connIndex);
    if (isNaN(idx) || idx < 0 || idx >= board.document.connections.length) {
      throw new Error(`Invalid connection index: ${connIndex}`);
    }

    const removed = board.document.connections.splice(idx, 1)[0];
    this.saveBoard(board);
    return { removed, remainingCount: board.document.connections.length };
  }

  exportBoard(boardId, outputPath = null) {
    const board = this.getBoard(boardId);
    if (!board) throw new Error(`Board not found: ${boardId}`);

    const exportData = {
      formatVersion: "1.0",
      exportedAt: new Date().toISOString(),
      exportedFrom: "investigative-board-cli",
      board: {
        id: board.id,
        meta: board.meta,
        document: board.document,
        view: board.view
      }
    };

    const jsonStr = JSON.stringify(exportData, null, 2);
    if (outputPath) {
      fs.writeFileSync(outputPath, jsonStr, 'utf8');
    }
    return jsonStr;
  }

  importBoard(filePath) {
    if (!fs.existsSync(filePath)) {
      throw new Error(`File does not exist: ${filePath}`);
    }

    const raw = fs.readFileSync(filePath, 'utf8');
    const parsed = JSON.parse(raw);
    const importedBoard = parsed.board || parsed;

    const newBoardId = this._generateId();
    const now = new Date().toISOString();

    const meta = {
      id: newBoardId,
      title: importedBoard.meta?.title || importedBoard.title || "Imported Board",
      description: importedBoard.meta?.description || importedBoard.description || "",
      created: now,
      lastModified: now,
      thumbnail: importedBoard.meta?.thumbnail || null
    };

    const boardData = {
      id: newBoardId,
      meta,
      document: importedBoard.document || {
        pins: importedBoard.pins || [],
        connections: importedBoard.connections || [],
        cards: [],
        textElements: [],
        areas: [],
        currentThemeId: "dark",
        palette: []
      },
      view: importedBoard.view || { scale: 1, offsetX: 0, offsetY: 0 },
      history: []
    };

    fs.writeFileSync(this._getBoardPath(newBoardId), JSON.stringify(boardData, null, 2), 'utf8');

    const index = this._readIndex();
    index.boards.push({
      id: meta.id,
      title: meta.title,
      description: meta.description,
      created: meta.created,
      lastModified: meta.lastModified,
      thumbnail: meta.thumbnail
    });
    index.activeId = newBoardId;
    this._writeIndex(index);

    return boardData;
  }

  search(boardId, query) {
    const board = this.getBoard(boardId);
    if (!board) throw new Error(`Board not found: ${boardId}`);

    const q = (query || "").toLowerCase();
    const matchedPins = board.document.pins
      .map((pin, index) => ({ pin, index }))
      .filter(({ pin }) => 
        (pin.label && pin.label.toLowerCase().includes(q)) ||
        (pin.description && pin.description.toLowerCase().includes(q)) ||
        (pin.note && pin.note.toLowerCase().includes(q)) ||
        (pin.date && pin.date.toLowerCase().includes(q))
      );

    const matchedConnections = board.document.connections
      .map((conn, index) => ({ conn, index }))
      .filter(({ conn }) =>
        conn.label && conn.label.toLowerCase().includes(q)
      );

    return { pins: matchedPins, connections: matchedConnections };
  }

  applyLayout(boardId, type = "grid") {
    const board = this.getBoard(boardId);
    if (!board) throw new Error(`Board not found: ${boardId}`);

    const pins = board.document.pins;
    if (pins.length === 0) return board;

    if (type === "grid") {
      const cols = Math.ceil(Math.sqrt(pins.length));
      const spacingX = 220;
      const spacingY = 160;
      const startX = 100;
      const startY = 100;

      pins.forEach((pin, i) => {
        const col = i % cols;
        const row = Math.floor(i / cols);
        pin.x = startX + col * spacingX;
        pin.y = startY + row * spacingY;
      });
    } else if (type === "circle" || type === "radial") {
      const centerX = 500;
      const centerY = 400;
      const radius = Math.max(150, pins.length * 30);
      const angleStep = (Math.PI * 2) / pins.length;

      pins.forEach((pin, i) => {
        pin.x = Math.round(centerX + radius * Math.cos(i * angleStep));
        pin.y = Math.round(centerY + radius * Math.sin(i * angleStep));
      });
    } else if (type === "timeline") {
      // Sort pins with dates chronologically
      const withDates = pins.filter(p => p.date).sort((a, b) => a.date.localeCompare(b.date));
      const withoutDates = pins.filter(p => !p.date);

      let currentX = 100;
      const timelineY = 300;
      withDates.forEach((pin, i) => {
        pin.x = currentX;
        pin.y = timelineY + (i % 2 === 0 ? -80 : 80);
        currentX += 200;
      });

      withoutDates.forEach((pin, i) => {
        pin.x = 100 + i * 180;
        pin.y = timelineY + 250;
      });
    }

    this.saveBoard(board);
    return board;
  }
}

module.exports = BoardStorage;
