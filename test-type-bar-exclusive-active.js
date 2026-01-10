// Test that type-bar active states are mutually exclusive
let currentTool = "pin";
let currentFamily = "pin";
let currentTextType = "plain";

const TEXT_TYPES = [
  { id: "plain", label: "Plain", icon: "📝" },
  { id: "rectangle", label: "Rectangle", icon: "▭" },
];

function renderTypeBar() {
  console.log("=== Type-Bar Active States ===");
  console.log(`Current state: tool=${currentTool}, family=${currentFamily}, textType=${currentTextType}`);

  const families = [
    { id: "pin", label: "Pin", iconDefault: "●" },
    { id: "card", label: "Card", iconDefault: "📄" },
    { id: "area", label: "Area", iconDefault: "▭" },
    { id: "text", label: "Text", iconDefault: "📝" }
  ];

  families.forEach(f => {
    let activeType = { icon: f.iconDefault };
    if (f.id === "text") {
      const textType = TEXT_TYPES.find((t) => t.id === currentTextType) || TEXT_TYPES[0];
      activeType = { icon: textType.icon };
    }

    // Updated logic: text tool takes precedence over family selection
    const isActive = f.id === "text" ? currentTool === "text" : (currentTool !== "text" && currentFamily === f.id);

    console.log(`  ${f.label}: icon=${activeType.icon}, active=${isActive}`);
  });
  console.log("");
}

// Test different states
console.log("1. Initial state (pin tool active):");
renderTypeBar();

console.log("2. Switch to text tool:");
currentTool = "text";
currentFamily = "pin"; // This gets set when switching to text
renderTypeBar();

console.log("3. Switch back to pin tool:");
currentTool = "pin";
currentFamily = "pin";
renderTypeBar();

console.log("4. Switch to card family:");
currentTool = "pin";
currentFamily = "card";
renderTypeBar();

console.log("5. Switch back to text tool:");
currentTool = "text";
currentFamily = "pin"; // This gets set when switching to text
renderTypeBar();

console.log("6. Change text type while text tool active:");
currentTextType = "rectangle";
renderTypeBar();
