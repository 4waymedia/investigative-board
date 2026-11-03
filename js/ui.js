// ============================================================================
// UI MODULE - Modal dialogs and UI management functions
// ============================================================================

console.log("🎯 Loading ui.js...");

// ============================================================================
// GLOBAL VARIABLE DECLARATIONS
// ============================================================================

// Global modal close buttons
let pinModalClose,
  cardModalClose,
  addColorModalClose,
  loadModalClose,
  textModalClose;

// Global modal backdrop elements
let addColorModalBackdrop,
  cardModalBackdrop,
  pinModalBackdrop,
  loadModalBackdrop;

// Global form elements
let pmTitle, pmSubtitle, pmDescription, pmNote, pmDate, pmIcon, pmSave, pmDelete;
let cmTitle, cmSubtitle, cmDate, cmIcon, cmSave;
let loadMermaidInput;

// Global variable for radial menu element
let radialMenuEl;

// Global variable for radial menu click-outside handler
let radialMenuOutsideClickHandler;

// Global form elements already declared above

// ============================================================================
// ADD COLOR MODAL
// ============================================================================

/**
 * Open the add color modal (now includes theme selection)
 */
function openAddColorModal() {
  renderAddColorPicker();
  populateThemeSelector();
  if (addColorModalBackdrop) {
    addColorModalBackdrop.style.display = "flex";
    // Focus on the modal
    addColorModalBackdrop.focus();
  }
}

/**
 * Populate the theme selector with preview cards
 */
function populateThemeSelector() {
  const themeGrid = document.getElementById("theme-preview-grid");
  if (!themeGrid) return;
  
  // Get available themes from themeManager (contains full theme data)
  const themes = window.themeManager?.getThemes() || [{ id: "default", name: "Default" }];
  const currentThemeId = window.app?.appState?.currentThemeId || window.themeManager?.getCurrentThemeId() || "default";
  
  // Clear existing content
  themeGrid.innerHTML = "";
  
  // Create preview cards for each theme
  themes.forEach(theme => {
    const isActive = theme.id === currentThemeId;
    
    // Create theme card
    const card = document.createElement("div");
    card.className = `theme-card ${isActive ? 'theme-card-active' : ''}`;
    card.dataset.themeId = theme.id;
    
    // Prepare theme data for preview renderer
    // Convert colors array [{name, value}] to simple color array [value]
    const previewData = {
      background: theme.background,
      'color-list': theme.colors ? theme.colors.map(c => c.value || c) : []
    };
    
    // Generate preview using PreviewRenderer
    let previewUrl = '';
    if (window.previewRenderer) {
      previewUrl = window.previewRenderer.generateThemePreview(previewData);
    }
    
    card.innerHTML = `
      <div class="theme-card-preview" style="background-image: url('${previewUrl}')">
        ${isActive ? '<div class="theme-card-badge">Active</div>' : ''}
      </div>
      <div class="theme-card-name">${theme.name}</div>
    `;
    
    // Click handler to select theme
    card.onclick = () => {
      selectTheme(theme.id);
      // Update active state in UI
      themeGrid.querySelectorAll('.theme-card').forEach(c => {
        c.classList.toggle('theme-card-active', c.dataset.themeId === theme.id);
        const badge = c.querySelector('.theme-card-badge');
        if (c.dataset.themeId === theme.id) {
          if (!badge) {
            const preview = c.querySelector('.theme-card-preview');
            preview.innerHTML = '<div class="theme-card-badge">Active</div>';
          }
        } else if (badge) {
          badge.remove();
        }
      });
    };
    
    themeGrid.appendChild(card);
  });
}

/**
 * Apply a theme by ID
 */
