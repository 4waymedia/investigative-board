// ============================================================================
// CARDS MODULE - Card system management and operations
// ============================================================================

/**
 * Create a new card
 * @param {string} title - Card title
 * @param {string} subtitle - Card subtitle (optional)
 * @param {string} date - Card date (optional)
 * @param {string} icon - Card icon (optional)
 * @param {string} color - Card color (optional)
 * @returns {Object} New card object
 */
function createCard(title, subtitle = "", date = "", icon = "▤", color = "#58a6ff") {
  const newCard = {
    id: generateCardId(),
    title: title || "Untitled Card",
    subtitle,
    date,
    icon,
    color,
    used: false, // Whether the card is currently attached to a pin
    x: 0, // World coordinates (when detached)
    y: 0
  };

  return newCard;
}

/**
 * Generate a unique card ID
 * @param {Array} cards - Array of existing cards
 * @returns {number} Unique card ID
 */
function generateCardId(cards) {
  if (!cards || cards.length === 0) return 0;
  const maxId = cards.reduce((max, card) => Math.max(max, card.id), -1);
  return maxId + 1;
}

/**
 * Find a card by ID
 * @param {number} id - Card ID
 * @param {Array} cards - Array of cards
 * @returns {Object|null} Card object or null if not found
 */
function findCardById(id, cards) {
  return cards.find(card => card.id === id) || null;
}

/**
 * Update a card's properties
 * @param {number} id - Card ID
 * @param {Object} updates - Properties to update
 * @param {Array} cards - Array of cards
 * @returns {Array} Updated cards array
 */
function updateCard(id, updates, cards) {
  return cards.map(card => {
    if (card.id === id) {
      return { ...card, ...updates };
    }
    return card;
  });
}

/**
 * Delete a card by ID
 * @param {number} id - Card ID to delete
 * @param {Array} cards - Array of cards
 * @returns {Array} Updated cards array
 */
function deleteCard(id, cards) {
  return cards.filter(card => card.id !== id);
}

/**
 * Mark a card as used/unused (attached to pin)
 * @param {number} id - Card ID
 * @param {boolean} used - Whether the card is used
 * @param {Array} cards - Array of cards
 * @returns {Array} Updated cards array
 */
function setCardUsed(id, used, cards) {
  return updateCard(id, { used }, cards);
}

/**
 * Get available (unused) cards
 * @param {Array} cards - Array of cards
 * @returns {Array} Array of available cards
 */
function getAvailableCards(cards) {
  return cards.filter(card => !card.used);
}

/**
 * Get cards attached to pins
 * @param {Array} cards - Array of cards
 * @returns {Array} Array of used cards
 */
function getUsedCards(cards) {
  return cards.filter(card => card.used);
}

/**
 * Attach a card to a pin
 * @param {number} cardId - Card ID
 * @param {number} pinIndex - Pin index
 * @param {Array} cards - Array of cards
 * @param {Array} pins - Array of pins
 * @returns {Object} Updated cards and pins arrays
 */
function attachCardToPin(cardId, pinIndex, cards, pins) {
  const updatedCards = setCardUsed(cardId, true, cards);
  const updatedPins = pins.map((pin, index) => {
    if (index === pinIndex) {
      return { ...pin, cardId };
    }
    return pin;
  });

  return { cards: updatedCards, pins: updatedPins };
}

/**
 * Detach a card from a pin
 * @param {number} pinIndex - Pin index
 * @param {Array} cards - Array of cards
 * @param {Array} pins - Array of pins
 * @returns {Object} Updated cards and pins arrays
 */
function detachCardFromPin(pinIndex, cards, pins) {
  const pin = pins[pinIndex];
  if (!pin || pin.cardId == null) {
    return { cards, pins };
  }

  const updatedCards = setCardUsed(pin.cardId, false, cards);
  const updatedPins = pins.map((p, index) => {
    if (index === pinIndex) {
      const { cardId, ...pinWithoutCard } = p;
      return pinWithoutCard;
    }
    return p;
  });

  return { cards: updatedCards, pins: updatedPins };
}

// ============================================================================
// GLOBAL EXPORTS
// ============================================================================

window.CardsAPI = {
  createCard,
  generateCardId,
  findCardById,
  updateCard,
  deleteCard,
  setCardUsed,
  getAvailableCards,
  getUsedCards,
  attachCardToPin,
  detachCardFromPin
};


