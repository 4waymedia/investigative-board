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

    // Set up modal content and event handlers
    this.setupPinModal(pin, pinIndex);

    // Show modal
    if (this.pinModal) {
      this.pinModal.style.display = "block";
      console.log(`✅ Modal display set to block`);
    } else {
      console.log(`❌ pinModal element not found`);
    }

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
        if (e.target === this.pinModalBackdrop) {
          console.log("🎯 ModalManager backdrop clicked");
          this.closePinModal();
        }
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
    const pmTitle = document.getElementById("pm-title");
    const pmDescription = document.getElementById("pm-description");
    const pmNote = document.getElementById("pm-note");
    const pmDate = document.getElementById("pm-date");
    const pmColor = document.getElementById("pm-color");
    const pmTextColor = document.getElementById("pm-text-color");
    const pmPinSelector = document.getElementById("pm-pin-selector");
    const pmScale = document.getElementById("pm-scale");
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

    const descHandler = () => {
      pin.description = pmDescription.value;
      this.appState.saveHistory();
      this.saveAppState(this.appState);
      this.draw();
    };

    const noteHandler = () => {
      pin.note = pmNote.value;
      this.appState.saveHistory();
      this.saveAppState(this.appState);
    };

    const dateHandler = () => {
      pin.date = pmDate.value;
      this.appState.saveHistory();
      this.saveAppState(this.appState);
    };

    const colorHandler = () => {
      pin.color = pmColor.value;
      this.appState.saveHistory();
      this.saveAppState(this.appState);
      this.draw();
    };

    const textColorHandler = () => {
      pin.textColor = pmTextColor.value;
      this.appState.saveHistory();
      this.saveAppState(this.appState);
      this.draw();
    };

    const pinTypeHandler = () => {
      pin.typeId = "pin:" + pmPinSelector.value;
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

    // Add listeners
    this.addModalListener(() => pmTitle.removeEventListener("input", titleHandler));
    this.addModalListener(() => pmDescription.removeEventListener("input", descHandler));
    this.addModalListener(() => pmNote.removeEventListener("input", noteHandler));
    this.addModalListener(() => pmDate.removeEventListener("input", dateHandler));
    this.addModalListener(() => pmColor.removeEventListener("input", colorHandler));
    this.addModalListener(() => pmTextColor.removeEventListener("input", textColorHandler));
    this.addModalListener(() => pmPinSelector.removeEventListener("change", pinTypeHandler));
    this.addModalListener(() => pmScale.removeEventListener("input", scaleHandler));
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
    pmSave.addEventListener("click", saveHandler);
    pmDelete.addEventListener("click", deleteHandler);
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