function selectTheme(themeId) {
  if (window.schemaManager) {
    // Check if the convert toggle is enabled
    const convertToggle = document.getElementById("theme-convert-toggle");
    const convertElements = convertToggle ? convertToggle.checked : true;
    
    // Apply theme with conversion flag
    window.schemaManager.setTheme(themeId, convertElements);
    
    // Update app state
    if (window.app?.appState) {
      window.app.appState.currentThemeId = themeId;
    }
    
    // Update toolbar color palette
    if (window.app?.toolbarManager) {
      window.app.toolbarManager.updateColorPalette(window.DEFAULT_COLORS);
      window.app.toolbarManager.render();
    }
    
    // Save state
    if (window.app?.appState?.saveState) {
      window.app.appState.saveState();
    }
    
    console.log(`🎨 Theme changed to: ${themeId} (convert: ${convertElements})`);
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
  const cardModal = document.getElementById("card-modal");
  if (cardModal) cardModal.style.display = "block";
  if (cmTitle) cmTitle.focus();
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

  window.modalPinIndex = index;

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
    if (pmAreaFillColor)
      pmAreaFillColor.value = pin.fillColor || pin.color + "40";
    if (pmAreaBorderColor)
      pmAreaBorderColor.value = pin.borderColor || pin.color;
    if (pmAreaBorderWidth) pmAreaBorderWidth.value = pin.borderWidth || 2;
    if (pmAreaTextColor)
      pmAreaTextColor.value =
        pin.textColor || window._currentThemeTextColor || "#FFFFFF";
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
  window.modalPinIndex = null;

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
  if (loadMermaidInput) loadMermaidInput.value = "";
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
  console.log("🎯 openRadialMenu called with pinIndex:", pinIndex, "screenX:", screenX, "screenY:", screenY);

  // Set global flag that menu is open
  window.isRadialMenuOpen = true;

  // Check if app is available
  if (!window.app) {
    console.error("❌ window.app not available - app not initialized yet");
    return;
  }

  // Create radial menu element if it doesn't exist
  if (!radialMenuEl) {
    radialMenuEl = document.createElement("div");
    radialMenuEl.id = "radial-menu";
    radialMenuEl.className = "radial-menu";
    radialMenuEl.tabIndex = -1; // Make focusable

    // Prevent context menu on radial menu
    radialMenuEl.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      e.stopPropagation();
      return false;
    });

    // Add global wheel event handler to capture all wheel events when menu is open
    window._radialMenuWheelHandler = (e) => {
      if (window.isRadialMenuOpen) {
        e.preventDefault();
        e.stopPropagation();
        const delta = e.deltaY > 0 ? 1 : -1;
        selectRadialMenuItem(delta);
      }
    };
    document.addEventListener("wheel", window._radialMenuWheelHandler, { capture: true });

    // Add wheel event handler for menu selection (backup)
    radialMenuEl.addEventListener("wheel", (e) => {
      e.preventDefault();
      e.stopPropagation();
      const delta = e.deltaY > 0 ? 1 : -1;
      selectRadialMenuItem(delta);
    });

    // Add keyboard handler for confirmation
    radialMenuEl.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        executeSelectedRadialItem();
      } else if (e.key === "Escape") {
        e.preventDefault();
        closeRadialMenu();
      }
    });

    document.body.appendChild(radialMenuEl);
    console.log("✅ Created radial menu element with context menu prevention");
  }

  closeRadialMenu();
  window.app.setSelectedPin(pinIndex);
  const pin = window.app.appState.pins[pinIndex];

  // Store the pin index for wheel selection
  window.currentRadialPinIndex = pinIndex;

  console.log("🎯 Opening radial menu for pin:", pin);

  // NEW LOGIC FOR CENTERING:
  // 1. Define the size of the radial menu container.
  const menuSize = 200;
  const centerOffset = menuSize / 2; // 100px

  // 2. Center the container's top-left corner by shifting it back.
  radialMenuEl.style.width = menuSize + "px";
  radialMenuEl.style.height = menuSize + "px";
  const leftPos = screenX - centerOffset;
  const topPos = screenY - centerOffset;
  radialMenuEl.style.left = leftPos + "px";
  radialMenuEl.style.top = topPos + "px";
  console.log("🎯 Positioning radial menu at:", leftPos, topPos, "menuSize:", menuSize, "centerOffset:", centerOffset);

  const radius = 70;
  // Get connections for this pin to determine if we should show curve/straight toggle
  const pinConnections = window.app.appState.connections.filter(
    (c) => c.startIndex === pinIndex || c.endIndex === pinIndex
  );
  const hasConnections = pinConnections.length > 0;

  const items = [
    { icon: "🔗", action: "connect", title: "Connect" },
    { icon: "✏️", action: "edit", title: "Edit" },
    { icon: "🎨", action: "color", title: "Color", hasSubmenu: true },
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
    // Get connection type from appState if available, otherwise use global
    const globalConnectionType = window.app && window.app.appState ? window.app.appState.connectionType : connectionType;
    const allSameType = pinConnections.every(
      (c) =>
        (c.type || globalConnectionType) ===
        (pinConnections[0].type || globalConnectionType)
    );
    const currentType = allSameType
      ? pinConnections[0].type || globalConnectionType
      : globalConnectionType;
    items.push({
      icon: currentType === "curved" ? "📈" : "📏",
      action: "toggleConnectionType",
      title: currentType === "curved" ? "Make Straight" : "Make Curved",
      className: "connection-type",
    });
  }

  // Store items globally for wheel selection
  window.currentRadialItems = items;
  window.currentRadialSelection = 0; // Start with first item selected

  radialMenuEl.style.display = "block";
  radialMenuEl.focus(); // Focus for keyboard events
  console.log("🎯 Radial menu display set to block, element:", radialMenuEl);

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
    // Add selected class if this is the currently selected item
    if (i === window.currentRadialSelection) {
      itemEl.className += " selected";
    }
    itemEl.innerHTML = item.icon;
    itemEl.style.left = x + "px";
    itemEl.style.top = y + "px";
    itemEl.title = item.title;
    itemEl.dataset.action = item.action;
    itemEl.dataset.index = i;
    
    // Handle items with submenus (like color)
    if (item.hasSubmenu && item.action === "color") {
      itemEl.onmouseenter = (e) => {
        e.stopPropagation();
        showColorSubmenu(pinIndex, centerOffset, radius, angle);
      };
      itemEl.onclick = (e) => {
        e.stopPropagation();
        // Toggle submenu on click too
        showColorSubmenu(pinIndex, centerOffset, radius, angle);
      };
    } else {
      itemEl.onclick = (e) => {
        e.stopPropagation();
        closeRadialMenu();
        executeRadialAction(item.action, pinIndex);
      };
    }
    radialMenuEl.appendChild(itemEl);
  });

  radialMenuEl.onclick = (e) => e.stopPropagation();

  // Add click-outside-to-close functionality
  radialMenuOutsideClickHandler = (e) => {
    // Only close if the click is outside the radial menu
    if (!radialMenuEl.contains(e.target)) {
      closeRadialMenu();
      // Don't stop propagation - let canvas handle the click for pin creation
    }
  };

  // Add the listener after a short delay to avoid immediate closing
  setTimeout(() => {
    document.addEventListener("click", radialMenuOutsideClickHandler);
  }, 10);
}

/**
 * Select radial menu item using wheel (delta: 1 for next, -1 for previous)
 */
function selectRadialMenuItem(delta) {
  if (!window.currentRadialItems || window.currentRadialItems.length === 0) return;

  // Update selection
  window.currentRadialSelection += delta;
  if (window.currentRadialSelection < 0) {
    window.currentRadialSelection = window.currentRadialItems.length - 1;
  } else if (window.currentRadialSelection >= window.currentRadialItems.length) {
    window.currentRadialSelection = 0;
  }

  // Update visual selection
  updateRadialSelection();
}

/**
 * Update visual selection in radial menu
 */
