/**
 * Quadtree Implementation for Barnes-Hut Optimization
 */
class Quadtree {
  constructor(boundary, capacity = 4) {
    this.boundary = boundary; // { x, y, w, h }
    this.capacity = capacity;
    this.points = [];
    this.divided = false;
    this.totalWeight = 0;
    this.centerX = 0;
    this.centerY = 0;
  }

  subdivide() {
    const { x, y, w, h } = this.boundary;
    const hw = w / 2;
    const hh = h / 2;
    this.nw = new Quadtree({ x, y, w: hw, h: hh }, this.capacity);
    this.ne = new Quadtree({ x: x + hw, y, w: hw, h: hh }, this.capacity);
    this.sw = new Quadtree({ x, y: y + hh, w: hw, h: hh }, this.capacity);
    this.se = new Quadtree(
      { x: x + hw, y: y + hh, w: hw, h: hh },
      this.capacity
    );
    this.divided = true;
    for (const p of this.points) this.insertToChildren(p);
    this.points = [];
  }

  insertToChildren(pin) {
    return (
      this.nw.insert(pin) ||
      this.ne.insert(pin) ||
      this.sw.insert(pin) ||
      this.se.insert(pin)
    );
  }

  insert(pin) {
    if (
      !(
        pin.x >= this.boundary.x &&
        pin.x <= this.boundary.x + this.boundary.w &&
        pin.y >= this.boundary.y &&
        pin.y <= this.boundary.y + this.boundary.h
      )
    )
      return false;

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

  calculateRepulsion(
    pin,
    K,
    repulsion_mult,
    layoutMode,
    getGroupId,
    theta = 0.5
  ) {
    const dx = pin.x - this.centerX;
    const dy = pin.y - this.centerY;
    const distSq = dx * dx + dy * dy;
    const dist = Math.sqrt(distSq) || 0.1;

    if (this.boundary.w / dist < theta || !this.divided) {
      if (dist < 0.5) return;

      let F = ((K * K) / dist) * repulsion_mult * this.totalWeight;

      // Maintain your original clustering logic
      // Note: This is an approximation since we check against the Center of Mass
      if (layoutMode === "clusters" && this.totalWeight === 1) {
        const otherPin = this.points[0];
        if (otherPin && getGroupId(pin) !== getGroupId(otherPin)) {
          F *= 2.0;
        }
      }

      pin.fx += (F * dx) / dist;
      pin.fy += (F * dy) / dist;
    } else {
      this.nw.calculateRepulsion(
        pin,
        K,
        repulsion_mult,
        layoutMode,
        getGroupId,
        theta
      );
      this.ne.calculateRepulsion(
        pin,
        K,
        repulsion_mult,
        layoutMode,
        getGroupId,
        theta
      );
      this.sw.calculateRepulsion(
        pin,
        K,
        repulsion_mult,
        layoutMode,
        getGroupId,
        theta
      );
      this.se.calculateRepulsion(
        pin,
        K,
        repulsion_mult,
        layoutMode,
        getGroupId,
        theta
      );
    }
  }
}

function getGroupId(pin) {
  return pin.color || "#888888";
}

const applyForceLayout = (
  pins,
  connections,
  iterations,
  K,
  C,
  T,
  repulsion_mult,
  attraction_mult,
  layoutMode
) => {
  if (layoutMode === "timeline")
    return pins.map((p) => ({ index: p.index, x: p.x, y: p.y }));

  pins.forEach((p) => {
    p.vx = p.vx || 0;
    p.vy = p.vy || 0;
  });

  for (let iter = 0; iter < iterations; iter++) {
    // Simulated Annealing: Gradually reduce temperature
    const coolingFactor = Math.max(0.1, 1 - iter / iterations);

    pins.forEach((p) => {
      p.fx = 0;
      p.fy = 0;
    });

    // 1. Optimized Repulsion with Quadtree
    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;
    pins.forEach((p) => {
      minX = Math.min(minX, p.x);
      minY = Math.min(minY, p.y);
      maxX = Math.max(maxX, p.x);
      maxY = Math.max(maxY, p.y);
    });
    const qtree = new Quadtree({
      x: minX - 50,
      y: minY - 50,
      w: maxX - minX + 100,
      h: maxY - minY + 100,
    });
    pins.forEach((p) => qtree.insert(p));
    pins.forEach((p) =>
      qtree.calculateRepulsion(p, K, repulsion_mult, layoutMode, getGroupId)
    );

    // 2. Attraction (Springs)
    connections.forEach((c) => {
      const p1 = pins[c.startIndex];
      const p2 = pins[c.endIndex];
      if (!p1 || !p2) return;
      const dx = p1.x - p2.x,
        dy = p1.y - p2.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 0.1;
      let F = ((dist * dist) / K) * attraction_mult;
      if (layoutMode === "clusters") F *= 2.5;

      const fx = (F * dx) / dist,
        fy = (F * dy) / dist;
      p1.fx -= fx;
      p1.fy -= fy;
      p2.fx += fx;
      p2.fy += fy;
    });

    // 3. Update Positions
    pins.forEach((p) => {
      if (layoutMode === "mindmap") {
        const factor = p.isRoot ? 0.1 : 0.0005;
        p.fx -= p.x * factor;
        p.fy -= p.y * factor;
      }

      // Integration with Cooling
      p.vx = (p.vx + p.fx * T) * C * coolingFactor;
      p.vy = (p.vy + p.fy * T) * C * coolingFactor;
      p.x += p.vx * T;
      p.y += p.vy * T;
    });
  }

  return pins.map((p) => ({
    index: p.index,
    x: p.x,
    y: p.y,
    vx: p.vx,
    vy: p.vy,
  }));
};

self.onmessage = function (e) {
  try {
    if (!e.data || !e.data.command) return;
    const { command, pins, connections, layoutMode, requestId } = e.data;

    if (command === "start") {
      let K = 30,
        C = 0.5,
        rep = 0.2,
        att = 1.0;
      if (layoutMode === "mindmap") {
        K = 100;
        C = 0.5;
        rep = 0.5;
        att = 0.8;
      } else if (layoutMode === "clusters") {
        K = 50;
        C = 0.6;
        rep = 0.2;
        att = 1.0;
      }

      const resultPins = applyForceLayout(
        pins,
        connections,
        50,
        K,
        C,
        0.5,
        rep,
        att,
        layoutMode
      );
      self.postMessage({ command: "update", requestId, pins: resultPins });
    } else if (command === "stop") {
      self.postMessage({ command: "STOPPED", requestId });
    }
  } catch (error) {
    self.postMessage({
      command: "error",
      requestId: e.data.requestId,
      error: error.message,
    });
  }
};
