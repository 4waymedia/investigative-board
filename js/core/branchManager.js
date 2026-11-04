/**
 * Branch Manager - Hover '+' Handles on Open Sides & 45° Radial Branching
 * 
 * Mechanics:
 * 1. Hover on any pin: '+' handles immediately appear on its open sides (left / right).
 * 2. Handles remain visible for 4 seconds after hover, or continuously while mouse is near.
 * 3. Clicking '+' handle: Instantly creates a connected child pin 1 grid step in that direction (e.g. Left or Right).
 * 4. Dragging '+' handle: Pulls out the branch and rotates 360° with 45° angular snapping (8 spokes).
 * 5. Releasing mouse creates child pin at snapped 40px grid position and creates connection.
 * 6. Hold-to-charge (~900ms) on pin body is also supported.
 */

class BranchManager {
  constructor(appState) {
    this.appState = appState;
    this.hoverDuration = 4000; // ms handles stay visible after hover (4 seconds)
    this.holdDuration = 900; // ms backup hold timer
    this.snapAngleDeg = 45; // Default 45° angular snapping
    this.minBranchDistance = 160; // Standard branch length (multiples of 40px)
    this.jitterThreshold = 8; // Screen px movement before canceling hold

    // State machine: 'idle' | 'charging' | 'ready' | 'branching'
    this.state = 'idle';
    this.sourcePinIndex = null;
    this.chargeStartTime = 0;
    this.chargeProgress = 0;
    this.startScreenPos = { x: 0, y: 0 };
    this.startWorldPos = { x: 0, y: 0 };
    this.currentWorldPos = { x: 0, y: 0 };
    this.activeHandle = null;
    this.branchTarget = null;
    this.animFrameId = null;
    this.startedFromHandle = false;

    // Hover handle system
    this.hoverPinIndex = null;
    this.hoverTimestamp = 0;
    this.handles = []; // Array of { id, side, pinIndex, x, y, angle, radius, defaultTarget }

    // Dependencies
    this.draw = null;
    this.saveAppState = null;
    this.setSelectedPin = null;
  }

  initialize(dependencies = {}) {
    if (dependencies.draw) this.draw = dependencies.draw;
    if (dependencies.saveAppState) this.saveAppState = dependencies.saveAppState;
    if (dependencies.setSelectedPin) this.setSelectedPin = dependencies.setSelectedPin;
  }

  isIdle() {
    return this.state === 'idle';
  }

  isCharging() {
    return this.state === 'charging';
  }

  isReady() {
    return this.state === 'ready';
  }

  isBranching() {
    return this.state === 'branching';
  }

  isActive() {
    return this.state !== 'idle';
  }

  /**
   * Helper to get effective bounding radius of a pin
   */
  getPinRadius(pin) {
    if (!pin) return 24;
    if (typeof pin.radius === 'number' && pin.radius > 0) return pin.radius;
    if (typeof pin.width === 'number' && pin.width > 0) return Math.min(pin.width, pin.height || pin.width) / 2;
    if (pin.image && pin.image.size) {
      const imgSize = parseFloat(pin.image.size);
      if (Number.isFinite(imgSize) && imgSize > 0) return imgSize / 2;
    }
    return 24;
  }

