// ============================================================================
// UI MODULE - Modal dialogs and UI management functions
// ============================================================================

// ============================================================================
// ADD COLOR MODAL
// ============================================================================

/**
 * Open the add color modal
 */
function openAddColorModal() {
  renderAddColorPicker();
  if (addColorModalBackdrop) {
    addColorModalBackdrop.style.display = "flex";
    // Focus on the modal
    addColorModalBackdrop.focus();
  }
}

/**
 * Close the add color modal
 */
function closeAddColorModal() {
  if (addColorModalBackdrop) addColorModalBackdrop.style.display = "none";
}

// ============================================================================
// CARD MODAL
// ============================================================================

/**
 * Open the card modal for creating/editing cards
 * @param {number|null} cardId - Card index to edit, null for new card
 */
function openCardModal(cardId = null) {
  modalCardIndex = cardId;

  if (cardId !== null) {
    // Edit existing card
    const card = cards[cardId];
    if (card) {
      cmTitle.value = card.title || "";
      cmSubtitle.value = card.subtitle || "";
      cmDate.value = card.date || "";
      cmIcon.value = card.icon || "";
      document.getElementById("card-modal-title").textContent = "Edit Card";
      selectedCardColor = card.color;
    }
  } else {
    // Create new card
    cmTitle.value = "";
    cmSubtitle.value = "";
    cmDate.value = "";
    cmIcon.value = "";
    document.getElementById("card-modal-title").textContent = "New Card";
    selectedCardColor = selectedColor;
  }

  renderCardColorPicker();
  if (cardModalBackdrop) cardModalBackdrop.style.display = "flex";
  cmTitle.focus();
}

/**
 * Close the card modal
 */
function closeCardModal() {
  modalCardIndex = null;
  if (cardModalBackdrop) cardModalBackdrop.style.display = "none";
  // Also hide the modal itself
  const cardModal = document.getElementById("card-modal");
  if (cardModal) cardModal.style.display = "none";
}

// ============================================================================
// PIN MODAL
// ============================================================================

/**
 * Open the pin modal for editing pins
 * @param {number} index - Pin index to edit
 */
function openPinModal(index) {
  const pin = window.app.appState.pins[index];
  if (!pin) return;

  modalPinIndex = index;

  // Get form field elements
  const pmTitle = document.getElementById("pm-title");
  const pmColor = document.getElementById("pm-color");
  const pmDescription = document.getElementById("pm-description");
  const pmDate = document.getElementById("pm-date");

  // Populate form fields
  if (pmTitle) pmTitle.value = pin.label || "";
  if (pmColor) pmColor.value = pin.color || "#58a6ff";
  if (pmDescription) pmDescription.value = pin.note || "";
  if (pmDate) pmDate.value = pin.date || "";

  // Handle area-specific fields
  const isArea = pin.typeId.startsWith("area:");
  const areaFields = document.getElementById("area-fields");
  if (areaFields) areaFields.style.display = isArea ? "block" : "none";

  if (isArea) {
    const pmAreaTitle = document.getElementById("pm-area-title");
    const pmAreaDescription = document.getElementById("pm-area-description");
    const pmAreaIcon = document.getElementById("pm-area-icon");
    const pmAreaFillColor = document.getElementById("pm-area-fill-color");
    const pmAreaBorderColor = document.getElementById("pm-area-border-color");
    const pmAreaBorderWidth = document.getElementById("pm-area-border-width");
    const pmAreaTextColor = document.getElementById("pm-area-text-color");
    const pmAreaIconColor = document.getElementById("pm-area-icon-color");

    if (pmAreaTitle) pmAreaTitle.value = pin.title || "";
    if (pmAreaDescription) pmAreaDescription.value = pin.description || "";
    if (pmAreaIcon) pmAreaIcon.value = pin.icon || "";
    if (pmAreaFillColor) pmAreaFillColor.value = pin.fillColor || pin.color + "40";
    if (pmAreaBorderColor) pmAreaBorderColor.value = pin.borderColor || pin.color;
    if (pmAreaBorderWidth) pmAreaBorderWidth.value = pin.borderWidth || 2;
    if (pmAreaTextColor) pmAreaTextColor.value = pin.textColor || window._currentThemeTextColor || "#FFFFFF";
    if (pmAreaIconColor) pmAreaIconColor.value = pin.iconColor || pin.color;
  }

  const pinModalBackdrop = document.getElementById("pin-modal-backdrop");
  const pinModal = document.getElementById("pin-modal");
  if (pinModalBackdrop) {
    pinModalBackdrop.style.display = "flex";
    console.log("✅ Opened pin modal backdrop");
  }
  if (pinModal) {
    pinModal.style.display = "block";
    console.log("✅ Opened pin modal");
  }
  if (pmTitle) pmTitle.focus();
}

