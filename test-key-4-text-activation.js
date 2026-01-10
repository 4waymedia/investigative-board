// Test that pressing '4' correctly activates text tool in type-bar
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

function renderMenu() {
  console.log("renderMenu() called - type-bar should update");

  // Simulate type-bar rendering
  const families = [
    { id: "pin", label: "Pin" },
    { id: "card", label: "Card" },
    { id: "area", label: "Area" },
    { id: "text", label: "Text" }
  ];

  families.forEach(f => {
    let activeType = "●"; // Default icon
    if (f.id === "text") {
      const textType = TEXT_TYPES.find((t) => t.id === currentTextType) || TEXT_TYPES[0];
      activeType = textType.icon;
    }

    const isActive = f.id === "text" ? currentTool === "text" : currentFamily === f.id;
    console.log(`  ${f.label}: icon=${activeType}, active=${isActive}`);
  });
}

// Simulate keyboard shortcut for key 4
function handleKey4() {
  if (currentTool === "text") {
    // Cycle through text types
    const currentIndex = TEXT_TYPES.findIndex((t) => t.id === currentTextType);
    const nextIndex = (currentIndex + 1) % TEXT_TYPES.length;
    currentTextType = TEXT_TYPES[nextIndex].id;
    console.log(`Cycled text type to: ${currentTextType}`);
    renderMenu();
  } else {
    setTool("text");
  }
}

console.log("=== Testing Key 4 Text Tool Activation ===");
console.log("Initial state:", { currentTool, currentFamily, currentTextType });
renderMenu();

// Test pressing 4 when not on text (should activate text tool)
console.log("\n--- Pressing '4' (activate text tool) ---");
handleKey4();

// Test pressing 4 again (should cycle text types)
console.log("\n--- Pressing '4' again (cycle to rectangle) ---");
handleKey4();

console.log("\n--- Pressing '4' again (cycle to comic) ---");
handleKey4();

console.log("\n--- Pressing '4' again (cycle to title) ---");
handleKey4();

console.log("\n--- Pressing '4' again (cycle back to plain) ---");
handleKey4();

console.log("\nFinal state:", { currentTool, currentFamily, currentTextType });
