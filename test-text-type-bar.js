// Test that text types are handled through the type-bar
let currentTool = "pin";
let currentFamily = "pin";
let currentTextType = "plain";

const TEXT_TYPES = [
  { id: "plain", label: "Plain", icon: "📝" },
  { id: "rectangle", label: "Rectangle", icon: "▭" },
  { id: "comic", label: "Comic", icon: "💬" },
  { id: "title", label: "Title", icon: "📰" },
];

function setTool(id) {
  currentTool = id;
  if (id === "text") {
    currentFamily = "pin";
  }
  console.log(`setTool("${id}"): currentTool=${currentTool}, currentFamily=${currentFamily}`);
}

function setCurrentFamily(family) {
  if (family === "text") {
    setTool("text");
    currentFamily = "pin";
  } else {
    if (currentTool === "text") {
      setTool("pin");
    }
    currentFamily = family;
  }
  console.log(`setCurrentFamily("${family}"): currentTool=${currentTool}, currentFamily=${currentFamily}`);
}

// Test keyboard shortcuts
console.log("=== Testing Text Type-Bar Integration ===");
console.log("Initial state:", { currentTool, currentFamily, currentTextType });

// Test pressing 4 (should activate text in type-bar)
console.log("\nPressing key 4 (Text):");
if (currentTool !== "text") {
  setTool("text");
}
console.log("Text should now be active in type-bar");

// Test that text types can be cycled via dropdown (simulated)
console.log("\nSimulating clicking text dropdown caret:");
console.log("Available text types:");
TEXT_TYPES.forEach(type => {
  console.log(`  ${type.icon} ${type.label} (${type.id})`);
});

// Simulate selecting a different text type
console.log("\nSelecting 'comic' text type:");
currentTextType = "comic";
console.log(`currentTextType changed to: ${currentTextType}`);

// Test pressing 4 again (should stay on text since it's already active)
console.log("\nPressing key 4 again (should stay on text):");
if (currentTool !== "text") {
  setTool("text");
}
console.log("Text remains active");

// Test switching back to pin
console.log("\nPressing key 1 (Pin):");
setTool("pin");
console.log("Switched back to pin tool");

console.log("\nFinal state:", { currentTool, currentFamily, currentTextType });
