// Main Application Module
// Handles application initialization and coordination

class Application {
  constructor() {
    this.appState = null;
    this.eventHandlers = null;
    this.modalManager = null;
    this.trayManager = null;
    this.toolbarManager = null;
    this.canvas = null;

    // Global state aliases (will be removed)
    this.scale = null;
    this.offsetX = null;
    this.offsetY = null;
    this.pins = null;
    this.connections = null;
    this.textElements = null;
    this.selectedPinIndex = null;
    this.selectedColor = null;
  }

  // Initialize the application
  async initialize() {

    // Get canvas reference
    this.canvas = document.getElementById("board");
    if (!this.canvas) {
      return;
    }

    // Initialize AppState
    this.appState = new window.AppState();

    // Load themes
    if (window.loadThemes) {
      await window.loadThemes();
    }

    // Load saved state
    const stateLoaded = window.loadAppState(this.appState);

    // Initialize default cards if no state was loaded
    if (!stateLoaded) {
      this.appState.cards = window.DEFAULT_CARDS || [];
    } else {
    }

    // Sync global variables after loading data
    this.syncGlobalVariables();

    // Create state aliases (temporary - will be removed)
    this.createStateAliases();

    // Initialize managers
    this.initializeManagers();

    // Set up canvas and rendering
    this.setupCanvas();

    // Render initial state
    this.render();

    // Apply current theme
    if (window.applyTheme && this.appState.currentThemeId) {
      window.applyTheme(this.appState.currentThemeId);
    }

    // Also render toolbar and tray
    if (this.toolbarManager) {
      this.toolbarManager.render();
    }
    if (this.trayManager) {
      this.trayManager.render();
    }

    // Set up control button handlers
    this.setupControlHandlers();

    // Initial render
    this.render();

  }

  // Create temporary state aliases for backward compatibility
  createStateAliases() {
    this.scale = this.appState.scale;
    this.offsetX = this.appState.offsetX;
    this.offsetY = this.appState.offsetY;
    this.pins = this.appState.pins;
    this.connections = this.appState.connections;
    this.textElements = this.appState.textElements;
    this.selectedPinIndex = this.appState.selectedPinIndex;
    this.selectedColor = this.appState.selectedColor;

    // Make aliases globally available for backward compatibility
    window.appScale = this.scale;
    window.appOffsetX = this.offsetX;
    window.appOffsetY = this.offsetY;
    window.appPins = this.pins;
    window.appConnections = this.connections;
    window.appTextElements = this.textElements;
    window.appSelectedPinIndex = this.selectedPinIndex;
    window.appSelectedColor = this.selectedColor;

    // Make drawing.js compatible global variables
    this.syncGlobalVariables();

    // Make coordinate transformation functions globally available for drawing.js
    window.worldToScreen = this.worldToScreen.bind(this);
    window.screenToWorld = this.screenToWorld.bind(this);

    // Make main draw function globally available
    window.draw = this.draw.bind(this);
  }

  // Initialize all managers
  initializeManagers() {
    // Initialize modal manager
    this.modalManager = new window.ModalManager(this.appState);
    this.modalManager.initialize({
      draw: () => this.render(),
      saveAppState: window.saveAppState,
      renderCards: () => this.trayManager.render()
    });

    // Initialize tray manager
    this.trayManager = new window.TrayManager(this.appState);
    this.trayManager.initialize({
      renderCards: () => this.renderTray()
    });

    // Initialize toolbar manager
    this.toolbarManager = new window.ToolbarManager(this.appState);
    this.toolbarManager.initialize({
      draw: () => this.render(),
      saveAppState: window.saveAppState,
      openAddColorModal: () => {
        // Placeholder for opening add color modal
      }
    });

    // Initialize event handlers
    console.log("Creating EventHandlers, window.EventHandlers:", typeof window.EventHandlers);
    if (!window.EventHandlers) {
      console.warn("EventHandlers not loaded yet, retrying in 100ms...");
      setTimeout(() => this.initializeManagers(), 100);
      return;
    }
    this.eventHandlers = new window.EventHandlers(this.appState, this.canvas);
    this.eventHandlers.initialize({
      draw: () => this.render(),
      saveAppState: window.saveAppState,
      screenToWorld: this.screenToWorld.bind(this),
      findPinAt: this.findPinAt.bind(this),
      setSelectedPin: this.setSelectedPin.bind(this),
      updateAreaContainment: this.updateAreaContainment.bind(this)
    });

    // Make event handlers available globally for modal access
    window.eventHandlers = this.eventHandlers;
  }

