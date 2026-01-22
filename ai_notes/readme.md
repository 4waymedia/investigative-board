# Investigative Board

## Description

The Investigative Board is an interactive, canvas-based visualization application designed for creating timelines, keyword associations, conversation flow diagrams, and complex information networks. It provides a flexible pin-and-connection system with advanced layout algorithms for organizing complex information visually. The application operates entirely in the browser with no external dependencies, using vanilla JavaScript, HTML5 Canvas, and Web Workers for performance.

**Main Entry Point:** `index.html`

The application allows users to:
- Create and manipulate visual nodes (pins and cards) on an infinite canvas
- Connect nodes with straight or curved lines to represent relationships
- Apply multiple automatic layout algorithms (force-directed, radial mind maps, clustering, timelines)
- Customize appearance through themes and color palettes
- Persist work automatically to browser local storage
- Navigate large datasets with smooth pan and zoom controls

---

## Why?

### Problem Statement

Visual information organization tools are essential for investigative work, research synthesis, and complex data analysis. Existing solutions often:
- Require expensive software licenses
- Have steep learning curves
- Lack flexibility for custom workflows
- Don't run entirely client-side (privacy concerns)
- Have limited layout algorithm options
- Can't handle large datasets smoothly

### Solution Benefits

**1. Zero-Configuration Setup**
- Runs entirely in the browser—no installation, no server setup
- No external dependencies—pure HTML, CSS, and JavaScript
- Works offline after initial load
- Cross-platform compatibility (any device with a modern browser)

**2. Privacy-First Design**
- All data stored locally in browser (localStorage)
- No data sent to external servers
- Complete user control over their information
- Ideal for sensitive investigative work

**3. Performance at Scale**
- Web Worker integration prevents UI blocking during complex calculations
- Viewport culling ensures smooth rendering with hundreds of nodes
- Optimized force-directed layout algorithms handle large graphs
- Efficient coordinate transformation system

**4. Flexible Visualization**
- Multiple layout algorithms for different use cases:
  - **Force-Directed**: Natural, physics-based organization
  - **Radial Mind Map**: Hierarchical, centered layouts
  - **Affinity Clusters**: Color-based grouping
  - **Auto Timeline**: Chronological organization
- Customizable visual styles through themes
- Multiple node types (pins and cards) for semantic distinction

**5. Intuitive Interaction**
- Familiar canvas-based interface (drag, zoom, pan)
- Context-sensitive radial menus
- Keyboard shortcuts for power users
- Multi-selection and batch operations
- Undo/redo support

**6. Extensible Architecture**
- Modular code organization
- Easy to add new node types
- Plugin-ready layout system
- Theme system for visual customization

### Use Cases

- **Investigative Journalism**: Mapping connections between people, events, and evidence
- **Research Synthesis**: Organizing complex academic or technical information
- **Project Planning**: Visualizing task dependencies and workflows
- **Mind Mapping**: Creating hierarchical knowledge structures
- **Timeline Analysis**: Chronological event sequencing
- **Network Analysis**: Understanding relationships in social or technical systems
- **Story Development**: Plot structure and character relationship mapping

---

## Drawbacks

### Technical Limitations

**1. Browser Dependency**
- Requires modern browser with Web Workers, Canvas, and LocalStorage support
- Performance varies by browser implementation
- Mobile browsers may have touch interaction limitations
- No server-side persistence (localStorage only)

**2. Scalability Constraints**
- Performance degrades with very large datasets (1000+ nodes)
- LocalStorage has size limits (~5-10MB typical)
- No built-in collaborative features
- No version control or branching

**3. Limited Data Export**
- Data format is proprietary (localStorage JSON)
- No direct export to common formats (PNG, SVG, PDF, etc.)
- Sharing boards requires manual data export/import
- No cloud backup or sync

**4. Single-User Design**
- No real-time collaboration
- No user accounts or permissions
- No sharing or publication features
- Limited to single-browser instance

