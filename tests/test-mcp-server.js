// Test MCP Server JSON-RPC Protocol
const assert = require("assert");
const MCPServer = require("../cli/mcp-server");
const BoardStorage = require("../cli/storage");
const path = require("path");
const fs = require("fs");

async function testMCPServer() {
  console.log("=== Testing MCP Server Protocol ===");

  const testDir = path.resolve(__dirname, "test-mcp-data");
  if (fs.existsSync(testDir)) {
    fs.rmSync(testDir, { recursive: true, force: true });
  }

  const storage = new BoardStorage(testDir);
  const mcp = new MCPServer(storage);

  // 1. Initialize
  const initRes = mcp.handleMessage({
    jsonrpc: "2.0",
    id: 1,
    method: "initialize",
    params: {}
  });
  assert.strictEqual(initRes.result.serverInfo.name, "investigative-board-mcp");
  console.log("✅ MCP initialize: OK");

  // 2. Tools list
  const toolsRes = mcp.handleMessage({
    jsonrpc: "2.0",
    id: 2,
    method: "tools/list",
    params: {}
  });
  assert.ok(toolsRes.result.tools.length >= 10, "Should export at least 10 tools");
  const toolNames = toolsRes.result.tools.map(t => t.name);
  assert.ok(toolNames.includes("board_create"));
  assert.ok(toolNames.includes("pin_add"));
  assert.ok(toolNames.includes("connection_add"));
  console.log(`✅ MCP tools/list: ${toolsRes.result.tools.length} tools registered`);

  // 3. Create board via MCP
  const createRes = await mcp.handleMessage({
    jsonrpc: "2.0",
    id: 3,
    method: "tools/call",
    params: {
      name: "board_create",
      arguments: {
        title: "Agent Case 007",
        description: "Created autonomously by AI Agent"
      }
    }
  });
  const createOutput = JSON.parse(createRes.result.content[0].text);
  assert.ok(createOutput.boardId, "Should return created board ID");
  const boardId = createOutput.boardId;
  console.log("✅ MCP board_create: OK (Board ID:", boardId, ")");

  // 4. Add Pin via MCP
  const addPinRes = await mcp.handleMessage({
    jsonrpc: "2.0",
    id: 4,
    method: "tools/call",
    params: {
      name: "pin_add",
      arguments: {
        boardId,
        x: 400,
        y: 250,
        label: "AI Discovery",
        description: "Evidence analyzed by model",
        color: "#f1c40f",
        shape: "diamond"
      }
    }
  });
  const pinOutput = JSON.parse(addPinRes.result.content[0].text);
  assert.strictEqual(pinOutput.pin.label, "AI Discovery");
  console.log("✅ MCP pin_add: OK");

  // 5. Query Resources
  const resList = mcp.handleMessage({
    jsonrpc: "2.0",
    id: 5,
    method: "resources/list",
    params: {}
  });
  assert.ok(resList.result.resources.length >= 3, "Should include boards, stencils, and themes");
  assert.ok(resList.result.resources.some(r => r.uri === `board://${boardId}`));
  assert.ok(resList.result.resources.some(r => r.uri === "stencils://all"));
  assert.ok(resList.result.resources.some(r => r.uri === "themes://all"));
  console.log("✅ MCP resources/list: OK");

  // 6. Test ArtCraft Agent API: Stencil Creation & Stamping
  const stencilCreateRes = await mcp.handleMessage({
    jsonrpc: "2.0",
    id: 6,
    method: "tools/call",
    params: {
      name: "stencil_create",
      arguments: {
        id: "stencil:informant",
        title: "Confidential Informant",
        category: "Persons",
        icon: "🤫",
        badge: "INFORMANT",
        shape: "person",
        color: "#38bdf8",
        label: "Informant 'Sparrow'",
        subtitle: "Protected Witness",
        description: "Provides encrypted Intel on syndicate money transfers.",
        customFields: { handler: "Special Agent Miller", threatLevel: "high" }
      }
    }
  });
  const stencilCreated = JSON.parse(stencilCreateRes.result.content[0].text);
  assert.strictEqual(stencilCreated.stencil.badge, "INFORMANT");
  console.log("✅ MCP stencil_create: OK");

  // 7. Test Stamping Stencil onto Board
  const stencilApplyRes = await mcp.handleMessage({
    jsonrpc: "2.0",
    id: 7,
    method: "tools/call",
    params: {
      name: "stencil_apply",
      arguments: {
        boardId,
        stencilId: "stencil:informant",
        x: 600,
        y: 400,
        label: "Informant 'Sparrow' (Active)"
      }
    }
  });
  const stencilApplied = JSON.parse(stencilApplyRes.result.content[0].text);
  assert.strictEqual(stencilApplied.pin.label, "Informant 'Sparrow' (Active)");
  assert.strictEqual(stencilApplied.pin.badge, "INFORMANT");
  console.log("✅ MCP stencil_apply: OK");

  // 8. Test ArtCraft Agent API: Theme Generation
  const themeCreateRes = await mcp.handleMessage({
    jsonrpc: "2.0",
    id: 8,
    method: "tools/call",
    params: {
      name: "theme_create",
      arguments: {
        id: "tokyo-noir-1982",
        name: "Tokyo Noir 1982",
        type: "dark",
        description: "Moody rain-slicked Tokyo streets neon aesthetic",
        canvas: {
          background: "#080c14",
          gridColor: "rgba(244, 63, 94, 0.05)",
          gridMajorColor: "rgba(244, 63, 94, 0.1)"
        },
        ui: {
          background: "#0f172a",
          border: "#1e293b",
          text: "#f8fafc",
          accent: "#f43f5e"
        },
        colorSlots: {
          c1: { name: "Neon Rose", value: "#f43f5e" },
          c2: { name: "Cyber Cyan", value: "#06b6d4" },
          c3: { name: "Matrix Emerald", value: "#10b981" },
          c4: { name: "Tokyo Amber", value: "#f59e0b" },
          c5: { name: "Syndicate Purple", value: "#8b5cf6" },
          c6: { name: "Hazard Orange", value: "#ea580c" },
          c7: { name: "Sakura Pink", value: "#ec4899" },
          c8: { name: "Electric Blue", value: "#3b82f6" }
        }
      }
    }
  });
  const themeCreated = JSON.parse(themeCreateRes.result.content[0].text);
  assert.strictEqual(themeCreated.theme.id, "tokyo-noir-1982");
  console.log("✅ MCP theme_create: OK");

  // 9. Test Theme Apply
  const themeApplyRes = await mcp.handleMessage({
    jsonrpc: "2.0",
    id: 9,
    method: "tools/call",
    params: {
      name: "theme_apply",
      arguments: {
        boardId,
        themeId: "tokyo-noir-1982"
      }
    }
  });
  const themeApplied = JSON.parse(themeApplyRes.result.content[0].text);
  assert.strictEqual(themeApplied.theme.name, "Tokyo Noir 1982");
  console.log("✅ MCP theme_apply: OK");

  // 10. Test Custom Shape Registration
  const shapeRegRes = await mcp.handleMessage({
    jsonrpc: "2.0",
    id: 10,
    method: "tools/call",
    params: {
      name: "shape_register",
      arguments: {
        name: "fingerprint",
        description: "Forensic biometric fingerprint marker",
        baseShape: "rect",
        width: 32,
        height: 40
      }
    }
  });
  const shapeRegistered = JSON.parse(shapeRegRes.result.content[0].text);
  assert.strictEqual(shapeRegistered.shape.name, "fingerprint");
  console.log("✅ MCP shape_register: OK");

  // Clean up
  fs.rmSync(testDir, { recursive: true, force: true });
  console.log("✅ All MCP Protocol tests passed successfully!");
}

testMCPServer().catch(err => {
  console.error("❌ MCP Test failed:", err);
  process.exit(1);
});
