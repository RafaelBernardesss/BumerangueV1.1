import prisma from '../prisma/client.js'

class TrocaController {

  async Status(req, res) {
    try {
      const { anuncioId, usuarioId, outroUsuarioId } = req.params

      const anuncio = await prisma.anuncio.findUnique({
        where: { id: Number(anuncioId) },
        select: { id: true, usuarioId: true, status: true },
      })

      if (!anuncio) {
        return res.status(404).json({ erro: 'Anúncio não encontrado.' })
      }

      const { usuarioAId, usuarioBId } = definirPapeis(
        anuncio.usuarioId,
        Number(usuarioId),
        Number(outroUsuarioId)
      )

      if (!usuarioAId) {
        return res.status(400).json({ erro: 'Um dos usuários informados não participa deste anúncio.' })
      }

      const troca = await prisma.troca.findUnique({
        where: { anuncioId_usuarioBId: { anuncioId: Number(anuncioId), usuarioBId } },
      })

      const estado = calcularEstado(troca, Number(usuarioId), usuarioAId)

      return res.status(200).json({
        finalizada: estado.finalizada,
        minhaFoto: estado.minhaFoto,
        fotoDoOutro: estado.fotoDoOutro,
        minhaConfirmou: estado.minhaConfirmou,
        outroConfirmou: estado.outroConfirmou,
        euSouUltimo: estado.euSouUltimo,
        minhaVez: estado.minhaVez,
      })
    } catch (error) {
      console.error(error)
      return res.status(500).json({ erro: 'Erro ao buscar status da troca' })
    }
  }

  async Confirmar(req, res) {
    try {
      const { anuncioId, usuarioId, outroUsuarioId } = req.body

      if (!anuncioId || !usuarioId || !outroUsuarioId) {
        return res.status(400).json({ erro: 'anuncioId, usuarioId e outroUsuarioId são obrigatórios' })
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
        Number(usuarioId),
        Number(outroUsuarioId)
      )

      if (!usuarioAId) {
        return res.status(400).json({ erro: 'Um dos usuários informados não participa deste anúncio.' })
      }

      const trocaExistente = await prisma.troca.findUnique({
        where: { anuncioId_usuarioBId: { anuncioId: Number(anuncioId), usuarioBId } },
      })

      if (!trocaExistente) {
        return res.status(404).json({ erro: 'Troca não encontrada.' })
      }

      const estado = calcularEstado(trocaExistente, Number(usuarioId), usuarioAId)

      if (estado.finalizada) {
        return res.status(200).json({ finalizada: true })
      }

      if (!estado.ambasFotos) {
        return res.status(400).json({ erro: 'As duas fotos precisam ser enviadas antes de confirmar.' })
      }

      // Quem enviou a última foto confirma primeiro; o outro só confirma depois
      if (!estado.minhaVez) {
        return res.status(400).json({ erro: 'Ainda não é a sua vez de confirmar.' })
      }

      const souA = Number(usuarioId) === usuarioAId

      const troca = await prisma.troca.update({
        where: { id: trocaExistente.id },
        data: souA ? { usuarioAConfirmou: true } : { usuarioBConfirmou: true },
      })

      const ambosConfirmaram = troca.usuarioAConfirmou && troca.usuarioBConfirmou

      if (ambosConfirmaram) {
        await prisma.troca.update({
          where: { id: troca.id },
          data: { finalizada: true },
        })

        await prisma.anuncio.update({
          where: { id: Number(anuncioId) },
          data: { status: 'trocado' },
        })
      }

      return res.status(200).json({
        minhaConfirmou: true,
        outroConfirmou: souA ? troca.usuarioBConfirmou : troca.usuarioAConfirmou,
        finalizada: ambosConfirmaram,
      })
    } catch (error) {
      console.error(error)
      return res.status(500).json({ erro: 'Erro ao confirmar troca' })
    }
  }

  // Quem está na vez cancela -> apaga fotos e confirmações, os dois refazem a finalização
  async Cancelar(req, res) {
    try {
      const { anuncioId, usuarioId, outroUsuarioId } = req.body

      if (!anuncioId || !usuarioId || !outroUsuarioId) {
        return res.status(400).json({ erro: 'anuncioId, usuarioId e outroUsuarioId são obrigatórios' })
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
        Number(usuarioId),
        Number(outroUsuarioId)
      )

      if (!usuarioAId) {
        return res.status(400).json({ erro: 'Um dos usuários informados não participa deste anúncio.' })
      }

      const troca = await prisma.troca.findUnique({
        where: { anuncioId_usuarioBId: { anuncioId: Number(anuncioId), usuarioBId } },
      })

      if (!troca) {
        return res.status(404).json({ erro: 'Troca não encontrada.' })
      }

      const estado = calcularEstado(troca, Number(usuarioId), usuarioAId)

      if (estado.finalizada) {
        return res.status(400).json({ erro: 'Esta troca já foi finalizada.' })
      }

      if (!estado.minhaVez) {
        return res.status(400).json({ erro: 'Ainda não é a sua vez de confirmar ou cancelar.' })
      }

      await prisma.troca.update({
        where: { id: troca.id },
        data: {
          usuarioAFoto: null,
          usuarioBFoto: null,
          usuarioAConfirmou: false,
          usuarioBConfirmou: false,
          ultimoEnviouId: null,
        },
      })

      return res.status(200).json({ cancelada: true })
    } catch (error) {
      console.error(error)
      return res.status(500).json({ erro: 'Erro ao cancelar troca' })
    }
  }

