/**
 * TEXT MANAGEMENT MODULE
 * Encapsulated logic for text interactions with ES6 module pattern
 */

// Private state (not accessible globally, only within this module)
let currentEditingId = null;
let textModalHandlers = null;

/**
 * Open text modal for creating/editing text with state handling
 * @param {Object} options - { id, x, y, initialText, width, height }
 */
function openTextModal({ id = null, x = 0, y = 0, initialText = '', width = 200, height = 50 } = {}) {
  currentEditingId = id;

  const modal = document.getElementById('text-modal');
  if (!modal) {
    console.warn('Text modal element not found');
    return;
  }

  // Set internal state for new vs edit mode
  const isEditing = id !== null;

  // Update UI labels based on mode
  const title = document.getElementById('text-modal-title');
  if (title) title.innerText = isEditing ? "Edit Text" : "Add Text";

  // Set initial values
  const input = document.getElementById('text-modal-input');
  const typeSelect = document.getElementById('text-modal-type');
  const bubbleColorInput = document.getElementById('text-modal-color');
  const textColorInput = document.getElementById('text-modal-text-color');

  if (input) input.value = initialText || '';

  // If editing, populate with current values
  if (isEditing && window.app && window.app.appState) {
    const textElement = window.app.appState.textElements.find(el => el.id === currentEditingId);
    if (textElement) {
      if (input) input.value = textElement.text || '';
      if (typeSelect) typeSelect.value = textElement.type || 'rectangle';
      if (bubbleColorInput) bubbleColorInput.value = textElement.bubbleColor || '#ffffff';
      if (textColorInput) textColorInput.value = textElement.textColor || '#000000';
    }
  } else {
    // Default values for new text
    if (typeSelect) typeSelect.value = 'rectangle';
    if (bubbleColorInput) bubbleColorInput.value = '#ffffff';
    if (textColorInput) textColorInput.value = '#000000';
  }

  // Show the modal
  const backdrop = document.getElementById('text-modal-backdrop');
  if (backdrop) backdrop.style.display = 'flex';

  // Set up event handlers
  setupTextModalHandlers();

  console.log(`${isEditing ? 'Edit' : 'New'} text modal opened for text ID: ${id}`);
}

/**
 * Close text modal and clean up state
 */
function closeTextModal() {
  const backdrop = document.getElementById('text-modal-backdrop');
  if (backdrop) backdrop.style.display = 'none';

  currentEditingId = null;

  // Clean up event handlers to prevent memory leaks
  if (textModalHandlers) {
    textModalHandlers.cleanup();
    textModalHandlers = null;
  }

  console.log('Text modal closed');
}

// Removed renderTextTypeSelectorInModal, updateShadowColorFieldVisibility,
// renderColorPicker, and renderTextColorPickers functions as they expect
// HTML elements that don't exist. Using the existing modal structure instead.

/**
 * Create text with size using configuration object
 * @param {Object} config - { centerX, centerY, width, height, text, type }
 */
