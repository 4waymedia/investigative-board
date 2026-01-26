/**
 * TEXT MANAGEMENT MODULE
 * Encapsulated logic for text interactions with ES6 module pattern
 */

// Private state (not accessible globally, only within this module)
let currentEditingId = null;
let currentImageData = null;
let textModalHandlers = null;
let marqueeWasActive = false; // Track if marquee was running when modal opened

/**
 * Open text modal for creating/editing text with state handling
 * @param {Object} options - { id, x, y, initialText, width, height }
 */
function openTextModal({ id = null, x = 0, y = 0, initialText = '', width = 200, height = 50 } = {}) {
  currentEditingId = id;
  currentImageData = null;

  // Track if marquee was active before opening modal
  marqueeWasActive = window.app && window.app.eventHandlers && window.app.eventHandlers.marqueeAnimationId !== null;

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

  // Get form elements
  const input = document.getElementById('text-modal-input');
  const descriptionInput = document.getElementById('text-modal-description');
  const dateInput = document.getElementById('text-modal-date');
  const typeSelect = document.getElementById('text-modal-type');
  const tailTypeSelect = document.getElementById('text-modal-tail-type');
  const bubbleColorInput = document.getElementById('text-modal-color');
  const bubbleColorAlpha = document.getElementById('text-modal-color-alpha');
  const titleColorInput = document.getElementById('text-modal-title-color');
  const titleColorAlpha = document.getElementById('text-modal-title-color-alpha');
  const descriptionColorInput = document.getElementById('text-modal-description-color');
  const descriptionColorAlpha = document.getElementById('text-modal-description-color-alpha');
  const borderColorInput = document.getElementById('text-modal-border-color');
  const borderColorAlpha = document.getElementById('text-modal-border-color-alpha');
  const tailAngleSlider = document.getElementById('text-modal-tail-angle');
  const tailLengthSlider = document.getElementById('text-modal-tail-length');
  const tailAutoPointCheckbox = document.getElementById('text-modal-tail-auto-point');
  const widthSlider = document.getElementById('text-modal-width');
  const heightSlider = document.getElementById('text-modal-height');
  const fontSizeSlider = document.getElementById('text-modal-font-size');
  const borderWidthSlider = document.getElementById('text-modal-border-width');
  const dropShadowCheckbox = document.getElementById('text-modal-drop-shadow');
  const imagePreview = document.getElementById('text-modal-image-preview');
  const imageRemoveBtn = document.getElementById('text-modal-image-remove');

  // If editing, populate with current values
  if (isEditing && window.app && window.app.appState) {
    const pin = window.app.appState.pins.find(p => p.id === currentEditingId);
    console.log(`📝 Opening modal for edit, looking for pin with id: ${currentEditingId}`);
    console.log(`📝 Found pin:`, pin ? JSON.stringify(pin, null, 2) : 'NOT FOUND');
    if (pin) {
      console.log(`📝 Populating modal with pin values:`, {
        label: pin.label,
        description: pin.description,
        shape: pin.shape,
        tailType: pin.tailType,
        color: pin.color,
        textColor: pin.textColor
      });
      if (input) input.value = pin.label || ''; // Title field
      if (descriptionInput) descriptionInput.value = pin.description || ''; // Description field
      if (dateInput) dateInput.value = pin.date || '';
      // Map shape to modal value
      const shapeToModalValue = {
        'bubble': 'bubble',
        'rectangle': 'rectangle', 
        'text-plain': 'text-plain',
        'text-title': 'text-title'
      };
      if (typeSelect) typeSelect.value = shapeToModalValue[pin.shape] || 'bubble';
      if (tailTypeSelect) tailTypeSelect.value = pin.tailType || 'curved';
      if (bubbleColorInput) bubbleColorInput.value = pin.color || '#ffffff';
      if (bubbleColorAlpha) bubbleColorAlpha.value = pin.colorAlpha !== undefined ? pin.colorAlpha : 1;
      // Title and description colors (default to same value for backwards compatibility)
      const defaultTextColor = pin.textColor || '#000000';
      if (titleColorInput) titleColorInput.value = pin.titleColor || defaultTextColor;
      if (titleColorAlpha) titleColorAlpha.value = pin.titleColorAlpha !== undefined ? pin.titleColorAlpha : (pin.textColorAlpha !== undefined ? pin.textColorAlpha : 1);
      if (descriptionColorInput) descriptionColorInput.value = pin.descriptionColor || defaultTextColor;
      if (descriptionColorAlpha) descriptionColorAlpha.value = pin.descriptionColorAlpha !== undefined ? pin.descriptionColorAlpha : (pin.textColorAlpha !== undefined ? pin.textColorAlpha : 1);
      if (borderColorInput) borderColorInput.value = pin.borderColor || '#000000';
      if (borderColorAlpha) borderColorAlpha.value = pin.borderColorAlpha !== undefined ? pin.borderColorAlpha : 1;
      // Tail settings
      const tailPos = pin.tailPosition || { angle: 225, distance: 0.9 };
      if (tailAngleSlider) {
        tailAngleSlider.value = tailPos.angle || 225;
        const angleDisplay = document.getElementById('text-modal-tail-angle-value');
        if (angleDisplay) angleDisplay.textContent = (tailPos.angle || 225) + '°';
      }
      if (tailLengthSlider) {
        tailLengthSlider.value = tailPos.distance || 0.9;
        const lengthDisplay = document.getElementById('text-modal-tail-length-value');
        if (lengthDisplay) lengthDisplay.textContent = (tailPos.distance || 0.9) + 'x';
      }
      if (tailAutoPointCheckbox) tailAutoPointCheckbox.checked = pin.tailAutoPoint || false;
      if (widthSlider) widthSlider.value = pin.width || 120;
      if (heightSlider) heightSlider.value = pin.height || 60;
      if (fontSizeSlider) fontSizeSlider.value = pin.fontSize || 14;
      if (borderWidthSlider) borderWidthSlider.value = pin.borderWidth || 2;
      if (dropShadowCheckbox) dropShadowCheckbox.checked = pin.dropShadow || false;

      // Handle image data
      if (pin.image && pin.image.dataUrl) {
        currentImageData = pin.image;
        if (imagePreview) {
          imagePreview.innerHTML = `<img src="${pin.image.dataUrl}" style="max-width: 100%; max-height: 100px;" />`;
        }
        if (imageRemoveBtn) imageRemoveBtn.style.display = 'inline-block';

        // Set image settings
        const imageStyle = document.getElementById('text-modal-image-style');
        const imagePosition = document.getElementById('text-modal-image-position');
        const imageSize = document.getElementById('text-modal-image-size');
        if (imageStyle) imageStyle.value = pin.image.style || 'circular';
        if (imagePosition) imagePosition.value = pin.image.position || 'center';
        if (imageSize) imageSize.value = pin.image.size || 100;
      }
    }
  } else {
    // Default values for new text
    if (input) input.value = ''; // Title starts empty
    if (descriptionInput) descriptionInput.value = initialText || ''; // Description gets the initial text
    if (dateInput) dateInput.value = '';
    if (typeSelect) typeSelect.value = 'bubble';
    if (tailTypeSelect) tailTypeSelect.value = 'curved';
    if (bubbleColorInput) bubbleColorInput.value = '#ffffff';
    if (bubbleColorAlpha) bubbleColorAlpha.value = 1;
    if (textColorInput) textColorInput.value = '#000000';
    if (textColorAlpha) textColorAlpha.value = 1;
    if (borderColorInput) borderColorInput.value = '#000000';
    if (borderColorAlpha) borderColorAlpha.value = 1;
    if (widthSlider) widthSlider.value = 120;
    if (heightSlider) heightSlider.value = 60;
    if (fontSizeSlider) fontSizeSlider.value = 14;
    if (borderWidthSlider) borderWidthSlider.value = 2;
    if (dropShadowCheckbox) dropShadowCheckbox.checked = false;

    // Clear image
    if (imagePreview) imagePreview.innerHTML = '<div class="image-preview-placeholder">No image selected</div>';
    if (imageRemoveBtn) imageRemoveBtn.style.display = 'none';
  }

  // Show the modal
  const backdrop = document.getElementById('text-modal-backdrop');
  if (backdrop) backdrop.style.display = 'flex';

  // Set up event handlers
  setupTextModalHandlers();

  // Set up real-time updates for editing mode
  if (isEditing && window.setupTextModalRealTimeUpdates) {
    console.log('📝 Setting up real-time updates for text modal');
    window.setupTextModalRealTimeUpdates();
  }

  console.log(`${isEditing ? 'Edit' : 'New'} text modal opened for text ID: ${id}`);
}

