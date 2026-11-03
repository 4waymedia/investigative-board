// ============================================================================
// SCHEMA MODULE - Board Structure, Color Slots, and Theme Definitions
// ============================================================================
// This module defines the schema for boards, pins, connections, color slots,
// and themes. Colors are assigned to slots (c1, c2, c3...) so themes can be
// swapped while preserving color relationships.
// ============================================================================

// ============================================================================
// COLOR SLOT DEFINITIONS
// ============================================================================
// Each theme defines colors for these slots. Pins reference slots, not hex values.
// This allows theme switching while maintaining color relationships.

let COLOR_SLOTS = ["c1", "c2", "c3", "c4", "c5", "c6", "c7", "c8"];

// ============================================================================
// PREBUILT COLOR PALETTES
// ============================================================================

const PREBUILT_PALETTES = {
  "github-dark": {
    name: "GitHub Dark",
    colors: ["#f85149", "#58a6ff", "#3fb950", "#f1c40f", "#a471f7", "#ff7b00", "#ec4899", "#06b6d4"]
  },
  "earth-tones": {
    name: "Earth Tones",
    colors: ["#E5D9C6", "#B6A37A", "#4D3726", "#2C211C", "#A27243", "#8B7355", "#D4C4A8", "#6B5344"]
  },
  "ocean-breeze": {
    name: "Ocean Breeze",
    colors: ["#0077B6", "#00B4D8", "#90E0EF", "#CAF0F8", "#03045E", "#023E8A", "#0096C7", "#48CAE4"]
  },
  "sunset-warm": {
    name: "Sunset Warm",
    colors: ["#FF6B6B", "#FFA07A", "#FFD93D", "#FFE66D", "#C9184A", "#FF4D6D", "#FF8C42", "#FFC145"]
  },
  "forest-green": {
    name: "Forest Green",
    colors: ["#2D5016", "#4A7C23", "#6B8E23", "#8FBC8F", "#228B22", "#006400", "#32CD32", "#90EE90"]
  },
  "neon-cyber": {
    name: "Neon Cyber",
    colors: ["#FF00FF", "#00FFFF", "#FF6B6B", "#4ECDC4", "#FFE66D", "#95E1D3", "#A855F7", "#38BDF8"]
  },
  "pastel-soft": {
    name: "Pastel Soft",
    colors: ["#FFB5BA", "#BFECFF", "#CDC1FF", "#FFF8B8", "#CAFFBF", "#FDFFB6", "#FFD6A5", "#A0C4FF"]
  },
  "monochrome": {
    name: "Monochrome",
    colors: ["#1a1a1a", "#333333", "#4d4d4d", "#666666", "#808080", "#999999", "#b3b3b3", "#cccccc"]
  },
  "vintage-retro": {
    name: "Vintage Retro",
    colors: ["#D4A574", "#C4956A", "#A67C52", "#8B6914", "#CD853F", "#DEB887", "#BC8F8F", "#F4A460"]
  },
  "nordic-frost": {
    name: "Nordic Frost",
    colors: ["#5E81AC", "#81A1C1", "#88C0D0", "#8FBCBB", "#BF616A", "#D08770", "#EBCB8B", "#A3BE8C"]
  },
  "berry-punch": {
    name: "Berry Punch",
    colors: ["#9B2335", "#C41E3A", "#DC143C", "#FF1493", "#FF69B4", "#DB7093", "#C71585", "#8B008B"]
  },
  "material-dark": {
    name: "Material Dark",
    colors: ["#EF5350", "#42A5F5", "#66BB6A", "#FFCA28", "#AB47BC", "#FF7043", "#EC407A", "#26C6DA"]
  }
};

// ============================================================================
// COLOR UTILITY FUNCTIONS
// ============================================================================
// Functions for generating color variants (highlight, shadow, text, selected)

