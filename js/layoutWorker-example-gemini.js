// layoutWorker.js

// Listen for messages from the main thread
self.onmessage = function (e) {
  const { command, pins, connections, params } = e.data;

  // --- Utility Functions (Mirroring main thread) ---
  // You must re-implement any non-DOM dependencies here, or pass them in.
  // For now, we'll just implement the core layout logic.

  const applyForceLayout = (pins, connections, iterations) => {
    // Constants for the simulation
    const K = 30; // Optimal distance constant (affects connection length)
    const C = 0.5; // Damping constant
    const T = 0.5; // Timestep

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

      // 2. Repulsion (Barnes-Hut or simple all-pairs for now)
      for (let i = 0; i < pins.length; i++) {
        for (let j = i + 1; j < pins.length; j++) {
          const p1 = pins[i];
          const p2 = pins[j];

          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const distSq = dx * dx + dy * dy;
          const dist = Math.sqrt(distSq) || 0.1;

          // F_rep = -K^2 / dist
          const F_rep = -(K * K) / dist;

          p1.fx += (F_rep * dx) / dist;
          p1.fy += (F_rep * dy) / dist;
          p2.fx -= (F_rep * dx) / dist;
          p2.fy -= (F_rep * dy) / dist;
        }
      }

      // 3. Attraction
      connections.forEach((c) => {
        const p1 = pins[c.startIndex];
        const p2 = pins[c.endIndex];
        if (!p1 || !p2) return;

        const dx = p1.x - p2.x;
        const dy = p1.y - p2.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 0.1;

        // F_att = dist^2 / K
        const F_att = (dist * dist) / K;

        p1.fx -= (F_att * dx) / dist;
        p1.fy -= (F_att * dy) / dist;
        p2.fx += (F_att * dx) / dist;
        p2.fy += (F_att * dy) / dist;
      });

      // 4. Update positions (Integration and Damping)
      let totalEnergy = 0;
      pins.forEach((p) => {
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
      index: pins.indexOf(p),
      x: p.x,
      y: p.y,
    }));
  };

  switch (command) {
    case "START_FORCE_LAYOUT":
      // Run the simulation for a few iterations per message
      const newPositions = applyForceLayout(pins, connections, 20);

      // Post the result back to the main thread
      self.postMessage({
        command: "LAYOUT_UPDATE",
        positions: newPositions,
      });
      break;

    // You can add other heavy calculations here (e.g., Affinity clustering)
    // case 'CALCULATE_CLUSTERS': ...
  }
};
