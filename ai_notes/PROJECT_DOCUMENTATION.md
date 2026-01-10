# Investigative Board - Project Documentation

## Overview

The Investigative Board is an interactive canvas-based visualization application designed for creating timelines, keyword associations, and conversation flow diagrams. It provides a flexible pin-and-connection system with advanced layout algorithms for organizing complex information visually.

**Main Entry Point:** `index.html`

---

## File Structure

```
investigative-board/
├── index.html              # Main application file (primary working version)
├── css/
│   └── board-styles.css    # Stylesheet for UI components
├── js/
│   ├── layoutWorker.js     # Web Worker for force-directed layout calculations
│   └── layoutWorker copy.js # Backup copy
├── ai_notes/               # Documentation and notes
└── [various backup versions: index2.html, index3.html, etc.]
```

---

## Core Features

### 1. Pin System

#### Pin Types
- **Circle Pin** (`pin:circle`) - Circular nodes, default radius 9px
- **Square Pin** (`pin:square`) - Square nodes, 22x22px
- **Pill Pin** (`pin:pill`) - Rounded rectangle nodes, 40x22px

#### Card Types
- **Note Card** (`card:card`) - Standard card format, 46x30px
- **Doc Card** (`card:doc`) - Document-style card, 32x46px (vertical)
- **Folder Card** (`card:folder`) - Folder-style card, 50x36px

#### Pin Properties
- Position (x, y coordinates in world space)
- Color (customizable hex colors)
- Label/Title
- Notes/Description
- Date (flexible date format support)
- Type ID (determines visual shape)

### 2. Connection System

#### Connection Types
- **Straight Lines** - Default connection style
- **Curved Lines** - Quadratic bezier curves with fan-out support
  - When multiple connections share an endpoint, they automatically fan out in an arc
  - Individual connections can have their own type (straight/curved)
  - Global toggle for default connection type

#### Connection Features
- Color-coded connections
- Per-connection type settings (can override global setting)
- Click detection for connection deletion (Alt/Cmd + Click)
- Auto-connection when creating new pins from selected pin

### 3. Layout Algorithms

#### Force-Directed Layout (Magic Layout) ★
- Physics-based simulation using repulsion and attraction forces
- Runs in Web Worker to prevent UI blocking
- Configurable parameters:
  - Optimal distance constant (K)
  - Damping coefficient (C)
  - Repulsion/attraction multipliers
- Updates at ~20fps (50ms intervals)

#### Radial Mind Map 🌸
- Centered layout with root pin at center
- Gentle radial force pulling nodes toward center
- Strong centering force for root pin
- Ideal for hierarchical information structures

#### Affinity Clusters ☁️
- Groups pins by color
- Stronger attraction for same-group connections
- Increased repulsion for different groups
- Creates visual clusters based on color affinity

#### Auto Timeline ⏳
- Arranges pins with dates along a horizontal timeline
- Parses flexible date formats (e.g., "1958", "Jul 1947", "1963-11-22")
- Calculates optimal timeline scale and positioning
- Static layout (non-dynamic)

### 4. Tools & Interaction

#### Tools
- **Pin Tool** - Create new pins by clicking on canvas
- **Select Tool** - Select and manipulate existing pins
- **Pan Tool** - Navigate the canvas by dragging

#### Selection Modes
- **Single Selection** - Click to select one pin
- **Marquee Selection** - Drag to select multiple pins
- **Multi-selection** - Hold Ctrl/Cmd while selecting

#### Pin Manipulation
- Drag to move pins
- Multi-pin dragging (selected pins move together)
- Double-click to edit (opens modal)
- Right-click for radial menu (context actions)
- Delete key to remove selected pins

### 5. Radial Menu (Context Menu)

Available actions:
- **Connect** - Start connection from this pin
- **Edit** - Open edit modal
- **Delete** - Remove pin (with confirmation)
- **Focus** - Zoom to pin and center view
- **Toggle Connection Type** - Switch between straight/curved for pin's connections

### 6. Canvas Navigation

- **Pan** - Click and drag (pan tool) or middle mouse button
- **Zoom** - Mouse wheel (Ctrl/Cmd/Alt + scroll for finer control)
- **Zoom Range** - 0.1x to 5x scale
- **Viewport Culling** - Only renders visible elements for performance

### 7. Persistence