**5. Development Status**
- Large monolithic HTML file (5000+ lines) makes maintenance challenging
- Multiple backup versions create confusion
- Limited error handling and user feedback
- No automated testing framework
- Documentation spread across multiple files

**6. Feature Gaps**
- No image or file attachments to nodes
- Limited text formatting options
- No search or filtering capabilities
- No graph analysis tools (centrality, clustering metrics, etc.)
- No animation or transition controls
- Limited theme customization UI

### Design Trade-offs

**1. Simplicity vs. Functionality**
- Prioritizes ease of use over advanced features
- Some power-user features may require code modifications
- Limited customization options in UI (requires code changes for themes)

**2. Client-Side vs. Cloud**
- Privacy and offline-first approach sacrifices collaboration
- No automatic backups (data loss risk if localStorage cleared)
- Manual data migration between devices

**3. Performance vs. Features**
- Viewport culling prioritizes rendering speed over always-visible context
- Layout algorithms are simplified compared to professional graph tools
- No GPU acceleration (CPU-only rendering)

---

## Architecture

### System Overview

The Investigative Board is a single-page application (SPA) built with vanilla JavaScript, HTML5 Canvas, and Web Workers. It follows a client-side architecture with no server components.

```
┌─────────────────────────────────────────────────────────┐
│                    Browser Window                        │
│  ┌──────────────┐  ┌─────────────────────────────────┐ │
│  │   UI Layer   │  │      Canvas Renderer            │ │
│  │ (DOM/HTML)   │  │   (HTML5 Canvas API)            │ │
│  └──────────────┘  └─────────────────────────────────┘ │
│           │                      │                      │
│           └──────────┬───────────┘                      │
│                      │                                   │
│              ┌───────▼────────┐                         │
│              │  Main Thread   │                         │
│              │  (JavaScript)  │                         │
│              │                │                         │
│              │  • State Mgmt  │                         │
│              │  • Event Handlers                        │
│              │  • Rendering   │                         │
│              │  • Persistence │                         │
│              └───────┬────────┘                         │
│                      │                                   │
│                      │ Message Passing                   │
│                      │                                   │
│              ┌───────▼────────┐                         │
│              │  Web Worker    │                         │
│              │  (Background)  │                         │
│              │                │                         │
│              │  • Physics Sim │                         │
│              │  • Layout Calc │                         │
│              └────────────────┘                         │
│                                                          │
│              ┌─────────────────┐                        │
│              │  LocalStorage   │                        │
│              │  (Persistence)  │                        │
│              └─────────────────┘                        │
└─────────────────────────────────────────────────────────┘
```

### Core Technologies

- **HTML5 Canvas**: Primary rendering surface for all visual elements
- **Web Workers**: Offloads computationally intensive physics simulations
- **LocalStorage API**: Client-side data persistence
- **Vanilla JavaScript**: No external frameworks or libraries
- **CSS3**: Styling and theme system

### File Structure

```
investigative-board/
├── index.html                  # Main application (5000+ lines, monolithic)
├── css/
│   └── board-styles.css        # Stylesheet for UI components and themes
├── js/
│   ├── layoutWorker.js         # Web Worker for force-directed layout
│   └── layoutWorker copy.js    # Backup copy (technical debt)
├── themes/
│   └── themes.json             # Theme definitions (color palettes, backgrounds)
├── ai_notes/
│   ├── readme.md               # This documentation
│   └── PROJECT_DOCUMENTATION.md # Detailed technical reference
└── [backup versions]
    ├── index2.html             # Historical versions (technical debt)
    ├── index3.html
    ├── index4.html
    ├── index5.html
    ├── msc-board.html
    ├── msc-board-2.html
    ├── msc-board-3.html
    └── msc-board-grok.html
```

### Code Organization (index.html)

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

#### Data Model

**Pin Object:**
```javascript
{
  x: number,              // World-space X coordinate
  y: number,              // World-space Y coordinate
  color: string,          // Hex color code
  title: string,          // Display title
  notes: string,          // Description/notes
  date: string,           // Flexible date format
  typeId: string,         // Determines visual shape
  index: number           // Unique identifier
}
```

