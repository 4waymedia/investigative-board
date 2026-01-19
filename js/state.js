// ============================================================================
// STATE MANAGEMENT MODULE - Data persistence, history, and state handling
// ============================================================================

// ============================================================================
// CONSTANTS
// ============================================================================

// Use constants from core/constants.js for consistency
const STORAGE_KEY = window.STORAGE_KEY || "investigativeBoardState";
const MAX_HISTORY = window.MAX_HISTORY || 100;

// ============================================================================
// ID GENERATION UTILITY
// ============================================================================

/**
 * Generates a unique identifier for state objects
 * @returns {string} A unique UUID
 */
function generateId() {
  // Use the modern Web Crypto API for high-entropy IDs
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for older environments
  return Math.random().toString(36).substring(2, 15) +
         Math.random().toString(36).substring(2, 15);
}

// ============================================================================
// OBSERVER PATTERN FOR STATE CHANGES
// ============================================================================

/**
 * Simple Observer pattern to decouple state changes from UI rendering
 */
class StateChangeObserver {
  constructor() {
    this.observers = new Set();
  }

  /**
   * Subscribe to state changes
   * @param {Function} callback - Function to call when state changes
   * @returns {Function} Unsubscribe function
   */
  subscribe(callback) {
    this.observers.add(callback);
    return () => this.observers.delete(callback);
  }

  /**
   * Notify all observers of state changes
   * @param {Object} changes - Object describing what changed
   */
  notify(changes) {
    this.observers.forEach(callback => {
      try {
        callback(changes);
      } catch (error) {
        console.error("Error in state change observer:", error);
      }
    });
  }
}

// Global observer instance
const stateObserver = new StateChangeObserver();

// ============================================================================
// DEBOUNCED PERSISTENCE
// ============================================================================

let saveTimeout;
function debouncedSave(appState) {
  clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => saveAppState(appState), 1000); // Save to disk 1 second after last change
}

// ============================================================================
// REFACTORED HISTORY MANAGEMENT (User's Approach)
// ============================================================================

/**
 * Saves the current state to history for undo functionality
 * Improved with UUID mapping and structuredClone
 */
function saveHistory() {
  if (isLayoutSimulating) toggleForceLayout();

  // Map timeline pins to IDs instead of array indices for stability
  const serializedTimelinePins = timelinePins.map((tp) => ({
    pinId: tp.pin.id, // Using stable ID
    dateStr: tp.dateStr,
    timestamp: tp.timestamp,
  }));

  const snapshot = {
    // structuredClone is faster and more robust than JSON.parse(JSON.stringify())
    pins: structuredClone(pins),
    connections: structuredClone(connections),
    cards: structuredClone(cards),
    textElements: structuredClone(textElements),
    timelinePins: serializedTimelinePins,
    // Include all necessary metadata
    scale,
    offsetX,
    offsetY,
    timelineActive,
    timelineY,
    timelineLeft,
    timelineRight,
    selectedColor,
    palette,
    tempStartIndex,
    connectStartIndex,
    selectedPinIndex
  };

  history.push(snapshot);
  if (history.length > MAX_HISTORY) history.shift();

  // Use debounced save for better performance
  debouncedSave();
}

/**
 * Undoes the last action
 * Restores object references by matching UUIDs
 */
function undo() {
  if (!history.length) return;
  if (isLayoutSimulating) toggleForceLayout();

  const snapshot = history.pop();

  // Restore primary data arrays
  pins = snapshot.pins;
  connections = snapshot.connections;
  cards = snapshot.cards;
  textElements = snapshot.textElements;

  // Re-link timeline references using UUIDs
  timelinePins = (snapshot.timelinePins || [])
    .map((stp) => {
      const actualPin = pins.find(p => p.id === stp.pinId);
      if (actualPin) {
        return {
          pin: actualPin,
          dateStr: stp.dateStr,
          timestamp: stp.timestamp
        };
      }
      return null;
    })
    .filter(tp => tp !== null);

  // Restore other state
  scale = snapshot.scale;
  offsetX = snapshot.offsetX;
  offsetY = snapshot.offsetY;
  timelineActive = snapshot.timelineActive;
  timelineY = snapshot.timelineY;
  timelineLeft = snapshot.timelineLeft;
  timelineRight = snapshot.timelineRight;
  selectedColor = snapshot.selectedColor;
  palette = snapshot.palette;
  tempStartIndex = snapshot.tempStartIndex;
  connectStartIndex = snapshot.connectStartIndex;
  selectedPinIndex = snapshot.selectedPinIndex;

  // Notify observers instead of direct UI calls
  stateObserver.notify({
    type: 'undo',
    changes: {
      pins: true,
      connections: true,
      cards: true,
      textElements: true,
      timelinePins: true,
      view: true,
      selection: true
    }
  });

  // Debounced save after undo
  debouncedSave();
}

// ============================================================================
// STATE PERSISTENCE
// ============================================================================

