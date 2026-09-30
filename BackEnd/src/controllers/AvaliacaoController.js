import prisma from '../prisma/client.js'

class AvaliacaoController {

  // Cria uma avaliação (só depois da troca finalizada)
  async Criar(req, res) {
    try {
      const { anuncioId, avaliadorId, avaliadoId, nota, comentario } = req.body

      if (!anuncioId || !avaliadorId || !avaliadoId) {
        return res.status(400).json({ erro: 'anuncioId, avaliadorId e avaliadoId são obrigatórios' })
      }

      const notaNum = Number(nota)
      if (!Number.isInteger(notaNum) || notaNum < 1 || notaNum > 5) {
        return res.status(400).json({ erro: 'A nota deve ser um número inteiro de 1 a 5.' })
      }

      if (Number(avaliadorId) === Number(avaliadoId)) {
        return res.status(400).json({ erro: 'Você não pode avaliar a si mesmo.' })
      }

      const anuncio = await prisma.anuncio.findUnique({
        where: { id: Number(anuncioId) },
        select: { id: true, usuarioId: true },
      })

      if (!anuncio) {
        return res.status(404).json({ erro: 'Anúncio não encontrado.' })
      }

      const { usuarioAId, usuarioBId } = definirPapeis(
        anuncio.usuarioId,
        Number(avaliadorId),
        Number(avaliadoId)
      )

      if (!usuarioAId) {
        return res.status(400).json({ erro: 'Os usuários informados não participaram desta troca.' })
      }

      const troca = await prisma.troca.findUnique({
        where: { anuncioId_usuarioBId: { anuncioId: Number(anuncioId), usuarioBId } },
      })

      if (!troca || !troca.finalizada) {
        return res.status(400).json({ erro: 'Só é possível avaliar depois que a troca for finalizada.' })
      }

      const existente = await prisma.avaliacao.findUnique({
        where: { trocaId_avaliadorId: { trocaId: troca.id, avaliadorId: Number(avaliadorId) } },
      })

      if (existente) {
        return res.status(409).json({ erro: 'Você já avaliou esta troca.' })
      }

      const texto = typeof comentario === 'string' ? comentario.trim().slice(0, 300) : ''

      const avaliacao = await prisma.avaliacao.create({
        data: {
          trocaId: troca.id,
          avaliadorId: Number(avaliadorId),
          avaliadoId: Number(avaliadoId),
          nota: notaNum,
          comentario: texto || null,
        },
      })

      return res.status(201).json({ avaliacao })
    } catch (error) {
      console.error(error)
      return res.status(500).json({ erro: 'Erro ao salvar avaliação' })
    }
  }

  // Média e total de avaliações de vários usuários: GET /avaliacoes/resumo?ids=1,2,3
  async Resumo(req, res) {
    try {
      const ids = String(req.query.ids || '')
        .split(',')
        .map(Number)
        .filter((n) => Number.isInteger(n) && n > 0)

      if (ids.length === 0) {
        return res.status(200).json({ resumo: {} })
      }

      const grupos = await prisma.avaliacao.groupBy({
        by: ['avaliadoId'],
        where: { avaliadoId: { in: ids } },
        _avg: { nota: true },
        _count: { nota: true },
      })

      const resumo = {}
      for (const id of ids) {
        resumo[id] = { media: 0, total: 0 }
      }
      for (const g of grupos) {
        resumo[g.avaliadoId] = {
          media: Math.round((g._avg.nota || 0) * 10) / 10,
          total: g._count.nota,
        }
      }

      return res.status(200).json({ resumo })
    } catch (error) {
      console.error(error)
      return res.status(500).json({ erro: 'Erro ao buscar avaliações' })
    }
  }

  // Verifica se eu já avaliei essa troca: GET /avaliacoes/troca/:anuncioId/:avaliadorId/:avaliadoId
  async JaAvaliei(req, res) {
    try {
      const { anuncioId, avaliadorId, avaliadoId } = req.params

      const anuncio = await prisma.anuncio.findUnique({
        where: { id: Number(anuncioId) },
        select: { id: true, usuarioId: true },
      })

      if (!anuncio) {
        return res.status(404).json({ erro: 'Anúncio não encontrado.' })
      }

      const { usuarioAId, usuarioBId } = definirPapeis(
        anuncio.usuarioId,
        Number(avaliadorId),
        Number(avaliadoId)
      )

      if (!usuarioAId) {
        return res.status(400).json({ erro: 'Os usuários informados não participaram desta troca.' })
      }

      const troca = await prisma.troca.findUnique({
        where: { anuncioId_usuarioBId: { anuncioId: Number(anuncioId), usuarioBId } },
      })

      if (!troca) {
        return res.status(200).json({ avaliada: false, nota: null })
      }

      const existente = await prisma.avaliacao.findUnique({
        where: { trocaId_avaliadorId: { trocaId: troca.id, avaliadorId: Number(avaliadorId) } },
      })

      return res.status(200).json({
        avaliada: Boolean(existente),
        nota: existente?.nota ?? null,
      })
    } catch (error) {
      console.error(error)
      return res.status(500).json({ erro: 'Erro ao verificar avaliação' })
    }
  }
}

function definirPapeis(donoId, usuario1, usuario2) {
  if (donoId === usuario1) return { usuarioAId: usuario1, usuarioBId: usuario2 }
  if (donoId === usuario2) return { usuarioAId: usuario2, usuarioBId: usuario1 }
  return { usuarioAId: null, usuarioBId: null }
}

export default new AvaliacaoController()