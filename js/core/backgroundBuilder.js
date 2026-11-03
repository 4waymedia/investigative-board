// ============================================================================
// BACKGROUND BUILDER - Layered background system for themes
// ============================================================================
// Uses pure CSS for performance. Supports: solid, gradient, image, pattern, logo
// ============================================================================

// ============================================================================
// LOGO ANIMATIONS (CSS keyframes injected once)
// ============================================================================

const LOGO_ANIMATIONS = {
  none: '',
  pulse: `
    @keyframes logo-pulse {
      0%, 100% { opacity: var(--logo-opacity, 0.3); }
      50% { opacity: calc(var(--logo-opacity, 0.3) * 1.5); }
    }
  `,
  float: `
    @keyframes logo-float {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-8px); }
    }
  `,
  rotate: `
    @keyframes logo-rotate {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
  `,
  glow: `
    @keyframes logo-glow {
      0%, 100% { filter: drop-shadow(0 0 0px var(--logo-glow-color, rgba(255,255,255,0.5))); }
      50% { filter: drop-shadow(0 0 12px var(--logo-glow-color, rgba(255,255,255,0.8))); }
    }
  `,
  swing: `
    @keyframes logo-swing {
      0%, 100% { transform: rotate(-5deg); }
      50% { transform: rotate(5deg); }
    }
  `,
  bounce: `
    @keyframes logo-bounce {
      0%, 100% { transform: translateY(0); }
      25% { transform: translateY(-6px); }
      75% { transform: translateY(3px); }
    }
  `
};

// Inject animation keyframes once
(function injectLogoAnimations() {
  if (document.getElementById('logo-animation-styles')) return;
  const style = document.createElement('style');
  style.id = 'logo-animation-styles';
  style.textContent = Object.values(LOGO_ANIMATIONS).filter(a => a).join('\n');
  document.head.appendChild(style);
})();

// ============================================================================
// BUILT-IN PATTERNS (CSS-based, no images needed)
// ============================================================================

const BUILTIN_PATTERNS = {
  dots: (color, size = 2, spacing = 20) => 
    `radial-gradient(${color} ${size}px, transparent ${size}px)`,
  
  grid: (color, size = 40) =>
    `linear-gradient(${color} 1px, transparent 1px), linear-gradient(90deg, ${color} 1px, transparent 1px)`,
  
  diagonalLines: (color, size = 10) =>
    `repeating-linear-gradient(45deg, transparent, transparent ${size}px, ${color} ${size}px, ${color} ${size + 1}px)`,
  
  crosshatch: (color, size = 10) =>
    `repeating-linear-gradient(45deg, transparent, transparent ${size}px, ${color} ${size}px, ${color} ${size + 1}px), repeating-linear-gradient(-45deg, transparent, transparent ${size}px, ${color} ${size}px, ${color} ${size + 1}px)`,
  
  noise: (opacity = 0.05) =>
    `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='${opacity}'/%3E%3C/svg%3E")`,

  vignette: (color = 'rgba(0,0,0,0.4)') =>
    `radial-gradient(ellipse at center, transparent 0%, transparent 50%, ${color} 100%)`,
};

// ============================================================================
// PRESET BACKGROUNDS
// ============================================================================