/**
 * Saves the current application state to localStorage
 * Updated to use UUIDs for timeline mapping
 */
function saveState() {
  if (!window.localStorage) return;
  if (isLayoutSimulating) toggleForceLayout();

  // Use the stable pin ID instead of the array index
  const serializedTimelinePins = timelinePins.map((tp) => ({
    pinId: tp.pin.id,
    dateStr: tp.dateStr,
    timestamp: tp.timestamp,
  }));

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
    // Include custom theme data
    customThemes: window.themeManager ? window.themeManager.themes.filter(t => t.isCustom) : [],
    customIcons: window.themeManager ? window.themeManager.customIcons : {},
  };

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error("Error saving state:", error);
  }
}

/**
 * Loads the application state from localStorage
 * Updated to use UUIDs for timeline mapping
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

      // Ensure pins have UUIDs (add if missing for backward compatibility)
      pins.forEach(pin => {
        if (!pin.id) {
          pin.id = generateId();
        }
      });

      // Restore timelinePins using UUIDs instead of indices
      if (state.timelinePins && state.timelinePins.length > 0) {
        timelinePins = state.timelinePins
          .map((stp) => {
            // New format with pinId (UUID-based)
            if (stp.pinId) {
              const pin = pins.find(p => p.id === stp.pinId);
              if (pin) {
                return {
                  pin: pin,
                  dateStr: stp.dateStr,
                  timestamp: stp.timestamp,
                };
              }
            }
            // Backward compatibility: old format with pinIndex
            else if (typeof stp.pinIndex === "number" && pins[stp.pinIndex]) {
              return {
                pin: pins[stp.pinIndex],
                dateStr: stp.dateStr,
                timestamp: stp.timestamp,
              };
            }
            // Oldest format with pin object properties
            else if (stp.pin && typeof stp.pin === "object") {
              const pin = pins.find(p =>
                p &&
                stp.pin &&
                p.x === stp.pin.x &&
                p.y === stp.pin.y &&
                (p.label || "") === (stp.pin.label || "")
              );
              if (pin) {
                return {
                  pin: pin,
                  dateStr: stp.dateStr,
                  timestamp: stp.timestamp,
                };
              }
            }
            return null;
          })
          .filter(tp => tp !== null && tp.pin !== undefined);
      }

      timelineY = state.timelineY || 0;
      timelineLeft = state.timelineLeft || 0;
      timelineRight = state.timelineRight || 0;

      selectedColor = state.selectedColor || (palette ? palette[0]?.value : "#58a6ff");
      palette = state.palette || defaultColors;
      nextId = state.nextId || nextId;

      selectedTypeByFamily = state.selectedTypeByFamily || selectedTypeByFamily;
      currentFamily = state.currentFamily || currentFamily;
      currentTypeId = state.currentTypeId || currentTypeId;
      connectionType = state.connectionType || "straight";

      // Store saved theme info to apply after themes are loaded
      if (state.currentThemeId) {
        window._pendingThemeApplication = {
          themeId: state.currentThemeId,
          selectedColor: state.selectedColor
        };
      }

      // Restore custom themes and icons
      if (window.themeManager) {
        if (state.customThemes && Array.isArray(state.customThemes)) {
          state.customThemes.forEach(theme => {
            // Avoid duplicates
            if (!window.themeManager.themes.find(t => t.id === theme.id)) {
              window.themeManager.themes.push(theme);
            }
          });
        }
        if (state.customIcons && typeof state.customIcons === 'object') {
          window.themeManager.customIcons = { ...state.customIcons };
        }
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
 * @param {AppState} appState - The AppState instance
 */
function saveHistory(appState) {
  if (!appState) {
    console.warn("No appState provided to saveHistory");
    return;
  }

  // Stop simulation before saving a snapshot (synchronous check)
  if (appState.isLayoutSimulating) {
    if (typeof toggleForceLayout === 'function') {
      toggleForceLayout();
      // Small delay to ensure synchronous completion
      setTimeout(() => saveHistoryInternal(appState), 10);
    } else {
      saveHistoryInternal(appState);
    }
    return;
  }

  saveHistoryInternal(appState);
}

/**
 * Internal function to save history snapshot
 * @param {AppState} appState - The AppState instance
 */
function saveHistoryInternal(appState) {
  // Serialize timelinePins using UUIDs for robust linking
  const serializedTimelinePins = appState.timelinePins.map((tp) => ({
    pinId: tp.pin.id, // Use UUID instead of index for stability
    dateStr: tp.dateStr,
    timestamp: tp.timestamp,
  }));

  // Use structuredClone for better performance than JSON.parse(JSON.stringify())
  const snapshot = {
    document: structuredClone(appState.document),
    view: structuredClone(appState.view),
    session: {
      tempStartIndex: appState.session.tempStartIndex,
      connectStartIndex: appState.session.connectStartIndex,
      selectedPinIndex: appState.session.selectedPinIndex,
      timelineActive: appState.document.timelineActive,
      timelinePins: serializedTimelinePins,
      timelineY: appState.document.timelineY,
      timelineLeft: appState.document.timelineLeft,
      timelineRight: appState.document.timelineRight,
    }
  };

  appState.history.push(snapshot);
  if (appState.history.length > MAX_HISTORY) {
    appState.history.shift();
  }

  // Use debounced save instead of immediate save for better performance
  debouncedSave(appState);
}

