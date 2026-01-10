// Test tool selection logic to verify fixes
let currentTool = "pin";
let currentFamily = "pin";
let currentTypeId = "pin:circle";

function setTool(id) {
  currentTool = id;
  if (id === "text") {
    currentFamily = "pin"; // Reset to default pin family when switching to text
  }
  console.log(`setTool("${id}"): currentTool=${currentTool}, currentFamily=${currentFamily}`);
}

function setCurrentFamily(family) {
  if (family === "text") {
    setTool("text");
    currentFamily = "pin"; // Reset to default pin family
  } else {
    if (currentTool === "text") {
      setTool("pin");
    }
    currentFamily = family;
    currentTypeId = `pin:circle`; // Simplified for test
  }
  console.log(`setCurrentFamily("${family}"): currentTool=${currentTool}, currentFamily=${currentFamily}, currentTypeId=${currentTypeId}`);
}

// Test scenarios
console.log("=== Tool Selection Test ===");
console.log("Initial state:", { currentTool, currentFamily, currentTypeId });

// Test 1: Select pin tool
console.log("\n1. Clicking pin tool button:");
setTool("pin");

// Test 2: Select pin family
console.log("\n2. Selecting pin family from dropdown:");
setCurrentFamily("pin");

// Test 3: Select card family
console.log("\n3. Selecting card family from dropdown:");
setCurrentFamily("card");

// Test 4: Select area family
console.log("\n4. Selecting area family from dropdown:");
setCurrentFamily("area");

// Test 5: Select text tool
console.log("\n5. Clicking text tool button:");
setTool("text");

// Test 6: Select text family (should switch to text tool)
console.log("\n6. Selecting text family from dropdown:");
setCurrentFamily("text");

// Test 7: Select pin family again (should switch back to pin tool)
console.log("\n7. Selecting pin family after text was selected:");
setCurrentFamily("pin");

// Test 8: Select text tool again
console.log("\n8. Clicking text tool button again:");
setTool("text");

console.log("\nFinal state:", { currentTool, currentFamily, currentTypeId });
