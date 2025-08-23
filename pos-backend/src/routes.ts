import { Router } from "express";
import { ProductController } from "./controllers/product.controller";
import { authMiddleware } from "./middlewares/auth.middleware";
import { UserController } from "./controllers/user.controller";

const router = Router();

router.post("/", authMiddleware, ProductController.create);
router.get("/products", ProductController.list);
router.post("/products", ProductController.create);
router.get("/products/:id", ProductController.getOne);
router.post("/users", UserController.create);

export default router;
