// ============================================================================
// NODE TYPES MODULE - Node type definitions and utilities
// ============================================================================

// NODE_TYPES is available globally from constants.js

// ============================================================================
// NODE TYPE UTILITIES
// ============================================================================

/**
 * Get a node type by ID
 * @param {string} id - Node type ID
 * @returns {object|null} Node type object or null if not found
 */
function getNodeType(id) {
  return window.NODE_TYPES.find(type => type.id === id) || null;
}

/**
 * Get all node types for a specific family
 * @param {string} family - Family name ('pin', 'card', 'area')
 * @returns {array} Array of node types for the family
 */
function getNodeTypesByFamily(family) {
  return window.NODE_TYPES.filter(type => type.family === family);
}

/**
 * Get the default node type for a family
 * @param {string} family - Family name
 * @returns {object|null} Default node type or null
 */
function getDefaultNodeType(family) {
  const familyTypes = getNodeTypesByFamily(family);
  return familyTypes.length > 0 ? familyTypes[0] : null;
}

/**
 * Check if a node type ID is valid
 * @param {string} id - Node type ID
 * @returns {boolean} True if valid
 */
function isValidNodeType(id) {
  return window.NODE_TYPES.some(type => type.id === id);
}

// ============================================================================
// GLOBAL EXPORTS
// ============================================================================

window.NodeTypesAPI = {
  get NODE_TYPES() { return window.NODE_TYPES; },
  getNodeType,
  getNodeTypesByFamily,
  getDefaultNodeType,
  isValidNodeType
};