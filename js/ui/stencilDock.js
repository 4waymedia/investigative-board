/**
 * Stencil Dock & Clue Preset Palette
 * 
 * Inspired by OmniGraffle's Stencil Palette, tailored for Investigative Board / BoardCraft.
 * Provides pre-styled investigative entities (Suspect, Evidence, Crime Scene, Document, Timeline Event, Syndicate)
 * that can be dragged directly onto the canvas or clicked to stamp with master 40px grid alignment.
 */

const STENCIL_PRESETS = [
  {
    id: "stencil:suspect",
    category: "Persons",
    title: "Suspect",
    icon: "🕵️",
    badge: "SUSPECT",
    shape: "person",
    typeId: "pin:person",
    color: "#e06c75",
    label: "Suspect Name",
    subtitle: "Person of Interest",
    description: "Alibi unconfirmed. Primary suspect in active investigation.",
    pinScale: 1.15
  },
  {
    id: "stencil:evidence",
    category: "Physical",
    title: "Evidence",
    icon: "🩸",
    badge: "EVIDENCE",
    shape: "diamond",
    typeId: "pin:diamond",
    color: "#ff6b6b",
    label: "Evidence #01",
    subtitle: "Physical Clue",
    description: "Recovered physical evidence tagged for forensic lab analysis.",
    pinScale: 1.05
  },
  {
    id: "stencil:crime-scene",
    category: "Locations",
    title: "Crime Scene",
    icon: "📍",
    badge: "LOCATION",
    shape: "circle",
    typeId: "pin:circle",
    color: "#e5c07b",
    label: "Crime Scene",
    subtitle: "Incident Location",
    description: "Primary point of interest or crime scene location.",
    pinScale: 1.1
  },
  {
    id: "stencil:document",
    category: "Records",
    title: "Document",
    icon: "📄",
    badge: "DOSSIER",
    shape: "rectangle",
    typeId: "text:rectangle",
    color: "#98c379",
    label: "Official Record",
    subtitle: "Bank Wire / Transcript",
    description: "Subpoenaed document, transcript, or communication log.",
    width: 140,
    height: 70
  },
  {
    id: "stencil:timeline-event",
    category: "Chronology",
    title: "Timeline Event",
    icon: "⏳",
    badge: "ALIBI",
    shape: "pill",
    typeId: "pin:pill",
    color: "#61afef",
    label: "11:45 PM Incident",
    subtitle: "Alibi Timestamp",
    description: "Corroborated timestamped event along the case timeline.",
    pinScale: 1.05
  },
  {
    id: "stencil:syndicate",
    category: "Entities",
    title: "Organization",
    icon: "🏢",
    badge: "SYNDICATE",
    shape: "business-building",
    typeId: "pin:business-building",
    color: "#c678dd",
    label: "Holding Corp",
    subtitle: "Entity / Shell Co",
    description: "Suspect enterprise, shell company, or financial entity.",
    pinScale: 1.2
  },
  {
    id: "stencil:hypothesis",
    category: "Theories",
    title: "Hypothesis",
    icon: "💭",
    badge: "THEORY",
    shape: "thought",
    typeId: "text:thought",
    color: "#38bdf8",
    label: "Motive Hypothesis",
    subtitle: "Investigative Lead",
    description: "Lead hypothesis to verify or disprove through evidence.",
    width: 160,
    height: 95
  },
  {
    id: "stencil:perimeter-area",
    category: "Zones",
    title: "Search Zone",
    icon: "⭕",
    badge: "PERIMETER",
    shape: "area-circle",
    typeId: "area:circle",
    color: "#f59e0b",
    label: "Search Perimeter",
    subtitle: "Containment Area",
    description: "Geographic search radius or containment cordon.",
    radius: 120
  }
];

class StencilDock {
  constructor(appState) {
    this.appState = appState;
    this.stencils = [...STENCIL_PRESETS];
    this.isOpen = false;
    this.dockEl = null;
    this.panelEl = null;
    this.toggleBtn = null;

    // External dependencies
    this.draw = null;
    this.saveAppState = null;
    this.screenToWorld = null;
  }

  initialize(dependencies = {}) {
    if (dependencies.draw) this.draw = dependencies.draw;
    if (dependencies.saveAppState) this.saveAppState = dependencies.saveAppState;
    if (dependencies.screenToWorld) this.screenToWorld = dependencies.screenToWorld;

    if (typeof document !== 'undefined') {
      this.buildDOM();
    }
  }