/**
 * Close the pin modal
 */
function closePinModal() {
  console.log("🔒 Closing pin modal...");
  modalPinIndex = null;

  const pinModal = document.getElementById("pin-modal");
  if (pinModal) {
    pinModal.style.display = "none";
    console.log("✅ Hidden pinModal");
  } else {
    console.log("❌ pinModal not found");
  }

  if (pinModalBackdrop) {
    pinModalBackdrop.style.display = "none";
    console.log("✅ Hidden pinModalBackdrop");
  } else {
    console.log("❌ pinModalBackdrop not found");
  }
}

// ============================================================================
// LOAD MODAL
// ============================================================================

/**
 * Open the load data modal
 */
function openLoadModal() {
  if (loadModalBackdrop) loadModalBackdrop.style.display = "flex";
  loadMermaidInput.focus();
}

/**
 * Close the load data modal
 */
function closeLoadModal() {
  if (loadModalBackdrop) loadModalBackdrop.style.display = "none";
  // Also hide the modal itself
  const loadModal = document.getElementById("load-modal");
  if (loadModal) loadModal.style.display = "none";
  loadMermaidInput.value = "";
}

// ============================================================================
// RADIAL MENU
// ============================================================================

/**
 * Open the radial context menu for a pin
 * @param {number} pinIndex - Index of the pin to show menu for
 * @param {number} screenX - Screen X coordinate
 * @param {number} screenY - Screen Y coordinate
 */
// Global variable for radial menu element
let radialMenuEl;

// Global variable for pin modal save button
let pmSave;

// Global variable for radial menu click-outside handler
let radialMenuOutsideClickHandler;

// Global modal backdrop elements
let addColorModalBackdrop;
let cardModalBackdrop;
let pinModalBackdrop;
let loadModalBackdrop;

// Global form elements
let loadMermaidInput;
let cmTitle, cmSubtitle, cmDate, cmIcon, cmCancel, cmSave;

