// Modal Management Module
// Handles all modal dialogs and their interactions

class ModalManager {
  constructor(appState) {
    this.appState = appState;
    this.currentModalListeners = [];
    this.modalPinIndex = null;
    this.marqueeWasActive = false; // Track if marquee was running when modal opened

    // Get references to modal elements
    this.pinModal = document.getElementById("pin-modal");
    this.pinModalBackdrop = document.getElementById("pin-modal-backdrop");
    this.addColorModal = document.getElementById("add-color-modal");
    this.addColorModalBackdrop = document.getElementById("add-color-modal-backdrop");
    this.cardModal = document.getElementById("card-modal");
    this.cardModalBackdrop = document.getElementById("card-modal-backdrop");
    this.loadModal = document.getElementById("load-modal");
    this.loadModalBackdrop = document.getElementById("load-modal-backdrop");

    console.log(`🎯 ModalManager constructor - elements found:`, {
      pinModal: !!this.pinModal,
      pinModalBackdrop: !!this.pinModalBackdrop
    });


    // Get references to global functions
    this.draw = null;
    this.saveAppState = null;
    this.renderCards = null;
    this.closeAllModals = this.closeAllModals.bind(this);
  }

  // Initialize modal event handlers
  initialize(dependencies) {
    this.draw = dependencies.draw;
    this.saveAppState = dependencies.saveAppState;
    this.renderCards = dependencies.renderCards;

    // Set up modal backdrop click handlers
    // Backdrop click handling is done in ui.js - removing duplicate listeners
  }

  // Open pin modal for editing
  openPinModal(pinIndex) {
    console.log(`🎯 ModalManager.openPinModal called with pinIndex: ${pinIndex}`);

    // Track if marquee was active before opening modal
    this.marqueeWasActive = this.appState.eventHandlers && this.appState.eventHandlers.marqueeAnimationId !== null;

    // Clean up previous modal listeners
    this.cleanupModalListeners();

    this.modalPinIndex = pinIndex;
    const pin = this.appState.pins[pinIndex];
    console.log(`🎯 Pin data:`, pin);

    if (!pin) {
      console.log(`❌ Pin not found at index ${pinIndex}`);
      return;
    }

    // Check if modal elements exist
    console.log(`🎯 Modal elements: pinModal=${!!this.pinModal}, backdrop=${!!this.pinModalBackdrop}`);

    // Show modal first
    if (this.pinModal) {
      this.pinModal.style.display = "block";
      console.log(`✅ Modal display set to block`);
    } else {
      console.log(`❌ pinModal element not found`);
    }

    // Set up modal content and event handlers
    this.setupPinModal(pin, pinIndex);

    if (this.pinModalBackdrop) {
      this.pinModalBackdrop.style.display = "flex";
      console.log(`✅ Modal backdrop display set to flex`);
    } else {
      console.log(`❌ pinModalBackdrop element not found`);
    }

    // Set up close handlers (in case setupUIHandlers wasn't called or failed)
    const closeButton = document.getElementById("pin-modal-close");
    if (closeButton) {
      closeButton.onclick = (e) => {
        console.log("🎯 ModalManager close button clicked");
        e.stopPropagation();
        this.closePinModal();
      };
      console.log("✅ Attached close handler to close button");
    } else {
      console.log("❌ Close button not found");
    }

    // Also set up backdrop close
    if (this.pinModalBackdrop) {
      this.pinModalBackdrop.onclick = (e) => {
        console.log("🎯 Backdrop click detected, target:", e.target, "is backdrop:", e.target === this.pinModalBackdrop);
        // Only close if clicking directly on backdrop, not on modal content
        if (e.target === this.pinModalBackdrop) {
          console.log("🎯 ModalManager backdrop clicked - closing modal");
          e.preventDefault();
          e.stopPropagation();
          this.closePinModal();
        } else {
          console.log("🎯 Backdrop click ignored - clicked on modal content");
        }
        // For clicks on modal content, don't do anything - let them bubble normally
      };
    }
  }

  closePinModal() {
    console.log("🔒 ModalManager closing pin modal");

    if (this.pinModal) {
      this.pinModal.style.display = "none";
      console.log("✅ Hidden pinModal via ModalManager");
    }

    if (this.pinModalBackdrop) {
      this.pinModalBackdrop.style.display = "none";
      console.log("✅ Hidden pinModalBackdrop via ModalManager");
    }

    this.modalPinIndex = null;

    // Restart marquee if it was active before modal opened
    if (this.marqueeWasActive && this.appState.eventHandlers) {
      this.appState.eventHandlers.startMarqueeAnimation();
      console.log('🎯 Restarted marquee animation after pin modal closed');
    }
    this.marqueeWasActive = false;
  }