const ColorUtils = {
  /**
   * Convert hex to RGB
   */
  hexToRgb(hex) {
    if (!hex) return null;
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  },

  /**
   * Convert RGB to hex
   */
  rgbToHex(r, g, b) {
    return "#" + [r, g, b].map(x => {
      const hex = Math.max(0, Math.min(255, Math.round(x))).toString(16);
      return hex.length === 1 ? "0" + hex : hex;
    }).join("");
  },

  /**
   * Convert RGB to HSL
   */
  rgbToHsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;

    if (max === min) {
      h = s = 0;
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
        case g: h = ((b - r) / d + 2) / 6; break;
        case b: h = ((r - g) / d + 4) / 6; break;
      }
    }
    return { h: h * 360, s: s * 100, l: l * 100 };
  },

  /**
   * Convert HSL to RGB
   */
  hslToRgb(h, s, l) {
    h /= 360; s /= 100; l /= 100;
    let r, g, b;

    if (s === 0) {
      r = g = b = l;
    } else {
      const hue2rgb = (p, q, t) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1/6) return p + (q - p) * 6 * t;
        if (t < 1/2) return q;
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
      };
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1/3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1/3);
    }
    return { r: r * 255, g: g * 255, b: b * 255 };
  },

  /**
   * Lighten a color by a percentage
   */
  lighten(hex, percent = 15) {
    const rgb = this.hexToRgb(hex);
    if (!rgb) return hex;
    const hsl = this.rgbToHsl(rgb.r, rgb.g, rgb.b);
    hsl.l = Math.min(100, hsl.l + percent);
    const newRgb = this.hslToRgb(hsl.h, hsl.s, hsl.l);
    return this.rgbToHex(newRgb.r, newRgb.g, newRgb.b);
  },

  /**
   * Darken a color by a percentage
   */
  darken(hex, percent = 20) {
    const rgb = this.hexToRgb(hex);
    if (!rgb) return hex;
    const hsl = this.rgbToHsl(rgb.r, rgb.g, rgb.b);
    hsl.l = Math.max(0, hsl.l - percent);
    const newRgb = this.hslToRgb(hsl.h, hsl.s, hsl.l);
    return this.rgbToHex(newRgb.r, newRgb.g, newRgb.b);
  },

  /**
   * Saturate a color by a percentage
   */
  saturate(hex, percent = 10) {
    const rgb = this.hexToRgb(hex);
    if (!rgb) return hex;
    const hsl = this.rgbToHsl(rgb.r, rgb.g, rgb.b);
    hsl.s = Math.min(100, hsl.s + percent);
    const newRgb = this.hslToRgb(hsl.h, hsl.s, hsl.l);
    return this.rgbToHex(newRgb.r, newRgb.g, newRgb.b);
  },

  /**
   * Calculate relative luminance for contrast
   */
  luminance(hex) {
    const rgb = this.hexToRgb(hex);
    if (!rgb) return 0;
    const [r, g, b] = [rgb.r, rgb.g, rgb.b].map(v => {
      v /= 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  },

  /**
   * Get contrasting text color (black or white)
   */
  contrastText(hex) {
    const lum = this.luminance(hex);
    return lum > 0.179 ? "#000000" : "#ffffff";
  },

  /**
   * Generate all color variants from a base color
   */
  generateVariants(baseColor, themeDefaults = {}) {
    if (!baseColor) return { value: "#808080" };
    
    return {
      value: baseColor,
      highlight: themeDefaults.highlight || this.lighten(baseColor, 15),
      shadow: themeDefaults.shadow || this.darken(baseColor, 25),
      text: themeDefaults.text || this.contrastText(baseColor),
      selected: themeDefaults.selected || this.lighten(this.saturate(baseColor, 15), 20),
    };
  },

  /**
   * Ensure a color slot has all required properties
   */
  ensureFullSlot(slot, themeDefaults = {}) {
    if (!slot || !slot.value) return slot;
    
    return {
      name: slot.name || "Color",
      value: slot.value,
      highlight: slot.highlight || themeDefaults.highlight || this.lighten(slot.value, 15),
      shadow: slot.shadow || themeDefaults.shadow || this.darken(slot.value, 25),
      text: slot.text || themeDefaults.text || this.contrastText(slot.value),
      selected: slot.selected || themeDefaults.selected || this.lighten(this.saturate(slot.value, 15), 20),
    };
  }
};

// Export ColorUtils globally
window.ColorUtils = ColorUtils;

// ============================================================================
// THEME DEFINITIONS
// ============================================================================
// Each theme maps color slots to actual hex values

const DEFAULT_THEME = {
  id: "dark",
  name: "Dark",
  description: "Default dark theme",
  
  // Color slots - the core of the theme system
  // Each slot can have: { name, value, highlight, shadow, text, selected }
  // Missing properties are auto-generated by ColorUtils
  colorSlots: {
    c1: { name: "Red", value: "#f85149" },
    c2: { name: "Blue", value: "#58a6ff" },
    c3: { name: "Green", value: "#3fb950" },
    c4: { name: "Yellow", value: "#f1c40f" },
    c5: { name: "Purple", value: "#a471f7" },
    c6: { name: "Orange", value: "#ff7b00" },
    c7: { name: "Pink", value: "#ec4899" },
    c8: { name: "Cyan", value: "#06b6d4" },
  },
  
  // Optional theme-level defaults for color variants
  // If set, these override auto-generated values for all slots
  colorDefaults: {
    // highlight: null,  // Use auto-generated
    // shadow: null,     // Use auto-generated
    // text: null,       // Use auto-generated
    // selected: null,   // Use auto-generated
  },
  
  // Canvas colors
  canvas: {
    background: "#0d1117",
    gridColor: "rgba(255, 255, 255, 0.03)",
    gridMajorColor: "rgba(255, 255, 255, 0.06)",
  },
  
  // UI colors
  ui: {
    background: "#161b22",
    backgroundAlt: "#21262d",
    border: "#30363d",
    text: "#e6edf3",
    textMuted: "#8b949e",
    accent: "#2383e0",
    accentHover: "#3694f0",
    danger: "#f85149",
    warning: "#f0883e",
    success: "#3fb950",
  },
  
  // Selection animation settings
  selection: {
    ringColor: "#58a6ff",       // Default selection ring color
    glowColor: "rgba(88, 166, 255, 0.4)",
    animationSpeed: 2000,       // ms for full animation cycle
  },
  
  // Background layers
  background: {
    layers: [
      { type: "solid", color: "#0d1117" },
      { type: "pattern", pattern: "vignette", color: "rgba(0,0,0,0.3)" }
    ]
  },
  
  // Connection default color
  connectionDefault: "#666666",
};

const LIGHT_THEME = {
  id: "light",
  name: "Light",
  description: "Light theme for bright environments",
  
  colorSlots: {
    c1: { name: "Red", value: "#cf222e" },
    c2: { name: "Blue", value: "#0969da" },
    c3: { name: "Green", value: "#1a7f37" },
    c4: { name: "Yellow", value: "#bf8700" },
    c5: { name: "Purple", value: "#8250df" },
    c6: { name: "Orange", value: "#bc4c00" },
    c7: { name: "Pink", value: "#bf3989" },
    c8: { name: "Cyan", value: "#0598bc" },
  },
  
  canvas: {
    background: "#ffffff",
    gridColor: "rgba(0, 0, 0, 0.05)",
    gridMajorColor: "rgba(0, 0, 0, 0.1)",
  },
  
  ui: {
    background: "#f6f8fa",
    backgroundAlt: "#eaeef2",
    border: "#d0d7de",
    text: "#1f2328",
    textMuted: "#656d76",
    accent: "#0969da",
    accentHover: "#0860c4",
    danger: "#cf222e",
    warning: "#bf8700",
    success: "#1a7f37",
  },
  
  background: {
    layers: [
      { type: "solid", color: "#ffffff" },
      { type: "pattern", pattern: "noise", opacity: 0.02 }
    ]
  },
  
  connectionDefault: "#656d76",
};

const MIDNIGHT_THEME = {
  id: "midnight",
  name: "Midnight",
  description: "Deep blue dark theme",
  
  colorSlots: {
    c1: { name: "Rose", value: "#ef4444" },
    c2: { name: "Indigo", value: "#6366f1" },
    c3: { name: "Emerald", value: "#10b981" },
    c4: { name: "Amber", value: "#f59e0b" },
    c5: { name: "Violet", value: "#8b5cf6" },
    c6: { name: "Orange", value: "#f97316" },
    c7: { name: "Pink", value: "#f43f5e" },
    c8: { name: "Teal", value: "#14b8a6" },
  },
  
  canvas: {
    background: "#0a0e1a",
    gridColor: "rgba(100, 150, 255, 0.03)",
    gridMajorColor: "rgba(100, 150, 255, 0.06)",
  },
  
  ui: {
    background: "#111827",
    backgroundAlt: "#1f2937",
    border: "#374151",
    text: "#f9fafb",
    textMuted: "#9ca3af",
    accent: "#6366f1",
    accentHover: "#818cf8",
    danger: "#ef4444",
    warning: "#f59e0b",
    success: "#10b981",
  },
  
  background: {
    layers: [
      { type: "solid", color: "#0a0e1a" },
      { type: "gradient", value: "radial-gradient(ellipse at 30% 20%, rgba(99, 102, 241, 0.12) 0%, transparent 50%)" },
      { type: "gradient", value: "radial-gradient(ellipse at 70% 80%, rgba(139, 92, 246, 0.08) 0%, transparent 40%)" }
    ]
  },
  
  connectionDefault: "#4b5563",
};

const SEPIA_THEME = {
  id: "sepia",
  name: "Sepia",
  description: "Warm vintage theme",
  
  colorSlots: {
    c1: { name: "Rust", value: "#c44536" },
    c2: { name: "Gold", value: "#c9a227" },
    c3: { name: "Olive", value: "#6b8e23" },
    c4: { name: "Bronze", value: "#cd7f32" },
    c5: { name: "Burgundy", value: "#722f37" },
    c6: { name: "Teal", value: "#367588" },
    c7: { name: "Cream", value: "#e8dcc4" },
    c8: { name: "Charcoal", value: "#36454f" },
  },
  
  canvas: {
    background: "#1a1814",
    gridColor: "rgba(200, 180, 140, 0.05)",
    gridMajorColor: "rgba(200, 180, 140, 0.1)",
  },
  
  ui: {
    background: "#252017",
    backgroundAlt: "#322b1f",
    border: "#4a4235",
    text: "#e8e0d0",
    textMuted: "#a89f8c",
    accent: "#c9a227",
    accentHover: "#ddb630",
    danger: "#c44536",
    warning: "#d4a03a",
    success: "#6b8e23",
  },
  
  background: {
    layers: [
      { type: "solid", color: "#1a1814" },
      { type: "pattern", pattern: "noise", opacity: 0.04 },
      { type: "pattern", pattern: "vignette", color: "rgba(0,0,0,0.4)" }
    ]
  },
  
  connectionDefault: "#6b5d4d",
};

// Additional themes
const MATRIX_THEME = {
  id: "matrix",
  name: "The Matrix",
  description: "Digital rain aesthetic",
  
  colorSlots: {
    c1: { name: "Terminal", value: "#00FF00" },
    c2: { name: "Code", value: "#00CC00" },
    c3: { name: "Dim", value: "#009900" },
    c4: { name: "Bright", value: "#33FF33" },
    c5: { name: "Glow", value: "#66FF66" },
    c6: { name: "Light", value: "#99FF99" },
    c7: { name: "Shadow", value: "#003300" },
    c8: { name: "Black", value: "#0D0D0D" },
  },
  
  canvas: { background: "#0D0D0D", gridColor: "rgba(0, 255, 0, 0.03)", gridMajorColor: "rgba(0, 255, 0, 0.06)" },
  ui: { background: "#0a0a0a", backgroundAlt: "#111111", border: "#003300", text: "#00FF00", textMuted: "#009900", accent: "#00FF00", accentHover: "#33FF33", danger: "#ff0000", warning: "#ffff00", success: "#00FF00" },
  background: { layers: [{ type: "solid", color: "#0D0D0D" }, { type: "gradient", value: "radial-gradient(ellipse at 50% 0%, rgba(0, 255, 0, 0.05) 0%, transparent 60%)" }, { type: "pattern", pattern: "grid", color: "rgba(0, 255, 0, 0.03)", size: 40 }] },
  connectionDefault: "#009900",
};

const CYBER_THEME = {
  id: "cyber",
  name: "Cyber-Sleuth",
  description: "Neon cyberpunk vibes",
  
  colorSlots: {
    c1: { name: "Magenta", value: "#FF00FF" },
    c2: { name: "Cyan", value: "#00FFFF" },
    c3: { name: "Hot Pink", value: "#FF6B6B" },
    c4: { name: "Teal", value: "#4ECDC4" },
    c5: { name: "Yellow", value: "#FFE66D" },
    c6: { name: "Mint", value: "#95E1D3" },
    c7: { name: "Purple", value: "#A855F7" },
    c8: { name: "Sky", value: "#38BDF8" },
  },
  
  canvas: { background: "#0a0a0f", gridColor: "rgba(255, 0, 255, 0.03)", gridMajorColor: "rgba(0, 255, 255, 0.05)" },
  ui: { background: "#0f0f1a", backgroundAlt: "#1a1a2e", border: "#2d2d44", text: "#ffffff", textMuted: "#8888aa", accent: "#FF00FF", accentHover: "#FF66FF", danger: "#FF6B6B", warning: "#FFE66D", success: "#4ECDC4" },
  background: { layers: [{ type: "gradient", value: "linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 100%)" }, { type: "gradient", value: "radial-gradient(ellipse at 0% 100%, rgba(255, 0, 255, 0.15) 0%, transparent 50%)" }, { type: "gradient", value: "radial-gradient(ellipse at 100% 0%, rgba(0, 255, 255, 0.1) 0%, transparent 50%)" }] },
  connectionDefault: "#666688",
};

const NOIR_THEME = {
  id: "noir",
  name: "Signal Noir",
  description: "Dark detective aesthetic",
  
  colorSlots: {
    c1: { name: "Blue", value: "#58A6FF" },
    c2: { name: "Orange", value: "#F78166" },
    c3: { name: "Green", value: "#7EE787" },
    c4: { name: "Purple", value: "#D2A8FF" },
    c5: { name: "Yellow", value: "#E3B341" },
    c6: { name: "Gray", value: "#8B949E" },
    c7: { name: "Dark", value: "#161B22" },
    c8: { name: "Darker", value: "#0B0F14" },
  },
  
  canvas: { background: "#0B0F14", gridColor: "rgba(88, 166, 255, 0.02)", gridMajorColor: "rgba(88, 166, 255, 0.04)" },
  ui: { background: "#161B22", backgroundAlt: "#21262d", border: "#30363d", text: "#E6EDF3", textMuted: "#8B949E", accent: "#58A6FF", accentHover: "#79B8FF", danger: "#F78166", warning: "#E3B341", success: "#7EE787" },
  background: { layers: [{ type: "solid", color: "#0B0F14" }, { type: "gradient", value: "radial-gradient(ellipse at center, rgba(15, 20, 26, 0.8) 0%, transparent 70%)" }, { type: "pattern", pattern: "grid", color: "rgba(88, 166, 255, 0.02)", size: 50 }] },
  connectionDefault: "#30363d",
};

const OCEAN_THEME = {
  id: "ocean",
  name: "Ocean Depths",
  description: "Deep sea exploration",
  
  colorSlots: {
    c1: { name: "Deep Blue", value: "#0077B6" },
    c2: { name: "Cerulean", value: "#00B4D8" },
    c3: { name: "Sky", value: "#90E0EF" },
    c4: { name: "Foam", value: "#CAF0F8" },
    c5: { name: "Navy", value: "#03045E" },
    c6: { name: "Royal", value: "#023E8A" },
    c7: { name: "Azure", value: "#0096C7" },
    c8: { name: "Aqua", value: "#48CAE4" },
  },
  
  canvas: { background: "#03045E", gridColor: "rgba(144, 224, 239, 0.03)", gridMajorColor: "rgba(144, 224, 239, 0.06)" },
  ui: { background: "#023E8A", backgroundAlt: "#0077B6", border: "#0096C7", text: "#CAF0F8", textMuted: "#90E0EF", accent: "#00B4D8", accentHover: "#48CAE4", danger: "#ef4444", warning: "#f59e0b", success: "#90E0EF" },
  background: { layers: [{ type: "gradient", value: "linear-gradient(to bottom, #03045E, #023E8A)" }, { type: "gradient", value: "radial-gradient(ellipse at 50% 100%, rgba(0, 180, 216, 0.15) 0%, transparent 60%)" }] },
  connectionDefault: "#0096C7",
};

// Built-in themes collection
const BUILT_IN_THEMES = {
  dark: DEFAULT_THEME,
  light: LIGHT_THEME,
  midnight: MIDNIGHT_THEME,
  sepia: SEPIA_THEME,
  matrix: MATRIX_THEME,
  cyber: CYBER_THEME,
  noir: NOIR_THEME,
  ocean: OCEAN_THEME,
};

// ============================================================================
// PIN STRUCTURE SCHEMA
// ============================================================================

const PIN_SCHEMA = {
  required: ["id", "x", "y"],
  
  fields: {
    id: { type: "number", description: "Unique identifier" },
    x: { type: "number", description: "X position in world coordinates" },
    y: { type: "number", description: "Y position in world coordinates" },
    label: { type: "string", description: "Display label/title", default: "" },
    colorSlot: { type: "string", description: "Color slot reference (c1-c8)", default: "c2" },
    color: { type: "string", description: "Override color (hex) - used if no colorSlot", default: null },
    shape: { type: "string", description: "Pin shape type", default: "circle" },
    type: { type: "string", description: "Full pin type ID", default: "pin:circle" },
    category: { type: "string", description: "Category for organization", default: null },
    description: { type: "string", description: "Detailed description", default: "" },
    image: { type: "string", description: "Image URL or data URI", default: null },
    imageScale: { type: "number", description: "Image scale factor", default: 1 },
    width: { type: "number", description: "Width for text/card pins", default: null },
    height: { type: "number", description: "Height for text/card pins", default: null },
    locked: { type: "boolean", description: "Whether pin is locked", default: false },
    metadata: { type: "object", description: "Custom metadata", default: {} },
  },
};

// ============================================================================
// CONNECTION STRUCTURE SCHEMA
// ============================================================================

const CONNECTION_SCHEMA = {
  required: ["from", "to"],
  
  fields: {
    from: { type: "number", description: "Source pin index" },
    to: { type: "number", description: "Target pin index" },
    type: { type: "string", description: "Line type (straight/curved)", default: "straight" },
    colorSlot: { type: "string", description: "Color slot reference", default: null },
    color: { type: "string", description: "Override color", default: null },
    label: { type: "string", description: "Connection label", default: "" },
    description: { type: "string", description: "Connection description", default: "" },
    relationshipType: { type: "string", description: "Relationship type ID", default: "none" },
    confidenceScore: { type: "number", description: "Confidence 0-100", default: 50 },
    validationPercent: { type: "number", description: "Validation 0-100", default: 0 },
    useGradient: { type: "boolean", description: "Use color gradient", default: false },
    metadata: { type: "object", description: "Custom metadata", default: {} },
  },
};

// ============================================================================
// BOARD STRUCTURE SCHEMA
// ============================================================================

const BOARD_SCHEMA = {
  required: ["id"],
  
  fields: {
    id: { type: "string", description: "Unique board identifier" },
    title: { type: "string", description: "Board title", default: "Untitled Board" },
    description: { type: "string", description: "Board description", default: "" },
    themeId: { type: "string", description: "Theme ID", default: "dark" },
    createdAt: { type: "string", description: "ISO date created", default: null },
    updatedAt: { type: "string", description: "ISO date updated", default: null },
    pins: { type: "array", description: "Array of pins", default: [] },
    connections: { type: "array", description: "Array of connections", default: [] },
    cards: { type: "array", description: "Array of cards", default: [] },
    settings: { type: "object", description: "Board-specific settings", default: {} },
  },
};

// ============================================================================
// SCHEMA MANAGER CLASS
// ============================================================================

class SchemaManager {
  constructor() {
    this.themes = { ...BUILT_IN_THEMES };
    this.userThemes = {};
    this.currentTheme = DEFAULT_THEME;
    
    // Load user customizations
    this.loadUserData();
  }

  // ===========================================================================
  // COLOR SLOT METHODS
  // ===========================================================================

  /**
   * Get the actual color value for a color slot
   * @param {string} slot - Color slot (c1-c8)
   * @param {Object} theme - Optional theme, defaults to current
   * @returns {string} - Hex color value
   */
  getSlotColor(slot, theme = null) {
    const t = theme || this.currentTheme;
    if (t.colorSlots && t.colorSlots[slot]) {
      return t.colorSlots[slot].value;
    }
    // Fallback to c2 (blue) if slot not found
    return t.colorSlots?.c2?.value || "#58a6ff";
  }

  /**
   * Get full slot data with all color variants (highlight, shadow, text, selected)
   * Auto-generates missing variants using ColorUtils
   * @param {string} slot - Color slot (c1-c8)
   * @param {Object} theme - Optional theme, defaults to current
   * @returns {Object} - Full slot data { name, value, highlight, shadow, text, selected }
   */
  getSlotData(slot, theme = null) {
    const t = theme || this.currentTheme;
    const slotData = t.colorSlots?.[slot];
    
    if (!slotData) {
      // Return fallback
      return ColorUtils.ensureFullSlot({ name: "Color", value: "#58a6ff" }, t.colorDefaults);
    }
    
    // Ensure all variants exist (auto-generate if missing)
    return ColorUtils.ensureFullSlot(slotData, t.colorDefaults);
  }

  /**
   * Get full color data for a pin (including all variants)
   * @param {Object} pin - Pin object
   * @returns {Object} - Full color data { value, highlight, shadow, text, selected }
   */
  getPinColorData(pin) {
    if (pin.colorSlot) {
      return this.getSlotData(pin.colorSlot);
    }
    // Generate variants for custom color
    return ColorUtils.generateVariants(pin.color || "#58a6ff", this.currentTheme.colorDefaults);
  }

  /**
   * Get the color for a pin (resolves slot or uses override)
   * @param {Object} pin - Pin object
   * @returns {string} - Hex color
   */
  getPinColor(pin) {
    // If pin has explicit color override, use it
    if (pin.color && !pin.colorSlot) {
      return pin.color;
    }
    // Otherwise resolve from slot
    return this.getSlotColor(pin.colorSlot || "c2");
  }

  /**
   * Get all color slots as array for palette display
   * @returns {Array} - Array of { slot, name, value }
   */
  getColorPalette() {
    const palette = [];
    for (const slot of COLOR_SLOTS) {
      const slotData = this.currentTheme.colorSlots[slot];
      if (slotData) {
        palette.push({
          slot,
          name: slotData.name,
          value: slotData.value,
        });
      }
    }
    return palette;
  }

  /**
   * Find which color slot matches a hex color (for migration)
   * @param {string} hexColor - Hex color to match
   * @returns {string|null} - Slot name or null
   */
  findSlotForColor(hexColor) {
    if (!hexColor) return null;
    const normalized = hexColor.toLowerCase();
    
    for (const slot of COLOR_SLOTS) {
      const slotData = this.currentTheme.colorSlots[slot];
      if (slotData && slotData.value.toLowerCase() === normalized) {
        return slot;
      }
    }
    return null;
  }

  /**
   * Convert all pins to use the current theme's color slots
   * Tries to match existing colors to closest slot
   * @param {Array} pins - Array of pin objects
   * @returns {Array} - Updated pins
   */
  convertPinsToTheme(pins) {
    return pins.map(pin => {
      let slot = pin.colorSlot;
      
      // If pin doesn't have a colorSlot, find one
      if (!slot) {
        // Try to find matching slot for existing color
        slot = this.findSlotForColor(pin.color);
        if (!slot) {
          // Find closest color slot
          slot = this.findClosestSlot(pin.color);
        }
      }
      
      // Get the actual color value from the slot
      const newColor = this.getSlotColor(slot);
      return { ...pin, colorSlot: slot, color: newColor };
    });
  }
  
  /**
   * Convert all connections to use the current theme's color slots
   * @param {Array} connections - Array of connection objects
   * @returns {Array} - Updated connections
   */
  convertConnectionsToTheme(connections) {
    return connections.map(conn => {
      // Skip connections using gradient (they use pin colors)
      if (conn.useGradient) return conn;
      
      let slot = conn.colorSlot;
      
      // If connection doesn't have a colorSlot, find one
      if (!slot && conn.color) {
        slot = this.findSlotForColor(conn.color);
        if (!slot) {
          slot = this.findClosestSlot(conn.color);
        }
      }
      
      if (slot) {
        const newColor = this.getSlotColor(slot);
        return { ...conn, colorSlot: slot, color: newColor };
      }
      
      return conn;
    });
  }

  /**
   * Find the closest color slot to a given hex color
   * @param {string} hexColor - Hex color
   * @returns {string} - Closest slot name
   */
  findClosestSlot(hexColor) {
    if (!hexColor) return "c2"; // Default to blue
    
    const targetRgb = this.hexToRgb(hexColor);
    if (!targetRgb) return "c2";
    
    let closestSlot = "c2";
    let closestDistance = Infinity;
    
    for (const slot of COLOR_SLOTS) {
      const slotData = this.currentTheme.colorSlots[slot];
      if (!slotData) continue;
      
      const slotRgb = this.hexToRgb(slotData.value);
      if (!slotRgb) continue;
      
      const distance = Math.sqrt(
        Math.pow(targetRgb.r - slotRgb.r, 2) +
        Math.pow(targetRgb.g - slotRgb.g, 2) +
        Math.pow(targetRgb.b - slotRgb.b, 2)
      );
      
      if (distance < closestDistance) {
        closestDistance = distance;
        closestSlot = slot;
      }
    }
    
    return closestSlot;
  }

  /**
   * Convert hex to RGB
   * @param {string} hex - Hex color
   * @returns {Object|null} - { r, g, b } or null
   */
  hexToRgb(hex) {
    if (!hex) return null;
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }

  // ===========================================================================
  // THEME METHODS
  // ===========================================================================

  /**
   * Get all available themes (built-in + user)
   * @returns {Object} - All themes
   */
  getAllThemes() {
    return { ...this.themes, ...this.userThemes };
  }

  /**
   * Get a theme by ID
   * @param {string} themeId - Theme ID
   * @returns {Object|null} - Theme object or null
   */
  getTheme(themeId) {
    if (themeId === "default") {
      return this.themes["dark"] || Object.values(this.themes)[0] || null;
    }
    return this.themes[themeId] || this.userThemes[themeId] || null;
  }

  /**
   * Set the current theme
   * @param {string} themeId - Theme ID
   * @param {boolean} convertPins - Whether to convert existing pins to use slots
   * @returns {boolean} - Success
   */
  setTheme(themeId, convertElements = false) {
    const theme = this.getTheme(themeId);
    if (!theme) {
      console.warn(`⚠️ Theme not found: ${themeId}`);
      return false;
    }
    
    this.currentTheme = theme;
    this.applyThemeToUI(theme);
    
    // Apply background if available
    if (window.backgroundBuilder) {
      if (theme.background) {
        window.backgroundBuilder.apply(theme.background);
      } else {
        // Fallback to canvas background color
        window.backgroundBuilder.apply({ layers: [{ type: "solid", color: theme.canvas.background }] });
      }
    }
    
    // Update DEFAULT_COLORS for the color picker
    this.updateDefaultColors();
    
    // Handle pin/connection colors based on convertElements flag
    if (convertElements && window.app?.appState) {
      // Convert ALL pins and connections to new theme colors
      if (window.app.appState.pins) {
        window.app.appState.pins = this.convertPinsToTheme(window.app.appState.pins);
      }
      if (window.app.appState.connections) {
        window.app.appState.connections = this.convertConnectionsToTheme(window.app.appState.connections);
      }
      window.app.appState.saveHistory();
      window.app.saveState();
      console.log(`🎨 Converted all pins and connections to theme: ${theme.name}`);
    } else {
      // Only refresh pins/connections that already have a colorSlot
      this.refreshPinColorsFromSlots();
      this.refreshConnectionColorsFromSlots();
    }
    
    // Update the toolbar's selected color if it has a slot
    if (window.app?.appState?.selectedColorSlot) {
      const newColor = this.getSlotColor(window.app.appState.selectedColorSlot);
      window.app.appState.selectedColor = newColor;
    }
    
    // Save preference
    localStorage.setItem("msc-current-theme", themeId);
    
    // Trigger redraw
    if (window.draw) {
      window.draw();
    }
    
    // Update toolbar if available
    if (window.app?.toolbarManager) {
      window.app.toolbarManager.updateColorPalette(window.DEFAULT_COLORS);
    }
    
    console.log(`🎨 Applied theme: ${theme.name}`);
    return true;
  }

  /**
   * Refresh all pin colors based on their colorSlot
   * This is called when the theme changes
   */
  refreshPinColorsFromSlots() {
    if (!window.app?.appState?.pins) return;
    
    let updated = 0;
    window.app.appState.pins.forEach(pin => {
      if (pin.colorSlot) {
        const newColor = this.getSlotColor(pin.colorSlot);
        if (pin.color !== newColor) {
          pin.color = newColor;
          updated++;
        }
      }
    });
    
    if (updated > 0) {
      console.log(`🎨 Updated ${updated} pin colors from slots`);
    }
  }
  
  /**
   * Refresh all connection colors based on their colorSlot
   * This is called when the theme changes
   */
  refreshConnectionColorsFromSlots() {
    if (!window.app?.appState?.connections) return;
    
    let updated = 0;
    window.app.appState.connections.forEach(conn => {
      if (conn.colorSlot && !conn.useGradient) {
        const newColor = this.getSlotColor(conn.colorSlot);
        if (conn.color !== newColor) {
          conn.color = newColor;
          updated++;
        }
      }
    });
    
    if (updated > 0) {
      console.log(`🎨 Updated ${updated} connection colors from slots`);
    }
  }

  /**
   * Update DEFAULT_COLORS global from current theme
   */
  updateDefaultColors() {
    if (window.DEFAULT_COLORS) {
      window.DEFAULT_COLORS.length = 0;
      for (const slot of COLOR_SLOTS) {
        const slotData = this.currentTheme.colorSlots[slot];
        if (slotData) {
          window.DEFAULT_COLORS.push({
            name: slotData.name,
            value: slotData.value,
            slot: slot, // Include slot reference
          });
        }
      }
    }
  }

  /**
   * Apply theme colors to UI (CSS variables)
   * @param {Object} theme - Theme object
   */
  applyThemeToUI(theme) {
    const root = document.documentElement;
    
    // Legacy compatibility variables
    root.style.setProperty("--theme-bg", theme.canvas.background);
    root.style.setProperty("--theme-text", theme.ui.text);
    root.style.setProperty("--theme-accent", theme.ui.accent);
    window._currentThemeTextColor = theme.ui.text;
    
    // Canvas
    root.style.setProperty("--canvas-bg", theme.canvas.background);
    root.style.setProperty("--canvas-grid", theme.canvas.gridColor);
    root.style.setProperty("--canvas-grid-major", theme.canvas.gridMajorColor);
    
    // UI
    root.style.setProperty("--ui-bg", theme.ui.background);
    root.style.setProperty("--ui-bg-alt", theme.ui.backgroundAlt);
    root.style.setProperty("--ui-border", theme.ui.border);
    root.style.setProperty("--ui-text", theme.ui.text);
    root.style.setProperty("--ui-text-muted", theme.ui.textMuted);
    root.style.setProperty("--ui-accent", theme.ui.accent);
    root.style.setProperty("--ui-accent-hover", theme.ui.accentHover);
    root.style.setProperty("--ui-danger", theme.ui.danger);
    root.style.setProperty("--ui-warning", theme.ui.warning);
    root.style.setProperty("--ui-success", theme.ui.success);
    
    // Connection default
    root.style.setProperty("--conn-default", theme.connectionDefault);
    
    // Color slots as CSS variables
    for (const slot of COLOR_SLOTS) {
      const slotData = theme.colorSlots[slot];
      if (slotData) {
        root.style.setProperty(`--color-${slot}`, slotData.value);
      }
    }
  }

  /**
   * Create a new custom theme
   * @param {Object} themeData - Theme definition
   * @returns {string} - Theme ID
   */
  createTheme(themeData) {
    const id = themeData.id || `custom-${Date.now()}`;
    
    // Ensure all required properties exist (use dark theme as base)
    const theme = {
      ...JSON.parse(JSON.stringify(DEFAULT_THEME)), // Deep clone
      ...themeData,
      id,
    };
    
    // Ensure colorSlots exist
    if (!theme.colorSlots) {
      theme.colorSlots = { ...DEFAULT_THEME.colorSlots };
    }
    
    this.userThemes[id] = theme;
    this.saveUserData();
    
    console.log(`✅ Created theme: ${theme.name}`);
    return id;
  }

  /**
   * Update an existing theme
   * @param {string} themeId - Theme ID
   * @param {Object} updates - Properties to update
   * @returns {boolean} - Success
   */
  updateTheme(themeId, updates) {
    // Can't update built-in themes directly
    if (BUILT_IN_THEMES[themeId]) {
      // Create a user copy
      const copy = JSON.parse(JSON.stringify(BUILT_IN_THEMES[themeId]));
      Object.assign(copy, updates);
      copy.id = `${themeId}-custom`;
      copy.name = `${copy.name} (Custom)`;
      this.userThemes[copy.id] = copy;
      this.saveUserData();
      return copy.id;
    }
    
    if (this.userThemes[themeId]) {
      Object.assign(this.userThemes[themeId], updates);
      this.saveUserData();
      
      // If this is the current theme, reapply
      if (this.currentTheme.id === themeId) {
        this.setTheme(themeId);
      }
      return themeId;
    }
    
    return false;
  }

  /**
   * Delete a custom theme
   * @param {string} themeId - Theme ID
   * @returns {boolean} - Success
   */
  deleteTheme(themeId) {
    if (BUILT_IN_THEMES[themeId]) {
      console.warn("⚠️ Cannot delete built-in theme");
      return false;
    }
    
    if (this.userThemes[themeId]) {
      delete this.userThemes[themeId];
      this.saveUserData();
      
      // If this was the current theme, switch to default
      if (this.currentTheme.id === themeId) {
        this.setTheme("dark");
      }
      return true;
    }
    
    return false;
  }

  /**
   * Export a theme as JSON
   * @param {string} themeId - Theme ID
   * @returns {string} - JSON string
   */
  exportTheme(themeId) {
    const theme = this.getTheme(themeId);
    if (!theme) return null;
    
    return JSON.stringify(theme, null, 2);
  }

  /**
   * Import a theme from JSON
   * @param {string} json - JSON string
   * @returns {string|null} - Theme ID or null on error
   */
  importTheme(json) {
    try {
      const theme = JSON.parse(json);
      if (!theme.name) {
        throw new Error("Theme must have a name");
      }
      // Generate new ID to avoid conflicts
      theme.id = `imported-${Date.now()}`;
      return this.createTheme(theme);
    } catch (error) {
      console.error("❌ Failed to import theme:", error);
      return null;
    }
  }

  // ===========================================================================
  // VALIDATION METHODS
  // ===========================================================================

  /**
   * Validate a pin object against the schema
   */
  validatePin(pin) {
    return this.validateObject(pin, PIN_SCHEMA);
  }

  /**
   * Validate a connection object
   */
  validateConnection(connection) {
    return this.validateObject(connection, CONNECTION_SCHEMA);
  }

  /**
   * Validate an object against a schema
   */
  validateObject(obj, schema) {
    const errors = [];
    
    for (const field of schema.required) {
      if (obj[field] === undefined || obj[field] === null) {
        errors.push(`Missing required field: ${field}`);
      }
    }
    
    for (const [field, def] of Object.entries(schema.fields)) {
      if (obj[field] !== undefined && obj[field] !== null) {
        const actualType = Array.isArray(obj[field]) ? "array" : typeof obj[field];
        if (actualType !== def.type) {
          errors.push(`Invalid type for ${field}: expected ${def.type}, got ${actualType}`);
        }
      }
    }
    
    return { valid: errors.length === 0, errors };
  }

  /**
   * Apply defaults to a pin object
   */
  applyPinDefaults(pin) {
    const result = { ...pin };
    
    for (const [field, def] of Object.entries(PIN_SCHEMA.fields)) {
      if (result[field] === undefined && def.default !== undefined) {
        result[field] = typeof def.default === 'object' ? 
          JSON.parse(JSON.stringify(def.default)) : def.default;
      }
    }
    
    return result;
  }

  // ===========================================================================
  // PERSISTENCE METHODS
  // ===========================================================================

  /**
   * Load user data from localStorage
   */
  loadUserData() {
    try {
      // Load custom themes
      const themes = localStorage.getItem("msc-user-themes");
      if (themes) {
        this.userThemes = JSON.parse(themes);
      }
      
      // Load and apply saved theme
      const savedTheme = localStorage.getItem("msc-current-theme");
      if (savedTheme && this.getTheme(savedTheme)) {
        this.currentTheme = this.getTheme(savedTheme);
        this.applyThemeToUI(this.currentTheme);
        this.updateDefaultColors();
      }
      
    } catch (error) {
      console.warn("⚠️ Failed to load user data:", error);
    }
  }

  /**
   * Save user data to localStorage
   */
  saveUserData() {
    try {
      localStorage.setItem("msc-user-themes", JSON.stringify(this.userThemes));
    } catch (error) {
      console.error("❌ Failed to save user data:", error);
    }
  }

  /**
   * Reset all customizations to defaults
   */
  resetToDefaults() {
    this.userThemes = {};
    this.setTheme("dark");
    
    localStorage.removeItem("msc-user-themes");
    localStorage.removeItem("msc-current-theme");
    
    console.log("🔄 Reset schema to defaults");
  }

  // ===========================================================================
  // BACKWARD COMPATIBILITY METHODS (for themes.js replacement)
  // ===========================================================================

  /**
   * Get all themes as array (for old ThemeManager compatibility)
   * @returns {Array} Array of theme objects with colors array
   */
  getThemes() {
    const allThemes = this.getAllThemes();
    return Object.entries(allThemes).map(([id, theme]) => ({
      id,
      name: theme.name,
      description: theme.description,
      colors: Object.values(theme.colorSlots).map(slot => ({ name: slot.name, value: slot.value })),
      background: theme.background,
      textColor: theme.ui?.text || theme.textColor || "#ffffff",
      isCustom: !!this.userThemes[id],
    }));
  }

  /**
   * Get current theme in old format
   */
  getCurrentTheme() {
    const theme = this.currentTheme;
    return {
      id: theme.id,
      name: theme.name,
      colors: Object.values(theme.colorSlots).map(slot => ({ name: slot.name, value: slot.value })),
      background: theme.background,
      textColor: theme.ui?.text || theme.textColor || "#ffffff",
    };
  }

  /**
   * Get current theme ID
   */
  getCurrentThemeId() {
    return this.currentTheme?.id || "dark";
  }

  /**
   * Get current palette (color array)
   */
  getPalette() {
    return Object.values(this.currentTheme.colorSlots).map(slot => ({ name: slot.name, value: slot.value }));
  }

  /**
   * Apply theme (wrapper for setTheme with old API)
   * @param {string} themeId - Theme ID
   * @param {boolean} updatePins - Whether to update pin colors
   */
  applyTheme(themeId, updatePins = true) {
    return this.setTheme(themeId, updatePins);
  }

  /**
   * Add color to current theme palette
   */
  addColorToPalette(colorObj) {
    const slots = Object.keys(this.currentTheme.colorSlots);
    const maxSlot = slots.reduce((max, slot) => {
      const num = parseInt(slot.replace('c', ''));
      return num > max ? num : max;
    }, 0);
    
    const newSlot = `c${maxSlot + 1}`;
    this.currentTheme.colorSlots[newSlot] = {
      name: colorObj.name || `Color ${maxSlot + 1}`,
      value: colorObj.value
    };
    
    // Set CSS variable for the new slot
    document.documentElement.style.setProperty(`--color-${newSlot}`, colorObj.value);
    
    // Update DEFAULT_COLORS array
    this.updateDefaultColors();
    
    // Update toolbar palette
    if (window.app?.toolbarManager) {
      window.app.toolbarManager.updateColorPalette(window.DEFAULT_COLORS);
    }
    
    // Re-render the add color modal if open
    if (typeof renderAddColorPicker === 'function') {
      renderAddColorPicker();
    }
    
    console.log(`🎨 Added color slot ${newSlot}: ${colorObj.value}`);
  }

  /**
   * Get selected color
   */
  getSelectedColor() {
    return window.app?.appState?.selectedColor || this.currentTheme.colorSlots.c2.value;
  }

  /**
   * Set selected color
   */
  setSelectedColor(color) {
    if (window.app?.appState) {
      window.app.appState.selectedColor = color;
    }
  }

  /**
   * Custom icons storage (for backward compat)
   */
  get customIcons() {
    if (!this._customIcons) this._customIcons = {};
    return this._customIcons;
  }

  set customIcons(value) {
    this._customIcons = value;
  }

  /**
   * Load custom icons from storage
   */
  loadCustomIcons() {
    try {
      const stored = localStorage.getItem('theme_custom_icons');
      if (stored) {
        this._customIcons = JSON.parse(stored);
      }
    } catch (e) {
      console.warn("Failed to load custom icons:", e);
    }
  }

  /**
   * Save custom icons to storage
   */
  saveCustomIcons() {
    try {
      localStorage.setItem('theme_custom_icons', JSON.stringify(this._customIcons || {}));
    } catch (e) {
      console.warn("Failed to save custom icons:", e);
    }
  }

  /**
   * Get custom icon for a pin type
   */
  getCustomIcon(pinType) {
    return this._customIcons?.[pinType] || null;
  }

  /**
   * Set custom icon for a pin type
   */
  setCustomIcon(pinType, dataUrl) {
    if (!this._customIcons) this._customIcons = {};
    this._customIcons[pinType] = dataUrl;
    this.saveCustomIcons();
  }
}

// ============================================================================
// THEME BUILDER UI
// ============================================================================

class ThemeBuilderUI {
  constructor(schemaManager) {
    this.schemaManager = schemaManager;
    this.backdrop = null;
    this.isEditing = false;
    this.editingThemeId = null;
    this.editingTheme = null;
    this.activeTab = "info";
  }

  init() {
    this.backdrop = document.getElementById("theme-builder-backdrop");
    if (!this.backdrop) return;
    
    this.setupEventHandlers();
  }

  setupEventHandlers() {
    // Close buttons (X in header and Close button in footer)
    document.getElementById("theme-builder-close")?.addEventListener("click", () => this.close());
    document.getElementById("theme-builder-close-btn")?.addEventListener("click", () => this.close());
    
    // Backdrop click
    this.backdrop?.addEventListener("click", (e) => {
      if (e.target === this.backdrop) this.close();
    });
    
    // New theme button
    document.getElementById("theme-builder-new")?.addEventListener("click", () => this.startNewTheme());
    
    // Apply button
    document.getElementById("theme-builder-apply")?.addEventListener("click", () => this.applyTheme());
    
    // Save button
    document.getElementById("theme-builder-save")?.addEventListener("click", () => this.saveTheme());
    
    // Cancel button
    document.getElementById("theme-builder-cancel")?.addEventListener("click", () => this.cancelEdit());

    // Tab switching
    document.querySelectorAll(".theme-tab").forEach(tab => {
      tab.addEventListener("click", () => this.switchTab(tab.dataset.tab));
    });

    // Background preset change
    document.getElementById("theme-bg-preset")?.addEventListener("change", (e) => {
      this.applyBackgroundPreset(e.target.value);
    });

    // Add layer button
    document.getElementById("theme-bg-add-layer")?.addEventListener("click", () => this.addBackgroundLayer());

    // Logo upload
    document.getElementById("theme-logo-upload")?.addEventListener("change", (e) => {
      this.handleLogoUpload(e.target.files[0]);
    });

    // Logo URL change
    document.getElementById("theme-logo-url")?.addEventListener("input", () => this.updateBackgroundPreview());

    // Logo settings changes
    ["theme-logo-position", "theme-logo-size", "theme-logo-opacity", "theme-logo-animation"].forEach(id => {
      document.getElementById(id)?.addEventListener("change", () => this.updateBackgroundPreview());
      document.getElementById(id)?.addEventListener("input", () => this.updateBackgroundPreview());
    });

    // Color paste functionality
    document.getElementById("theme-colors-paste-btn")?.addEventListener("click", () => this.togglePasteArea(true));
    document.getElementById("theme-colors-paste-cancel")?.addEventListener("click", () => this.togglePasteArea(false));
    document.getElementById("theme-colors-paste-replace")?.addEventListener("click", () => this.applyPastedColors("replace"));
    document.getElementById("theme-colors-paste-append")?.addEventListener("click", () => this.applyPastedColors("append"));

    // Add color button
    document.getElementById("theme-colors-add-btn")?.addEventListener("click", () => this.addColorSlot());

    // Palette buttons
    document.getElementById("palette-replace-btn")?.addEventListener("click", () => this.applySelectedPalette("replace"));
    document.getElementById("palette-append-btn")?.addEventListener("click", () => this.applySelectedPalette("append"));

    // Text color sync
    document.getElementById("theme-edit-text-color")?.addEventListener("input", (e) => {
      document.getElementById("theme-edit-text-color-hex").value = e.target.value;
    });
    document.getElementById("theme-edit-text-color-hex")?.addEventListener("input", (e) => {
      const color = e.target.value;
      if (/^#[0-9A-Fa-f]{6}$/.test(color)) {
        document.getElementById("theme-edit-text-color").value = color;
      }
    });
  }

  switchTab(tabId) {
    this.activeTab = tabId;
    
    // Update tab buttons
    document.querySelectorAll(".theme-tab").forEach(tab => {
      tab.classList.toggle("active", tab.dataset.tab === tabId);
    });
    
    // Update tab content
    document.querySelectorAll(".theme-tab-content").forEach(content => {
      content.classList.toggle("active", content.id === `tab-${tabId}`);
    });

    // Render background preview when switching to background tab
    if (tabId === "background") {
      this.renderBackgroundEditor();
      this.updateBackgroundPreview();
    }
  }

  open() {
    if (!this.backdrop) this.init();
    if (this.backdrop) {
      this.backdrop.style.display = "flex";
      this.isEditing = false;
      this.renderThemeList();
      this.showListView();
    }
  }

  close() {
    if (this.backdrop) {
      this.backdrop.style.display = "none";
    }
    this.isEditing = false;
    this.editingThemeId = null;
  }

  showListView() {
    document.getElementById("theme-builder-list").style.display = "block";
    document.getElementById("theme-editor").style.display = "none";
    document.getElementById("theme-builder-new").style.display = "block";
    document.getElementById("theme-builder-apply").style.display = "none";
    document.getElementById("theme-builder-save").style.display = "none";
    document.getElementById("theme-builder-cancel").style.display = "none";
    document.getElementById("theme-builder-close-btn").style.display = "block";
  }

  showEditView() {
    document.getElementById("theme-builder-list").style.display = "none";
    document.getElementById("theme-editor").style.display = "block";
    document.getElementById("theme-builder-new").style.display = "none";
    document.getElementById("theme-builder-apply").style.display = "block";
    document.getElementById("theme-builder-save").style.display = "block";
    document.getElementById("theme-builder-cancel").style.display = "block";
    document.getElementById("theme-builder-close-btn").style.display = "none";
    
    // Reset to first tab
    this.switchTab("info");
  }

  renderThemeList() {
    const container = document.getElementById("theme-builder-list");
    if (!container) return;

    const themes = this.schemaManager.getAllThemes();
    const currentId = this.schemaManager.currentTheme.id;

    let html = "";
    for (const [id, theme] of Object.entries(themes)) {
      const isActive = id === currentId;
      const isBuiltIn = !!BUILT_IN_THEMES[id];
      const slots = Object.values(theme.colorSlots).slice(0, 4);
      
      html += `
        <div class="theme-item ${isActive ? 'active' : ''}" data-theme-id="${id}">
          <div class="theme-preview">
            <div class="theme-preview-left" style="background: ${theme.canvas.background}"></div>
            <div class="theme-preview-right" style="background: ${theme.ui.background}">
              ${slots.map(s => `<div class="theme-preview-dot" style="background: ${s.value}"></div>`).join("")}
            </div>
          </div>
          <div class="theme-info">
            <div class="theme-name">${theme.name}${isActive ? ' ✓' : ''}</div>
            <div class="theme-description">${theme.description || ''}</div>
          </div>
          <div class="theme-actions">
            <button class="theme-action-btn" data-action="apply" data-id="${id}">Apply</button>
            <button class="theme-action-btn" data-action="edit" data-id="${id}">Edit</button>
            ${!isBuiltIn ? `<button class="theme-action-btn delete" data-action="delete" data-id="${id}">Delete</button>` : ''}
          </div>
        </div>
      `;
    }

    container.innerHTML = html;

    // Add event handlers
    container.querySelectorAll(".theme-action-btn").forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const action = btn.dataset.action;
        const id = btn.dataset.id;
        
        if (action === "apply") this.applyThemeById(id);
        else if (action === "edit") this.editTheme(id);
        else if (action === "delete") this.deleteTheme(id);
      });
    });

    // Click on row to apply
    container.querySelectorAll(".theme-item").forEach(item => {
      item.addEventListener("click", (e) => {
        if (!e.target.closest(".theme-actions")) {
          const id = item.dataset.themeId;
          this.applyThemeById(id);
        }
      });
    });
  }

  applyThemeById(themeId) {
    const convertPins = confirm("Apply theme to existing pins?\n\nYes = Convert all pin colors to new theme\nNo = Keep current pin colors");
    this.schemaManager.setTheme(themeId, convertPins);
    this.renderThemeList();
  }

  startNewTheme() {
    this.isEditing = true;
    this.editingThemeId = null;
    
    // Create new theme based on current
    this.editingTheme = JSON.parse(JSON.stringify(this.schemaManager.currentTheme));
    this.editingTheme.id = null;
    this.editingTheme.name = "My Custom Theme";
    this.editingTheme.description = "";
    
    // Ensure background structure exists
    if (!this.editingTheme.background) {
      this.editingTheme.background = { layers: [{ type: "solid", color: "#0d1117" }] };
    }
    
    this.renderEditor();
    this.showEditView();
  }

  editTheme(themeId) {
    const theme = this.schemaManager.getTheme(themeId);
    if (!theme) return;
    
    this.isEditing = true;
    this.editingThemeId = themeId;
    this.editingTheme = JSON.parse(JSON.stringify(theme));
    
    // Ensure background structure exists
    if (!this.editingTheme.background) {
      this.editingTheme.background = { layers: [{ type: "solid", color: "#0d1117" }] };
    }
    
    this.renderEditor();
    this.showEditView();
  }

  renderEditor() {
    // Info tab
    const nameInput = document.getElementById("theme-edit-name");
    const descInput = document.getElementById("theme-edit-description");
    const textColorInput = document.getElementById("theme-edit-text-color");
    const textColorHex = document.getElementById("theme-edit-text-color-hex");
    
    if (nameInput) nameInput.value = this.editingTheme.name || "";
    if (descInput) descInput.value = this.editingTheme.description || "";
    
    const textColor = this.editingTheme.textColor || this.editingTheme.ui?.text || "#ffffff";
    if (textColorInput) textColorInput.value = textColor;
    if (textColorHex) textColorHex.value = textColor;
    
    // Colors tab
    this.selectedPaletteId = null;
    this.renderPaletteGrid();
    this.renderColorSlots();
    
    // Background tab (will be rendered when tab is shown)
    this.populateBackgroundPresets();
  }

  renderPaletteGrid() {
    const grid = document.getElementById("color-palette-grid");
    if (!grid) return;

    let html = "";
    for (const [id, palette] of Object.entries(PREBUILT_PALETTES)) {
      const swatches = palette.colors.slice(0, 6).map(c => 
        `<div class="palette-swatch" style="background: ${c}"></div>`
      ).join("");
      
      html += `
        <div class="palette-option" data-palette-id="${id}">
          <div class="palette-swatches">${swatches}</div>
          <span class="palette-name">${palette.name}</span>
        </div>
      `;
    }
    grid.innerHTML = html;

    // Add click handlers
    grid.querySelectorAll(".palette-option").forEach(opt => {
      opt.addEventListener("click", () => {
        this.selectPalette(opt.dataset.paletteId);
      });
    });

    this.updatePaletteButtons();
  }

  selectPalette(paletteId) {
    const grid = document.getElementById("color-palette-grid");
    if (!grid) return;

    // Toggle selection
    if (this.selectedPaletteId === paletteId) {
      this.selectedPaletteId = null;
    } else {
      this.selectedPaletteId = paletteId;
    }

    // Update visual state
    grid.querySelectorAll(".palette-option").forEach(opt => {
      opt.classList.toggle("selected", opt.dataset.paletteId === this.selectedPaletteId);
    });

    this.updatePaletteButtons();
  }

  updatePaletteButtons() {
    const replaceBtn = document.getElementById("palette-replace-btn");
    const appendBtn = document.getElementById("palette-append-btn");
    
    if (replaceBtn) replaceBtn.disabled = !this.selectedPaletteId;
    if (appendBtn) appendBtn.disabled = !this.selectedPaletteId;
  }

  applySelectedPalette(mode = "replace") {
    if (!this.selectedPaletteId) return;
    
    const palette = PREBUILT_PALETTES[this.selectedPaletteId];
    if (!palette) return;

    if (mode === "replace") {
      // Clear existing and replace
      this.editingTheme.colorSlots = {};
      palette.colors.forEach((color, index) => {
        const slot = `c${index + 1}`;
        this.editingTheme.colorSlots[slot] = {
          name: `Color ${index + 1}`,
          value: color
        };
      });
    } else {
      // Append - find the highest existing slot number
      const existingSlots = Object.keys(this.editingTheme.colorSlots);
      const maxSlot = existingSlots.reduce((max, slot) => {
        const num = parseInt(slot.replace('c', ''));
        return num > max ? num : max;
      }, 0);

      palette.colors.forEach((color, index) => {
        const slot = `c${maxSlot + index + 1}`;
        this.editingTheme.colorSlots[slot] = {
          name: `Color ${maxSlot + index + 1}`,
          value: color
        };
      });
    }

    // Deselect palette
    this.selectedPaletteId = null;
    document.querySelectorAll(".palette-option").forEach(opt => {
      opt.classList.remove("selected");
    });
    this.updatePaletteButtons();

    // Re-render
    this.renderColorSlots();
  }

  renderColorSlots() {
    const slotsContainer = document.getElementById("theme-color-slots");
    if (!slotsContainer) return;
    
    // Get all slots from the editing theme (may be more than default 8)
    const themeSlots = Object.keys(this.editingTheme.colorSlots).sort((a, b) => {
      const numA = parseInt(a.replace('c', ''));
      const numB = parseInt(b.replace('c', ''));
      return numA - numB;
    });
    
    // Ensure at least c1-c8 exist
    for (let i = 1; i <= 8; i++) {
      if (!themeSlots.includes(`c${i}`)) {
        themeSlots.push(`c${i}`);
      }
    }
    themeSlots.sort((a, b) => parseInt(a.replace('c', '')) - parseInt(b.replace('c', '')));
    
    let html = "";
    for (const slot of themeSlots) {
      const slotData = this.editingTheme.colorSlots[slot] || { name: "", value: "" };
      const isEmpty = !slotData.value || slotData.value === "";
      const slotNum = parseInt(slot.replace('c', ''));
      const canDelete = slotNum > 8; // Can delete slots beyond c8
      
      html += `
        <div class="color-slot-editor ${isEmpty ? 'empty' : ''}" data-slot="${slot}">
          <input type="color" class="color-slot-preview" value="${slotData.value || '#666666'}" data-slot="${slot}" />
          <div class="color-slot-label">${slot.toUpperCase()}</div>
          <div class="color-slot-inputs">
            <input type="text" class="color-slot-hex" value="${slotData.value || ''}" data-slot="${slot}" placeholder="#hex" maxlength="7" />
            <input type="text" class="color-slot-name" value="${slotData.name || ''}" data-slot="${slot}" placeholder="Color name" />
          </div>
          <button type="button" class="color-slot-clear ${canDelete ? 'can-delete' : ''}" data-slot="${slot}" title="${canDelete ? 'Delete' : 'Clear'}">✕</button>
        </div>
      `;
    }
    slotsContainer.innerHTML = html;
    
    // Update color count badge
    const badge = document.getElementById("color-count-badge");
    if (badge) {
      const validColors = Object.values(this.editingTheme.colorSlots).filter(s => s.value).length;
      badge.textContent = `(${validColors})`;
    }
    
    // Add change handlers for color picker
    slotsContainer.querySelectorAll(".color-slot-preview").forEach(input => {
      input.addEventListener("input", (e) => {
        const slot = e.target.dataset.slot;
        const hex = e.target.value;
        this.updateColorSlot(slot, hex);
        
        // Sync hex input
        const hexInput = slotsContainer.querySelector(`.color-slot-hex[data-slot="${slot}"]`);
        if (hexInput) hexInput.value = hex;
        
        // Remove empty state
        e.target.closest('.color-slot-editor').classList.remove('empty');
        this.updateColorCountBadge();
      });
    });
    
    // Add change handlers for hex input
    slotsContainer.querySelectorAll(".color-slot-hex").forEach(input => {
      input.addEventListener("input", (e) => {
        let hex = e.target.value.trim();
        
        // Auto-add # if missing
        if (hex && !hex.startsWith('#')) {
          hex = '#' + hex;
          e.target.value = hex;
        }
        
        const slot = e.target.dataset.slot;
        
        // Validate hex
        if (/^#[0-9A-Fa-f]{6}$/.test(hex)) {
          this.updateColorSlot(slot, hex);
          
          // Sync color picker
          const colorPicker = slotsContainer.querySelector(`.color-slot-preview[data-slot="${slot}"]`);
          if (colorPicker) colorPicker.value = hex;
          
          // Remove empty state
          e.target.closest('.color-slot-editor').classList.remove('empty');
          this.updateColorCountBadge();
        }
      });
      
      // Also handle paste
      input.addEventListener("paste", (e) => {
        setTimeout(() => {
          input.dispatchEvent(new Event('input'));
        }, 0);
      });
    });
    
    // Add change handlers for name input
    slotsContainer.querySelectorAll(".color-slot-name").forEach(input => {
      input.addEventListener("input", (e) => {
        const slot = e.target.dataset.slot;
        if (!this.editingTheme.colorSlots[slot]) {
          this.editingTheme.colorSlots[slot] = { name: "", value: "" };
        }
        this.editingTheme.colorSlots[slot].name = e.target.value;
      });
    });
    
    // Add clear/delete button handlers
    slotsContainer.querySelectorAll(".color-slot-clear").forEach(btn => {
      btn.addEventListener("click", (e) => {
        const slot = e.target.dataset.slot;
        const slotNum = parseInt(slot.replace('c', ''));
        
        if (slotNum > 8) {
          // Delete the slot entirely
          this.deleteColorSlot(slot);
        } else {
          // Just clear it (reset to empty)
          this.clearColorSlot(slot);
        }
      });
    });
  }

  updateColorCountBadge() {
    const badge = document.getElementById("color-count-badge");
    if (badge && this.editingTheme) {
      const validColors = Object.values(this.editingTheme.colorSlots).filter(s => s.value).length;
      badge.textContent = `(${validColors})`;
    }
  }

  updateColorSlot(slot, hex) {
    if (!this.editingTheme.colorSlots[slot]) {
      this.editingTheme.colorSlots[slot] = { name: "", value: "" };
    }
    this.editingTheme.colorSlots[slot].value = hex;
  }

  clearColorSlot(slot) {
    // Reset to default gray
    this.editingTheme.colorSlots[slot] = { name: "", value: "#666666" };
    
    const slotsContainer = document.getElementById("theme-color-slots");
    const editor = slotsContainer.querySelector(`.color-slot-editor[data-slot="${slot}"]`);
    if (editor) {
      editor.classList.add('empty');
      editor.querySelector('.color-slot-preview').value = "#666666";
      editor.querySelector('.color-slot-hex').value = "";
      editor.querySelector('.color-slot-name').value = "";
    }
  }

  togglePasteArea(show) {
    const pasteArea = document.getElementById("theme-colors-paste-area");
    if (pasteArea) {
      pasteArea.style.display = show ? "block" : "none";
      if (show) {
        document.getElementById("theme-colors-paste-input")?.focus();
      }
    }
  }

  parseHexCodes(text) {
    // Parse hex codes - support various formats:
    // - One per line
    // - Comma separated
    // - Space separated
    // - With or without #
    const hexPattern = /#?([0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})/g;
    const matches = text.match(hexPattern) || [];
    
    return matches.map(hex => {
      // Normalize to full 6-digit hex with #
      hex = hex.replace('#', '');
      if (hex.length === 3) {
        hex = hex.split('').map(c => c + c).join('');
      }
      return '#' + hex.toUpperCase();
    });
  }

  applyPastedColors(mode = "append") {
    const input = document.getElementById("theme-colors-paste-input");
    if (!input) return;
    
    const text = input.value.trim();
    if (!text) return;
    
    const colors = this.parseHexCodes(text);
    
    if (colors.length === 0) {
      alert("No valid hex codes found. Please enter colors in format #RRGGBB or RRGGBB.");
      return;
    }
    
    if (mode === "replace") {
      // Replace all colors
      this.editingTheme.colorSlots = {};
      colors.forEach((color, index) => {
        const slot = `c${index + 1}`;
        this.editingTheme.colorSlots[slot] = {
          name: `Color ${index + 1}`,
          value: color
        };
      });
    } else {
      // Append - find the highest existing slot number
      const existingSlots = Object.keys(this.editingTheme.colorSlots);
      const maxSlot = existingSlots.reduce((max, slot) => {
        const num = parseInt(slot.replace('c', ''));
        return num > max ? num : max;
      }, 0);

      colors.forEach((color, index) => {
        const slot = `c${maxSlot + index + 1}`;
        this.editingTheme.colorSlots[slot] = {
          name: `Color ${maxSlot + index + 1}`,
          value: color
        };
      });
    }
    
    // Clear input and hide paste area
    input.value = "";
    this.togglePasteArea(false);
    
    // Re-render color slots
    this.renderColorSlots();
    
    console.log(`✅ ${mode === "replace" ? "Replaced with" : "Appended"} ${colors.length} colors from paste`);
  }

  addColorSlot() {
    // Find the highest existing slot number
    const existingSlots = Object.keys(this.editingTheme.colorSlots);
    const maxSlot = existingSlots.reduce((max, slot) => {
      const num = parseInt(slot.replace('c', ''));
      return num > max ? num : max;
    }, 8); // Minimum is 8

    const newSlot = `c${maxSlot + 1}`;
    this.editingTheme.colorSlots[newSlot] = {
      name: `Color ${maxSlot + 1}`,
      value: ""
    };

    this.renderColorSlots();

    // Focus the new slot's hex input
    setTimeout(() => {
      const newInput = document.querySelector(`.color-slot-hex[data-slot="${newSlot}"]`);
      if (newInput) newInput.focus();
    }, 50);
  }

  deleteColorSlot(slot) {
    const slotNum = parseInt(slot.replace('c', ''));
    if (slotNum <= 8) return; // Don't delete base slots

    delete this.editingTheme.colorSlots[slot];
    this.renderColorSlots();
  }

  populateBackgroundPresets() {
    const select = document.getElementById("theme-bg-preset");
    if (!select || !window.BACKGROUND_PRESETS) return;
    
    select.innerHTML = '<option value="">Custom Layers</option>';
    for (const id of Object.keys(window.BACKGROUND_PRESETS)) {
      const name = id.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
      select.innerHTML += `<option value="${id}">${name}</option>`;
    }
  }

  renderBackgroundEditor() {
    const layerList = document.getElementById("theme-bg-layer-list");
    if (!layerList) return;
    
    const bg = this.editingTheme.background || { layers: [] };
    const layers = bg.layers || [];
    
    // Filter out logo layer (handled separately)
    const nonLogoLayers = layers.filter(l => l.type !== "logo");
    const logoLayer = layers.find(l => l.type === "logo");
    
    let html = "";
    nonLogoLayers.forEach((layer, idx) => {
      html += this.renderLayerItem(layer, idx);
    });
    
    layerList.innerHTML = html || '<div class="form-hint">No layers. Add a layer to start.</div>';
    
    // Bind drag-and-drop events for reordering
    this.setupLayerDragAndDrop(layerList);
    
    // Bind layer events
    layerList.querySelectorAll(".layer-remove").forEach(btn => {
      btn.addEventListener("click", (e) => {
        const idx = parseInt(e.target.closest('button').dataset.idx);
        this.removeBackgroundLayer(idx);
      });
    });
    
    layerList.querySelectorAll(".layer-type").forEach(select => {
      select.addEventListener("change", (e) => {
        const idx = parseInt(e.target.dataset.idx);
        this.updateLayerType(idx, e.target.value);
      });
    });
    
    // Solid color
    layerList.querySelectorAll(".layer-color").forEach(input => {
      input.addEventListener("input", (e) => {
        const idx = parseInt(e.target.dataset.idx);
        this.updateLayerField(idx, "color", e.target.value);
      });
    });
    
    // Gradient controls
    layerList.querySelectorAll(".layer-gradient-type").forEach(select => {
      select.addEventListener("change", (e) => {
        const idx = parseInt(e.target.dataset.idx);
        this.updateLayerField(idx, "gradientType", e.target.value);
      });
    });
    
    layerList.querySelectorAll(".layer-gradient-dir").forEach(select => {
      select.addEventListener("change", (e) => {
        const idx = parseInt(e.target.dataset.idx);
        this.updateLayerField(idx, "direction", e.target.value);
      });
    });
    
    layerList.querySelectorAll(".layer-color1").forEach(input => {
      input.addEventListener("input", (e) => {
        const idx = parseInt(e.target.dataset.idx);
        this.updateLayerField(idx, "color1", e.target.value);
      });
    });
    
    layerList.querySelectorAll(".layer-color2").forEach(input => {
      input.addEventListener("input", (e) => {
        const idx = parseInt(e.target.dataset.idx);
        this.updateLayerField(idx, "color2", e.target.value);
      });
    });
    
    // Pattern controls
    layerList.querySelectorAll(".layer-pattern").forEach(select => {
      select.addEventListener("change", (e) => {
        const idx = parseInt(e.target.dataset.idx);
        this.updateLayerField(idx, "pattern", e.target.value);
      });
    });
    
    layerList.querySelectorAll(".layer-pattern-color").forEach(input => {
      input.addEventListener("input", (e) => {
        const idx = parseInt(e.target.dataset.idx);
        this.updateLayerField(idx, "patternColor", e.target.value);
      });
    });
    
    layerList.querySelectorAll(".layer-pattern-size").forEach(input => {
      input.addEventListener("input", (e) => {
        const idx = parseInt(e.target.dataset.idx);
        e.target.title = `Size: ${e.target.value}px`;
        this.updateLayerField(idx, "size", parseInt(e.target.value));
      });
    });
    
    layerList.querySelectorAll(".layer-pattern-opacity").forEach(input => {
      input.addEventListener("input", (e) => {
        const idx = parseInt(e.target.dataset.idx);
        e.target.title = `Opacity: ${e.target.value}%`;
        this.updateLayerField(idx, "opacity", parseInt(e.target.value) / 100);
      });
    });
    
    // Image URL
    layerList.querySelectorAll(".layer-image-url").forEach(input => {
      input.addEventListener("input", (e) => {
        const idx = parseInt(e.target.dataset.idx);
        this.updateLayerField(idx, "url", e.target.value);
      });
    });
    
    // Logo settings
    if (logoLayer) {
      document.getElementById("theme-logo-url").value = logoLayer.url || "";
      document.getElementById("theme-logo-position").value = logoLayer.position || "bottom-right";
      document.getElementById("theme-logo-size").value = logoLayer.size || "80px";
      document.getElementById("theme-logo-opacity").value = (logoLayer.opacity || 0.3) * 100;
      document.getElementById("theme-logo-animation").value = logoLayer.animation || "none";
    } else {
      document.getElementById("theme-logo-url").value = "";
      document.getElementById("theme-logo-position").value = "bottom-right";
      document.getElementById("theme-logo-size").value = "80px";
      document.getElementById("theme-logo-opacity").value = 30;
      document.getElementById("theme-logo-animation").value = "none";
    }
  }

  renderLayerItem(layer, idx) {
    const typeOptions = [
      { value: "solid", label: "Solid Color" },
      { value: "gradient", label: "Gradient" },
      { value: "pattern", label: "Pattern" },
      { value: "image", label: "Image" }
    ];
    
    let valueFields = "";
    switch (layer.type) {
      case "solid":
        valueFields = `
          <div class="layer-fields">
            <input type="color" class="layer-color" data-idx="${idx}" data-field="color" value="${layer.color || '#0d1117'}" title="Color" />
          </div>`;
        break;
        
      case "gradient":
        // Parse existing gradient or use defaults
        const gradientType = layer.gradientType || "linear";
        const gradientDirection = layer.direction || "to bottom";
        const color1 = layer.color1 || "#1a1a2e";
        const color2 = layer.color2 || "#0d1117";
        
        valueFields = `
          <div class="layer-fields layer-fields-gradient">
            <select class="layer-gradient-type" data-idx="${idx}" data-field="gradientType" title="Type">
              <option value="linear" ${gradientType === 'linear' ? 'selected' : ''}>Linear</option>
              <option value="radial" ${gradientType === 'radial' ? 'selected' : ''}>Radial</option>
            </select>
            <select class="layer-gradient-dir" data-idx="${idx}" data-field="direction" title="Direction">
              <option value="to bottom" ${gradientDirection === 'to bottom' ? 'selected' : ''}>↓ Down</option>
              <option value="to top" ${gradientDirection === 'to top' ? 'selected' : ''}>↑ Up</option>
              <option value="to right" ${gradientDirection === 'to right' ? 'selected' : ''}>→ Right</option>
              <option value="to left" ${gradientDirection === 'to left' ? 'selected' : ''}>← Left</option>
              <option value="to bottom right" ${gradientDirection === 'to bottom right' ? 'selected' : ''}>↘ Diagonal</option>
              <option value="to top right" ${gradientDirection === 'to top right' ? 'selected' : ''}>↗ Diagonal</option>
            </select>
            <input type="color" class="layer-color1" data-idx="${idx}" data-field="color1" value="${color1}" title="Start Color" />
            <input type="color" class="layer-color2" data-idx="${idx}" data-field="color2" value="${color2}" title="End Color" />
          </div>`;
        break;
        
      case "pattern":
        const patterns = window.BUILTIN_PATTERNS ? Object.keys(window.BUILTIN_PATTERNS) : [];
        const patternColor = layer.color || "rgba(255,255,255,0.05)";
        const patternSize = layer.size || 20;
        // Convert rgba to hex for color picker (approximate)
        const hexColor = this.rgbaToHex(patternColor);
        const opacity = this.getOpacityFromRgba(patternColor);
        
        valueFields = `
          <div class="layer-fields layer-fields-pattern">
            <select class="layer-pattern" data-idx="${idx}" data-field="pattern" title="Pattern">
              ${patterns.map(p => `<option value="${p}" ${layer.pattern === p ? 'selected' : ''}>${p}</option>`).join("")}
            </select>
            <input type="color" class="layer-pattern-color" data-idx="${idx}" data-field="patternColor" value="${hexColor}" title="Color" />
            <div class="layer-slider-group">
              <label>Size</label>
              <input type="range" class="layer-pattern-size" data-idx="${idx}" data-field="size" min="5" max="100" value="${patternSize}" title="Size: ${patternSize}px" />
            </div>
            <div class="layer-slider-group">
              <label>Opacity</label>
              <input type="range" class="layer-pattern-opacity" data-idx="${idx}" data-field="opacity" min="1" max="100" value="${Math.round(opacity * 100)}" title="Opacity: ${Math.round(opacity * 100)}%" />
            </div>
          </div>`;
        break;
        
      case "image":
        valueFields = `
          <div class="layer-fields">
            <input type="text" class="layer-image-url" data-idx="${idx}" data-field="url" value="${layer.url || ''}" placeholder="Image URL or data:..." />
          </div>`;
        break;
    }
    
    return `
      <div class="bg-layer-item" data-idx="${idx}" data-type="${layer.type}" draggable="true">
        <div class="layer-header">
          <div class="layer-drag-handle" title="Drag to reorder">⋮⋮</div>
          <select class="layer-type" data-idx="${idx}">
            ${typeOptions.map(o => `<option value="${o.value}" ${layer.type === o.value ? 'selected' : ''}>${o.label}</option>`).join("")}
          </select>
          <button type="button" class="layer-remove" data-idx="${idx}">✕</button>
        </div>
        ${valueFields}
      </div>
    `;
  }

  // Helper to convert rgba to hex (for color picker)
  rgbaToHex(rgba) {
    if (rgba.startsWith('#')) return rgba;
    const match = rgba.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (match) {
      const r = parseInt(match[1]).toString(16).padStart(2, '0');
      const g = parseInt(match[2]).toString(16).padStart(2, '0');
      const b = parseInt(match[3]).toString(16).padStart(2, '0');
      return `#${r}${g}${b}`;
    }
    return '#ffffff';
  }

  // Helper to get opacity from rgba
  getOpacityFromRgba(rgba) {
    if (rgba.startsWith('#')) return 1;
    const match = rgba.match(/rgba?\([^)]+,\s*([\d.]+)\)/);
    return match ? parseFloat(match[1]) : 0.1;
  }

  // Helper to create rgba from hex and opacity
  hexToRgba(hex, opacity) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }

  addBackgroundLayer() {
    if (!this.editingTheme.background) {
      this.editingTheme.background = { layers: [] };
    }
    this.editingTheme.background.layers.push({ type: "solid", color: "#1a1a2e" });
    this.renderBackgroundEditor();
    this.updateBackgroundPreview();
  }

  removeBackgroundLayer(idx) {
    const layers = this.editingTheme.background?.layers || [];
    const nonLogoLayers = layers.filter(l => l.type !== "logo");
    nonLogoLayers.splice(idx, 1);
    
    // Reconstruct with logo if present
    const logoLayer = layers.find(l => l.type === "logo");
    this.editingTheme.background.layers = logoLayer ? [...nonLogoLayers, logoLayer] : nonLogoLayers;
    
    this.renderBackgroundEditor();
    this.updateBackgroundPreview();
  }

  updateLayerType(idx, newType) {
    const layers = this.editingTheme.background?.layers || [];
    const nonLogoLayers = layers.filter(l => l.type !== "logo");
    
    if (nonLogoLayers[idx]) {
      // Create new layer with default values for the type
      const newLayer = { type: newType };
      switch (newType) {
        case "solid": 
          newLayer.color = "#1a1a2e"; 
          break;
        case "gradient": 
          newLayer.gradientType = "linear";
          newLayer.direction = "to bottom";
          newLayer.color1 = "#1a1a2e";
          newLayer.color2 = "#0d1117";
          break;
        case "pattern": 
          newLayer.pattern = "grid"; 
          newLayer.color = "rgba(255,255,255,0.05)"; 
          newLayer.size = 20; 
          break;
        case "image": 
          newLayer.url = ""; 
          newLayer.size = "cover"; 
          break;
      }
      nonLogoLayers[idx] = newLayer;
      
      const logoLayer = layers.find(l => l.type === "logo");
      this.editingTheme.background.layers = logoLayer ? [...nonLogoLayers, logoLayer] : nonLogoLayers;
      
      this.renderBackgroundEditor();
      this.updateBackgroundPreview();
    }
  }

  updateLayerField(idx, field, value) {
    const layers = this.editingTheme.background?.layers || [];
    const nonLogoLayers = layers.filter(l => l.type !== "logo");
    
    if (nonLogoLayers[idx]) {
      const layer = nonLogoLayers[idx];
      
      // Handle special fields
      if (field === "patternColor" || field === "opacity") {
        // Update the rgba color for patterns
        const currentColor = layer.color || "rgba(255,255,255,0.05)";
        const hexColor = field === "patternColor" ? value : this.rgbaToHex(currentColor);
        const opacity = field === "opacity" ? value : this.getOpacityFromRgba(currentColor);
        layer.color = this.hexToRgba(hexColor, opacity);
      } else {
        layer[field] = value;
      }
      
      // Rebuild gradient value string if gradient fields changed
      if (layer.type === "gradient" && ["gradientType", "direction", "color1", "color2"].includes(field)) {
        layer.value = this.buildGradientValue(layer);
      }
      
      this.updateBackgroundPreview();
    }
  }

  buildGradientValue(layer) {
    const type = layer.gradientType || "linear";
    const direction = layer.direction || "to bottom";
    const color1 = layer.color1 || "#1a1a2e";
    const color2 = layer.color2 || "#0d1117";
    
    if (type === "radial") {
      return `radial-gradient(circle at center, ${color1} 0%, ${color2} 100%)`;
    } else {
      return `linear-gradient(${direction}, ${color1}, ${color2})`;
    }
  }

  setupLayerDragAndDrop(layerList) {
    let draggedItem = null;
    let draggedIdx = null;

    layerList.querySelectorAll(".bg-layer-item").forEach(item => {
      // Only allow dragging from the handle
      const handle = item.querySelector(".layer-drag-handle");
      
      handle.addEventListener("mousedown", () => {
        item.setAttribute("draggable", "true");
      });

      item.addEventListener("dragstart", (e) => {
        // Only allow drag if started from handle
        if (!e.target.closest(".layer-drag-handle") && e.target !== item) {
          e.preventDefault();
          return;
        }
        draggedItem = item;
        draggedIdx = parseInt(item.dataset.idx);
        item.classList.add("dragging");
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", draggedIdx);
      });

      item.addEventListener("dragend", () => {
        item.classList.remove("dragging");
        item.setAttribute("draggable", "false");
        draggedItem = null;
        draggedIdx = null;
        
        // Remove all drag-over states
        layerList.querySelectorAll(".drag-over").forEach(el => {
          el.classList.remove("drag-over");
        });
      });

      item.addEventListener("dragover", (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        
        if (draggedItem && item !== draggedItem) {
          item.classList.add("drag-over");
        }
      });

      item.addEventListener("dragleave", () => {
        item.classList.remove("drag-over");
      });

      item.addEventListener("drop", (e) => {
        e.preventDefault();
        item.classList.remove("drag-over");
        
        if (!draggedItem || item === draggedItem) return;
        
        const targetIdx = parseInt(item.dataset.idx);
        if (draggedIdx === targetIdx) return;
        
        // Reorder the layers
        this.reorderBackgroundLayer(draggedIdx, targetIdx);
      });
    });
  }

  reorderBackgroundLayer(fromIdx, toIdx) {
    const layers = this.editingTheme.background?.layers || [];
    const nonLogoLayers = layers.filter(l => l.type !== "logo");
    const logoLayer = layers.find(l => l.type === "logo");
    
    if (fromIdx < 0 || fromIdx >= nonLogoLayers.length) return;
    if (toIdx < 0 || toIdx >= nonLogoLayers.length) return;
    
    // Remove the layer from its current position
    const [movedLayer] = nonLogoLayers.splice(fromIdx, 1);
    
    // Insert at the new position
    nonLogoLayers.splice(toIdx, 0, movedLayer);
    
    // Reconstruct with logo if present
    this.editingTheme.background.layers = logoLayer ? [...nonLogoLayers, logoLayer] : nonLogoLayers;
    
    // Re-render and update preview
    this.renderBackgroundEditor();
    this.updateBackgroundPreview();
  }

  applyBackgroundPreset(presetId) {
    if (!presetId || !window.BACKGROUND_PRESETS?.[presetId]) return;
    
    const preset = window.BACKGROUND_PRESETS[presetId];
    
    // Keep existing logo layer if present
    const logoLayer = this.editingTheme.background?.layers?.find(l => l.type === "logo");
    
    this.editingTheme.background = JSON.parse(JSON.stringify(preset));
    if (logoLayer) {
      this.editingTheme.background.layers.push(logoLayer);
    }
    
    this.renderBackgroundEditor();
    this.updateBackgroundPreview();
  }

  handleLogoUpload(file) {
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      document.getElementById("theme-logo-url").value = e.target.result;
      this.updateBackgroundPreview();
    };
    reader.readAsDataURL(file);
  }

  updateBackgroundPreview() {
    const preview = document.getElementById("theme-bg-preview");
    if (!preview || !this.editingTheme) return;
    
    // Collect logo settings from UI
    const logoUrl = document.getElementById("theme-logo-url")?.value || "";
    const logoPosition = document.getElementById("theme-logo-position")?.value || "bottom-right";
    const logoSize = document.getElementById("theme-logo-size")?.value || "80px";
    const logoOpacity = (parseInt(document.getElementById("theme-logo-opacity")?.value) || 30) / 100;
    const logoAnimation = document.getElementById("theme-logo-animation")?.value || "none";
    
    // Update or add logo layer
    const layers = this.editingTheme.background?.layers || [];
    const nonLogoLayers = layers.filter(l => l.type !== "logo");
    
    if (logoUrl) {
      const logoLayer = {
        type: "logo",
        url: logoUrl,
        position: logoPosition,
        size: logoSize,
        opacity: logoOpacity,
        animation: logoAnimation
      };
      this.editingTheme.background.layers = [...nonLogoLayers, logoLayer];
    } else {
      this.editingTheme.background.layers = nonLogoLayers;
    }
    
    // Generate CSS for preview
    if (window.backgroundBuilder) {
      const cssResult = window.backgroundBuilder.generateCSS(nonLogoLayers);
      preview.style.background = cssResult.background;
      preview.style.backgroundSize = cssResult.backgroundSize;
      preview.style.backgroundPosition = cssResult.backgroundPosition;
      preview.style.backgroundRepeat = cssResult.backgroundRepeat;
    }
    
    // Add logo preview element
    let logoPreview = preview.querySelector(".logo-preview");
    if (logoUrl) {
      if (!logoPreview) {
        logoPreview = document.createElement("div");
        logoPreview.className = "logo-preview";
        preview.appendChild(logoPreview);
      }
      
      let positionCSS = "";
      switch (logoPosition) {
        case "top-left": positionCSS = "top: 8px; left: 8px;"; break;
        case "top-right": positionCSS = "top: 8px; right: 8px;"; break;
        case "bottom-left": positionCSS = "bottom: 8px; left: 8px;"; break;
        case "bottom-right": positionCSS = "bottom: 8px; right: 8px;"; break;
        case "center": positionCSS = "top: 50%; left: 50%; transform: translate(-50%, -50%);"; break;
      }
      
      let animationCSS = "";
      if (logoAnimation !== "none" && window.LOGO_ANIMATIONS?.[logoAnimation]) {
        animationCSS = `animation: logo-${logoAnimation} 3s ease-in-out infinite;`;
      }
      
      logoPreview.style.cssText = `
        position: absolute;
        ${positionCSS}
        width: 24px;
        height: 24px;
        background-image: url("${logoUrl}");
        background-size: contain;
        background-repeat: no-repeat;
        background-position: center;
        opacity: ${logoOpacity};
        ${animationCSS}
      `;
    } else if (logoPreview) {
      logoPreview.remove();
    }
  }

  applyTheme() {
    // Update from inputs
    this.updateThemeFromInputs();
    
    // Apply temporarily to preview
    this.schemaManager.applyThemeToUI(this.editingTheme);
    this.schemaManager.currentTheme = this.editingTheme;
    this.schemaManager.updateDefaultColors();
    
    // Apply background
    if (window.backgroundBuilder && this.editingTheme.background) {
      window.backgroundBuilder.apply(this.editingTheme.background);
    }
    
    if (window.draw) window.draw();
  }

  updateThemeFromInputs() {
    this.editingTheme.name = document.getElementById("theme-edit-name")?.value || "Custom Theme";
    this.editingTheme.description = document.getElementById("theme-edit-description")?.value || "";
    
    const textColor = document.getElementById("theme-edit-text-color")?.value || "#ffffff";
    this.editingTheme.textColor = textColor;
    if (this.editingTheme.ui) {
      this.editingTheme.ui.text = textColor;
    }
  }

  saveTheme() {
    // Update from inputs
    this.updateThemeFromInputs();
    
    let themeId;
    if (this.editingThemeId && !BUILT_IN_THEMES[this.editingThemeId]) {
      // Update existing custom theme
      themeId = this.schemaManager.updateTheme(this.editingThemeId, this.editingTheme);
    } else {
      // Create new theme
      themeId = this.schemaManager.createTheme(this.editingTheme);
    }
    
    // Apply the saved theme
    this.schemaManager.setTheme(themeId, false);
    
    this.isEditing = false;
    this.editingThemeId = null;
    this.editingTheme = null;
    
    this.renderThemeList();
    this.showListView();
  }

  cancelEdit() {
    // Restore previous theme
    const savedTheme = localStorage.getItem("msc-current-theme") || "dark";
    this.schemaManager.setTheme(savedTheme, false);
    
    this.isEditing = false;
    this.editingThemeId = null;
    this.editingTheme = null;
    
    this.showListView();
  }

  deleteTheme(themeId) {
    if (confirm(`Delete theme "${this.schemaManager.getTheme(themeId)?.name}"?`)) {
      this.schemaManager.deleteTheme(themeId);
      this.renderThemeList();
    }
  }
}

