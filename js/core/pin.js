/**
 * Investigative Board - Pin Class & Entity Model
 * Optimized and extensible domain class for all canvas nodes, clue presets, and investigative archetypes.
 * Compatible with Browser and Node.js environments.
 */

class Pin {
  /**
   * Create a new Pin instance
   * @param {Object} config - Initial pin properties
   */
  constructor(config = {}) {
    // 1. Identity & Reference
    this.id = config.id !== undefined && config.id !== null ? config.id : Pin.generateId();
    this.stencilId = config.stencilId || null;

    // 2. Spatial Coordinates (World Space)
    this.x = Number(config.x) || 0;
    this.y = Number(config.y) || 0;
    this.pinScale = Number(config.pinScale) || 1.0;
    this.locked = Boolean(config.locked);

    // 3. Shape & Geometry
    this.shape = config.shape || "circle";
    this.typeId = config.typeId || (this.shape.startsWith("pin:") || this.shape.startsWith("text:") || this.shape.startsWith("area:")
      ? this.shape
      : `pin:${this.shape}`);
    this.width = config.width !== undefined && config.width !== null ? Number(config.width) : null;
    this.height = config.height !== undefined && config.height !== null ? Number(config.height) : null;
    this.radius = config.radius !== undefined && config.radius !== null ? Number(config.radius) : null;
    this.hideShape = Boolean(config.hideShape);

    // 4. Color & Theme Palette Slots
    this.colorSlot = config.colorSlot || "c2";
    this.color = config.color || "#58a6ff";
    this.textColor = config.textColor || null;
    this.titleColor = config.titleColor || null;
    this.borderColor = config.borderColor || null;
    this.borderWidth = config.borderWidth !== undefined ? Number(config.borderWidth) : null;
    this.dropShadow = Boolean(config.dropShadow);

    // 5. Content & Semantic Labels (with bidirectional title/label aliasing)
    const primaryLabel = config.label !== undefined ? config.label : (config.title || "");
    this.label = primaryLabel;
    this.title = primaryLabel; // Mirror for legacy API compatibility
    this.subtitle = config.subtitle || "";
    this.description = config.description || "";
    this.note = config.note || config.description || "";
    this.badge = config.badge ? String(config.badge).toUpperCase() : null;

    // 6. Chronology & Investigation State
    this.date = config.date || "";
    this.status = config.status || "unverified"; // 'unverified' | 'corroborated' | 'debunked' | 'cold' | 'critical'

    // 7. Media & Inset Image Configuration
    this.image = config.image ? Pin.normalizeImageConfig(config.image, this.shape) : null;

    // 8. Custom Metadata Schema
    this.customFields = { ...(config.customFields || config.metadata || {}) };
    this.metadata = this.customFields; // Bi-directional alias
  }

  // ==========================================================================
  // STATIC UTILITIES & FACTORIES
  // ==========================================================================

  static generateId() {
    return 'pin_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
  }

  /**
   * Normalizes image configuration and assigns smart layer default (inset for bubbles/cards)
   */
  static normalizeImageConfig(img, shape = "circle") {
    if (!img) return null;
    if (typeof img === 'string') {
      img = { dataUrl: img };
    }

    const isContainer = ["thought", "bubble", "rectangle", "card", "doc", "folder"].includes(shape);
    const defaultLayer = isContainer ? "inset" : "behind";

    return {
      dataUrl: img.dataUrl || img.url || "",
      style: img.style || "circular", // 'circular' | 'oval' | 'portrait' | 'landscape'
      position: img.position || "center", // 'center' | 'top' | 'bottom' | 'left' | 'right'
      size: Number(img.size) || 100,
      layer: img.layer || img.mode || defaultLayer, // 'inset' (inside bubble) | 'behind' (backdrop/dropshadow)
      originalFileName: img.originalFileName || "image.png",
      uploadedAt: img.uploadedAt || Date.now()
    };
  }

