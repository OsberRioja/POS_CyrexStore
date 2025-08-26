import { Router } from "express";
import { ClienteController } from "../controllers/client.controller";

const router = Router();

router.post("/", ClienteController.create);
router.get("/", ClienteController.list);
router.get("/:id", ClienteController.getById);
router.put("/:id", ClienteController.update);
router.delete("/:id", ClienteController.remove);

export default router;
