/**
 * Live Sync Bridge
 * Connects the web canvas to the local BoardServer SSE feed (/api/events)
 * Allows AI Agents operating via MCP or CLI to live-update the canvas in real time.
 */

(function() {
  if (typeof window === 'undefined' || typeof EventSource === 'undefined') return;

  // Only attempt connection if loaded from an HTTP/HTTPS server
  if (!window.location.protocol.startsWith('http')) return;

  let eventSource = null;
  let reconnectTimeout = null;

  function connect() {
    try {
      eventSource = new EventSource('/api/events');

      eventSource.addEventListener('connected', () => {
        console.log('📡 Connected to Agent Live Sync Bridge');
      });

      eventSource.addEventListener('board-updated', (e) => {
        try {
          const data = JSON.parse(e.data);
          console.log('📡 Agent Live Sync: board-updated', data);

          if (!window.app || !window.app.boardManager) return;
          const currentId = window.app.boardManager.getActiveBoardId();

          if (currentId === data.boardId) {
            // Reload the active board from storage
            window.app.boardManager.loadBoard(currentId);
            if (window.app.syncGlobalVariables) window.app.syncGlobalVariables();
            if (window.app.render) window.app.render();
            if (window.app.trayManager) window.app.trayManager.render();
          }
        } catch (err) {
          console.warn('⚠️ Error processing live sync update:', err);
        }
      });

      eventSource.addEventListener('board-created', (e) => {
        try {
          const data = JSON.parse(e.data);
          console.log('📡 Agent Live Sync: new board created', data);
          if (window.app?.boardPickerUI?.isOpen) {
            window.app.boardPickerUI._render();
          }
        } catch (err) {}
      });

      // --- ArtCraft Dynamic Stencil, Theme, and Shape Events ---
      eventSource.addEventListener('stencil-created', (e) => {
        try {
          const data = JSON.parse(e.data);
          console.log('📡 Agent Live Sync: stencil-created', data);
          if (window.stencilDock && typeof window.stencilDock.registerCustomStencil === 'function') {
            window.stencilDock.registerCustomStencil(data.stencil, false);
          }
        } catch (err) {
          console.warn('⚠️ Error processing stencil-created event:', err);
        }
      });

      eventSource.addEventListener('stencil-deleted', (e) => {
        try {
          const data = JSON.parse(e.data);
          console.log('📡 Agent Live Sync: stencil-deleted', data);
          if (window.stencilDock && typeof window.stencilDock.removeCustomStencil === 'function') {
            window.stencilDock.removeCustomStencil(data.stencilId);
          }
        } catch (err) {}
      });

      eventSource.addEventListener('theme-created', (e) => {
        try {
          const data = JSON.parse(e.data);
          console.log('📡 Agent Live Sync: theme-created', data);
          if (window.SchemaManager && typeof window.SchemaManager.registerTheme === 'function') {
            window.SchemaManager.registerTheme(data.theme);
          }
        } catch (err) {}
      });

      eventSource.addEventListener('theme-applied', (e) => {
        try {
          const data = JSON.parse(e.data);
          console.log('📡 Agent Live Sync: theme-applied', data);
          if (window.app && typeof window.app.setTheme === 'function') {
            window.app.setTheme(data.themeId);
          } else if (window.SchemaManager && typeof window.SchemaManager.applyThemeToUI === 'function') {
            window.SchemaManager.applyThemeToUI(data.themeId);
          }
          if (window.app?.render) window.app.render();
        } catch (err) {}
      });

      eventSource.addEventListener('shape-registered', (e) => {
        try {
          const data = JSON.parse(e.data);
          console.log('📡 Agent Live Sync: shape-registered', data);
          if (typeof window.registerCustomShape === 'function') {
            window.registerCustomShape(data.shape);
          }
        } catch (err) {}
      });

      eventSource.onerror = () => {
        if (eventSource) {
          eventSource.close();
          eventSource = null;
        }
        if (!reconnectTimeout) {
          reconnectTimeout = setTimeout(() => {
            reconnectTimeout = null;
            connect();
          }, 5000);
        }
      };
    } catch (e) {
      // Quiet fail if not in a sync server environment
    }
  }

  // Connect when document is loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', connect);
  } else {
    connect();
  }
})();