  async ListarPendentes(req, res) {
    try {
      const usuarioId = Number(req.params.usuarioId);

      if (!prisma || !prisma.troca || typeof prisma.troca.findMany !== "function") {
        console.error("Prisma model 'troca' não disponível. Verifique se 'prisma generate' foi executado.");
        return res.status(500).json({ erro: "Prisma model 'troca' não disponível. Execute 'npx prisma generate'." });
      }

      // Finalizadas aparecem por 3 dias (para mostrar "Troca finalizada")
      const limiteFinalizadas = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);

      const trocas = await prisma.troca.findMany({
        where: {
          AND: [
            { OR: [{ usuarioAId: usuarioId }, { usuarioBId: usuarioId }] },
            {
              OR: [
                { finalizada: false },
                { finalizada: true, atualizadoEm: { gte: limiteFinalizadas } },
              ],
            },
          ],
        },
        include: {
          anuncio: { select: { id: true, titulo: true } },
        },
        orderBy: { atualizadoEm: "desc" },
      });

      const outrosIds = trocas.map((t) =>
        t.usuarioAId === usuarioId ? t.usuarioBId : t.usuarioAId
      );

      const usuarios = await prisma.usuario.findMany({
        where: { id: { in: outrosIds } },
        select: { id: true, nome: true, foto: true },
      });

      const resultado = trocas.map((t) => {
        const estado = calcularEstado(t, usuarioId, t.usuarioAId);
        const outroId = t.usuarioAId === usuarioId ? t.usuarioBId : t.usuarioAId;
        const outro = usuarios.find((u) => u.id === outroId);

        return {
          anuncioId: t.anuncioId,
          anuncioTitulo: t.anuncio.titulo,
          outroUsuarioId: outroId,
          outroUsuarioNome: outro?.nome || "Usuário",
          outroUsuarioFoto: outro?.foto || null,
          minhaFotoEnviada: Boolean(estado.minhaFoto),
          fotoDoOutroEnviada: Boolean(estado.fotoDoOutro),
          minhaConfirmou: estado.minhaConfirmou,
          outroConfirmou: estado.outroConfirmou,
          euSouUltimo: estado.euSouUltimo,
          minhaVez: estado.minhaVez,
          finalizada: estado.finalizada,
          atualizadoEm: t.atualizadoEm,
        };
      });

      return res.status(200).json({ trocas: resultado });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ erro: "Erro ao listar trocas pendentes" });
    }
  }

  async EnviarFoto(req, res) {
    try {
      const { anuncioId, usuarioId, outroUsuarioId } = req.body
      const arquivo = req.file

      if (!arquivo) {
        return res.status(400).json({ erro: 'Nenhuma foto enviada' });
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
        Number(usuarioId),
        Number(outroUsuarioId)
      )

      if (!usuarioAId) {
        return res.status(400).json({
          erro: "Um dos usuários informados não participa deste anúncio."
        })
      }

      const quemEnviou = Number(usuarioId) === usuarioAId ? 'A' : 'B'
      const caminhoFoto = arquivo.path.replace(/\\/g, '/')

      let troca = await prisma.troca.upsert({
        where: { anuncioId_usuarioBId: { anuncioId: Number(anuncioId), usuarioBId } },
        create: {
          anuncioId: Number(anuncioId),
          usuarioAId,
          usuarioBId,
          usuarioAFoto: quemEnviou === 'A' ? caminhoFoto : null,
          usuarioBFoto: quemEnviou === 'B' ? caminhoFoto : null,
        },
        update: quemEnviou === 'A'
          ? { usuarioAFoto: caminhoFoto }
          : { usuarioBFoto: caminhoFoto },
      })

      const ambosEnviaram = Boolean(troca.usuarioAFoto) && Boolean(troca.usuarioBFoto)

      // Quem completou o par de fotos é o "último": ele confirma/cancela primeiro
      if (ambosEnviaram && !troca.ultimoEnviouId) {
        troca = await prisma.troca.update({
          where: { id: troca.id },
          data: { ultimoEnviouId: Number(usuarioId) },
        })
      }

      return res.status(200).json({
        finalizada: false,
        ambosEnviaram,
        caminhoFoto
      })
    } catch (error) {
      console.error(error)
      return res.status(500).json({ erro: 'Erro ao enviar foto do serviço' })
    }
  }
}

function definirPapeis(donoId, usuario1, usuario2) {
  if (donoId === usuario1) return { usuarioAId: usuario1, usuarioBId: usuario2 }
  if (donoId === usuario2) return { usuarioAId: usuario2, usuarioBId: usuario1 }
  return { usuarioAId: null, usuarioBId: null }
}

// Calcula o estado da troca do ponto de vista de um usuário
function calcularEstado(troca, meuId, usuarioAId) {
  const souA = meuId === usuarioAId

  const minhaFoto = (souA ? troca?.usuarioAFoto : troca?.usuarioBFoto) || null
  const fotoDoOutro = (souA ? troca?.usuarioBFoto : troca?.usuarioAFoto) || null
  const minhaConfirmou = Boolean(souA ? troca?.usuarioAConfirmou : troca?.usuarioBConfirmou)
  const outroConfirmou = Boolean(souA ? troca?.usuarioBConfirmou : troca?.usuarioAConfirmou)
  const finalizada = Boolean(troca?.finalizada)
  const ambasFotos = Boolean(minhaFoto && fotoDoOutro)
  const euSouUltimo = ambasFotos && troca?.ultimoEnviouId === meuId

  // Vez de agir (confirmar/cancelar):
  // - o último a enviar foto age primeiro
  // - o outro só age depois que o último confirmou
  let minhaVez = false
  if (ambasFotos && !finalizada && !minhaConfirmou) {
    minhaVez = euSouUltimo ? true : outroConfirmou
  }

  return {
    minhaFoto,
    fotoDoOutro,
    minhaConfirmou,
    outroConfirmou,
    finalizada,
    ambasFotos,
    euSouUltimo,
    minhaVez,
  }
}

export default new TrocaController()