  // Set up pin modal content and event handlers
  setupPinModal(pin, pinIndex) {
    console.log("🎯 setupPinModal called, setting up tabs");
    // Set up tab switching
    this.setupModalTabs();

    // Populate color palette if style tab is active
    const activeTab = document.querySelector("#modal-tabs .tab-button.active");
    if (activeTab && activeTab.getAttribute("data-tab") === "style") {
      this.populateModalColorPalette();
    }
    const pmTitle = document.getElementById("pm-title");
    const pmDescription = document.getElementById("pm-description");
    const pmNote = document.getElementById("pm-note");
    const pmDate = document.getElementById("pm-date");
    const pmColor = document.getElementById("pm-color");
    const pmTextColor = document.getElementById("pm-text-color");
    const pmPinSelector = document.getElementById("pm-pin-selector");
    const pmScale = document.getElementById("pm-scale");
    const pmAreaScale = document.getElementById("pm-area-scale");

    // Populate style tab fields
    pmColor.value = pin.color || "#58a6ff";
    pmTextColor.value = pin.textColor || this.appState.calculateTextColor(pin.color || "#58a6ff");

    // Handle text pins (all text shapes)
    const textShapes = ['bubble', 'rectangle', 'text-plain', 'text-title'];
    const isTextPin = textShapes.includes(pin.shape);
    if (isTextPin && pmTitle) {
      pmTitle.value = pin.label || ""; // Text pins use label for main text
    }

    // Populate settings tab fields
    if (pin.typeId) {
      let selectorValue;
      if (pin.typeId.startsWith("pin:")) {
        selectorValue = pin.typeId.replace("pin:", "");
      } else if (pin.typeId.startsWith("card:")) {
        selectorValue = pin.typeId.replace("card:", "");
      } else if (pin.typeId.startsWith("area:")) {
        selectorValue = pin.typeId.replace("area:", "area-");
      }
      if (selectorValue && pmPinSelector) {
        pmPinSelector.value = selectorValue;
      }
    }
    pmScale.value = pin.pinScale || 1;

    // Handle area pins - show area scale slider
    const isArea = pin.typeId && pin.typeId.startsWith("area:");
    const areaScaleContainer = document.getElementById("area-scale-container");
    if (areaScaleContainer) {
      areaScaleContainer.style.display = isArea ? "block" : "none";
    }
    if (pmAreaScale) {
      pmAreaScale.value = pin.areaScale || 1;
    }
    const pmSave = document.getElementById("pm-save");
    const pmDelete = document.getElementById("pm-delete");

    // Populate form fields
    pmTitle.value = pin.label || "";
    pmDescription.value = pin.description || "";
    pmNote.value = pin.note || "";
    pmDate.value = pin.date || "";
    pmColor.value = pin.color || "#58a6ff";
    pmTextColor.value = pin.textColor || "#ffffff";
    pmScale.value = pin.pinScale || 1;

    // Set up pin type selector
    if (pin.typeId) {
      let selectorValue;
      if (pin.typeId.startsWith("pin:")) {
        selectorValue = pin.typeId.replace("pin:", "");
      } else if (pin.typeId.startsWith("card:")) {
        selectorValue = pin.typeId.replace("card:", "");
      } else if (pin.typeId.startsWith("area:")) {
        selectorValue = pin.typeId.replace("area:", "area-");
      }
      if (selectorValue && pmPinSelector) {
        pmPinSelector.value = selectorValue;
      }
    }

    // Set up image tab
    this.setupImageTab(pin, pinIndex);

    // Set up event listeners
    const titleHandler = () => {
      pin.label = pmTitle.value;
      this.appState.saveHistory();
      this.saveAppState(this.appState);
      this.draw();
    };

    const updateColorPaletteSelection = () => {
      // Update the active state in the modal color palette when color changes
      const paletteColors = document.querySelectorAll("#modal-color-palette .modal-color-option");
      paletteColors.forEach((el, index) => {
        const currentColors = window.DEFAULT_COLORS || [];
        if (currentColors[index] && currentColors[index].value === pin.color) {
          el.classList.add("active");
        } else {
          el.classList.remove("active");
        }
      });
    };

    const descHandler = () => {
      pin.description = pmDescription.value;
      this.appState.saveHistory();
      this.saveAppState(this.appState);
      this.draw();
    };

    // Helper function to create auto-save handlers
    const createAutoSaveHandler = (property, valueGetter, shouldDraw = true) => {
      return () => {
        pin[property] = valueGetter();
        this.appState.saveHistory();
        this.saveAppState(this.appState);
        if (shouldDraw) this.draw();
      };
    };

    const noteHandler = createAutoSaveHandler('note', () => pmNote.value, false);
    const dateHandler = createAutoSaveHandler('date', () => pmDate.value, false);
    const colorHandler = () => {
      pin.color = pmColor.value;
      this.appState.saveHistory();
      this.saveAppState(this.appState);
      this.draw();
      updateColorPaletteSelection();
    };

    const textColorHandler = createAutoSaveHandler('textColor', () => pmTextColor.value);
    const pinTypeHandler = () => {
      let typeId;
      const selectedValue = pmPinSelector.value;

      // Determine the family based on the selected value
      if (selectedValue.startsWith('area-')) {
        // Area types
        typeId = selectedValue.replace('area-', 'area:');
      } else if (['card', 'doc', 'folder'].includes(selectedValue)) {
        // Card types
        typeId = 'card:' + selectedValue;
      } else {
        // Pin types (default)
        typeId = 'pin:' + selectedValue;
      }

      pin.typeId = typeId;
      this.appState.saveHistory();
      this.saveAppState(this.appState);
      this.draw();
    };
    const scaleHandler = () => {
      pin.pinScale = parseFloat(pmScale.value);
      this.appState.saveHistory();
      this.saveAppState(this.appState);
      this.draw();
    };

    const areaScaleHandler = () => {
      pin.areaScale = parseFloat(pmAreaScale.value);
      this.appState.saveHistory();
      this.saveAppState(this.appState);
      this.draw();
    };

    const saveHandler = () => {
      this.closeAllModals();
    };

    const deleteHandler = () => {
      if (confirm("Are you sure you want to delete this pin?")) {
        this.appState.pins.splice(pinIndex, 1);
        this.appState.saveHistory();
        this.saveAppState(this.appState);
        this.closeAllModals();
        this.draw();
      }
    };

    // Add listeners for cleanup
    this.addModalListener(() => pmTitle.removeEventListener("input", titleHandler));
    this.addModalListener(() => pmDescription.removeEventListener("input", descHandler));
    this.addModalListener(() => pmNote.removeEventListener("input", noteHandler));
    this.addModalListener(() => pmDate.removeEventListener("input", dateHandler));
    this.addModalListener(() => pmColor.removeEventListener("input", colorHandler));
    this.addModalListener(() => pmTextColor.removeEventListener("input", textColorHandler));
    this.addModalListener(() => pmPinSelector.removeEventListener("change", pinTypeHandler));
    this.addModalListener(() => pmScale.removeEventListener("input", scaleHandler));
    if (pmAreaScale) {
      this.addModalListener(() => pmAreaScale.removeEventListener("input", areaScaleHandler));
    }
    this.addModalListener(() => pmSave.removeEventListener("click", saveHandler));
    this.addModalListener(() => pmDelete.removeEventListener("click", deleteHandler));

    pmTitle.addEventListener("input", titleHandler);
    pmDescription.addEventListener("input", descHandler);
    pmNote.addEventListener("input", noteHandler);
    pmDate.addEventListener("input", dateHandler);
    pmColor.addEventListener("input", colorHandler);
    pmTextColor.addEventListener("input", textColorHandler);
    pmPinSelector.addEventListener("change", pinTypeHandler);
    pmScale.addEventListener("input", scaleHandler);
    if (pmAreaScale) {
      pmAreaScale.addEventListener("input", areaScaleHandler);
    }
    pmSave.addEventListener("click", saveHandler);
    pmDelete.addEventListener("click", deleteHandler);
  }

