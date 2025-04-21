import { Router, Request, Response, NextFunction } from 'express';
import Token from '../../../auth/token/token';
import HistoryMiddleware from '../../history/middlewares/history.middlewares';
import * as UserMiddleware from '../../users/middlewares/user.middlewares';
import MediaController from '../controllers/media.controllers';
import multer from 'multer';

const router: Router = Router();

const MulterMiddleware = {
  picture: multer({ limits: { fileSize: 8 * 1024 * 1024 } }).single('data'),
  video: multer({ limits: { fileSize: 16 * 1024 * 1024 } }).single('data'),
};

// Helper function to handle errors in middleware
const handleMiddlewareError = (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

router.post(
  '/upload/profile_picture',
  Token.verifyToken,
  UserMiddleware.checkActive,
  MulterMiddleware.picture,
  handleMiddlewareError(HistoryMiddleware.saveHistory('upload picture')),
  MediaController.uploadProfilePicture
); // Upload picture

router.post(
  '/upload/profile_trailer',
  Token.verifyToken,
  UserMiddleware.checkActive,
  MulterMiddleware.video,
  handleMiddlewareError(HistoryMiddleware.saveHistory('upload trailer')),
  MediaController.uploadProfileTrailer
); // Upload trailer

router.post('/get/profile_picture', Token.verifyToken, UserMiddleware.checkActive, MediaController.getProfilePicture); // Get profile picture and thumbnail
router.post('/get/profile_trailer', Token.verifyToken, UserMiddleware.checkActive, MediaController.getProfileTrailer); // Get profile trailer

export default router;