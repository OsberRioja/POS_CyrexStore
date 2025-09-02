import { Router } from "express";
import { UserController } from "../controllers/user.controller";

const router = Router();

router.post("/", UserController.create);
router.get("/", UserController.list);
router.get("/:id", UserController.getOne);
router.get("/code/:usercode", UserController.getByUserCode);
router.get("/email/:email", UserController.getByEmail);
router.get("/name/:name", UserController.getByName);
router.put("/:id", UserController.updateUser);
router.delete("/:id", UserController.deleteUser);

export default router;