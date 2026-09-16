import { Router } from 'express'
import mensagemController from '../controllers/mensagemController.js'
import uploadFotoChat from '../middlewares/UploadFotoChat.js'

const router = Router()

router.post('/', mensagemController.Enviar)
router.post('/foto', uploadFotoChat.single('foto'), mensagemController.EnviarFoto)
router.get('/:anuncioId/:usuarioId/:outroUsuarioId', mensagemController.ListarConversa)
router.delete('/:anuncioId/:usuarioId/:outroUsuarioId', mensagemController.ApagarConversa)

export default router