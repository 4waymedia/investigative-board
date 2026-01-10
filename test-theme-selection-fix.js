// Test theme selection fix
let currentThemeId = "default";
let palette = [
  { name: "Red", value: "#f85149" },
  { name: "Blue", value: "#58a6ff" },
  { name: "Green", value: "#3fb950" }
];
let selectedColor = "#58a6ff";

const THEMES = [
  {
    id: "default",
    name: "Default",
    colors: [
      { name: "Red", value: "#f85149" },
      { name: "Blue", value: "#58a6ff" },
      { name: "Green", value: "#3fb950" }
    ]
  },
  {
    id: "g1",
    name: "Investigative Noir",
    colors: [
      { name: "Color 1", value: "#000000" },
      { name: "Color 2", value: "#1A1A1A" },
      { name: "Color 3", value: "#4A4A4A" }
    ]
  }
];

function applyTheme(themeId) {
  console.log(`Applying theme: ${themeId}`);
  const theme = THEMES.find((t) => t.id === themeId);
  if (!theme) {
    console.log("Theme not found!");
    return;
  }

  currentThemeId = themeId;
  console.log(`Set currentThemeId to: ${currentThemeId}`);

  // Replace palette with theme colors
  palette = theme.colors.map((c) => ({ ...c }));
  console.log("Updated palette:", palette);

  // Set selected color to first color
  selectedColor = palette.length > 0 ? palette[0].value : "#888888";
  console.log(`Set selectedColor to: ${selectedColor}`);

  console.log("Theme applied successfully");
}

function renderMenu() {
  console.log("Rendering menu with palette:");
  palette.forEach((col, index) => {
    const isActive = col.value === selectedColor;
    console.log(`  ${index + 1}. ${col.name}: ${col.value} ${isActive ? '(ACTIVE)' : ''}`);
  });
}

console.log("=== Testing Theme Selection Fix ===");
console.log("Initial state:");
console.log(`currentThemeId: ${currentThemeId}`);
renderMenu();

// Simulate clicking on G1 theme
console.log("\nSimulating theme selection (clicking on 'g1'):");
applyTheme("g1");
renderMenu();

console.log("\nFinal state:");
console.log(`currentThemeId: ${currentThemeId}`);
