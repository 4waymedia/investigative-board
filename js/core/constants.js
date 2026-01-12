// ============================================================================
// CONSTANTS MODULE - Application-wide constants and configuration
// ============================================================================

// ============================================================================
// UI DIMENSIONS & LAYOUT
// ============================================================================

export const MENU_HEIGHT = 50; // Top menu bar height (matches CSS)
export const TRAY_HEIGHT = 200; // Bottom card tray height (matches CSS)
export const MIN_SCALE = 0.1; // Minimum zoom level
export const MAX_SCALE = 5; // Maximum zoom level

// ============================================================================
// STORAGE & PERSISTENCE
// ============================================================================

export const STORAGE_KEY = "investigativeBoardState"; // localStorage key for persistence
export const MAX_HISTORY = 100; // Maximum undo history entries

// ============================================================================
// COLOR PALETTES
// ============================================================================

export const DEFAULT_COLORS = [
  { name: "Red", value: "#f85149" },
  { name: "Blue", value: "#58a6ff" },
  { name: "Green", value: "#3fb950" },
  { name: "Yellow", value: "#f1c40f" },
  { name: "Purple", value: "#a471f7" },
];

// ============================================================================
// NODE TYPES DEFINITIONS
// ============================================================================

export const NODE_TYPES = [
  // Pin types
  { id: "pin:circle", label: "Circle Pin", icon: "●", family: "pin", variant: "circle" },
  { id: "pin:square", label: "Square Pin", icon: "■", family: "pin", variant: "square" },
  { id: "pin:pill", label: "Pill Pin", icon: "▭", family: "pin", variant: "pill" },
  { id: "pin:diamond", label: "Diamond Pin", icon: "◆", family: "pin", variant: "diamond" },
  { id: "pin:person", label: "Person Pin", icon: "👤", family: "pin", variant: "person" },
  { id: "pin:business-building", label: "Business Building Pin", icon: "🏢", family: "pin", variant: "business-building" },

  // Card types
  { id: "card:card", label: "Note Card", icon: "▤", family: "card", variant: "card" },
  { id: "card:doc", label: "Doc Card", icon: "📄", family: "card", variant: "document" },
  { id: "card:folder", label: "Folder Card", icon: "📁", family: "card", variant: "folder" },

  // Area types
  { id: "area:circle", label: "Circle Area", icon: "⭕", family: "area", variant: "circle" },
  { id: "area:square", label: "Square Area", icon: "▢", family: "area", variant: "square" },
];

// ============================================================================
// TEXT TYPES
// ============================================================================

export const TEXT_TYPES = [
  { id: "plain", label: "Plain", icon: "📝" },
  { id: "rectangle", label: "Rectangle", icon: "▭" },
  { id: "comic", label: "Comic", icon: "💬" },
  { id: "title", label: "Title", icon: "📰" },
];

// ============================================================================
// DRAWING PHASES (for rendering pipeline)
// ============================================================================

export const DRAW_PHASES = {
  BACKGROUND: 'background',
  CONNECTIONS: 'connections',
  PINS: 'pins',
  TEXT: 'text',
  UI: 'ui'
};

// ============================================================================
// CONNECTION TYPES
// ============================================================================

export const CONNECTION_TYPES = [
  { id: "straight", label: "Straight", icon: "━" },
  { id: "curved", label: "Curved", icon: "⤴" },
];