  buildDOM() {
    // Check if element already exists
    let dock = document.getElementById("stencil-dock");
    if (!dock) {
      dock = document.createElement("div");
      dock.id = "stencil-dock";
      dock.className = "stencil-dock collapsed";
      dock.setAttribute("role", "toolbar");
      dock.setAttribute("aria-label", "Investigative Stencil Palette");
      document.body.appendChild(dock);
    }
    this.dockEl = dock;

    dock.innerHTML = `
      <div class="stencil-dock-panel" id="stencil-dock-panel">
        <div class="stencil-panel-header">
          <span class="stencil-panel-title">🗂️ Clue Stencils</span>
          <span class="stencil-panel-hint">Drag or click to stamp</span>
        </div>
        <div class="stencil-grid" id="stencil-grid">
          <!-- Populated dynamically -->
        </div>
      </div>
      <button class="stencil-dock-toggle" id="stencil-dock-toggle" title="Toggle Stencil Palette (Shift+S)">
        <span class="stencil-dock-icon">🗂️</span>
        <span class="stencil-dock-text">Stencils</span>
      </button>
    `;

    this.panelEl = dock.querySelector("#stencil-dock-panel");
    this.toggleBtn = dock.querySelector("#stencil-dock-toggle");

    this.toggleBtn.onclick = () => this.toggle();

    this.loadCustomStencils();
    this.renderGrid();
  }