function createTextWithSize({ centerX, centerY, width = 200, height = 50, text = '', type = 'default' } = {}) {
  if (typeof centerX !== 'number' || typeof centerY !== 'number') {
    console.error('createTextWithSize requires centerX and centerY coordinates');
    return null;
  }

  // Generate unique ID for the text element
  const textId = `text_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const textElement = {
    id: textId,
    x: centerX - width / 2,
    y: centerY - height / 2,
    width,
    height,
    text,
    type,
    color: '#000000',
    shadowColor: '#808080'
  };

  console.log('Created text element:', textElement);
  return textElement;
}

/**
 * Set up text modal event handlers using delegation pattern for better performance
 */
function setupTextModalHandlers() {
  // Clean up previous handlers
  if (textModalHandlers) {
    textModalHandlers.cleanup();
  }

  const backdrop = document.getElementById('text-modal-backdrop');
  const closeBtn = document.getElementById('text-modal-close');
  const saveBtn = document.getElementById('text-modal-save');
  const deleteBtn = document.getElementById('text-modal-delete');

  if (!backdrop) return;

  // Event handlers
  const handleBackdropClick = (e) => {
    if (e.target === backdrop) {
      closeTextModal();
    }
  };

  const handleCloseClick = () => {
    closeTextModal();
  };

  const handleSaveClick = () => {
    const input = document.getElementById('text-modal-input');
    const textValue = input ? input.value : '';
    handleTextSave(textValue);
  };

  const handleDeleteClick = () => {
    if (confirm('Are you sure you want to delete this text element?')) {
      // Delete the text element
      if (window.app && window.app.appState && currentEditingId !== null) {
        const textElements = window.app.appState.textElements;
        const index = textElements.findIndex(el => el.id === currentEditingId);
        if (index !== -1) {
          textElements.splice(index, 1);
          window.app.appState.saveHistory();
          if (window.app.saveState) {
            window.app.saveState();
          }
          if (window.app.render) {
            window.app.render();
          }
        }
      }
      closeTextModal();
    }
  };

  // Add event listeners
  backdrop.addEventListener('click', handleBackdropClick);
  if (closeBtn) closeBtn.addEventListener('click', handleCloseClick);
  if (saveBtn) saveBtn.addEventListener('click', handleSaveClick);
  if (deleteBtn) deleteBtn.addEventListener('click', handleDeleteClick);

  textModalHandlers = {
    cleanup: () => {
      backdrop.removeEventListener('click', handleBackdropClick);
      if (closeBtn) closeBtn.removeEventListener('click', handleCloseClick);
      if (saveBtn) saveBtn.removeEventListener('click', handleSaveClick);
      if (deleteBtn) deleteBtn.removeEventListener('click', handleDeleteClick);
    }
  };
}

// Removed handleTextTypeChange, handleTextColorChange, handleShadowColorChange,
// and handleTextConfirm functions as they're not needed for the current modal implementation.

/**
 * Handle text save with value
 */
function handleTextSave(textValue) {
  const isEditing = currentEditingId !== null;

  // Get values from modal inputs
  const typeSelect = document.getElementById('text-modal-type');
  const bubbleColorInput = document.getElementById('text-modal-color');
  const textColorInput = document.getElementById('text-modal-text-color');

  const type = typeSelect ? typeSelect.value : 'rectangle';
  const bubbleColor = bubbleColorInput ? bubbleColorInput.value : '#ffffff';
  const textColor = textColorInput ? textColorInput.value : '#000000';

  if (isEditing) {
    console.log(`Updating existing text ${currentEditingId} with: "${textValue}"`);

    // Find and update the text element in app state
    if (window.app && window.app.appState) {
      const textElement = window.app.appState.textElements.find(el => el.id === currentEditingId);
      if (textElement) {
        textElement.text = textValue;
        textElement.type = type;
        textElement.bubbleColor = bubbleColor;
        textElement.textColor = textColor;
        window.app.appState.saveHistory();
        if (window.app.saveState) {
          window.app.saveState();
        }
        if (window.app.render) {
          window.app.render();
        }
        console.log(`✅ Updated text element ${currentEditingId}`);
      }
    }
  } else {
    console.log(`Creating new text with: "${textValue}"`);
    // For new text creation, we would create it at the mouse position
    // This should be handled by the text tool click, not the modal
  }

  closeTextModal();
}

// Removed handleColorChange function as it's not needed for the current modal implementation.

// ============================================================================
// INITIALIZATION
// ============================================================================

/**
 * Initialize all listeners and UI stubs
 */
function init() {
  setupTextModalHandlers();
  // Any other one-time setup can go here
  console.log('Text Management Module initialized');
}

// ============================================================================
// GLOBAL EXPORTS
// ============================================================================

// Maintain backward compatibility for existing global usage
if (typeof window !== 'undefined') {
  window.TextAPI = {
    get TEXT_TYPES() { return window.TEXT_TYPES; },
    init, // Added init
    openTextModal,
    closeTextModal,
    createTextWithSize,
    setupTextModalHandlers
  };

  // Auto-initialize when DOM is ready
  document.addEventListener('DOMContentLoaded', () => window.TextAPI.init());
}

// Global exports for backward compatibility
window.TextAPI = {
  init,
  openTextModal,
  closeTextModal,
  createTextWithSize,
  setupTextModalHandlers
};

// Individual exports
window.openTextModal = openTextModal;
window.closeTextModal = closeTextModal;
window.createTextWithSize = createTextWithSize;