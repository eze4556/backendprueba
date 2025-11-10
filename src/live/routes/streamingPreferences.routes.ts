import { Router } from 'express';
import { savePreferences, getPreferences } from '../controllers/streamingPreferences.controller';

const router = Router();

router.post('/', savePreferences);
router.get('/:userId', getPreferences);

export default router;