const BACKGROUND_PRESETS = {
  "dark-default": {
    layers: [
      { type: "solid", color: "#0d1117" }
    ]
  },
  "dark-vignette": {
    layers: [
      { type: "solid", color: "#0d1117" },
      { type: "pattern", pattern: "vignette", color: "rgba(0,0,0,0.5)" }
    ]
  },
  "dark-grid": {
    layers: [
      { type: "solid", color: "#0d1117" },
      { type: "pattern", pattern: "grid", color: "rgba(255,255,255,0.03)", size: 40 }
    ]
  },
  "dark-dots": {
    layers: [
      { type: "solid", color: "#0d1117" },
      { type: "pattern", pattern: "dots", color: "rgba(255,255,255,0.05)", size: 1, spacing: 20 }
    ]
  },
  "midnight-glow": {
    layers: [
      { type: "solid", color: "#0a0e1a" },
      { type: "gradient", value: "radial-gradient(ellipse at 30% 20%, rgba(99, 102, 241, 0.15) 0%, transparent 50%)" },
      { type: "gradient", value: "radial-gradient(ellipse at 70% 80%, rgba(139, 92, 246, 0.1) 0%, transparent 40%)" }
    ]
  },
  "warm-paper": {
    layers: [
      { type: "solid", color: "#f5f5f0" },
      { type: "pattern", pattern: "noise", opacity: 0.03 }
    ]
  },
  "blueprint": {
    layers: [
      { type: "solid", color: "#1e3a5f" },
      { type: "pattern", pattern: "grid", color: "rgba(255,255,255,0.1)", size: 25 }
    ]
  },
  "noir": {
    layers: [
      { type: "gradient", value: "linear-gradient(180deg, #1a1a1a 0%, #000000 100%)" },
      { type: "pattern", pattern: "vignette", color: "rgba(0,0,0,0.6)" }
    ]
  }
};

// ============================================================================
// BACKGROUND BUILDER CLASS
// ============================================================================

class BackgroundBuilder {
  constructor() {
    this.container = document.getElementById('canvas-container');
    this.currentLayers = [];
  }

  /**
   * Apply a background configuration to the canvas container
   * @param {Object} config - Background configuration with layers array
   */
  apply(config) {
    if (!this.container) {
      this.container = document.getElementById('canvas-container');
      if (!this.container) {
        console.warn('Canvas container not found');
        return;
      }
    }

    // Handle preset string
    if (typeof config === 'string') {
      config = BACKGROUND_PRESETS[config] || BACKGROUND_PRESETS['dark-default'];
    }

    // Handle legacy format (single background object)
    if (config && !config.layers) {
      config = this.convertLegacyFormat(config);
    }

    if (!config || !config.layers || config.layers.length === 0) {
      this.container.style.background = '#0d1117';
      return;
    }

    this.currentLayers = config.layers;
    const cssLayers = this.generateCSS(config.layers);
    
    // Apply to container
    this.container.style.background = cssLayers.background;
    this.container.style.backgroundSize = cssLayers.backgroundSize;
    this.container.style.backgroundPosition = cssLayers.backgroundPosition;
    this.container.style.backgroundRepeat = cssLayers.backgroundRepeat;

    // Handle logo overlay if present
    this.applyLogoOverlay(config.layers);
  }

  /**
   * Convert legacy background format to layers
   */
  convertLegacyFormat(bg) {
    const layers = [];

    if (bg.type === 'solid' || (!bg.type && bg.value && !bg.value.includes('gradient'))) {
      layers.push({ type: 'solid', color: bg.value || bg.color || '#0d1117' });
    } else if (bg.type === 'gradient' || bg.type === 'linear-gradient' || bg.type === 'radial-gradient') {
      if (bg.value) {
        layers.push({ type: 'gradient', value: bg.value });
      } else if (bg.colors) {
        const gradType = bg.type === 'radial-gradient' ? 'radial-gradient' : 'linear-gradient';
        const direction = bg.direction || (gradType === 'linear-gradient' ? 'to bottom' : 'circle');
        layers.push({ 
          type: 'gradient', 
          value: `${gradType}(${direction}, ${bg.colors.join(', ')})` 
        });
      }
    } else if (bg.type === 'image' && bg.url) {
      layers.push({ type: 'image', url: bg.url, size: bg.size || 'cover' });
    }

    // Add texture if present
    if (bg.texture) {
      layers.push({ type: 'pattern', pattern: bg.texture, opacity: bg.textureOpacity || 0.1 });
    }

    return { layers: layers.length > 0 ? layers : [{ type: 'solid', color: '#0d1117' }] };
  }

