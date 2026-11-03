// ============================================================================
// LAYOUT ENGINE - Master Canvas Grid & Deterministic Pin Positioning
// ============================================================================
// Provides:
// 1. World-space visual canvas grid (dots + major crosshairs)
// 2. Exact grid-snapping (snapToGrid / snapPoint)
// 3. Count-based optimal aspect-ratio alignment (1, 2, 3, 4, 5, 6, N pins)
// 4. Default layout algorithm for changing layouts or group types
// ============================================================================

class LayoutEngine {
  // Master grid constants
  static GRID_SIZE = 40;          // Base grid unit (px)
  static MAJOR_GRID_FACTOR = 4;   // Major crosshair interval (4 * 40 = 160px)
  static SPACING_X = 240;         // Standard horizontal distance between pins (6 * 40)
  static SPACING_Y = 160;         // Standard vertical distance between pins (4 * 40)

  constructor(appState = null) {
    this.appState = appState;
  }

  /**
   * Snap a scalar coordinate to the nearest grid line
   * @param {number} value
   * @param {number} gridSize
   * @returns {number}
   */
  static snap(value, gridSize = LayoutEngine.GRID_SIZE) {
    if (!Number.isFinite(value)) return 0;
    const snapped = Math.round(value / gridSize) * gridSize;
    return snapped === 0 ? 0 : snapped;
  }

  /**
   * Snap a 2D point {x, y} to the nearest grid node
   * @param {{x: number, y: number}} point
   * @param {number} gridSize
   * @returns {{x: number, y: number}}
   */
  static snapPoint(point, gridSize = LayoutEngine.GRID_SIZE) {
    if (!point) return { x: 0, y: 0 };
    return {
      x: LayoutEngine.snap(point.x, gridSize),
      y: LayoutEngine.snap(point.y, gridSize)
    };
  }

  /**
   * Calculate optimal column count and positions for N pins
   * Arranges pins symmetrically around (0, 0) matching widescreen aspect ratio (~1.6 - 1.8),
   * with centered rows so odd pin counts look balanced and aligned to the grid.
   *
   * @param {number} count - Total number of pins
   * @param {Object} options - Custom spacing, grid size, aspect ratio
   * @returns {{cols: number, rows: number, positions: Array<{col: number, row: number, x: number, y: number}>}}
   */
  static calculateOptimalGrid(count, options = {}) {
    if (!count || count <= 0) {
      return { cols: 0, rows: 0, positions: [] };
    }

    const gridSize = options.gridSize || LayoutEngine.GRID_SIZE;
    const spacingX = options.spacingX || LayoutEngine.SPACING_X;
    const spacingY = options.spacingY || LayoutEngine.SPACING_Y;

    // Hand-tuned optimal column count for small and medium counts matching widescreen canvas
    let cols;
    if (count === 1) cols = 1;
    else if (count === 2) cols = 2;
    else if (count === 3) cols = 3;
    else if (count === 4) cols = 2;
    else if (count <= 6) cols = 3;
    else if (count <= 8) cols = 4;
    else if (count <= 12) cols = 4;
    else if (count <= 16) cols = 5;
    else {
      // Golden ratio / 16:9 proportional columns
      cols = Math.max(3, Math.ceil(Math.sqrt(count * 1.5)));
    }

    const rows = Math.ceil(count / cols);
    const positions = [];

    // Lay out row by row with per-row horizontal centering
    for (let r = 0; r < rows; r++) {
      const rowPinCount = Math.min(cols, count - r * cols);
      const rowWidth = (rowPinCount - 1) * spacingX;
      const startX = -rowWidth / 2;
      const y = (r - (rows - 1) / 2) * spacingY;
      const snappedY = LayoutEngine.snap(y, gridSize);

      for (let c = 0; c < rowPinCount; c++) {
        const x = startX + c * spacingX;
        const snappedX = LayoutEngine.snap(x, gridSize);
        positions.push({
          col: c,
          row: r,
          x: snappedX,
          y: snappedY
        });
      }
    }

    return { cols, rows, positions };
  }

