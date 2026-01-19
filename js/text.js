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
  const title = modal.querySelector('.modal-title');
  if (title) title.innerText = isEditing ? "Edit Text" : "Add New Text";

  // Position modal near x, y coordinates (if provided)
  if (typeof x === 'number' && typeof y === 'number') {
    modal.style.left = `${x + 10}px`;
    modal.style.top = `${y + 10}px`;
  }

  // Show the modal using CSS class instead of inline styles
  modal.classList.add('is-active');

  // Initialize modal content
  renderTextTypeSelectorInModal();
  renderTextColorPickers();
  setupTextModalHandlers();

  console.log(`${isEditing ? 'Edit' : 'New'} text modal opened for text ID: ${id}`);
}

/**
 * Close text modal and clean up state
 */
function closeTextModal() {
  const modal = document.getElementById('text-modal');
  if (modal) {
    modal.classList.remove('is-active');
  }

  currentEditingId = null;

  // Clean up event handlers to prevent memory leaks
  if (textModalHandlers) {
    textModalHandlers.cleanup();
    textModalHandlers = null;
  }

  console.log('Text modal closed');
}

/**
 * Render text type selector in modal based on global TEXT_TYPES
 */
function renderTextTypeSelectorInModal() {
  const container = document.getElementById('text-type-selector-container');
  if (!container || !window.TEXT_TYPES) {
    console.warn('Text type selector container or TEXT_TYPES not found');
    return;
  }

  // Create the select element
  const select = document.createElement('select');
  select.id = 'text-type-select';
  select.className = 'modal-select';

  // Map through the global TEXT_TYPES array
  window.TEXT_TYPES.forEach((type) => {
    const option = document.createElement('option');
    option.value = type.id; // The internal ID (e.g., 'plain')
    option.textContent = `${type.icon} ${type.label}`; // Icon + Human-readable label
    select.appendChild(option);
  });

  // Listener to toggle shadow options if the type changes
  select.addEventListener('change', () => {
    updateShadowColorFieldVisibility();
  });

  container.innerHTML = ''; // Clear stubs to prevent ghosting
  container.appendChild(select);
}

/**
 * Update shadow color field visibility based on selection
 */
function updateShadowColorFieldVisibility() {
  const selector = document.getElementById('text-type-select');
  const shadowField = document.getElementById('shadow-color-field');

  if (!selector || !shadowField) return;

  // Logic: Only show shadow field if the type supports shadows
  // Currently, show for all types, but this can be extended to check type properties
  const needsShadow = !selector.value.includes('plain'); // Example: hide for plain text only
  shadowField.style.display = needsShadow ? 'block' : 'none';
}

/**
 * Render a reusable color picker - pure utility function
 * @param {string} containerId - DOM element ID for the container
 * @param {string} selectedColor - Initial color value (hex)
 * @param {Function} onSelect - Callback function called with new color value
 */
function renderColorPicker(containerId, selectedColor = '#000000', onSelect = null) {
  const container = document.getElementById(containerId);
  if (!container) {
    console.warn(`Color picker container '${containerId}' not found`);
    return;
  }

  // Clear previous content to avoid duplicates
  container.innerHTML = '';

  const input = document.createElement('input');
  input.type = 'color';
  input.value = selectedColor || '#000000';
  input.className = 'color-input-ui';

  // Use 'input' event for real-time updates, 'change' for final selection
  if (onSelect && typeof onSelect === 'function') {
    input.addEventListener('input', (e) => {
      onSelect(e.target.value);
    });
  }

  container.appendChild(input);
}

/**
 * Specifically renders pickers for the text modal
 */
function renderTextColorPickers() {
  // Primary Text Color
  renderColorPicker('text-color-container', '#000000', (color) => {
    console.log("New Text Color:", color);
    handleTextColorChange(color);
  });

  // Shadow Color
  renderColorPicker('shadow-color-container', '#808080', (color) => {
    console.log("New Shadow Color:", color);
    handleShadowColorChange(color);
  });

  // Update shadow field visibility
  updateShadowColorFieldVisibility();
}

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

  const modal = document.getElementById('text-modal');
  if (!modal) return;

  // Event delegation handler
  const handleModalClick = (e) => {
    const target = e.target;

    // Handle Close Button or modal background
    if (target.matches('.close-modal, .modal-background')) {
      closeTextModal();
      return;
    }

    // Handle Save/Submit button
    if (target.matches('#save-text-btn, #text-confirm-btn')) {
      const textValue = document.getElementById('text-input')?.value || '';
      handleTextSave(textValue);
      return;
    }

    // Handle Cancel button
    if (target.matches('#text-cancel-btn')) {
      closeTextModal();
      return;
    }
  };

  modal.addEventListener('click', handleModalClick);

  // Note: The text-type-select change listener is set up in renderTextTypeSelectorInModal

  textModalHandlers = {
    cleanup: () => {
      modal.removeEventListener('click', handleModalClick);
      if (typeDropdown) {
        typeDropdown.removeEventListener('change', handleTypeChange);
      }
    }
  };
}

/**
 * Handle text type change
 */
function handleTextTypeChange(type) {
  console.log(`Text type changed to: ${type}`);
  // Implementation for type-specific logic would go here
}

/**
 * Handle text color change
 */
function handleTextColorChange(color) {
  console.log(`Text color changed to: ${color}`);
  // Implementation would go here
}

/**
 * Handle shadow color change
 */
function handleShadowColorChange(color) {
  console.log(`Shadow color changed to: ${color}`);
  // Implementation would go here
}

/**
 * Handle text confirmation
 */
function handleTextConfirm() {
  console.log('Text confirmed');
  // Implementation for saving text would go here
  closeTextModal();
}

/**
 * Handle text save with value
 */
function handleTextSave(textValue) {
  const isEditing = currentEditingId !== null;

  if (isEditing) {
    console.log(`Updating existing text ${currentEditingId} with: "${textValue}"`);
    // Implementation for updating existing text would go here
  } else {
    console.log(`Creating new text with: "${textValue}"`);
    // Implementation for creating new text would go here
  }

  closeTextModal();
}

/**
 * Handle color change from color picker (called from DOM)
 */
function handleColorChange(containerId, event) {
  const color = event.target.value;
  console.log(`Color changed in ${containerId}: ${color}`);

  // Route to appropriate handler based on container
  if (containerId === 'text-color-picker') {
    handleTextColorChange(color);
  } else if (containerId === 'shadow-color-picker') {
    handleShadowColorChange(color);
  }
}

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
    renderTextTypeSelectorInModal,
    updateShadowColorFieldVisibility,
    renderColorPicker,
    renderTextColorPickers,
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
  renderTextTypeSelectorInModal,
  updateShadowColorFieldVisibility,
  renderColorPicker,
  renderTextColorPickers,
  createTextWithSize,
  setupTextModalHandlers
};

// Individual exports
window.openTextModal = openTextModal;
window.closeTextModal = closeTextModal;
window.createTextWithSize = createTextWithSize;
window.handleColorChange = handleColorChange;