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
  addColorModalBackdrop.style.display = "flex";
  // Focus on the modal
  addColorModalBackdrop.focus();
}

/**
 * Close the add color modal
 */
function closeAddColorModal() {
  addColorModalBackdrop.style.display = "none";
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
  cardModalBackdrop.style.display = "flex";
  cmTitle.focus();
}

/**
 * Close the card modal
 */
function closeCardModal() {
  modalCardIndex = null;
  cardModalBackdrop.style.display = "none";
}

// ============================================================================
// PIN MODAL
// ============================================================================

/**
 * Open the pin modal for editing pins
 * @param {number} index - Pin index to edit
 */
function openPinModal(index) {
  const pin = pins[index];
  if (!pin) return;

  modalPinIndex = index;

  // Populate form fields
  pmTitle.value = pin.label || "";
  pmColor.value = pin.color || "#58a6ff";
  pmDescription.value = pin.note || "";
  pmDate.value = pin.date || "";

  // Handle area-specific fields
  const isArea = pin.typeId.startsWith("area:");
  document.getElementById("area-fields").style.display = isArea ? "block" : "none";

  if (isArea) {
    pmAreaTitle.value = pin.title || "";
    pmAreaDescription.value = pin.description || "";
    pmAreaIcon.value = pin.icon || "";
    pmAreaFillColor.value = pin.fillColor || pin.color + "40";
    pmAreaBorderColor.value = pin.borderColor || pin.color;
    pmAreaBorderWidth.value = pin.borderWidth || 2;
    pmAreaTextColor.value = pin.textColor || window._currentThemeTextColor || "#FFFFFF";
    pmAreaIconColor.value = pin.iconColor || pin.color;
  }

  pinModalBackdrop.style.display = "flex";
  pmTitle.focus();
}

/**
 * Close the pin modal
 */
function closePinModal() {
  modalPinIndex = null;
  pinModalBackdrop.style.display = "none";
}

// ============================================================================
// LOAD MODAL
// ============================================================================

/**
 * Open the load data modal
 */
function openLoadModal() {
  loadModalBackdrop.style.display = "flex";
  loadMermaidInput.focus();
}

/**
 * Close the load data modal
 */
function closeLoadModal() {
  loadModalBackdrop.style.display = "none";
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
function openRadialMenu(pinIndex, screenX, screenY) {
  closeRadialMenu();
  setSelectedPin(pinIndex);
  const pin = pins[pinIndex];

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
  const pinConnections = connections.filter(
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
}

/**
 * Close the radial menu
 */
function closeRadialMenu() {
  radialMenuEl.innerHTML = "";
  radialMenuEl.style.display = "none";
  radialMenuEl.onclick = null;
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
      if (confirm("Delete this pin?")) deleteSelectedPin();
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
  connections.forEach((c) => {
    if (c.startIndex === pinIndex) connectedIndices.add(c.endIndex);
    if (c.endIndex === pinIndex) connectedIndices.add(c.startIndex);
  });

  // Calculate bounding box of all connected pins
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;

  connectedIndices.forEach((idx) => {
    if (pins[idx]) {
      minX = Math.min(minX, pins[idx].x);
      minY = Math.min(minY, pins[idx].y);
      maxX = Math.max(maxX, pins[idx].x);
      maxY = Math.max(maxY, pins[idx].y);
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

    draw();
  }
}

/**
 * Toggle connection type for all connections of a pin
 * @param {number} pinIndex - Index of the pin
 */
function togglePinConnectionType(pinIndex) {
  const pinConnections = connections.filter(
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

    saveState();
    draw();
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
        saveState();
        renderMenu();
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
            if (pinIdx !== -1) setSelectedPin(pinIdx);
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
        const color = getSelectedColor();
        cards.push({id: nextId++, title, subtitle, date, icon: '📄', color, category: 'note', used: false});
        renderCards();
        saveState();
    };
    cardList.appendChild(add);
}

/**
 * Set up UI event handlers
 */
function setupUIHandlers() {
  // Add color modal handlers
  addColorModalClose.onclick = closeAddColorModal;
  addColorModalBackdrop.addEventListener("click", (e) => {
    if (e.target === addColorModalBackdrop) closeAddColorModal();
  });
  addColorCancel.onclick = closeAddColorModal;

  // Card modal handlers
  cardModalClose.onclick = closeCardModal;
  cardModalBackdrop.addEventListener("click", (e) => {
    if (e.target === cardModalBackdrop) closeCardModal();
  });
  cmCancel.onclick = closeCardModal;

  // Pin modal handlers
  pinModalClose.onclick = closePinModal;
  pinModalBackdrop.addEventListener("click", (e) => {
    if (e.target === pinModalBackdrop) closePinModal();
  });
  pmCancel.onclick = closePinModal;

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

    saveHistory();

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
    saveState();
  };

  // Pin modal save handler
  pmSave.onclick = () => {
    const pin = pins[modalPinIndex];
    if (!pin) return;

    saveHistory();

    pin.label = pmTitle.value.trim();
    pin.color = pmColor.value;
    pin.note = pmDescription.value.trim();
    pin.date = pmDate.value.trim();

    // Handle area-specific fields
    if (pin.typeId.startsWith("area:")) {
      pin.title = pmAreaTitle.value.trim();
      pin.description = pmAreaDescription.value.trim();
      pin.icon = pmAreaIcon.value.trim();
      pin.fillColor = pmAreaFillColor.value;
      pin.borderColor = pmAreaBorderColor.value;
      pin.borderWidth = parseInt(pmAreaBorderWidth.value) || 2;
      pin.textColor = pmAreaTextColor.value;
      pin.iconColor = pmAreaIconColor.value;
    }

    renderSelectedPinInfo();
    closePinModal();
    saveState();
    draw();
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
