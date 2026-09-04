import prisma from "../prisma/Client.js";
import { enviarNotificacaoPush } from "../middlewares/EnviarNotificacao.js";

/**
 * Cria uma nova proposta de troca para um anúncio e notifica o dono do anúncio.
 * Rota sugerida: POST /propostas
 * Body: { anuncioId, propostoPor, mensagem }
 */
export async function criarProposta(req, res) {
  try {
    const { anuncioId, propostoPor, mensagem } = req.body;

    if (!anuncioId || !propostoPor || !mensagem?.trim()) {
      return res.status(400).json({ erro: "Preencha todos os campos da proposta." });
    }

    const anuncio = await prisma.anuncio.findUnique({
      where: { id: Number(anuncioId) },
      include: { usuario: true },
    });

    if (!anuncio) {
      return res.status(404).json({ erro: "Anúncio não encontrado." });
    }

    const quemPropos = await prisma.usuario.findUnique({
      where: { id: Number(propostoPor) },
    });

    if (!quemPropos) {
      return res.status(404).json({ erro: "Usuário não encontrado." });
    }

    const proposta = await prisma.proposta.create({
      data: {
        anuncioId: Number(anuncioId),
        propostoPor: Number(propostoPor),
        mensagem: mensagem.trim(),
      },
    });

    // Notifica o dono do anúncio
    await enviarNotificacaoPush(
      anuncio.usuario.pushToken,
      "Nova proposta de troca!",
      `${quemPropos.nome} propôs uma troca no seu anúncio "${anuncio.titulo}".`,
      { propostaId: proposta.id, tipo: "nova_proposta" }
    );

    return res.status(201).json({ mensagem: "Proposta enviada.", proposta });
  } catch (erro) {
    console.error("Erro ao criar proposta:", erro);
    return res.status(500).json({ erro: "Erro interno ao enviar proposta." });
  }
}

/**
 * Lista as propostas recebidas pelos anúncios de um usuário (o dono do anúncio).
 * Rota sugerida: GET /propostas/recebidas?usuarioId=X
 */
export async function listarPropostasRecebidas(req, res) {
  try {
    const { usuarioId } = req.query;

    if (!usuarioId) {
      return res.status(400).json({ erro: "usuarioId não informado." });
    }

    const propostas = await prisma.proposta.findMany({
      where: {
        anuncio: { usuarioId: Number(usuarioId) },
      },
      orderBy: { criadoEm: "desc" },
      include: {
        anuncio: { select: { id: true, titulo: true } },
        usuario: { select: { id: true, nome: true, foto: true } },
      },
    });

    return res.status(200).json({ propostas });
  } catch (erro) {
    console.error("Erro ao listar propostas:", erro);
    return res.status(500).json({ erro: "Erro interno ao listar propostas." });
  }
}

/**
 * Aceita ou recusa uma proposta e notifica quem a enviou.
 * Se aceita, o anúncio passa para "em_andamento" (some das listas de
 * anúncios disponíveis) e as outras propostas pendentes do mesmo
 * anúncio são recusadas automaticamente.
 * Rota sugerida: PUT /propostas/:id/responder
 * Body: { status: "aceita" | "recusada" }
 */
export async function responderProposta(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["aceita", "recusada"].includes(status)) {
      return res.status(400).json({ erro: "Status inválido. Use 'aceita' ou 'recusada'." });
    }

    const propostaExistente = await prisma.proposta.findUnique({
      where: { id: Number(id) },
    });

    if (!propostaExistente) {
      return res.status(404).json({ erro: "Proposta não encontrada." });
    }

    const proposta = await prisma.proposta.update({
      where: { id: Number(id) },
      data: { status },
      include: { usuario: true, anuncio: true },
    });

    // Avisa quem propôs se foi aceita ou recusada
    await enviarNotificacaoPush(
      proposta.usuario.pushToken,
      status === "aceita" ? "Proposta aceita! 🎉" : "Proposta recusada",
      `Sua proposta para "${proposta.anuncio.titulo}" foi ${status}.`,
      { tipo: "resposta_proposta" }
    );

    if (status === "aceita") {
      // O anúncio deixa de estar disponível e passa a "em_andamento"
      await prisma.anuncio.update({
        where: { id: proposta.anuncioId },
        data: { status: "em_andamento" },
      });

      // As demais propostas pendentes desse anúncio são recusadas
      // automaticamente, já que ele não está mais disponível
      const outrasPendentes = await prisma.proposta.findMany({
        where: {
          anuncioId: proposta.anuncioId,
          id: { not: proposta.id },
          status: "pendente",
        },
        include: { usuario: true },
      });

      if (outrasPendentes.length > 0) {
        await prisma.proposta.updateMany({
          where: {
            anuncioId: proposta.anuncioId,
            id: { not: proposta.id },
            status: "pendente",
          },
          data: { status: "recusada" },
        });

        await Promise.all(
          outrasPendentes.map((p) =>
            enviarNotificacaoPush(
              p.usuario.pushToken,
              "Proposta recusada",
              `Sua proposta para "${proposta.anuncio.titulo}" foi recusada — o anúncio já foi fechado com outra pessoa.`,
              { tipo: "resposta_proposta" }
            )
          )
        );
      }
    }

    return res.status(200).json({ mensagem: "Proposta atualizada.", proposta });
  } catch (erro) {
    console.error("Erro ao responder proposta:", erro);
    return res.status(500).json({ erro: "Erro interno ao responder proposta." });
  }
}


export async function listarPropostasEnviadas(req, res) {
  try {
    const { usuarioId } = req.query;

    if (!usuarioId) {
      return res.status(400).json({ erro: "usuarioId não informado." });
    }

    const propostas = await prisma.proposta.findMany({
      where: { propostoPor: Number(usuarioId) },
      orderBy: { criadoEm: "desc" },
      include: {
        anuncio: {
          select: {
            id: true,
            titulo: true,
            usuario: { select: { id: true, nome: true, foto: true } },
          },
        },
      },
    });

    return res.status(200).json({ propostas });
  } catch (erro) {
    console.error("Erro ao listar propostas enviadas:", erro);
    return res.status(500).json({ erro: "Erro interno ao listar propostas enviadas." });
  }
}