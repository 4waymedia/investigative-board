// Test that text tool behaves like others - cycles when active, switches when not
let currentTool = "pin";
let currentTextType = "plain";

const TEXT_TYPES = [
  { id: "plain", label: "Plain", icon: "📝" },
  { id: "rectangle", label: "Rectangle", icon: "▭" },
  { id: "comic", label: "Comic", icon: "💬" },
  { id: "title", label: "Title", icon: "📰" },
];

function setTool(id) {
  currentTool = id;
  console.log(`setTool("${id}"): currentTool=${currentTool}`);
}

// Simulate keyboard shortcut for key 4
function handleKey4() {
  if (currentTool === "text") {
    // Cycle through text types
    const currentIndex = TEXT_TYPES.findIndex(
      (t) => t.id === currentTextType
    );
    const nextIndex = (currentIndex + 1) % TEXT_TYPES.length;
    currentTextType = TEXT_TYPES[nextIndex].id;
    console.log(`Cycled text type to: ${currentTextType} (${TEXT_TYPES[nextIndex].icon} ${TEXT_TYPES[nextIndex].label})`);
  } else {
    setTool("text");
  }
}

console.log("=== Testing Text Tool Keyboard Cycling ===");
console.log("Initial state:", { currentTool, currentTextType });

// Test pressing 4 when not on text (should switch to text)
console.log("\nPressing key 4 (not on text):");
handleKey4();

// Test pressing 4 repeatedly (should cycle through text types)
console.log("\nPressing key 4 (cycle plain → rectangle):");
handleKey4();

console.log("\nPressing key 4 (cycle rectangle → comic):");
handleKey4();

console.log("\nPressing key 4 (cycle comic → title):");
handleKey4();

console.log("\nPressing key 4 (cycle title → plain):");
handleKey4();

// Test switching back to pin
console.log("\nSwitching to pin tool:");
setTool("pin");

// Test pressing 4 again (should switch back to text)
console.log("\nPressing key 4 (switch back to text):");
handleKey4();

console.log("\nFinal state:", { currentTool, currentTextType });
