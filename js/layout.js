// ============================================================================
// LAYOUT SYSTEM MODULE - Layout algorithms and worker management
// ============================================================================

// Layout Strategy Registry - Strategy Pattern for extensible layouts
const LAYOUT_STRATEGIES = {
  timeline: layoutTimeline,
  default: (mode) => startLayoutWorker(mode),
  force: (mode) => startLayoutWorker(mode),
  // Future layouts can be added here:
  // grid: layoutGrid,
  // circle: layoutCircle,
  // hierarchical: layoutHierarchical
};

/**
 * Apply a layout algorithm to the pins using Strategy Pattern
 */
function applyLayout(mode) {
  if (isWorkerProcessing) return; // Prevent concurrent requests

  // Stop any currently running layout
  if (isLayoutSimulating) {
    stopLayout();
  }

  // Get the appropriate strategy or fall back to default
  const strategy = LAYOUT_STRATEGIES[mode] || LAYOUT_STRATEGIES.default;
  strategy(mode);
}

// Request ID counter for preventing race conditions
let currentRequestId = 0;

/**
 * Start the layout worker for force-directed layouts
 */
function startLayoutWorker(layoutMode = "default") {
  if (!layoutWorker) {
    console.error("Web Worker not available");
    return;
  }

  if (isWorkerProcessing) {
    console.warn("Worker already processing, ignoring request");
    return;
  }

  isWorkerProcessing = true;
  isLayoutSimulating = true;

  // Generate unique request ID
  const requestId = ++currentRequestId;

  // Set up error handling and timeout
  const timeoutId = setTimeout(() => {
    if (isWorkerProcessing) {
      console.error("Worker timeout - resetting layout state");
      isWorkerProcessing = false;
      isLayoutSimulating = false;
    }
  }, 30000); // 30 second timeout

  // Add error handler to worker
  const errorHandler = (error) => {
    console.error("Worker error:", error);
    clearTimeout(timeoutId);
    isWorkerProcessing = false;
    isLayoutSimulating = false;
    layoutWorker.removeEventListener('error', errorHandler);
  };

  layoutWorker.addEventListener('error', errorHandler);

  // Send layout request to worker with request ID
  layoutWorker.postMessage({
    command: "start",
    requestId: requestId,
    pins: pins.map((p, index) => ({
      index,
      x: p.x,
      y: p.y,
      typeId: p.typeId,
      color: p.color
    })),
    connections: connections.map(c => ({
      startIndex: c.startIndex,
      endIndex: c.endIndex
    })),
    layoutMode: layoutMode
  });

  // Store timeout ID for cleanup
  layoutWorker._currentTimeoutId = timeoutId;
  layoutWorker._currentRequestId = requestId;
}

/**
 * Stop the current layout simulation
 */
function stopLayout() {
  if (layoutWorker && isWorkerProcessing) {
    layoutWorker.postMessage({ command: "stop" });
  }
  isLayoutSimulating = false;
  isWorkerProcessing = false;
}

/**
 * Toggle force-directed layout simulation (legacy function)
 */
function toggleForceLayout() {
  if (isLayoutSimulating) {
    stopLayout();
  } else {
    applyLayout("default");
  }
}

/**
 * Layout pins as a timeline based on dates
 */
