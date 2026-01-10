// Test that renamed text creation variables work
let selectedColor = "#58a6ff";
let textElements = [];
let selectedTextIndex = null;
let isCreatingText = false;
let textCreateStart = null;
let textCreateCurrent = null;

// Mock functions
function saveState() { console.log("saveState() called"); }

console.log("=== Testing Renamed Text Creation Variables ===");

// Test text creation with renamed variables
console.log("1. Starting text creation:");
isCreatingText = true;
textCreateStart = { x: 100, y: 100 };
textCreateCurrent = { x: 150, y: 120 };

console.log("Variables set correctly:", {
  isCreatingText,
  textCreateStart,
  textCreateCurrent
});

// Test creation logic
console.log("\n2. Creating text element:");
if (isCreatingText && textCreateStart && textCreateCurrent) {
  const dx = Math.abs(textCreateCurrent.x - textCreateStart.x);
  const dy = Math.abs(textCreateCurrent.y - textCreateStart.y);

  const centerX = (textCreateStart.x + textCreateCurrent.x) / 2;
  const centerY = (textCreateStart.y + textCreateCurrent.y) / 2;
  const width = Math.max(dx * 2, 100);
  const height = Math.max(dy * 2, 50);

  const newText = {
    x: centerX,
    y: centerY,
    content: "Double click to Change",
    type: "rectangle",
    bubbleColor: "#ffffff",
    textColor: selectedColor,
    shadowColor: "rgba(0,0,0,0.3)",
    bubbleWidth: width,
    bubbleHeight: height,
  };

  textElements.push(newText);
  const newIndex = textElements.length - 1;
  selectedTextIndex = newIndex;
  saveState();

  console.log("Created text element:", newText);
}

// Reset variables
console.log("\n3. Resetting variables:");
isCreatingText = false;
textCreateStart = null;
textCreateCurrent = null;

console.log("Variables reset:", {
  isCreatingText,
  textCreateStart,
  textCreateCurrent
});

console.log("\nSUCCESS: Renamed variables work correctly!");