// ============================================================================
// NEW BOARD MODAL UI
// ============================================================================

class NewBoardModalUI {
  constructor(schemaManager) {
    this.schemaManager = schemaManager;
    this.backdrop = null;
    this.onCreateCallback = null;
  }

  init() {
    this.backdrop = document.getElementById("new-board-modal-backdrop");
    if (!this.backdrop) return;
    
    this.setupEventHandlers();
  }

  setupEventHandlers() {
    document.getElementById("new-board-modal-close")?.addEventListener("click", () => this.close());
    document.getElementById("new-board-cancel")?.addEventListener("click", () => this.close());
    document.getElementById("new-board-create")?.addEventListener("click", () => this.create());
    
    this.backdrop?.addEventListener("click", (e) => {
      if (e.target === this.backdrop) this.close();
    });

    // Theme selection change
    document.getElementById("new-board-theme")?.addEventListener("change", (e) => {
      this.updateThemePreview(e.target.value);
    });
  }

  open(callback = null) {
    if (!this.backdrop) this.init();
    this.onCreateCallback = callback;
    
    if (this.backdrop) {
      this.backdrop.style.display = "flex";
      this.populateThemes();
      
      // Clear inputs
      document.getElementById("new-board-name").value = "";
      document.getElementById("new-board-description").value = "";
      document.getElementById("new-board-name")?.focus();
    }
  }

