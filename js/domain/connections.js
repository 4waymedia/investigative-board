// ============================================================================
// CONNECTIONS MODULE - Connection management and operations
// ============================================================================

/**
 * Get the number of connections for a given pin index
 * @param {number} index - Pin index
 * @param {Array} connections - Array of connections
 * @returns {number} Number of connections
 */
function getConnectionCount(index, connections) {
  let count = 0;
  for (const c of connections) {
    if (c.startIndex === index || c.endIndex === index) count++;
  }
  return count;
}

/**
 * Check if two pins are already connected
 * @param {number} startIndex - Starting pin index
 * @param {number} endIndex - Ending pin index
 * @param {Array} connections - Array of connections
 * @returns {boolean} True if connected
 */
function arePinsConnected(startIndex, endIndex, connections) {
  return connections.some(c =>
    (c.startIndex === startIndex && c.endIndex === endIndex) ||
    (c.startIndex === endIndex && c.endIndex === startIndex)
  );
}

/**
 * Create a connection between two pins
 * @param {number} startIndex - Starting pin index
 * @param {number} endIndex - Ending pin index
 * @param {string} type - Connection type ("straight" or "curved")
 * @param {string} color - Connection color
 * @returns {Object} New connection object
 */
function createConnection(startIndex, endIndex, type = "straight", color = "#888888") {
  return {
    startIndex,
    endIndex,
    type,
    color
  };
}

/**
 * Remove a connection between two pins
 * @param {number} startIndex - Starting pin index
 * @param {number} endIndex - Ending pin index
 * @param {Array} connections - Array of connections
 * @returns {Array} Updated connections array
 */
function removeConnection(startIndex, endIndex, connections) {
  return connections.filter(c =>
    !(c.startIndex === startIndex && c.endIndex === endIndex) &&
    !(c.startIndex === endIndex && c.endIndex === startIndex)
  );
}

/**
 * Get all connections for a given pin
 * @param {number} pinIndex - Pin index
 * @param {Array} connections - Array of connections
 * @returns {Array} Array of connections
 */
function getConnectionsForPin(pinIndex, connections) {
  return connections.filter(c =>
    c.startIndex === pinIndex || c.endIndex === pinIndex
  );
}

/**
 * Remove all connections involving deleted pins and adjust indices
 * @param {Array} connections - Array of connections
 * @param {Array} removedIndices - Array of removed pin indices (sorted descending)
 * @param {number} newPinCount - New total number of pins
 * @returns {Array} Updated connections array
 */
function cleanupConnectionsAfterDeletion(connections, removedIndices, newPinCount) {
  let updatedConnections = connections.filter(c => {
    // Remove connections that reference deleted pins
    return !removedIndices.includes(c.startIndex) &&
           !removedIndices.includes(c.endIndex) &&
           c.startIndex < newPinCount &&
           c.endIndex < newPinCount;
  });

  // Adjust connection indices for removed pins
  updatedConnections = updatedConnections.map(c => {
    const newC = { ...c };

    // Adjust startIndex
    let adjustment = removedIndices.filter(idx => idx < c.startIndex).length;
    newC.startIndex = c.startIndex - adjustment;

    // Adjust endIndex
    adjustment = removedIndices.filter(idx => idx < c.endIndex).length;
    newC.endIndex = c.endIndex - adjustment;

    return newC;
  });

  return updatedConnections;
}

// ============================================================================
// GLOBAL EXPORTS
// ============================================================================

window.ConnectionsAPI = {
  getConnectionCount,
  arePinsConnected,
  createConnection,
  removeConnection,
  getConnectionsForPin,
  cleanupConnectionsAfterDeletion
};