function updateRadialSelection() {
  if (!radialMenuEl) return;

  const items = radialMenuEl.querySelectorAll('.radial-item');
  items.forEach((item, index) => {
    if (index === window.currentRadialSelection) {
      item.classList.add('selected');
    } else {
      item.classList.remove('selected');
    }
  });
}

/**
 * Execute selected radial menu item
 */
function executeSelectedRadialItem() {
  if (!window.currentRadialItems) return;
  
  const selectedItem = window.currentRadialItems[window.currentRadialSelection];
  if (!selectedItem) return;

  closeRadialMenu();
  
  // Check if this is a connection or pin radial menu
  if (window.currentRadialConnectionIndex !== null && window.currentRadialConnectionIndex !== undefined) {
    executeConnectionRadialAction(selectedItem.action, window.currentRadialConnectionIndex);
  } else if (window.currentRadialPinIndex !== null && window.currentRadialPinIndex !== undefined) {
    executeRadialAction(selectedItem.action, window.currentRadialPinIndex);
  }
}

/**
 * Close the radial menu
 */
function closeRadialMenu() {
  if (!radialMenuEl) return; // Guard against null

  // Clear global flags and remove global wheel handler
  window.isRadialMenuOpen = false;
  window.isConnectionRadialMenuOpen = false;
  window.currentRadialSelection = -1;
  window.currentRadialConnectionIndex = null;

  if (window._radialMenuWheelHandler) {
    document.removeEventListener("wheel", window._radialMenuWheelHandler, { capture: true });
    window._radialMenuWheelHandler = null;
  }

  radialMenuEl.innerHTML = "";
  radialMenuEl.style.display = "none";
  radialMenuEl.onclick = null;

  // Remove the click-outside handler
  if (radialMenuOutsideClickHandler) {
    document.removeEventListener("click", radialMenuOutsideClickHandler);
    radialMenuOutsideClickHandler = null;
  }
  
  // Remove connection radial menu click-outside handler
  if (connectionRadialMenuOutsideClickHandler) {
    document.removeEventListener("click", connectionRadialMenuOutsideClickHandler);
    connectionRadialMenuOutsideClickHandler = null;
  }
  
  // Remove color submenu if open
  hideColorSubmenu();
}

/**
 * Show color submenu around the radial menu
 * @param {number} pinIndex - Index of the pin
 * @param {number} centerOffset - Center offset of the main menu
 * @param {number} mainRadius - Radius of the main menu
 * @param {number} itemAngle - Angle of the color item
 */
function showColorSubmenu(pinIndex, centerOffset, mainRadius, itemAngle) {
  // Remove existing submenu
  hideColorSubmenu();
  
  // Get colors from schema
  const colors = window.schemaManager?.getPalette() || [];
  if (colors.length === 0) return;
  
  // Create submenu container
  const submenuEl = document.createElement("div");
  submenuEl.id = "color-submenu";
  submenuEl.className = "color-submenu";
  
  // Position colors in an arc around the color item
  const colorRadius = mainRadius + 50; // Further out from main menu
  const arcSpread = Math.PI * 0.8; // Spread colors across ~144 degrees
  const startAngle = itemAngle - arcSpread / 2;
  
  colors.forEach((colorObj, i) => {
    const colorAngle = startAngle + (i / (colors.length - 1 || 1)) * arcSpread;
    
    // Position relative to menu center
    const x = centerOffset + colorRadius * Math.cos(colorAngle - Math.PI / 2) - 18;
    const y = centerOffset + colorRadius * Math.sin(colorAngle - Math.PI / 2) - 18;
    
    const colorEl = document.createElement("div");
    colorEl.className = "color-submenu-item";
    colorEl.style.cssText = `
      position: absolute;
      left: ${x}px;
      top: ${y}px;
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: ${colorObj.value};
      border: 3px solid rgba(255,255,255,0.3);
      cursor: pointer;
      transition: all 0.15s ease;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      z-index: 10001;
    `;
    colorEl.title = `${colorObj.name}\n${colorObj.value}`;
    
    // Find the slot for this color
    const slot = Object.entries(window.schemaManager.currentTheme.colorSlots)
      .find(([, s]) => s.value === colorObj.value)?.[0];
    
    colorEl.onmouseenter = () => {
      colorEl.style.transform = 'scale(1.2)';
      colorEl.style.borderColor = '#ffffff';
      colorEl.style.boxShadow = '0 4px 16px rgba(0,0,0,0.4)';
    };
    
    colorEl.onmouseleave = () => {
      colorEl.style.transform = 'scale(1)';
      colorEl.style.borderColor = 'rgba(255,255,255,0.3)';
      colorEl.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)';
    };
    
    colorEl.onclick = (e) => {
      e.stopPropagation();
      applyColorToPin(pinIndex, colorObj.value, slot);
      closeRadialMenu();
    };
    
    submenuEl.appendChild(colorEl);
  });
  
  // Add submenu to the radial menu element
  radialMenuEl.appendChild(submenuEl);
  
  // Animate in
  submenuEl.style.opacity = '0';
  requestAnimationFrame(() => {
    submenuEl.style.transition = 'opacity 0.15s ease';
    submenuEl.style.opacity = '1';
  });
}

/**
 * Hide color submenu
 */
function hideColorSubmenu() {
  const submenu = document.getElementById("color-submenu");
  if (submenu) {
    submenu.remove();
  }
}

/**
 * Apply color to a pin
 * @param {number} pinIndex - Index of the pin
 * @param {string} color - Color value (hex)
 * @param {string} slot - Color slot (c1-c8)
 */
function applyColorToPin(pinIndex, color, slot) {
  if (!window.app?.appState?.pins) return;
  
  const pin = window.app.appState.pins[pinIndex];
  if (!pin) return;
  
  // Update pin color
  pin.color = color;
  if (slot) {
    pin.colorSlot = slot;
  }
  
  // Save state
  window.app.appState.saveHistory();
  if (window.app.saveState) {
    window.app.saveState();
  }
  
  // Redraw
  if (window.draw) {
    window.draw();
  }
  
  console.log(`🎨 Applied color ${color} (${slot || 'custom'}) to pin ${pinIndex}`);
}

