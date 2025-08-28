import { Router } from "express";
import { ProviderController } from "../controllers/provider.controller";

const router = Router();

router.post("/", ProviderController.create);
router.get("/", ProviderController.list);
router.get("/:id", ProviderController.getById);
router.put("/:id", ProviderController.update);
router.delete("/:id", ProviderController.remove);

export default router;