  /**
   * Determine matching distance from an opposite connected pin,
   * or fallback to consistent neighbor distance / minBranchDistance
   */
  getOppositeDistance(pinIndex, targetAngle) {
    const pin = this.appState.pins[pinIndex];
    if (!pin) return this.minBranchDistance;

    const connections = this.appState.connections || [];
    // Opposite angle is (targetAngle + PI) normalized
    const oppositeAngle = (targetAngle + Math.PI) % (Math.PI * 2);

    let bestDist = null;
    let minAngleDiff = Infinity;

    for (const conn of connections) {
      const from = conn.from !== undefined ? conn.from : conn.startIndex;
      const to = conn.to !== undefined ? conn.to : conn.endIndex;
      let otherIndex = null;
      if (from === pinIndex) otherIndex = to;
      else if (to === pinIndex) otherIndex = from;

      if (otherIndex !== null && this.appState.pins[otherIndex]) {
        const other = this.appState.pins[otherIndex];
        const dx = other.x - pin.x;
        const dy = other.y - pin.y;
        const dist = Math.hypot(dx, dy);
        const connAngle = Math.atan2(dy, dx);

        // Normalize difference between connAngle and oppositeAngle to [-PI, PI]
        let diff = Math.atan2(Math.sin(connAngle - oppositeAngle), Math.cos(connAngle - oppositeAngle));
        diff = Math.abs(diff);

        // Consider opposite if within 60 degrees (broad opposite sector)
        if (diff <= Math.PI / 3 && diff < minAngleDiff) {
          minAngleDiff = diff;
          bestDist = dist;
        }
      }
    }

    if (bestDist !== null) {
      const snapped = Math.round(bestDist / 40) * 40;
      return Math.max(80, snapped);
    }

    // Fallback: If no opposite pin, match any connected neighbor distance (min 80px)
    let anyDist = null;
    let minConnDist = Infinity;
    for (const conn of connections) {
      const from = conn.from !== undefined ? conn.from : conn.startIndex;
      const to = conn.to !== undefined ? conn.to : conn.endIndex;
      let otherIndex = null;
      if (from === pinIndex) otherIndex = to;
      else if (to === pinIndex) otherIndex = from;

      if (otherIndex !== null && this.appState.pins[otherIndex]) {
        const other = this.appState.pins[otherIndex];
        const dist = Math.hypot(other.x - pin.x, other.y - pin.y);
        if (dist >= 60 && dist < minConnDist) {
          minConnDist = dist;
          anyDist = dist;
        }
      }
    }

    if (anyDist !== null) {
      const snapped = Math.round(anyDist / 40) * 40;
      return Math.max(80, snapped);
    }

    return this.minBranchDistance; // 160px
  }

  /**
   * Analyze existing connections to find which sides of a pin are open
   */
  getOpenSides(pinIndex) {
    const pin = this.appState.pins[pinIndex];
    if (!pin) return { left: true, right: true, top: true, bottom: true };

    const connections = this.appState.connections || [];
    let hasLeft = false;
    let hasRight = false;
    let hasTop = false;
    let hasBottom = false;

    connections.forEach(conn => {
      const from = conn.from !== undefined ? conn.from : conn.startIndex;
      const to = conn.to !== undefined ? conn.to : conn.endIndex;
      let otherIndex = null;
      if (from === pinIndex) otherIndex = to;
      else if (to === pinIndex) otherIndex = from;

      if (otherIndex !== null && this.appState.pins[otherIndex]) {
        const other = this.appState.pins[otherIndex];
        const dx = other.x - pin.x;
        const dy = other.y - pin.y;
        const angle = Math.atan2(dy, dx);
        const deg = (angle * 180 / Math.PI + 360) % 360;

        if (deg >= 330 || deg <= 30) hasRight = true;
        else if (deg >= 150 && deg <= 210) hasLeft = true;
        else if (deg >= 60 && deg <= 120) hasBottom = true;
        else if (deg >= 240 && deg <= 300) hasTop = true;
      }
    });

    // If both left and right happen to be connected, still keep both available for branching
    if (hasLeft && hasRight) {
      return { left: true, right: true, top: !hasTop, bottom: !hasBottom };
    }

    return {
      right: !hasRight,
      left: !hasLeft,
      top: !hasTop,
      bottom: !hasBottom
    };
  }

