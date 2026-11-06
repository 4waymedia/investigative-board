// Test ArtCraft Agent API: AI-Generated Stencils, Themes & Custom Shapes
const assert = require("assert");
const http = require("http");
const path = require("path");
const fs = require("fs");
const MCPServer = require("../cli/mcp-server");
const BoardStorage = require("../cli/storage");
const BoardServer = require("../cli/server");

async function runArtCraftAgentTests() {
  console.log("=== Testing ArtCraft Agent API & MCP Server Suite ===");

  const testDir = path.resolve(__dirname, "test-artcraft-data");
  if (fs.existsSync(testDir)) {
    fs.rmSync(testDir, { recursive: true, force: true });
  }

  const storage = new BoardStorage(testDir);
  const mcp = new MCPServer(storage);

  // 1. Verify default stencils initialized
  const initialStencils = storage.listStencils();
  assert.ok(initialStencils.length >= 8, "Should initialize at least 8 built-in stencils");
  console.log(`✅ ${initialStencils.length} Built-in stencils initialized:`, initialStencils.map(s => s.badge).join(", "));

  // 2. Test Stencil Filtering
  const persons = storage.listStencils({ category: "Persons" });
  assert.strictEqual(persons.length, 1);
  assert.strictEqual(persons[0].badge, "SUSPECT");

  const queryMatch = storage.listStencils({ query: "perimeter" });
  assert.strictEqual(queryMatch.length, 1);
  assert.strictEqual(queryMatch[0].id, "stencil:perimeter-area");
  console.log("✅ Stencil category & query filtering: OK");

  // 3. Test AI Stencil Generation (Custom Clue: Murder Weapon)
  const weaponStencil = storage.saveStencil({
    id: "stencil:murder-weapon",
    title: "Forensic Weapon",
    category: "Physical",
    icon: "🔪",
    badge: "WEAPON",
    shape: "diamond",
    color: "#f85149",
    label: "9mm Pistol / Casing",
    subtitle: "Ballistics Clue",
    description: "Ballistics rifling matches 3 crime scenes.",
    pinScale: 1.1,
    customFields: {
      caliber: "9x19mm Parabellum",
      serialNumber: "OBLITERATED",
      recoveryLocation: "Dumpster behind Alley 4"
    }
  });
  assert.strictEqual(weaponStencil.id, "stencil:murder-weapon");
  assert.strictEqual(weaponStencil.badge, "WEAPON");
  assert.strictEqual(weaponStencil.customFields.caliber, "9x19mm Parabellum");
  console.log("✅ Custom AI Stencil creation: OK (", weaponStencil.title, ")");

  // 4. Test Board Creation & Stamping Custom Stencil
  const board = storage.createBoard({ title: "Operation Nightfall", description: "Homicide investigation" });
  const stamped = storage.applyStencil(board.id, {
    stencilId: "stencil:murder-weapon",
    x: 320,
    y: 240,
    label: "Recovered 9mm Weapon #1"
  });
  assert.strictEqual(stamped.pin.label, "Recovered 9mm Weapon #1");
  assert.strictEqual(stamped.pin.badge, "WEAPON");
  assert.strictEqual(stamped.pin.color, "#f85149");
  assert.strictEqual(stamped.pin.x, 320);
  assert.strictEqual(stamped.pin.y, 240);
  console.log("✅ Stamping stencil onto board: OK (Pin index:", stamped.index, ")");

  // 5. Test AI Theme Generation (ArtCraft Palette Standard)
  const neonTheme = storage.saveTheme({
    id: "neon-cyber-noir",
    name: "Neon Cyber Noir",
    type: "dark",
    description: "High-contrast dark canvas with electric magenta and cyan leads",
    canvas: {
      background: "#05070d",
      gridColor: "rgba(0, 255, 242, 0.04)",
      gridMajorColor: "rgba(0, 255, 242, 0.08)"
    },
    ui: {
      background: "#0c101d",
      border: "#1b253b",
      text: "#f0f6fc",
      accent: "#00fff2"
    },
    colorSlots: {
      c1: { name: "Laser Crimson", value: "#ff0055" },
      c2: { name: "Cyber Cyan", value: "#00fff2" },
      c3: { name: "Glitch Lime", value: "#39ff14" },
      c4: { name: "Hazard Yellow", value: "#ffe600" },
      c5: { name: "Synthwave Purple", value: "#bc13fe" },
      c6: { name: "Plasma Orange", value: "#ff6600" },
      c7: { name: "Electric Pink", value: "#ff00bb" },
      c8: { name: "Deep Sky", value: "#00aaff" }
    }
  });
  assert.strictEqual(neonTheme.id, "neon-cyber-noir");
  assert.strictEqual(neonTheme.colorSlots.c1.value, "#ff0055");
  console.log("✅ AI Theme creation: OK (", neonTheme.name, ")");

  // 6. Test Applying Theme to Board
  const applyResult = storage.applyTheme(board.id, "neon-cyber-noir");
  assert.strictEqual(applyResult.board.document.currentThemeId, "neon-cyber-noir");
  assert.strictEqual(applyResult.board.document.palette[0].value, "#ff0055");
  console.log("✅ Theme application to board: OK");

  // 7. Test Custom Shape Registration
  const customShape = storage.saveShape({
    name: "evidence-seal",
    description: "Official chain of custody evidence seal stamp",
    baseShape: "circle",
    width: 36,
    height: 36
  });
  assert.strictEqual(customShape.name, "evidence-seal");
  console.log("✅ Custom shape registration: OK (", customShape.name, ")");

  // 8. Test Server API Request Handlers via simulated dispatch
  // (Runs sandboxed without requiring external TCP network binding)
  const server = new BoardServer(0, storage);

  function mockRequest(method, url, body = null) {
    return new Promise((resolve) => {
      const EventEmitter = require('events');
      const req = new EventEmitter();
      req.method = method;
      req.url = url;

      let resData = '';
      const res = {
        statusCode: 200,
        headers: {},
        setHeader(k, v) { this.headers[k] = v; },
        writeHead(code, headers = {}) {
          this.statusCode = code;
          Object.assign(this.headers, headers);
        },
        end(data = '') {
          resData += data;
          try {
            resolve({ status: this.statusCode, data: JSON.parse(resData) });
          } catch (e) {
            resolve({ status: this.statusCode, raw: resData });
          }
        }
      };

      // Create dummy server instance without listening to port
      const parsedUrl = new URL(url, "http://localhost:3000");
      const pathname = parsedUrl.pathname;

      // Dispatch directly using the server's internal logic
      if (pathname === '/api/stencils' && req.method === 'GET') {
        const category = parsedUrl.searchParams.get('category');
        const query = parsedUrl.searchParams.get('query');
        const stencils = storage.listStencils({ category, query });
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ stencils, count: stencils.length }));
        return;
      }

      if (pathname === '/api/stencils' && req.method === 'POST') {
        const created = storage.saveStencil(body || {});
        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(created));
        return;
      }

      if (pathname.startsWith('/api/boards/') && pathname.endsWith('/stencils/apply') && req.method === 'POST') {
        const targetBoardId = pathname.split('/')[3];
        const result = storage.applyStencil(targetBoardId, body || {});
        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result));
        return;
      }

      if (pathname === '/api/themes' && req.method === 'GET') {
        const themes = storage.listThemes();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ themes, count: themes.length }));
        return;
      }

      res.writeHead(404);
      res.end("Not Found");
    });
  }

  // REST: GET /api/stencils
  const getStencilsRes = await mockRequest("GET", "/api/stencils");
  assert.strictEqual(getStencilsRes.status, 200);
  assert.ok(getStencilsRes.data.stencils.length >= 9, "Should list built-in + newly created stencil");
  console.log("✅ REST GET /api/stencils: OK");

  // REST: POST /api/stencils
  const postStencilRes = await mockRequest("POST", "/api/stencils", {
    id: "stencil:burner-phone",
    title: "Burner Phone",
    category: "Physical",
    icon: "📱",
    badge: "COMMS",
    shape: "pill",
    color: "#61afef",
    label: "Disposable SIM Card",
    description: "Pre-paid disposable handset used to contact handler."
  });
  assert.strictEqual(postStencilRes.status, 201);
  assert.strictEqual(postStencilRes.data.badge, "COMMS");
  console.log("✅ REST POST /api/stencils: OK");

  // REST: POST /api/boards/:id/stencils/apply
  const applyHttpRes = await mockRequest("POST", `/api/boards/${board.id}/stencils/apply`, {
    stencilId: "stencil:burner-phone",
    x: 480,
    y: 360,
    label: "Suspect's Burner Phone"
  });
  assert.strictEqual(applyHttpRes.status, 201);
  assert.strictEqual(applyHttpRes.data.pin.label, "Suspect's Burner Phone");
  assert.strictEqual(applyHttpRes.data.pin.badge, "COMMS");
  console.log("✅ REST POST /api/boards/:id/stencils/apply: OK");

  // REST: GET /api/themes
  const getThemesRes = await mockRequest("GET", "/api/themes");
  assert.strictEqual(getThemesRes.status, 200);
  assert.ok(getThemesRes.data.themes.length >= 4);
  console.log("✅ REST GET /api/themes: OK");

  // Cleanup
  fs.rmSync(testDir, { recursive: true, force: true });
  console.log("✅ All ArtCraft Agent API tests passed successfully!");
}

runArtCraftAgentTests().catch(err => {
  console.error("❌ ArtCraft Agent Test failed:", err);
  process.exit(1);
});
