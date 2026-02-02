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

  // Text types
  {
    id: "text:plain",
    label: "Plain Text",
    icon: "📝",
    family: "text",
    variant: "plain",
    shape: "text-plain", // No background, just text
  },
  {
    id: "text:rectangle",
    label: "Rectangle",
    icon: "▭",
    family: "text",
    variant: "rectangle",
    shape: "rectangle", // Rounded rectangle without tail
  },
  {
    id: "text:comic",
    label: "Comic Bubble",
    icon: "💬",
    family: "text",
    variant: "comic",
    shape: "bubble", // Speech bubble with tail
  },
  {
    id: "text:thought",
    label: "Thought Bubble",
    icon: "💭",
    family: "text",
    variant: "thought",
    shape: "thought", // Cloud-shaped thought bubble with trailing circles
  },
  {
    id: "text:title",
    label: "Title",
    icon: "📰",
    family: "text",
    variant: "title",
    shape: "text-title", // Large title text, no container
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
// RELATIONSHIP TYPES - Semantic types for connections
// ============================================================================

const RELATIONSHIP_TYPES = [
  { id: "none", label: "None", icon: "—", description: "No specific relationship" },
  { id: "causes", label: "Causes", icon: "→", description: "A causes or leads to B" },
  { id: "correlates", label: "Correlates", icon: "↔", description: "A and B are correlated" },
  { id: "contradicts", label: "Contradicts", icon: "✕", description: "A contradicts or opposes B" },
  { id: "supports", label: "Supports", icon: "✓", description: "A supports or confirms B" },
  { id: "contains", label: "Contains", icon: "⊃", description: "A contains or includes B" },
  { id: "partOf", label: "Part Of", icon: "⊂", description: "A is part of B" },
  { id: "relatedTo", label: "Related To", icon: "~", description: "A is related to B" },
  { id: "precedes", label: "Precedes", icon: "◀", description: "A happens before B" },
  { id: "follows", label: "Follows", icon: "▶", description: "A happens after B" },
  { id: "influences", label: "Influences", icon: "⇝", description: "A influences B" },
  { id: "dependsOn", label: "Depends On", icon: "⤓", description: "A depends on B" },
  { id: "knows", label: "Knows", icon: "👤", description: "Person A knows person B" },
  { id: "worksFor", label: "Works For", icon: "🏢", description: "A works for/at B" },
  { id: "funds", label: "Funds", icon: "💰", description: "A funds or finances B" },
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

  // Text types - shape property matches NODE_TYPES shape
  "text:plain": { shape: "text-plain", baseRadius: 12, defaultWidth: 150, defaultHeight: 30 },
  "text:rectangle": { shape: "rectangle", baseRadius: 12, defaultWidth: 120, defaultHeight: 60 },
  "text:comic": { shape: "bubble", baseRadius: 12, defaultWidth: 140, defaultHeight: 70 },
  "text:thought": { shape: "thought", baseRadius: 12, defaultWidth: 140, defaultHeight: 90 },
  "text:title": { shape: "text-title", baseRadius: 16, defaultWidth: 200, defaultHeight: 40 },
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
window.STORAGE_KEY = STORAGE_KEY;
window.MAX_HISTORY = MAX_HISTORY;
window.DEFAULT_COLORS = DEFAULT_COLORS;
window.DEFAULT_CARDS = DEFAULT_CARDS;
window.NODE_TYPES = NODE_TYPES;
window.TEXT_TYPES = TEXT_TYPES;
window.CONNECTION_TYPES = CONNECTION_TYPES;
window.RELATIONSHIP_TYPES = RELATIONSHIP_TYPES;
window.PIN_BASES = PIN_BASES;