  /**
   * Show '+' handles on open sides when hovering over a pin (visible for 4s)
   */
  showHoverHandles(pinIndex, worldPos = null) {
    if (this.state === 'branching') return;
    if (!this.appState?.pins?.[pinIndex]) return;

    const pin = this.appState.pins[pinIndex];
    const radius = this.getPinRadius(pin);
    const openSides = this.getOpenSides(pinIndex);

    this.hoverPinIndex = pinIndex;
    this.hoverTimestamp = Date.now();

    const dist = radius + 15;
    const newHandles = [];

    // Right Handle (0° / East)
    if (openSides.right) {
      const rightDist = this.getOppositeDistance(pinIndex, 0);
      let targetX = pin.x + rightDist;
      let targetY = pin.y;
      if (typeof LayoutEngine !== 'undefined') {
        targetX = LayoutEngine.snap(targetX, 40);
        targetY = LayoutEngine.snap(targetY, 40);
      } else {
        targetX = Math.round(targetX / 40) * 40;
        targetY = Math.round(targetY / 40) * 40;
      }
      newHandles.push({
        id: `pin_${pinIndex}_right`,
        side: 'right',
        pinIndex: pinIndex,
        x: pin.x + dist,
        y: pin.y,
        angle: 0,
        radius: 13,
        defaultTarget: { x: targetX, y: targetY, rawAngle: 0, snappedAngle: 0, snappedDegrees: 0, distance: rightDist, matchedOpposite: true }
      });
    }

    // Left Handle (180° / West)
    if (openSides.left) {
      const leftDist = this.getOppositeDistance(pinIndex, Math.PI);
      let targetX = pin.x - leftDist;
      let targetY = pin.y;
      if (typeof LayoutEngine !== 'undefined') {
        targetX = LayoutEngine.snap(targetX, 40);
        targetY = LayoutEngine.snap(targetY, 40);
      } else {
        targetX = Math.round(targetX / 40) * 40;
        targetY = Math.round(targetY / 40) * 40;
      }
      newHandles.push({
        id: `pin_${pinIndex}_left`,
        side: 'left',
        pinIndex: pinIndex,
        x: pin.x - dist,
        y: pin.y,
        angle: Math.PI,
        radius: 13,
        defaultTarget: { x: targetX, y: targetY, rawAngle: Math.PI, snappedAngle: Math.PI, snappedDegrees: 180, distance: leftDist, matchedOpposite: true }
      });
    }

    this.handles = newHandles;
    this.startAnimLoop();
    if (this.draw) this.draw();
  }

  /**
   * Keep hover alive if cursor is near handles or pin
   */
  updateHover(worldPos) {
    if (this.hoverPinIndex === null || this.state === 'branching') return;

    const pin = this.appState.pins[this.hoverPinIndex];
    if (!pin) {
      this.clearHover();
      return;
    }

    // Check if mouse is near pin or any handle
    const radius = this.getPinRadius(pin);
    const distFromPin = Math.hypot(worldPos.x - pin.x, worldPos.y - pin.y);
    const nearPin = distFromPin < radius + 40;
    const nearHandle = this.handles.some(h => Math.hypot(worldPos.x - h.x, worldPos.y - h.y) < 25);

    if (nearPin || nearHandle) {
      // Refresh 4s timer while user is hovering near the pin/handles
      this.hoverTimestamp = Date.now();
    } else {
      // Check if 4 seconds expired
      if (Date.now() - this.hoverTimestamp > this.hoverDuration) {
        this.clearHover();
      }
    }
  }

  clearHover() {
    this.hoverPinIndex = null;
    this.hoverTimestamp = 0;
    this.handles = [];
    if (this.draw) this.draw();
  }

  /**
   * Hit-test any active '+' handle
   */
  hitTestHandle(worldX, worldY) {
    // Check hover handles first
    for (const handle of this.handles) {
      const d = Math.hypot(worldX - handle.x, worldY - handle.y);
      if (d <= handle.radius + 6) {
        return { pinIndex: handle.pinIndex, handle };
      }
    }

    // Check fallback handle if in ready state
    if (this.activeHandle) {
      const d = Math.hypot(worldX - this.activeHandle.x, worldY - this.activeHandle.y);
      if (d <= (this.activeHandle.radius || 13) + 6) {
        return { pinIndex: this.sourcePinIndex, handle: this.activeHandle };
      }
    }

    return false;
  }

  /**
   * Start branch dragging immediately from a '+' handle
   */
  startFromHandle(handle, worldPos) {
    const pinIndex = handle.pinIndex;
    if (!this.appState?.pins?.[pinIndex]) return false;

    this.state = 'ready';
    this.sourcePinIndex = pinIndex;
    this.activeHandle = handle;
    this.startedFromHandle = true;
    this.chargeProgress = 1.0;
    this.startScreenPos = { x: 0, y: 0 };
    this.startWorldPos = { x: worldPos.x, y: worldPos.y };
    this.currentWorldPos = { x: worldPos.x, y: worldPos.y };
    this.branchTarget = handle.defaultTarget || null;

    this.startAnimLoop();
    if (this.draw) this.draw();
    return true;
  }