  /**
   * Generate CSS properties from layers
   */
  generateCSS(layers) {
    const backgrounds = [];
    const sizes = [];
    const positions = [];
    const repeats = [];

    // Process layers in reverse (CSS backgrounds stack top-to-bottom)
    [...layers].reverse().forEach(layer => {
      const css = this.layerToCSS(layer);
      if (css) {
        backgrounds.push(css.image);
        sizes.push(css.size || 'auto');
        positions.push(css.position || 'center');
        repeats.push(css.repeat || 'no-repeat');
      }
    });

    return {
      background: backgrounds.join(', '),
      backgroundSize: sizes.join(', '),
      backgroundPosition: positions.join(', '),
      backgroundRepeat: repeats.join(', ')
    };
  }

  /**
   * Convert a single layer to CSS
   */
  layerToCSS(layer) {
    switch (layer.type) {
      case 'solid':
        return {
          image: `linear-gradient(${layer.color}, ${layer.color})`,
          size: 'cover',
          position: 'center',
          repeat: 'no-repeat'
        };

      case 'gradient':
        // Support both direct value and component-based gradients
        let gradientValue = layer.value;
        if (!gradientValue && (layer.color1 || layer.color2)) {
          const type = layer.gradientType || 'linear';
          const direction = layer.direction || 'to bottom';
          const color1 = layer.color1 || '#1a1a2e';
          const color2 = layer.color2 || '#0d1117';
          
          if (type === 'radial') {
            gradientValue = `radial-gradient(circle at center, ${color1} 0%, ${color2} 100%)`;
          } else {
            gradientValue = `linear-gradient(${direction}, ${color1}, ${color2})`;
          }
        }
        return {
          image: gradientValue || 'linear-gradient(to bottom, #1a1a2e, #0d1117)',
          size: 'cover',
          position: 'center',
          repeat: 'no-repeat'
        };

      case 'image':
        const opacity = layer.opacity !== undefined ? layer.opacity : 1;
        // For opacity, we'd need a pseudo-element, but for simplicity use the image directly
        return {
          image: `url("${layer.url}")`,
          size: layer.size || 'cover',
          position: layer.position || 'center',
          repeat: layer.repeat || 'no-repeat'
        };

      case 'pattern':
        return this.patternToCSS(layer);

      case 'logo':
        // Logos are handled separately with pseudo-element
        return null;

      default:
        return null;
    }
  }

  /**
   * Convert pattern layer to CSS
   */
  patternToCSS(layer) {
    const patternFn = BUILTIN_PATTERNS[layer.pattern];
    if (!patternFn) {
      console.warn(`Unknown pattern: ${layer.pattern}`);
      return null;
    }

    let image;
    const color = layer.color || 'rgba(255,255,255,0.1)';
    const size = layer.size || 20;
    const spacing = layer.spacing || 20;
    const opacity = layer.opacity || 0.1;

    switch (layer.pattern) {
      case 'dots':
        image = patternFn(color, layer.size || 1, spacing);
        return { image, size: `${spacing}px ${spacing}px`, position: '0 0', repeat: 'repeat' };
      
      case 'grid':
        image = patternFn(color, size);
        return { image, size: `${size}px ${size}px`, position: '0 0', repeat: 'repeat' };
      
      case 'diagonalLines':
      case 'crosshatch':
        image = patternFn(color, size);
        return { image, size: 'auto', position: '0 0', repeat: 'repeat' };
      
      case 'noise':
        image = patternFn(opacity);
        return { image, size: '200px 200px', position: '0 0', repeat: 'repeat' };
      
      case 'vignette':
        image = patternFn(color);
        return { image, size: 'cover', position: 'center', repeat: 'no-repeat' };
      
      default:
        return null;
    }
  }

