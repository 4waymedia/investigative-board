// ============================================================================
// layoutWorker.js - Web Worker for Force-Directed Layout Calculations
// ============================================================================
// This worker handles computationally intensive physics simulations for
// force-directed graph layouts. It runs in a separate thread to avoid
// blocking the main UI thread.
// ============================================================================

/**
 * Production-ready Quadtree implementation for Barnes-Hut approximation
 * Reduces repulsion complexity from O(n²) to O(n log n)
 */
class Quadtree {
  constructor(boundary, capacity = 4) {
    this.boundary = boundary; // { x, y, w, h } where x,y is top-left
    this.capacity = capacity;
    this.points = [];
    this.divided = false;

    // Barnes-Hut Properties
    this.totalWeight = 0;
    this.centerX = 0;
    this.centerY = 0;
  }

  subdivide() {
    const { x, y, w, h } = this.boundary;
    const hw = w / 2;
    const hh = h / 2;

    this.nw = new Quadtree({ x: x, y: y, w: hw, h: hh }, this.capacity);
    this.ne = new Quadtree({ x: x + hw, y: y, w: hw, h: hh }, this.capacity);
    this.sw = new Quadtree({ x: x, y: y + hh, w: hw, h: hh }, this.capacity);
    this.se = new Quadtree({ x: x + hw, y: y + hh, w: hw, h: hh }, this.capacity);

    this.divided = true;

    // Move existing points to children
    for (const p of this.points) {
      this.insertToChildren(p);
    }
    this.points = [];
  }

  insertToChildren(pin) {
    if (this.nw.insert(pin)) return true;
    if (this.ne.insert(pin)) return true;
    if (this.sw.insert(pin)) return true;
    if (this.se.insert(pin)) return true;
    return false;
  }

  insert(pin) {
    // Check if pin is in bounds
    if (!(pin.x >= this.boundary.x && pin.x <= this.boundary.x + this.boundary.w &&
          pin.y >= this.boundary.y && pin.y <= this.boundary.y + this.boundary.h)) {
      return false;
    }

    // Update Center of Mass (running average)
    const newTotal = this.totalWeight + 1;
    this.centerX = (this.centerX * this.totalWeight + pin.x) / newTotal;
    this.centerY = (this.centerY * this.totalWeight + pin.y) / newTotal;
    this.totalWeight = newTotal;

    if (!this.divided) {
      if (this.points.length < this.capacity) {
        this.points.push(pin);
        return true;
      }
      this.subdivide();
    }
    return this.insertToChildren(pin);
  }

  calculateRepulsion(pin, K, repulsion_mult, theta = 0.5) {
    const dx = pin.x - this.centerX;
    const dy = pin.y - this.centerY;
    const distSq = dx * dx + dy * dy;
    const dist = Math.sqrt(distSq) || 0.1;

    // Barnes-Hut Criterion: s / d < theta
    // If the region is far enough away, treat it as a single body
    if ((this.boundary.w / dist < theta) || !this.divided) {
      if (dist < 1) return; // Ignore self or extreme overlaps

      const F = ((K * K) / dist) * repulsion_mult * this.totalWeight;
      pin.fx += (F * dx) / dist;
      pin.fy += (F * dy) / dist;
    } else {
      // Otherwise, recurse into children
      this.nw.calculateRepulsion(pin, K, repulsion_mult, theta);
      this.ne.calculateRepulsion(pin, K, repulsion_mult, theta);
      this.sw.calculateRepulsion(pin, K, repulsion_mult, theta);
      this.se.calculateRepulsion(pin, K, repulsion_mult, theta);
    }
  }
}

/**
 * Determines the group ID for a pin (used in clustering mode)
 * @param {Object} pin - Pin object with grouping property
 * @param {string} groupingKey - Property to group by (e.g., "color", "category")
 * @returns {string} Group identifier
 */
function getGroupId(pin, groupingKey = "color") {
  return pin[groupingKey] || "#888888";
}

/**
 * Physics configuration presets for different layout modes
 * Centralizes all physics constants for better maintainability
 */