**Connection Object:**
```javascript
{
  startIndex: number,     // Source pin index
  endIndex: number,       // Target pin index
  color: string,          // Line color
  type: string            // "straight" or "curved"
}
```

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

### Web Worker Communication

The Web Worker (`layoutWorker.js`) handles physics simulations for force-directed layouts to prevent UI blocking.

#### Main Thread → Worker
```javascript
{
  command: "start",
  pins: [...],           // Pin data with indices
  connections: [...],    // Connection data
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

### Layout Algorithms

#### 1. Force-Directed Layout (Magic Layout) ★
- Physics-based simulation using repulsion and attraction forces
- Runs in Web Worker to prevent UI blocking
- Configurable parameters:
  - Optimal distance constant (K)
  - Damping coefficient (C)
  - Repulsion/attraction multipliers
- Updates at ~20fps (50ms intervals)

#### 2. Radial Mind Map 🌸
- Centered layout with root pin at center
- Gentle radial force pulling nodes toward center
- Strong centering force for root pin
- Ideal for hierarchical information structures

#### 3. Affinity Clusters ☁️
- Groups pins by color
- Stronger attraction for same-group connections
- Increased repulsion for different groups
- Creates visual clusters based on color affinity

#### 4. Auto Timeline ⏳
- Arranges pins with dates along a horizontal timeline
- Parses flexible date formats (e.g., "1958", "Jul 1947", "1963-11-22")
- Calculates optimal timeline scale and positioning
- Static layout (non-dynamic)

### Performance Optimizations

1. **Viewport Culling** - Only renders elements visible or partially visible
2. **Web Worker** - Physics calculations don't block UI thread
3. **Throttled Updates** - Layout updates limited to ~20fps
4. **Concurrent Request Prevention** - Flag prevents multiple simultaneous worker requests
5. **Efficient Hit Testing** - Shape-aware collision detection (circle vs. rectangle)

### Theme System

Themes are defined in `themes/themes.json` with:
- Color palettes (hex color lists)
- Background definitions (solid, gradient, pattern, texture)
- Descriptive metadata

Themes can be loaded dynamically to change the visual appearance of the entire application.

### Persistence

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

---

## Stability

### Current Status: **Stable**

The application is feature-complete and production-ready for single-user, client-side use. All core features are functional and tested.

### Working Features ✅
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
- Theme system

### Known Issues / Limitations

1. **Technical Debt**
   - Multiple backup HTML files (index2.html, index3.html, etc.) should be archived or removed
   - Layout worker has a backup copy file
   - Large monolithic HTML file makes maintenance challenging

2. **Browser Compatibility**
   - Requires modern browser (Web Workers, Canvas, LocalStorage)
   - Tested primarily in Chrome/Edge/Firefox/Safari
   - Mobile browsers may have limited touch interaction support

3. **Performance**
   - Degrades with very large datasets (1000+ nodes)
   - LocalStorage size limits (~5-10MB typical)

### Future Improvements

Potential enhancements (not currently planned):
- Export functionality (PNG, SVG, PDF)
- Image/file attachments
- Search and filtering
- Collaborative features
- Cloud backup/sync
- Graph analysis tools
- Improved mobile touch support

---

## Platforms

### Supported Platforms

**Desktop Browsers:**
- Chrome/Chromium (recommended)
- Firefox
- Safari
- Edge

**Mobile Browsers:**
- iOS Safari (limited touch support)
- Chrome Mobile (limited touch support)

**Operating Systems:**
- macOS
- Windows
- Linux
- iOS (with limitations)
- Android (with limitations)

### Requirements

- Modern browser with:
  - HTML5 Canvas API support
  - Web Workers API support
  - LocalStorage API support
  - JavaScript enabled
- No server required
- No internet connection required (after initial load)
- No installation required

### Testing Status

- ✅ Tested on macOS (Chrome, Safari, Firefox)
- ✅ Tested on Windows (Chrome, Edge, Firefox)
- ⚠️ Limited testing on mobile devices
- ⚠️ No automated test suite

---

## Portability

### Deployment Options

**1. Local File System**
- Simply open `index.html` in a browser
- All assets must be in correct relative paths
- No server required

**2. Static Web Server**
- Serve files from any static hosting service
- Compatible with:
  - GitHub Pages
  - Netlify
  - Vercel
  - Apache
  - Nginx
  - Any static file server

**3. Browser Extension**
- Could be packaged as browser extension
- Would require manifest configuration
- Would need to handle content security policies

### Data Portability

**Current Limitations:**
- Data stored in browser localStorage (not easily portable)
- No built-in export/import functionality
- Manual data extraction requires browser DevTools
- No standard format for data exchange

**Manual Data Migration:**
1. Open browser DevTools
2. Navigate to Application → Local Storage
3. Copy JSON data
4. Paste into new browser/device localStorage

**Recommended Enhancement:**
Add export/import buttons to UI for easier data portability.

---

## Category

**Type:** Web Application, Visualization Tool, Information Architecture Tool

**Classification:**
- **Domain**: Data Visualization, Knowledge Management
- **Style**: Single-Page Application (SPA)
- **Architecture**: Client-Side, Browser-Based
- **Dependencies**: Zero external dependencies (vanilla JavaScript)
- **License**: Not specified (assumed proprietary/personal)

**Similar Tools:**
- Kumu (network visualization)
- Gephi (graph analysis)
- Miro (visual collaboration)
- Obsidian (knowledge graph)
- XMind (mind mapping)

---

## Usage Guide

### Getting Started

1. Open `index.html` in a modern web browser
2. The canvas will load with a blank board
3. Select a tool from the top menu:
   - **Pin Tool**: Click on canvas to create pins
   - **Select Tool**: Click and drag to select/manipulate pins
   - **Pan Tool**: Drag to navigate the canvas

### Creating Pins

1. Select **Pin Tool** (keyboard: `P`)
2. Choose pin type (Pin or Card family)
3. Select a color from the palette
4. Click on canvas to place pin
5. Double-click pin to edit (title, color, notes, date)

### Creating Connections

1. Select a pin (using Select Tool)
2. Right-click → **Connect**
3. Click another pin to complete connection
4. Connections can be straight or curved (toggle with `T` key)

### Layout Algorithms

Use the control buttons at the bottom:
- **★ Magic Layout**: Force-directed physics simulation
- **🌸 Radial Mind Map**: Centered hierarchical layout
- **☁️ Affinity Clusters**: Color-based grouping
- **⏳ Auto Timeline**: Chronological arrangement

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `P` | Switch to Pin tool |
| `S` | Switch to Select tool |
| `M` | Switch to Pan/Move tool |
| `1` | Switch to Pin family |
| `2` | Switch to Card family |
| `T` | Toggle connection type (straight/curved) |
| `Ctrl/Cmd + Z` | Undo last action |
| `Delete` / `Backspace` | Delete selected pin(s) |
| `Escape` | Deselect all pins / Close modals |
| `Ctrl/Cmd + Click` | Multi-select pins |
| `Alt/Cmd + Click` (connection) | Delete connection |

### Themes

Themes are defined in `themes/themes.json`. To switch themes, modify the theme loading code in `index.html` or add a theme selector UI.

---

## Development

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
- Worker communication issues: check message format and command names

### Code Style

- Vanilla JavaScript (ES6+)
- Inline styles and scripts in HTML
- No build process or transpilation
- No linting or formatting tools (ad-hoc style)

---

## License

Not specified. Assume proprietary/personal use unless otherwise stated.

---

## Authors

Not specified in codebase.

---

## Version History

- **Current Version** - Features curved connections, improved hit detection, worker optimization
- Previous iterations saved as index2.html, index3.html, etc. for reference

*Last Updated: December 2024*