  /**
   * Determine the group identity for a pin
   * @param {Object} pin
   * @param {string} groupBy - 'family' | 'color' | 'type' | 'area'
   * @returns {string} Group identifier
   */
  static getPinGroupKey(pin, groupBy = "family") {
    if (!pin) return "default";

    if (groupBy === "family") {
      if (pin.family) return pin.family;
      if (pin.shape === "area-circle" || pin.shape === "area-rect" || pin.areaType) return "area";
      if (pin.shape === "card" || pin.cardId != null) return "card";
      if (pin.shape === "bubble" || pin.shape === "text-plain" || pin.shape === "text-title") return "text";
      if (pin.typeId) {
        const prefix = pin.typeId.split(":")[0];
        if (prefix) return prefix;
      }
      return "pin";
    }

    if (groupBy === "color") {
      return pin.color || (pin.colorSlot !== undefined ? `slot_${pin.colorSlot}` : "default");
    }

    if (groupBy === "type") {
      return pin.typeId || pin.shape || "pin:circle";
    }

    return "default";
  }

  /**
   * Apply default count-based grid layout to a set of pins
   * Snaps all pin coordinates to the master grid and centers them around the given or centroid point.
   *
   * @param {Array<Object>} pins
   * @param {Object} options
   * @returns {boolean}
   */
  static applyDefaultGrid(pins, options = {}) {
    if (!pins || pins.length === 0) return false;

    const count = pins.length;
    const gridSize = options.gridSize || LayoutEngine.GRID_SIZE;

    // Calculate centroid or use provided center
    let centerX = 0;
    let centerY = 0;
    let validCount = 0;

    if (options.center && Number.isFinite(options.center.x) && Number.isFinite(options.center.y)) {
      centerX = options.center.x;
      centerY = options.center.y;
    } else {
      pins.forEach(p => {
        const px = Number(p.x);
        const py = Number(p.y);
        if (Number.isFinite(px) && Number.isFinite(py)) {
          centerX += px;
          centerY += py;
          validCount++;
        }
      });
      if (validCount > 0) {
        centerX = centerX / validCount;
        centerY = centerY / validCount;
      } else {
        const container = document.getElementById("canvas-container");
        centerX = (container?.clientWidth || window.innerWidth || 1200) / 2;
        centerY = ((container?.clientHeight || window.innerHeight - 190) || 700) / 2;
      }
    }

    // Snap anchor center to grid
    centerX = LayoutEngine.snap(centerX, gridSize);
    centerY = LayoutEngine.snap(centerY, gridSize);

    // Compute optimal positions
    const grid = LayoutEngine.calculateOptimalGrid(count, options);

    pins.forEach((pin, i) => {
      const pos = grid.positions[i];
      if (pos) {
        pin.x = centerX + pos.x;
        pin.y = centerY + pos.y;
      }
    });

    return { x: centerX, y: centerY };
  }