function openRadialMenu(pinIndex, screenX, screenY) {
  // Create radial menu element if it doesn't exist
  if (!radialMenuEl) {
    radialMenuEl = document.createElement('div');
    radialMenuEl.id = 'radial-menu';
    radialMenuEl.className = 'radial-menu';
    document.body.appendChild(radialMenuEl);
  }

  closeRadialMenu();
  window.app.setSelectedPin(pinIndex);
  const pin = window.app.appState.pins[pinIndex];

  // NEW LOGIC FOR CENTERING:
  // 1. Define the size of the radial menu container.
  const menuSize = 200;
  const centerOffset = menuSize / 2; // 100px

  // 2. Center the container's top-left corner by shifting it back.
  radialMenuEl.style.width = menuSize + "px";
  radialMenuEl.style.height = menuSize + "px";
  radialMenuEl.style.left = screenX - centerOffset + "px";
  radialMenuEl.style.top = screenY - centerOffset + "px";

  const radius = 70;
  // Get connections for this pin to determine if we should show curve/straight toggle
  const pinConnections = window.app.appState.connections.filter(
    (c) => c.startIndex === pinIndex || c.endIndex === pinIndex
  );
  const hasConnections = pinConnections.length > 0;

  const items = [
    { icon: "🔗", action: "connect", title: "Connect" },
    { icon: "✏️", action: "edit", title: "Edit" },
    {
      icon: "🗑️",
      action: "delete",
      title: "Delete",
      className: "delete",
    },
    { icon: "⭐", action: "focus", title: "Focus" },
  ];

  // Add curve/straight toggle if pin has connections
  if (hasConnections) {
    const allSameType = pinConnections.every(
      (c) =>
        (c.type || connectionType) ===
        (pinConnections[0].type || connectionType)
    );
    const currentType = allSameType
      ? pinConnections[0].type || connectionType
      : connectionType;
    items.push({
      icon: currentType === "curved" ? "📈" : "📏",
      action: "toggleConnectionType",
      title: currentType === "curved" ? "Make Straight" : "Make Curved",
      className: "connection-type",
    });
  }

  radialMenuEl.style.display = "block";

  items.forEach((item, i) => {
    const angle = (i / items.length) * Math.PI * 2;

    // 3. Position items relative to the center of the container (100, 100)
    // The center of the container is (centerOffset, centerOffset)
    // The final '- 24' centers the 48x48 radial item element itself.
    const x = centerOffset + radius * Math.cos(angle - Math.PI / 2) - 24;
    const y = centerOffset + radius * Math.sin(angle - Math.PI / 2) - 24;

    const itemEl = document.createElement("div");
    itemEl.className =
      "radial-item" + (item.className ? " " + item.className : "");
    itemEl.innerHTML = item.icon;
    itemEl.style.left = x + "px";
    itemEl.style.top = y + "px";
    itemEl.title = item.title;
    itemEl.onclick = (e) => {
      e.stopPropagation();
      closeRadialMenu();
      executeRadialAction(item.action, pinIndex);
    };
    radialMenuEl.appendChild(itemEl);
  });

  radialMenuEl.onclick = (e) => e.stopPropagation();

  // Add click-outside-to-close functionality
  radialMenuOutsideClickHandler = (e) => {
    // Only close if the click is outside the radial menu
    if (!radialMenuEl.contains(e.target)) {
      closeRadialMenu();
    }
  };

  // Add the listener after a short delay to avoid immediate closing
  setTimeout(() => {
    document.addEventListener('click', radialMenuOutsideClickHandler);
  }, 10);
}

/**
 * Close the radial menu
 */
function closeRadialMenu() {
  radialMenuEl.innerHTML = "";
  radialMenuEl.style.display = "none";
  radialMenuEl.onclick = null;

  // Remove the click-outside handler
  if (radialMenuOutsideClickHandler) {
    document.removeEventListener('click', radialMenuOutsideClickHandler);
    radialMenuOutsideClickHandler = null;
  }
}

/**
 * Execute a radial menu action
 * @param {string} action - The action to execute
 * @param {number} pinIndex - Index of the pin
 */
function executeRadialAction(action, pinIndex) {
  switch (action) {
    case "connect":
      connectStartIndex = pinIndex;
      break;
    case "edit":
      openPinModal(pinIndex);
      break;
    case "delete":
      if (confirm("Delete this pin?")) {
        // Delete selected pins from app state
        if (window.app.appState.selectedPinIndex !== null) {
          window.app.appState.pins.splice(window.app.appState.selectedPinIndex, 1);
          window.app.setSelectedPin(null);
          window.app.saveAppState(window.app.appState);
          window.draw();
        }
      }
      break;
    case "focus":
      // Focus on this pin and connected pins
      focusOnPin(pinIndex);
      break;
    case "toggleConnectionType":
      // Toggle connection type for all connections of this pin
      togglePinConnectionType(pinIndex);
      break;
  }
}

/**
 * Focus the view on a pin and its connected pins
 * @param {number} pinIndex - Index of the pin to focus on
 */
