/**
 * PreviewRenderer - Unified system for generating canvas previews
 * 
 * Used for:
 * - Theme previews (background + color swatches)
 * - Board thumbnails (simplified board render)
 * - Future: Import previews, template previews, etc.
 */

class PreviewRenderer {
  constructor(options = {}) {
    this.defaultWidth = options.width || 200;
    this.defaultHeight = options.height || 120;
  }

  /**
   * Create an offscreen canvas with the given dimensions
   * @param {number} width 
   * @param {number} height 
   * @returns {{canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D}}
   */
  createCanvas(width = this.defaultWidth, height = this.defaultHeight) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    return { canvas, ctx };
  }

  /**
   * Render a background to a canvas context
   * Handles solid colors, gradients, and textures
   * @param {CanvasRenderingContext2D} ctx 
   * @param {number} width 
   * @param {number} height 
   * @param {Object} background - Background configuration
   */
  renderBackground(ctx, width, height, background) {
    if (!background) {
      // Default dark background
      ctx.fillStyle = '#1e1e2e';
      ctx.fillRect(0, 0, width, height);
      return;
    }

    const bgType = background.type || 'solid';

    if (bgType === 'solid') {
      ctx.fillStyle = background.value || background.color || '#1e1e2e';
      ctx.fillRect(0, 0, width, height);
    } else if (bgType === 'linear-gradient') {
      const direction = background.direction || 'to bottom';
      const colors = background.colors || ['#0a0a0a', '#1e1e2e'];
      const stops = background.stops || [0, 100];
      
      // Parse direction to get gradient coordinates
      let x0 = 0, y0 = 0, x1 = 0, y1 = height;
      if (direction.includes('right')) { x1 = width; y1 = 0; }
      if (direction.includes('left')) { x0 = width; x1 = 0; y1 = 0; }
      if (direction.includes('top')) { y0 = height; y1 = 0; }
      
      const gradient = ctx.createLinearGradient(x0, y0, x1, y1);
      colors.forEach((color, i) => {
        const stop = (stops[i] !== undefined ? stops[i] : (i / (colors.length - 1)) * 100) / 100;
        gradient.addColorStop(stop, color);
      });
      
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);
    } else if (bgType === 'radial-gradient') {
      const colors = background.colors || ['#2e2e3e', '#1e1e2e'];
      const gradient = ctx.createRadialGradient(
        width / 2, height / 2, 0,
        width / 2, height / 2, Math.max(width, height) / 2
      );
      colors.forEach((color, i) => {
        gradient.addColorStop(i / (colors.length - 1), color);
      });
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);
    }

    // Apply texture overlay if specified
    if (background.texture && background.textureOpacity) {
      this.renderTexture(ctx, width, height, background.texture, background.textureOpacity);
    }
  }

  /**
   * Render a texture overlay
   * @param {CanvasRenderingContext2D} ctx 
   * @param {number} width 
   * @param {number} height 
   * @param {string} textureType - 'noise', 'grid', 'paper', etc.
   * @param {number} opacity - 0 to 1
   */
  renderTexture(ctx, width, height, textureType, opacity = 0.05) {
    ctx.save();
    ctx.globalAlpha = opacity;

    if (textureType === 'noise') {
      // Simple noise pattern
      const imageData = ctx.getImageData(0, 0, width, height);
      const data = imageData.data;
      for (let i = 0; i < data.length; i += 4) {
        const noise = Math.random() * 50 - 25;
        data[i] = Math.min(255, Math.max(0, data[i] + noise));
        data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise));
        data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise));
      }
      ctx.putImageData(imageData, 0, 0);
    } else if (textureType === 'grid') {
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 0.5;
      const gridSize = 20;
      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }
    } else if (textureType === 'paper') {
      // Subtle paper texture with random dots
      ctx.fillStyle = '#000000';
      for (let i = 0; i < (width * height) / 100; i++) {
        const x = Math.random() * width;
        const y = Math.random() * height;
        const size = Math.random() * 1.5;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.restore();
  }

  /**
   * Render color swatches
   * @param {CanvasRenderingContext2D} ctx 
   * @param {Array<string>} colors - Array of color values
   * @param {number} x - Starting x position
   * @param {number} y - Starting y position
   * @param {Object} options - { swatchSize, gap, maxSwatches }
   */
  renderColorSwatches(ctx, colors, x, y, options = {}) {
    const {
      swatchSize = 12,
      gap = 4,
      maxSwatches = 8,
      borderRadius = 2
    } = options;

    const displayColors = colors.slice(0, maxSwatches);
    
    displayColors.forEach((color, i) => {
      const sx = x + i * (swatchSize + gap);
      
      // Draw swatch with rounded corners
      ctx.fillStyle = color;
      this.roundRect(ctx, sx, y, swatchSize, swatchSize, borderRadius);
      ctx.fill();
      
      // Subtle border
      ctx.strokeStyle = 'rgba(255,255,255,0.2)';
      ctx.lineWidth = 0.5;
      this.roundRect(ctx, sx, y, swatchSize, swatchSize, borderRadius);
      ctx.stroke();
    });
  }

  /**
   * Render a simplified pin representation
   * @param {CanvasRenderingContext2D} ctx 
   * @param {number} x 
   * @param {number} y 
   * @param {string} color 
   * @param {number} radius 
   */
  renderSimplePin(ctx, x, y, color, radius = 8) {
    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.arc(x + 1, y + 1, radius, 0, Math.PI * 2);
    ctx.fill();

    // Pin body
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();

    // Highlight
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.beginPath();
    ctx.arc(x - radius * 0.3, y - radius * 0.3, radius * 0.3, 0, Math.PI * 2);
    ctx.fill();
  }

  /**
   * Render a simple connection line
   * @param {CanvasRenderingContext2D} ctx 
   * @param {number} x1 
   * @param {number} y1 
   * @param {number} x2 
   * @param {number} y2 
   * @param {string} color 
   */
  renderSimpleLine(ctx, x1, y1, x2, y2, color = '#58a6ff') {
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }

  /**
   * Helper: Draw a rounded rectangle path
   */
  roundRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }

  // ============================================================================
  // HIGH-LEVEL PREVIEW GENERATORS
  // ============================================================================

  /**
   * Generate a theme preview image
   * Shows background, color palette, and sample pins
   * @param {Object} theme - Theme configuration object
   * @param {Object} options - { width, height }
   * @returns {string} Data URL of the preview image
   */
  generateThemePreview(theme, options = {}) {
    const width = options.width || 180;
    const height = options.height || 100;
    const { canvas, ctx } = this.createCanvas(width, height);

    // Render background
    this.renderBackground(ctx, width, height, theme.background);

    // Get colors from theme (handle both color-list and color_list)
    const colors = theme['color-list'] || theme.color_list || theme.colors || [];

    // Render color swatches at the bottom
    const swatchY = height - 20;
    const swatchSize = 10;
    const totalSwatchWidth = Math.min(colors.length, 8) * (swatchSize + 3);
    const swatchX = (width - totalSwatchWidth) / 2;
    
    this.renderColorSwatches(ctx, colors, swatchX, swatchY, {
      swatchSize,
      gap: 3,
      maxSwatches: 8
    });

    // Render sample pins to show how they'd look
    if (colors.length >= 3) {
      const pinY = height / 2 - 10;
      this.renderSimplePin(ctx, width * 0.25, pinY, colors[2] || '#58a6ff', 10);
      this.renderSimplePin(ctx, width * 0.5, pinY - 8, colors[3] || colors[1] || '#f78166', 8);
      this.renderSimplePin(ctx, width * 0.75, pinY, colors[4] || colors[2] || '#7ee787', 10);
      
      // Sample connections
      this.renderSimpleLine(ctx, width * 0.25, pinY, width * 0.5, pinY - 8, colors[2] || '#58a6ff');
      this.renderSimpleLine(ctx, width * 0.5, pinY - 8, width * 0.75, pinY, colors[3] || '#f78166');
    }

    return canvas.toDataURL('image/png');
  }

  /**
   * Generate a board preview/thumbnail
   * @param {Object} boardData - Board data with pins, connections, theme
   * @param {Object} options - { width, height }
   * @returns {string} Data URL of the preview image
   */
  generateBoardPreview(boardData, options = {}) {
    const width = options.width || 200;
    const height = options.height || 150;
    const { canvas, ctx } = this.createCanvas(width, height);

    // Get theme background or use default
    const theme = boardData.theme || {};
    this.renderBackground(ctx, width, height, theme.background);

    const pins = boardData.pins || [];
    const connections = boardData.connections || [];

    if (pins.length === 0) {
      // Empty board - show placeholder
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.font = '12px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText('Empty Board', width / 2, height / 2);
      return canvas.toDataURL('image/png');
    }

    // Calculate bounds
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;
    pins.forEach(pin => {
      minX = Math.min(minX, pin.x);
      maxX = Math.max(maxX, pin.x);
      minY = Math.min(minY, pin.y);
      maxY = Math.max(maxY, pin.y);
    });

    const contentWidth = maxX - minX || 100;
    const contentHeight = maxY - minY || 100;
    const padding = 20;

    // Calculate scale to fit
    const scaleX = (width - padding * 2) / contentWidth;
    const scaleY = (height - padding * 2) / contentHeight;
    const scale = Math.min(scaleX, scaleY, 1);

    // Transform function
    const transform = (x, y) => ({
      x: padding + (x - minX) * scale + (width - padding * 2 - contentWidth * scale) / 2,
      y: padding + (y - minY) * scale + (height - padding * 2 - contentHeight * scale) / 2
    });

    // Draw connections first
    connections.forEach(conn => {
      const fromPin = pins[conn.from];
      const toPin = pins[conn.to];
      if (fromPin && toPin) {
        const from = transform(fromPin.x, fromPin.y);
        const to = transform(toPin.x, toPin.y);
        this.renderSimpleLine(ctx, from.x, from.y, to.x, to.y, conn.color || '#58a6ff');
      }
    });

    // Draw pins
    pins.forEach(pin => {
      const pos = transform(pin.x, pin.y);
      const radius = Math.max(3, 6 * scale);
      this.renderSimplePin(ctx, pos.x, pos.y, pin.color || '#58a6ff', radius);
    });

    return canvas.toDataURL('image/png');
  }
}

// Export for global access
window.PreviewRenderer = PreviewRenderer;

// Create default instance
window.previewRenderer = new PreviewRenderer();
