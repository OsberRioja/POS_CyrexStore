import { Router } from "express";
import { ProductController } from "./controllers/product.controller";

const router = Router();

router.get("/products", ProductController.list);
router.post("/products", ProductController.create);
router.get("/products/:id", ProductController.getOne);

export default router;