  // Set up canvas
  setupCanvas() {
    this.ctx = this.canvas.getContext("2d");
    if (!this.ctx) {
      return;
    }

    // Make canvas context globally available for drawing.js
    window.ctx = this.ctx;

    // Set canvas size
    this.resizeCanvas();

    // Handle window resize
    window.addEventListener("resize", () => this.resizeCanvas());
  }

  // Resize canvas to fill window (accounting for menu and tray)
  resizeCanvas() {
    const menuHeight = window.MENU_HEIGHT || 50;
    const trayHeight = window.TRAY_HEIGHT || 140;


    // Remove any margin since canvas-container positions it correctly
    this.canvas.style.marginTop = "0px";

    // Set canvas size to fill the container
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight - menuHeight - trayHeight;


    this.render();
  }

  // Main render function
  render() {
    // Use the complete draw function which handles coordinate transforms
    this.draw();
  }

  // Main draw function (made globally available)
  draw() {
    if (!this.canvas) {
      return;
    }

    const ctx = this.canvas.getContext("2d");
    if (!ctx) {
      return;
    }

    // Clear canvas first
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Set up coordinate system
    ctx.save();
    ctx.translate(this.appState.offsetX, this.appState.offsetY);
    ctx.scale(this.appState.scale, this.appState.scale);

    // Draw marquee selection rectangle if active (before transforms)
    if (this.marqueeStart && this.marqueeEnd) {
      ctx.save();
      // Temporarily reset transforms to draw in screen space
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      const startScreen = this.worldToScreen(this.marqueeStart.x, this.marqueeStart.y);
      const endScreen = this.worldToScreen(this.marqueeEnd.x, this.marqueeEnd.y);

      const x = Math.min(startScreen.x, endScreen.x);
      const y = Math.min(startScreen.y, endScreen.y);
      const w = Math.abs(endScreen.x - startScreen.x);
      const h = Math.abs(endScreen.y - startScreen.y);

      ctx.fillStyle = "rgba(255, 153, 0, 0.1)";
      ctx.fillRect(x, y, w, h);
      ctx.strokeStyle = "#f90";
      ctx.lineWidth = 1;
      ctx.setLineDash([5, 5]);
      ctx.strokeRect(x, y, w, h);
      ctx.setLineDash([]);
      ctx.restore();
    }

    // Draw area creation marquee if dragging
    if (window.app && window.app.eventHandlers && window.app.eventHandlers.isDraggingArea &&
        window.app.eventHandlers.areaDragStart && window.app.eventHandlers.areaDragCurrent) {
      const eh = window.app.eventHandlers;
      ctx.save();
      // Temporarily reset transforms to draw in screen space
      ctx.setTransform(1, 0, 0, 1, 0, 0);

      const startScreen = this.worldToScreen(eh.areaDragStart.x, eh.areaDragStart.y);
      const currentScreen = this.worldToScreen(eh.areaDragCurrent.x, eh.areaDragCurrent.y);

      // Calculate dimensions in screen space for proper visual scaling
      const dx = Math.abs(currentScreen.x - startScreen.x);
      const dy = Math.abs(currentScreen.y - startScreen.y);

      // Animated marquee for area creation
      const time = Date.now();
      ctx.lineDashOffset = -((time * 0.5) % 16); // Animated marching ants

      ctx.strokeStyle = "#ff0000"; // Bright red
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 8]);
      ctx.beginPath();