  /**
   * Activate branch mode directly on a pin (radial menu / 'B' hotkey)
   */
  activateForPin(pinIndex) {
    if (!this.appState?.pins?.[pinIndex]) return false;
    this.showHoverHandles(pinIndex);
    const rightHandle = this.handles.find(h => h.side === 'right') || this.handles[0];
    if (rightHandle) {
      return this.startFromHandle(rightHandle, { x: rightHandle.x, y: rightHandle.y });
    }
    return false;
  }

  /**
   * Initiate hold timer on mouse down (backup game-style mechanic)
   */
  startHold(pinIndex, screenX, screenY, worldPos) {
    if (!this.appState?.pins?.[pinIndex]) return false;

    this.state = 'charging';
    this.sourcePinIndex = pinIndex;
    this.chargeStartTime = Date.now();
    this.chargeProgress = 0;
    this.startScreenPos = { x: screenX, y: screenY };
    this.currentWorldPos = { x: worldPos.x, y: worldPos.y };
    this.branchTarget = null;
    this.startedFromHandle = false;

    this.startAnimLoop();
    return true;
  }

  /**
   * Handle mouse move during hold / ready / branching
   */
  updateMove(screenX, screenY, worldPos) {
    if (this.state === 'idle') return false;

    this.currentWorldPos = { x: worldPos.x, y: worldPos.y };
    const pin = this.appState.pins[this.sourcePinIndex];
    if (!pin) {
      this.cancel();
      return false;
    }

    // 1. CHARGING STATE: Jitter detection
    if (this.state === 'charging') {
      const screenDist = Math.hypot(screenX - this.startScreenPos.x, screenY - this.startScreenPos.y);
      if (screenDist > this.jitterThreshold) {
        this.cancel();
        return false;
      }

      const elapsed = Date.now() - this.chargeStartTime;
      this.chargeProgress = Math.min(1.0, elapsed / this.holdDuration);
      if (this.chargeProgress >= 1.0) {
        this.state = 'ready';
        this.showHoverHandles(this.sourcePinIndex, worldPos);
        if (this.draw) this.draw();
      }
      return true;
    }

    // 2. READY STATE: Small drag movement transitions to active 45° branching
    if (this.state === 'ready') {
      const dragDist = this.startWorldPos
        ? Math.hypot(worldPos.x - this.startWorldPos.x, worldPos.y - this.startWorldPos.y)
        : Math.hypot(worldPos.x - pin.x, worldPos.y - pin.y);

      if (dragDist > 4) {
        this.state = 'branching';
        this.computeBranchTarget(worldPos);
      }
      if (this.draw) this.draw();
      return true;
    }

    // 3. BRANCHING STATE: 45° angular and opposite-distance snapping
    if (this.state === 'branching') {
      this.computeBranchTarget(worldPos);
      if (this.draw) this.draw();
      return true;
    }

    return false;
  }

  /**
   * Compute 45° snapped branch ray and grid-aligned target coordinates
   */
  computeBranchTarget(worldPos) {
    const pin = this.appState.pins[this.sourcePinIndex];
    if (!pin) return;

    const dx = worldPos.x - pin.x;
    const dy = worldPos.y - pin.y;
    const rawDist = Math.hypot(dx, dy);
    const rawAngle = Math.atan2(dy, dx);

    const stepRad = (this.snapAngleDeg * Math.PI) / 180;
    const snappedAngle = Math.round(rawAngle / stepRad) * stepRad;

    let deg = Math.round((snappedAngle * 180) / Math.PI);
    deg = ((deg % 360) + 360) % 360;

    // Opposite distance matching
    const oppDist = this.getOppositeDistance(this.sourcePinIndex, snappedAngle);

    let dist;
    // Magnetic snap to opposite distance if within 35px, or if user hasn't pulled beyond oppDist
    if (Math.abs(rawDist - oppDist) <= 35 || rawDist <= oppDist) {
      dist = oppDist;
    } else {
      dist = Math.max(oppDist, Math.round(rawDist / 40) * 40);
    }

    let targetX = pin.x + dist * Math.cos(snappedAngle);
    let targetY = pin.y + dist * Math.sin(snappedAngle);

    if (typeof LayoutEngine !== 'undefined') {
      targetX = LayoutEngine.snap(targetX, 40);
      targetY = LayoutEngine.snap(targetY, 40);
    } else {
      targetX = Math.round(targetX / 40) * 40;
      targetY = Math.round(targetY / 40) * 40;
    }

    this.branchTarget = {
      x: targetX,
      y: targetY,
      rawAngle,
      snappedAngle,
      snappedDegrees: deg,
      distance: dist,
      matchedOpposite: (dist === oppDist)
    };
  }