  /**
   * Safe instantiation from raw object, JSON, or existing Pin
   */
  static from(data) {
    if (!data) return new Pin();
    if (data instanceof Pin) return data.clone();
    return new Pin(data);
  }

  // --- Specialized Archetype Factories for Diverse Use Cases ---

  /**
   * Suspect / Person of Interest / Key Figure
   */
  static createEntity({ label = "Suspect Name", subtitle = "Person of Interest", color = "#e06c75", badge = "SUSPECT", ...rest } = {}) {
    return new Pin({
      shape: "person",
      typeId: "pin:person",
      colorSlot: "c1",
      color,
      label,
      subtitle,
      badge,
      pinScale: 1.15,
      ...rest
    });
  }

  /**
   * Physical / Forensic / Ballistics Evidence
   */
  static createEvidence({ label = "Evidence #01", subtitle = "Physical Clue", color = "#ff6b6b", badge = "EVIDENCE", ...rest } = {}) {
    return new Pin({
      shape: "diamond",
      typeId: "pin:diamond",
      colorSlot: "c1",
      color,
      label,
      subtitle,
      badge,
      pinScale: 1.05,
      ...rest
    });
  }

  /**
   * Motive / Theory / Analytical Speech / Thought Bubble (with Inset Media)
   */
  static createHypothesis({ label = "Motive Hypothesis", description = "Lead hypothesis", color = "#38bdf8", badge = "THEORY", image = null, ...rest } = {}) {
    const pin = new Pin({
      shape: "thought",
      typeId: "text:thought",
      colorSlot: "c8",
      color,
      label,
      description,
      badge,
      width: 160,
      height: 95,
      ...rest
    });
    if (image) {
      pin.setImage(image.dataUrl || image, { layer: "inset", ...image });
    }
    return pin;
  }

  /**
   * Official Record / Dossier / Document Scan
   */
  static createDocument({ label = "Official Record", subtitle = "Subpoenaed Record", color = "#98c379", badge = "DOSSIER", ...rest } = {}) {
    return new Pin({
      shape: "rectangle",
      typeId: "text:rectangle",
      colorSlot: "c3",
      color,
      label,
      subtitle,
      badge,
      width: 140,
      height: 70,
      ...rest
    });
  }

  /**
   * Chronological Timeline Event / Corroborated Timestamp
   */
  static createTimelineEvent({ label = "Incident Event", date = "", subtitle = "Timestamp", color = "#61afef", badge = "ALIBI", ...rest } = {}) {
    return new Pin({
      shape: "pill",
      typeId: "pin:pill",
      colorSlot: "c2",
      color,
      label,
      date,
      subtitle,
      badge,
      pinScale: 1.05,
      ...rest
    });
  }

  /**
   * Search Zone / Perimeter / Geographic Cordon
   */
  static createPerimeter({ label = "Search Zone", radius = 120, color = "#f59e0b", badge = "PERIMETER", ...rest } = {}) {
    return new Pin({
      shape: "area-circle",
      typeId: "area:circle",
      colorSlot: "c4",
      color,
      label,
      radius,
      badge,
      ...rest
    });
  }

  // --- Data-Flow & System Architecture Archetypes ---

  /**
   * Service / Process / Microservice Component
   */
  static createService({ label = "Service", subtitle = "Process / Microservice", color = "#3b82f6", badge = "SERVICE", width = 140, height = 75, ...rest } = {}) {
    return new Pin({
      shape: "service",
      typeId: "flow:service",
      colorSlot: "c6",
      color,
      label,
      subtitle,
      badge,
      width,
      height,
      ...rest
    });
  }

  /**
   * Database / Storage / Data Store
   */
  static createDatabase({ label = "Database", subtitle = "Primary Store", color = "#10b981", badge = "DATABASE", width = 110, height = 85, ...rest } = {}) {
    return new Pin({
      shape: "database",
      typeId: "flow:database",
      colorSlot: "c2",
      color,
      label,
      subtitle,
      badge,
      width,
      height,
      ...rest
    });
  }