#### Local Storage
All board state is saved to browser localStorage:
- Pin positions and properties
- Connections (with types and colors)
- Camera state (zoom, pan position)
- Timeline configuration
- Color palette customizations
- Connection type preference
- Selection state

#### Undo/Redo System
- History stack (max 100 entries)
- Ctrl/Cmd + Z for undo
- Captures state snapshots before major operations

### 8. UI Components

#### Top Menu Bar
- Tool selection buttons
- Color palette picker
- Pin/Card type selector with cycling
- Connection type toggle (straight/curved)
- Type family toggle (Pin/Card)

#### Side Panel (Pin Info)
- Displays selected pin details
- Title, subtitle, notes, date
- Color indicator
- Metadata display

#### Bottom Tray
- Card list for card-type pins
- Drag cards to canvas to create card pins

#### Control Buttons
- **Reset** (↻) - Clear entire board
- **Magic Layout** (★) - Toggle force-directed layout
- **Radial Mind Map** (🌸) - Apply radial layout
- **Affinity Clusters** (☁️) - Apply clustering layout
- **Auto Timeline** (⏳) - Apply timeline layout

#### Modal Dialog
- Edit pin properties (title, color, notes, date)
- Form validation
- Save/Cancel actions

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `P` | Switch to Pin tool |
| `S` | Switch to Select tool |
| `M` | Switch to Pan/Move tool |
| `1` | Switch to Pin family (or cycle pin variants) |
| `2` | Switch to Card family (or cycle card variants) |
| `T` | Toggle connection type (straight/curved) |
| `Ctrl/Cmd + Z` | Undo last action |
| `Delete` / `Backspace` | Delete selected pin(s) |
| `Escape` | Deselect all pins / Close modals |
| `Ctrl/Cmd + Click` | Multi-select pins |
| `Alt/Cmd + Click` (connection) | Delete connection |

---

## Technical Architecture

### Core Technologies
- **HTML5 Canvas** - Primary rendering surface
- **Web Workers** - Offloads force-directed layout calculations
- **LocalStorage API** - State persistence
- **Vanilla JavaScript** - No external dependencies

### Coordinate Systems

#### World Coordinates
- Infinite 2D space for pin/connection data
- Pins stored with world-space (x, y) positions
- Independent of viewport

#### Screen Coordinates
- Pixel positions on canvas
- Transformed from world coordinates using:
  - Scale (zoom level)
  - Offset (pan position)

#### Transform Functions
- `worldToScreen(x, y)` - Convert world → screen
- `screenToWorld(sx, sy)` - Convert screen → world

### State Management

#### Global State Variables
```javascript
// View/Camera
scale, offsetX, offsetY

// Data
pins[], connections[], cards[]

// Selection
selectedPinIndex, selectedPins[], connectStartIndex

// Interaction
isDraggingPin, isPanning, isMarqueeSelecting
isLayoutSimulating, isWorkerProcessing

// UI
currentTool, selectedColor, currentTypeId, connectionType
```

### Web Worker Communication

#### Main Thread → Worker
```javascript
{
  command: "start",
  pins: [...],      // Pin data with indices
  connections: [...], // Connection data
  layoutMode: "default" | "mindmap" | "clusters" | "timeline"
}
```

#### Worker → Main Thread
```javascript
{
  command: "update",
  pins: [{ index, x, y, vx, vy }, ...]
}
```

### Rendering Pipeline

1. **Clear Canvas** - Reset drawing surface
2. **Viewport Culling** - Filter pins/connections to visible area
3. **Draw Connections** - Render lines (straight or curved with fan-out)
4. **Draw Pins** - Render pin shapes based on type
5. **Draw Overlays** - Selection indicators, marquee box, connection preview
6. **Request Animation Frame** - Continue animation loop

### Performance Optimizations

1. **Viewport Culling** - Only renders elements visible or partially visible
2. **Web Worker** - Physics calculations don't block UI thread
3. **Throttled Updates** - Layout updates limited to ~20fps
4. **Concurrent Request Prevention** - Flag prevents multiple simultaneous worker requests
5. **Efficient Hit Testing** - Shape-aware collision detection (circle vs. rectangle)

---

## Recent Improvements & Bug Fixes