/**
 * Open a standalone color radial picker for a pin (triggered by keyboard shortcut)
 * @param {number} pinIndex - Index of the pin
 */
function openColorRadialForPin(pinIndex) {
  if (!window.app?.appState?.pins) return;
  
  const pin = window.app.appState.pins[pinIndex];
  if (!pin) return;
  
  // Get colors from schema
  const colors = window.schemaManager?.getPalette() || [];
  if (colors.length === 0) return;
  
  // Close any existing radial menu
  closeRadialMenu();
  
  // Calculate pin screen position
  const canvas = document.getElementById("canvas");
  if (!canvas) return;
  
  const rect = canvas.getBoundingClientRect();
  const appState = window.app.appState;
  
  // Transform pin world coordinates to screen coordinates
  const screenX = rect.left + (pin.x - appState.offsetX) * appState.scale;
  const screenY = rect.top + (pin.y - appState.offsetY) * appState.scale;
  
  // Create radial menu element if needed
  if (!radialMenuEl) {
    radialMenuEl = document.createElement("div");
    radialMenuEl.id = "radial-menu";
    radialMenuEl.className = "radial-menu";
    radialMenuEl.tabIndex = -1;
    document.body.appendChild(radialMenuEl);
  }
  
  // Set up menu
  const menuSize = 200;
  const centerOffset = menuSize / 2;
  
  radialMenuEl.style.width = menuSize + "px";
  radialMenuEl.style.height = menuSize + "px";
  radialMenuEl.style.left = (screenX - centerOffset) + "px";
  radialMenuEl.style.top = (screenY - centerOffset) + "px";
  radialMenuEl.innerHTML = "";
  radialMenuEl.style.display = "block";
  
  window.isRadialMenuOpen = true;
  window.currentRadialPinIndex = pinIndex;
  
  // Create color ring
  const radius = 70;
  colors.forEach((colorObj, i) => {
    const angle = (i / colors.length) * Math.PI * 2;
    const x = centerOffset + radius * Math.cos(angle - Math.PI / 2) - 20;
    const y = centerOffset + radius * Math.sin(angle - Math.PI / 2) - 20;
    
    // Find the slot for this color
    const slot = Object.entries(window.schemaManager.currentTheme.colorSlots)
      .find(([, s]) => s.value === colorObj.value)?.[0];
    
    const colorEl = document.createElement("div");
    colorEl.className = "color-radial-item";
    colorEl.style.cssText = `
      position: absolute;
      left: ${x}px;
      top: ${y}px;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: ${colorObj.value};
      border: 3px solid ${pin.color === colorObj.value ? '#fff' : 'rgba(255,255,255,0.3)'};
      cursor: pointer;
      transition: all 0.15s ease;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    `;
    colorEl.title = `${colorObj.name}\n${colorObj.value}`;
    
    colorEl.onmouseenter = () => {
      colorEl.style.transform = 'scale(1.15)';
      colorEl.style.borderColor = '#ffffff';
      colorEl.style.boxShadow = '0 4px 16px rgba(0,0,0,0.4)';
    };
    
    colorEl.onmouseleave = () => {
      colorEl.style.transform = 'scale(1)';
      colorEl.style.borderColor = pin.color === colorObj.value ? '#fff' : 'rgba(255,255,255,0.3)';
      colorEl.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)';
    };
    
    colorEl.onclick = (e) => {
      e.stopPropagation();
      applyColorToPin(pinIndex, colorObj.value, slot);
      closeRadialMenu();
    };
    
    radialMenuEl.appendChild(colorEl);
  });
  
  // Add center indicator showing current color
  const centerEl = document.createElement("div");
  centerEl.style.cssText = `
    position: absolute;
    left: ${centerOffset - 15}px;
    top: ${centerOffset - 15}px;
    width: 30px;
    height: 30px;
    border-radius: 50%;
    background: ${pin.color};
    border: 2px solid rgba(255,255,255,0.5);
    pointer-events: none;
  `;
  radialMenuEl.appendChild(centerEl);
  
  // Click outside to close
  radialMenuOutsideClickHandler = (e) => {
    if (!radialMenuEl.contains(e.target)) {
      closeRadialMenu();
    }
  };
  
  setTimeout(() => {
    document.addEventListener("click", radialMenuOutsideClickHandler);
  }, 10);
  
  console.log(`🎨 Opened color picker for pin ${pinIndex}`);
}

// Export for action system
window.openColorRadialForPin = openColorRadialForPin;

/**
 * Execute a radial menu action
 * @param {string} action - The action to execute
 * @param {number} pinIndex - Index of the pin
 */
