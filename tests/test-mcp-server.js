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
  assert.strictEqual(resList.result.resources.length, 1);
  assert.strictEqual(resList.result.resources[0].uri, `board://${boardId}`);
  console.log("✅ MCP resources/list: OK");

  // Clean up
  fs.rmSync(testDir, { recursive: true, force: true });
  console.log("✅ All MCP Protocol tests passed successfully!");
}

testMCPServer().catch(err => {
  console.error("❌ MCP Test failed:", err);
  process.exit(1);
});