  // Set up modal tab switching (adapted from working old code)
  setupModalTabs() {
    const tabButtons = document.querySelectorAll("#modal-tabs .tab-button");

    tabButtons.forEach((button) => {
      const clickHandler = (e) => {
        const tabName = button.getAttribute("data-tab");
        e.preventDefault();
        e.stopPropagation();

        this.switchTab(tabName);

        // If switching to style tab, populate color palette
        if (tabName === "style") {
          this.populateModalColorPalette();
        }
      };

      button.addEventListener("click", clickHandler);
      this.addModalListener(() => button.removeEventListener("click", clickHandler));
    });

    // Also populate color palette initially if style tab is active
    const activeTab = document.querySelector("#modal-tabs .tab-button.active");
    if (activeTab && activeTab.getAttribute("data-tab") === "style") {
      this.populateModalColorPalette();
    }
  }

  // Switch to a specific tab (copied from working old implementation)
  switchTab(tabName) {
    // Hide all tab content
    const tabContents = document.querySelectorAll(".tab-content");
    tabContents.forEach((content) => content.classList.remove("active"));

    // Remove active class from all tab buttons
    const tabButtons = document.querySelectorAll(".tab-button");
    tabButtons.forEach((button) => button.classList.remove("active"));

    // Show selected tab content
    const selectedContent = document.getElementById(tabName + "-tab");
    if (selectedContent) {
      selectedContent.classList.add("active");
    }

    // Activate selected tab button
    const selectedButton = document.querySelector(`[data-tab="${tabName}"]`);
    if (selectedButton) {
      selectedButton.classList.add("active");
    }
  }