  close() {
    if (this.backdrop) {
      this.backdrop.style.display = "none";
    }
  }

  populateThemes() {
    const select = document.getElementById("new-board-theme");
    if (!select) return;

    const themes = this.schemaManager.getAllThemes();
    const currentId = this.schemaManager.currentTheme.id;

    select.innerHTML = "";
    for (const [id, theme] of Object.entries(themes)) {
      const option = document.createElement("option");
      option.value = id;
      option.textContent = theme.name;
      if (id === currentId) option.selected = true;
      select.appendChild(option);
    }

    this.updateThemePreview(currentId);
  }

  updateThemePreview(themeId) {
    const preview = document.getElementById("new-board-theme-preview");
    if (!preview) return;

    const theme = this.schemaManager.getTheme(themeId);
    if (!theme) return;

    const slots = Object.values(theme.colorSlots);
    
    preview.innerHTML = `
      <div class="theme-preview" style="height: 40px; width: 100%;">
        <div class="theme-preview-left" style="background: ${theme.canvas.background}"></div>
        <div class="theme-preview-right" style="background: ${theme.ui.background}; width: 30%;">
          ${slots.slice(0, 4).map(s => `<div class="theme-preview-dot" style="background: ${s.value}"></div>`).join("")}
        </div>
      </div>
      <div class="color-slots-preview">
        ${slots.map(s => `<div class="slot-dot" style="background: ${s.value}" title="${s.name}"></div>`).join("")}
      </div>
    `;
  }

