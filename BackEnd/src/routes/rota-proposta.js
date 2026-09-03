import { Router } from "express";
import {
  criarProposta,
  listarPropostasRecebidas,
  listarPropostasEnviadas,
  responderProposta,
} from "../controllers/PropostaController.js";

const router = Router();

router.post("/", criarProposta);
router.get("/recebidas", listarPropostasRecebidas);
router.get("/enviadas", listarPropostasEnviadas);
router.put("/:id/responder", responderProposta);

export default router;