/**
 * Close text modal and clean up state
 */
function closeTextModal() {
  const backdrop = document.getElementById('text-modal-backdrop');
  if (backdrop) backdrop.style.display = 'none';

  currentEditingId = null;

  // Restart marquee if it was active before modal opened
  if (marqueeWasActive && window.app && window.app.eventHandlers) {
    window.app.eventHandlers.startMarqueeAnimation();
    console.log('🎯 Restarted marquee animation after modal closed');
  }
  marqueeWasActive = false;

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

  // Tab switching
  const tabButtons = document.querySelectorAll('#text-modal-tabs .tab-button');
  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      // Remove active class from all tabs
      tabButtons.forEach(btn => btn.classList.remove('active'));
      document.querySelectorAll('#text-modal-content .tab-content').forEach(content => {
        content.classList.remove('active');
      });

      // Add active class to clicked tab
      button.classList.add('active');
      const tabId = button.dataset.tab;
      const content = document.getElementById(`text-${tabId}-tab`);
      if (content) {
        content.classList.add('active');
      }
    });
  });
  
  // Show/hide tail controls based on shape selection
  const typeSelect = document.getElementById('text-modal-type');
  const tailControlsGroup = document.getElementById('tail-controls-group');
  
  const updateTailTypeVisibility = () => {
    if (tailControlsGroup && typeSelect) {
      // Only show tail options for bubble shape
      tailControlsGroup.style.display = typeSelect.value === 'bubble' ? 'block' : 'none';
    }
  };
  
  if (typeSelect) {
    typeSelect.addEventListener('change', updateTailTypeVisibility);
    updateTailTypeVisibility(); // Initial state
  }

  // Slider value displays
  const setupSliderDisplay = (sliderId, displayId, suffix = '') => {
    const slider = document.getElementById(sliderId);
    const display = document.getElementById(displayId);
    if (slider && display) {
      const updateDisplay = () => {
        if (sliderId.includes('opacity')) {
          display.textContent = Math.round(slider.value * 100) + '%';
        } else if (sliderId.includes('size')) {
          display.textContent = slider.value + '%';
        } else {
          display.textContent = slider.value + suffix;
        }
      };
      slider.addEventListener('input', updateDisplay);
      updateDisplay(); // Initial value
    }
  };

  setupSliderDisplay('text-modal-width', 'text-modal-width-value', 'px');
  setupSliderDisplay('text-modal-height', 'text-modal-height-value', 'px');
  setupSliderDisplay('text-modal-font-size', 'text-modal-font-size-value', 'px');
  setupSliderDisplay('text-modal-border-width', 'text-modal-border-width-value', 'px');
  setupSliderDisplay('text-modal-image-size', 'text-modal-image-size-value', '%');

  // Alpha slider displays
  const setupAlphaDisplay = (sliderId, displayId) => {
    const slider = document.getElementById(sliderId);
    const display = document.getElementById(displayId);
    if (slider && display) {
      const updateDisplay = () => {
        display.textContent = Math.round(slider.value * 100) + '%';
      };
      slider.addEventListener('input', updateDisplay);
      updateDisplay(); // Initial value
    }
  };

  setupAlphaDisplay('text-modal-color-alpha', 'text-modal-color-alpha-value');
  setupAlphaDisplay('text-modal-title-color-alpha', 'text-modal-title-color-alpha-value');
  setupAlphaDisplay('text-modal-description-color-alpha', 'text-modal-description-color-alpha-value');
  setupAlphaDisplay('text-modal-border-color-alpha', 'text-modal-border-color-alpha-value');

  // Real-time update handlers - update the pin as user makes changes
  const setupRealTimeUpdate = () => {
    console.log('🔧 setupRealTimeUpdate called, currentEditingId:', currentEditingId);
    if (!currentEditingId || !window.app || !window.app.appState) {
      console.log('🔧 Early return - missing required objects');
      return;
    }
    
    const pin = window.app.appState.pins.find(p => p.id === currentEditingId);
    if (!pin) {
      console.log('🔧 Early return - pin not found');
      return;
    }
    console.log('🔧 Found pin for real-time updates:', pin.id, 'current colorAlpha:', pin.colorAlpha);

    // Get all form elements
    const input = document.getElementById('text-modal-input');
    const descriptionInput = document.getElementById('text-modal-description');
    const typeSelect = document.getElementById('text-modal-type');
    const tailTypeSelect = document.getElementById('text-modal-tail-type');
    const bubbleColorInput = document.getElementById('text-modal-color');
    const bubbleColorAlpha = document.getElementById('text-modal-color-alpha');
    const textColorInput = document.getElementById('text-modal-text-color');
    const textColorAlpha = document.getElementById('text-modal-text-color-alpha');
    const borderColorInput = document.getElementById('text-modal-border-color');
    const borderColorAlpha = document.getElementById('text-modal-border-color-alpha');
    const widthSlider = document.getElementById('text-modal-width');
    const heightSlider = document.getElementById('text-modal-height');
    
    console.log('🔧 bubbleColorAlpha element found:', !!bubbleColorAlpha);
    const fontSizeSlider = document.getElementById('text-modal-font-size');
    const borderWidthSlider = document.getElementById('text-modal-border-width');
    const dropShadowCheckbox = document.getElementById('text-modal-drop-shadow');

    // Helper to update and render
    const updateAndRender = () => {
      if (window.app.render) window.app.render();
    };

    // Title (label) - shown below bubble
    if (input) {
      input.addEventListener('input', () => {
        pin.label = input.value.trim();
        updateAndRender();
      });
    }

    // Description - shown inside bubble (with auto-sizing)
    if (descriptionInput) {
      descriptionInput.addEventListener('input', () => {
        pin.description = descriptionInput.value.trim();
        
        // Auto-size the bubble to fit the text
        if (window.calculateTextDimensions && pin.description) {
          const dims = window.calculateTextDimensions(
            pin.description, 
            pin.fontSize || 14,
            'system-ui',
            16, // padding
            60, // minWidth
            30, // minHeight
            300 // maxWidth
          );
          pin.width = dims.width;
          pin.height = dims.height;
          
          // Update the sliders in the modal to reflect new size
          if (widthSlider) {
            widthSlider.value = dims.width;
            const widthDisplay = document.getElementById('text-modal-width-value');
            if (widthDisplay) widthDisplay.textContent = dims.width + 'px';
          }
          if (heightSlider) {
            heightSlider.value = dims.height;
            const heightDisplay = document.getElementById('text-modal-height-value');
            if (heightDisplay) heightDisplay.textContent = dims.height + 'px';
          }
        }
        
        updateAndRender();
      });
    }

    // Shape type
    const tailControlsGroup = document.getElementById('tail-controls-group');
    if (typeSelect) {
      typeSelect.addEventListener('change', () => {
        const oldShape = pin.shape;
        pin.shape = typeSelect.value;
        
        // Handle tail type based on shape
        if (pin.shape === 'bubble') {
          // Switching TO bubble - set default tail if none
          if (!pin.tailType || pin.tailType === 'none') {
            pin.tailType = 'curved';
            if (tailTypeSelect) tailTypeSelect.value = 'curved';
          }
          // Show tail controls group
          if (tailControlsGroup) tailControlsGroup.style.display = 'block';
        } else {
          // Switching FROM bubble to another shape - hide tail
          pin.tailType = 'none';
          if (tailTypeSelect) tailTypeSelect.value = 'none';
          // Hide tail controls group
          if (tailControlsGroup) tailControlsGroup.style.display = 'none';
        }
        
        console.log(`📝 Shape changed: "${oldShape}" → "${pin.shape}", tailType: "${pin.tailType}"`);
        updateAndRender();
      });
    }

    // Tail type
    if (tailTypeSelect) {
      tailTypeSelect.addEventListener('change', () => {
        pin.tailType = tailTypeSelect.value;
        console.log(`📝 Real-time tail type update: "${pin.tailType}"`);
        updateAndRender();
      });
    }

    // Tail angle (direction)
    const tailAngleSlider = document.getElementById('text-modal-tail-angle');
    if (tailAngleSlider) {
      tailAngleSlider.addEventListener('input', () => {
        if (!pin.tailPosition) pin.tailPosition = { angle: 225, distance: 0.9 };
        pin.tailPosition.angle = parseInt(tailAngleSlider.value);
        const angleDisplay = document.getElementById('text-modal-tail-angle-value');
        if (angleDisplay) angleDisplay.textContent = pin.tailPosition.angle + '°';
        updateAndRender();
      });
    }

    // Tail length (distance)
    const tailLengthSlider = document.getElementById('text-modal-tail-length');
    if (tailLengthSlider) {
      tailLengthSlider.addEventListener('input', () => {
        if (!pin.tailPosition) pin.tailPosition = { angle: 225, distance: 0.9 };
        pin.tailPosition.distance = parseFloat(tailLengthSlider.value);
        const lengthDisplay = document.getElementById('text-modal-tail-length-value');
        if (lengthDisplay) lengthDisplay.textContent = pin.tailPosition.distance + 'x';
        updateAndRender();
      });
    }

    // Tail auto-point to connection
    const tailAutoPointCheckbox = document.getElementById('text-modal-tail-auto-point');
    if (tailAutoPointCheckbox) {
      tailAutoPointCheckbox.addEventListener('change', () => {
        pin.tailAutoPoint = tailAutoPointCheckbox.checked;
        updateAndRender();
      });
    }

    // Bubble color
    if (bubbleColorInput) {
      bubbleColorInput.addEventListener('input', () => {
        pin.color = bubbleColorInput.value;
        updateAndRender();
      });
    }

    // Bubble color alpha
    if (bubbleColorAlpha) {
      bubbleColorAlpha.addEventListener('input', () => {
        const newAlpha = parseFloat(bubbleColorAlpha.value);
        pin.colorAlpha = newAlpha;
        updateAndRender();
      });
    }

    // Title color
    const titleColorInput = document.getElementById('text-modal-title-color');
    if (titleColorInput) {
      titleColorInput.addEventListener('input', () => {
        pin.titleColor = titleColorInput.value;
        updateAndRender();
      });
    }

    // Title color alpha
    const titleColorAlpha = document.getElementById('text-modal-title-color-alpha');
    if (titleColorAlpha) {
      titleColorAlpha.addEventListener('input', () => {
        pin.titleColorAlpha = parseFloat(titleColorAlpha.value);
        updateAndRender();
      });
    }

    // Description color
    const descriptionColorInput = document.getElementById('text-modal-description-color');
    if (descriptionColorInput) {
      descriptionColorInput.addEventListener('input', () => {
        pin.descriptionColor = descriptionColorInput.value;
        updateAndRender();
      });
    }

    // Description color alpha
    const descriptionColorAlpha = document.getElementById('text-modal-description-color-alpha');
    if (descriptionColorAlpha) {
      descriptionColorAlpha.addEventListener('input', () => {
        pin.descriptionColorAlpha = parseFloat(descriptionColorAlpha.value);
        updateAndRender();
      });
    }

    // Border color
    if (borderColorInput) {
      borderColorInput.addEventListener('input', () => {
        pin.borderColor = borderColorInput.value;
        updateAndRender();
      });
    }

    // Border color alpha
    if (borderColorAlpha) {
      borderColorAlpha.addEventListener('input', () => {
        pin.borderColorAlpha = parseFloat(borderColorAlpha.value);
        updateAndRender();
      });
    }

    // Width
    if (widthSlider) {
      widthSlider.addEventListener('input', () => {
        pin.width = parseInt(widthSlider.value);
        updateAndRender();
      });
    }

    // Height
    if (heightSlider) {
      heightSlider.addEventListener('input', () => {
        pin.height = parseInt(heightSlider.value);
        updateAndRender();
      });
    }

    // Font size (with auto-resize)
    if (fontSizeSlider) {
      fontSizeSlider.addEventListener('input', () => {
        pin.fontSize = parseInt(fontSizeSlider.value);
        
        // Auto-resize bubble when font size changes
        if (window.calculateTextDimensions && pin.description) {
          const dims = window.calculateTextDimensions(
            pin.description,
            pin.fontSize,
            'system-ui',
            16, 60, 30, 300
          );
          pin.width = dims.width;
          pin.height = dims.height;
          
          // Update sliders
          if (widthSlider) {
            widthSlider.value = dims.width;
            const widthDisplay = document.getElementById('text-modal-width-value');
            if (widthDisplay) widthDisplay.textContent = dims.width + 'px';
          }
          if (heightSlider) {
            heightSlider.value = dims.height;
            const heightDisplay = document.getElementById('text-modal-height-value');
            if (heightDisplay) heightDisplay.textContent = dims.height + 'px';
          }
        }
        
        updateAndRender();
      });
    }

    // Border width
    if (borderWidthSlider) {
      borderWidthSlider.addEventListener('input', () => {
        pin.borderWidth = parseFloat(borderWidthSlider.value);
        updateAndRender();
      });
    }

    // Drop shadow
    if (dropShadowCheckbox) {
      dropShadowCheckbox.addEventListener('change', () => {
        pin.dropShadow = dropShadowCheckbox.checked;
        updateAndRender();
      });
    }
  };

  // Store the setup function to be called when modal opens for editing
  window.setupTextModalRealTimeUpdates = setupRealTimeUpdate;

  // Image upload handling
  const imageSelectBtn = document.getElementById('text-modal-image-select');
  const imageUploadInput = document.getElementById('text-modal-image-upload');
  const imageRemoveBtn = document.getElementById('text-modal-image-remove');
  const imagePreview = document.getElementById('text-modal-image-preview');

  if (imageSelectBtn && imageUploadInput) {
    imageSelectBtn.addEventListener('click', () => {
      imageUploadInput.click();
    });

    imageUploadInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const img = new Image();
          img.onload = () => {
            // Store image data
            currentImageData = {
              dataUrl: e.target.result,
              originalFileName: file.name,
              style: document.getElementById('text-modal-image-style').value,
              position: document.getElementById('text-modal-image-position').value,
              size: parseInt(document.getElementById('text-modal-image-size').value)
            };

            // Update preview
            imagePreview.innerHTML = `<img src="${e.target.result}" style="max-width: 100%; max-height: 100px;" />`;
            imageRemoveBtn.style.display = 'inline-block';
          };
          img.src = e.target.result;
        };
        reader.readAsDataURL(file);
      }
    });
  }

  if (imageRemoveBtn) {
    imageRemoveBtn.addEventListener('click', () => {
      currentImageData = null;
      imagePreview.innerHTML = '<div class="image-preview-placeholder">No image selected</div>';
      imageRemoveBtn.style.display = 'none';
      imageUploadInput.value = '';
    });
  }

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
    handleTextSave();
  };

  const handleDeleteClick = () => {
    if (confirm('Are you sure you want to delete this text pin?')) {
      // Delete the pin
      if (window.app && window.app.appState && currentEditingId !== null) {
        const pins = window.app.appState.pins;
        const index = pins.findIndex(p => p.id === currentEditingId);
        if (index !== -1) {
          window.app.appState.removePin(index);
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
function handleTextSave() {
  const isEditing = currentEditingId !== null;
  console.log(`📝 handleTextSave called, isEditing: ${isEditing}, currentEditingId: ${currentEditingId}`);

  // Get values from modal inputs
  const input = document.getElementById('text-modal-input');
  const descriptionInput = document.getElementById('text-modal-description');
  const dateInput = document.getElementById('text-modal-date');
  const typeSelect = document.getElementById('text-modal-type');
  const tailTypeSelect = document.getElementById('text-modal-tail-type');
  const bubbleColorInput = document.getElementById('text-modal-color');
  const bubbleColorAlphaInput = document.getElementById('text-modal-color-alpha');
  const titleColorInput = document.getElementById('text-modal-title-color');
  const titleColorAlphaInput = document.getElementById('text-modal-title-color-alpha');
  const descriptionColorInput = document.getElementById('text-modal-description-color');
  const descriptionColorAlphaInput = document.getElementById('text-modal-description-color-alpha');
  const borderColorInput = document.getElementById('text-modal-border-color');
  const borderColorAlphaInput = document.getElementById('text-modal-border-color-alpha');
  const tailAngleSlider = document.getElementById('text-modal-tail-angle');
  const tailLengthSlider = document.getElementById('text-modal-tail-length');
  const tailAutoPointCheckbox = document.getElementById('text-modal-tail-auto-point');
  const widthSlider = document.getElementById('text-modal-width');
  const heightSlider = document.getElementById('text-modal-height');
  const fontSizeSlider = document.getElementById('text-modal-font-size');
  const borderWidthSlider = document.getElementById('text-modal-border-width');
  const dropShadowCheckbox = document.getElementById('text-modal-drop-shadow');

  const textValue = input ? input.value.trim() : ''; // Title (below bubble)
  const description = descriptionInput ? descriptionInput.value.trim() : ''; // Description (inside bubble)
  const date = dateInput ? dateInput.value : '';
  const shape = typeSelect ? typeSelect.value : 'bubble';
  // Only set tail type for bubble shapes
  const tailType = (shape === 'bubble' && tailTypeSelect) ? tailTypeSelect.value : 'none';
  const bubbleColor = bubbleColorInput ? bubbleColorInput.value : '#ffffff';
  const bubbleColorAlpha = bubbleColorAlphaInput ? parseFloat(bubbleColorAlphaInput.value) : 1;
  const titleColor = titleColorInput ? titleColorInput.value : '#000000';
  const titleColorAlpha = titleColorAlphaInput ? parseFloat(titleColorAlphaInput.value) : 1;
  const descriptionColor = descriptionColorInput ? descriptionColorInput.value : '#000000';
  const descriptionColorAlpha = descriptionColorAlphaInput ? parseFloat(descriptionColorAlphaInput.value) : 1;
  const borderColor = borderColorInput ? borderColorInput.value : '#000000';
  const borderColorAlpha = borderColorAlphaInput ? parseFloat(borderColorAlphaInput.value) : 1;
  // Tail position settings
  const tailAngle = tailAngleSlider ? parseInt(tailAngleSlider.value) : 225;
  const tailLength = tailLengthSlider ? parseFloat(tailLengthSlider.value) : 0.9;
  const tailAutoPoint = tailAutoPointCheckbox ? tailAutoPointCheckbox.checked : false;
  const width = widthSlider ? parseInt(widthSlider.value) : 120;
  const height = heightSlider ? parseInt(heightSlider.value) : 60;
  const fontSize = fontSizeSlider ? parseInt(fontSizeSlider.value) : 14;
  const borderWidth = borderWidthSlider ? parseFloat(borderWidthSlider.value) : 2;
  const dropShadow = dropShadowCheckbox ? dropShadowCheckbox.checked : false;

  console.log(`💾 Saving text pin:`, {
    title: textValue,
    description: description,
    shape: shape,
    tailType: tailType,
    tailAngle: tailAngle,
    tailLength: tailLength,
    titleColor: titleColor,
    descriptionColor: descriptionColor
  });

  if (isEditing) {
    console.log(`Updating existing text pin ${currentEditingId}`);

    // Find and update the pin in app state
    if (window.app && window.app.appState) {
      const pin = window.app.appState.pins.find(p => p.id === currentEditingId);
      if (pin) {
        console.log(`🔄 Pin BEFORE update:`, JSON.stringify(pin, null, 2));
        
        pin.label = textValue; // Title (shown below bubble)
        pin.description = description; // Description (shown inside bubble)
        pin.date = date;
        pin.shape = shape;
        pin.tailType = tailType;
        pin.tailPosition = { angle: tailAngle, distance: tailLength };
        pin.tailAutoPoint = tailAutoPoint;
        pin.color = bubbleColor;
        pin.colorAlpha = bubbleColorAlpha;
        pin.titleColor = titleColor;
        pin.titleColorAlpha = titleColorAlpha;
        pin.descriptionColor = descriptionColor;
        pin.descriptionColorAlpha = descriptionColorAlpha;
        pin.borderColor = borderColor;
        pin.borderColorAlpha = borderColorAlpha;
        pin.width = width;
        pin.height = height;
        pin.fontSize = fontSize;
        pin.borderWidth = borderWidth;
        pin.dropShadow = dropShadow;
        
        console.log(`🔄 Pin AFTER update:`, JSON.stringify(pin, null, 2));

        // Handle image data
        if (currentImageData) {
          pin.image = currentImageData;
        } else if (pin.image) {
          // Remove image if it was cleared
          delete pin.image;
        }

        window.app.appState.saveHistory();
        if (window.app.saveState) {
          window.app.saveState();
        }
        if (window.app.render) {
          window.app.render();
        }
        console.log(`✅ Updated text pin ${currentEditingId}`);
      }
    }
  } else {
    console.log(`⚠️ Text modal save called for new text creation, but this should be handled by text tool. title="${textValue}", description="${description}"`);
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