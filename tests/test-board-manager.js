// Test BoardManager lifecycle, creation, deletion, duplication, limits
const assert = require("assert");
const fs = require("fs");

const storage = {};
global.localStorage = {
  getItem: (k) => storage[k] || null,
  setItem: (k, v) => { storage[k] = String(v); },
  removeItem: (k) => { delete storage[k]; },
  clear: () => { Object.keys(storage).forEach(k => delete storage[k]); }
};

global.window = global;

// Load AppState and BoardManager
eval(fs.readFileSync("js/core/constants.js", "utf8"));
eval(fs.readFileSync("js/core/state.js", "utf8"));
eval(fs.readFileSync("js/core/boardManager.js", "utf8"));

function runBoardManagerTests() {
  console.log("=== Testing BoardManager Lifecycle ===");

  const appState = new window.AppState();
  const boardManager = new window.BoardManager();
  boardManager.initialize(appState, null);

  // 1. Initial state
  const initialBoards = boardManager.getBoardList();
  assert.strictEqual(initialBoards.length, 0, "Initial board list should be empty");

  // 2. Create board
  const b1Id = boardManager.createBoard("Alpha Case", "Investigation into Alpha");
  assert.ok(b1Id, "Board ID should be generated");
  const listAfterCreate = boardManager.getBoardList();
  assert.strictEqual(listAfterCreate.length, 1, "Should have 1 board");
  assert.strictEqual(listAfterCreate[0].title, "Alpha Case");
  assert.strictEqual(listAfterCreate[0].description, "Investigation into Alpha");

  // 3. Load board
  const loadSuccess = boardManager.loadBoard(b1Id);
  assert.strictEqual(loadSuccess, true, "Board load should succeed");
  assert.strictEqual(appState.meta.title, "Alpha Case");
  assert.strictEqual(appState.meta.description, "Investigation into Alpha");

  // 4. Modify board and save
  appState.addPin(150, 200, { label: "Clue #1", color: "#f85149" });
  assert.strictEqual(appState.pins.length, 1);
  boardManager.saveBoard(false);

  // Reload board to verify persistence
  appState.clearBoard();
  assert.strictEqual(appState.pins.length, 0);
  boardManager.loadBoard(b1Id);
  assert.strictEqual(appState.pins.length, 1);
  assert.strictEqual(appState.pins[0].label, "Clue #1");

  // 5. Duplicate board
  const b2Id = boardManager.duplicateBoard(b1Id, "Alpha Case Copy");
  assert.ok(b2Id, "Duplicate ID should be generated");
  assert.strictEqual(boardManager.getBoardList().length, 2);

  // 6. Delete board
  const delSuccess = boardManager.deleteBoard(b2Id);
  assert.strictEqual(delSuccess, true, "Delete should succeed");
  assert.strictEqual(boardManager.getBoardList().length, 1);

  // 7. Membership limit enforcement
  boardManager.setMembership("free");
  assert.strictEqual(boardManager.canCreateBoard(), true);
  for (let i = 0; i < 4; i++) {
    boardManager.createBoard(`Fill ${i}`);
  }
  assert.strictEqual(boardManager.getBoardList().length, 5);
  assert.strictEqual(boardManager.canCreateBoard(), false, "Free limit (5) should block creation");

  console.log("✅ BoardManager lifecycle tests passed successfully");
}

runBoardManagerTests();
