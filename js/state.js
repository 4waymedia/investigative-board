// ============================================================================
// STATE MANAGEMENT MODULE - Data persistence, history, and state handling
// ============================================================================

// ============================================================================
// CONSTANTS
// ============================================================================

const STORAGE_KEY = "investigativeBoardState"; // localStorage key for persistence
const MAX_HISTORY = 100; // Maximum undo history entries

// ============================================================================
// STATE PERSISTENCE
// ============================================================================

/**
 * Saves the current application state to localStorage
 */
function saveState() {
  if (!window.localStorage) return;

  // Stop simulation before saving a snapshot
  if (isLayoutSimulating) toggleForceLayout();

  // Convert timelinePins to a serializable format (store pin indices instead of references)
  const serializedTimelinePins = timelinePins.map((tp) => {
    const pinIndex = pins.indexOf(tp.pin);
    return {
      pinIndex: pinIndex !== -1 ? pinIndex : null,
      dateStr: tp.dateStr,
      timestamp: tp.timestamp,
    };
  });

  const state = {
    pins,
    connections,
    cards,
    textElements,
    history,
    scale,
    offsetX,
    offsetY,
    timelineActive,
    timelinePins: serializedTimelinePins,
    timelineY,
    timelineLeft,
    timelineRight,
    selectedColor,
    palette,
    nextId,
    selectedTypeByFamily,
    currentFamily,
    currentTypeId,
    connectionType,
    currentThemeId,
  };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error("Error saving state to localStorage:", error);
  }
}

/**
 * Loads the application state from localStorage
 * @returns {boolean} True if state was loaded successfully
 */
function loadState() {
  if (!window.localStorage) return false;

  try {
    const storedState = localStorage.getItem(STORAGE_KEY);
    if (storedState) {
      const state = JSON.parse(storedState);

      pins = state.pins || [];
      connections = state.connections || [];
      cards = state.cards || [];
      textElements = state.textElements || [];
      history = state.history || [];

      scale = state.scale || 1;
      offsetX = state.offsetX || 0;
      offsetY = state.offsetY || 0;

      timelineActive = state.timelineActive || false;
      // Restore timelinePins - re-link pin references using indices
      const restoredTimelinePins = (state.timelinePins || [])
        .map((stp) => {
          // Check if it's the old format (has pin property) or new format (has pinIndex)
          if (stp.pin && typeof stp.pin === "object") {
            // Old format - try to find the pin by matching properties
            const pinIndex = pins.findIndex(
              (p) =>
                p &&
                stp.pin &&
                p.x === stp.pin.x &&
                p.y === stp.pin.y &&
                (p.label || "") === (stp.pin.label || "")
            );
            if (pinIndex !== -1) {
              return {
                pin: pins[pinIndex],
                dateStr: stp.dateStr,
                timestamp: stp.timestamp,
              };
            }
          } else if (
            typeof stp.pinIndex === "number" &&
            pins[stp.pinIndex]
          ) {
            // New format - use pinIndex
            return {
              pin: pins[stp.pinIndex],
              dateStr: stp.dateStr,
              timestamp: stp.timestamp,
            };
          }
          return null;
        })
        .filter((tp) => tp !== null && tp.pin !== undefined);
      timelinePins = restoredTimelinePins;
      timelineY = state.timelineY || 0;
      timelineLeft = state.timelineLeft || 0;
      timelineRight = state.timelineRight || 0;

      selectedColor = state.selectedColor || palette[0].value;
      palette = state.palette || defaultColors;
      nextId = state.nextId || nextId;

      selectedTypeByFamily =
        state.selectedTypeByFamily || selectedTypeByFamily;
      currentFamily = state.currentFamily || currentFamily;
      currentTypeId = state.currentTypeId || currentTypeId;
      connectionType = state.connectionType || "straight";

      // Store saved theme ID to apply after themes are loaded
      // (Themes may not be loaded yet, so we'll apply it later)
      if (state.currentThemeId) {
        // Store in a variable that will be used after loadThemes()
        window._savedThemeId = state.currentThemeId;
        window._savedSelectedColor = state.selectedColor;
      }

      // Update area containment after loading
      updateAreaContainment();

      console.log("State loaded successfully from localStorage.");
      return true;
    }
  } catch (error) {
    console.error("Error loading state from localStorage:", error);
  }
  return false;
}

// ============================================================================
// HISTORY MANAGEMENT
// ============================================================================

/**
 * Saves the current state to history for undo functionality
 */