  /**
   * Apply radial / starburst layout around a root pin
   * Immediate neighbors in Ring 1, second-tier / remaining in Ring 2.
   * Snaps all pin coordinates to the master 40px grid.
   *
   * @param {Array<Object>} pins
   * @param {Array<Object>} connections
   * @param {number} rootIndex
   * @param {Object} options
   * @returns {{x: number, y: number}} Center coordinate
   */
  static applyRadialLayout(pins, connections = [], rootIndex = 0, options = {}) {
    if (!pins || pins.length === 0) return { x: 0, y: 0 };

    const gridSize = options.gridSize || LayoutEngine.GRID_SIZE;

    // Validate rootIndex
    if (!Number.isInteger(rootIndex) || rootIndex < 0 || rootIndex >= pins.length) {
      const degree = new Array(pins.length).fill(0);
      connections.forEach(c => {
        const from = Number(c.from !== undefined ? c.from : c.startIndex);
        const to = Number(c.to !== undefined ? c.to : c.endIndex);
        if (Number.isInteger(from) && from >= 0 && from < pins.length &&
            Number.isInteger(to) && to >= 0 && to < pins.length) {
          degree[from]++;
          degree[to]++;
        }
      });
      let maxDeg = -1;
      rootIndex = 0;
      degree.forEach((deg, idx) => {
        if (deg > maxDeg) {
          maxDeg = deg;
          rootIndex = idx;
        }
      });
    }

    // Determine center: provided, or centroid of all pins
    let centerX = 0;
    let centerY = 0;
    let validCount = 0;

    if (options.center && Number.isFinite(options.center.x) && Number.isFinite(options.center.y)) {
      centerX = options.center.x;
      centerY = options.center.y;
    } else {
      pins.forEach(p => {
        const px = Number(p.x);
        const py = Number(p.y);
        if (Number.isFinite(px) && Number.isFinite(py)) {
          centerX += px;
          centerY += py;
          validCount++;
        }
      });
      if (validCount > 0) {
        centerX = centerX / validCount;
        centerY = centerY / validCount;
      } else {
        const container = document.getElementById("canvas-container");
        centerX = (container?.clientWidth || window.innerWidth || 1200) / 2;
        centerY = ((container?.clientHeight || window.innerHeight - 190) || 700) / 2;
      }
    }

    centerX = LayoutEngine.snap(centerX, gridSize);
    centerY = LayoutEngine.snap(centerY, gridSize);

    // Root pin at center
    pins[rootIndex].x = centerX;
    pins[rootIndex].y = centerY;

    if (pins.length === 1) {
      return { x: centerX, y: centerY };
    }

    // Find immediate connected neighbors
    const neighbors = new Set();
    connections.forEach(c => {
      const from = Number(c.from !== undefined ? c.from : c.startIndex);
      const to = Number(c.to !== undefined ? c.to : c.endIndex);
      if (from === rootIndex && to !== rootIndex && to >= 0 && to < pins.length) neighbors.add(to);
      if (to === rootIndex && from !== rootIndex && from >= 0 && from < pins.length) neighbors.add(from);
    });

    let ring1Pins = Array.from(neighbors).map(i => pins[i]).filter(Boolean);
    let otherPins = pins.filter((p, i) => i !== rootIndex && !neighbors.has(i));

    // If no pins are connected to root, place all other pins in ring 1 (up to 8), then ring 2
    if (ring1Pins.length === 0) {
      if (otherPins.length <= 8) {
        ring1Pins = otherPins;
        otherPins = [];
      } else {
        ring1Pins = otherPins.slice(0, 6);
        otherPins = otherPins.slice(6);
      }
    }

    // Ring 1 placement
    if (ring1Pins.length > 0) {
      const r1 = LayoutEngine.snap(Math.max(200, ring1Pins.length * 32), gridSize);
      const step1 = (Math.PI * 2) / ring1Pins.length;
      ring1Pins.forEach((p, i) => {
        const angle = i * step1;
        p.x = LayoutEngine.snap(centerX + r1 * Math.cos(angle), gridSize);
        p.y = LayoutEngine.snap(centerY + r1 * Math.sin(angle), gridSize);
      });
    }

    // Ring 2 placement
    if (otherPins.length > 0) {
      const r1 = ring1Pins.length > 0 ? Math.max(200, ring1Pins.length * 32) : 200;
      const r2 = LayoutEngine.snap(Math.max(r1 + 160, 360, otherPins.length * 28), gridSize);
      const step2 = (Math.PI * 2) / otherPins.length;
      const angleOffset = ring1Pins.length > 0 ? (Math.PI / Math.max(ring1Pins.length, otherPins.length)) : 0;
      otherPins.forEach((p, i) => {
        const angle = i * step2 + angleOffset;
        p.x = LayoutEngine.snap(centerX + r2 * Math.cos(angle), gridSize);
        p.y = LayoutEngine.snap(centerY + r2 * Math.sin(angle), gridSize);
      });
    }

    return { x: centerX, y: centerY };
  }

