import { Router } from 'express'
import trocaController from '../controllers/TrocaController.js';
import multer from 'multer';

const upload = multer({dest: 'uploads/'})
const router = Router()

router.get('/:anuncioId/:usuarioId/:outroUsuarioId', trocaController.Status);
router.post('/confirmar', trocaController.Confirmar);
router.post('/cancelar', trocaController.Cancelar)
router.post('/enviar-foto', upload.single('foto'), trocaController.EnviarFoto);
router.get("/pendentes/:usuarioId", trocaController.ListarPendentes);

export default router