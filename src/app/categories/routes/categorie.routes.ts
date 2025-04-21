import { Router } from 'express';
import CategorieController from '../controllers/categorie.controllers';
const router: Router = Router();

router.post('/get_data', CategorieController.getData);

export default router;
