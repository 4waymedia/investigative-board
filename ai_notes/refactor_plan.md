// ============================================================================
// REFACTORING PLAN - Investigative Board Application
// ============================================================================
// This document outlines the modular structure for refactoring the app

/_
SUGGESTED FILE STRUCTURE:
├── index.html (minimal, just loads modules)
├── js/
│ ├── core/
│ │ ├── constants.js - All constants (MENU_HEIGHT, colors, etc.)
│ │ ├── state.js - Application state management
│ │ ├── storage.js - localStorage persistence
│ │ └── utils.js - Helper functions (coordinate transforms, etc.)
│ ├── domain/
│ │ ├── pins.js - Pin operations (find, create, delete, metrics)
│ │ ├── connections.js - Connection management
│ │ ├── cards.js - Card system
│ │ ├── text.js - Text elements
│ │ ├── themes.js - Theme system
│ │ └── nodeTypes.js - Node type definitions
│ ├── ui/
│ │ ├── canvas.js - Main canvas rendering
│ │ ├── drawing.js - Drawing utilities (shapes, colors)
│ │ ├── toolbar.js - Top toolbar/menu
│ │ ├── modals/ - All modal dialogs
│ │ │ ├── pinModal.js
│ │ │ ├── cardModal.js
│ │ │ ├── textModal.js
│ │ │ └── loadModal.js
│ │ └── radialMenu.js - Context menu
│ ├── layouts/
│ │ ├── forceLayout.js - Force-directed layout
│ │ ├── radialLayout.js - Radial mind map
│ │ ├── affinityLayout.js - Cluster layout
│ │ └── timeline.js - Timeline view
│ ├── events/
│ │ ├── mouse.js - Mouse event handlers
│ │ ├── keyboard.js - Keyboard shortcuts
│ │ └── dragDrop.js - Drag and drop
│ └── main.js - Application entry point
└── css/
└── board-styles.css (existing)
_/

// ============================================================================
// EXAMPLE: js/core/constants.js
// ============================================================================

export const MENU_HEIGHT = 50;
export const TRAY_HEIGHT = 200;
export const MIN_SCALE = 0.1;
export const MAX_SCALE = 5;
export const STORAGE_KEY = "investigative-board-state";

export const DEFAULT_COLORS = [
{ name: "Red", value: "#f85149" },
{ name: "Blue", value: "#58a6ff" },
{ name: "Green", value: "#3fb950" },
{ name: "Yellow", value: "#f1c40f" },
{ name: "Purple", value: "#a471f7" },
];

export const NODE_TYPES = [
{ id: "pin:circle", label: "Circle Pin", icon: "●", family: "pin", variant: "circle" },
{ id: "pin:square", label: "Square Pin", icon: "■", family: "pin", variant: "square" },
{ id: "pin:pill", label: "Pill Pin", icon: "▭", family: "pin", variant: "pill" },
{ id: "pin:diamond", label: "Diamond Pin", icon: "◆", family: "pin", variant: "diamond" },
{ id: "pin:person", label: "Person Pin", icon: "👤", family: "pin", variant: "person" },
{ id: "pin:business-building", label: "Business Building Pin", icon: "🏢", family: "pin", variant: "business-building" },
{ id: "card:card", label: "Note Card", icon: "▤", family: "card", variant: "card" },
{ id: "card:doc", label: "Doc Card", icon: "📄", family: "card", variant: "document" },
{ id: "card:folder", label: "Folder Card", icon: "📁", family: "card", variant: "folder" },
{ id: "area:circle", label: "Circle Area", icon: "⭕", family: "area", variant: "circle" },
{ id: "area:square", label: "Square Area", icon: "▢", family: "area", variant: "square" },
];

export const TEXT_TYPES = [
{ id: "plain", label: "Plain", icon: "📝" },
{ id: "rectangle", label: "Rectangle", icon: "▭" },
{ id: "comic", label: "Comic", icon: "💬" },
{ id: "title", label: "Title", icon: "📰" },
];

// ============================================================================
// EXAMPLE: js/core/state.js
// ============================================================================