  create() {
    const name = document.getElementById("new-board-name")?.value?.trim() || "Untitled Board";
    const description = document.getElementById("new-board-description")?.value?.trim() || "";
    const themeId = document.getElementById("new-board-theme")?.value || "dark";

    const boardData = {
      name,
      description,
      themeId,
    };

    this.close();

    if (this.onCreateCallback) {
      this.onCreateCallback(boardData);
    } else {
      // Default behavior - call board manager
      this.createBoard(boardData);
    }
  }

  createBoard(boardData) {
    if (!window.app?.appState) return;

    // Save current board first if it has an ID
    if (window.app.boardManager && window.app.appState.meta?.id) {
      window.app.boardManager.saveBoard();
    }

    // Create new board
    if (window.app.boardManager) {
      const boardId = window.app.boardManager.createBoard(boardData.name, boardData.description);
      if (boardId) {
        window.app.boardManager.loadBoard(boardId);
        window.app.appState.meta.description = boardData.description;
        
        // Apply selected theme
        window.schemaManager.setTheme(boardData.themeId, false);
        
        window.app.saveState();
        if (window.draw) window.draw();
      }
    } else {
      // Fallback without board manager
      window.app.appState.clearBoard();
      window.app.appState.meta = {
        title: boardData.name,
        description: boardData.description,
      };
      window.schemaManager.setTheme(boardData.themeId, false);
      window.app.saveState();
      if (window.draw) window.draw();
    }
  }
}