      // Draw different shapes based on area type
      if (this.appState.currentTypeId === "area:circle") {
        // Circular marquee
        const radius = Math.max(Math.sqrt(dx * dx + dy * dy), 10);
        ctx.arc(startScreen.x, startScreen.y, radius, 0, Math.PI * 2);
        console.log(`🎨 Circle marquee: center(${startScreen.x}, ${startScreen.y}), radius=${radius}`);
      } else {
        // Rectangular marquee - show the actual area bounds
        const halfWidth = Math.max(dx, 25);
        const halfHeight = Math.max(dy, 25);
        ctx.rect(
          startScreen.x - halfWidth,
          startScreen.y - halfHeight,
          halfWidth * 2,
          halfHeight * 2
        );
        console.log(`🎨 Rectangle marquee: center(${startScreen.x}, ${startScreen.y}), width=${halfWidth * 2}, height=${halfHeight * 2}`);
      }

      ctx.stroke();
      ctx.setLineDash([]); // Reset

      ctx.restore();
    }

    // Draw active connection preview line first (behind existing connections)
    if (this.appState.connectStartIndex !== null && this.appState.connectMousePos) {
      const startPin = this.appState.pins[this.appState.connectStartIndex];
      if (startPin) {
        ctx.save();
        ctx.strokeStyle = "#ffffff"; // White line as requested
        ctx.lineWidth = 4 / this.appState.scale; // Scale line width

        const time = Date.now();

        // Animate the line dash offset for the "moving" effect
        ctx.lineDashOffset = -((time * 0.5) % 10);

        ctx.strokeStyle = "#ffffff"; // White line
        ctx.lineWidth = 3; // Thicker line for better visibility
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(startPin.x, startPin.y);

        // Calculate distance and number of segments for the wave
        const dx = this.appState.connectMousePos.x - startPin.x;
        const dy = this.appState.connectMousePos.y - startPin.y;
        const distance = Math.hypot(dx, dy);
        const segments = Math.max(8, Math.floor(distance / (15 * this.appState.scale))); // More segments, smaller spacing

        // Wave parameters - increased magnitude for more visible effect
        const waveMagnitude = 25 * Math.sqrt(this.appState.scale); // Increased from 10 to 25
        const waveSpeed = time * 0.02; // Slowed down from 0.05 to 0.02

        console.log(`🎨 Marquee: distance=${distance.toFixed(1)}, segments=${segments}, magnitude=${waveMagnitude.toFixed(1)}, speed=${waveSpeed.toFixed(3)}`);

        for (let i = 1; i <= segments; i++) {
          const t = i / segments;
          const x = startPin.x + dx * t;
          const y = startPin.y + dy * t;

          // Apply sine wave based on time and position (ORIGINAL index2.html style)
          const wave =
            Math.sin(t * Math.PI) *
            Math.sin(t * 10 + waveSpeed) *
            waveMagnitude;

          const perpX = -dy / distance;
          const perpY = dx / distance;

          ctx.lineTo(x + perpX * wave, y + perpY * wave);
        }

        ctx.stroke();
        ctx.setLineDash([]); // Reset dash
        ctx.lineDashOffset = 0; // Reset offset
        ctx.lineWidth = 1; // Reset line width
      }
    }

    // Draw connections
    this.drawConnections(ctx);

    // Draw timeline if active
    this.drawTimeline(ctx);

    // DEBUG: Draw test markers at key locations

    // Test marker at origin (0,0) in world space
    ctx.fillStyle = "cyan";
    ctx.fillRect(-5, -5, 10, 10);
    ctx.fillText("ORIGIN", 10, 0);


    // Draw pins
    this.drawPins(ctx);

    // Draw text elements
    this.drawTextElements(ctx);

    ctx.restore();

    // Draw UI elements (not scaled)
    this.drawUI(ctx);
  }

  // Draw all connections
  drawConnections(ctx) {
    if (!this.appState.connections || !this.appState.pins) return;

    // Note: Connection preview is drawn in main draw() method with animation

    // Group connections by endpoint for fan-out calculations
    const connectionsByEndpoint = {};
    this.appState.connections.forEach((conn, idx) => {
      if (!connectionsByEndpoint[conn.startIndex]) connectionsByEndpoint[conn.startIndex] = [];
      if (!connectionsByEndpoint[conn.endIndex]) connectionsByEndpoint[conn.endIndex] = [];
      connectionsByEndpoint[conn.startIndex].push(idx);
      connectionsByEndpoint[conn.endIndex].push(idx);
    });

    this.appState.connections.forEach((connection, idx) => {
      ctx.strokeStyle = connection.color || "#666";
      ctx.lineWidth = 2 / this.appState.scale; // Scale the line width
      ctx.setLineDash([]); // Ensure solid line (not dashed)
      ctx.beginPath();

      const startPin = this.appState.pins[connection.startIndex];
      const endPin = this.appState.pins[connection.endIndex];

      if (!startPin || !endPin) return;

      // Determine connection type (use connection's type, or default to global setting)
      const connType = connection.type || this.appState.connectionType;

      if (connType === "curved") {
        // Calculate fan-out for curved connections
        // Find how many connections share the same endpoint
        const endConnections = connectionsByEndpoint[connection.endIndex] || [];
        const startConnections = connectionsByEndpoint[connection.startIndex] || [];

        // Use the endpoint with more connections for fan-out
        let fanOutCount = 1;
        let fanOutIndex = 0;
        let useStart = false;

        if (endConnections.length > startConnections.length && endConnections.length > 1) {
          fanOutCount = endConnections.length;
          fanOutIndex = endConnections.indexOf(idx);
          useStart = false;
        } else if (startConnections.length > 1) {
          fanOutCount = startConnections.length;
          fanOutIndex = startConnections.indexOf(idx);
          useStart = true;
        }

        // Calculate curve
        const dx = endPin.x - startPin.x;
        const dy = endPin.y - startPin.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > 0) {
          const midX = (startPin.x + endPin.x) / 2;
          const midY = (startPin.y + endPin.y) / 2;

          // Perpendicular vector
          const perpX = -dy / dist;
          const perpY = dx / dist;

          // Fan out curve based on connection index
          const curveAmount = 40 * this.appState.scale; // Base curve amount
          const fanOutOffset = fanOutCount > 1
            ? ((fanOutIndex - (fanOutCount - 1) / 2) / (fanOutCount - 1)) * 30 * this.appState.scale
            : 0;

          const controlX = midX + perpX * curveAmount;
          const controlY = midY + perpY * curveAmount + fanOutOffset;

          ctx.moveTo(startPin.x, startPin.y);
          ctx.quadraticCurveTo(controlX, controlY, endPin.x, endPin.y);
        } else {
          // Fallback to straight line if pins are at same position
          ctx.moveTo(startPin.x, startPin.y);
          ctx.lineTo(endPin.x, endPin.y);
        }
      } else {
        // Straight line
        ctx.moveTo(startPin.x, startPin.y);
        ctx.lineTo(endPin.x, endPin.y);
      }

      ctx.stroke();
    });
  }

  // Draw timeline if active
  drawTimeline(ctx) {
    if (!this.appState.timelineActive || !this.appState.timelinePins || this.appState.timelinePins.length < 2) return;

    // Timeline Line
    ctx.strokeStyle = "#58a6ff";
    ctx.lineWidth = 3;
    ctx.beginPath();
    const start = this.worldToScreen(this.appState.timelineLeft, this.appState.timelineY);
    const end = this.worldToScreen(this.appState.timelineRight, this.appState.timelineY);
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.stroke();

    // Pin Connectors
    ctx.strokeStyle = "#58a6ff";
    ctx.lineWidth = 1.5;
    this.appState.timelinePins.forEach((tp) => {
      const pinScreen = this.worldToScreen(tp.pin.x, tp.pin.y);
      const timelineScreen = this.worldToScreen(tp.pin.x, this.appState.timelineY);
      ctx.beginPath();
      ctx.moveTo(pinScreen.x, pinScreen.y);
      ctx.lineTo(timelineScreen.x, timelineScreen.y);
      ctx.stroke();

      // Date Labels (only draw if scale is high enough)
      if (this.appState.scale > 0.5) {
        ctx.fillStyle = "#e6edf3";
        ctx.font = `${(14 * this.appState.scale) / Math.sqrt(this.appState.scale)}px system-ui`;
        ctx.textAlign = "center";
        ctx.textBaseline = "top";
        ctx.fillText(tp.dateStr, timelineScreen.x, timelineScreen.y + 10);
      }
    });
  }

  // Draw all pins
  drawPins(ctx) {
    if (!this.appState.pins) {
      return;
    }

    this.appState.pins.forEach((pin, index) => {
      if (window.drawPinShape) {
        // Use the existing drawPinShape function from drawing.js
        const pinBase = window.PIN_BASES?.[pin.typeId] || { shape: "circle", baseRadius: 9 };

        // Use the correct shape from PIN_BASES

        // Pin shape determined from PIN_BASES lookup

        // Fallback if PIN_BASES not available
        if (!window.PIN_BASES) {
          pinBase.shape = 'circle';
        }

        const isSelected = index === this.appState.selectedPinIndex;
        // isMarquee should only be true for the pin that's the source of connection preview
        const isMarquee = isSelected && this.appState.connectionMode === 'sequential';
        const metrics = {
          x: pin.x,
          y: pin.y,
          scale: pin.pinScale || 1,
          color: pin.color,
          typeId: pin.typeId,
          shape: pinBase.shape,
          isSelected: isSelected,
          isMarquee: isMarquee
        };

        try {
          window.drawPinShape(ctx, pin, metrics, index);
        } catch (error) {
        }
      } else {
      }
    });
  }

  // Draw text elements
  drawTextElements(ctx) {
    if (!this.appState.textElements || !window.drawTextElements) return;

    // Calculate viewport bounds (world coordinates)
    const viewportLeft = -this.appState.offsetX / this.appState.scale;
    const viewportTop = -this.appState.offsetY / this.appState.scale;
    const viewportRight = viewportLeft + (this.canvas.width / this.appState.scale);
    const viewportBottom = viewportTop + (this.canvas.height / this.appState.scale);

    const margin = 100 / this.appState.scale; // Extra margin for text elements

    // Use the drawing.js text rendering function
    window.drawTextElements(viewportLeft, viewportRight, viewportTop, viewportBottom, margin);
  }

  // Draw UI elements
  drawUI(ctx) {
    // Draw selection highlights, marquee selection, etc.
  }

  // Render canvas content
  renderCanvas(ctx) {
    this.drawPins(ctx);
    this.drawConnections(ctx);
    this.drawTextElements(ctx);
  }

  // Utility methods for event handlers
  screenToWorld(sx, sy) {
    const wx = (sx - this.appState.offsetX) / this.appState.scale;
    const wy = (sy - this.appState.offsetY) / this.appState.scale;
    return { x: wx, y: wy };
  }

  worldToScreen(wx, wy) {
    const sx = wx * this.appState.scale + this.appState.offsetX;
    const sy = wy * this.appState.scale + this.appState.offsetY;
    return { x: sx, y: sy };
  }

  findPinAt(wx, wy) {
    // Find the topmost pin at the given world coordinates
    for (let i = this.appState.pins.length - 1; i >= 0; i--) {
      const pin = this.appState.pins[i];
      if (!pin) continue;

      const dx = wx - pin.x;
      const dy = wy - pin.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      // Use pin scale for hit detection
      const scale = pin.pinScale || 1;
      const baseRadius = window.PIN_BASES?.[pin.typeId]?.baseRadius || 10;
      // Make hit detection more generous (2x radius for easier clicking)
      const hitRadius = baseRadius * scale * 2;

      if (distance <= hitRadius) {
        return i;
      }
    }
    return null;
  }

  setSelectedPin(index) {
    this.appState.selectedPinIndex = index;
    this.syncGlobalVariables();
    this.updatePinInfo();
  }

  updatePinInfo() {
    // Update pin info panel
    const pinInfo = document.getElementById("pin-info");
    const pinInfoTitle = document.getElementById("pin-info-title");
    const pinInfoSub = document.getElementById("pin-info-sub");
    const pinInfoNote = document.getElementById("pin-info-note");
    const pinInfoColor = document.getElementById("pin-info-color");

    if (this.appState.selectedPinIndex !== null && this.appState.pins[this.appState.selectedPinIndex]) {
      const pin = this.appState.pins[this.appState.selectedPinIndex];
      pinInfoTitle.textContent = pin.label || "Unnamed Pin";
      pinInfoSub.textContent = pin.typeId || "";
      pinInfoNote.textContent = pin.note || "";
      pinInfoColor.style.backgroundColor = pin.color || "#58a6ff";
      pinInfo.style.display = "block";
    } else {
      pinInfo.style.display = "none";
    }
  }

  updateAreaContainment() {
    // Update which pins are contained within areas
    // This is a simplified version - the full logic would need to be implemented
  }

  // Open modal for pin editing
  openPinModal(pinIndex) {
    if (this.modalManager) {
      this.modalManager.openPinModal(pinIndex);
    }
  }

  // Sync global variables for backward compatibility
  syncGlobalVariables() {
    window.appState = this.appState;
    window.scale = this.appState.scale;
    window.offsetX = this.appState.offsetX;
    window.offsetY = this.appState.offsetY;
    window.pins = this.appState.pins;
    window.connections = this.appState.connections;
    window.textElements = this.appState.textElements;
    window.selectedPinIndex = this.appState.selectedPinIndex;
    window.selectedPins = this.appState.selectedPins;
    window.selectedColor = this.appState.selectedColor;
  }

  // Render tray
  renderTray() {
    if (this.trayManager) {
      this.trayManager.render();
    }
  }

  // Get application state
  getState() {
    return this.appState;
  }

  // Save application state
  saveState() {
    if (window.saveAppState && this.appState) {
      window.saveAppState(this.appState);
    }
  }

  // Cleanup application
  destroy() {
    if (this.eventHandlers) {
      this.eventHandlers.destroy();
    }
    // Clean up other resources
  }

  // Set up control button event handlers
  setupControlHandlers() {
    // Reset button
    const resetBtn = document.getElementById("reset");
    if (resetBtn) {
      resetBtn.onclick = () => this.resetBoard();
    }

    // Magic button (force layout toggle)
    const magicBtn = document.getElementById("magic");
    if (magicBtn) {
      magicBtn.onclick = () => {
        // TODO: Implement force layout functionality
        alert("Force layout functionality not yet implemented");
      };
    }

    // Radial button
    const radialBtn = document.getElementById("radial");
    if (radialBtn) {
      radialBtn.onclick = () => {
        // TODO: Implement radial layout functionality
        alert("Radial layout functionality not yet implemented");
      };
    }

    // Clusters button
    const clustersBtn = document.getElementById("clusters");
    if (clustersBtn) {
      clustersBtn.onclick = () => {
        // TODO: Implement clusters layout functionality
        alert("Clusters layout functionality not yet implemented");
      };
    }

    // Timeline button
    const timelineBtn = document.getElementById("timeline");
    if (timelineBtn) {
      timelineBtn.onclick = () => {
        this.layoutTimeline();
      };
    }
  }

  // Timeline layout - arrange pins chronologically
  layoutTimeline() {
    // Stop any active layout simulation
    if (this.appState.isLayoutSimulating) {
      this.appState.isLayoutSimulating = false;
    }

    // Find pins with dates
    const timedPins = this.appState.pins
      .map((pin) => {
        // Check if pin has a date, or if it has an attached card with a date
        let dateStr = pin.date || "";
        if (pin.cardId != null && this.appState.cards) {
          const card = this.appState.cards.find((c) => c.id === pin.cardId);
          if (card && card.date) {
            dateStr = card.date;
          }
        }
        return { pin, dateStr };
      })
      .filter((tp) => tp.dateStr);

    if (timedPins.length < 2) {
      alert("Need at least 2 pins with dates on the board!");
      return;
    }

    // Save history before layout
    this.saveState();

    // Parse dates and sort chronologically
    timedPins.forEach((tp) => (tp.timestamp = window.parseDate(tp.dateStr)));
    timedPins.sort((a, b) => a.timestamp - b.timestamp);
    this.appState.timelinePins = timedPins;

    const minTime = timedPins[0].timestamp;
    const maxTime = timedPins[timedPins.length - 1].timestamp;

    // Position timeline below existing pins
    const lowestY = this.appState.pins.length ? Math.max(...this.appState.pins.map((p) => p.y)) : 0;
    const footerMarginWorld = 200 / this.appState.scale;
    this.appState.timelineY = lowestY + footerMarginWorld;

    // Calculate timeline bounds
    const allXs = this.appState.pins.map((p) => p.x);
    const minX = allXs.length ? Math.min(...allXs) : 0;
    const maxX = allXs.length ? Math.max(...allXs) : 1000;
    const horizontalPaddingWorld = 150 / this.appState.scale;
    this.appState.timelineLeft = minX - horizontalPaddingWorld;
    this.appState.timelineRight = maxX + horizontalPaddingWorld;
    const worldSpan = this.appState.timelineRight - this.appState.timelineLeft || 1;

    const offsetWorld = 120 / this.appState.scale;

    // Activate timeline
    this.appState.timelineActive = true;

    // Position pins along timeline
    timedPins.forEach((tp, i) => {
      const t = (tp.timestamp - minTime) / (maxTime - minTime || 1);
      tp.pin.x = this.appState.timelineLeft + t * worldSpan;
      tp.pin.y = this.appState.timelineY + (i % 2 === 0 ? -offsetWorld : offsetWorld);
    });

    // Adjust viewport if timeline extends beyond canvas
    const footerScreenY = this.appState.timelineY * this.appState.scale + this.appState.offsetY;
    if (footerScreenY > this.canvas.height - 80) {
      this.appState.offsetY -= footerScreenY - (this.canvas.height - 80);
    }

    // Save state and redraw
    this.saveState();
    this.render();
  }


  // Reset the entire board
  resetBoard() {
    if (confirm("Are you sure you want to reset the entire board? This cannot be undone from local storage!")) {
      // Clear localStorage
      localStorage.removeItem(window.STORAGE_KEY);

      // Reset state
      this.appState.pins = [];
      this.appState.connections = [];
      this.appState.selectedPinIndex = null;
      this.appState.selectedPins = [];
      this.appState.scale = 1;
      this.appState.offsetX = 0;
      this.appState.offsetY = 0;

      // Reset timeline state
      this.appState.timelineActive = false;
      this.appState.timelinePins = [];
      this.appState.timelineY = 0;
      this.appState.timelineLeft = 0;
      this.appState.timelineRight = 0;

      // Reset cards to unused state
      if (this.appState.cards) {
        this.appState.cards.forEach(card => {
          card.used = false;
        });
      }

      // Save the reset state
      window.saveAppState(this.appState);

      // Reload the page to fully reset
      window.location.reload();
    }
  }
}

  // Export for global access
  window.Application = Application;