export class AppState {
constructor() {
// View/Camera State
this.scale = 1;
this.offsetX = 0;
this.offsetY = 0;

    // Data State
    this.pins = [];
    this.connections = [];
    this.cards = [];
    this.textElements = [];
    this.history = [];

    // Selection State
    this.selectedPinIndex = null;
    this.selectedPins = [];
    this.selectedTextIndex = null;
    this.connectStartIndex = null;

    // Marquee Selection State
    this.marqueeStart = null;
    this.marqueeEnd = null;

    // Interaction State
    this.mouseScreenX = 0;
    this.mouseScreenY = 0;
    this.didDrag = false;
    this.time = 0;

    // Tool State
    this.currentTool = "pin";
    this.currentFamily = "pin";
    this.currentTypeId = "pin:circle";
    this.selectedColor = "#58a6ff";
    this.connectionType = "straight";

    // Theme State
    this.currentThemeId = "default";
    this.palette = [];

}

// History management
saveHistory() {
const snapshot = {
pins: JSON.parse(JSON.stringify(this.pins)),
connections: JSON.parse(JSON.stringify(this.connections)),
textElements: JSON.parse(JSON.stringify(this.textElements)),
};
this.history.push(snapshot);
if (this.history.length > 50) this.history.shift();
}

undo() {
if (this.history.length > 0) {
const snapshot = this.history.pop();
this.pins = snapshot.pins;
this.connections = snapshot.connections;
this.textElements = snapshot.textElements;
this.selectedPinIndex = null;
this.selectedPins = [];
return true;
}
return false;
}

// Selection helpers
setSelectedPin(index) {
if (typeof index === "number" && index !== null && index !== undefined) {
this.selectedPinIndex = index;
this.selectedPins = [index];
} else {
this.selectedPinIndex = null;
this.selectedPins = [];
}
}

clearSelection() {
this.selectedPinIndex = null;
this.selectedPins = [];
this.selectedTextIndex = null;
this.connectStartIndex = null;
}
}

// ============================================================================
// EXAMPLE: js/core/utils.js
// ============================================================================

export function worldToScreen(x, y, state) {
return {
x: x _ state.scale + state.offsetX,
y: y _ state.scale + state.offsetY
};
}

export function screenToWorld(sx, sy, state) {
return {
x: (sx - state.offsetX) / state.scale,
y: (sy - state.offsetY) / state.scale
};
}

export function lightenColor(hex, percent) {
const num = parseInt(hex.slice(1), 16);
const amt = Math.round(2.55 _ percent);
const R = (num >> 16) + amt;
const G = ((num >> 8) & 0x00ff) + amt;
const B = (num & 0x0000ff) + amt;
return (
"#" +
(
0x1000000 +
(R < 255 ? R : 255) _ 0x10000 +
(G < 255 ? G : 255) \* 0x100 +
(B < 255 ? B : 255)
)
.toString(16)
.slice(1)
);
}

export function darkenColor(hex, percent) {
const num = parseInt(hex.slice(1), 16);
const amt = Math.round(2.55 _ percent);
const R = Math.max(0, Math.min(255, (num >> 16) - amt));
const G = Math.max(0, Math.min(255, ((num >> 8) & 0x00ff) - amt));
const B = Math.max(0, Math.min(255, (num & 0x0000ff) - amt));
return (
"#" + (0x1000000 + R _ 0x10000 + G \* 0x100 + B).toString(16).slice(1)
);
}

export function generateColorVariants(hex) {
return {
light: lightenColor(hex, 40),
contrast: hex,
dark: darkenColor(hex, 30),
};
}

export function roundRectPath(ctx, x, y, w, h, r) {
ctx.beginPath();
ctx.moveTo(x + r, y);
ctx.lineTo(x + w - r, y);
ctx.quadraticCurveTo(x + w, y, x + w, y + r);
ctx.lineTo(x + w, y + h - r);
ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
ctx.lineTo(x + r, y + h);
ctx.quadraticCurveTo(x, y + h, x, y + h - r);
ctx.lineTo(x, y + r);
ctx.quadraticCurveTo(x, y, x + r, y);
ctx.closePath();
}