  loadCustomStencils() {
    if (typeof localStorage !== 'undefined') {
      try {
        const saved = localStorage.getItem("artcraft_custom_stencils");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            parsed.forEach(s => {
              if (!this.stencils.some(existing => existing.id === s.id)) {
                this.stencils.push(s);
              }
            });
          }
        }
      } catch (e) {}
    }

    // Try fetching from server API if online
    if (typeof window !== 'undefined' && window.location && window.location.protocol.startsWith('http')) {
      fetch('/api/stencils')
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data && Array.isArray(data.stencils)) {
            data.stencils.forEach(s => {
              const idx = this.stencils.findIndex(existing => existing.id === s.id);
              if (idx >= 0) {
                this.stencils[idx] = s;
              } else {
                this.stencils.push(s);
              }
            });
            this.renderGrid();
          }
        })
        .catch(() => {});
    }
  }

  registerCustomStencil(stencilDef, saveToLocalStorage = true) {
    if (!stencilDef || !stencilDef.title) return null;
    const id = stencilDef.id || `stencil:${stencilDef.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
    const fullStencil = {
      id,
      category: stencilDef.category || "Custom",
      title: stencilDef.title.trim(),
      icon: stencilDef.icon || "📌",
      badge: (stencilDef.badge || stencilDef.title.toUpperCase()).slice(0, 12),
      shape: stencilDef.shape || "circle",
      typeId: stencilDef.typeId || `pin:${stencilDef.shape || "circle"}`,
      color: stencilDef.color || "#58a6ff",
      label: stencilDef.label || stencilDef.title,
      subtitle: stencilDef.subtitle || "AI Clue Preset",
      description: stencilDef.description || "Custom AI-generated investigative stencil.",
      pinScale: Number(stencilDef.pinScale) || 1.0,
      width: stencilDef.width,
      height: stencilDef.height,
      radius: stencilDef.radius,
      customFields: stencilDef.customFields || {}
    };

    const idx = this.stencils.findIndex(s => s.id === id);
    if (idx >= 0) {
      this.stencils[idx] = fullStencil;
    } else {
      this.stencils.push(fullStencil);
    }

    if (saveToLocalStorage && typeof localStorage !== 'undefined') {
      try {
        const customs = this.stencils.filter(s => !STENCIL_PRESETS.some(p => p.id === s.id));
        localStorage.setItem("artcraft_custom_stencils", JSON.stringify(customs));
      } catch (e) {}
    }

    this.renderGrid();
    return fullStencil;
  }

  removeCustomStencil(stencilId) {
    this.stencils = this.stencils.filter(s => s.id !== stencilId);
    if (typeof localStorage !== 'undefined') {
      try {
        const customs = this.stencils.filter(s => !STENCIL_PRESETS.some(p => p.id === s.id));
        localStorage.setItem("artcraft_custom_stencils", JSON.stringify(customs));
      } catch (e) {}
    }
    this.renderGrid();
  }

  renderGrid() {
    if (!this.dockEl) return;
    const grid = this.dockEl.querySelector("#stencil-grid");
    if (!grid) return;
    grid.innerHTML = "";

    this.stencils.forEach(stencil => {
      const item = document.createElement("div");
      item.className = "stencil-item";
      item.setAttribute("draggable", "true");
      item.title = `${stencil.title}: ${stencil.description}\n(Click to stamp, or drag onto canvas)`;
      item.style.setProperty("--stencil-color", stencil.color);

      item.innerHTML = `
        <div class="stencil-item-top">
          <span class="stencil-icon">${stencil.icon}</span>
          <span class="stencil-badge" style="background: ${stencil.color}22; color: ${stencil.color}; border: 1px solid ${stencil.color}44;">${stencil.badge}</span>
        </div>
        <div class="stencil-item-body">
          <div class="stencil-title">${stencil.title}</div>
          <div class="stencil-subtitle">${stencil.subtitle}</div>
        </div>
      `;

      // Drag start: attach stencil payload
      item.ondragstart = (e) => {
        const payload = JSON.stringify(stencil);
        e.dataTransfer.setData("application/x-board-stencil", payload);
        e.dataTransfer.setData("stencilData", payload);
        e.dataTransfer.setData("text/plain", `${stencil.icon} ${stencil.label}`);
        e.dataTransfer.effectAllowed = "copy";
        item.classList.add("dragging");
      };

      item.ondragend = () => {
        item.classList.remove("dragging");
      };

      // Single click: stamp onto canvas center or selection
      item.onclick = (e) => {
        e.stopPropagation();
        this.spawnStencil(stencil);
      };

      grid.appendChild(item);
    });
  }

  toggle() {
    this.isOpen = !this.isOpen;
    if (this.dockEl) {
      this.dockEl.classList.toggle("collapsed", !this.isOpen);
      if (this.toggleBtn) {
        this.toggleBtn.classList.toggle("active", this.isOpen);
      }
    }
  }

  open() {
    this.isOpen = true;
    if (this.dockEl) {
      this.dockEl.classList.remove("collapsed");
      if (this.toggleBtn) this.toggleBtn.classList.add("active");
    }
  }

  close() {
    this.isOpen = false;
    if (this.dockEl) {
      this.dockEl.classList.add("collapsed");
      if (this.toggleBtn) this.toggleBtn.classList.remove("active");
    }
  }

  /**
   * Instantiate stencil on the canvas with 40px grid alignment
   */
  spawnStencil(stencil, customPos = null) {
    if (!this.appState || !this.appState.pins) return null;

    let targetX, targetY;

    if (customPos) {
      targetX = customPos.x;
      targetY = customPos.y;
    } else {
      // Find camera center or offset from selected pin
      const selIdx = (this.appState.selectedPins?.length === 1) ? this.appState.selectedPins[0] : this.appState.selectedPinIndex;
      if (selIdx !== null && selIdx !== undefined && this.appState.pins[selIdx]) {
        const refPin = this.appState.pins[selIdx];
        targetX = refPin.x + 160;
        targetY = refPin.y;
      } else {
        // Place in center of screen / viewport
        const canvas = typeof document !== 'undefined' ? document.getElementById("canvas") : null;
        const w = canvas ? canvas.width : 1200;
        const h = canvas ? canvas.height : 800;
        const scale = this.appState.scale || 1;
        const ox = this.appState.offsetX || 0;
        const oy = this.appState.offsetY || 0;

        targetX = (w / 2 - ox) / scale;
        targetY = (h / 2 - oy) / scale;
      }
    }

    // Grid snapping (40px)
    if (typeof LayoutEngine !== 'undefined') {
      targetX = LayoutEngine.snap(targetX, 40);
      targetY = LayoutEngine.snap(targetY, 40);
    } else {
      targetX = Math.round(targetX / 40) * 40;
      targetY = Math.round(targetY / 40) * 40;
    }

    const themeTextColor = (typeof window !== 'undefined' && window._currentThemeTextColor) || "#f0f6fc";
    const pinProps = {
      x: targetX,
      y: targetY,
      color: stencil.color,
      label: stencil.label,
      title: stencil.title,
      subtitle: stencil.subtitle,
      description: stencil.description,
      note: stencil.description,
      shape: stencil.shape,
      typeId: stencil.typeId,
      status: stencil.status,
      badge: stencil.badge,
      pinScale: stencil.pinScale || 1.0,
      width: stencil.width,
      height: stencil.height,
      radius: stencil.radius,
      titleColor: themeTextColor,
      customFields: stencil.customFields ? { ...stencil.customFields } : {}
    };

    let newIndex;
    if (typeof this.appState.addPin === 'function') {
      newIndex = this.appState.addPin(targetX, targetY, pinProps);
    } else {
      this.appState.pins.push(pinProps);
      newIndex = this.appState.pins.length - 1;
    }

    // Select the newly spawned pin
    if (typeof this.appState.setSelectedPins === 'function') {
      this.appState.setSelectedPins([newIndex]);
    } else {
      this.appState.selectedPinIndex = newIndex;
    }

    if (this.appState.saveHistory) {
      this.appState.saveHistory();
    }
    if (this.saveAppState) {
      this.saveAppState(this.appState);
    }
    if (this.draw) {
      this.draw();
    }

    console.log(`🗂️ Stencil spawned: [${stencil.badge}] '${stencil.title}' at (${targetX}, ${targetY})`);
    return { index: newIndex, pin: pinProps };
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { StencilDock, STENCIL_PRESETS };
}
if (typeof window !== 'undefined') {
  window.StencilDock = StencilDock;
  window.STENCIL_PRESETS = STENCIL_PRESETS;
}
