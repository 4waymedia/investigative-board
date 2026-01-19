/**
 * Application Bootstrap Module
 * Orchestrates the loading order of modules to prevent initialization race conditions
 */

/**
 * Main Application Bootstrap
 * Orchestrates the loading order of modules to ensure themes are loaded before state
 */
async function bootstrap() {
  try {
    console.log("🚀 Starting Application Bootstrap...");

    // 1. Initialize Themes first (Async)
    // This populates the THEMES array from the JSON or fallback
    console.log("📦 Loading themes...");
    await loadThemes();
    console.log("✅ Themes loaded and THEMES array populated");

    // 2. Setup the UI components
    console.log("🎨 Initializing UI components...");
    initializeThemes(); // Renders the dropdown and sets up event handlers
    console.log("✅ UI components initialized");

    // 3. Load User State
    // Now that themes are ready, loadState can safely call applySavedThemeWithColor
    console.log("💾 Loading user state...");
    const stateLoaded = loadState();
    if (stateLoaded) {
      console.log("✅ User state loaded from localStorage");
    } else {
      console.log("ℹ️ No saved state found, using defaults");
    }

    // 4. Apply any pending theme from state loading
    console.log("🎨 Applying saved theme...");
    applyPendingTheme();
    console.log("✅ Theme applied");

    // 5. Start the Render Loop
    // Ensure the canvas is ready for the first frame
    console.log("🎬 Starting render loop...");
    if (typeof draw === 'function') {
      draw();
      console.log("✅ Initial render complete");
    } else {
      console.warn("⚠️ draw function not available, render loop not started");
    }

    console.log("✅ Bootstrap Complete - Application Ready!");
  } catch (error) {
    console.error("❌ Critical Startup Error:", error);
    // Attempt to start with minimal functionality
    console.log("🔄 Attempting minimal startup...");
    try {
      initializeThemes();
      if (typeof draw === 'function') {
        draw();
      }
      console.log("⚠️ Minimal startup complete - some features may not work");
    } catch (fallbackError) {
      console.error("❌ Minimal startup also failed:", fallbackError);
    }
  }
}

// Export for potential use in other modules
window.bootstrap = bootstrap;

// Start the app when the DOM is fully loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrap);
} else {
  // DOM already loaded, start immediately
  bootstrap();
}
