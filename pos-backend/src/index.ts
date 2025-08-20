import express from "express";
import { PrismaClient } from "@prisma/client";

const app = express();
app.use(express.json());

const prisma = new PrismaClient();

app.get("/", (_req, res) => res.send("API POS - OK"));

// listar productos
app.get("/products", async (_req, res) => {
  const products = await prisma.product.findMany({ orderBy: { createdAt: "desc" } });
  res.json(products);
});

// crear producto
app.post("/products", async (req, res) => {
  const { name, sku, salePrice, costPrice } = req.body;
  if (!name || salePrice == null) {
    return res.status(400).json({ error: "name and salePrice required" });
  }
  const product = await prisma.product.create({
    data: { name, sku, salePrice: Number(salePrice), costPrice: costPrice ? Number(costPrice) : null }
  });
  res.status(201).json(product);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server listening on http://localhost:${PORT}`));