  /**
   * Apply logo overlay using pseudo-element
   */
  applyLogoOverlay(layers) {
    const logoLayer = layers.find(l => l.type === 'logo');
    
    // Remove existing logo overlay
    const existing = document.getElementById('theme-logo-overlay');
    if (existing) existing.remove();

    if (!logoLayer || !logoLayer.url) return;

    const opacity = logoLayer.opacity || 0.3;
    const animation = logoLayer.animation || 'none';
    const animationDuration = logoLayer.animationDuration || '3s';
    const glowColor = logoLayer.glowColor || 'rgba(255,255,255,0.5)';

    // Create logo overlay element
    const overlay = document.createElement('div');
    overlay.id = 'theme-logo-overlay';
    
    // Set CSS custom properties for animation
    overlay.style.setProperty('--logo-opacity', opacity);
    overlay.style.setProperty('--logo-glow-color', glowColor);
    
    let animationCSS = '';
    if (animation !== 'none' && LOGO_ANIMATIONS[animation]) {
      animationCSS = `animation: logo-${animation} ${animationDuration} ease-in-out infinite;`;
    }

    overlay.style.cssText = `
      position: absolute;
      pointer-events: none;
      z-index: 0;
      ${this.getLogoPosition(logoLayer.position || 'bottom-right')}
      width: ${logoLayer.size || '80px'};
      height: ${logoLayer.size || '80px'};
      background-image: url("${logoLayer.url}");
      background-size: contain;
      background-repeat: no-repeat;
      background-position: center;
      opacity: ${opacity};
      --logo-opacity: ${opacity};
      --logo-glow-color: ${glowColor};
      ${animationCSS}
    `;

    this.container.appendChild(overlay);
  }

  /**
   * Get CSS position for logo placement
   */
  getLogoPosition(position) {
    const positions = {
      'top-left': 'top: 20px; left: 20px;',
      'top-right': 'top: 20px; right: 20px;',
      'bottom-left': 'bottom: 20px; left: 20px;',
      'bottom-right': 'bottom: 20px; right: 20px;',
      'center': 'top: 50%; left: 50%; transform: translate(-50%, -50%);'
    };
    return positions[position] || positions['bottom-right'];
  }

  /**
   * Get available presets
   */
  getPresets() {
    return Object.keys(BACKGROUND_PRESETS).map(id => ({
      id,
      name: id.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
      config: BACKGROUND_PRESETS[id]
    }));
  }

  /**
   * Get available patterns
   */
  getPatterns() {
    return Object.keys(BUILTIN_PATTERNS);
  }

  /**
   * Create a new layer
   */
  createLayer(type, options = {}) {
    switch (type) {
      case 'solid':
        return { type: 'solid', color: options.color || '#0d1117' };
      case 'gradient':
        return { type: 'gradient', value: options.value || 'linear-gradient(to bottom, #1a1a2e, #0d1117)' };
      case 'image':
        return { type: 'image', url: options.url || '', size: options.size || 'cover', opacity: options.opacity || 1 };
      case 'pattern':
        return { type: 'pattern', pattern: options.pattern || 'grid', color: options.color || 'rgba(255,255,255,0.05)', size: options.size || 20 };
      case 'logo':
        return { type: 'logo', url: options.url || '', position: options.position || 'bottom-right', size: options.size || '80px', opacity: options.opacity || 0.3 };
      default:
        return { type: 'solid', color: '#0d1117' };
    }
  }

  /**
   * Export current background as JSON
   */
  export() {
    return { layers: this.currentLayers };
  }
}

// ============================================================================
// GLOBAL INSTANCE & EXPORTS
// ============================================================================

const backgroundBuilder = new BackgroundBuilder();

window.backgroundBuilder = backgroundBuilder;
window.BACKGROUND_PRESETS = BACKGROUND_PRESETS;
window.BUILTIN_PATTERNS = BUILTIN_PATTERNS;
window.LOGO_ANIMATIONS = LOGO_ANIMATIONS;

console.log('✅ Background builder initialized with', Object.keys(BACKGROUND_PRESETS).length, 'presets');

