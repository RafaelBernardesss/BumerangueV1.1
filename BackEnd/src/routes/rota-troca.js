import { Router } from 'express'
import trocaController from '../controllers/TrocaController.js'

const router = Router()

router.get('/:anuncioId/:usuarioId/:outroUsuarioId', trocaController.Status)
router.post('/confirmar', trocaController.Confirmar)
router.get("/pendentes/:usuarioId", trocaController.ListarPendentes);

export default router