// ============================================================================
// EXAMPLE: js/domain/pins.js
// ============================================================================

import { NODE_TYPES } from '../core/constants.js';

export function getNodeType(id) {
return NODE_TYPES.find((t) => t.id === id) || NODE_TYPES[0];
}

export function getPinMetrics(pin) {
const typeId = pin.typeId || "pin:circle";
const base = PIN_BASES[typeId];

if (!base) {
console.warn(`Unknown pin type "${typeId}"`);
// Return fallback
}

const typeDetail = getNodeType(typeId);
const pinScale = !typeId.startsWith("area:") ? pin.pinScale || 1 : 1;

return {
shape: base.shape,
baseRadius: base.baseRadius,
variant: typeDetail.variant,
radius: (pin.radius || base.baseRadius) _ pinScale,
width: (pin.width || base.baseWidth) _ pinScale,
height: (pin.height || base.baseHeight) \* pinScale,
};
}

export function findPinAt(wx, wy, pins) {
for (let i = pins.length - 1; i >= 0; i--) {
const pin = pins[i];
if (!pin) continue;

    const metrics = getPinMetrics(pin);
    const shape = metrics.shape;

    if (shape === "card" || shape === "rect" || shape === "pill") {
      const w = metrics.width || 46;
      const h = metrics.height || 30;
      const padding = Math.max(w, h) * 0.2;
      const halfW = w / 2 + padding;
      const halfH = h / 2 + padding;

      if (
    	wx >= pin.x - halfW &&
    	wx <= pin.x + halfW &&
    	wy >= pin.y - halfH &&
    	wy <= pin.y + halfH
      ) {
    	return i;
      }
    } else {
      const r = metrics.radius || 10;
      if (Math.hypot(wx - pin.x, wy - pin.y) < r) {
    	return i;
      }
    }

}
return null;
}

export function deletePin(index, state) {
const removedPin = state.pins[index];

if (removedPin && removedPin.cardId != null) {
const card = state.cards.find((c) => c.id === removedPin.cardId);
if (card) card.used = false;
}

state.pins.splice(index, 1);

// Adjust connections
state.connections = state.connections
.filter((c) => c.startIndex !== index && c.endIndex !== index)
.map((c) => {
const nc = { ...c };
if (nc.startIndex > index) nc.startIndex--;
if (nc.endIndex > index) nc.endIndex--;
return nc;
});
}

// ============================================================================
// KEY BENEFITS OF THIS REFACTORING:
// ============================================================================
/\*

1. MODULARITY: Each file has a single responsibility
2. TESTABILITY: Functions can be unit tested in isolation
3. MAINTAINABILITY: Easier to find and fix bugs
4. REUSABILITY: Modules can be imported where needed
5. SCALABILITY: Easy to add new features without affecting existing code
6. COLLABORATION: Multiple developers can work on different modules
7. CODE CLARITY: Smaller files are easier to understand
8. PERFORMANCE: Can lazy-load modules as needed
   \*/

// ============================================================================
// MIGRATION STRATEGY:
// ============================================================================
/\*
PHASE 1: Extract constants and utilities (no breaking changes)

- Move constants to constants.js
- Move utility functions to utils.js
- Test that everything still works

PHASE 2: Extract state management

- Create AppState class
- Gradually replace global variables with state object
- Test each replacement

PHASE 3: Extract domain logic

- Move pin operations to pins.js
- Move connection operations to connections.js
- Move card operations to cards.js
- Test each module

PHASE 4: Extract UI components

- Move modal logic to separate files
- Move rendering logic to canvas.js
- Move menu logic to toolbar.js
- Test UI functionality

PHASE 5: Extract event handlers

- Move mouse handlers to mouse.js
- Move keyboard handlers to keyboard.js
- Test all interactions

PHASE 6: Extract layout algorithms

- Move force layout to forceLayout.js
- Move other layouts to their files
- Test all layouts

PHASE 7: Clean up and optimize

- Remove duplicate code
- Add JSDoc comments
- Optimize performance
- Final testing
  \*/