function saveHistory() {
  // Stop simulation before saving a snapshot
  if (isLayoutSimulating) toggleForceLayout();

  // Serialize timelinePins for history (store pin indices instead of references)
  const serializedTimelinePins = timelinePins.map((tp) => {
    const pinIndex = pins.indexOf(tp.pin);
    return {
      pinIndex: pinIndex !== -1 ? pinIndex : null,
      dateStr: tp.dateStr,
      timestamp: tp.timestamp,
    };
  });

  const snapshot = {
    pins: JSON.parse(JSON.stringify(pins)),
    connections: JSON.parse(JSON.stringify(connections)),
    cards: JSON.parse(JSON.stringify(cards)),
    textElements: JSON.parse(JSON.stringify(textElements)),
    tempStartIndex,
    connectStartIndex,
    selectedPinIndex,
    timelineActive,
    timelinePins: serializedTimelinePins,
    timelineY,
    timelineLeft,
    timelineRight,
    scale,
    offsetX,
    offsetY,
  };
  history.push(snapshot);
  if (history.length > MAX_HISTORY) history.shift();

  saveState(); // Crucial: Save to local storage after every history snapshot
}

/**
 * Undoes the last action by restoring the previous state from history
 */
function undo() {
  if (!history.length) return;
  // Stop simulation when restoring state
  if (isLayoutSimulating) toggleForceLayout();

  const snapshot = history.pop();
  pins = snapshot.pins;
  connections = snapshot.connections;
  cards = snapshot.cards;
  textElements = snapshot.textElements;
  tempStartIndex = snapshot.tempStartIndex;
  connectStartIndex = snapshot.connectStartIndex;
  selectedPinIndex = snapshot.selectedPinIndex;
  timelineActive = snapshot.timelineActive;
  // Restore timelinePins from history - re-link pin references using indices
  timelinePins = (snapshot.timelinePins || [])
    .map((stp) => {
      if (
        typeof stp.pinIndex === "number" &&
        snapshot.pins &&
        snapshot.pins[stp.pinIndex]
      ) {
        // New format - use pinIndex (pins haven't been restored yet, so use snapshot.pins)
        // After pins are restored, we'll re-link them
        return {
          pinIndex: stp.pinIndex,
          dateStr: stp.dateStr,
          timestamp: stp.timestamp,
        };
      }
      // Old format - try to match by properties
      if (stp.pin && typeof stp.pin === "object" && snapshot.pins) {
        const pinIndex = snapshot.pins.findIndex(
          (p) =>
            p &&
            stp.pin &&
            p.x === stp.pin.x &&
            p.y === stp.pin.y &&
            (p.label || "") === (stp.pin.label || "")
        );
        if (pinIndex !== -1) {
          return {
            pinIndex,
            dateStr: stp.dateStr,
            timestamp: stp.timestamp,
          };
        }
      }
      return null;
    })
    .filter((tp) => tp !== null);

  // Now re-link timelinePins to actual pins after pins array is restored
  timelinePins = timelinePins
    .map((stp) => {
      if (typeof stp.pinIndex === "number" && pins[stp.pinIndex]) {
        return {
          pin: pins[stp.pinIndex],
          dateStr: stp.dateStr,
          timestamp: stp.timestamp,
        };
      }
      return null;
    })
    .filter((tp) => tp !== null && tp.pin !== undefined);

  timelineY = snapshot.timelineY;
  timelineLeft = snapshot.timelineLeft;
  timelineRight = snapshot.timelineRight;
  scale = snapshot.scale;
  offsetX = snapshot.offsetX;
  offsetY = snapshot.offsetY;
  renderCards();
  if (window.app && window.app.updatePinInfo) {
    window.app.updatePinInfo();
  }
  saveState(); // Save state after undoing
  draw();
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Updates area containment relationships after state changes
 */
function updateAreaContainment() {
  // Implementation depends on specific area logic - placeholder for now
  // This function would recalculate which pins are contained within area pins
}

// ============================================================================
// APPSTATE INTEGRATION FUNCTIONS
// ============================================================================

/**
 * Save AppState instance to localStorage
 * @param {AppState} appState - The AppState instance to save
 */
function saveAppState(appState) {
  if (!appState) {
    console.warn("No appState provided to saveAppState");
    return;
  }

  const stateData = appState.toSerializable();

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stateData));
    console.log("AppState saved successfully to localStorage.");
  } catch (e) {
    console.error("Failed to save AppState to localStorage:", e);
  }
}

/**
 * Load state from localStorage into AppState instance
 * @param {AppState} appState - The AppState instance to load into
 */
function loadAppState(appState) {
  if (!appState) {
    console.warn("No appState provided to loadAppState");
    return false;
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const stateData = JSON.parse(stored);
      appState.fromSerializable(stateData);
      console.log("AppState loaded successfully from localStorage.");
      return true;
    }
  } catch (e) {
    console.error("Failed to load AppState from localStorage:", e);
  }
  return false;
}