  /**
   * Default algorithm for positioning pins when changing group types or grouping
   * Organizes pins by category (family, color, type), creates an aligned sub-grid for each group,
   * and places groups symmetrically along the master canvas grid.
   *
   * @param {Array<Object>} pins
   * @param {Object} options - { groupBy: 'family'|'color'|'type', spacingX, spacingY, gridSize, center }
   * @returns {boolean}
   */
  static applyGroupLayout(pins, options = {}) {
    if (!pins || pins.length === 0) return false;

    const groupBy = options.groupBy || "family";
    const gridSize = options.gridSize || LayoutEngine.GRID_SIZE;

    // Group pins
    const groups = new Map();
    pins.forEach(pin => {
      const key = LayoutEngine.getPinGroupKey(pin, groupBy);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(pin);
    });

    // If only one group exists, fall back to optimal count grid
    if (groups.size <= 1) {
      return LayoutEngine.applyDefaultGrid(pins, options);
    }

    // Sort group keys for deterministic arrangement
    // Natural family sort order: Pin, Card, Area, Text
    const familyOrder = { pin: 1, card: 2, area: 3, text: 4 };
    const groupKeys = Array.from(groups.keys()).sort((a, b) => {
      const rankA = familyOrder[a] || 99;
      const rankB = familyOrder[b] || 99;
      if (rankA !== rankB) return rankA - rankB;
      return a.localeCompare(b);
    });

    // Determine overall centroid
    let overallCenterX = 0;
    let overallCenterY = 0;
    let validCount = 0;
    pins.forEach(p => {
      const px = Number(p.x);
      const py = Number(p.y);
      if (Number.isFinite(px) && Number.isFinite(py)) {
        overallCenterX += px;
        overallCenterY += py;
        validCount++;
      }
    });
    if (validCount > 0) {
      overallCenterX = overallCenterX / validCount;
      overallCenterY = overallCenterY / validCount;
    } else {
      const container = document.getElementById("canvas-container");
      overallCenterX = (container?.clientWidth || window.innerWidth || 1200) / 2;
      overallCenterY = ((container?.clientHeight || window.innerHeight - 190) || 700) / 2;
    }
    overallCenterX = LayoutEngine.snap(overallCenterX, gridSize);
    overallCenterY = LayoutEngine.snap(overallCenterY, gridSize);

    // Compute bounding geometry for each group cluster
    const clusterData = groupKeys.map(key => {
      const groupPins = groups.get(key);
      const subGrid = LayoutEngine.calculateOptimalGrid(groupPins.length, options);
      const spanW = (subGrid.cols - 1) * (options.spacingX || LayoutEngine.SPACING_X);
      const spanH = (subGrid.rows - 1) * (options.spacingY || LayoutEngine.SPACING_Y);
      return {
        key,
        pins: groupPins,
        subGrid,
        width: Math.max(280, spanW + 160),
        height: Math.max(200, spanH + 160)
      };
    });

    const numClusters = clusterData.length;

    // Macro layout for clusters
    if (numClusters === 2) {
      // Side-by-side balanced horizontal layout
      const sep = LayoutEngine.snap(Math.max(clusterData[0].width, clusterData[1].width) / 2 + 160, gridSize);
      const centers = [
        { x: overallCenterX - sep, y: overallCenterY },
        { x: overallCenterX + sep, y: overallCenterY }
      ];

      clusterData.forEach((cluster, idx) => {
        const cCenter = centers[idx];
        cluster.pins.forEach((pin, pIdx) => {
          const pos = cluster.subGrid.positions[pIdx];
          pin.x = cCenter.x + pos.x;
          pin.y = cCenter.y + pos.y;
        });
      });
    } else if (numClusters <= 4) {
      // 2x2 Quadrant macro-grid
      const maxW = Math.max(...clusterData.map(c => c.width));
      const maxH = Math.max(...clusterData.map(c => c.height));
      const sepX = LayoutEngine.snap(maxW / 2 + 120, gridSize);
      const sepY = LayoutEngine.snap(maxH / 2 + 100, gridSize);

      const offsets = [
        { x: -sepX, y: -sepY },
        { x: sepX, y: -sepY },
        { x: -sepX, y: sepY },
        { x: sepX, y: sepY }
      ];

      clusterData.forEach((cluster, idx) => {
        const off = offsets[idx];
        const cX = overallCenterX + off.x;
        const cY = overallCenterY + off.y;
        cluster.pins.forEach((pin, pIdx) => {
          const pos = cluster.subGrid.positions[pIdx];
          pin.x = cX + pos.x;
          pin.y = cY + pos.y;
        });
      });
    } else {
      // Concentric ring macro-layout for 5+ groups
      const ringRadius = LayoutEngine.snap(Math.max(360, numClusters * 100), gridSize);
      const angleStep = (Math.PI * 2) / numClusters;

      clusterData.forEach((cluster, idx) => {
        const angle = idx * angleStep;
        const cX = LayoutEngine.snap(overallCenterX + ringRadius * Math.cos(angle), gridSize);
        const cY = LayoutEngine.snap(overallCenterY + ringRadius * Math.sin(angle), gridSize);
        cluster.pins.forEach((pin, pIdx) => {
          const pos = cluster.subGrid.positions[pIdx];
          pin.x = cX + pos.x;
          pin.y = cY + pos.y;
        });
      });
    }

    return { x: overallCenterX, y: overallCenterY };
  }

