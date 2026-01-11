// Simple test to check if person shape is registered
const fs = require('fs');

// Mock browser globals
global.window = {};
global.console = console;

// Load drawing.js content
const drawingCode = fs.readFileSync('./js/drawing.js', 'utf8');

// Extract just the shape registration parts for testing
const testCode = `
${drawingCode}

// Test if person shape is registered
console.log('shapeRenderers keys:', Array.from(shapeRenderers.keys()));
console.log('person shape exists:', shapeRenderers.has('person'));
`;

try {
  eval(testCode);
} catch (error) {
  console.error('Error:', error.message);
}
