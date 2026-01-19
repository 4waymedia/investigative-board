// Test theme selection functionality
let currentThemeId = "default";
let palette = [
  { name: "Default Blue", value: "#58a6ff" },
  { name: "Red", value: "#ff4757" },
  { name: "Green", value: "#2ed573" }
];
let selectedColor = "#58a6ff";

const THEMES = [
  {
    id: "default",
    name: "Default",
    colors: [
      { name: "Blue", value: "#58a6ff" },
      { name: "Green", value: "#2ed573" },
      { name: "Purple", value: "#5352ed" }
    ]
  },
  {
    id: "dark",
    name: "Dark",
    colors: [
      { name: "Dark Blue", value: "#3742fa" },
      { name: "Dark Red", value: "#ff3838" },
      { name: "Dark Green", value: "#32ff7e" }
    ]
  }
];

let themeMenuEl = null;

function closeThemeMenu() {
  if (themeMenuEl) {
    console.log("Closing theme menu");
    themeMenuEl = null;
  }
}

function applyTheme(themeId) {
  console.log(`Applying theme: ${themeId}`);
  const theme = THEMES.find((t) => t.id === themeId);
  if (!theme) {
    console.log("Theme not found");
    return;
  }

  currentThemeId = themeId;
  console.log(`Set currentThemeId to: ${currentThemeId}`);

  // Replace palette with theme colors
  palette = theme.colors.map((c) => ({ ...c })); // Clone colors
  console.log("Updated palette:", palette);

  // Set selected color to first color in new palette
  selectedColor = palette.length > 0 ? palette[0].value : "#888888";
  console.log(`Set selectedColor to: ${selectedColor}`);

  console.log("Theme applied successfully");
}

function renderMenu() {
  console.log("Rendering menu with current palette:");
  palette.forEach((col, index) => {
    const isActive = col.value === selectedColor;
    console.log(`  ${index + 1}. ${col.name}: ${col.value} ${isActive ? '(ACTIVE)' : ''}`);
  });
}

console.log("=== Testing Theme Selection ===");
console.log("Initial state:");
console.log(`currentThemeId: ${currentThemeId}`);
console.log("Initial palette:", palette);
console.log(`selectedColor: ${selectedColor}`);

// Simulate selecting a theme
console.log("\nSelecting 'dark' theme:");
applyTheme("dark");
renderMenu();

// Simulate menu closing
closeThemeMenu();

console.log("\nFinal state:");
console.log(`currentThemeId: ${currentThemeId}`);
console.log("Final palette:", palette);
console.log(`selectedColor: ${selectedColor}`);



