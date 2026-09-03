import { Router } from "express";
import { listarCategorias, criarCategoria, excluirCategoria } from "../controllers/categoriaController.js";

const router = Router();

router.get("/", listarCategorias);
router.post("/", criarCategoria);
router.delete("/:id", excluirCategoria);

export default router;