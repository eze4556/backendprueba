import { Response } from 'express';
import { AuthRequest } from '../../../interfaces/auth.interface';
import mediaService from '../services/media.service';
import HttpHandler from '../../../helpers/handler.helper';
import { SUCCESS, BAD_REQUEST, NOT_FOUND, INTERNAL_ERROR, CREATED } from '../../../constants/codes.constanst';
import path from 'path';
import fs from 'fs/promises';

class MediaUploadController {
  
  /**
   * POST /api/media/upload/image
   * Upload y optimizar imagen
   */
  public async uploadImage(req: AuthRequest, res: Response): Promise<Response> {
    try {
      if (!req.file) {
        return HttpHandler.error(res, {
          code: BAD_REQUEST,
          message: 'No file uploaded'
        });
      }
      
      const userId = req.user?.id;
      const { generateSizes = true } = req.body;
      
      // Procesar imagen
      const result = await mediaService.uploadImage(req.file, generateSizes === 'true' || generateSizes === true);
      
      return HttpHandler.success(res, {
        message: 'Image uploaded and optimized successfully',
        data: {
          ...result,
          uploadedBy: userId,
          uploadedAt: new Date()
        }
      }, CREATED);
      
    } catch (error: any) {
      console.error('Error uploading image:', error);
      return HttpHandler.error(res, {
        code: INTERNAL_ERROR,
        message: error.message || 'Failed to upload image'
      });
    }
  }
  
  /**
   * POST /api/media/upload/video
   * Upload video
   */
  public async uploadVideo(req: AuthRequest, res: Response): Promise<Response> {
    try {
      if (!req.file) {
        return HttpHandler.error(res, {
          code: BAD_REQUEST,
          message: 'No file uploaded'
        });
      }
      
      const userId = req.user?.id;
      
      // Procesar video
      const result = await mediaService.uploadVideo(req.file);
      
      return HttpHandler.success(res, {
        message: 'Video uploaded successfully',
        data: {
          ...result,
          uploadedBy: userId,
          uploadedAt: new Date()
        }
      }, CREATED);
      
    } catch (error: any) {
      console.error('Error uploading video:', error);
      return HttpHandler.error(res, {
        code: INTERNAL_ERROR,
        message: error.message || 'Failed to upload video'
      });
    }
  }
  
