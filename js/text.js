// ============================================================================
// TEXT MANAGEMENT MODULE - Text creation, editing, and modal functions
// ============================================================================

// ============================================================================
// TEXT TYPE CONSTANTS
// ============================================================================

const TEXT_TYPES = [
  { id: "plain", label: "Plain", icon: "📝" },
  { id: "rectangle", label: "Rectangle", icon: "▭" },
  { id: "comic", label: "Comic", icon: "💬" },
  { id: "title", label: "Title", icon: "📰" },
];

// ============================================================================
// TEXT MODAL FUNCTIONS
// ============================================================================

/**
 * Opens the text modal for creating or editing text
 * @param {number|null} textIndex - Index of text element to edit, null for new text
 * @param {number|null} x - X position for new text
 * @param {number|null} y - Y position for new text
 */
function openTextModal(textIndex = null, x = null, y = null) {
  modalTextIndex = textIndex;
  modalTextX = x;
  modalTextY = y;

  if (textIndex !== null) {
    // Edit existing text
    const textEl = textElements[textIndex];
    if (textEl) {
      tmContent().value = textEl.content || "";
      currentTextType = textEl.type || "plain";
      selectedBubbleColor = textEl.bubbleColor || "#ffffff";
      selectedTextColor = textEl.textColor || "#000000";
      selectedShadowColor = textEl.shadowColor || "rgba(0,0,0,0.3)";
      tmBubbleWidth().value = textEl.bubbleWidth || "";
      tmBubbleHeight().value = textEl.bubbleHeight || "";
      document.getElementById("text-modal-title").textContent = "Edit Text";
    }
  } else {
    // Create new text
    tmContent().value = "";
    selectedBubbleColor = "#ffffff";
    selectedTextColor = "#000000";
    selectedShadowColor = "rgba(0,0,0,0.3)";
    tmBubbleWidth().value = "";
    tmBubbleHeight().value = "";
    document.getElementById("text-modal-title").textContent = "Add Text";
  }

  renderTextTypeSelectorInModal();
  renderTextColorPickers();
  updateShadowColorFieldVisibility();

  // Auto-size button
  tmBubbleSizeAuto().onclick = () => {
    tmBubbleWidth().value = "";
    tmBubbleHeight().value = "";
  };

  textModalBackdrop().style.display = "flex";
  tmContent().focus();
}

/**
 * Closes the text modal and resets state
 */
function closeTextModal() {
  modalTextIndex = null;
  modalTextX = null;
  modalTextY = null;
  selectedBubbleColor = "#ffffff";
  selectedTextColor = "#000000";
  selectedShadowColor = "rgba(0,0,0,0.3)";
  textModalBackdrop().style.display = "none";
}

// ============================================================================
// TEXT TYPE AND COLOR RENDERING
// ============================================================================

/**
 * Renders the text type selector in the modal
 */
function renderTextTypeSelectorInModal() {
  tmTypeSelector().innerHTML = "";
  const textTypes = TEXT_TYPES;

  textTypes.forEach((type) => {
    const btn = document.createElement("div");
    btn.className = "card-color-box";
    btn.style.width = "60px";
    btn.style.height = "50px";
    btn.style.borderRadius = "8px";
    btn.style.border =
      currentTextType === type.id
        ? "3px solid #2383e0"
        : "2px solid #444";
    btn.style.display = "flex";
    btn.style.flexDirection = "column";
    btn.style.alignItems = "center";
    btn.style.justifyContent = "center";
    btn.style.cursor = "pointer";
    btn.style.fontSize = "20px";
    btn.innerHTML = `<div>${type.icon}</div><div style="font-size:10px;margin-top:4px">${type.label}</div>`;
    btn.onclick = () => {
      currentTextType = type.id;
      renderTextTypeSelectorInModal();
      updateShadowColorFieldVisibility();
    };
    tmTypeSelector().appendChild(btn);
  });
}

/**
 * Updates the visibility of the shadow color field based on text type
 */
function updateShadowColorFieldVisibility() {
  tmShadowColorField().style.display =
    currentTextType === "plain" ? "block" : "none";
}

/**
 * Renders a color picker for text modal
 * @param {string} containerId - ID of the container element
 * @param {string} selectedColor - Currently selected color
 * @param {Function} onSelect - Callback when color is selected
 */
