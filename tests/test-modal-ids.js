const fs = require('fs');
const path = require('path');
const vm = require('vm');

// Read index.html to check all element IDs used by ModalManager
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

// List of element IDs used in modal.js
const modalElementIds = [
  "pin-modal",
  "pin-modal-backdrop",
  "pin-modal-close",
  "add-color-modal",
  "add-color-modal-backdrop",
  "card-modal",
  "card-modal-backdrop",
  "load-modal",
  "load-modal-backdrop",
  "modal-tabs",
  "modal-color-palette",
  "pm-title",
  "pm-description",
  "pm-note",
  "pm-date",
  "pm-color",
  "pm-text-color",
  "pm-pin-selector",
  "pm-scale",
  "pm-area-scale",
  "area-scale-container",
  "pm-hide-shape",
  "pm-save",
  "pm-delete",
  "pm-image-preview",
  "pm-image-file",
  "pm-image-style",
  "pm-image-position",
  "pm-image-size",
  "pm-image-size-value",
  "pm-remove-image"
];

console.log("Checking element IDs in index.html:");
let missing = [];
for (const id of modalElementIds) {
  const regex = new RegExp(`id=["']${id}["']`);
  if (!regex.test(html)) {
    missing.push(id);
    console.log(`❌ MISSING in index.html: id="${id}"`);
  } else {
    console.log(`✅ FOUND: id="${id}"`);
  }
}

if (missing.length === 0) {
  console.log("\nAll 31 modal element IDs exist in index.html!");
} else {
  console.log(`\n${missing.length} elements missing!`);
}
