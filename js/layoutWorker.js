// ============================================================================
// layoutWorker.js - Web Worker for Force-Directed Layout Calculations
// ============================================================================
// This worker handles computationally intensive physics simulations for
// force-directed graph layouts. It runs in a separate thread to avoid
// blocking the main UI thread.
// ============================================================================

/**
 * Determines the group ID for a pin (used in clustering mode)
 * Currently groups by color, but could be extended for other grouping strategies
 * @param {Object} pin - Pin object with color property
 * @returns {string} Group identifier
 */
function getGroupId(pin) {
  return pin.color || "#888888";
}

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
  layoutMode
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

  for (let iter = 0; iter < iterations; iter++) {
    // 1. Reset forces
    pins.forEach((p) => {
      p.fx = 0;
      p.fy = 0;
    });

    // 2. Repulsion (Simple all-pairs)
    for (let i = 0; i < pins.length; i++) {
      for (let j = i + 1; j < pins.length; j++) {
        const p1 = pins[i];
        const p2 = pins[j];

        const dx = p1.x - p2.x;
        const dy = p1.y - p2.y;
        const distSq = dx * dx + dy * dy;
        const dist = Math.sqrt(distSq) || 0.1;

        // F_rep = K^2 / dist
        const F_rep = (K * K) / dist;
        let F = F_rep * repulsion_mult;

        // CUSTOM FORCE: Clustering (Push nodes of different groups away)
        if (layoutMode === "clusters" && getGroupId(p1) !== getGroupId(p2)) {
          F *= 2.0; // Double the repulsion for non-members
        }

        // Standard Repulsion Application
        p1.fx += (F * dx) / dist;
        p1.fy += (F * dy) / dist;
        p2.fx -= (F * dx) / dist;
        p2.fy -= (F * dy) / dist;
      }
    }

    // 3. Attraction (Springs)
    connections.forEach((c) => {
      const p1 = pins[c.startIndex];
      const p2 = pins[c.endIndex];

      const dx = p1.x - p2.x;
      const dy = p1.y - p2.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 0.1;

      // F_att = dist^2 / K
      const F_att = (dist * dist) / K;
      let F = F_att * attraction_mult;

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

      // Acceleration: a = F (assuming mass=1)
      // Velocity: v = (v + a * T) * C
      p.vx = (p.vx + p.fx * T) * C;
      p.vy = (p.vy + p.fy * T) * C;

      // Position: x = x + v * T
      p.x += p.vx * T;
      p.y += p.vy * T;

      // Calculate energy (for stability check)
      totalEnergy += p.vx * p.vx + p.vy * p.vy;
    });

    // Optional: If totalEnergy is low, stop early.
    if (totalEnergy < 0.1) break;
  }

  // Return only the necessary data
  return pins.map((p) => ({
    index: p.index,
    x: p.x,
    y: p.y,
    vx: p.vx,
    vy: p.vy,
  }));
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

    const { command, pins, connections, layoutMode } = e.data;

    if (command === "start") {
    // 1. Define physics constants based on layoutMode
    let K, C, repulsion_mult, attraction_mult;
    const iterations = 50;

    switch (layoutMode) {
      case "mindmap":
        K = 100; // Longer optimal distance (spread)
        C = 0.5; // Damping
        repulsion_mult = 0.5;
        attraction_mult = 0.8;
        break;
      case "clusters":
        K = 50; // Shorter optimal distance (tight)
        C = 0.6;
        repulsion_mult = 0.2;
        attraction_mult = 1.0;
        break;
      case "timeline":
        // Forces are irrelevant, simulation is skipped
        K = 30;
        C = 0.5;
        repulsion_mult = 0.0;
        attraction_mult = 0.0;
        break;
      case "default":
      default:
        // Magic Layout / Default Force-Directed (Balanced)
        K = 30;
        C = 0.5;
        repulsion_mult = 0.2;
        attraction_mult = 1.0;
        break;
    }

    // 2. Run the simulation
    const resultPins = applyForceLayout(
      pins,
      connections,
      iterations,
      K,
      C,
      0.5, // T (Timestep)
      repulsion_mult,
      attraction_mult,
      layoutMode
    );

      self.postMessage({
        command: "update",
        pins: resultPins,
      });
    } else if (command === "stop") {
      self.postMessage({ command: "STOPPED" });
    } else {
      console.warn("Unknown command:", command);
    }
  } catch (error) {
    console.error("Error in layout worker:", error);
    self.postMessage({
      command: "error",
      error: error.message,
    });
  }
};