  /**
   * Draw the subtle default world-space canvas grid (dots and major crosshairs)
   * Runs inside drawWorldSpaceElements() under world coordinates.
   *
   * @param {CanvasRenderingContext2D} ctx
   * @param {{left: number, top: number, right: number, bottom: number}} viewport
   * @param {number} scale
   * @param {Object} theme
   */
  static drawGrid(ctx, viewport, scale = 1, theme = {}) {
    if (!ctx || !viewport) return;

    const gridSize = LayoutEngine.GRID_SIZE; // 40px
    const majorFactor = LayoutEngine.MAJOR_GRID_FACTOR; // 4 (160px)
    const majorSize = gridSize * majorFactor;

    // Viewport-bounded grid bounds
    const startX = Math.floor(viewport.left / gridSize) * gridSize;
    const endX = Math.ceil(viewport.right / gridSize) * gridSize;
    const startY = Math.floor(viewport.top / gridSize) * gridSize;
    const endY = Math.ceil(viewport.bottom / gridSize) * gridSize;

    // Theme-derived grid colors
    const isLightTheme = theme?.name?.toLowerCase().includes("light") || theme?.id === "light";
    const dotColor = theme?.canvas?.gridColor || (isLightTheme ? "rgba(0, 0, 0, 0.08)" : "rgba(255, 255, 255, 0.05)");
    const majorColor = theme?.canvas?.gridMajorColor || (isLightTheme ? "rgba(0, 0, 0, 0.22)" : "rgba(255, 255, 255, 0.16)");

    ctx.save();

    // 1. Draw minor grid dots (skip when heavily zoomed out to prevent visual noise / performance drop)
    if (scale >= 0.35) {
      ctx.fillStyle = dotColor;
      const dotRadius = Math.max(0.75, 1.25 / Math.sqrt(scale));

      for (let x = startX; x <= endX; x += gridSize) {
        // Skip columns that align with major crosshairs (drawn in next pass)
        const isMajorX = (Math.abs(x) % majorSize === 0);

        for (let y = startY; y <= endY; y += gridSize) {
          const isMajorY = (Math.abs(y) % majorSize === 0);
          if (isMajorX && isMajorY) continue; // Major pass handles this

          ctx.beginPath();
          ctx.arc(x, y, dotRadius, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    // 2. Draw major intersection crosshairs
    const majorStartX = Math.floor(viewport.left / majorSize) * majorSize;
    const majorEndX = Math.ceil(viewport.right / majorSize) * majorSize;
    const majorStartY = Math.floor(viewport.top / majorSize) * majorSize;
    const majorEndY = Math.ceil(viewport.bottom / majorSize) * majorSize;

    ctx.strokeStyle = majorColor;
    ctx.lineWidth = Math.max(1, 1 / scale);
    const crossHalf = Math.max(3, 4.5 / Math.sqrt(scale));

    ctx.beginPath();
    for (let mx = majorStartX; mx <= majorEndX; mx += majorSize) {
      for (let my = majorStartY; my <= majorEndY; my += majorSize) {
        ctx.moveTo(mx - crossHalf, my);
        ctx.lineTo(mx + crossHalf, my);
        ctx.moveTo(mx, my - crossHalf);
        ctx.lineTo(mx, my + crossHalf);
      }
    }
    ctx.stroke();

    ctx.restore();
  }
}

// Global exports
if (typeof window !== "undefined") {
  window.LayoutEngine = LayoutEngine;
}
if (typeof module !== "undefined" && module.exports) {
  module.exports = LayoutEngine;
}
