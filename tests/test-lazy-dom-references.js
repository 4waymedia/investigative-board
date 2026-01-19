// Test lazy-loaded DOM element references
let domReady = false;

// Mock DOM elements that get created after script runs
const mockElements = {};

// Simulate DOM being ready
function makeDOMReady() {
  mockElements["tm-content"] = { value: "" };
  mockElements["tm-type-selector"] = { innerHTML: "" };
  mockElements["tm-cancel"] = { onclick: null };
  mockElements["tm-save"] = { onclick: null };
  mockElements["tm-bubble-width"] = { value: "" };
  mockElements["tm-bubble-height"] = { value: "" };
  mockElements["tm-bubble-size-auto"] = { onclick: null };
  mockElements["text-modal-backdrop"] = { style: { display: "none" } };
  mockElements["text-modal-close"] = { onclick: null };
  domReady = true;
}

global.document = {
  getElementById: function(id) {
    return mockElements[id] || null;
  }
};

// Lazy-loaded DOM element references (same as in the main code)
const tmContent = () => document.getElementById("tm-content");
const tmTypeSelector = () => document.getElementById("tm-type-selector");
const tmCancel = () => document.getElementById("tm-cancel");
const tmSave = () => document.getElementById("tm-save");
const tmBubbleWidth = () => document.getElementById("tm-bubble-width");
const tmBubbleHeight = () => document.getElementById("tm-bubble-height");
const tmBubbleSizeAuto = () => document.getElementById("tm-bubble-size-auto");
const textModalBackdrop = () => document.getElementById("text-modal-backdrop");
const textModalClose = () => document.getElementById("text-modal-close");

// Mock variables
let modalTextIndex = null;
let modalTextX = null;
let modalTextY = null;
let currentTextType = "plain";
let selectedBubbleColor = "#ffffff";
let selectedTextColor = "#000000";
let selectedShadowColor = "rgba(0,0,0,0.3)";

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
    console.log("Editing existing text");
  } else {
    console.log("Creating new text");
    tmContent().value = "";
    selectedBubbleColor = "#ffffff";
    selectedTextColor = "#000000";
    selectedShadowColor = "rgba(0,0,0,0.3)";

    // This was the line that was failing before
    console.log("Setting tmBubbleWidth().value to empty string");
    tmBubbleWidth().value = "";

    console.log("Setting tmBubbleHeight().value to empty string");
    tmBubbleHeight().value = "";
  }

  renderTextTypeSelectorInModal();
  renderTextColorPickers();
  updateShadowColorFieldVisibility();

  textModalBackdrop().style.display = "flex";
  console.log("Modal opened successfully");
}

console.log("=== Testing Lazy-Loaded DOM References ===");

// Test before DOM is ready (should fail)
console.log("Testing before DOM is ready:");
try {
  openTextModal(null, 100, 200);
  console.log("UNEXPECTED: Should have failed");
} catch (error) {
  console.log("EXPECTED ERROR:", error.message);
}

// Make DOM ready
makeDOMReady();

// Test after DOM is ready (should work)
console.log("\nTesting after DOM is ready:");
try {
  openTextModal(null, 100, 200);
  console.log("SUCCESS: Text modal opened without errors");
} catch (error) {
  console.log("ERROR:", error.message);
}

console.log("\nDOM element check:");
console.log("tmBubbleWidth() exists:", !!tmBubbleWidth());
console.log("tmBubbleHeight() exists:", !!tmBubbleHeight());
console.log("textModalBackdrop() exists:", !!textModalBackdrop());



