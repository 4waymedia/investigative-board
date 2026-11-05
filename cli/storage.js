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
    this.stencilsPath = path.join(this.dataDir, 'stencils.json');
    this.themesPath = path.join(this.dataDir, 'themes.json');
    this.shapesPath = path.join(this.dataDir, 'shapes.json');
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
    if (!fs.existsSync(this.stencilsPath)) {
      const defaultStencils = [
        {
          id: "stencil:suspect",
          category: "Persons",
          title: "Suspect",
          icon: "🕵️",
          badge: "SUSPECT",
          shape: "person",
          typeId: "pin:person",
          color: "#e06c75",
          label: "Suspect Name",
          subtitle: "Person of Interest",
          description: "Alibi unconfirmed. Primary suspect in active investigation.",
          pinScale: 1.15,
          builtIn: true
        },
        {
          id: "stencil:evidence",
          category: "Physical",
          title: "Evidence",
          icon: "🩸",
          badge: "EVIDENCE",
          shape: "diamond",
          typeId: "pin:diamond",
          color: "#ff6b6b",
          label: "Evidence #01",
          subtitle: "Physical Clue",
          description: "Recovered physical evidence tagged for forensic lab analysis.",
          pinScale: 1.05,
          builtIn: true
        },
        {
          id: "stencil:crime-scene",
          category: "Locations",
          title: "Crime Scene",
          icon: "📍",
          badge: "LOCATION",
          shape: "circle",
          typeId: "pin:circle",
          color: "#e5c07b",
          label: "Crime Scene",
          subtitle: "Incident Location",
          description: "Primary point of interest or crime scene location.",
          pinScale: 1.1,
          builtIn: true
        },
        {
          id: "stencil:document",
          category: "Records",
          title: "Document",
          icon: "📄",
          badge: "DOSSIER",
          shape: "rectangle",
          typeId: "text:rectangle",
          color: "#98c379",
          label: "Official Record",
          subtitle: "Bank Wire / Transcript",
          description: "Subpoenaed document, transcript, or communication log.",
          width: 140,
          height: 70,
          builtIn: true
        },
        {
          id: "stencil:timeline-event",
          category: "Chronology",
          title: "Timeline Event",
          icon: "⏳",
          badge: "ALIBI",
          shape: "pill",
          typeId: "pin:pill",
          color: "#61afef",
          label: "11:45 PM Incident",
          subtitle: "Alibi Timestamp",
          description: "Corroborated timestamped event along the case timeline.",
          pinScale: 1.05,
          builtIn: true
        },
        {
          id: "stencil:syndicate",
          category: "Entities",
          title: "Organization",
          icon: "🏢",
          badge: "SYNDICATE",
          shape: "business-building",
          typeId: "pin:business-building",
          color: "#c678dd",
          label: "Holding Corp",
          subtitle: "Entity / Shell Co",
          description: "Suspect enterprise, shell company, or financial entity.",
          pinScale: 1.2,
          builtIn: true
        },
        {
          id: "stencil:hypothesis",
          category: "Theories",
          title: "Hypothesis",
          icon: "💭",
          badge: "THEORY",
          shape: "thought",
          typeId: "text:thought",
          color: "#38bdf8",
          label: "Motive Hypothesis",
          subtitle: "Investigative Lead",
          description: "Lead hypothesis to verify or disprove through evidence.",
          width: 160,
          height: 95,
          builtIn: true
        },
        {
          id: "stencil:perimeter-area",
          category: "Zones",
          title: "Search Zone",
          icon: "⭕",
          badge: "PERIMETER",
          shape: "area-circle",
          typeId: "area:circle",
          color: "#f59e0b",
          label: "Search Perimeter",
          subtitle: "Containment Area",
          description: "Geographic search radius or containment cordon.",
          radius: 120,
          builtIn: true
        }
      ];
      fs.writeFileSync(this.stencilsPath, JSON.stringify(defaultStencils, null, 2), 'utf8');
    }
    if (!fs.existsSync(this.themesPath)) {
      const defaultThemes = [
        {
          id: "dark",
          name: "Studio Dark",
          type: "dark",
          description: "Minimalist ArtCraft dark canvas with high-contrast neon accents",
          canvas: {
            background: "#0d1117",
            gridColor: "rgba(255, 255, 255, 0.03)",
            gridMajorColor: "rgba(255, 255, 255, 0.06)"
          },
          ui: {
            background: "#161b22",
            border: "#30363d",
            text: "#e6edf3",
            textMuted: "#8b949e",
            accent: "#2383e0"
          },
          colorSlots: {
            c1: { name: "Suspect Red", value: "#f85149" },
            c2: { name: "Lead Blue", value: "#58a6ff" },
            c3: { name: "Corroborated Green", value: "#3fb950" },
            c4: { name: "Scene Yellow", value: "#f1c40f" },
            c5: { name: "Syndicate Purple", value: "#a471f7" },
            c6: { name: "Hazard Orange", value: "#ff7b00" },
            c7: { name: "Forensic Pink", value: "#ec4899" },
            c8: { name: "Intel Cyan", value: "#06b6d4" }
          },
          builtIn: true
        },
        {
          id: "light",
          name: "Gallery Light",
          type: "light",
          description: "Clean paper white aesthetic for daytime case analysis",
          canvas: {
            background: "#f6f8fa",
            gridColor: "rgba(0, 0, 0, 0.04)",
            gridMajorColor: "rgba(0, 0, 0, 0.08)"
          },
          ui: {
            background: "#ffffff",
            border: "#d0d7de",
            text: "#1f2328",
            textMuted: "#656d76",
            accent: "#0969da"
          },
          colorSlots: {
            c1: { name: "Suspect Red", value: "#cf222e" },
            c2: { name: "Lead Blue", value: "#0969da" },
            c3: { name: "Corroborated Green", value: "#1a7f37" },
            c4: { name: "Scene Yellow", value: "#9a6700" },
            c5: { name: "Syndicate Purple", value: "#8250df" },
            c6: { name: "Hazard Orange", value: "#bc4c00" },
            c7: { name: "Forensic Pink", value: "#bf3989" },
            c8: { name: "Intel Cyan", value: "#057a8c" }
          },
          builtIn: true
        },
        {
          id: "midnight",
          name: "Deep Midnight",
          type: "dark",
          description: "OLED pitch black background with deep sapphire highlights",
          canvas: {
            background: "#05070a",
            gridColor: "rgba(56, 189, 248, 0.04)",
            gridMajorColor: "rgba(56, 189, 248, 0.08)"
          },
          ui: {
            background: "#0c111a",
            border: "#1e293b",
            text: "#f8fafc",
            textMuted: "#94a3b8",
            accent: "#38bdf8"
          },
          colorSlots: {
            c1: { name: "Crimson", value: "#fb7185" },
            c2: { name: "Sky", value: "#38bdf8" },
            c3: { name: "Emerald", value: "#34d399" },
            c4: { name: "Amber", value: "#fbbf24" },
            c5: { name: "Violet", value: "#c084fc" },
            c6: { name: "Coral", value: "#fb923c" },
            c7: { name: "Fuchsia", value: "#f472b6" },
            c8: { name: "Teal", value: "#2dd4bf" }
          },
          builtIn: true
        },
        {
          id: "sepia",
          name: "Vintage Dossier",
          type: "light",
          description: "1940s noir detective paperboard warm sepia tone",
          canvas: {
            background: "#f4ede4",
            gridColor: "rgba(120, 80, 40, 0.06)",
            gridMajorColor: "rgba(120, 80, 40, 0.12)"
          },
          ui: {
            background: "#e8dfd2",
            border: "#c4b5a0",
            text: "#3c2e22",
            textMuted: "#7a6755",
            accent: "#8c532b"
          },
          colorSlots: {
            c1: { name: "Blood Rust", value: "#a83232" },
            c2: { name: "Ink Blue", value: "#2d527c" },
            c3: { name: "Moss", value: "#4e7041" },
            c4: { name: "Ochre", value: "#b07e2a" },
            c5: { name: "Plum", value: "#6e3f6e" },
            c6: { name: "Sienna", value: "#99582a" },
            c7: { name: "Rosewood", value: "#8b4558" },
            c8: { name: "Slate", value: "#4a6b6c" }
          },
          builtIn: true
        }
      ];
      fs.writeFileSync(this.themesPath, JSON.stringify(defaultThemes, null, 2), 'utf8');
    }
    if (!fs.existsSync(this.shapesPath)) {
      const defaultShapes = [
        {
          name: "star",
          description: "5-pointed investigative star / key evidence marker",
          baseShape: "circle",
          width: 24,
          height: 24,
          builtIn: true
        },
        {
          name: "shield",
          description: "Protective shield / security / law enforcement emblem",
          baseShape: "rect",
          width: 24,
          height: 28,
          builtIn: true
        },
        {
          name: "cross",
          description: "Medical / emergency / forensic point of interest",
          baseShape: "rect",
          width: 20,
          height: 20,
          builtIn: true
        }
      ];
      fs.writeFileSync(this.shapesPath, JSON.stringify(defaultShapes, null, 2), 'utf8');
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
    title = "",
    subtitle = "",
    note = "",
    description = "",
    color = "#58a6ff",
    shape = "circle",
    typeId = "pin:circle",
    badge = null,
    date = "",
    width = 120,
    height = 60,
    radius = null,
    pinScale = 1,
    customFields = {}
  } = {}) {
    const board = this.getBoard(boardId);
    if (!board) throw new Error(`Board not found: ${boardId}`);

    const newPin = {
      id: Date.now() + "_" + Math.random().toString(36).substr(2, 4),
      x: Number(x) || 0,
      y: Number(y) || 0,
      label: label || "",
      title: title || "",
      subtitle: subtitle || "",
      note: note || "",
      description: description || "",
      color: color || "#58a6ff",
      colorSlot: "c2",
      shape: shape || "circle",
      typeId: typeId || "pin:circle",
      badge: badge || null,
      date: date || "",
      width: Number(width) || 120,
      height: Number(height) || 60,
      radius: radius !== null && radius !== undefined ? Number(radius) : undefined,
      pinScale: Number(pinScale) || 1,
      customFields: customFields || {}
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

  // ==========================================================================
  // ARTCRAFT AGENT EXTENSIONS: STENCILS, THEMES & CUSTOM SHAPES
  // ==========================================================================

  listStencils({ category = null, query = "" } = {}) {
    this._ensureDirectories();
    let stencils = [];
    try {
      if (fs.existsSync(this.stencilsPath)) {
        stencils = JSON.parse(fs.readFileSync(this.stencilsPath, 'utf8'));
      }
    } catch (e) {
      stencils = [];
    }

    if (category) {
      stencils = stencils.filter(s => s.category && s.category.toLowerCase() === category.toLowerCase());
    }

    if (query) {
      const q = query.toLowerCase();
      stencils = stencils.filter(s =>
        (s.title && s.title.toLowerCase().includes(q)) ||
        (s.badge && s.badge.toLowerCase().includes(q)) ||
        (s.description && s.description.toLowerCase().includes(q)) ||
        (s.label && s.label.toLowerCase().includes(q))
      );
    }

    return stencils;
  }

  getStencil(stencilId) {
    const list = this.listStencils();
    return list.find(s => s.id === stencilId) || null;
  }

  saveStencil(stencilDef) {
    if (!stencilDef || !stencilDef.title) {
      throw new Error("Stencil must have at least a title");
    }

    const id = stencilDef.id || `stencil:${stencilDef.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
    const list = this.listStencils();
    const existingIndex = list.findIndex(s => s.id === id);

    const fullStencil = {
      id,
      category: stencilDef.category || "Custom",
      title: stencilDef.title.trim(),
      icon: stencilDef.icon || "📌",
      badge: (stencilDef.badge || stencilDef.title.toUpperCase()).slice(0, 12),
      shape: stencilDef.shape || "circle",
      typeId: stencilDef.typeId || `pin:${stencilDef.shape || "circle"}`,
      color: stencilDef.color || "#58a6ff",
      label: stencilDef.label || stencilDef.title,
      subtitle: stencilDef.subtitle || "AI Generated Clue",
      description: stencilDef.description || "Generated investigative stencil preset.",
      pinScale: Number(stencilDef.pinScale) || 1.0,
      width: stencilDef.width ? Number(stencilDef.width) : undefined,
      height: stencilDef.height ? Number(stencilDef.height) : undefined,
      radius: stencilDef.radius ? Number(stencilDef.radius) : undefined,
      customFields: stencilDef.customFields || {},
      created: stencilDef.created || new Date().toISOString(),
      lastModified: new Date().toISOString()
    };

    if (existingIndex >= 0) {
      list[existingIndex] = { ...list[existingIndex], ...fullStencil };
    } else {
      list.push(fullStencil);
    }

    fs.writeFileSync(this.stencilsPath, JSON.stringify(list, null, 2), 'utf8');
    return fullStencil;
  }

  deleteStencil(stencilId) {
    const list = this.listStencils();
    const target = list.find(s => s.id === stencilId);
    if (!target) return false;
    if (target.builtIn) {
      throw new Error("Cannot delete built-in stencil");
    }

    const filtered = list.filter(s => s.id !== stencilId);
    fs.writeFileSync(this.stencilsPath, JSON.stringify(filtered, null, 2), 'utf8');
    return true;
  }

  applyStencil(boardId, {
    stencilId,
    x = 100,
    y = 100,
    label = null,
    description = null,
    color = null,
    title = null
  } = {}) {
    const stencil = this.getStencil(stencilId);
    if (!stencil) throw new Error(`Stencil not found: ${stencilId}`);

    const targetLabel = label !== null ? label : stencil.label;
    const targetDesc = description !== null ? description : stencil.description;
    const targetColor = color !== null ? color : stencil.color;

    const pinPayload = {
      x: Number(x) || 100,
      y: Number(y) || 100,
      label: targetLabel,
      title: title || stencil.title,
      subtitle: stencil.subtitle,
      description: targetDesc,
      note: targetDesc,
      color: targetColor,
      shape: stencil.shape,
      typeId: stencil.typeId,
      badge: stencil.badge,
      pinScale: stencil.pinScale || 1.0,
      width: stencil.width,
      height: stencil.height,
      radius: stencil.radius
    };

    return this.addPin(boardId, pinPayload);
  }

  listThemes() {
    this._ensureDirectories();
    try {
      if (fs.existsSync(this.themesPath)) {
        return JSON.parse(fs.readFileSync(this.themesPath, 'utf8'));
      }
    } catch (e) {
      return [];
    }
    return [];
  }

  getTheme(themeId) {
    const list = this.listThemes();
    return list.find(t => t.id === themeId) || null;
  }

  saveTheme(themeDef) {
    if (!themeDef || !themeDef.id || !themeDef.name) {
      throw new Error("Theme must specify at least 'id' and 'name'");
    }

    const list = this.listThemes();
    const existingIndex = list.findIndex(t => t.id === themeDef.id);

    const fullTheme = {
      id: themeDef.id.trim().toLowerCase(),
      name: themeDef.name.trim(),
      type: themeDef.type === "light" ? "light" : "dark",
      description: themeDef.description || "ArtCraft custom visual theme",
      canvas: {
        background: themeDef.canvas?.background || (themeDef.type === "light" ? "#f6f8fa" : "#0d1117"),
        gridColor: themeDef.canvas?.gridColor || (themeDef.type === "light" ? "rgba(0,0,0,0.04)" : "rgba(255,255,255,0.03)"),
        gridMajorColor: themeDef.canvas?.gridMajorColor || (themeDef.type === "light" ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.06)")
      },
      ui: {
        background: themeDef.ui?.background || (themeDef.type === "light" ? "#ffffff" : "#161b22"),
        border: themeDef.ui?.border || (themeDef.type === "light" ? "#d0d7de" : "#30363d"),
        text: themeDef.ui?.text || (themeDef.type === "light" ? "#1f2328" : "#e6edf3"),
        textMuted: themeDef.ui?.textMuted || (themeDef.type === "light" ? "#656d76" : "#8b949e"),
        accent: themeDef.ui?.accent || (themeDef.type === "light" ? "#0969da" : "#2383e0")
      },
      colorSlots: themeDef.colorSlots || {
        c1: { name: "Suspect Red", value: "#f85149" },
        c2: { name: "Lead Blue", value: "#58a6ff" },
        c3: { name: "Corroborated Green", value: "#3fb950" },
        c4: { name: "Scene Yellow", value: "#f1c40f" },
        c5: { name: "Syndicate Purple", value: "#a471f7" },
        c6: { name: "Hazard Orange", value: "#ff7b00" },
        c7: { name: "Forensic Pink", value: "#ec4899" },
        c8: { name: "Intel Cyan", value: "#06b6d4" }
      },
      created: themeDef.created || new Date().toISOString(),
      lastModified: new Date().toISOString()
    };

    if (existingIndex >= 0) {
      list[existingIndex] = { ...list[existingIndex], ...fullTheme };
    } else {
      list.push(fullTheme);
    }

    fs.writeFileSync(this.themesPath, JSON.stringify(list, null, 2), 'utf8');
    return fullTheme;
  }

  applyTheme(boardId, themeId) {
    const board = this.getBoard(boardId);
    if (!board) throw new Error(`Board not found: ${boardId}`);

    const theme = this.getTheme(themeId);
    if (!theme) throw new Error(`Theme not found: ${themeId}`);

    board.document.currentThemeId = themeId;
    if (theme.colorSlots) {
      board.document.palette = Object.entries(theme.colorSlots).map(([slotKey, slot]) => ({
        slot: slotKey,
        name: slot.name || slotKey,
        value: slot.value
      }));
    }

    this.saveBoard(board);
    return { board, theme };
  }

  listShapes() {
    this._ensureDirectories();
    try {
      if (fs.existsSync(this.shapesPath)) {
        return JSON.parse(fs.readFileSync(this.shapesPath, 'utf8'));
      }
    } catch (e) {
      return [];
    }
    return [];
  }

  getShape(name) {
    const list = this.listShapes();
    return list.find(s => s.name === name) || null;
  }

  saveShape(shapeDef) {
    if (!shapeDef || !shapeDef.name) {
      throw new Error("Shape definition must include 'name'");
    }

    const list = this.listShapes();
    const name = shapeDef.name.trim().toLowerCase();
    const existingIndex = list.findIndex(s => s.name === name);

    const fullShape = {
      name,
      description: shapeDef.description || `Custom shape ${name}`,
      baseShape: shapeDef.baseShape === "rect" ? "rect" : "circle",
      width: Number(shapeDef.width) || 24,
      height: Number(shapeDef.height) || 24,
      pathData: shapeDef.pathData || null,
      iconSvg: shapeDef.iconSvg || null,
      drawCommands: shapeDef.drawCommands || null,
      created: shapeDef.created || new Date().toISOString()
    };

    if (existingIndex >= 0) {
      list[existingIndex] = { ...list[existingIndex], ...fullShape };
    } else {
      list.push(fullShape);
    }

    fs.writeFileSync(this.shapesPath, JSON.stringify(list, null, 2), 'utf8');
    return fullShape;
  }
}

module.exports = BoardStorage;
