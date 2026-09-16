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

      return res.status(200).json({
        anuncioStatus: anuncio.status,
        usuarioAConfirmou: troca?.usuarioAConfirmou || false,
        usuarioBConfirmou: troca?.usuarioBConfirmou || false,
        finalizada: troca?.finalizada || false,
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

      const quemConfirmou = Number(usuarioId) === usuarioAId ? 'A' : 'B'

      const troca = await prisma.troca.upsert({
        where: { anuncioId_usuarioBId: { anuncioId: Number(anuncioId), usuarioBId } },
        create: {
          anuncioId: Number(anuncioId),
          usuarioAId,
          usuarioBId,
          usuarioAConfirmou: quemConfirmou === 'A',
          usuarioBConfirmou: quemConfirmou === 'B',
        },
        update: quemConfirmou === 'A'
          ? { usuarioAConfirmou: true }
          : { usuarioBConfirmou: true },
      })

      const ambosConfirmaram = troca.usuarioAConfirmou && troca.usuarioBConfirmou

      if (ambosConfirmaram && !troca.finalizada) {
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
        usuarioAConfirmou: troca.usuarioAConfirmou,
        usuarioBConfirmou: troca.usuarioBConfirmou,
        finalizada: ambosConfirmaram,
      })
    } catch (error) {
      console.error(error)
      return res.status(500).json({ erro: 'Erro ao confirmar troca' })
    }
  }
  async ListarPendentes(req, res) {
  try {
    const usuarioId = Number(req.params.usuarioId);

    const trocas = await prisma.troca.findMany({
      where: {
        finalizada: false,
        OR: [{ usuarioAId: usuarioId }, { usuarioBId: usuarioId }],
      },
      include: {
        anuncio: { select: { id: true, titulo: true } },
      },
      orderBy: { atualizadoEm: "desc" },
    });

    // Busca os dados do "outro usuário" de cada troca numa única query
    const outrosIds = trocas.map((t) =>
      t.usuarioAId === usuarioId ? t.usuarioBId : t.usuarioAId
    );

    const usuarios = await prisma.usuario.findMany({
      where: { id: { in: outrosIds } },
      select: { id: true, nome: true, foto: true },
    });

    const resultado = trocas.map((t) => {
      const souA = t.usuarioAId === usuarioId;
      const outroId = souA ? t.usuarioBId : t.usuarioAId;
      const outro = usuarios.find((u) => u.id === outroId);
      const minhaFoto = souA ? t.usuarioAFoto : t.usuarioBFoto;
      const fotoDoOutro = souA ? t.usuarioBFoto : t.usuarioAFoto;

      return {
        anuncioId: t.anuncioId,
        anuncioTitulo: t.anuncio.titulo,
        outroUsuarioId: outroId,
        outroUsuarioNome: outro?.nome || "Usuário",
        outroUsuarioFoto: outro?.foto || null,
        minhaFotoEnviada: Boolean(minhaFoto),
        fotoDoOutroEnviada: Boolean(fotoDoOutro),
        atualizadoEm: t.atualizadoEm,
      };
    });

    return res.status(200).json({ trocas: resultado });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ erro: "Erro ao listar trocas pendentes" });
  }
}
}


function definirPapeis(donoId, usuario1, usuario2) {
  if (donoId === usuario1) return { usuarioAId: usuario1, usuarioBId: usuario2 }
  if (donoId === usuario2) return { usuarioAId: usuario2, usuarioBId: usuario1 }
  return { usuarioAId: null, usuarioBId: null }
}

export default new TrocaController()