function renderColorPicker(containerId, selectedColor, onSelect) {
  const container = document.getElementById(containerId);
  container.innerHTML = "";
  const theme = THEMES.find((t) => t.id === currentThemeId);
  const colors = theme && theme.colors ? theme.colors : palette;

  colors.forEach((colorObj) => {
    const colorBox = document.createElement("div");
    colorBox.className = "card-color-box";
    colorBox.style.width = "40px";
    colorBox.style.height = "40px";
    colorBox.style.borderRadius = "8px";
    colorBox.style.backgroundColor = colorObj.value;
    colorBox.style.cursor = "pointer";
    colorBox.style.border =
      selectedColor === colorObj.value
        ? "3px solid #fff"
        : "2px solid #444";
    colorBox.style.boxShadow =
      selectedColor === colorObj.value ? "0 0 0 2px #2383e0" : "none";
    colorBox.style.transition = "all 0.2s";
    colorBox.title = colorObj.name || colorObj.value;

    colorBox.onclick = () => {
      onSelect(colorObj.value);
    };

    container.appendChild(colorBox);
  });
}

/**
 * Renders all text color pickers in the modal
 */
function renderTextColorPickers() {
  renderColorPicker(
    "tm-bubble-color-picker",
    selectedBubbleColor,
    (color) => {
      selectedBubbleColor = color;
      renderTextColorPickers();
    }
  );
  renderColorPicker(
    "tm-text-color-picker",
    selectedTextColor,
    (color) => {
      selectedTextColor = color;
      renderTextColorPickers();
    }
  );
  renderColorPicker(
    "tm-shadow-color-picker",
    selectedShadowColor,
    (color) => {
      selectedShadowColor = color;
      renderTextColorPickers();
    }
  );
}

// ============================================================================
// EVENT HANDLERS SETUP
// ============================================================================

/**
 * Create a text element with specific size at the given position
 * @param {number} centerX - Center X coordinate
 * @param {number} centerY - Center Y coordinate
 * @param {number} width - Bubble width
 * @param {number} height - Bubble height
 */
function createTextWithSize(centerX, centerY, width, height) {
  const newText = {
    x: centerX,
    y: centerY,
    content: "Double click to Change",
    type: getCurrentTextType(),
    bubbleColor: "#ffffff",
    textColor: getSelectedColor(),
    shadowColor: "rgba(0,0,0,0.3)",
    bubbleWidth: width,
    bubbleHeight: height,
  };

  textElements.push(newText);
  saveState();
  draw();
}

/**
 * Sets up text modal event handlers
 */
function setupTextModalHandlers() {
  textModalClose().onclick = closeTextModal;
  tmCancel().onclick = closeTextModal;
  textModalBackdrop().addEventListener("click", (e) => {
    if (e.target === textModalBackdrop()) closeTextModal();
  });

  tmSave().onclick = () => {
    const content = tmContent().value.trim();
    if (!content) {
      alert("Please enter some text");
      return;
    }

    saveHistory();

    const bubbleWidth = tmBubbleWidth().value
      ? parseInt(tmBubbleWidth().value)
      : null;
    const bubbleHeight = tmBubbleHeight().value
      ? parseInt(tmBubbleHeight().value)
      : null;

    if (modalTextIndex !== null) {
      // Edit existing text
      const textEl = textElements[modalTextIndex];
      if (textEl) {
        textEl.content = content;
        textEl.type = currentTextType;
        textEl.bubbleColor = selectedBubbleColor;
        textEl.textColor = selectedTextColor;
        textEl.shadowColor = selectedShadowColor;
        if (bubbleWidth !== null) textEl.bubbleWidth = bubbleWidth;
        else delete textEl.bubbleWidth;
        if (bubbleHeight !== null) textEl.bubbleHeight = bubbleHeight;
        else delete textEl.bubbleHeight;
      }
    } else {
      // Create new text
      const newText = {
        x: modalTextX !== null && modalTextX !== undefined ? modalTextX : 0,
        y: modalTextY !== null && modalTextY !== undefined ? modalTextY : 0,
        content: content,
        type: currentTextType,
        bubbleColor: selectedBubbleColor,
        textColor: selectedTextColor,
        shadowColor: selectedShadowColor,
      };
      if (bubbleWidth !== null) newText.bubbleWidth = bubbleWidth;
      if (bubbleHeight !== null) newText.bubbleHeight = bubbleHeight;
      textElements.push(newText);
      console.log(
        "Added text at:",
        newText.x,
        newText.y,
        "Total elements:",
        textElements.length
      );
    }

    closeTextModal();
    saveState();
    draw();
  };
}
