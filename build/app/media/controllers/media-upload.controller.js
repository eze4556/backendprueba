"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const media_service_1 = __importDefault(require("../services/media.service"));
const handler_helper_1 = __importDefault(require("../../../helpers/handler.helper"));
const codes_constanst_1 = require("../../../constants/codes.constanst");
const path_1 = __importDefault(require("path"));
const promises_1 = __importDefault(require("fs/promises"));
class MediaUploadController {
    /**
     * POST /api/media/upload/image
     * Upload y optimizar imagen
     */
    async uploadImage(req, res) {
        var _a;
        try {
            if (!req.file) {
                return handler_helper_1.default.error(res, {
                    code: codes_constanst_1.BAD_REQUEST,
                    message: 'No file uploaded'
                });
            }
            const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
            const { generateSizes = true } = req.body;
            // Procesar imagen
            const result = await media_service_1.default.uploadImage(req.file, generateSizes === 'true' || generateSizes === true);
            return handler_helper_1.default.success(res, {
                message: 'Image uploaded and optimized successfully',
                data: {
                    ...result,
                    uploadedBy: userId,
                    uploadedAt: new Date()
                }
            }, codes_constanst_1.CREATED);
        }
        catch (error) {
            console.error('Error uploading image:', error);
            return handler_helper_1.default.error(res, {
                code: codes_constanst_1.INTERNAL_ERROR,
                message: error.message || 'Failed to upload image'
            });
        }
    }
    /**
     * POST /api/media/upload/video
     * Upload video
     */
    async uploadVideo(req, res) {
        var _a;
        try {
            if (!req.file) {
                return handler_helper_1.default.error(res, {
                    code: codes_constanst_1.BAD_REQUEST,
                    message: 'No file uploaded'
                });
            }
            const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
            // Procesar video
            const result = await media_service_1.default.uploadVideo(req.file);
            return handler_helper_1.default.success(res, {
                message: 'Video uploaded successfully',
                data: {
                    ...result,
                    uploadedBy: userId,
                    uploadedAt: new Date()
                }
            }, codes_constanst_1.CREATED);
        }
        catch (error) {
            console.error('Error uploading video:', error);
            return handler_helper_1.default.error(res, {
                code: codes_constanst_1.INTERNAL_ERROR,
                message: error.message || 'Failed to upload video'
            });
        }
    }
    /**
     * POST /api/media/optimize
     * Optimizar imagen existente
     */
    async optimizeImage(req, res) {
        try {
            const { filePath, width, height, quality, format } = req.body;
            if (!filePath) {
                return handler_helper_1.default.error(res, {
                    code: codes_constanst_1.BAD_REQUEST,
                    message: 'filePath is required'
                });
            }
            const result = await media_service_1.default.optimizeImage(filePath, undefined, {
                width,
                height,
                quality,
                format
            });
            return handler_helper_1.default.success(res, {
                message: 'Image optimized successfully',
                data: result
            });
        }
        catch (error) {
            console.error('Error optimizing image:', error);
            return handler_helper_1.default.error(res, {
                code: codes_constanst_1.INTERNAL_ERROR,
                message: error.message || 'Failed to optimize image'
            });
        }
    }
    /**
     * POST /api/media/thumbnail
     * Generar thumbnail
     */
    async generateThumbnail(req, res) {
        try {
            const { filePath, width, height, quality } = req.body;
            if (!filePath) {
                return handler_helper_1.default.error(res, {
                    code: codes_constanst_1.BAD_REQUEST,
                    message: 'filePath is required'
                });
            }
            const thumbnailPath = await media_service_1.default.generateThumbnail(filePath, {
                width: width || 300,
                height: height || 300,
                quality: quality || 70
            });
            return handler_helper_1.default.success(res, {
                message: 'Thumbnail generated successfully',
                thumbnailPath
            });
        }
        catch (error) {
            console.error('Error generating thumbnail:', error);
            return handler_helper_1.default.error(res, {
                code: codes_constanst_1.INTERNAL_ERROR,
                message: error.message || 'Failed to generate thumbnail'
            });
        }
    }
    /**
     * POST /api/media/convert-webp
     * Convertir imagen a WebP
     */
    async convertToWebP(req, res) {
        try {
            const { filePath, quality } = req.body;
            if (!filePath) {
                return handler_helper_1.default.error(res, {
                    code: codes_constanst_1.BAD_REQUEST,
                    message: 'filePath is required'
                });
            }
            const webpPath = await media_service_1.default.convertToWebP(filePath, quality || 80);
            return handler_helper_1.default.success(res, {
                message: 'Image converted to WebP successfully',
                webpPath
            });
        }
        catch (error) {
            console.error('Error converting to WebP:', error);
            return handler_helper_1.default.error(res, {
                code: codes_constanst_1.INTERNAL_ERROR,
                message: error.message || 'Failed to convert to WebP'
            });
        }
    }
    /**
     * POST /api/media/compress
     * Comprimir imagen
     */
    async compressImage(req, res) {
        try {
            const { filePath, quality } = req.body;
            if (!filePath) {
                return handler_helper_1.default.error(res, {
                    code: codes_constanst_1.BAD_REQUEST,
                    message: 'filePath is required'
                });
            }
            const result = await media_service_1.default.compressImage(filePath, quality || 80);
            return handler_helper_1.default.success(res, {
                message: 'Image compressed successfully',
                data: result
            });
        }
        catch (error) {
            console.error('Error compressing image:', error);
            return handler_helper_1.default.error(res, {
                code: codes_constanst_1.INTERNAL_ERROR,
                message: error.message || 'Failed to compress image'
            });
        }
    }
    /**
     * GET /api/media/info/:filename
     * Obtener información de un archivo
     */
    async getMediaInfo(req, res) {
        try {
            const { filename } = req.params;
            if (!filename) {
                return handler_helper_1.default.error(res, {
                    code: codes_constanst_1.BAD_REQUEST,
                    message: 'filename is required'
                });
            }
            // Buscar archivo en diferentes directorios
            const possiblePaths = [
                path_1.default.join(process.cwd(), 'uploads', 'images', filename),
                path_1.default.join(process.cwd(), 'uploads', 'videos', filename),
                path_1.default.join(process.cwd(), 'uploads', filename)
            ];
            let filePath = null;
            for (const p of possiblePaths) {
                try {
                    await promises_1.default.access(p);
                    filePath = p;
                    break;
                }
                catch (err) {
                    continue;
                }
            }
            if (!filePath) {
                return handler_helper_1.default.error(res, {
                    code: codes_constanst_1.NOT_FOUND,
                    message: 'File not found'
                });
            }
            const info = await media_service_1.default.getMediaInfo(filePath);
            return handler_helper_1.default.success(res, { data: info });
        }
        catch (error) {
            console.error('Error getting media info:', error);
            return handler_helper_1.default.error(res, {
                code: codes_constanst_1.INTERNAL_ERROR,
                message: error.message || 'Failed to get media info'
            });
        }
    }
    /**
     * DELETE /api/media/:filename
     * Eliminar archivo y sus variantes
     */
    async deleteMedia(req, res) {
        try {
            const { filename } = req.params;
            if (!filename) {
                return handler_helper_1.default.error(res, {
                    code: codes_constanst_1.BAD_REQUEST,
                    message: 'filename is required'
                });
            }
            // Buscar archivo en diferentes directorios
            const possiblePaths = [
                path_1.default.join(process.cwd(), 'uploads', 'images', filename),
                path_1.default.join(process.cwd(), 'uploads', 'videos', filename),
                path_1.default.join(process.cwd(), 'uploads', filename)
            ];
            let filePath = null;
            for (const p of possiblePaths) {
                try {
                    await promises_1.default.access(p);
                    filePath = p;
                    break;
                }
                catch (err) {
                    continue;
                }
            }
            if (!filePath) {
                return handler_helper_1.default.error(res, {
                    code: codes_constanst_1.NOT_FOUND,
                    message: 'File not found'
                });
            }
            await media_service_1.default.deleteMedia(filePath);
            return handler_helper_1.default.success(res, {
                message: 'Media deleted successfully'
            });
        }
        catch (error) {
            console.error('Error deleting media:', error);
            return handler_helper_1.default.error(res, {
                code: codes_constanst_1.INTERNAL_ERROR,
                message: error.message || 'Failed to delete media'
            });
        }
    }
}
exports.default = new MediaUploadController();
//# sourceMappingURL=media-upload.controller.js.map