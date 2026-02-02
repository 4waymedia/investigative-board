# Multi-Board Storage System

## Overview

The multi-board storage system enables users to create, manage, and persist multiple investigation boards. It replaces the legacy single-board localStorage approach with a scalable architecture that supports:

- Multiple boards per user
- Board metadata (title, description, timestamps, thumbnails)
- Import/Export as JSON files
- Membership-based limits
- Configurable undo history depth
- Automatic migration from legacy format

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Application                               │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────────────┐ │
│  │  AppState   │  │ BoardManager │  │    BoardPickerUI        │ │
│  │  (runtime)  │◄─┤  (storage)   │◄─┤  (user interface)       │ │
│  └─────────────┘  └──────────────┘  └─────────────────────────┘ │
│         │                │                                       │
│         ▼                ▼                                       │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                     localStorage                             ││
│  │  ┌─────────────────┐  ┌────────────┐  ┌────────────┐       ││
│  │  │ msc-board-index │  │ msc-board- │  │ msc-board- │  ...  ││
│  │  │  (metadata)     │  │   {uuid1}  │  │   {uuid2}  │       ││
│  │  └─────────────────┘  └────────────┘  └────────────┘       ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

---

## Data Structures

### Board Index (`msc-board-index`)

The index stores metadata for all boards and application settings.

```javascript
{
  version: "1.0",
  activeId: "uuid-of-current-board" | null,
  settings: {
    historyDepth: 20,        // Undo history limit (10, 20, 50, 100)
    membership: "free"       // "free", "pro", "enterprise"
  },
  boards: [
    {
      id: "550e8400-e29b-41d4-a716-446655440000",
      title: "Investigation Alpha",
      description: "Main case board",
      userId: "user123",
      created: "2026-01-27T10:30:00Z",
      lastModified: "2026-01-27T14:22:00Z",
      thumbnail: "data:image/png;base64,..."
    }
  ]
}
```

### Board Data (`msc-board-{uuid}`)

Each board is stored in its own localStorage key with full document data.

```javascript
{
  id: "550e8400-e29b-41d4-a716-446655440000",
  meta: {
    id: "...",
    title: "Investigation Alpha",
    description: "Main case board",
    userId: "user123",
    created: "2026-01-27T10:30:00Z",
    lastModified: "2026-01-27T14:22:00Z",
    thumbnail: "data:image/png;base64,..."
  },
  document: {
    pins: [...],
    connections: [...],
    cards: [...],
    textElements: [...],
    areas: [...],
    currentThemeId: "default",
    palette: [...],
    timelineActive: false,
    timelinePins: [...],
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
  history: [
    // Undo snapshots (limited by historyDepth setting)
    { document: {...}, view: {...} }
  ]
}
```

### Export File Format

When exporting, boards are wrapped with version info for future compatibility.

```javascript
{
  formatVersion: "1.0",
  exportedAt: "2026-01-27T15:00:00Z",
  exportedFrom: "investigative-board",
  board: {
    id: "...",
    meta: {...},
    document: {...},
    view: {...}
    // Note: history is excluded from exports to reduce file size
  }
}
```

---

## Key Components

### BoardManager (`js/core/boardManager.js`)

Central class for all board storage operations.

#### Initialization
```javascript
const boardManager = new BoardManager();
boardManager.initialize(appState, app);
```

#### Core Methods

| Method | Description |
|--------|-------------|
| `getBoardList()` | Returns array of board metadata |
| `getActiveBoardId()` | Returns currently loaded board ID |
| `createBoard(title, description)` | Creates new board, returns ID |
| `loadBoard(boardId)` | Loads board into AppState |
| `saveBoard(updateThumbnail)` | Saves current board |
| `deleteBoard(boardId)` | Removes board from storage |
| `duplicateBoard(boardId, newTitle)` | Clones a board |
| `exportBoard(boardId)` | Downloads board as JSON file |
| `importBoard(file)` | Imports JSON file as new board |
| `importBoardFromFile()` | Opens file picker and imports |

#### Membership Methods

| Method | Description |
|--------|-------------|
| `canCreateBoard()` | Checks if under board limit |
| `getRemainingBoardSlots()` | Returns count of available slots |
| `getMembership()` | Returns membership level |
| `setMembership(level)` | Updates membership |
| `getHistoryDepth()` | Returns configured history limit |
| `setHistoryDepth(depth)` | Sets history limit |
| `getHistoryDepthOptions()` | Returns valid options for membership |

