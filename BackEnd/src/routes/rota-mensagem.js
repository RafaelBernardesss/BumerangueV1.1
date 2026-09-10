import { Router } from 'express'
import mensagemController from '../controllers/mensagemController.js'

const router = Router()

router.post('/', mensagemController.Enviar)
router.get('/:usuarioId/:outroUsuarioId', mensagemController.ListarConversa)

export default router