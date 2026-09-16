import prisma from '../prisma/client.js'

class MensagemController {

  async Enviar(req, res) {
    try {
      const { conteudo, remetenteId, destinatarioId, anuncioId, tipo } = req.body

      if (!conteudo || !remetenteId || !destinatarioId || !anuncioId) {
        return res.status(400).json({ erro: 'conteudo, remetenteId, destinatarioId e anuncioId são obrigatórios' })
      }

      const mensagem = await prisma.mensagem.create({
        data: {
          conteudo,
          tipo: tipo === 'foto' ? 'foto' : 'texto',
          remetenteId: Number(remetenteId),
          destinatarioId: Number(destinatarioId),
          anuncioId: Number(anuncioId),
        }
      })

      return res.status(201).json(mensagem)
    } catch (error) {
      console.error(error)
      return res.status(500).json({ erro: 'Erro ao enviar mensagem' })
    }
  }

  async EnviarFoto(req, res) {
    try {
      const { remetenteId, destinatarioId, anuncioId } = req.body

      if (!req.file || !remetenteId || !destinatarioId || !anuncioId) {
        return res.status(400).json({ erro: 'foto, remetenteId, destinatarioId e anuncioId são obrigatórios' })
      }

      const caminho = `uploads/chat/${req.file.filename}`

      const mensagem = await prisma.mensagem.create({
        data: {
          conteudo: caminho,
          tipo: 'foto',
          remetenteId: Number(remetenteId),
          destinatarioId: Number(destinatarioId),
          anuncioId: Number(anuncioId),
        }
      })

      return res.status(201).json(mensagem)
    } catch (error) {
      console.error(error)
      return res.status(500).json({ erro: 'Erro ao enviar foto' })
    }
  }
  
  async ListarConversa(req, res) {
    try {
      const { anuncioId, usuarioId, outroUsuarioId } = req.params

      const mensagens = await prisma.mensagem.findMany({
        where: {
          anuncioId: Number(anuncioId),
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

  async ApagarConversa(req, res) {
  try {
    const { anuncioId, usuarioId, outroUsuarioId } = req.params;

    await prisma.mensagem.deleteMany({
      where: {
        anuncioId: Number(anuncioId),
        OR: [
          { remetenteId: Number(usuarioId), destinatarioId: Number(outroUsuarioId) },
          { remetenteId: Number(outroUsuarioId), destinatarioId: Number(usuarioId) },
        ],
      },
    });

    return res.status(200).json({ mensagem: "Conversa apagada com sucesso." });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ erro: "Erro ao apagar conversa" });
  }
}
}

export default new MensagemController()