// ============================================================================
// GLOBAL INSTANCE & EXPORTS
// ============================================================================

const schemaManager = new SchemaManager();
const themeBuilderUI = new ThemeBuilderUI(schemaManager);
const newBoardModalUI = new NewBoardModalUI(schemaManager);

// Initialize when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    themeBuilderUI.init();
    newBoardModalUI.init();
  });
} else {
  themeBuilderUI.init();
  newBoardModalUI.init();
}

// Export to window
window.schemaManager = schemaManager;
window.themeBuilderUI = themeBuilderUI;
window.newBoardModalUI = newBoardModalUI;
window.COLOR_SLOTS = COLOR_SLOTS;
window.BUILT_IN_THEMES = BUILT_IN_THEMES;
window.PREBUILT_PALETTES = PREBUILT_PALETTES;
window.PIN_SCHEMA = PIN_SCHEMA;
window.CONNECTION_SCHEMA = CONNECTION_SCHEMA;
window.BOARD_SCHEMA = BOARD_SCHEMA;

window.openThemeBuilderModal = () => themeBuilderUI.open();
window.openNewBoardModal = (callback) => newBoardModalUI.open(callback);

// ============================================================================
// BACKWARD COMPATIBILITY - Replace old themeManager
// ============================================================================

// Point themeManager to schemaManager for backward compatibility
window.themeManager = schemaManager;

// Legacy function exports
window.applyTheme = (themeId, updatePins = true) => schemaManager.setTheme(themeId, updatePins);
window.getCurrentTheme = () => schemaManager.getCurrentTheme();
window.getCurrentThemeId = () => schemaManager.getCurrentThemeId();
window.getThemes = () => schemaManager.getThemes();
window.getPalette = () => schemaManager.getPalette();
window.getSelectedColor = () => schemaManager.getSelectedColor();
window.setSelectedColor = (color) => schemaManager.setSelectedColor(color);
window.addColorToPalette = (colorObj) => schemaManager.addColorToPalette(colorObj);

// Legacy THEMES array (dynamically updated)
Object.defineProperty(window, 'THEMES', {
  get: () => schemaManager.getThemes(),
  configurable: true
});

// Initialize DEFAULT_COLORS from theme
schemaManager.updateDefaultColors();
schemaManager.loadCustomIcons();

console.log("✅ Schema system initialized with", Object.keys(BUILT_IN_THEMES).length, "built-in themes");

