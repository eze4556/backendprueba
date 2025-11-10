import { Router } from 'express';
import CategorieController from '../controllers/categorie.controllers';
import Token from '../../../auth/token/token';

const router: Router = Router();

/**
 * @route   GET /api/categorie
 * @desc    Obtener todas las categorías (PÚBLICO)
 * @access  Public
 */
router.get('/', CategorieController.getData);

/**
 * @route   POST /api/categorie/get_data
 * @desc    Obtener categorías (método alternativo - protegido)
 * @access  Private
 */
router.post('/get_data', Token.verifyToken, CategorieController.getData);

export default router;