### Connection System Enhancements
- ✅ Curved connection lines with quadratic bezier curves
- ✅ Automatic fan-out for multiple connections to single pin
- ✅ Per-connection type override capability
- ✅ Global connection type toggle in menu
- ✅ Keyboard shortcut (T) for connection type toggle
- ✅ Radial menu integration for per-pin connection type changes

### Hit Detection Improvements
- ✅ Proper bounding-box detection for cards and rectangular shapes
- ✅ Prevents placing pins on top of existing pins
- ✅ Clicking existing pin in pin tool mode selects it instead

### Worker & Performance
- ✅ Fixed console spam (17,000+ warnings eliminated)
- ✅ Silently filters invalid messages from browser extensions
- ✅ Added concurrent request prevention flag
- ✅ Improved error handling in worker communication

### Timeline Persistence
- ✅ Timeline pins now properly saved/loaded from localStorage
- ✅ Timeline state persists across page refreshes
- ✅ Pin references stored by index instead of object references

### Selection & Dragging
- ✅ Multi-pin selection preserved during dragging
- ✅ Marquee selection works correctly for multi-pin movement
- ✅ Single pin and multi-pin dragging both functional

### Connection Management
- ✅ Alt/Cmd + Click on connection to delete
- ✅ Connection hit testing with distance calculations
- ✅ Proper cleanup of orphaned connections

---

## Code Organization

The main `index.html` file is organized into logical sections:

1. **DOM Element References** - Cache of all UI elements
2. **Constants** - Configuration values (menu height, scale limits, etc.)
3. **Canvas Initialization** - Setup and sizing
4. **Application State** - All global state variables
5. **Node Type Definitions** - Pin and card type configurations
6. **PIN_BASES** - Shape geometry definitions
7. **Utility Functions** - Helper functions (getNodeType, getPinMetrics, etc.)
8. **Coordinate Transformations** - World/screen conversion functions
9. **Persistence** - LocalStorage save/load functions
10. **Web Worker** - Worker setup and communication
11. **Layout Functions** - Force-directed, radial, clusters, timeline
12. **Tool System** - Tool selection and rendering
13. **Color Palette** - Color management
14. **Menu Rendering** - Dynamic UI generation
15. **Drawing & Rendering** - Canvas drawing functions
16. **Event Handlers** - Mouse, keyboard, touch interactions
17. **Pin Management** - Create, edit, delete operations
18. **Connection Management** - Create, delete, hit testing
19. **Selection System** - Single and multi-selection
20. **Radial Menu** - Context menu system
21. **Timeline** - Timeline layout and rendering

---

## Current Status

### ✅ Working Features
- All pin types (circle, square, pill) functional
- All card types (card, doc, folder) functional
- Straight and curved connections with fan-out
- All layout algorithms (force-directed, radial, clusters, timeline)
- Undo/redo system
- Local storage persistence
- Multi-selection and dragging
- Context menu (radial menu)
- Pin editing modal
- Keyboard shortcuts
- Viewport culling for performance
- Web Worker integration

### 🔧 Known Issues / Future Improvements
- None currently documented - application is stable and feature-complete

### 📝 Technical Debt
- Multiple backup HTML files (index2.html, index3.html, etc.) - could be cleaned up
- Layout worker has a backup copy file

---

## Browser Compatibility

- Requires Web Workers support (all modern browsers)
- Requires Canvas API (all modern browsers)
- Requires LocalStorage API (all modern browsers)
- Tested primarily in Chrome/Edge/Firefox/Safari

---

## Development Notes

### Adding New Pin Types
1. Add entry to `NODE_TYPES` array with id, label, icon, family, variant
2. Add shape definition to `PIN_BASES` with shape, dimensions
3. Update drawing logic in `drawPinShape` if needed
4. Update hit testing in `findPinAt` if shape is non-standard

### Adding New Layout Modes
1. Add case to `layoutWorker.js` switch statement
2. Define physics constants (K, C, repulsion_mult, attraction_mult)
3. Add UI button in controls section
4. Implement layout function in main thread (if needed)
5. Update `applyLayout` function

### Debugging Tips
- Check browser console for errors
- Worker errors logged separately
- Use browser DevTools to inspect localStorage state
- Canvas rendering issues often related to coordinate transformations
- Worker communication issues check message format and command names

---

## Version History

- **Latest Version** - Features curved connections, improved hit detection, worker optimization
- Previous iterations saved as index2.html, index3.html, etc. for reference

---

*Last Updated: December 2024*






