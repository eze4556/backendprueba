import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';

export interface ImageOptimizationOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'jpeg' | 'png' | 'webp';
  fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
}

export interface ThumbnailOptions {
  width: number;
  height: number;
  quality?: number;
}

class MediaService {
  
  private readonly uploadsDir = path.join(process.cwd(), 'uploads');
  private readonly imagesDir = path.join(this.uploadsDir, 'images');
  private readonly videosDir = path.join(this.uploadsDir, 'videos');
  private readonly thumbnailsDir = path.join(this.uploadsDir, 'thumbnails');
  
  constructor() {
    this.ensureDirectories();
  }
  
  /**
   * Asegurar que existan los directorios necesarios
   */
  private async ensureDirectories(): Promise<void> {
    try {
      await fs.mkdir(this.uploadsDir, { recursive: true });
      await fs.mkdir(this.imagesDir, { recursive: true });
      await fs.mkdir(this.videosDir, { recursive: true });
      await fs.mkdir(this.thumbnailsDir, { recursive: true });
    } catch (error) {
      console.error('Error creating directories:', error);
    }
  }
  
  /**
   * Optimizar imagen con Sharp
   */
  public async optimizeImage(
    inputPath: string,
    outputPath?: string,
    options: ImageOptimizationOptions = {}
  ): Promise<{ path: string; size: number; metadata: sharp.Metadata }> {
    const {
      width = 1200,
      height,
      quality = 80,
      format = 'webp',
      fit = 'inside'
    } = options;
    
    // Si no se especifica outputPath, crear uno en el directorio de imágenes
    if (!outputPath) {
      const filename = path.basename(inputPath, path.extname(inputPath));
      outputPath = path.join(this.imagesDir, `${filename}-optimized.${format}`);
    }
    
    // Procesar imagen
    const image = sharp(inputPath);
    
    // Obtener metadata original
    const metadata = await image.metadata();
    
    // Redimensionar y optimizar
    await image
      .resize(width, height, { fit, withoutEnlargement: true })
      .toFormat(format, { quality })
      .toFile(outputPath);
    
    // Obtener tamaño del archivo optimizado
    const stats = await fs.stat(outputPath);
    
    return {
      path: outputPath,
      size: stats.size,
      metadata
    };
  }
  
  /**
   * Generar thumbnail de imagen
   */
  public async generateThumbnail(
    inputPath: string,
    options: ThumbnailOptions = { width: 300, height: 300, quality: 70 }
  ): Promise<string> {
    const filename = path.basename(inputPath, path.extname(inputPath));
    const thumbnailPath = path.join(this.thumbnailsDir, `${filename}-thumb.webp`);
    
    await sharp(inputPath)
      .resize(options.width, options.height, { fit: 'cover' })
      .toFormat('webp', { quality: options.quality })
      .toFile(thumbnailPath);
    
    return thumbnailPath;
  }
  
  /**
   * Procesar múltiples tamaños de una imagen
   */
  public async generateMultipleSizes(
    inputPath: string,
    sizes: Array<{ name: string; width: number; height?: number }>
  ): Promise<Array<{ name: string; path: string }>> {
    const results: Array<{ name: string; path: string }> = [];
    const filename = path.basename(inputPath, path.extname(inputPath));
    
    for (const size of sizes) {
      const outputPath = path.join(this.imagesDir, `${filename}-${size.name}.webp`);
      
      await sharp(inputPath)
        .resize(size.width, size.height, { fit: 'inside', withoutEnlargement: true })
        .toFormat('webp', { quality: 80 })
        .toFile(outputPath);
      
      results.push({
        name: size.name,
        path: outputPath
      });
    }
    
    return results;
  }
  
