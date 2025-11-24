import { Router } from 'express';
import Token from '../auth/token/token';

const router = Router();

router.post('/generate-token', Token.generateToken);
router.post('/login', Token.generateToken);

export default router;
