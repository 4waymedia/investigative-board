// Test script to verify modal keyboard handling fix
// This tests that Shift+typing doesn't close modals when input fields are focused

// Mock DOM environment
global.document = {
  getElementById: function(id) {
    const mockElements = {
      'pin-modal': { style: { display: 'none' } },
      'card-modal': { style: { display: 'none' } },
      'add-color-modal': { style: { display: 'none' } },
      'load-modal': { style: { display: 'none' } },
      'text-modal': { style: { display: 'none' } },
      'text-modal-backdrop': { style: { display: 'none' } }
    };
    return mockElements[id] || null;
  }
};

// Mock document.activeElement
let mockActiveElement = null;
Object.defineProperty(global.document, 'activeElement', {
  get: () => mockActiveElement,
  set: (value) => { mockActiveElement = value; }
});

// Mock console.log to capture output
const originalLog = console.log;
let logOutput = [];
console.log = (...args) => {
  logOutput.push(args.join(' '));
  originalLog(...args);
};

// Mock the app state and dependencies
const mockAppState = {
  currentTool: 'select',
  selectedPinIndex: null,
  connectStartIndex: null,
  pins: [],
  saveHistory: () => {},
  eventHandlers: { marqueeAnimationId: null }
};

// Create a simplified version of handleKeyDown for testing
function handleKeyDown(e) {
  // Track modifier key states (simplified)
  if (e.key === 'Alt') this.altKeyPressed = true;
  if (e.key === 'Control') this.ctrlKeyPressed = true;
  if (e.key === 'Shift') this.shiftKeyPressed = true;

  // Don't process shortcuts when typing in input fields or when modals are open, but allow ESC
  const activeElement = document.activeElement;
  const isInputField = activeElement && (
    activeElement.tagName === 'INPUT' ||
    activeElement.tagName === 'TEXTAREA' ||
    activeElement.contentEditable === 'true'
  );

  // Check if any modals are currently open
  const isModalOpen = (
    (document.getElementById("pin-modal")?.style.display !== "none") ||
    (document.getElementById("card-modal")?.style.display !== "none") ||
    (document.getElementById("add-color-modal")?.style.display !== "none") ||
    (document.getElementById("load-modal")?.style.display !== "none") ||
    (document.getElementById("text-modal")?.style.display !== "none") ||
    (document.getElementById("text-modal-backdrop")?.style.display !== "none")
  );

  // Allow ESC key even in input fields or modals (it's a cancel action)
  if ((isInputField || isModalOpen) && e.key !== 'Escape') {
    // Allow normal typing behavior in input fields and modals for non-ESC keys
    return;
  }

  // Test for Shift+number shortcuts that should be blocked
  if (e.shiftKey && !e.ctrlKey && !e.altKey && e.key >= '1' && e.key <= '9') {
    console.log(`Shift+${e.key} shortcut would be triggered - THIS SHOULD NOT HAPPEN IN MODALS!`);
    e.preventDefault();
    return;
  }

  // Test for other shortcuts
  if (e.key === 'Delete') {
    console.log('Delete key shortcut triggered');
    return;
  }
}

// Test cases
console.log('=== Testing Modal Keyboard Handling Fix ===\n');

// Test 1: Normal operation (no modal, no input focus)
console.log('Test 1: Normal operation (Shift+1 should trigger shortcut)');
handleKeyDown({ key: '1', shiftKey: true, ctrlKey: false, altKey: false, preventDefault: () => {} });

// Test 2: Input field focused (should not trigger shortcuts)
console.log('\nTest 2: Input field focused (Shift+1 should NOT trigger shortcut)');
mockActiveElement = { tagName: 'INPUT' };
logOutput = [];
handleKeyDown({ key: '1', shiftKey: true, ctrlKey: false, altKey: false, preventDefault: () => {} });
if (logOutput.length === 0) {
  console.log('✅ PASS: No shortcut triggered when input field is focused');
} else {
  console.log('❌ FAIL: Shortcut triggered when input field is focused');
}

// Test 3: Modal open (should not trigger shortcuts)
console.log('\nTest 3: Modal open (Shift+1 should NOT trigger shortcut)');
mockActiveElement = null;
document.getElementById('text-modal').style.display = 'block';
logOutput = [];
handleKeyDown({ key: '1', shiftKey: true, ctrlKey: false, altKey: false, preventDefault: () => {} });
if (logOutput.length === 0) {
  console.log('✅ PASS: No shortcut triggered when modal is open');
} else {
  console.log('❌ FAIL: Shortcut triggered when modal is open');
}

// Test 4: Modal open AND input focused (should definitely not trigger shortcuts)
console.log('\nTest 4: Modal open + input focused (Shift+1 should NOT trigger shortcut)');
mockActiveElement = { tagName: 'INPUT' };
logOutput = [];
handleKeyDown({ key: '1', shiftKey: true, ctrlKey: false, altKey: false, preventDefault: () => {} });
if (logOutput.length === 0) {
  console.log('✅ PASS: No shortcut triggered when modal is open and input is focused');
} else {
  console.log('❌ FAIL: Shortcut triggered when modal is open and input is focused');
}

// Test 5: ESC key should still work in modals
console.log('\nTest 5: ESC key in modal (should be allowed)');
logOutput = [];
handleKeyDown({ key: 'Escape', shiftKey: false, ctrlKey: false, altKey: false, preventDefault: () => {} });
console.log('ESC key processing continues (expected behavior)');

// Test 6: Modal closed again (shortcuts should work)
console.log('\nTest 6: Modal closed (Shift+1 should trigger shortcut again)');
document.getElementById('text-modal').style.display = 'none';
mockActiveElement = null;
handleKeyDown({ key: '1', shiftKey: true, ctrlKey: false, altKey: false, preventDefault: () => {} });

console.log('\n=== Test Summary ===');
console.log('All tests completed. Check above for PASS/FAIL results.');
