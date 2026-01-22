// ============================================================================
// IMAGE UTILITIES - Image processing, resizing, and optimization
// ============================================================================

/**
 * Image processing utilities for pins
 */
class ImageUtils {
  /**
   * Process an image file for use in pins
   * @param {File} file - The image file to process
   * @param {Object} options - Processing options
   * @param {number} options.maxDimension - Maximum dimension for long side (default: 600)
   * @param {string} options.format - Output format ('jpeg' or 'png', default: 'jpeg')
   * @param {number} options.quality - JPEG quality 0-1 (default: 0.85)
   * @returns {Promise<string>} Base64 data URL of processed image
   */
  static async processImage(file, options = {}) {
    const {
      maxDimension = 600,
      format = 'jpeg',
      quality = 0.85
    } = options;

    return new Promise((resolve, reject) => {
      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      img.onload = () => {
        try {
          // Calculate new dimensions maintaining aspect ratio
          let { width, height } = this.calculateDimensions(img.width, img.height, maxDimension);

          // Set canvas size
          canvas.width = width;
          canvas.height = height;

          // Draw and resize image
          ctx.drawImage(img, 0, 0, width, height);

          // Convert to data URL
          const mimeType = format === 'png' ? 'image/png' : 'image/jpeg';
          const dataUrl = canvas.toDataURL(mimeType, quality);

          resolve(dataUrl);
        } catch (error) {
          reject(error);
        }
      };

      img.onerror = () => reject(new Error('Failed to load image'));

      // Load image from file
      const reader = new FileReader();
      reader.onload = (e) => img.src = e.target.result;
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  }

  /**
   * Calculate dimensions for resizing while maintaining aspect ratio
   * @param {number} originalWidth - Original image width
   * @param {number} originalHeight - Original image height
   * @param {number} maxDimension - Maximum dimension for long side
   * @returns {Object} {width, height} - New dimensions
   */
  static calculateDimensions(originalWidth, originalHeight, maxDimension) {
    const aspectRatio = originalWidth / originalHeight;

    let width, height;

    if (originalWidth > originalHeight) {
      // Landscape
      width = Math.min(originalWidth, maxDimension);
      height = width / aspectRatio;
    } else {
      // Portrait or square
      height = Math.min(originalHeight, maxDimension);
      width = height * aspectRatio;
    }

    return {
      width: Math.round(width),
      height: Math.round(height)
    };
  }

  /**
   * Validate image file
   * @param {File} file - File to validate
   * @returns {Object} {valid: boolean, error?: string}
   */
  static validateImageFile(file) {
    // Check file type
    if (!file.type.startsWith('image/')) {
      return { valid: false, error: 'File must be an image' };
    }

    // Check file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return { valid: false, error: 'Image file too large (max 10MB)' };
    }

    return { valid: true };
  }

  /**
   * Create a thumbnail version of an image
   * @param {string} dataUrl - Original image data URL
   * @param {number} size - Thumbnail size (square)
   * @returns {Promise<string>} Thumbnail data URL
   */
  static async createThumbnail(dataUrl, size = 64) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      img.onload = () => {
        try {
          canvas.width = size;
          canvas.height = size;

          // Calculate cropping to make square
          const aspectRatio = img.width / img.height;
          let sx, sy, sWidth, sHeight;

          if (aspectRatio > 1) {
            // Landscape - crop width
            sWidth = img.height;
            sHeight = img.height;
            sx = (img.width - sWidth) / 2;
            sy = 0;
          } else {
            // Portrait - crop height
            sWidth = img.width;
            sHeight = img.width;
            sx = 0;
            sy = (img.height - sHeight) / 2;
          }

          ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, size, size);
          resolve(canvas.toDataURL('image/jpeg', 0.8));
        } catch (error) {
          reject(error);
        }
      };

      img.onerror = () => reject(new Error('Failed to load image for thumbnail'));
      img.src = dataUrl;
    });
  }

  /**
   * Get image dimensions from data URL
   * @param {string} dataUrl - Image data URL
   * @returns {Promise<Object>} {width, height}
   */
  static getImageDimensions(dataUrl) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve({ width: img.width, height: img.height });
      img.onerror = () => reject(new Error('Failed to get image dimensions'));
      img.src = dataUrl;
    });
  }
}

// Export for global access
window.ImageUtils = ImageUtils;