function layoutTimeline() {
  const timedPins = pins.filter(p => p.date && p.date.trim() !== "");

  if (timedPins.length === 0) {
    console.warn("No pins with dates found for timeline layout");
    return;
  }

  // Parse dates and sort
  const parsedPins = timedPins.map(pin => {
    const parsed = parseDate(pin.date);
    return {
      pin,
      dateObj: parsed.dateObj,
      dateStr: parsed.dateStr,
      timestamp: parsed.timestamp
    };
  }).filter(tp => tp.timestamp !== null)
    .sort((a, b) => a.timestamp - b.timestamp);

  if (parsedPins.length === 0) {
    console.warn("Could not parse any dates for timeline layout");
    return;
  }

  // Calculate timeline bounds
  const minX = Math.min(...parsedPins.map(tp => tp.pin.x));
  const maxX = Math.max(...parsedPins.map(tp => tp.pin.x));
  const lowestY = Math.max(...parsedPins.map(tp => tp.pin.y));

  // Use fixed world unit values instead of scale-dependent calculations
  // This ensures consistent layout regardless of zoom level
  const horizontalPaddingWorld = 100; // World units
  const footerMarginWorld = 120; // World units
  const offsetWorld = 80; // World units

  timelinePins = parsedPins;
  timelineY = lowestY + footerMarginWorld;
  timelineLeft = minX - horizontalPaddingWorld;
  timelineRight = maxX + horizontalPaddingWorld;
  const worldSpan = timelineRight - timelineLeft || 1;

  // Position pins along timeline
  parsedPins.forEach((tp, i) => {
    const t = (tp.timestamp - parsedPins[0].timestamp) /
              (parsedPins[parsedPins.length - 1].timestamp - parsedPins[0].timestamp || 1);
    tp.pin.x = timelineLeft + t * worldSpan;
    tp.pin.y = timelineY + (i % 2 === 0 ? -offsetWorld : offsetWorld);
  });

  timelineActive = true;
  saveState();
  draw();
}

/**
 * Parse a flexible date format
 */
function parseDate(dateStr) {
  const clean = dateStr.trim();
  let dateObj = null;
  let timestamp = null;
  let dateStrNormalized = clean;

  // Try various date formats
  const formats = [
    // YYYY-MM-DD
    /^(\d{4})-(\d{2})-(\d{2})$/,
    // MM/DD/YYYY or MM-DD-YYYY
    /^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/,
    // Month DD, YYYY
    /^([A-Za-z]+)\s+(\d{1,2}),?\s+(\d{4})$/,
    // Month YYYY
    /^([A-Za-z]+)\s+(\d{4})$/,
    // YYYY only
    /^(\d{4})$/
  ];

  for (const format of formats) {
    const match = clean.match(format);
    if (match) {
      try {
        if (format === /^(\d{4})-(\d{2})-(\d{2})$/) { // YYYY-MM-DD
          dateObj = new Date(match[1], match[2] - 1, match[3]);
          timestamp = dateObj.getTime();
        } else if (format === /^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/) { // MM/DD/YYYY or MM-DD-YYYY
          dateObj = new Date(match[3], match[1] - 1, match[2]);
          timestamp = dateObj.getTime();
        } else if (format === /^([A-Za-z]+)\s+(\d{1,2}),?\s+(\d{4})$/) { // Month DD, YYYY
          const monthNames = ["jan", "feb", "mar", "apr", "may", "jun",
                             "jul", "aug", "sep", "oct", "nov", "dec"];
          const month = monthNames.indexOf(match[1].toLowerCase().substring(0, 3));
          if (month !== -1) {
            dateObj = new Date(match[3], month, match[2]);
            timestamp = dateObj.getTime();
          }
        } else if (format === /^([A-Za-z]+)\s+(\d{4})$/) { // Month YYYY
          const monthNames = ["jan", "feb", "mar", "apr", "may", "jun",
                             "jul", "aug", "sep", "oct", "nov", "dec"];
          const month = monthNames.indexOf(match[1].toLowerCase().substring(0, 3));
          if (month !== -1) {
            dateObj = new Date(match[2], month, 1);
            timestamp = dateObj.getTime();
          }
        } else if (format === /^(\d{4})$/) { // YYYY only
          dateObj = new Date(match[1], 0, 1);
          timestamp = dateObj.getTime();
        }
        if (dateObj && !isNaN(timestamp)) {
          break;
        }
      } catch (e) {
        continue;
      }
    }
  }

  return { dateObj, dateStr: dateStrNormalized, timestamp };
}