function executeRadialAction(action, pinIndex) {
  // Use centralized action system when available
  if (window.executeAction) {
    switch (action) {
      case "connect":
        window.executeAction("pin:setParent", pinIndex);
        break;
      case "edit":
        window.executeAction("pin:edit", pinIndex);
        break;
      case "delete":
        window.executeAction("pin:delete", pinIndex);
        closeRadialMenu();
        break;
      case "focus":
        window.executeAction("pin:focus", pinIndex);
        break;
      case "toggleConnectionType":
        window.executeAction("pin:toggleConnectionType", pinIndex);
        break;
      case "color":
        // Color action is handled via submenu hover, 
        // but if selected via keyboard, do nothing (submenu should be shown)
        break;
    }
  } else {
    // Fallback if action system not loaded
    switch (action) {
      case "connect":
        window.app.appState.connectStartIndex = pinIndex;
        window.app.appState.connectionMode = 'parent';
        window.draw();
        break;
      case "edit":
        if (window.app?.modalManager?.openPinModal) {
          window.app.modalManager.openPinModal(pinIndex);
        }
        break;
      case "delete":
        if (confirm("Delete this pin?")) {
          window.app.appState.pins.splice(pinIndex, 1);
          window.app.setSelectedPin(null);
          closeRadialMenu();
          window.app.saveState();
          window.draw();
        }
        break;
      case "focus":
        focusOnPin(pinIndex);
        break;
      case "toggleConnectionType":
        togglePinConnectionType(pinIndex);
        break;
    }
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
  if (!container) return;

  container.innerHTML = "";

  // Get current theme colors from schemaManager
  const currentTheme = window.schemaManager?.getCurrentTheme();
  const themeColors = currentTheme?.colors || [];

  if (themeColors.length === 0) return;

  // Display current palette colors
  themeColors.forEach((colorObj, index) => {
    const colorBox = document.createElement("div");
    colorBox.className = "color-picker-box";
    colorBox.style.cssText = `
      width: 45px;
      height: 45px;
      border-radius: 8px;
      background-color: ${colorObj.value};
      cursor: pointer;
      border: 2px solid #30363d;
      margin: 4px;
      display: inline-block;
      transition: all 0.15s ease;
    `;
    colorBox.title = `${colorObj.name || 'Color ' + (index + 1)}\n${colorObj.value}`;

    // Highlight on hover
    colorBox.onmouseenter = () => {
      colorBox.style.transform = 'scale(1.1)';
      colorBox.style.borderColor = '#58a6ff';
    };
    colorBox.onmouseleave = () => {
      colorBox.style.transform = 'scale(1)';
      colorBox.style.borderColor = '#30363d';
    };

    // Click to select this color
    colorBox.onclick = () => {
      if (window.app?.appState) {
        window.app.appState.selectedColor = colorObj.value;
        // Find the slot for this color
        const slot = Object.entries(window.schemaManager.currentTheme.colorSlots)
          .find(([, s]) => s.value === colorObj.value)?.[0];
        if (slot) {
          window.app.appState.selectedColorSlot = slot;
        }
      }
      if (window.app?.toolbarManager) {
        window.app.toolbarManager.render();
      }
      closeAddColorModal();
    };

    container.appendChild(colorBox);
  });
}

/**
 * Render the card color picker
 */
function renderCardColorPicker() {
  const container = document.getElementById("cm-color-picker");
  if (!container) return;
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
  cardList.innerHTML = "";
  cards.forEach((c, index) => {
    const div = document.createElement("div");
    div.className = "card" + (c.used ? " used" : "");
    div.draggable = true;
    div.style.borderLeftColor = c.color;
    div.innerHTML = `
            <div class="card-icon">${c.icon}</div>
            <div class="card-title">${c.title}</div>
            <div class="card-subtitle">${c.subtitle}</div>
            <div class="card-date">${c.date}</div>
        `;
    div.ondragstart = (e) => {
      e.dataTransfer.setData("cardId", c.id);
      div.style.opacity = "0.5";
    };
    div.ondragend = () => (div.style.opacity = "1");
    div.ondblclick = () => {
      const pinIdx = pins.findIndex((p) => p.cardId === c.id);
      if (pinIdx !== -1) window.app.setSelectedPin(pinIdx);
      div.scrollIntoView({ behavior: "smooth", block: "nearest" });
    };
    cardList.appendChild(div);
  });
  // + button for new card
  const add = document.createElement("div");
  add.className = "card";
  add.style.borderLeftColor = "#666";
  add.innerHTML =
    '<div style="font-size:48px;color:#666;display:grid;place-items:center;height:100%">+</div>';
  add.onclick = () => {
    const title = prompt("New card title:") || "Untitled";
    const subtitle = prompt("Subtitle:") || "";
    const date = prompt("Date/Number:") || "";
    const color = window.app.appState.selectedColor;
    cards.push({
      id: nextId++,
      title,
      subtitle,
      date,
      icon: "📄",
      color,
      category: "note",
      used: false,
    });
    renderCards();
    window.app.saveAppState(window.app.appState);
  };
  cardList.appendChild(add);
}

// ============================================================================
// UI EVENT HANDLERS
// ============================================================================

/**
 * Set up UI event handlers
 */
function setupUIHandlers() {
  console.log("🔧 Setting up UI handlers...");

  // Initialize modal close buttons (variables declared at top of file)
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

  // Initialize pin modal elements
  pmTitle = document.getElementById("pm-title");
  pmSubtitle = document.getElementById("pm-subtitle");
  pmDate = document.getElementById("pm-date");
  pmIcon = document.getElementById("pm-icon");
  pmSave = document.getElementById("pm-save");
  pmCancel = document.getElementById("pm-cancel");

  // Initialize load modal elements
  loadMermaidInput = document.getElementById("load-mermaid-input");

  // Initialize card modal elements
  cmTitle = document.getElementById("cm-title");
  cmSubtitle = document.getElementById("cm-subtitle");
  cmDate = document.getElementById("cm-date");
  cmIcon = document.getElementById("cm-icon");
  cmSave = document.getElementById("cm-save");

  // Add color modal handlers
  addColorModalClose.onclick = closeAddColorModal;
  addColorModalBackdrop.addEventListener("click", (e) => {
    if (e.target === addColorModalBackdrop) closeAddColorModal();
  });
  
  // Add color button handler
  const addColorBtn = document.getElementById("add-color-btn");
  const newColorPicker = document.getElementById("new-color-picker");
  if (addColorBtn && newColorPicker) {
    addColorBtn.onclick = () => {
      const colorValue = newColorPicker.value;
      if (colorValue && window.themeManager) {
        // Add color to palette
        window.themeManager.addColorToPalette({
          name: colorValue,
          value: colorValue
        });
        
        // Update toolbar
        if (window.app?.toolbarManager) {
          window.app.toolbarManager.updateColorPalette(window.DEFAULT_COLORS);
        }
        
        console.log(`🎨 Added custom color: ${colorValue}`);
        closeAddColorModal();
      }
    };
  }

  // Card modal handlers
  cardModalClose.onclick = closeCardModal;
  cardModalBackdrop.addEventListener("click", (e) => {
    if (e.target === cardModalBackdrop) closeCardModal();
  });

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

  // Load modal handlers
  loadModalClose.onclick = closeLoadModal;
  loadModalBackdrop.addEventListener("click", (e) => {
    if (e.target === loadModalBackdrop) closeLoadModal();
  });

  // Radial menu click-outside handler is set up in openRadialMenu

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

  // Pin modal auto-save handlers (save changes as user types)
  const autoSaveFields = ['pm-title', 'pm-subtitle', 'pm-description', 'pm-note', 'pm-date', 'pm-color', 'pm-text-color', 'pm-scale'];
  const areaAutoSaveFields = ['pm-area-title', 'pm-area-description', 'pm-area-icon', 'pm-area-fill-color', 'pm-area-border-color', 'pm-area-border-width', 'pm-area-text-color', 'pm-area-icon-color'];

  // Regular fields auto-save
  autoSaveFields.forEach(fieldId => {
    const field = document.getElementById(fieldId);
    if (field) {
      field.addEventListener('input', () => {
        const pin = window.app.appState.pins[window.modalPinIndex];
        if (!pin) return;

        // Save history before making changes
        window.app.appState.saveHistory();

        // Field mapping for auto-save functionality
        const pinFieldMappings = {
          'pm-title': { property: 'label', transform: (value) => value.trim() },
          'pm-subtitle': { property: 'subtitle', transform: (value) => value.trim() },
          'pm-description': { property: 'description', transform: (value) => value.trim() },
          'pm-note': { property: 'note', transform: (value) => value.trim() },
          'pm-date': { property: 'date', transform: (value) => value },
          'pm-color': { property: 'color', transform: (value) => value },
          'pm-text-color': { property: 'textColor', transform: (value) => value },
          'pm-scale': { property: 'pinScale', transform: (value) => parseFloat(value) || 1 },
        };

        // Update pin based on field mapping
        const mapping = pinFieldMappings[fieldId];
        if (mapping) {
          pin[mapping.property] = mapping.transform(field.value);
        }

        window.app.updatePinInfo();
        window.app.saveState();
        window.draw();
      });
    }
  });

  // Area-specific fields auto-save
  areaAutoSaveFields.forEach(fieldId => {
    const field = document.getElementById(fieldId);
    if (field) {
      field.addEventListener('input', () => {
        const pin = window.app.appState.pins[window.modalPinIndex];
        if (!pin) return;

        // Save history before making changes
        window.app.appState.saveHistory();

        // Field mapping for area pin auto-save functionality
        const areaPinFieldMappings = {
          'pm-area-title': { property: 'title', transform: (value) => value.trim() },
          'pm-area-description': { property: 'description', transform: (value) => value.trim() },
          'pm-area-icon': { property: 'icon', transform: (value) => value.trim() },
          'pm-area-fill-color': { property: 'fillColor', transform: (value) => value },
          'pm-area-border-color': { property: 'borderColor', transform: (value) => value },
          'pm-area-border-width': { property: 'borderWidth', transform: (value) => parseInt(value) || 2 },
          'pm-area-text-color': { property: 'textColor', transform: (value) => value },
          'pm-area-icon-color': { property: 'iconColor', transform: (value) => value },
        };

        // Update area pin based on field mapping
        const areaMapping = areaPinFieldMappings[fieldId];
        if (areaMapping) {
          pin[areaMapping.property] = areaMapping.transform(field.value);
        }

        window.app.updatePinInfo();
        window.app.saveState();
        window.draw();
      });
    }
  });

  // Pin modal delete handler
  pmDelete = document.getElementById("pm-delete");
  if (pmDelete) {
    pmDelete.onclick = () => {
      if (confirm('Are you sure you want to delete this pin?')) {
        const pinIndex = window.modalPinIndex;
        window.app.appState.saveHistory();

        // Remove the pin
        window.app.appState.pins.splice(pinIndex, 1);

        // Clear selection and close modal
        window.app.setSelectedPin(null);
        closePinModal();

        window.app.saveState();
        window.draw();
      }
    };
  }

  // Pin modal save handler (now just closes the modal since auto-save handles the saving)
  if (pmSave) {
    pmSave.onclick = () => {
      closePinModal();
    };
  }

  // Load modal handlers
  // Note: Load modal uses file input and example buttons, no submit button

  // Initialize connection modal
  initConnectionModal();
}

// ============================================================================
// CONNECTION MODAL
// ============================================================================

let connectionModalBackdrop = null;
let connectionModalIndex = null;

/**
 * Open the connection edit modal
 * @param {number} connectionIndex - Index of the connection to edit
 */
function openConnectionModal(connectionIndex) {
  connectionModalBackdrop = document.getElementById("connection-modal-backdrop");
  if (!connectionModalBackdrop) {
    console.error("❌ Connection modal backdrop not found");
    return;
  }

  const connection = window.app?.appState?.connections[connectionIndex];
  if (!connection) {
    console.error("❌ Connection not found at index:", connectionIndex);
    return;
  }

  connectionModalIndex = connectionIndex;

  // Populate form fields
  const labelInput = document.getElementById("conn-label");
  const descriptionInput = document.getElementById("conn-description");
  const colorInput = document.getElementById("conn-color");
  const typeSelect = document.getElementById("conn-type");
  const gradientCheckbox = document.getElementById("conn-gradient");
  const gradientHint = document.getElementById("conn-gradient-hint");
  const relationshipSelect = document.getElementById("conn-relationship");
  const confidenceSlider = document.getElementById("conn-confidence");
  const confidenceValue = document.getElementById("conn-confidence-value");
  const validationSlider = document.getElementById("conn-validation");
  const validationValue = document.getElementById("conn-validation-value");

  if (labelInput) labelInput.value = connection.label || "";
  if (descriptionInput) descriptionInput.value = connection.description || "";
  if (colorInput) colorInput.value = connection.color || "#666666";
  if (typeSelect) typeSelect.value = connection.type || window.app.appState.connectionType || "straight";
  if (gradientCheckbox) gradientCheckbox.checked = connection.useGradient || false;

  // Populate relationship type dropdown
  if (relationshipSelect) {
    relationshipSelect.innerHTML = "";
    const relationshipTypes = window.RELATIONSHIP_TYPES || [];
    relationshipTypes.forEach(rt => {
      const option = document.createElement("option");
      option.value = rt.id;
      option.textContent = `${rt.icon} ${rt.label}`;
      option.title = rt.description;
      relationshipSelect.appendChild(option);
    });
    relationshipSelect.value = connection.relationshipType || "none";
  }

  // Set confidence and validation sliders
  const confidence = connection.confidenceScore ?? 50;
  const validation = connection.validationPercent ?? 0;
  
  if (confidenceSlider) {
    confidenceSlider.value = confidence;
    if (confidenceValue) confidenceValue.textContent = confidence;
  }
  if (validationSlider) {
    validationSlider.value = validation;
    if (validationValue) validationValue.textContent = validation;
  }

  // Update gradient hint based on pin colors
  if (gradientHint) {
    const fromPin = window.app.appState.pins[connection.from];
    const toPin = window.app.appState.pins[connection.to];
    const fromColor = fromPin?.color || "#666666";
    const toColor = toPin?.color || "#666666";
    
    if (fromColor.toLowerCase() === toColor.toLowerCase()) {
      gradientHint.textContent = "Pin colors are the same - gradient won't be visible";
      gradientHint.style.color = "#f0883e"; // Warning orange
    } else {
      gradientHint.textContent = `Gradient: ${fromColor} → ${toColor}`;
      gradientHint.style.color = "#8b949e"; // Normal gray
    }
  }

  // Show modal
  connectionModalBackdrop.style.display = "flex";

  // Focus on label input
  if (labelInput) labelInput.focus();

  console.log("🔗 Opened connection modal for connection:", connectionIndex);
}

/**
 * Close the connection modal
 */
function closeConnectionModal() {
  if (connectionModalBackdrop) {
    connectionModalBackdrop.style.display = "none";
  }
  connectionModalIndex = null;
}

/**
 * Save connection modal data
 */
function saveConnectionModal() {
  if (connectionModalIndex === null) return;

  const connection = window.app?.appState?.connections[connectionModalIndex];
  if (!connection) return;

  // Get form values
  const labelInput = document.getElementById("conn-label");
  const descriptionInput = document.getElementById("conn-description");
  const colorInput = document.getElementById("conn-color");
  const typeSelect = document.getElementById("conn-type");
  const gradientCheckbox = document.getElementById("conn-gradient");
  const relationshipSelect = document.getElementById("conn-relationship");
  const confidenceSlider = document.getElementById("conn-confidence");
  const validationSlider = document.getElementById("conn-validation");

  // Update connection
  if (labelInput) connection.label = labelInput.value;
  if (descriptionInput) connection.description = descriptionInput.value;
  if (colorInput) connection.color = colorInput.value;
  if (typeSelect) connection.type = typeSelect.value;
  if (gradientCheckbox) connection.useGradient = gradientCheckbox.checked;
  if (relationshipSelect) connection.relationshipType = relationshipSelect.value;
  if (confidenceSlider) connection.confidenceScore = parseInt(confidenceSlider.value, 10);
  if (validationSlider) connection.validationPercent = parseInt(validationSlider.value, 10);

  // Save state
  window.app.appState.saveHistory();
  window.app.saveState();
  window.draw();

  closeConnectionModal();
  console.log("🔗 Saved connection:", connectionModalIndex);
}

/**
 * Delete connection from modal
 */
function deleteConnectionFromModal() {
  if (connectionModalIndex === null) return;

  if (confirm("Delete this connection?")) {
    window.app.appState.connections.splice(connectionModalIndex, 1);
    window.app.appState.clearConnectionSelection();
    window.app.appState.saveHistory();
    window.app.saveState();
    window.draw();
    closeConnectionModal();
  }
}

/**
 * Initialize connection modal event handlers
 */
function initConnectionModal() {
  const closeBtn = document.getElementById("connection-modal-close");
  const saveBtn = document.getElementById("conn-save");
  const deleteBtn = document.getElementById("conn-delete");
  const backdrop = document.getElementById("connection-modal-backdrop");
  const confidenceSlider = document.getElementById("conn-confidence");
  const confidenceValue = document.getElementById("conn-confidence-value");
  const validationSlider = document.getElementById("conn-validation");
  const validationValue = document.getElementById("conn-validation-value");

  if (closeBtn) {
    closeBtn.onclick = closeConnectionModal;
  }

  if (saveBtn) {
    saveBtn.onclick = saveConnectionModal;
  }

  if (deleteBtn) {
    deleteBtn.onclick = deleteConnectionFromModal;
    deleteBtn.classList.add("delete"); // Add delete class for styling
  }

  // Close on backdrop click
  if (backdrop) {
    backdrop.onclick = (e) => {
      if (e.target === backdrop) {
        closeConnectionModal();
      }
    };
  }

  // Slider value display updates
  if (confidenceSlider && confidenceValue) {
    confidenceSlider.oninput = () => {
      confidenceValue.textContent = confidenceSlider.value;
    };
  }

  if (validationSlider && validationValue) {
    validationSlider.oninput = () => {
      validationValue.textContent = validationSlider.value;
    };
  }

  // Close on Escape key
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && connectionModalBackdrop?.style.display === "flex") {
      closeConnectionModal();
    }
  });
}