const LayoutPresets = {
  mindmap: {
    K: 100,           // Longer optimal distance (spread)
    C: 0.5,           // Damping coefficient
    repulsion_mult: 0.5,
    attraction_mult: 0.8,
    description: "Radial layout with central focus"
  },
  clusters: {
    K: 50,            // Shorter optimal distance (tight)
    C: 0.6,           // Slightly more damping for tighter clusters
    repulsion_mult: 0.2,
    attraction_mult: 1.0,
    description: "Groups similar items together"
  },
  timeline: {
    K: 30,            // Forces are irrelevant, simulation is skipped
    C: 0.5,           // Standard damping
    repulsion_mult: 0.0,
    attraction_mult: 0.0,
    description: "Linear timeline layout (handled by main thread)"
  },
  default: {
    K: 30,            // Magic Layout / Default Force-Directed (Balanced)
    C: 0.5,           // Standard damping
    repulsion_mult: 0.2,
    attraction_mult: 1.0,
    description: "Balanced force-directed layout"
  }
};

/**
 * Applies a force-directed layout algorithm to position pins
 * Uses a physics simulation with repulsion and attraction forces
 * @param {Array} pins - Array of pin objects with x, y, vx, vy properties
 * @param {Array} connections - Array of connection objects with startIndex, endIndex
 * @param {number} iterations - Number of simulation iterations
 * @param {number} K - Optimal distance constant
 * @param {number} C - Damping coefficient (0-1)
 * @param {number} T - Time step
 * @param {number} repulsion_mult - Repulsion force multiplier
 * @param {number} attraction_mult - Attraction force multiplier
 * @param {string} layoutMode - Layout mode: "default", "mindmap", "clusters", "timeline"
 * @returns {Array} Array of updated pin positions
 */

const applyForceLayout = (
  pins,
  connections,
  iterations,
  K,
  C,
  T = 0.5,
  repulsion_mult,
  attraction_mult,
  layoutMode,
  groupingKey = "color"
) => {
  // 0. Timeline Pre-Check (Timeline is handled by the main thread, worker does nothing)
  if (layoutMode === "timeline") {
    return pins.map((p) => ({ index: p.index, x: p.x, y: p.y }));
  }

  // Initializing velocities and forces
  pins.forEach((p) => {
    p.vx = p.vx || 0;
    p.vy = p.vy || 0;
    p.fx = 0;
    p.fy = 0;
  });

  // Distance and force clamping constants
  const MIN_DISTANCE = 1.0; // Minimum distance to prevent division by zero
  const MAX_FORCE = K * 10; // Maximum force per step to prevent instability

  for (let iter = 0; iter < iterations; iter++) {
    // CALCULATE COOLING: Linear decay
    // As iter approaches iterations, coolingFactor approaches 0
    const coolingFactor = Math.max(0.01, 1 - iter / iterations);

    // 1. Reset forces
    pins.forEach((p) => {
      p.fx = 0;
      p.fy = 0;
    });

    // 2. Repulsion using Barnes-Hut approximation (O(n log n) instead of O(n²))
    // Calculate bounds for the Quadtree
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    pins.forEach(p => {
      minX = Math.min(minX, p.x); minY = Math.min(minY, p.y);
      maxX = Math.max(maxX, p.x); maxY = Math.max(maxY, p.y);
    });

    // Create boundary with some padding
    const boundary = { x: minX - 50, y: minY - 50, w: (maxX - minX) + 100, h: (maxY - minY) + 100 };
    const qtree = new Quadtree(boundary);

    // Build the tree
    pins.forEach(p => qtree.insert(p));

    // Efficient repulsion calculation
    pins.forEach(p => {
      qtree.calculateRepulsion(p, K, repulsion_mult, 0.5); // 0.5 is the standard theta
    });

    // Additional clustering repulsion (only for nearby nodes to avoid O(n²))
    if (layoutMode === "clusters") {
      // Use a small radius check for clustering - much more efficient than all-pairs
      const clusterRadius = K * 2; // Only check nodes within 2x optimal distance
      for (let i = 0; i < pins.length; i++) {
        for (let j = i + 1; j < pins.length; j++) {
          const p1 = pins[i];
          const p2 = pins[j];

          // Skip if different groups (no need to repel same group members)
          if (getGroupId(p1, groupingKey) === getGroupId(p2, groupingKey)) continue;

          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const distSq = dx * dx + dy * dy;
          const dist = Math.sqrt(distSq);

          // Only calculate clustering repulsion for nearby nodes
          if (dist < clusterRadius && dist > 0) {
            const clampedDist = Math.max(MIN_DISTANCE, dist);
            const F_rep = (K * K) / clampedDist;
            const F = Math.min(MAX_FORCE, F_rep * repulsion_mult * 2.0); // Double repulsion for different groups

            p1.fx += (F * dx) / clampedDist;
            p1.fy += (F * dy) / clampedDist;
            p2.fx -= (F * dx) / clampedDist;
            p2.fy -= (F * dy) / clampedDist;
          }
        }
      }
    }

    // 3. Attraction (Springs)
    connections.forEach((c) => {
      const p1 = pins[c.startIndex];
      const p2 = pins[c.endIndex];

      const dx = p1.x - p2.x;
      const dy = p1.y - p2.y;
      const dist = Math.max(MIN_DISTANCE, Math.sqrt(dx * dx + dy * dy));

      // F_att = dist^2 / K
      const F_att = (dist * dist) / K;
      let F = Math.min(MAX_FORCE, F_att * attraction_mult);

      // CUSTOM FORCE: Clustering (Stronger attraction for connected pins)
      if (layoutMode === "clusters") {
        F *= 2.5;
      }

      p1.fx -= (F * dx) / dist;
      p1.fy -= (F * dy) / dist;
      p2.fx += (F * dx) / dist;
      p2.fy += (F * dy) / dist;
    });

    // 4. Update positions (Integration and Damping)
    let totalEnergy = 0;
    pins.forEach((p) => {
      // CUSTOM FORCE: Mind Map Centering
      if (layoutMode === "mindmap") {
        if (p.isRoot) {
          // Strong force pulling the root to the center (0,0)
          p.fx -= p.x * 0.1;
          p.fy -= p.y * 0.1;
        } else {
          // Gentle force pulling ALL nodes toward the center for a radial feel
          p.fx -= p.x * 0.0005;
          p.fy -= p.y * 0.0005;
        }
      }

      // Apply the coolingFactor to the velocity update
      // This progressively reduces the "speed" of the simulation
      p.vx = (p.vx + p.fx * T) * C * coolingFactor;
      p.vy = (p.vy + p.fy * T) * C * coolingFactor;

      // Position: x = x + v * T
      p.x += p.vx * T;
      p.y += p.vy * T;

      // Calculate energy (for stability check)
      totalEnergy += p.vx * p.vx + p.vy * p.vy;
    });

    // Early exit if energy is negligible
    // We adjust the threshold because cooling will naturally lower energy
    if (coolingFactor < 0.1) {
      // Optional: break; if you want to save CPU cycles once it's nearly frozen
    }

    // Optional: If totalEnergy is low, stop early.
    if (totalEnergy < 0.1) break;
  }

  // Return positions as Float32Array for zero-copy transfer
  // Format: [x1, y1, x2, y2, ..., xn, yn]
  const positions = new Float32Array(pins.length * 2);
  pins.forEach((p, i) => {
    positions[i * 2] = p.x;
    positions[i * 2 + 1] = p.y;
  });
  return positions;
};

