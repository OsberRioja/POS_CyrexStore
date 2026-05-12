import { Router } from "express";
import { PromotionController } from "../controllers/promotion.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

const router = Router();
router.get('/', authMiddleware, PromotionController.list);
router.get('/:id', authMiddleware, PromotionController.get);
router.post('/', authMiddleware, PromotionController.create);
router.put('/:id', authMiddleware, PromotionController.update);
router.delete('/:id', authMiddleware, PromotionController.remove);

export default router;
