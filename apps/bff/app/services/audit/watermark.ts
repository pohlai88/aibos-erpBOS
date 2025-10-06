import { createHash } from 'crypto';
import { logLine } from '@/lib/log';

export interface WatermarkConfig {
  text_template: string;
  diagonal: boolean;
  opacity: number;
  font_size: number;
  font_color: string;
}

export interface WatermarkContext {
  company: string;
  auditor_email: string;
  ts: string;
}

export class WatermarkService {
  /**
   * Generate watermark text with context variables
   */
  static generateWatermarkText(
    config: WatermarkConfig,
    context: WatermarkContext
  ): string {
    return config.text_template
      .replace(/{company}/g, context.company)
      .replace(/{auditor_email}/g, context.auditor_email)
      .replace(/{ts}/g, context.ts);
  }

  /**
   * Apply watermark to image buffer (PNG/JPEG)
   */
  static async applyImageWatermark(
    imageBuffer: Buffer,
    config: WatermarkConfig,
    context: WatermarkContext
  ): Promise<Buffer> {
    try {
      // For production, you would use a proper image processing library like Sharp
      // This is a simplified implementation for demonstration

      const watermarkText = this.generateWatermarkText(config, context);

      // In a real implementation, you would:
      // 1. Load the image using Sharp
      // 2. Create a watermark overlay
      // 3. Apply the watermark with specified opacity, font size, color
      // 4. Position it diagonally if configured
      // 5. Return the watermarked image buffer

      logLine({
        msg: `Applying watermark to image`,
        watermark_text: watermarkText,
        config: {
          diagonal: config.diagonal,
          opacity: config.opacity,
          font_size: config.font_size,
          font_color: config.font_color,
        },
      });

      // For now, return the original buffer with a log
      // In production, replace this with actual watermarking logic
      return imageBuffer;
    } catch (error) {
      logLine({
        msg: `Failed to apply image watermark: ${error}`,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Apply watermark to PDF buffer
   */
  static async applyPdfWatermark(
    pdfBuffer: Buffer,
    config: WatermarkConfig,
    context: WatermarkContext
  ): Promise<Buffer> {
    try {
      // For production, you would use a PDF processing library like PDF-lib
      // This is a simplified implementation for demonstration

      const watermarkText = this.generateWatermarkText(config, context);

      // In a real implementation, you would:
      // 1. Load the PDF using PDF-lib
      // 2. Create watermark text on each page
      // 3. Apply the watermark with specified opacity, font size, color
      // 4. Position it diagonally if configured
      // 5. Return the watermarked PDF buffer

      logLine({
        msg: `Applying watermark to PDF`,
        watermark_text: watermarkText,
        config: {
          diagonal: config.diagonal,
          opacity: config.opacity,
          font_size: config.font_size,
          font_color: config.font_color,
        },
      });

      // For now, return the original buffer with a log
      // In production, replace this with actual watermarking logic
      return pdfBuffer;
    } catch (error) {
      logLine({
        msg: `Failed to apply PDF watermark: ${error}`,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Apply watermark to document based on MIME type
   */
  static async applyWatermark(
    fileBuffer: Buffer,
    mimeType: string,
    config: WatermarkConfig,
    context: WatermarkContext
  ): Promise<Buffer> {
    const watermarkText = this.generateWatermarkText(config, context);

    logLine({
      msg: `Applying watermark to file`,
      mime_type: mimeType,
      watermark_text: watermarkText,
      file_size: fileBuffer.length,
    });

    // Route to appropriate watermarking method based on MIME type
    if (mimeType.startsWith('image/')) {
      return this.applyImageWatermark(fileBuffer, config, context);
    } else if (mimeType === 'application/pdf') {
      return this.applyPdfWatermark(fileBuffer, config, context);
    } else {
      // For other file types, return original buffer
      logLine({
        msg: `Watermarking not supported for MIME type: ${mimeType}`,
        mime_type: mimeType,
      });
      return fileBuffer;
    }
  }

  /**
   * Generate download key hash for security
   */
  static generateDownloadKey(): string {
    return createHash('sha256')
      .update(Math.random().toString() + Date.now().toString())
      .digest('hex')
      .substring(0, 32);
  }

  /**
   * Validate download key format
   */
  static validateDownloadKey(key: string): boolean {
    return /^[a-f0-9]{32}$/.test(key);
  }
}
