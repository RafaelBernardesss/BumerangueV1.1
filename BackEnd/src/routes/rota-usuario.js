import { Router } from "express";
import multer from "multer";
import {
  buscarUsuario,
  atualizarFotoPerfil,
  removerFotoPerfil,
  atualizarNomeUsuario,
  atualizarTelefone,
  atualizarLocalizacao,
  redefinirSenha,
  excluirConta,
  salvarPushToken,
} from "../controllers/UsuarioController.js";
import uploadFoto from "../middlewares/uploadFoto.js";

const router = Router();

// Middleware que envolve o multer e trata os erros dele como JSON
function tratarUploadFoto(req, res, next) {
  uploadFoto.single("foto")(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ erro: err.message });
    }
    if (err) {
      return res.status(400).json({ erro: err.message });
    }
    next();
  });
}

router.get("/:id", buscarUsuario);
router.put("/:id/foto", tratarUploadFoto, atualizarFotoPerfil);
router.delete("/:id/foto", removerFotoPerfil);
router.put("/:id/nome", atualizarNomeUsuario);
router.put("/:id/telefone", atualizarTelefone);
router.put("/:id/localizacao", atualizarLocalizacao);
router.put("/:id/senha", redefinirSenha);
router.put("/:id/push-token", salvarPushToken);
router.delete("/:id", excluirConta);

export default router;