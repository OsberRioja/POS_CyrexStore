import { Router } from 'express';
import { UserPreferenceController } from '../controllers/userPreference.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

router.get('/', authMiddleware, UserPreferenceController.getMyPreferences);
router.put('/currency', authMiddleware, UserPreferenceController.updateCurrency);

export default router;