  // Set up image tab functionality
  setupImageTab(pin, pinIndex) {
    const imagePreview = document.getElementById("pm-image-preview");
    const imageFileInput = document.getElementById("pm-image-file");
    const imageStyleSelect = document.getElementById("pm-image-style");
    const imagePositionSelect = document.getElementById("pm-image-position");
    const imageSizeSlider = document.getElementById("pm-image-size");
    const imageSizeValue = document.getElementById("pm-image-size-value");
    const removeImageBtn = document.getElementById("pm-remove-image");

    if (!imagePreview || !imageFileInput || !imageStyleSelect || !imagePositionSelect || !imageSizeSlider || !imageSizeValue || !removeImageBtn) {
      console.warn("Image tab elements not found");
      return;
    }

    // Update image preview
    this.updateImagePreview(pin);

    // Set current image style
    if (pin.image && pin.image.style) {
      imageStyleSelect.value = pin.image.style;
    } else {
      imageStyleSelect.value = "circular"; // Default style
    }

    // Set current image position
    if (pin.image && pin.image.position) {
      imagePositionSelect.value = pin.image.position;
    } else {
      imagePositionSelect.value = "center"; // Default position
    }

    // Set current image size
    if (pin.image && pin.image.size) {
      imageSizeSlider.value = pin.image.size;
      imageSizeValue.textContent = pin.image.size;
    } else {
      imageSizeSlider.value = 100; // Default size
      imageSizeValue.textContent = "100";
    }

    // Handle file input change
    const fileInputHandler = async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      try {
        // Validate file
        const validation = window.ImageUtils.validateImageFile(file);
        if (!validation.valid) {
          alert(validation.error);
          return;
        }

        // Process image
        console.log("🎨 Processing image file:", file.name, "size:", file.size);
        const processedImage = await window.ImageUtils.processImage(file, {
          maxDimension: 600,
          format: 'jpeg',
          quality: 0.85
        });
        console.log("🎨 Processed image data URL length:", processedImage.length);

        // Store image data in pin
        const imagePositionSelect = document.getElementById("pm-image-position");
        const imageSizeSlider = document.getElementById("pm-image-size");
        pin.image = {
          dataUrl: processedImage,
          style: imageStyleSelect.value,
          position: imagePositionSelect ? imagePositionSelect.value : "center",
          size: imageSizeSlider ? parseInt(imageSizeSlider.value) : 100,
          originalFileName: file.name,
          uploadedAt: Date.now()
        };
        console.log("🎨 Image stored on pin:", pin.image);

        // Update preview
        this.updateImagePreview(pin);

        // Save changes
        this.appState.saveHistory();
        this.saveAppState(this.appState);
        this.draw();

      } catch (error) {
        console.error("Error processing image:", error);
        alert("Failed to process image. Please try again.");
      }
    };

    // Handle style change
    const styleChangeHandler = () => {
      if (pin.image) {
        pin.image.style = imageStyleSelect.value;
        this.appState.saveHistory();
        this.saveAppState(this.appState);
        this.draw();
      }
    };

    // Handle position change
    const positionChangeHandler = () => {
      if (pin.image) {
        pin.image.position = imagePositionSelect.value;
        this.appState.saveHistory();
        this.saveAppState(this.appState);
        this.draw();
      }
    };

    // Handle size change
    const sizeChangeHandler = () => {
      if (pin.image) {
        const newSize = parseInt(imageSizeSlider.value);
        pin.image.size = newSize;
        imageSizeValue.textContent = newSize;
        this.appState.saveHistory();
        this.saveAppState(this.appState);
        this.draw();
      }
    };

