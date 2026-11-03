/**
 * Test: Radial menu edit action and pin modal firing
 * Validates that clicking the pencil action on card, shape, and area pins properly triggers the pin modal.
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

// Mock browser environment
global.window = global;
global.document = {
  elements: {},
  getElementById(id) {
    if (!this.elements[id]) {
      this.elements[id] = {
        id,
        style: { display: 'none' },
        classList: {
          classes: new Set(),
          add(c) { this.classes.add(c); },
          remove(c) { this.classes.delete(c); },
          contains(c) { return this.classes.has(c); }
        },
        querySelectorAll: () => [],
        querySelector: () => null,
        addEventListener: () => {},
        removeEventListener: () => {},
        value: '',
        textContent: '',
        innerHTML: '',
        appendChild: () => {}
      };
    }
    return this.elements[id];
  },
  querySelectorAll: () => [],
  querySelector: () => null,
  addEventListener: () => {},
  removeEventListener: () => {}
};

// Load actions module
require('../js/core/actions.js');

// Verify PIN_MODAL_MAPPINGS
assert.strictEqual(window.PIN_MODAL_MAPPINGS['card'], 'pin', "Card shape should map to 'pin' modal");
assert.strictEqual(window.PIN_MODAL_MAPPINGS['doc'], 'pin', "Doc shape should map to 'pin' modal");
assert.strictEqual(window.PIN_MODAL_MAPPINGS['folder'], 'pin', "Folder shape should map to 'pin' modal");
assert.strictEqual(window.PIN_MODAL_MAPPINGS['circle'], 'pin', "Circle shape should map to 'pin' modal");
assert.strictEqual(window.PIN_MODAL_MAPPINGS['area-rect'], 'pin', "Area rect shape should map to 'pin' modal");

// Setup mock app
let modalOpenedWithIndex = null;

window.app = {
  appState: {
    selectedPin: 1,
    pins: [
      { shape: 'circle', label: 'Pin 0', color: '#ff0000' },
      { shape: 'card', label: 'Card Pin 1', color: '#58a6ff', variant: 'document' },
      { shape: 'folder', label: 'Folder Pin 2', color: '#3fb950' }
    ]
  },
  modalManager: {
    openPinModal(index) {
      modalOpenedWithIndex = index;
      document.getElementById('pin-modal').style.display = 'block';
      document.getElementById('pin-modal-backdrop').style.display = 'flex';
    }
  }
};

// Test 1: Explicit pinIndex for card shape pin
modalOpenedWithIndex = null;
const success1 = window.executeAction('pin:edit', 1);
assert.strictEqual(success1, true, "executeAction('pin:edit', 1) should succeed");
assert.strictEqual(modalOpenedWithIndex, 1, "modalManager.openPinModal should be called with index 1");
assert.strictEqual(document.getElementById('pin-modal').style.display, 'block', "pin-modal should be displayed");
assert.strictEqual(document.getElementById('pin-modal-backdrop').style.display, 'flex', "pin-modal-backdrop should be displayed");

// Test 2: Explicit pinIndex for folder shape pin
modalOpenedWithIndex = null;
const success2 = window.executeAction('pin:edit', 2);
assert.strictEqual(success2, true, "executeAction('pin:edit', 2) should succeed");
assert.strictEqual(modalOpenedWithIndex, 2, "modalManager.openPinModal should be called with index 2");

// Test 3: No index provided (fallback to appState.selectedPin)
modalOpenedWithIndex = null;
window.app.appState.selectedPin = 0;
const success3 = window.executeAction('pin:edit');
assert.strictEqual(success3, true, "executeAction('pin:edit') without index should use selectedPin");
assert.strictEqual(modalOpenedWithIndex, 0, "modalManager.openPinModal should be called with selectedPin index 0");

console.log("✅ All radial edit action tests passed successfully!");
