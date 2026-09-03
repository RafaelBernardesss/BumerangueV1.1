import { Router } from "express";
import CadastroController from "../controllers/CadastroController.js";

const router = Router();

router.post("/cadastro", CadastroController.cadastrar);

export default router;