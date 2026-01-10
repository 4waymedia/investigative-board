// Simple test script to verify keyboard shortcuts work
// Run this in the browser console to test

// Mock the necessary variables and functions
let currentFamily = "pin";
let currentTypeId = "pin:circle";
let currentTool = "pin";
let currentTextType = "plain";

const NODE_TYPES = [
  { id: "pin:circle", family: "pin", variant: "circle" },
  { id: "pin:square", family: "pin", variant: "square" },
  { id: "pin:pill", family: "pin", variant: "pill" },
  { id: "card:card", family: "card", variant: "card" },
  { id: "card:doc", family: "card", variant: "document" },
  { id: "card:folder", family: "card", variant: "folder" },
  { id: "area:circle", family: "area", variant: "circle" },
  { id: "area:square", family: "area", variant: "square" },
  { id: "area:rectangle", family: "area", variant: "rectangle" },
];

const TEXT_TYPES = [
  { id: "plain" },
  { id: "rectangle" },
  { id: "comic" },
  { id: "title" },
];

function selectFamily(family) {
  currentFamily = family;
  const fallback = NODE_TYPES.find((t) => t.family === family);
  currentTypeId = fallback ? fallback.id : NODE_TYPES[0].id;
  console.log(`Selected family: ${family}, currentTypeId: ${currentTypeId}`);
}

function cycleVariantInCurrentFamily() {
  const variants = NODE_TYPES.filter((t) => t.family === currentFamily);
  if (variants.length <= 1) return;

  const currentIndex = variants.findIndex((t) => t.id === currentTypeId);
  const nextIndex = (currentIndex + 1) % variants.length;
  const nextType = variants[nextIndex];

  currentTypeId = nextType.id;
  console.log(`Cycled to: ${currentTypeId}`);
}

function setCurrentFamily(family) {
  if (family === "text") {
    currentTool = "text";
  } else {
    currentFamily = family;
    currentTypeId = NODE_TYPES.find((t) => t.family === family).id;
  }
  console.log(`Set current family/tool: ${family}, currentTypeId: ${currentTypeId}`);
}

// Test the keyboard shortcuts
console.log("Testing keyboard shortcuts:");
console.log("Initial state - currentFamily:", currentFamily, "currentTypeId:", currentTypeId);

// Test key 1 (Pin)
console.log("\nPressing key 1 (Pin):");
if (currentFamily === "pin") {
  cycleVariantInCurrentFamily();
} else {
  selectFamily("pin");
}

// Test cycling pin variants
console.log("Pressing key 1 again (cycle pin variants):");
cycleVariantInCurrentFamily();
console.log("Pressing key 1 again (cycle pin variants):");
cycleVariantInCurrentFamily();

// Test key 2 (Card)
console.log("\nPressing key 2 (Card):");
if (currentFamily === "card") {
  cycleVariantInCurrentFamily();
} else {
  selectFamily("card");
}

// Test cycling card variants
console.log("Pressing key 2 again (cycle card variants):");
cycleVariantInCurrentFamily();

// Test key 3 (Area)
console.log("\nPressing key 3 (Area):");
if (currentFamily === "area") {
  cycleVariantInCurrentFamily();
} else {
  selectFamily("area");
}

// Test cycling area variants
console.log("Pressing key 3 again (cycle area variants):");
cycleVariantInCurrentFamily();
console.log("Pressing key 3 again (cycle area variants):");
cycleVariantInCurrentFamily();

// Test key 4 (Text)
console.log("\nPressing key 4 (Text):");
if (currentTool === "text") {
  const currentIndex = TEXT_TYPES.findIndex((t) => t.id === currentTextType);
  const nextIndex = (currentIndex + 1) % TEXT_TYPES.length;
  currentTextType = TEXT_TYPES[nextIndex].id;
  console.log(`Cycled text type to: ${currentTextType}`);
} else {
  setCurrentFamily("text");
}

// Test cycling text types
console.log("Pressing key 4 again (cycle text types):");
const currentIndex = TEXT_TYPES.findIndex((t) => t.id === currentTextType);
const nextIndex = (currentIndex + 1) % TEXT_TYPES.length;
currentTextType = TEXT_TYPES[nextIndex].id;
console.log(`Cycled text type to: ${currentTextType}`);

console.log("\nFinal state - currentFamily:", currentFamily, "currentTypeId:", currentTypeId, "currentTool:", currentTool, "currentTextType:", currentTextType);
