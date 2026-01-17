// Tray Management Module
// Handles the bottom tray UI and interactions

class TrayManager {
  constructor(appState) {
    this.appState = appState;

    // Get references to tray elements
    this.tray = document.getElementById("tray");
    this.trayContent = document.getElementById("tray-content");

    // Get references to global functions
    this.renderCards = null;
  }

  // Initialize tray
  initialize(dependencies) {
    // Store the external renderCards function if needed
    this.externalRenderCards = dependencies.renderCards;

    // Set up tray interactions
    this.setupTrayInteractions();
  }

  // Set up tray event handlers
  setupTrayInteractions() {
    // This will be implemented with tray interaction logic
  }

  // Render tray content
  render() {
    this.renderCardsContent();
  }

  // Render cards in the tray
  renderCardsContent() {
    if (!this.trayContent) {
      return;
    }

    this.trayContent.innerHTML = "";

    // Get cards from app state
    const cards = window.appState?.cards || [];

    // Add shuffle button at the start
    const shuffleBtn = document.createElement("div");
    shuffleBtn.className = "card";
    shuffleBtn.style.borderLeftColor = "#666";
    shuffleBtn.style.cursor = "pointer";
    shuffleBtn.style.minWidth = "120px";
    shuffleBtn.style.display = "flex";
    shuffleBtn.style.flexDirection = "column";
    shuffleBtn.style.alignItems = "center";
    shuffleBtn.style.justifyContent = "center";
    shuffleBtn.style.gap = "8px";
    shuffleBtn.innerHTML = `
      <div style="font-size:32px">🎲</div>
      <div style="font-size:12px;text-align:center;opacity:0.9">Shuffle<br/>Colors</div>
    `;
    shuffleBtn.title = "Shuffle card colors using current theme palette";
    shuffleBtn.onclick = () => {
      this.shuffleCardColors();
    };
    shuffleBtn.onmouseenter = () => {
      shuffleBtn.style.transform = "scale(1.05)";
      shuffleBtn.style.borderLeftColor = "#888";
    };
    shuffleBtn.onmouseleave = () => {
      shuffleBtn.style.transform = "scale(1)";
      shuffleBtn.style.borderLeftColor = "#666";
    };
    this.trayContent.appendChild(shuffleBtn);

    // Render each card
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
      div.ondragstart = (e) => e.dataTransfer.setData("cardId", c.id);
      div.ondragend = () => (div.style.opacity = "1");
      div.ondblclick = () => {
        this.openCardModal(c.id);
      };
      div.onmouseenter = () => {
        div.style.transform = "scale(1.02)";
        div.style.borderLeftWidth = "4px";
      };
      div.onmouseleave = () => {
        div.style.transform = "scale(1)";
        div.style.borderLeftWidth = "3px";
      };
      this.trayContent.appendChild(div);
    });

  }

  // Internal render cards method
  renderCardsInternal() {
    if (!this.trayContent) {
      return;
    }

    this.trayContent.innerHTML = "";

    // Get cards from app state
    const cards = window.appState?.cards || [];

    // Add shuffle button at the start
    const shuffleBtn = document.createElement("div");
    shuffleBtn.className = "card";
    shuffleBtn.style.borderLeftColor = "#666";
    shuffleBtn.style.cursor = "pointer";
    shuffleBtn.style.minWidth = "120px";
    shuffleBtn.style.display = "flex";
    shuffleBtn.style.flexDirection = "column";
    shuffleBtn.style.alignItems = "center";
    shuffleBtn.style.justifyContent = "center";
    shuffleBtn.style.gap = "8px";
    shuffleBtn.innerHTML = `
      <div style="font-size:32px">🎲</div>
      <div style="font-size:12px;text-align:center;opacity:0.9">Shuffle<br/>Colors</div>
    `;
    shuffleBtn.title = "Shuffle card colors using current theme palette";
    shuffleBtn.onclick = () => {
      this.shuffleCardColors();
    };
    shuffleBtn.onmouseenter = () => {
      shuffleBtn.style.transform = "scale(1.05)";
      shuffleBtn.style.borderLeftColor = "#888";
    };
    shuffleBtn.onmouseleave = () => {
      shuffleBtn.style.transform = "scale(1)";
      shuffleBtn.style.borderLeftColor = "#666";
    };
    this.trayContent.appendChild(shuffleBtn);

    // Render each card
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
      div.ondragstart = (e) => e.dataTransfer.setData("cardId", c.id);
      div.ondragend = () => (div.style.opacity = "1");
      div.ondblclick = () => {
        this.openCardModal(c.id);
      };
      div.onmouseenter = () => {
        div.style.transform = "scale(1.02)";
        div.style.borderLeftWidth = "4px";
      };
      div.onmouseleave = () => {
        div.style.transform = "scale(1)";
        div.style.borderLeftWidth = "3px";
      };
      this.trayContent.appendChild(div);
    });

  }


  // Shuffle card colors
  shuffleCardColors() {
    const cards = window.appState?.cards || [];
    const palette = window.DEFAULT_COLORS || [];

    if (cards.length === 0 || palette.length === 0) return;

    // Shuffle colors
    const shuffledColors = [...palette].sort(() => Math.random() - 0.5);

    cards.forEach((card, index) => {
      card.color = shuffledColors[index % shuffledColors.length].value;
    });

    // Save and re-render
    if (window.saveAppState) {
      window.saveAppState(window.appState);
    }
    this.renderCardsContent();
  }

  // Open card modal
  openCardModal(cardId) {
    // Placeholder - card modal functionality can be implemented later
  }

  // Show/hide tray
  toggleTray() {
    // This will be implemented with tray toggle logic
  }
}

// Export for global access
window.TrayManager = TrayManager;