function focusOnPin(pinIndex) {
  const connectedIndices = new Set();
  connectedIndices.add(pinIndex);

  // Add all directly connected pins
  window.app.appState.connections.forEach((c) => {
    if (c.startIndex === pinIndex) connectedIndices.add(c.endIndex);
    if (c.endIndex === pinIndex) connectedIndices.add(c.startIndex);
  });

  // Calculate bounding box of all connected pins
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;

  connectedIndices.forEach((idx) => {
    if (window.app.appState.pins[idx]) {
      minX = Math.min(minX, window.app.appState.pins[idx].x);
      minY = Math.min(minY, window.app.appState.pins[idx].y);
      maxX = Math.max(maxX, window.app.appState.pins[idx].x);
      maxY = Math.max(maxY, window.app.appState.pins[idx].y);
    }
  });

  if (minX !== Infinity) {
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    const size = Math.max(maxX - minX, maxY - minY) * 1.5; // Add padding

    // Adjust zoom to fit
    const newScale = Math.min(canvas.width / size, canvas.height / size, 2);
    scale = Math.max(0.1, Math.min(2, newScale));

    // Center the view
    offsetX = canvas.width / 2 - centerX * scale;
    offsetY = canvas.height / 2 - centerY * scale;

    window.draw();
  }
}

/**
 * Toggle connection type for all connections of a pin
 * @param {number} pinIndex - Index of the pin
 */
function togglePinConnectionType(pinIndex) {
  const pinConnections = window.app.appState.connections.filter(
    (c) => c.startIndex === pinIndex || c.endIndex === pinIndex
  );

  if (pinConnections.length > 0) {
    // Determine current type
    const allSameType = pinConnections.every(
      (c) =>
        (c.type || connectionType) ===
        (pinConnections[0].type || connectionType)
    );
    const currentType = allSameType
      ? pinConnections[0].type || connectionType
      : connectionType;

    // Toggle to opposite type
    const newType = currentType === "curved" ? "straight" : "curved";

    // Update all connections for this pin
    pinConnections.forEach((c) => {
      c.type = newType;
    });

    window.app.saveAppState(window.app.appState);
    window.draw();
  }
}

// ============================================================================
// UI RENDERING FUNCTIONS
// ============================================================================

/**
 * Render the add color picker
 */
function renderAddColorPicker() {
  const container = document.getElementById("add-color-picker");
  container.innerHTML = "";

  // Get current theme colors
  const theme = THEMES.find((t) => t.id === currentThemeId);
  if (!theme || !theme.colors) return;

  theme.colors.forEach((colorObj) => {
    const colorBox = document.createElement("div");
    colorBox.className = "card-color-box";
    colorBox.style.width = "50px";
    colorBox.style.height = "50px";
    colorBox.style.borderRadius = "8px";
    colorBox.style.backgroundColor = colorObj.value;
    colorBox.style.cursor = "pointer";
    colorBox.style.border = "2px solid #444";
    colorBox.title = colorObj.name || colorObj.value;

    colorBox.onclick = () => {
      // Add this color to the palette
      if (!palette.find((c) => c.value === colorObj.value)) {
        palette.push({
          name: colorObj.name || `Color ${palette.length + 1}`,
          value: colorObj.value,
        });
        window.app.saveAppState(window.app.appState);
        window.app.toolbarManager.render();
        closeAddColorModal();
      }
    };

    container.appendChild(colorBox);
  });
}

/**
 * Render the card color picker
 */
function renderCardColorPicker() {
  const container = document.getElementById("cm-color-picker");
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
      selectedCardColor === colorObj.value
        ? "3px solid #fff"
        : "2px solid #444";
    colorBox.style.boxShadow =
      selectedCardColor === colorObj.value ? "0 0 0 2px #2383e0" : "none";
    colorBox.style.transition = "all 0.2s";
    colorBox.title = colorObj.name || colorObj.value;

    colorBox.onclick = () => {
      selectedCardColor = colorObj.value;
      renderCardColorPicker();
    };

    container.appendChild(colorBox);
  });
}