// ============================================================================
// CONNECTION RADIAL MENU
// ============================================================================

// Connection radial menu element (reuses radialMenuEl)
let connectionRadialMenuEl = null;
let connectionRadialMenuOutsideClickHandler = null;

/**
 * Open the radial context menu for a connection
 * @param {number} connectionIndex - Index of the connection to show menu for
 * @param {number} screenX - Screen X coordinate
 * @param {number} screenY - Screen Y coordinate
 */
function openConnectionRadialMenu(connectionIndex, screenX, screenY) {
  console.log("🔗 openConnectionRadialMenu called with connectionIndex:", connectionIndex);

  // Set global flag that menu is open
  window.isRadialMenuOpen = true;
  window.isConnectionRadialMenuOpen = true;

  // Check if app is available
  if (!window.app) {
    console.error("❌ window.app not available - app not initialized yet");
    return;
  }

  // Reuse the radial menu element or create a new one
  if (!radialMenuEl) {
    radialMenuEl = document.createElement("div");
    radialMenuEl.id = "radial-menu";
    radialMenuEl.className = "radial-menu";
    radialMenuEl.tabIndex = -1;

    radialMenuEl.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      e.stopPropagation();
      return false;
    });

    document.body.appendChild(radialMenuEl);
  }

  closeRadialMenu();

  const connection = window.app.appState.connections[connectionIndex];
  if (!connection) {
    console.error("❌ Connection not found at index:", connectionIndex);
    return;
  }

  // Store the connection index for wheel selection
  window.currentRadialConnectionIndex = connectionIndex;
  window.currentRadialPinIndex = null; // Clear pin index

  console.log("🔗 Opening radial menu for connection:", connection);

  // Position the menu
  const menuSize = 200;
  const centerOffset = menuSize / 2;

  radialMenuEl.style.width = menuSize + "px";
  radialMenuEl.style.height = menuSize + "px";
  const leftPos = screenX - centerOffset;
  const topPos = screenY - centerOffset;
  radialMenuEl.style.left = leftPos + "px";
  radialMenuEl.style.top = topPos + "px";

  const radius = 70;
  const connType = connection.type || window.app.appState.connectionType;

  // Connection menu items
  const items = [
    { icon: "✏️", action: "edit", title: "Edit Connection" },
    { icon: "🗑️", action: "delete", title: "Delete Connection", className: "delete" },
    { 
      icon: connType === "curved" ? "📏" : "📈", 
      action: "toggleType", 
      title: connType === "curved" ? "Make Straight" : "Make Curved" 
    },
  ];

  // Store items globally for wheel selection
  window.currentRadialItems = items;
  window.currentRadialSelection = 0;

  radialMenuEl.style.display = "block";
  radialMenuEl.focus();

  items.forEach((item, i) => {
    const angle = (i / items.length) * Math.PI * 2;
    const x = centerOffset + radius * Math.cos(angle - Math.PI / 2) - 24;
    const y = centerOffset + radius * Math.sin(angle - Math.PI / 2) - 24;

    const itemEl = document.createElement("div");
    itemEl.className = "radial-item" + (item.className ? " " + item.className : "");
    if (i === window.currentRadialSelection) {
      itemEl.className += " selected";
    }
    itemEl.innerHTML = item.icon;
    itemEl.style.left = x + "px";
    itemEl.style.top = y + "px";
    itemEl.title = item.title;
    itemEl.onclick = (e) => {
      e.stopPropagation();
      closeRadialMenu();
      executeConnectionRadialAction(item.action, connectionIndex);
    };
    radialMenuEl.appendChild(itemEl);
  });

  radialMenuEl.onclick = (e) => e.stopPropagation();

  // Add click-outside-to-close functionality
  connectionRadialMenuOutsideClickHandler = (e) => {
    if (!radialMenuEl.contains(e.target)) {
      closeRadialMenu();
    }
  };

  setTimeout(() => {
    document.addEventListener("click", connectionRadialMenuOutsideClickHandler);
  }, 10);
}

