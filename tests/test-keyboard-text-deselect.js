// Test that pressing 1, 2, 3 deselects text tool
let currentTool = "text";
let currentFamily = "pin";
let currentTypeId = "pin:circle";

const NODE_TYPES = [
  { id: "pin:circle", family: "pin" },
  { id: "card:card", family: "card" },
  { id: "area:circle", family: "area" },
];

function setTool(id) {
  currentTool = id;
  if (id === "text") {
    currentFamily = "pin";
  }
  console.log(`setTool("${id}"): currentTool=${currentTool}`);
}

function selectFamily(family) {
  currentFamily = family;
  if (currentTool === "text") {
    setTool("pin");
  }
  const fallback = NODE_TYPES.find((t) => t.family === family);
  currentTypeId = fallback ? fallback.id : NODE_TYPES[0].id;
  console.log(`selectFamily("${family}"): currentFamily=${currentFamily}, currentTypeId=${currentTypeId}, currentTool=${currentTool}`);
}

function cycleVariantInCurrentFamily() {
  console.log(`cycleVariantInCurrentFamily(): cycling ${currentFamily}`);
}

// Simulate keyboard shortcuts
console.log("=== Testing Keyboard Shortcuts Deselect Text ===");
console.log("Initial state (text tool selected):", { currentTool, currentFamily, currentTypeId });

// Test pressing 1 when text is selected (should select pin family)
console.log("\nPressing key 1 (Pin) while text is selected:");
if (currentTool === "text") {
  selectFamily("pin");
} else if (currentFamily === "pin") {
  cycleVariantInCurrentFamily();
} else {
  selectFamily("pin");
}

// Reset to text tool for next test
currentTool = "text";
console.log("\nReset to text tool:", { currentTool, currentFamily, currentTypeId });

// Test pressing 2 when text is selected (should select card family)
console.log("\nPressing key 2 (Card) while text is selected:");
if (currentTool === "text") {
  selectFamily("card");
} else if (currentFamily === "card") {
  cycleVariantInCurrentFamily();
} else {
  selectFamily("card");
}

// Reset to text tool for next test
currentTool = "text";
console.log("\nReset to text tool:", { currentTool, currentFamily, currentTypeId });

// Test pressing 3 when text is selected (should select area family)
console.log("\nPressing key 3 (Area) while text is selected:");
if (currentTool === "text") {
  selectFamily("area");
} else if (currentFamily === "area") {
  cycleVariantInCurrentFamily();
} else {
  selectFamily("area");
}

// Test cycling when already on the family
console.log("\nPressing key 1 again (should cycle pin variants):");
if (currentFamily === "pin") {
  cycleVariantInCurrentFamily();
} else {
  selectFamily("pin");
}

console.log("\nFinal state:", { currentTool, currentFamily, currentTypeId });
