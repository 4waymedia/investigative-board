// Test that canvasContainer is properly defined
// This would normally run in browser context

// Mock DOM elements for testing
const mockCanvasContainer = {
  style: { background: "" },
  setAttribute: function() {}
};

// Mock document.getElementById
global.document = {
  getElementById: function(id) {
    if (id === "canvas-container") {
      return mockCanvasContainer;
    }
    return null;
  }
};

// Test the canvasContainer reference
const canvasContainer = document.getElementById("canvas-container");

console.log("Testing canvasContainer reference:");
console.log("canvasContainer exists:", !!canvasContainer);

if (canvasContainer) {
  console.log("canvasContainer has style property:", !!canvasContainer.style);
  canvasContainer.style.background = "#0d1117";
  console.log("Successfully set background:", canvasContainer.style.background);
} else {
  console.log("ERROR: canvasContainer is null!");
}

// Test applyThemeBackground function logic
function applyThemeBackground(theme) {
  console.log("\nTesting applyThemeBackground with theme:", theme);

  if (!theme || !theme.background || !canvasContainer) {
    console.log("Setting default background");
    if (canvasContainer) {
      canvasContainer.style.background = "#0d1117"; // Default
    }
    return;
  }

  const bg = theme.background;
  let cssBackground = "";

  // Convert theme background to CSS
  if (bg.type === "solid") {
    cssBackground = bg.value || "#0d1117";
  } else if (bg.type === "linear-gradient") {
    cssBackground = bg.value || `linear-gradient(to bottom, ${bg.colors?.[0] || "#0d1117"}, ${bg.colors?.[1] || "#0d1117"})`;
  } else {
    cssBackground = bg.value || "#0d1117";
  }

  console.log("Setting CSS background:", cssBackground);
  canvasContainer.style.background = cssBackground;
}

// Test with different theme types
applyThemeBackground(null);
applyThemeBackground({ background: { type: "solid", value: "#ff0000" } });
applyThemeBackground({ background: { type: "linear-gradient", value: "linear-gradient(to right, #ff0000, #0000ff)" } });