  /**
   * Handle mouse release
   */
  handleMouseUp() {
    if (this.state === 'idle') {
      return { handled: false, action: null };
    }

    // Case 1: Clicked '+' handle directly without dragging
    if (this.state === 'ready' && this.startedFromHandle && this.branchTarget) {
      // Proceed to create child pin using default target
    } else if (this.state === 'ready') {
      // Released without dragging: cancel safely (nothing happens)
      console.log("🌿 BranchManager: Released while ready — cancelled (no branch created)");
      this.cancel();
      return { handled: true, action: 'cancel' };
    }

    // Case 2: Create the branch (dragged out or clicked '+' handle)
    if ((this.state === 'branching' || this.state === 'ready') && this.branchTarget) {
      const pin = this.appState.pins[this.sourcePinIndex];
      if (!pin) {
        this.cancel();
        return { handled: true, action: 'cancel' };
      }

      console.log(`🌿 BranchManager: Spawning child pin at ${this.branchTarget.snappedDegrees}° (${this.branchTarget.x}, ${this.branchTarget.y})`);

      const newPinProps = {
        color: pin.color || this.appState.selectedColor || "#58a6ff",
        typeId: (pin.typeId && !pin.typeId.startsWith('area:') && !pin.typeId.startsWith('text:')) ? pin.typeId : "pin:circle",
        label: "",
        title: "",
        description: "",
        pinScale: 1.0
      };

      const newIndex = this.appState.addPin(this.branchTarget.x, this.branchTarget.y, newPinProps);

      this.appState.addConnection(this.sourcePinIndex, newIndex, {
        color: pin.color || this.appState.selectedColor || "#58a6ff",
        type: this.appState.connectionType || "straight"
      });

      this.appState.saveHistory();
      if (this.saveAppState) {
        this.saveAppState(this.appState);
      }

      if (typeof window !== 'undefined' && typeof window.updatePinScales === 'function') {
        window.updatePinScales(this.appState.pins, this.appState.connections);
      }
      if (this.setSelectedPin) {
        this.setSelectedPin(newIndex);
      } else {
        this.appState.selectedPinIndex = newIndex;
      }

      const createdTarget = { ...this.branchTarget, childIndex: newIndex, parentIndex: this.sourcePinIndex };
      this.cancel();
      return { handled: true, action: 'branch', result: createdTarget };
    }

    this.cancel();
    return { handled: false, action: 'cancel' };
  }

  cancel() {
    this.stopAnimLoop();
    this.state = 'idle';
    this.sourcePinIndex = null;
    this.chargeStartTime = 0;
    this.chargeProgress = 0;
    this.branchTarget = null;
    this.startedFromHandle = false;
    this.activeHandle = null;
    this.clearHover();
    if (this.draw) this.draw();
  }

  startAnimLoop() {
    this.stopAnimLoop();
    if (typeof requestAnimationFrame === 'undefined') return;

    const tick = () => {
      if (this.state === 'charging') {
        const elapsed = Date.now() - this.chargeStartTime;
        this.chargeProgress = Math.min(1.0, elapsed / this.holdDuration);
        if (this.chargeProgress >= 1.0) {
          this.state = 'ready';
          this.showHoverHandles(this.sourcePinIndex);
        }
        if (this.draw) this.draw();
        this.animFrameId = requestAnimationFrame(tick);
      } else if (this.state === 'ready' || this.handles.length > 0) {
        // Check 4-second hover expiration
        if (this.state === 'idle' && this.hoverTimestamp > 0 && Date.now() - this.hoverTimestamp > this.hoverDuration) {
          this.clearHover();
        } else {
          if (this.draw) this.draw();
          this.animFrameId = requestAnimationFrame(tick);
        }
      } else {
        this.stopAnimLoop();
      }
    };
    this.animFrameId = requestAnimationFrame(tick);
  }