// ============================================================================
// UI EVENT HANDLERS SETUP
// ============================================================================

/**
 * Render the card list in the sidebar
 */
function renderCards() {
    cardList.innerHTML = '';
    cards.forEach((c, index) => {
        const div = document.createElement('div');
        div.className = 'card' + (c.used ? ' used' : '');
        div.draggable = true;
        div.style.borderLeftColor = c.color;
        div.innerHTML = `
            <div class="card-icon">${c.icon}</div>
            <div class="card-title">${c.title}</div>
            <div class="card-subtitle">${c.subtitle}</div>
            <div class="card-date">${c.date}</div>
        `;
        div.ondragstart = e => {
            e.dataTransfer.setData('cardId', c.id);
            div.style.opacity = '0.5';
        };
        div.ondragend = () => div.style.opacity = '1';
        div.ondblclick = () => {
            const pinIdx = pins.findIndex(p => p.cardId === c.id);
            if (pinIdx !== -1) window.app.setSelectedPin(pinIdx);
            div.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        };
        cardList.appendChild(div);
    });
    // + button for new card
    const add = document.createElement('div');
    add.className = 'card';
    add.style.borderLeftColor = '#666';
    add.innerHTML = '<div style="font-size:48px;color:#666;display:grid;place-items:center;height:100%">+</div>';
    add.onclick = () => {
        const title = prompt('New card title:') || 'Untitled';
        const subtitle = prompt('Subtitle:') || '';
        const date = prompt('Date/Number:') || '';
        const color = window.app.appState.selectedColor;
        cards.push({id: nextId++, title, subtitle, date, icon: '📄', color, category: 'note', used: false});
        renderCards();
        window.app.saveAppState(window.app.appState);
    };
    cardList.appendChild(add);
}

// ============================================================================
// GLOBAL VARIABLES
// ============================================================================

// Global modal close buttons
let pinModalClose, cardModalClose, addColorModalClose, loadModalClose, textModalClose;

/**
 * Set up UI event handlers
 */