### AppState Extensions (`js/core/state.js`)

New properties and methods added to AppState:

```javascript
// New meta property
this.meta = {
  id: null,
  title: "Untitled Board",
  description: "",
  userId: null,
  created: null,
  lastModified: null,
  thumbnail: null
};

// New methods
appState.toBoardData()      // Serialize for BoardManager
appState.fromBoardData()    // Load from BoardManager
appState.clearBoard()       // Reset to empty state
```

### BoardPickerUI (`js/ui/boardPicker.js`)

Modal interface for board management.

```javascript
const picker = new BoardPickerUI();
picker.initialize(boardManager, appState, app, {
  onBoardLoad: (boardId) => { /* refresh UI */ },
  onBoardCreate: (boardId) => { /* refresh UI */ }
});

picker.open();   // Show modal
picker.close();  // Hide modal
picker.toggle(); // Toggle visibility
```

---

## Membership Limits

| Membership | Max Boards | History Depth Options |
|------------|------------|----------------------|
| free       | 5          | 10, 20               |
| pro        | 25         | 10, 20, 50           |
| enterprise | unlimited  | 10, 20, 50, 100      |

---

## File Menu Integration

The SystemMenuManager connects to BoardManager for these actions:

| Menu Item | Action |
|-----------|--------|
| New Board | `boardManager.createBoard()` then `loadBoard()` |
| Open Board... | `boardPickerUI.open()` |
| Save | `boardManager.saveBoard()` |
| Close Board | `boardManager.saveBoard()` then `appState.clearBoard()` |
| Export Board... | `boardManager.exportBoard()` |
| Import Board... | `boardManager.importBoardFromFile()` |

---

## Auto-Save Behavior

Boards auto-save with debouncing:

1. State change triggers auto-save timer
2. Timer waits 2 seconds after last change
3. Saves without thumbnail update (performance)
4. Explicit Save updates thumbnail

```javascript
// In Application class
_setupAutoSave() {
  let saveTimeout = null;
  this.subscribeToStateChanges(() => {
    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => {
      this.boardManager.saveBoard(false); // No thumbnail
    }, 2000);
  });
}
```

---

## Legacy Migration

On first load with new system:

1. Check if `msc-investigativeboard` (legacy key) exists
2. Parse legacy data format
3. Create new board with migrated data
4. Set as active board
5. Delete legacy key
6. User sees their data preserved in "My Board"

```javascript
// Migration handles both legacy formats:
// - Old: { pins, connections, scale, offsetX, ... }
// - Intermediate: { document: {...}, view: {...} }
```

---

## Thumbnail Generation

Thumbnails are canvas snapshots for visual identification.

```javascript
// In Application class
generateThumbnail(maxWidth = 200, maxHeight = 150) {
  // 1. Calculate content bounds
  // 2. Create offscreen canvas
  // 3. Draw scaled content (pins + connections)
  // 4. Return as data URL (PNG)
}
```

Thumbnails are updated:
- On explicit Save
- When opening board picker (for active board)
- NOT on auto-save (performance)

---

## Future Considerations

### Backend Integration

The system is designed for easy backend integration:

```javascript
// BoardManager could be extended to:
class CloudBoardManager extends BoardManager {
  async saveBoard() {
    // Save to localStorage (offline support)
    super.saveBoard();
    // Sync to backend
    await this.api.saveBoard(this.appState.toBoardData());
  }
  
  async loadBoard(boardId) {
    // Try backend first
    const cloudData = await this.api.getBoard(boardId);
    if (cloudData) {
      this._saveBoardData(boardId, cloudData); // Cache locally
    }
    return super.loadBoard(boardId);
  }
}
```

### User Authentication

The `userId` field is already wired into metadata:

```javascript
boardManager.createBoard("New Board", "", currentUser.id);
```

### Collaboration

Board data structure supports future real-time sync:
- Each board has unique UUID
- Metadata includes ownership info
- History is per-board for conflict resolution

---

## File Locations

| File | Purpose |
|------|---------|
| `js/core/boardManager.js` | Board storage and management |
| `js/core/state.js` | AppState with board metadata |
| `js/core/app.js` | Application initialization |
| `js/ui/boardPicker.js` | Board picker modal UI |
| `js/ui/systemMenu.js` | File menu integration |
| `css/board-styles.css` | Board picker styles |
