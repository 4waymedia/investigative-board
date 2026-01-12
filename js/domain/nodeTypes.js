// ============================================================================
// NODE TYPES MODULE - Node type definitions and utilities
// ============================================================================

// ============================================================================
// NODE TYPE DEFINITIONS
// ============================================================================

const NODE_TYPES = [
  // Pin types
  {
    id: "pin:circle",
    label: "Circle Pin",
    icon: "●",
    family: "pin",
    variant: "circle",
    defaultColor: "#58a6ff",
    category: "basic"
  },
  {
    id: "pin:square",
    label: "Square Pin",
    icon: "■",
    family: "pin",
    variant: "square",
    defaultColor: "#58a6ff",
    category: "basic"
  },
  {
    id: "pin:pill",
    label: "Pill Pin",
    icon: "▭",
    family: "pin",
    variant: "pill",
    defaultColor: "#58a6ff",
    category: "basic"
  },
  {
    id: "pin:diamond",
    label: "Diamond Pin",
    icon: "◆",
    family: "pin",
    variant: "diamond",
    defaultColor: "#58a6ff",
    category: "special"
  },
  {
    id: "pin:person",
    label: "Person Pin",
    icon: "👤",
    family: "pin",
    variant: "person",
    defaultColor: "#58a6ff",
    category: "entity"
  },
  {
    id: "pin:business-building",
    label: "Business Building Pin",
    icon: "🏢",
    family: "pin",
    variant: "business-building",
    defaultColor: "#58a6ff",
    category: "entity"
  },

  // Card types
  {
    id: "card:card",
    label: "Note Card",
    icon: "▤",
    family: "card",
    variant: "card",
    defaultColor: "#58a6ff",
    category: "document"
  },
  {
    id: "card:doc",
    label: "Doc Card",
    icon: "📄",
    family: "card",
    variant: "document",
    defaultColor: "#58a6ff",
    category: "document"
  },
  {
    id: "card:folder",
    label: "Folder Card",
    icon: "📁",
    family: "card",
    variant: "folder",
    defaultColor: "#58a6ff",
    category: "document"
  },

  // Area types
  {
    id: "area:circle",
    label: "Circle Area",
    icon: "⭕",
    family: "area",
    variant: "circle",
    defaultColor: "#58a6ff",
    category: "area"
  },
  {
    id: "area:square",
    label: "Square Area",
    icon: "▢",
    family: "area",
    variant: "square",
    defaultColor: "#58a6ff",
    category: "area"
  },
];

// ============================================================================
// NODE TYPE UTILITIES
// ============================================================================

/**
 * Get a node type by ID
 * @param {string} id - Node type ID
 * @returns {Object|null} Node type object or null if not found
 */
function getNodeType(id) {
  return NODE_TYPES.find(type => type.id === id) || null;
}

/**
 * Get all node types for a specific family
 * @param {string} family - Node family ("pin", "card", "area")
 * @returns {Array} Array of node types
 */
function getNodeTypesByFamily(family) {
  return NODE_TYPES.filter(type => type.family === family);
}

/**
 * Get all node types for a specific category
 * @param {string} category - Node category ("basic", "special", "entity", "document", "area")
 * @returns {Array} Array of node types
 */
function getNodeTypesByCategory(category) {
  return NODE_TYPES.filter(type => type.category === category);
}

/**
 * Get the default node type for a family
 * @param {string} family - Node family
 * @returns {Object|null} Default node type or null
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
  return NODE_TYPES.some(type => type.id === id);
}

/**
 * Get display properties for a node type
 * @param {string} id - Node type ID
 * @returns {Object} Display properties
 */
function getNodeTypeDisplay(id) {
  const type = getNodeType(id);
  if (!type) {
    return {
      label: "Unknown",
      icon: "❓",
      color: "#888888"
    };
  }

  return {
    label: type.label,
    icon: type.icon,
    color: type.defaultColor
  };
}

/**
 * Get all available families
 * @returns {Array} Array of unique family names
 */
function getAvailableFamilies() {
  const families = [...new Set(NODE_TYPES.map(type => type.family))];
  return families;
}

/**
 * Get all available categories
 * @returns {Array} Array of unique category names
 */
function getAvailableCategories() {
  const categories = [...new Set(NODE_TYPES.map(type => type.category))];
  return categories;
}

// ============================================================================
// GLOBAL EXPORTS
// ============================================================================

window.NodeTypesAPI = {
  NODE_TYPES,
  getNodeType,
  getNodeTypesByFamily,
  getNodeTypesByCategory,
  getDefaultNodeType,
  isValidNodeType,
  getNodeTypeDisplay,
  getAvailableFamilies,
  getAvailableCategories
};