  stopAnimLoop() {
    if (this.animFrameId) {
      if (typeof cancelAnimationFrame !== 'undefined') {
        cancelAnimationFrame(this.animFrameId);
      }
      this.animFrameId = null;
    }
  }

  /**
   * Render World-Space Branch Elements
   */
  drawWorld(ctx, appState) {
    const theme = (typeof window !== 'undefined' && window.themeManager?.getCurrentTheme) ? window.themeManager.getCurrentTheme() : {};
    const accentColor = theme.accentColor || '#38bdf8';
    const now = Date.now();

    // ─────────────────────────────────────────────────────────────
    // 0. HOVER '+' HANDLES (Visible for 4s on open sides)
    // ─────────────────────────────────────────────────────────────
    if (this.state !== 'branching' && this.handles.length > 0 && this.hoverTimestamp > 0) {
      const elapsed = now - this.hoverTimestamp;
      if (elapsed < this.hoverDuration) {
        // Fade out smoothly during the last 600ms
        const fadeStart = this.hoverDuration - 600;
        const opacity = elapsed > fadeStart ? Math.max(0, 1 - (elapsed - fadeStart) / 600) : 1.0;
        const pulse = 1.0 + 0.08 * Math.sin(now * 0.007);

        ctx.save();
        ctx.globalAlpha = opacity;

        this.handles.forEach(h => {
          const hr = h.radius * pulse;

          // Outer glowing ring
          ctx.beginPath();
          ctx.arc(h.x, h.y, hr + 4, 0, Math.PI * 2);
          ctx.fillStyle = "rgba(56, 189, 248, 0.22)";
          ctx.fill();

          // Button circle
          ctx.beginPath();
          ctx.arc(h.x, h.y, hr, 0, Math.PI * 2);
          ctx.fillStyle = "#0284c7";
          ctx.strokeStyle = "#ffffff";
          ctx.lineWidth = 2;
          ctx.shadowColor = "rgba(0, 0, 0, 0.4)";
          ctx.shadowBlur = 5;
          ctx.fill();
          ctx.stroke();

          // '+' icon inside
          ctx.beginPath();
          ctx.moveTo(h.x - 5, h.y); ctx.lineTo(h.x + 5, h.y);
          ctx.moveTo(h.x, h.y - 5); ctx.lineTo(h.x, h.y + 5);
          ctx.strokeStyle = "#ffffff";
          ctx.lineWidth = 2.2;
          ctx.lineCap = "round";
          ctx.stroke();
        });

        ctx.restore();
      }
    }

    // ─────────────────────────────────────────────────────────────
    // 1. CHARGING STATE (Backup hold mechanic)
    // ─────────────────────────────────────────────────────────────
    if (this.state === 'charging' && this.sourcePinIndex !== null) {
      const pin = appState.pins[this.sourcePinIndex];
      if (pin) {
        const radius = this.getPinRadius(pin);
        const ringRadius = radius + 12;
        const startAngle = -Math.PI / 2;
        const endAngle = startAngle + (this.chargeProgress * Math.PI * 2);

        ctx.save();
        ctx.beginPath();
        ctx.arc(pin.x, pin.y, ringRadius, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(56, 189, 248, 0.2)";
        ctx.lineWidth = 3;
        ctx.stroke();

        if (this.chargeProgress > 0) {
          ctx.beginPath();
          ctx.arc(pin.x, pin.y, ringRadius, startAngle, endAngle);
          ctx.strokeStyle = accentColor;
          ctx.lineWidth = 3.5;
          ctx.lineCap = "round";
          ctx.shadowColor = accentColor;
          ctx.shadowBlur = 8;
          ctx.stroke();

          const tipX = pin.x + ringRadius * Math.cos(endAngle);
          const tipY = pin.y + ringRadius * Math.sin(endAngle);
          ctx.beginPath();
          ctx.arc(tipX, tipY, 4, 0, Math.PI * 2);
          ctx.fillStyle = "#ffffff";
          ctx.fill();
        }
        ctx.restore();
      }
    }

    // ─────────────────────────────────────────────────────────────
    // 2. BRANCHING STATE: 8-Spoke Reticle + Snapped Preview + Ghost Pin
    // ─────────────────────────────────────────────────────────────
    if (this.state === 'branching' && this.branchTarget && this.sourcePinIndex !== null) {
      const pin = appState.pins[this.sourcePinIndex];
      if (!pin) return;

      const radius = this.getPinRadius(pin);
      ctx.save();

      const reticleDist = Math.max(260, this.branchTarget.distance + 40);
      const stepRad = (this.snapAngleDeg * Math.PI) / 180;

      // Draw 8-direction radial compass spokes
      ctx.setLineDash([4, 6]);
      ctx.lineWidth = 1;

      for (let i = 0; i < 8; i++) {
        const spokeAngle = i * stepRad;
        const isCurrentSpoke = Math.abs(spokeAngle - this.branchTarget.snappedAngle) < 0.05 ||
                              Math.abs(spokeAngle - (this.branchTarget.snappedAngle + Math.PI * 2)) < 0.05;

        ctx.strokeStyle = isCurrentSpoke ? "rgba(56, 189, 248, 0.65)" : "rgba(255, 255, 255, 0.15)";
        ctx.beginPath();
        ctx.moveTo(pin.x + (radius + 10) * Math.cos(spokeAngle), pin.y + (radius + 10) * Math.sin(spokeAngle));
        ctx.lineTo(pin.x + reticleDist * Math.cos(spokeAngle), pin.y + reticleDist * Math.sin(spokeAngle));
        ctx.stroke();
      }

      // Snapped preview connector line
      ctx.setLineDash([6, 6]);
      ctx.lineDashOffset = -((now * 0.03) % 12);
      ctx.strokeStyle = accentColor;
      ctx.lineWidth = 3;
      ctx.shadowColor = accentColor;
      ctx.shadowBlur = 10;

      ctx.beginPath();
      ctx.moveTo(pin.x, pin.y);
      ctx.lineTo(this.branchTarget.x, this.branchTarget.y);
      ctx.stroke();

      // Ghost child pin at snapped target
      ctx.shadowBlur = 0;
      ctx.setLineDash([]);

      ctx.beginPath();
      ctx.arc(this.branchTarget.x, this.branchTarget.y, 22, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(2, 132, 199, 0.3)";
      ctx.fill();
      ctx.strokeStyle = accentColor;
      ctx.lineWidth = 2.5;
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(this.branchTarget.x - 6, this.branchTarget.y);
      ctx.lineTo(this.branchTarget.x + 6, this.branchTarget.y);
      ctx.moveTo(this.branchTarget.x, this.branchTarget.y - 6);
      ctx.lineTo(this.branchTarget.x, this.branchTarget.y + 6);
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 2;
      ctx.lineCap = "round";
      ctx.stroke();

      // Direction & Distance Badge (e.g. "0° • 160px" or "180° • 200px ↔")
      const symIcon = this.branchTarget.matchedOpposite ? " ↔" : "";
      const degText = `${this.branchTarget.snappedDegrees}° • ${this.branchTarget.distance}px${symIcon}`;
      ctx.font = "bold 11px -apple-system, BlinkMacSystemFont, sans-serif";
      const badgeW = ctx.measureText(degText).width + 12;
      const badgeH = 18;
      const badgeX = this.branchTarget.x - badgeW / 2;
      const badgeY = this.branchTarget.y + 30;

      ctx.fillStyle = "rgba(15, 23, 42, 0.85)";
      ctx.strokeStyle = this.branchTarget.matchedOpposite ? "#38bdf8" : accentColor;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 4);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = "#ffffff";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(degText, this.branchTarget.x, badgeY + badgeH / 2);

      ctx.restore();
    }
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { BranchManager };
}
if (typeof window !== 'undefined') {
  window.BranchManager = BranchManager;
}