  /**
   * Write-Ahead Log / Message Queue / Event Stream
   */
  static createQueue({ label = "Write-Ahead Log", subtitle = "WAL / Append-Only", color = "#f59e0b", badge = "QUEUE", slots = 5, width = 180, height = 65, ...rest } = {}) {
    return new Pin({
      shape: "wal-queue",
      typeId: "flow:queue",
      colorSlot: "c4",
      color,
      label,
      subtitle,
      badge,
      width,
      height,
      customFields: { slots, ...(rest.customFields || {}) },
      ...rest
    });
  }

  /**
   * Group Boundary / Scope Container / Swimlane
   */
  static createFlowContainer({ label = "ON THE WRITE PATH", subtitle = "Scope Boundary", color = "#8b5cf6", badge = "SCOPE", width = 320, height = 200, ...rest } = {}) {
    return new Pin({
      shape: "flow-container",
      typeId: "flow:container",
      colorSlot: "c5",
      color,
      label,
      subtitle,
      badge,
      width,
      height,
      ...rest
    });
  }

  /**
   * Flow Status Callout / Verification Pill
   */
  static createCallout({ label = "Client Acked", status = "success", color = "#22c55e", badge = "ACK", width = 130, height = 44, ...rest } = {}) {
    return new Pin({
      shape: "flow-callout",
      typeId: "flow:callout",
      colorSlot: "c2",
      color,
      label,
      badge,
      width,
      height,
      customFields: { status, ...(rest.customFields || {}) },
      ...rest
    });
  }

  // ==========================================================================
  // INSTANCE METHODS
  // ==========================================================================

  /**
   * Check if image is configured to render inset into the bubble/shape
   */
  isImageInset() {
    if (!this.image || !this.image.dataUrl) return false;
    if (this.image.layer === "inset") return true;
    if (this.image.layer === "behind") return false;
    // Default: containers are inset
    return ["thought", "bubble", "rectangle", "card", "doc", "folder", "service", "wal-queue", "flow-container"].includes(this.shape);
  }

  /**
   * Attach or update an image on this pin
   */
  setImage(dataUrlOrConfig, options = {}) {
    if (!dataUrlOrConfig) {
      this.image = null;
      return;
    }
    const base = typeof dataUrlOrConfig === 'string'
      ? { dataUrl: dataUrlOrConfig, ...options }
      : { ...dataUrlOrConfig, ...options };
    this.image = Pin.normalizeImageConfig(base, this.shape);
  }

  /**
   * Remove image
   */
  removeImage() {
    this.image = null;
  }

  /**
   * Update label and synchronize title alias
   */
  setLabel(newLabel) {
    this.label = String(newLabel || "");
    this.title = this.label;
  }

  /**
   * Get calculated bounding box in world space
   */
  getBounds(scale = 1) {
    const s = this.pinScale * scale;
    if (this.shape === "area-circle" || this.shape === "circle") {
      const r = (this.radius || 10) * s;
      return {
        left: this.x - r,
        top: this.y - r,
        right: this.x + r,
        bottom: this.y + r,
        width: r * 2,
        height: r * 2,
        centerX: this.x,
        centerY: this.y
      };
    }

    const defaultW = this.shape === "thought" ? 140
      : this.shape === "service" ? 140
      : this.shape === "database" ? 110
      : this.shape === "wal-queue" ? 180
      : this.shape === "flow-container" ? 320
      : this.shape === "flow-callout" ? 130
      : 100;

    const defaultH = this.shape === "thought" ? 90
      : this.shape === "service" ? 75
      : this.shape === "database" ? 85
      : this.shape === "wal-queue" ? 65
      : this.shape === "flow-container" ? 200
      : this.shape === "flow-callout" ? 44
      : 40;

    const w = (this.width || defaultW) * s;
    const h = (this.height || defaultH) * s;
    return {
      left: this.x - w / 2,
      top: this.y - h / 2,
      right: this.x + w / 2,
      bottom: this.y + h / 2,
      width: w,
      height: h,
      centerX: this.x,
      centerY: this.y
    };
  }