/**
 * Execute a connection radial menu action
 * @param {string} action - The action to execute
 * @param {number} connectionIndex - Index of the connection
 */
function executeConnectionRadialAction(action, connectionIndex) {
  const connection = window.app.appState.connections[connectionIndex];
  if (!connection) return;

  // Use centralized action system
  if (window.executeAction) {
    switch (action) {
      case "edit":
        window.executeAction("connection:edit", connectionIndex);
        break;
      case "delete":
        window.executeAction("connection:delete", connectionIndex);
        break;
      case "toggleType":
        window.executeAction("connection:toggleType", connectionIndex);
        break;
    }
  }
}

// ============================================================================
// FUNCTION EXPORTS
// ============================================================================

// Expose UI functions globally
window.openRadialMenu = openRadialMenu;
window.closeRadialMenu = closeRadialMenu;
window.selectRadialMenuItem = selectRadialMenuItem;
window.executeSelectedRadialItem = executeSelectedRadialItem;
window.closeRadialMenu = closeRadialMenu;
// Use ModalManager's openPinModal instead of the old ui.js version
window.openPinModal = (index) => window.app?.modalManager?.openPinModal(index);
window.closePinModal = closePinModal;
window.openAddColorModal = openAddColorModal;
window.closeAddColorModal = closeAddColorModal;
window.openConnectionRadialMenu = openConnectionRadialMenu;
window.executeConnectionRadialAction = executeConnectionRadialAction;
window.openConnectionModal = openConnectionModal;
window.closeConnectionModal = closeConnectionModal;
window.saveConnectionModal = saveConnectionModal;
window.initConnectionModal = initConnectionModal;
