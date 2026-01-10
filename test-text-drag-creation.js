// Test text drag-to-size creation
let selectedColor = "#58a6ff";
let textElements = [];
let selectedTextIndex = null;
let isDraggingText = false;
let textDragStart = null;
let textDragCurrent = null;

// Mock functions
function saveState() { console.log("saveState() called"); }

// Test the text creation logic
console.log("=== Testing Text Drag-to-Size Creation ===");

// Simulate starting text drag
console.log("1. Starting text drag:");
isDraggingText = true;
textDragStart = { x: 100, y: 100 };
textDragCurrent = { x: 100, y: 100 };
console.log("Started drag at:", textDragStart);

// Simulate dragging to create a text bubble
console.log("\n2. Dragging to create text bubble:");
textDragCurrent = { x: 200, y: 130 };

// Simulate mouse up - should create text
console.log("\n3. Mouse up - creating text:");
if (isDraggingText && textDragStart && textDragCurrent) {
  const dx = Math.abs(textDragCurrent.x - textDragStart.x);
  const dy = Math.abs(textDragCurrent.y - textDragStart.y);

  const centerX = (textDragStart.x + textDragCurrent.x) / 2;
  const centerY = (textDragStart.y + textDragCurrent.y) / 2;
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
  console.log("Text elements count:", textElements.length);
  console.log("Selected text index:", selectedTextIndex);
}

// Reset drag state
isDraggingText = false;
textDragStart = null;
textDragCurrent = null;

console.log("\n4. Testing default click (no drag):");
isDraggingText = true;
textDragStart = { x: 50, y: 50 };
textDragCurrent = { x: 50, y: 50 }; // No drag movement

// Simulate mouse up with no drag
if (isDraggingText && textDragStart && textDragCurrent) {
  const dx = Math.abs(textDragCurrent.x - textDragStart.x);
  const dy = Math.abs(textDragCurrent.y - textDragStart.y);

  const centerX = (textDragStart.x + textDragCurrent.x) / 2;
  const centerY = (textDragStart.y + textDragCurrent.y) / 2;
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

  console.log("Created default text element:", newText);
}

console.log("\nFinal state:");
console.log("Text elements:", textElements.length);
console.log("Selected text:", selectedTextIndex !== null ? `index ${selectedTextIndex}` : "none");