// ============================================================================
// Worker Message Handler
// ============================================================================
/**
 * Handles messages from the main thread
 * Commands:
 *   - "start": Begin/continue force layout simulation
 *   - "stop": Stop the simulation
 */
self.onmessage = function (e) {
  try {
    // Validate that e.data exists and has a command
    // Silently ignore invalid messages (likely from browser extensions/dev tools)
    if (!e.data || typeof e.data !== "object" || !e.data.command) {
      return; // Silently ignore invalid messages
    }

    const { command, pins, connections, layoutMode, requestId, groupingKey } = e.data;

    if (command === "start") {
      // 1. Get physics configuration from presets
      const config = LayoutPresets[layoutMode] || LayoutPresets.default;
      const iterations = 50;

    // 2. Run the simulation
    const positions = applyForceLayout(
      pins,
      connections,
      iterations,
      config.K,
      config.C, // Damping coefficient
      0.5, // T (Timestep)
      config.repulsion_mult,
      config.attraction_mult,
      layoutMode,
      groupingKey
    );

      self.postMessage({
        command: "update",
        requestId: requestId,
        positions: positions.buffer,
        pinCount: pins.length,
      }, [positions.buffer]);
    } else if (command === "stop") {
      self.postMessage({ command: "STOPPED", requestId: requestId });
    } else {
      console.warn("Unknown command:", command);
    }
  } catch (error) {
    console.error("Error in layout worker:", error);
    self.postMessage({
      command: "error",
      requestId: requestId,
      error: error.message,
    });
  }
};
