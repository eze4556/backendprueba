import { Router } from 'express';
import mediaUploadController from '../controllers/media-upload.controller';
import { imageUpload, videoUpload } from '../../../config/multer.config';
import { authMiddleware } from '../../../middleware/auth.middleware';

const router = Router();

/**
 * POST /api/media/upload/image
 * Upload y optimizar imagen (single o multiple)
 * Body: file (multipart/form-data), generateSizes (boolean)
 */
router.post('/upload/image', authMiddleware, imageUpload.single('file'), (req, res) => {
  mediaUploadController.uploadImage(req as any, res);
});

/**
 * POST /api/media/upload/images
 * Upload múltiples imágenes
 */
router.post('/upload/images', authMiddleware, imageUpload.array('files', 5), (req, res) => {
  // TODO: Implementar upload múltiple si es necesario
  res.json({ message: 'Multiple upload endpoint - to be implemented' });
});

/**
 * POST /api/media/upload/video
 * Upload video
 * Body: file (multipart/form-data)
 */
router.post('/upload/video', authMiddleware, videoUpload.single('file'), (req, res) => {
  mediaUploadController.uploadVideo(req as any, res);
});

/**
 * POST /api/media/optimize
 * Optimizar imagen existente
 * Body: { filePath, width?, height?, quality?, format? }
 */
router.post('/optimize', authMiddleware, (req, res) => {
  mediaUploadController.optimizeImage(req as any, res);
});

/**
 * POST /api/media/thumbnail
 * Generar thumbnail
 * Body: { filePath, width?, height?, quality? }
 */
router.post('/thumbnail', authMiddleware, (req, res) => {
  mediaUploadController.generateThumbnail(req as any, res);
});

/**
 * POST /api/media/convert-webp
 * Convertir imagen a WebP
 * Body: { filePath, quality? }
 */
router.post('/convert-webp', authMiddleware, (req, res) => {
  mediaUploadController.convertToWebP(req as any, res);
});

/**
 * POST /api/media/compress
 * Comprimir imagen
 * Body: { filePath, quality? }
 */
router.post('/compress', authMiddleware, (req, res) => {
  mediaUploadController.compressImage(req as any, res);
});

/**
 * GET /api/media/info/:filename
 * Obtener información de un archivo
 */
router.get('/info/:filename', authMiddleware, (req, res) => {
  mediaUploadController.getMediaInfo(req as any, res);
});

/**
 * DELETE /api/media/:filename
 * Eliminar archivo y sus variantes
 */
router.delete('/:filename', authMiddleware, (req, res) => {
  mediaUploadController.deleteMedia(req as any, res);
});

export default router;