    // Handle remove image
    const removeImageHandler = () => {
      if (confirm("Are you sure you want to remove this image?")) {
        pin.image = null;
        this.updateImagePreview(pin);
        this.appState.saveHistory();
        this.saveAppState(this.appState);
        this.draw();
      }
    };

    // Add event listeners for cleanup
    this.addModalListener(() => imageFileInput.removeEventListener("change", fileInputHandler));
    this.addModalListener(() => imageStyleSelect.removeEventListener("change", styleChangeHandler));
    this.addModalListener(() => imagePositionSelect.removeEventListener("change", positionChangeHandler));
    this.addModalListener(() => imageSizeSlider.removeEventListener("input", sizeChangeHandler));
    this.addModalListener(() => removeImageBtn.removeEventListener("click", removeImageHandler));

    // Add event listeners
    imageFileInput.addEventListener("change", fileInputHandler);
    imageStyleSelect.addEventListener("change", styleChangeHandler);
    imagePositionSelect.addEventListener("change", positionChangeHandler);
    imageSizeSlider.addEventListener("input", sizeChangeHandler);
    removeImageBtn.addEventListener("click", removeImageHandler);
  }

  // Update the image preview in the modal
  updateImagePreview(pin) {
    const imagePreview = document.getElementById("pm-image-preview");
    if (!imagePreview) return;

    const previewContent = imagePreview.querySelector('.no-image') || imagePreview.querySelector('img');

    if (pin.image && pin.image.dataUrl) {
      // Remove existing content
      if (previewContent) previewContent.remove();

      // Add image
      const img = document.createElement('img');
      img.src = pin.image.dataUrl;
      img.alt = pin.image.originalFileName || 'Pin image';
      imagePreview.appendChild(img);
    } else {
      // Remove existing image
      const existingImg = imagePreview.querySelector('img');
      if (existingImg) existingImg.remove();

      // Add no-image placeholder
      if (!imagePreview.querySelector('.no-image')) {
        const noImageDiv = document.createElement('div');
        noImageDiv.className = 'no-image';
        noImageDiv.textContent = 'No image selected';
        imagePreview.appendChild(noImageDiv);
      }
    }
  }

  // Populate the modal color palette with current theme colors
  populateModalColorPalette() {
    const paletteContainer = document.getElementById("modal-color-palette");
    if (!paletteContainer) return;

    // Clear existing colors
    paletteContainer.innerHTML = "";

    // Get current theme colors
    const currentColors = window.DEFAULT_COLORS || [];

    currentColors.forEach((colorObj, index) => {
      const colorElement = document.createElement("div");
      colorElement.className = "modal-color-option";
      colorElement.style.backgroundColor = colorObj.value;
      colorElement.title = colorObj.name || colorObj.value;

      // Check if this color is currently selected
      const pin = this.appState.pins[this.modalPinIndex];
      if (pin && pin.color === colorObj.value) {
        colorElement.classList.add("active");
      }

      // Add click handler to select this color
      colorElement.addEventListener("click", () => {
        // Update pin color
        if (pin) {
          pin.color = colorObj.value;
          this.appState.saveHistory();
          this.saveAppState(this.appState);
          this.draw();
        }

        // Update active state
        document.querySelectorAll("#modal-color-palette .modal-color-option").forEach(el => {
          el.classList.remove("active");
        });
        colorElement.classList.add("active");

        // Update the custom color picker to match
        const colorInput = document.getElementById("pm-color");
        if (colorInput) {
          colorInput.value = colorObj.value;
        }
      });

      paletteContainer.appendChild(colorElement);
    });
  }

  // Close all modals
  closeAllModals() {
    // Hide all modals
    this.pinModal.style.display = "none";
    this.addColorModal.style.display = "none";
    this.cardModal.style.display = "none";
    this.loadModal.style.display = "none";

    // Hide all backdrops
    this.pinModalBackdrop.style.display = "none";
    this.addColorModalBackdrop.style.display = "none";
    this.cardModalBackdrop.style.display = "none";
    this.loadModalBackdrop.style.display = "none";

    this.cleanupModalListeners();
    this.modalPinIndex = null;
  }

  // Clean up modal event listeners
  cleanupModalListeners() {
    this.currentModalListeners.forEach(cleanup => cleanup());
    this.currentModalListeners = [];
  }

  // Add a modal listener for cleanup
  addModalListener(cleanupFunction) {
    this.currentModalListeners.push(cleanupFunction);
  }
}

// Export for global access
window.ModalManager = ModalManager;
