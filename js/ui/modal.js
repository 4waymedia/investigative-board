// Modal Management Module
// Handles all modal dialogs and their interactions

class ModalManager {
  constructor(appState) {
    this.appState = appState;
    this.currentModalListeners = [];
    this.modalPinIndex = null;

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
    pmTextColor.value = pin.textColor || "#ffffff";

    // Populate settings tab fields
    if (pin.typeId && pin.typeId.startsWith("pin:")) {
      const pinType = pin.typeId.replace("pin:", "");
      pmPinSelector.value = pinType;
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
    if (pin.typeId && pin.typeId.startsWith("pin:")) {
      const pinType = pin.typeId.replace("pin:", "");
      pmPinSelector.value = pinType;
    }

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
    const pinTypeHandler = createAutoSaveHandler('typeId', () => "pin:" + pmPinSelector.value);
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