/**
 * Undoes the last action by restoring the previous state from history
 * @param {AppState} appState - The AppState instance
 */
function undo(appState) {
  if (!appState || !appState.history.length) return;

  // Stop simulation when restoring state
  if (appState.isLayoutSimulating) {
    if (typeof toggleForceLayout === 'function') {
      toggleForceLayout();
      // Small delay to ensure synchronous completion
      setTimeout(() => undoInternal(appState), 10);
    } else {
      undoInternal(appState);
    }
    return;
  }

  undoInternal(appState);
}

/**
 * Internal function to perform undo operation
 * @param {AppState} appState - The AppState instance
 */
function undoInternal(appState) {
  const snapshot = appState.history.pop();

  // Restore document and view state
  if (snapshot.document) {
    appState.document = structuredClone(snapshot.document);
  }
  if (snapshot.view) {
    appState.view = structuredClone(snapshot.view);
  }

  // Restore session state
  if (snapshot.session) {
    appState.session.tempStartIndex = snapshot.session.tempStartIndex;
    appState.session.connectStartIndex = snapshot.session.connectStartIndex;
    appState.session.selectedPinIndex = snapshot.session.selectedPinIndex;
  }

  // Restore timelinePins using UUIDs for robust linking
  if (snapshot.session && snapshot.session.timelinePins) {
    appState.timelinePins = snapshot.session.timelinePins
      .map((stp) => {
        // New format with pinId (UUID-based)
        if (stp.pinId) {
          const pin = appState.pins.find(p => p.id === stp.pinId);
          if (pin) {
            return {
              pin: pin,
              dateStr: stp.dateStr,
              timestamp: stp.timestamp,
            };
          }
        }
        // Backward compatibility: old format with pinIndex
        else if (typeof stp.pinIndex === "number" && appState.pins[stp.pinIndex]) {
          return {
            pin: appState.pins[stp.pinIndex],
            dateStr: stp.dateStr,
            timestamp: stp.timestamp,
          };
        }
        return null;
      })
      .filter(tp => tp !== null && tp.pin !== undefined);
  }

  // Clear transient session state after undo
  appState.session.selectedPins = [];
  appState.session.selectedTextIndex = null;
  appState.session.connectStartIndex = null;
  appState.session.connectMousePos = null;
  appState.session.marqueeStart = null;
  appState.session.marqueeEnd = null;

  // Notify observers of state changes (decoupled from direct UI calls)
  stateObserver.notify({
    type: 'undo',
    changes: {
      document: true,
      view: true,
      session: true,
      timelinePins: true
    }
  });

  // Use debounced save instead of immediate save
  debouncedSave(appState);
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

/**
 * Applies any pending theme that was loaded from state but couldn't be applied until themes were loaded
 */
function applyPendingTheme() {
  if (window._pendingThemeApplication && typeof applySavedThemeWithColor === 'function') {
    const { themeId, selectedColor } = window._pendingThemeApplication;
    delete window._pendingThemeApplication;
    applySavedThemeWithColor(themeId, selectedColor);
  }
}

// ============================================================================
// APPSTATE INTEGRATION FUNCTIONS
// ============================================================================

/**
 * Internal debounced save function
 */
function debouncedSave() {
  clearTimeout(window._saveTimeout);
  window._saveTimeout = setTimeout(() => {
    saveState();
  }, 1000); // Save to disk 1 second after last change
}

// ============================================================================
// APPSTATE INTEGRATION FUNCTIONS (for future migration)
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

  console.log("💾 saveAppState called - preparing to save...");

  const stateData = appState.toSerializable();
  console.log("💾 Serialized state data:", {
    pins: stateData.pins?.length || 0,
    connections: stateData.connections?.length || 0,
    scale: stateData.scale,
    offsetX: stateData.offsetX,
    offsetY: stateData.offsetY
  });

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stateData));
    console.log("✅ AppState saved successfully to localStorage.");
  } catch (e) {
    console.error("❌ Failed to save AppState to localStorage:", e);
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

// ============================================================================
// GLOBAL EXPORTS
// ============================================================================

// Export observer pattern for decoupling state changes from UI
window.stateObserver = stateObserver;

// Export utility functions
window.generateId = generateId;

// Export refactored functions (backward compatible)
window.saveState = saveState;
window.loadState = loadState;
window.saveHistory = saveHistory;
window.undo = undo;
window.applyPendingTheme = applyPendingTheme;

// Export AppState functions for future migration
window.saveAppState = saveAppState;
window.loadAppState = loadAppState;
