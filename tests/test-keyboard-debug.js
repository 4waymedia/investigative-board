// Debug keyboard event handling
// Simulate the keyboard event handler logic

let selectedColor = "#58a6ff";
let palette = [
  { name: "Red", value: "#f85149" },
  { name: "Blue", value: "#58a6ff" },
  { name: "Green", value: "#3fb950" },
  { name: "Yellow", value: "#f1c40f" },
  { name: "Purple", value: "#a471f7" },
];

// Mock functions
function saveState() { console.log("saveState() called"); }
function renderMenu() { console.log("renderMenu() called"); }
function draw() { console.log("draw() called"); }

// Simulate keyboard event handler
function handleKeyDown(e) {
  console.log(`Key pressed: ${e.key}, shiftKey: ${e.shiftKey}, ctrlKey: ${e.ctrlKey}, metaKey: ${e.metaKey}`);

  // Existing handlers first
  if ((e.ctrlKey || e.metaKey) && e.key === "z") {
    console.log("Ctrl+Z detected");
    e.preventDefault();
    return;
  }

  // Key 1-4 handlers (simplified)
  if (e.key === "1" && !e.shiftKey) {
    console.log("Key 1 pressed (no shift)");
    e.preventDefault();
    return;
  }

  // Shift + Number: Quick color selection (1-9)
  if (e.shiftKey && e.key >= "1" && e.key <= "9") {
    console.log("Shift + Number detected!");
    e.preventDefault();
    const colorIndex = parseInt(e.key) - 1; // Convert "1" to index 0, "2" to index 1, etc.
    console.log(`Color index: ${colorIndex}, palette length: ${palette.length}`);
    if (colorIndex < palette.length) {
      console.log(`Selecting color: ${palette[colorIndex].name} (${palette[colorIndex].value})`);
      selectedColor = palette[colorIndex].value;
      saveState();
      renderMenu();
      draw();
    } else {
      console.log("Color index out of range");
    }
    return;
  }

  console.log("Key not handled");
}

// Test cases
console.log("=== Testing Keyboard Event Handling ===");
console.log("Initial selectedColor:", selectedColor);
console.log("Palette:", palette.map((c, i) => `${i+1}. ${c.name}: ${c.value}`).join(", "));

// Test Shift+1
console.log("\n--- Testing Shift+1 ---");
handleKeyDown({ key: "1", shiftKey: true, ctrlKey: false, metaKey: false, preventDefault: () => console.log("preventDefault called") });

// Test Shift+3
console.log("\n--- Testing Shift+3 ---");
handleKeyDown({ key: "3", shiftKey: true, ctrlKey: false, metaKey: false, preventDefault: () => console.log("preventDefault called") });

// Test Shift+9 (out of range)
console.log("\n--- Testing Shift+9 (out of range) ---");
handleKeyDown({ key: "9", shiftKey: true, ctrlKey: false, metaKey: false, preventDefault: () => console.log("preventDefault called") });

// Test regular 1 (should not trigger color selection)
console.log("\n--- Testing regular 1 (no shift) ---");
handleKeyDown({ key: "1", shiftKey: false, ctrlKey: false, metaKey: false, preventDefault: () => console.log("preventDefault called") });

console.log("\nFinal selectedColor:", selectedColor);