  /**
   * POST /api/media/optimize
   * Optimizar imagen existente
   */
  public async optimizeImage(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const { filePath, width, height, quality, format } = req.body;
      
      if (!filePath) {
        return HttpHandler.error(res, {
          code: BAD_REQUEST,
          message: 'filePath is required'
        });
      }
      
      const result = await mediaService.optimizeImage(filePath, undefined, {
        width,
        height,
        quality,
        format
      });
      
      return HttpHandler.success(res, {
        message: 'Image optimized successfully',
        data: result
      });
      
    } catch (error: any) {
      console.error('Error optimizing image:', error);
      return HttpHandler.error(res, {
        code: INTERNAL_ERROR,
        message: error.message || 'Failed to optimize image'
      });
    }
  }
  
  /**
   * POST /api/media/thumbnail
   * Generar thumbnail
   */
  public async generateThumbnail(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const { filePath, width, height, quality } = req.body;
      
      if (!filePath) {
        return HttpHandler.error(res, {
          code: BAD_REQUEST,
          message: 'filePath is required'
        });
      }
      
      const thumbnailPath = await mediaService.generateThumbnail(filePath, {
        width: width || 300,
        height: height || 300,
        quality: quality || 70
      });
      
      return HttpHandler.success(res, {
        message: 'Thumbnail generated successfully',
        thumbnailPath
      });
      
    } catch (error: any) {
      console.error('Error generating thumbnail:', error);
      return HttpHandler.error(res, {
        code: INTERNAL_ERROR,
        message: error.message || 'Failed to generate thumbnail'
      });
    }
  }
  
  /**
   * POST /api/media/convert-webp
   * Convertir imagen a WebP
   */
  public async convertToWebP(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const { filePath, quality } = req.body;
      
      if (!filePath) {
        return HttpHandler.error(res, {
          code: BAD_REQUEST,
          message: 'filePath is required'
        });
      }
      
      const webpPath = await mediaService.convertToWebP(filePath, quality || 80);
      
      return HttpHandler.success(res, {
        message: 'Image converted to WebP successfully',
        webpPath
      });
      
    } catch (error: any) {
      console.error('Error converting to WebP:', error);
      return HttpHandler.error(res, {
        code: INTERNAL_ERROR,
        message: error.message || 'Failed to convert to WebP'
      });
    }
  }
  
  /**
   * POST /api/media/compress
   * Comprimir imagen
   */
  public async compressImage(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const { filePath, quality } = req.body;
      
      if (!filePath) {
        return HttpHandler.error(res, {
          code: BAD_REQUEST,
          message: 'filePath is required'
        });
      }
      
      const result = await mediaService.compressImage(filePath, quality || 80);
      
      return HttpHandler.success(res, {
        message: 'Image compressed successfully',
        data: result
      });
      
    } catch (error: any) {
      console.error('Error compressing image:', error);
      return HttpHandler.error(res, {
        code: INTERNAL_ERROR,
        message: error.message || 'Failed to compress image'
      });
    }
  }
  
  /**
   * GET /api/media/info/:filename
   * Obtener información de un archivo
   */
  public async getMediaInfo(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const { filename } = req.params;
      
      if (!filename) {
        return HttpHandler.error(res, {
          code: BAD_REQUEST,
          message: 'filename is required'
        });
      }
      
      // Buscar archivo en diferentes directorios
      const possiblePaths = [
        path.join(process.cwd(), 'uploads', 'images', filename),
        path.join(process.cwd(), 'uploads', 'videos', filename),
        path.join(process.cwd(), 'uploads', filename)
      ];
      
      let filePath: string | null = null;
      for (const p of possiblePaths) {
        try {
          await fs.access(p);
          filePath = p;
          break;
        } catch (err) {
          continue;
        }
      }
      
      if (!filePath) {
        return HttpHandler.error(res, {
          code: NOT_FOUND,
          message: 'File not found'
        });
      }
      
      const info = await mediaService.getMediaInfo(filePath);
      
      return HttpHandler.success(res, { data: info });
      
    } catch (error: any) {
      console.error('Error getting media info:', error);
      return HttpHandler.error(res, {
        code: INTERNAL_ERROR,
        message: error.message || 'Failed to get media info'
      });
    }
  }
  
  /**
   * DELETE /api/media/:filename
   * Eliminar archivo y sus variantes
   */
  public async deleteMedia(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const { filename } = req.params;
      
      if (!filename) {
        return HttpHandler.error(res, {
          code: BAD_REQUEST,
          message: 'filename is required'
        });
      }
      
      // Buscar archivo en diferentes directorios
      const possiblePaths = [
        path.join(process.cwd(), 'uploads', 'images', filename),
        path.join(process.cwd(), 'uploads', 'videos', filename),
        path.join(process.cwd(), 'uploads', filename)
      ];
      
      let filePath: string | null = null;
      for (const p of possiblePaths) {
        try {
          await fs.access(p);
          filePath = p;
          break;
        } catch (err) {
          continue;
        }
      }
      
      if (!filePath) {
        return HttpHandler.error(res, {
          code: NOT_FOUND,
          message: 'File not found'
        });
      }
      
      await mediaService.deleteMedia(filePath);
      
      return HttpHandler.success(res, {
        message: 'Media deleted successfully'
      });
      
    } catch (error: any) {
      console.error('Error deleting media:', error);
      return HttpHandler.error(res, {
        code: INTERNAL_ERROR,
        message: error.message || 'Failed to delete media'
      });
    }
  }
}

export default new MediaUploadController();
