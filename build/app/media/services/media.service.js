"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sharp_1 = __importDefault(require("sharp"));
const path_1 = __importDefault(require("path"));
const promises_1 = __importDefault(require("fs/promises"));
class MediaService {
    constructor() {
        this.uploadsDir = path_1.default.join(process.cwd(), 'uploads');
        this.imagesDir = path_1.default.join(this.uploadsDir, 'images');
        this.videosDir = path_1.default.join(this.uploadsDir, 'videos');
        this.thumbnailsDir = path_1.default.join(this.uploadsDir, 'thumbnails');
        this.ensureDirectories();
    }
    /**
     * Asegurar que existan los directorios necesarios
     */
    async ensureDirectories() {
        try {
            await promises_1.default.mkdir(this.uploadsDir, { recursive: true });
            await promises_1.default.mkdir(this.imagesDir, { recursive: true });
            await promises_1.default.mkdir(this.videosDir, { recursive: true });
            await promises_1.default.mkdir(this.thumbnailsDir, { recursive: true });
        }
        catch (error) {
            console.error('Error creating directories:', error);
        }
    }
    /**
     * Optimizar imagen con Sharp
     */
    async optimizeImage(inputPath, outputPath, options = {}) {
        const { width = 1200, height, quality = 80, format = 'webp', fit = 'inside' } = options;
        // Si no se especifica outputPath, crear uno en el directorio de imágenes
        if (!outputPath) {
            const filename = path_1.default.basename(inputPath, path_1.default.extname(inputPath));
            outputPath = path_1.default.join(this.imagesDir, `${filename}-optimized.${format}`);
        }
        // Procesar imagen
        const image = (0, sharp_1.default)(inputPath);
        // Obtener metadata original
        const metadata = await image.metadata();
        // Redimensionar y optimizar
        await image
            .resize(width, height, { fit, withoutEnlargement: true })
            .toFormat(format, { quality })
            .toFile(outputPath);
        // Obtener tamaño del archivo optimizado
        const stats = await promises_1.default.stat(outputPath);
        return {
            path: outputPath,
            size: stats.size,
            metadata
        };
    }
    /**
     * Generar thumbnail de imagen
     */
    async generateThumbnail(inputPath, options = { width: 300, height: 300, quality: 70 }) {
        const filename = path_1.default.basename(inputPath, path_1.default.extname(inputPath));
        const thumbnailPath = path_1.default.join(this.thumbnailsDir, `${filename}-thumb.webp`);
        await (0, sharp_1.default)(inputPath)
            .resize(options.width, options.height, { fit: 'cover' })
            .toFormat('webp', { quality: options.quality })
            .toFile(thumbnailPath);
        return thumbnailPath;
    }
    /**
     * Procesar múltiples tamaños de una imagen
     */
    async generateMultipleSizes(inputPath, sizes) {
        const results = [];
        const filename = path_1.default.basename(inputPath, path_1.default.extname(inputPath));
        for (const size of sizes) {
            const outputPath = path_1.default.join(this.imagesDir, `${filename}-${size.name}.webp`);
            await (0, sharp_1.default)(inputPath)
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
    async uploadImage(file, generateSizes = true) {
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
        const result = {
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
    async uploadVideo(file) {
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
    async deleteMedia(filePath) {
        try {
            // Eliminar archivo principal
            await promises_1.default.unlink(filePath);
            // Intentar eliminar thumbnail si existe
            const filename = path_1.default.basename(filePath, path_1.default.extname(filePath));
            const thumbnailPath = path_1.default.join(this.thumbnailsDir, `${filename}-thumb.webp`);
            try {
                await promises_1.default.unlink(thumbnailPath);
            }
            catch (err) {
                // Thumbnail no existe, continuar
            }
            // Eliminar tamaños variantes
            const sizes = ['small', 'medium', 'large'];
            for (const size of sizes) {
                const sizePath = path_1.default.join(this.imagesDir, `${filename}-${size}.webp`);
                try {
                    await promises_1.default.unlink(sizePath);
                }
                catch (err) {
                    // No existe, continuar
                }
            }
        }
        catch (error) {
            console.error('Error deleting media:', error);
            throw new Error('Failed to delete media file');
        }
    }
    /**
     * Obtener información de un archivo
     */
    async getMediaInfo(filePath) {
        try {
            const stats = await promises_1.default.stat(filePath);
            const ext = path_1.default.extname(filePath).toLowerCase();
            const info = {
                path: filePath,
                size: stats.size,
                created: stats.birthtime,
                modified: stats.mtime
            };
            // Si es imagen, obtener metadata con Sharp
            if (['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(ext)) {
                const metadata = await (0, sharp_1.default)(filePath).metadata();
                info.width = metadata.width;
                info.height = metadata.height;
                info.format = metadata.format;
                info.space = metadata.space;
            }
            return info;
        }
        catch (error) {
            throw new Error('File not found or cannot be accessed');
        }
    }
    /**
     * Convertir imagen a WebP
     */
    async convertToWebP(inputPath, quality = 80) {
        const filename = path_1.default.basename(inputPath, path_1.default.extname(inputPath));
        const outputPath = path_1.default.join(this.imagesDir, `${filename}.webp`);
        await (0, sharp_1.default)(inputPath)
            .toFormat('webp', { quality })
            .toFile(outputPath);
        return outputPath;
    }
    /**
     * Comprimir imagen manteniendo formato original
     */
    async compressImage(inputPath, quality = 80) {
        const ext = path_1.default.extname(inputPath).toLowerCase();
        const format = ext === '.png' ? 'png' : 'jpeg';
        const originalStats = await promises_1.default.stat(inputPath);
        const outputPath = inputPath.replace(ext, `-compressed${ext}`);
        if (format === 'png') {
            await (0, sharp_1.default)(inputPath)
                .png({ quality, compressionLevel: 9 })
                .toFile(outputPath);
        }
        else {
            await (0, sharp_1.default)(inputPath)
                .jpeg({ quality, mozjpeg: true })
                .toFile(outputPath);
        }
        const compressedStats = await promises_1.default.stat(outputPath);
        return {
            originalSize: originalStats.size,
            compressedSize: compressedStats.size,
            path: outputPath
        };
    }
}
exports.default = new MediaService();
//# sourceMappingURL=media.service.js.map