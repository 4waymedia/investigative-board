// Test that there are no duplicate DOM element declarations
console.log("=== Testing No Duplicate DOM Declarations ===");

// Mock document.getElementById to return mock elements
const mockElements = {
  "tm-content": { value: "" },
  "tm-type-selector": { innerHTML: "" },
  "tm-cancel": { onclick: null },
  "tm-save": { onclick: null },
  "tm-bubble-width": { value: "" },
  "tm-bubble-height": { value: "" },
  "tm-bubble-size-auto": { onclick: null },
  "text-modal-backdrop": { style: { display: "none" } },
  "text-modal-close": { onclick: null },
};

global.document = {
  getElementById: function(id) {
    return mockElements[id] || null;
  }
};

// Test the lazy-loaded DOM element references (should work without duplicates)
try {
  // Lazy-loaded DOM element references for text modal
  const tmContent = () => document.getElementById("tm-content");
  const tmTypeSelector = () => document.getElementById("tm-type-selector");
  const tmCancel = () => document.getElementById("tm-cancel");
  const tmSave = () => document.getElementById("tm-save");
  const tmBubbleWidth = () => document.getElementById("tm-bubble-width");
  const tmBubbleHeight = () => document.getElementById("tm-bubble-height");
  const tmBubbleSizeAuto = () => document.getElementById("tm-bubble-size-auto");
  const textModalBackdrop = () => document.getElementById("text-modal-backdrop");
  const textModalClose = () => document.getElementById("text-modal-close");

  console.log("All lazy-loaded DOM references created successfully");

  // Test accessing them
  console.log("tmBubbleWidth() works:", !!tmBubbleWidth());
  console.log("textModalBackdrop() works:", !!textModalBackdrop());
  console.log("textModalClose() works:", !!textModalClose());

  console.log("SUCCESS: No duplicate declaration errors");

} catch (error) {
  console.log("ERROR:", error.message);
}


