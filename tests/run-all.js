// Unified test runner for investigative-board
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const testsDir = __dirname;
const testFiles = fs.readdirSync(testsDir)
  .filter(f => f.startsWith('test-') && f.endsWith('.js'))
  .sort();

console.log(`\n🧪 Running investigative-board test suite (${testFiles.length} suites)...\n`);

let passed = 0;
let failed = 0;

for (const file of testFiles) {
  const fullPath = path.join(testsDir, file);
  process.stdout.write(`  ⏳ ${file} ... `);
  try {
    execSync(`node "${fullPath}"`, { stdio: 'pipe' });
    console.log(`\x1b[32mPASS\x1b[0m`);
    passed++;
  } catch (err) {
    console.log(`\x1b[31mFAIL\x1b[0m`);
    console.error(err.stdout ? err.stdout.toString() : err.message);
    failed++;
  }
}

console.log(`\n========================================`);
console.log(`Results: \x1b[32m${passed} passed\x1b[0m, \x1b[${failed > 0 ? '31' : '32'}m${failed} failed\x1b[0m out of ${testFiles.length}`);
console.log(`========================================\n`);

if (failed > 0) {
  process.exit(1);
}