function setupUIHandlers() {
  console.log("🔧 Setting up UI handlers...");

  // Initialize modal close buttons
  pinModalClose = document.getElementById("pin-modal-close");
  console.log("🎯 pinModalClose element:", pinModalClose);
  if (!pinModalClose) {
    console.error("❌ pinModalClose element not found!");
  }

  cardModalClose = document.getElementById("card-modal-close");
  addColorModalClose = document.getElementById("add-color-modal-close");
  loadModalClose = document.getElementById("load-modal-close");
  textModalClose = document.getElementById("text-modal-close");

  // Initialize modal backdrop elements
  addColorModalBackdrop = document.getElementById("add-color-modal-backdrop");
  cardModalBackdrop = document.getElementById("card-modal-backdrop");
  pinModalBackdrop = document.getElementById("pin-modal-backdrop");
  loadModalBackdrop = document.getElementById("load-modal-backdrop");


  // Add color modal handlers
  addColorModalClose.onclick = closeAddColorModal;
  addColorModalBackdrop.addEventListener("click", (e) => {
    if (e.target === addColorModalBackdrop) closeAddColorModal();
  });

  // Card modal handlers
  cardModalClose.onclick = closeCardModal;
  cardModalBackdrop.addEventListener("click", (e) => {
    if (e.target === cardModalBackdrop) closeCardModal();
  });
  cmCancel.onclick = closeCardModal;

  // Pin modal handlers
  console.log("🔧 Attaching pin modal close handlers...");
  pinModalClose.onclick = (e) => {
    console.log("🎯 X button clicked!");
    e.stopPropagation(); // Prevent event bubbling to backdrop
    closePinModal();
  };
  pinModalBackdrop.addEventListener("click", (e) => {
    if (e.target === pinModalBackdrop) closePinModal();
  });
  pmCancel.onclick = (e) => {
    e.stopPropagation(); // Prevent event bubbling
    closePinModal();
  };

  // Load modal handlers
  loadModalClose.onclick = closeLoadModal;
  loadModalBackdrop.addEventListener("click", (e) => {
    if (e.target === loadModalBackdrop) closeLoadModal();
  });
  loadCancel.onclick = closeLoadModal;

  // Radial menu - close when clicking anywhere else
  window.addEventListener("click", closeRadialMenu);

  // Card modal save handler
  cmSave.onclick = () => {
    const title = cmTitle.value.trim();
    const subtitle = cmSubtitle.value.trim();
    const date = cmDate.value.trim();
    const icon = cmIcon.value.trim();

    if (!title) {
      alert("Please enter a card title");
      return;
    }

    window.app.appState.saveHistory();

    if (modalCardIndex !== null) {
      // Edit existing card
      const card = cards[modalCardIndex];
      if (card) {
        card.title = title;
        card.subtitle = subtitle;
        card.date = date;
        card.icon = icon;
        card.color = selectedCardColor;
      }
    } else {
      // Create new card
      const newCard = {
        title: title,
        subtitle: subtitle,
        date: date,
        icon: icon,
        color: selectedCardColor,
        x: 100,
        y: 100 + cards.length * 120,
      };
      cards.push(newCard);
    }

    renderCards();
    closeCardModal();
    window.app.saveAppState(window.app.appState);
  };

  // Pin modal save handler
  pmSave.onclick = () => {
    const pin = window.app.appState.pins[modalPinIndex];
    if (!pin) return;

    // Get form field elements
    const pmTitle = document.getElementById("pm-title");
    const pmColor = document.getElementById("pm-color");
    const pmDescription = document.getElementById("pm-description");
    const pmDate = document.getElementById("pm-date");

    window.app.appState.saveHistory();

    if (pmTitle) pin.label = pmTitle.value.trim();
    if (pmColor) pin.color = pmColor.value;
    if (pmDescription) pin.note = pmDescription.value.trim();
    if (pmDate) pin.date = pmDate.value.trim();

    // Handle area-specific fields
    if (pin.typeId.startsWith("area:")) {
      const pmAreaTitle = document.getElementById("pm-area-title");
      const pmAreaDescription = document.getElementById("pm-area-description");
      const pmAreaIcon = document.getElementById("pm-area-icon");
      const pmAreaFillColor = document.getElementById("pm-area-fill-color");
      const pmAreaBorderColor = document.getElementById("pm-area-border-color");
      const pmAreaBorderWidth = document.getElementById("pm-area-border-width");
      const pmAreaTextColor = document.getElementById("pm-area-text-color");
      const pmAreaIconColor = document.getElementById("pm-area-icon-color");

      if (pmAreaTitle) pin.title = pmAreaTitle.value.trim();
      if (pmAreaDescription) pin.description = pmAreaDescription.value.trim();
      if (pmAreaIcon) pin.icon = pmAreaIcon.value.trim();
      if (pmAreaFillColor) pin.fillColor = pmAreaFillColor.value;
      if (pmAreaBorderColor) pin.borderColor = pmAreaBorderColor.value;
      if (pmAreaBorderWidth) pin.borderWidth = parseInt(pmAreaBorderWidth.value) || 2;
      if (pmAreaTextColor) pin.textColor = pmAreaTextColor.value;
      if (pmAreaIconColor) pin.iconColor = pmAreaIconColor.value;
    }

    window.app.updatePinInfo();
    closePinModal();
    window.app.saveAppState(window.app.appState);
    window.draw();
  };

  // Load modal handlers
  loadSubmit.onclick = () => {
    const mermaidCode = loadMermaidInput.value.trim();
    if (!mermaidCode) {
      alert("Please enter Mermaid diagram code");
      return;
    }

    try {
      loadFromMermaid(mermaidCode);
      closeLoadModal();
    } catch (error) {
      alert("Error loading diagram: " + error.message);
    }
  };
}

// Expose radial menu functions globally
window.openRadialMenu = openRadialMenu;
window.closeRadialMenu = closeRadialMenu;