  /**
   * Upload y procesar imagen
   */
  public async uploadImage(
    file: Express.Multer.File,
    generateSizes: boolean = true
  ): Promise<any> {
    const originalPath = file.path;
    
    // Optimizar imagen principal
    const optimized = await this.optimizeImage(originalPath, undefined, {
      width: 1200,
      quality: 85,
      format: 'webp'
    });
    
    // Generar thumbnail
    const thumbnailPath = await this.generateThumbnail(optimized.path, {
      width: 300,
      height: 300,
      quality: 70
    });
    
    const result: any = {
      original: {
        path: originalPath,
        filename: file.filename,
        mimetype: file.mimetype,
        size: file.size
      },
      optimized: {
        path: optimized.path,
        size: optimized.size,
        width: optimized.metadata.width,
        height: optimized.metadata.height,
        format: optimized.metadata.format
      },
      thumbnail: {
        path: thumbnailPath
      }
    };
    
    // Generar tamaños adicionales si se solicita
    if (generateSizes) {
      const sizes = await this.generateMultipleSizes(optimized.path, [
        { name: 'small', width: 400 },
        { name: 'medium', width: 800 },
        { name: 'large', width: 1200 }
      ]);
      
      result.sizes = sizes;
    }
    
    return result;
  }
  
  /**
   * Upload video (sin procesamiento por ahora)
   */
  public async uploadVideo(file: Express.Multer.File): Promise<any> {
    return {
      path: file.path,
      filename: file.filename,
      mimetype: file.mimetype,
      size: file.size,
      destination: file.destination
    };
  }
  
  /**
   * Eliminar archivo y sus variantes
   */
  public async deleteMedia(filePath: string): Promise<void> {
    try {
      // Eliminar archivo principal
      await fs.unlink(filePath);
      
      // Intentar eliminar thumbnail si existe
      const filename = path.basename(filePath, path.extname(filePath));
      const thumbnailPath = path.join(this.thumbnailsDir, `${filename}-thumb.webp`);
      
      try {
        await fs.unlink(thumbnailPath);
      } catch (err) {
        // Thumbnail no existe, continuar
      }
      
      // Eliminar tamaños variantes
      const sizes = ['small', 'medium', 'large'];
      for (const size of sizes) {
        const sizePath = path.join(this.imagesDir, `${filename}-${size}.webp`);
        try {
          await fs.unlink(sizePath);
        } catch (err) {
          // No existe, continuar
        }
      }
    } catch (error) {
      console.error('Error deleting media:', error);
      throw new Error('Failed to delete media file');
    }
  }
  
  /**
   * Obtener información de un archivo
   */
  public async getMediaInfo(filePath: string): Promise<any> {
    try {
      const stats = await fs.stat(filePath);
      const ext = path.extname(filePath).toLowerCase();
      
      const info: any = {
        path: filePath,
        size: stats.size,
        created: stats.birthtime,
        modified: stats.mtime
      };
      
      // Si es imagen, obtener metadata con Sharp
      if (['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(ext)) {
        const metadata = await sharp(filePath).metadata();
        info.width = metadata.width;
        info.height = metadata.height;
        info.format = metadata.format;
        info.space = metadata.space;
      }
      
      return info;
    } catch (error) {
      throw new Error('File not found or cannot be accessed');
    }
  }
  
  /**
   * Convertir imagen a WebP
   */
  public async convertToWebP(
    inputPath: string,
    quality: number = 80
  ): Promise<string> {
    const filename = path.basename(inputPath, path.extname(inputPath));
    const outputPath = path.join(this.imagesDir, `${filename}.webp`);
    
    await sharp(inputPath)
      .toFormat('webp', { quality })
      .toFile(outputPath);
    
    return outputPath;
  }
  
  /**
   * Comprimir imagen manteniendo formato original
   */
  public async compressImage(
    inputPath: string,
    quality: number = 80
  ): Promise<{ originalSize: number; compressedSize: number; path: string }> {
    const ext = path.extname(inputPath).toLowerCase();
    const format = ext === '.png' ? 'png' : 'jpeg';
    
    const originalStats = await fs.stat(inputPath);
    const outputPath = inputPath.replace(ext, `-compressed${ext}`);
    
    if (format === 'png') {
      await sharp(inputPath)
        .png({ quality, compressionLevel: 9 })
        .toFile(outputPath);
    } else {
      await sharp(inputPath)
        .jpeg({ quality, mozjpeg: true })
        .toFile(outputPath);
    }
    
    const compressedStats = await fs.stat(outputPath);
    
    return {
      originalSize: originalStats.size,
      compressedSize: compressedStats.size,
      path: outputPath
    };
  }
}

export default new MediaService();
