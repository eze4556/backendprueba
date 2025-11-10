"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const media_upload_controller_1 = __importDefault(require("../controllers/media-upload.controller"));
const multer_config_1 = require("../../../config/multer.config");
const auth_middleware_1 = require("../../../middleware/auth.middleware");
const router = (0, express_1.Router)();
/**
 * POST /api/media/upload/image
 * Upload y optimizar imagen (single o multiple)
 * Body: file (multipart/form-data), generateSizes (boolean)
 */
router.post('/upload/image', auth_middleware_1.authMiddleware, multer_config_1.imageUpload.single('file'), (req, res) => {
    media_upload_controller_1.default.uploadImage(req, res);
});
/**
 * POST /api/media/upload/images
 * Upload múltiples imágenes
 */
router.post('/upload/images', auth_middleware_1.authMiddleware, multer_config_1.imageUpload.array('files', 5), (req, res) => {
    // TODO: Implementar upload múltiple si es necesario
    res.json({ message: 'Multiple upload endpoint - to be implemented' });
});
/**
 * POST /api/media/upload/video
 * Upload video
 * Body: file (multipart/form-data)
 */
router.post('/upload/video', auth_middleware_1.authMiddleware, multer_config_1.videoUpload.single('file'), (req, res) => {
    media_upload_controller_1.default.uploadVideo(req, res);
});
/**
 * POST /api/media/optimize
 * Optimizar imagen existente
 * Body: { filePath, width?, height?, quality?, format? }
 */
router.post('/optimize', auth_middleware_1.authMiddleware, (req, res) => {
    media_upload_controller_1.default.optimizeImage(req, res);
});
/**
 * POST /api/media/thumbnail
 * Generar thumbnail
 * Body: { filePath, width?, height?, quality? }
 */
router.post('/thumbnail', auth_middleware_1.authMiddleware, (req, res) => {
    media_upload_controller_1.default.generateThumbnail(req, res);
});
/**
 * POST /api/media/convert-webp
 * Convertir imagen a WebP
 * Body: { filePath, quality? }
 */
router.post('/convert-webp', auth_middleware_1.authMiddleware, (req, res) => {
    media_upload_controller_1.default.convertToWebP(req, res);
});
/**
 * POST /api/media/compress
 * Comprimir imagen
 * Body: { filePath, quality? }
 */
router.post('/compress', auth_middleware_1.authMiddleware, (req, res) => {
    media_upload_controller_1.default.compressImage(req, res);
});
/**
 * GET /api/media/info/:filename
 * Obtener información de un archivo
 */
router.get('/info/:filename', auth_middleware_1.authMiddleware, (req, res) => {
    media_upload_controller_1.default.getMediaInfo(req, res);
});
/**
 * DELETE /api/media/:filename
 * Eliminar archivo y sus variantes
 */
router.delete('/:filename', auth_middleware_1.authMiddleware, (req, res) => {
    media_upload_controller_1.default.deleteMedia(req, res);
});
exports.default = router;
//# sourceMappingURL=media-upload.routes.js.map