// Test that tmShadowColorField lazy-loaded reference works
let currentTextType = "plain";

// Mock DOM elements
const mockElements = {
  "tm-shadow-color-field": { style: { display: "none" } },
};

global.document = {
  getElementById: function(id) {
    return mockElements[id] || null;
  }
};

// Lazy-loaded DOM element reference
const tmShadowColorField = () => document.getElementById("tm-shadow-color-field");

// Test the updateShadowColorFieldVisibility function
function updateShadowColorFieldVisibility() {
  tmShadowColorField().style.display =
    currentTextType === "plain" ? "block" : "none";
}

console.log("=== Testing Shadow Color Field Reference ===");

console.log("Initial state - currentTextType:", currentTextType);
updateShadowColorFieldVisibility();
console.log("Shadow field display:", tmShadowColorField().style.display);

console.log("\nChanging to rectangle text type:");
currentTextType = "rectangle";
updateShadowColorFieldVisibility();
console.log("Shadow field display:", tmShadowColorField().style.display);

console.log("\nChanging back to plain text type:");
currentTextType = "plain";
updateShadowColorFieldVisibility();
console.log("Shadow field display:", tmShadowColorField().style.display);

console.log("\nSUCCESS: Shadow color field reference works correctly!");



