import { Router } from 'express'
import avaliacaoController from '../controllers/AvaliacaoController.js'

const router = Router()

router.post('/', avaliacaoController.Criar)
router.get('/resumo', avaliacaoController.Resumo)
router.get('/troca/:anuncioId/:avaliadorId/:avaliadoId', avaliacaoController.JaAvaliei)

export default router