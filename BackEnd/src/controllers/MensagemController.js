import prisma from '../prisma/client.js'

class MensagemController {

  async Enviar(req, res) {
    try {
      const { conteudo, remetenteId, destinatarioId } = req.body

      if (!conteudo || !remetenteId || !destinatarioId) {
        return res.status(400).json({ erro: 'conteudo, remetenteId e destinatarioId são obrigatórios' })
      }

      const mensagem = await prisma.mensagem.create({
        data: {
          conteudo,
          remetenteId: Number(remetenteId),
          destinatarioId: Number(destinatarioId)
        }
      })

      return res.status(201).json(mensagem)
    } catch (error) {
      console.error(error)
      return res.status(500).json({ erro: 'Erro ao enviar mensagem' })
    }
  }

  async ListarConversa(req, res) {
    try {
      const { usuarioId, outroUsuarioId } = req.params

      const mensagens = await prisma.mensagem.findMany({
        where: {
          OR: [
            { remetenteId: Number(usuarioId), destinatarioId: Number(outroUsuarioId) },
            { remetenteId: Number(outroUsuarioId), destinatarioId: Number(usuarioId) }
          ]
        },
        orderBy: { data_hora: 'asc' }
      })

      return res.status(200).json(mensagens)
    } catch (error) {
      console.error(error)
      return res.status(500).json({ erro: 'Erro ao buscar conversa' })
    }
  }
}

export default new MensagemController()