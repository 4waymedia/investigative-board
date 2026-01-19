// ============================================================================
// CONSTANTS MODULE - Application-wide constants and configuration
// ============================================================================

// ============================================================================
// UI DIMENSIONS & LAYOUT
// ============================================================================

const MENU_HEIGHT = 75; // Top menu bar height (55px content + 10px top + 10px bottom padding)
const TRAY_HEIGHT = 180; // Bottom card tray height (matches CSS)
const MIN_SCALE = 0.1; // Minimum zoom level
const MAX_SCALE = 10; // Maximum zoom level
const PAN_SPEED = 2; // Base pan speed multiplier (adjusted by zoom level)

// ============================================================================
// STORAGE & PERSISTENCE
// ============================================================================

const STORAGE_KEY = "msc-investigativeboard"; // localStorage key for persistence
const MAX_HISTORY = 40; // Maximum undo history entries

// ============================================================================
// COLOR PALETTES
// ============================================================================

const DEFAULT_COLORS = [
  { name: "Red", value: "#f85149" },
  { name: "Blue", value: "#58a6ff" },
  { name: "Green", value: "#3fb950" },
  { name: "Yellow", value: "#f1c40f" },
  { name: "Purple", value: "#a471f7" },
];

// ============================================================================
// NODE TYPES DEFINITIONS
// ============================================================================

const NODE_TYPES = [
  // Pin types
  {
    id: "pin:circle",
    label: "Circle Pin",
    icon: "●",
    family: "pin",
    variant: "circle",
  },
  {
    id: "pin:square",
    label: "Square Pin",
    icon: "■",
    family: "pin",
    variant: "square",
  },
  {
    id: "pin:pill",
    label: "Pill Pin",
    icon: "▭",
    family: "pin",
    variant: "pill",
  },
  {
    id: "pin:diamond",
    label: "Diamond Pin",
    icon: "◆",
    family: "pin",
    variant: "diamond",
  },
  {
    id: "pin:person",
    label: "Person Pin",
    icon: "👤",
    family: "pin",
    variant: "person",
  },
  {
    id: "pin:business-building",
    label: "Business Building Pin",
    icon: "🏢",
    family: "pin",
    variant: "business-building",
  },

  // Card types
  {
    id: "card:card",
    label: "Note Card",
    icon: "▤",
    family: "card",
    variant: "card",
  },
  {
    id: "card:doc",
    label: "Doc Card",
    icon: "📄",
    family: "card",
    variant: "document",
  },
  {
    id: "card:folder",
    label: "Folder Card",
    icon: "📁",
    family: "card",
    variant: "folder",
  },

  // Area types
  {
    id: "area:circle",
    label: "Circle Area",
    icon: "⭕",
    family: "area",
    variant: "circle",
  },
  {
    id: "area:square",
    label: "Square Area",
    icon: "▢",
    family: "area",
    variant: "square",
  },
];

// ============================================================================
// TEXT TYPES
// ============================================================================

const TEXT_TYPES = [
  { id: "plain", label: "Plain", icon: "📝" },
  { id: "rectangle", label: "Rectangle", icon: "▭" },
  { id: "comic", label: "Comic", icon: "💬" },
  { id: "title", label: "Title", icon: "📰" },
];

// DRAW_PHASES is defined in drawing.js for the rendering pipeline

// ============================================================================
// CONNECTION TYPES
// ============================================================================

const CONNECTION_TYPES = [
  { id: "straight", label: "Straight", icon: "━" },
  { id: "curved", label: "Curved", icon: "⤴" },
];

// ============================================================================
// PIN BASE PROPERTIES (for hit detection and rendering)
// ============================================================================

const PIN_BASES = {
  // Pin types
  "pin:circle": { shape: "circle", baseRadius: 9 },
  "pin:square": { shape: "rect", baseRadius: 8 },
  "pin:pill": { shape: "pill", baseRadius: 10 },
  "pin:diamond": { shape: "diamond", baseRadius: 9 },
  "pin:person": { shape: "person", baseRadius: 9 },
  "pin:business-building": { shape: "business-building", baseRadius: 8 },

  // Card types
  "card:card": { shape: "card", baseRadius: 10 },
  "card:doc": { shape: "card", baseRadius: 10 },
  "card:folder": { shape: "card", baseRadius: 10 },

  // Area types
  "area:circle": { shape: "area-circle", baseRadius: 12 },
  "area:square": { shape: "area-rect", baseRadius: 12 },
};

// ============================================================================
// DEFAULT CARDS DATA
// ============================================================================

const DEFAULT_CARDS = [
  {
    id: 0,
    title: "Project Orion",
    subtitle: "Classified propulsion research 1958–1965",
    date: "1958",
    icon: "★",
    color: "#f85149",
    category: "event",
    used: false,
  },
  {
    id: 1,
    title: "MKUltra",
    subtitle: "CIA mind control program using LSD",
    date: "1953–1973",
    icon: "⚙️",
    color: "#a471f7",
    category: "program",
    used: false,
  },
  {
    id: 2,
    title: "Roswell Incident",
    subtitle: "Alleged UFO crash retrieval",
    date: "Jul 1947",
    icon: "🔔",
    color: "#58a6ff",
    category: "incident",
    used: false,
  },
  {
    id: 3,
    title: "Operation Paperclip",
    subtitle: "US recruitment of Nazi scientists",
    date: "1945–1959",
    icon: "✈️",
    color: "#f1c40f",
    category: "operation",
    used: false,
  },
  {
    id: 4,
    title: "Area 51",
    subtitle: "Highly classified USAF facility",
    date: "1955–",
    icon: "🔒",
    color: "#3fb950",
    category: "facility",
    used: false,
  },
];

// ============================================================================
// GLOBAL EXPORTS
// ============================================================================

window.MENU_HEIGHT = MENU_HEIGHT;
window.TRAY_HEIGHT = TRAY_HEIGHT;
window.MIN_SCALE = MIN_SCALE;
window.MAX_SCALE = MAX_SCALE;
window.PAN_SPEED = PAN_SPEED;
window.STORAGE_KEY = STORAGE_KEY;
window.MAX_HISTORY = MAX_HISTORY;
window.DEFAULT_COLORS = DEFAULT_COLORS;
window.DEFAULT_CARDS = DEFAULT_CARDS;
window.NODE_TYPES = NODE_TYPES;
window.TEXT_TYPES = TEXT_TYPES;
window.CONNECTION_TYPES = CONNECTION_TYPES;
window.PIN_BASES = PIN_BASES;