  /**
   * Get connection docking port coordinate
   * @param {"north"|"south"|"east"|"west"|"center"|"top"|"bottom"|"left"|"right"} [side="center"]
   * @param {number} [scale=1]
   * @returns {{x: number, y: number, side: string}}
   */
  getPort(side = "center", scale = 1) {
    const b = this.getBounds(scale);
    const normalized = String(side || "center").toLowerCase();
    switch (normalized) {
      case "north":
      case "top":
      case "up":
        return { x: b.centerX, y: b.top, side: "north" };
      case "south":
      case "bottom":
      case "down":
        return { x: b.centerX, y: b.bottom, side: "south" };
      case "east":
      case "right":
        return { x: b.right, y: b.centerY, side: "east" };
      case "west":
      case "left":
        return { x: b.left, y: b.centerY, side: "west" };
      case "center":
      default:
        return { x: b.centerX, y: b.centerY, side: "center" };
    }
  }

  /**
   * Determine optimal exit/entry port relative to a target pin or coordinate
   * @param {Pin|{x: number, y: number}} target
   * @param {"source"|"target"} [role="source"]
   * @returns {"north"|"south"|"east"|"west"}
   */
  getAutoPort(target, role = "source") {
    if (!target) return role === "source" ? "east" : "west";
    const targetX = typeof target.x === "number" ? target.x : this.x;
    const targetY = typeof target.y === "number" ? target.y : this.y;
    const dx = targetX - this.x;
    const dy = targetY - this.y;

    if (role === "source") {
      // Exiting this node towards target
      if (Math.abs(dx) >= Math.abs(dy)) {
        return dx >= 0 ? "east" : "west";
      } else {
        return dy >= 0 ? "south" : "north";
      }
    } else {
      // Entering this node coming from target (opposite side)
      if (Math.abs(dx) >= Math.abs(dy)) {
        return dx >= 0 ? "west" : "east";
      } else {
        return dy >= 0 ? "north" : "south";
      }
    }
  }

  /**
   * Hit test a world point against this pin's geometry
   */
  containsPoint(worldX, worldY, padding = 4) {
    const b = this.getBounds(1);
    if (this.shape === "circle" || this.shape === "area-circle") {
      const dx = worldX - this.x;
      const dy = worldY - this.y;
      const r = (b.width / 2) + padding;
      return (dx * dx + dy * dy) <= (r * r);
    }

    return (
      worldX >= b.left - padding &&
      worldX <= b.right + padding &&
      worldY >= b.top - padding &&
      worldY <= b.bottom + padding
    );
  }

  /**
   * Deep clone
   */
  clone() {
    return new Pin(JSON.parse(JSON.stringify(this.toJSON())));
  }

  /**
   * Serialize to a clean JSON-friendly object
   */
  toJSON() {
    return {
      id: this.id,
      stencilId: this.stencilId,
      x: this.x,
      y: this.y,
      label: this.label,
      title: this.title,
      subtitle: this.subtitle,
      description: this.description,
      note: this.note,
      badge: this.badge,
      shape: this.shape,
      typeId: this.typeId,
      colorSlot: this.colorSlot,
      color: this.color,
      textColor: this.textColor,
      titleColor: this.titleColor,
      borderColor: this.borderColor,
      borderWidth: this.borderWidth,
      dropShadow: this.dropShadow,
      width: this.width,
      height: this.height,
      radius: this.radius,
      pinScale: this.pinScale,
      hideShape: this.hideShape,
      locked: this.locked,
      date: this.date,
      status: this.status,
      image: this.image ? { ...this.image } : null,
      customFields: { ...this.customFields }
    };
  }
}

// Global and Module exports
if (typeof window !== 'undefined') {
  window.Pin = Pin;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Pin;
}
