// Test area drag-to-size functionality
let isDraggingArea = false;
let areaDragStart = null;
let areaDragCurrent = null;
let currentTypeId = "area:rectangle";
let selectedColor = "#58a6ff";
let pins = [];
let selectedPinIndex = null;

// Mock functions
function worldToScreen(world) {
  return { x: world.x * 2, y: world.y * 2 }; // Simple mock
}

function setSelectedPin(index) {
  selectedPinIndex = index;
  console.log(`Selected pin ${index}`);
}

function saveState() {
  console.log("State saved");
}

// Test the area drag logic
console.log("=== Testing Area Drag-to-Size ===");

// Simulate starting area drag
console.log("\n1. Starting area drag:");
isDraggingArea = true;
areaDragStart = { x: 100, y: 100 };
areaDragCurrent = { x: 100, y: 100 };
console.log("Started drag at:", areaDragStart);

// Simulate dragging to create a rectangle
console.log("\n2. Dragging to (200, 150):");
areaDragCurrent = { x: 200, y: 150 };
console.log("Current drag position:", areaDragCurrent);

// Simulate mouse up - should create area
console.log("\n3. Mouse up - creating area:");
if (isDraggingArea && areaDragStart && areaDragCurrent) {
  const dx = Math.abs(areaDragCurrent.x - areaDragStart.x);
  const dy = Math.abs(areaDragCurrent.y - areaDragStart.y);

  console.log(`Drag distance: dx=${dx}, dy=${dy}`);

  if (dx > 10 || dy > 10) {
    const centerX = (areaDragStart.x + areaDragCurrent.x) / 2;
    const centerY = (areaDragStart.y + areaDragCurrent.y) / 2;
    const width = Math.max(dx * 2, 50);
    const height = Math.max(dy * 2, 50);

    console.log(`Creating area at (${centerX}, ${centerY}) with size ${width}×${height}`);

    const newPin = {
      x: centerX,
      y: centerY,
      color: selectedColor,
      label: "",
      note: "",
      date: "",
      typeId: currentTypeId,
      width: width,
      height: height,
      title: "",
      description: "",
      fillColor: selectedColor + "40",
      borderColor: selectedColor,
      borderWidth: 2,
      textColor: "#FFFFFF",
      icon: "",
      iconColor: selectedColor,
      containedPins: [],
    };

    pins.push(newPin);
    const newIndex = pins.length - 1;
    setSelectedPin(newIndex);
    saveState();

    console.log("Created area pin:", newPin);
  } else {
    console.log("Drag too small, area not created");
  }
}

// Reset drag state
isDraggingArea = false;
areaDragStart = null;
areaDragCurrent = null;

console.log("\n4. Testing circle area:");
currentTypeId = "area:circle";
isDraggingArea = true;
areaDragStart = { x: 50, y: 50 };
areaDragCurrent = { x: 100, y: 80 };

if (isDraggingArea && areaDragStart && areaDragCurrent) {
  const dx = Math.abs(areaDragCurrent.x - areaDragStart.x);
  const dy = Math.abs(areaDragCurrent.y - areaDragStart.y);

  if (dx > 10 || dy > 10) {
    const centerX = (areaDragStart.x + areaDragCurrent.x) / 2;
    const centerY = (areaDragStart.y + areaDragCurrent.y) / 2;
    const width = Math.max(dx * 2, 50);
    const height = Math.max(dy * 2, 50);

    const newPin = {
      x: centerX,
      y: centerY,
      color: selectedColor,
      label: "",
      note: "",
      date: "",
      typeId: currentTypeId,
      width: width,
      height: height,
      title: "",
      description: "",
      fillColor: selectedColor + "40",
      borderColor: selectedColor,
      borderWidth: 2,
      textColor: "#FFFFFF",
      icon: "",
      iconColor: selectedColor,
      containedPins: [],
    };

    pins.push(newPin);
    console.log("Created circle area pin:", newPin);
  }
}

console.log("\nFinal pins array:", pins);
console.log("Total areas created:", pins.length);



