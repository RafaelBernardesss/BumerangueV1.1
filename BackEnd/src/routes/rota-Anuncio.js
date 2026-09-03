import { Router } from "express";
import {
  criarAnuncio,
  listarAnuncios,
  buscarAnuncio,
  atualizarAnuncio,
  excluirAnuncio,
} from "../controllers/anuncioController.js";
import uploadFotoAnuncio from "../middlewares/uploadFotoAnuncio.js";

const router = Router();

router.post("/", uploadFotoAnuncio.single("foto"), criarAnuncio);
router.get("/", listarAnuncios);
router.get("/:id", buscarAnuncio);
router.put("/:id", uploadFotoAnuncio.single("foto"), atualizarAnuncio);
router.delete("/:id", excluirAnuncio);

export default router;