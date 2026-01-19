// Test that text modal DOM elements are properly referenced
// Mock DOM elements for testing

// Create mock DOM elements
const mockElements = {
  "tm-content": { value: "" },
  "tm-type-selector": { innerHTML: "" },
  "tm-cancel": { onclick: null },
  "tm-save": { onclick: null },
  "tm-bubble-width": { value: "" },
  "tm-bubble-height": { value: "" },
  "tm-bubble-size-auto": { onclick: null },
  "text-modal-title": { textContent: "" },
  "text-modal-backdrop": { style: { display: "none" } },
  "text-modal-close": { onclick: null },
};

global.document = {
  getElementById: function(id) {
    return mockElements[id] || null;
  }
};

// Mock the variables that would be defined
let modalTextIndex = null;
let modalTextX = null;
let modalTextY = null;
let currentTextType = "plain";
let selectedBubbleColor = "#ffffff";
let selectedTextColor = "#000000";
let selectedShadowColor = "rgba(0,0,0,0.3)";

// Mock the DOM element references
const tmContent = document.getElementById("tm-content");
const tmTypeSelector = document.getElementById("tm-type-selector");
const tmCancel = document.getElementById("tm-cancel");
const tmSave = document.getElementById("tm-save");
const tmBubbleWidth = document.getElementById("tm-bubble-width");
const tmBubbleHeight = document.getElementById("tm-bubble-height");
const tmBubbleSizeAuto = document.getElementById("tm-bubble-size-auto");
const textModalBackdrop = document.getElementById("text-modal-backdrop");
const textModalClose = document.getElementById("text-modal-close");

// Mock functions
function renderTextTypeSelectorInModal() { console.log("renderTextTypeSelectorInModal called"); }
function renderTextColorPickers() { console.log("renderTextColorPickers called"); }
function updateShadowColorFieldVisibility() { console.log("updateShadowColorFieldVisibility called"); }

// Test the openTextModal function
function openTextModal(textIndex = null, x = null, y = null) {
  console.log(`openTextModal called with textIndex=${textIndex}, x=${x}, y=${y}`);

  modalTextIndex = textIndex;
  modalTextX = x;
  modalTextY = y;

  if (textIndex !== null) {
    // Edit existing text - would need textElements array
    console.log("Editing existing text");
    document.getElementById("text-modal-title").textContent = "Edit Text";
  } else {
    // Create new text
    console.log("Creating new text");
    tmContent.value = "";
    selectedBubbleColor = "#ffffff";
    selectedTextColor = "#000000";
    selectedShadowColor = "rgba(0,0,0,0.3)";

    // Test that tmBubbleWidth is accessible
    console.log("Setting tmBubbleWidth.value to empty string");
    tmBubbleWidth.value = "";

    console.log("Setting tmBubbleHeight.value to empty string");
    tmBubbleHeight.value = "";

    document.getElementById("text-modal-title").textContent = "Add Text";
  }

  renderTextTypeSelectorInModal();
  renderTextColorPickers();
  updateShadowColorFieldVisibility();

  // Auto-size button
  tmBubbleSizeAuto.onclick = () => {
    tmBubbleWidth.value = "";
    tmBubbleHeight.value = "";
  };

  textModalBackdrop.style.display = "flex";
  console.log("Modal opened successfully");
}

console.log("=== Testing Text Modal DOM References ===");

// Test creating new text (this is what fails according to the user)
console.log("Testing new text creation:");
try {
  openTextModal(null, 100, 200);
  console.log("SUCCESS: Text modal opened without errors");
} catch (error) {
  console.log("ERROR:", error.message);
}

// Test editing existing text (if textElements existed)
console.log("\nTesting text editing:");
try {
  // This would normally have a textElements array, but for testing we'll skip
  console.log("Text editing test skipped (would need textElements array)");
} catch (error) {
  console.log("ERROR:", error.message);
}

console.log("\nDOM element check:");
console.log("tmBubbleWidth exists:", !!tmBubbleWidth);
console.log("tmBubbleHeight exists:", !!tmBubbleHeight);
console.log("tmBubbleSizeAuto exists:", !!tmBubbleSizeAuto);



