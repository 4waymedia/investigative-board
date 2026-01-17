// Test Shift + number color selection shortcuts
let selectedColor = "#58a6ff";
let palette = [
  { name: "Red", value: "#f85149" },
  { name: "Blue", value: "#58a6ff" },
  { name: "Green", value: "#3fb950" },
  { name: "Yellow", value: "#f1c40f" },
  { name: "Purple", value: "#a471f7" },
];

function handleKeyDown(e) {
  // Shift + Number: Quick color selection (1-9)
  if (e.shiftKey && e.key >= "1" && e.key <= "9") {
    e.preventDefault();
    const colorIndex = parseInt(e.key) - 1; // Convert "1" to index 0, "2" to index 1, etc.
    if (colorIndex < palette.length) {
      selectedColor = palette[colorIndex].value;
      console.log(`Selected color ${e.key} (${palette[colorIndex].name}): ${selectedColor}`);
      return true; // Handled
    } else {
      console.log(`Color ${e.key} not available (only ${palette.length} colors in palette)`);
      return true; // Handled but invalid
    }
  }
  return false; // Not handled
}

// Test cases
console.log("=== Testing Shift + Number Color Selection ===");
console.log("Initial palette:");
palette.forEach((color, index) => {
  console.log(`  ${index + 1}. ${color.name}: ${color.value}`);
});
console.log(`\nInitial selectedColor: ${selectedColor}`);

// Test Shift+1 (should select Red)
console.log("\nPressing Shift+1:");
handleKeyDown({ shiftKey: true, key: "1", preventDefault: () => {} });

// Test Shift+2 (should select Blue)
console.log("\nPressing Shift+2:");
handleKeyDown({ shiftKey: true, key: "2", preventDefault: () => {} });

// Test Shift+3 (should select Green)
console.log("\nPressing Shift+3:");
handleKeyDown({ shiftKey: true, key: "3", preventDefault: () => {} });

// Test Shift+9 (should be out of range)
console.log("\nPressing Shift+9 (out of range):");
handleKeyDown({ shiftKey: true, key: "9", preventDefault: () => {} });

// Test regular 1 key (should not be handled)
console.log("\nPressing regular 1 key (no Shift):");
handleKeyDown({ shiftKey: false, key: "1", preventDefault: () => {} });

console.log(`\nFinal selectedColor: ${selectedColor}`);


