// Unit Tests for the Pin Class and Inset Image Geometry
const assert = require("assert");
const Pin = require("../js/core/pin");

console.log("=== Testing Pin Class Architecture & Archetypes ===");

// 1. Basic Constructor & Canonical Defaults
const basicPin = new Pin({ x: 120, y: 240, label: "Crime Scene Alpha" });
assert.ok(basicPin.id.startsWith("pin_"), "Should generate unique pin ID");
assert.strictEqual(basicPin.x, 120);
assert.strictEqual(basicPin.y, 240);
assert.strictEqual(basicPin.label, "Crime Scene Alpha");
assert.strictEqual(basicPin.title, "Crime Scene Alpha", "Should maintain bidirectional title/label mirror");
assert.strictEqual(basicPin.colorSlot, "c2");
assert.strictEqual(basicPin.pinScale, 1.0);
console.log("✅ Pin constructor & default initialization: OK");

// 2. Bidirectional Aliases
basicPin.setLabel("Updated Crime Scene");
assert.strictEqual(basicPin.label, "Updated Crime Scene");
assert.strictEqual(basicPin.title, "Updated Crime Scene");

basicPin.customFields.handler = "Agent Miller";
assert.strictEqual(basicPin.metadata.handler, "Agent Miller", "Should maintain metadata / customFields alias");
console.log("✅ Bidirectional aliasing (title/label & metadata/customFields): OK");

// 3. Archetype Factory: Entity (Suspect)
const suspect = Pin.createEntity({
  label: "John 'Scarface' Doe",
  subtitle: "Primary Target",
  badge: "SUSPECT"
});
assert.strictEqual(suspect.shape, "person");
assert.strictEqual(suspect.badge, "SUSPECT");
assert.strictEqual(suspect.pinScale, 1.15);
assert.strictEqual(suspect.colorSlot, "c1");
console.log("✅ Archetype factory Pin.createEntity(): OK");

// 4. Archetype Factory: Hypothesis (Thought Bubble with Inset Image)
const hypothesis = Pin.createHypothesis({
  label: "Motive Hypothesis",
  description: "Suspect embezzled funds prior to disappearance.",
  image: {
    dataUrl: "data:image/jpeg;base64,sample123",
    style: "circular",
    size: 90
  }
});
assert.strictEqual(hypothesis.shape, "thought");
assert.strictEqual(hypothesis.badge, "THEORY");
assert.strictEqual(hypothesis.isImageInset(), true, "Thought bubble should default image layer to inset");
assert.strictEqual(hypothesis.image.layer, "inset");
console.log("✅ Archetype factory Pin.createHypothesis() with inset image: OK");

// 5. Explicit Image Layer: Behind (for backdrop / shadow simulation)
hypothesis.setImage("data:image/jpeg;base64,backdrop456", { layer: "behind" });
assert.strictEqual(hypothesis.isImageInset(), false, "Explicit 'behind' layer should return isImageInset = false");
assert.strictEqual(hypothesis.image.layer, "behind");
console.log("✅ Image layer toggling ('inset' vs 'behind'): OK");

// 6. Geometry & Hit Testing
const circlePin = new Pin({ x: 200, y: 200, shape: "circle", radius: 20 });
const circleBounds = circlePin.getBounds(1);
assert.strictEqual(circleBounds.width, 40);
assert.strictEqual(circleBounds.left, 180);
assert.strictEqual(circleBounds.right, 220);
assert.ok(circlePin.containsPoint(205, 195), "Point inside circle should hit");
assert.ok(!circlePin.containsPoint(250, 200), "Point outside circle should not hit");

const rectPin = new Pin({ x: 300, y: 300, shape: "rectangle", width: 140, height: 70 });
const rectBounds = rectPin.getBounds(1);
assert.strictEqual(rectBounds.width, 140);
assert.strictEqual(rectBounds.height, 70);
assert.ok(rectPin.containsPoint(320, 310), "Point inside rect should hit");
assert.ok(!rectPin.containsPoint(400, 300), "Point outside rect should not hit");
console.log("✅ Spatial bounds and shape-aware hit testing: OK");

// 7. Serialization & Deserialization
const json = JSON.stringify(hypothesis.toJSON());
const deserialized = Pin.from(JSON.parse(json));
assert.strictEqual(deserialized.label, hypothesis.label);
assert.strictEqual(deserialized.shape, "thought");
assert.strictEqual(deserialized.badge, "THEORY");
assert.strictEqual(deserialized.image.dataUrl, "data:image/jpeg;base64,backdrop456");
assert.strictEqual(deserialized.image.layer, "behind");

const cloned = hypothesis.clone();
cloned.setLabel("Divergent Theory");
assert.notStrictEqual(cloned.label, hypothesis.label, "Clone should be independent deep copy");
console.log("✅ Pin.toJSON(), Pin.from(), and clone(): OK");

console.log("🎉 All Pin Class tests passed successfully!");
