import fs from "fs";
import path from "path";
import prisma from "../prisma/Client.js";

const SELECT_ANUNCIO_COMPLETO = {
  id: true,
  titulo: true,
  descricao: true,
  preferencia: true,
  foto: true,
  disponibilidade: true,
  status: true,
  cidade: true,
  estado: true,
  criadoEm: true,
  atualizadoEm: true,
  usuarioId: true,
  categoriaId: true,
  usuario: {
    select: {
      id: true,
      nome: true,
      foto: true,
    },
  },
  categoria: {
    select: {
      id: true,
      nome: true,
    },
  },
};

export async function criarAnuncio(req, res) {
  try {
    const {
      titulo,
      descricao,
      preferencia,
      categoriaId,
      usuarioId,
      disponibilidade,
    } = req.body;

    if (!titulo || typeof titulo !== "string" || titulo.trim().length < 3) {
      if (req.file) fs.unlink(req.file.path, () => {});
      return res.status(400).json({ erro: "Informe um título com pelo menos 3 caracteres." });
    }

    if (!descricao || typeof descricao !== "string" || descricao.trim().length < 5) {
      if (req.file) fs.unlink(req.file.path, () => {});
      return res.status(400).json({ erro: "Informe uma descrição com pelo menos 5 caracteres." });
    }

    if (!preferencia || typeof preferencia !== "string" || preferencia.trim().length === 0) {
      if (req.file) fs.unlink(req.file.path, () => {});
      return res.status(400).json({ erro: "Informe a preferência de troca." });
    }

    if (!categoriaId) {
      if (req.file) fs.unlink(req.file.path, () => {});
      return res.status(400).json({ erro: "Informe a categoria do anúncio." });
    }

    if (!usuarioId) {
      if (req.file) fs.unlink(req.file.path, () => {});
      return res.status(400).json({ erro: "Usuário não informado." });
    }

    const idCategoria = Number(categoriaId);
    const idUsuario = Number(usuarioId);

    const categoriaExiste = await prisma.categoria.findUnique({
      where: { id: idCategoria },
    });

    if (!categoriaExiste) {
      if (req.file) fs.unlink(req.file.path, () => {});
      return res.status(404).json({ erro: "Categoria não encontrada." });
    }

    const usuario = await prisma.usuario.findUnique({
      where: { id: idUsuario },
      select: { id: true, cidade: true, estado: true },
    });

    if (!usuario) {
      if (req.file) fs.unlink(req.file.path, () => {});
      return res.status(404).json({ erro: "Usuário não encontrado." });
    }

    const caminhoFoto = req.file
      ? path.join("uploads", "anuncios", req.file.filename)
      : null;

    const anuncio = await prisma.anuncio.create({
      data: {
        titulo: titulo.trim(),
        descricao: descricao.trim(),
        preferencia: preferencia.trim(),
        disponibilidade: disponibilidade ? disponibilidade.trim() : null,
        foto: caminhoFoto,

        cidade: usuario.cidade || null,
        estado: usuario.estado || null,
        usuario: { connect: { id: idUsuario } },
        categoria: { connect: { id: idCategoria } },
      },
      select: SELECT_ANUNCIO_COMPLETO,
    });

    return res.status(201).json({
      mensagem: "Anúncio criado com sucesso.",
      anuncio,
    });
  } catch (erro) {
    console.error("Erro ao criar anúncio:", erro);
    if (req.file) fs.unlink(req.file.path, () => {});
    return res.status(500).json({ erro: "Erro interno ao criar o anúncio." });
  }
}

export async function listarAnuncios(req, res) {
  try {
    const { categoriaId, cidade, estado, usuarioId, status, busca } = req.query;

    const filtros = {};

    if (categoriaId) filtros.categoriaId = Number(categoriaId);
    if (usuarioId) filtros.usuarioId = Number(usuarioId);
    if (cidade) filtros.cidade = { equals: String(cidade) };
    if (estado) filtros.estado = { equals: String(estado) };
    if (status) filtros.status = String(status);

    if (busca) {
      filtros.OR = [
        { titulo: { contains: String(busca) } },
        { descricao: { contains: String(busca) } },
      ];
    }

    const anuncios = await prisma.anuncio.findMany({
      where: filtros,
      orderBy: { criadoEm: "desc" },
      select: SELECT_ANUNCIO_COMPLETO,
    });

    return res.status(200).json({ anuncios });
  } catch (erro) {
    console.error("Erro ao listar anúncios:", erro);
    return res.status(500).json({ erro: "Erro interno ao listar os anúncios." });
  }
}

export async function buscarAnuncio(req, res) {
  try {
    const idAnuncio = Number(req.params.id);

    if (!idAnuncio) {
      return res.status(400).json({ erro: "ID do anúncio não informado." });
    }

    const anuncio = await prisma.anuncio.findUnique({
      where: { id: idAnuncio },
      select: SELECT_ANUNCIO_COMPLETO,
    });

    if (!anuncio) {
      return res.status(404).json({ erro: "Anúncio não encontrado." });
    }

    return res.status(200).json({ anuncio });
  } catch (erro) {
    console.error("Erro ao buscar anúncio:", erro);
    return res.status(500).json({ erro: "Erro interno ao buscar o anúncio." });
  }
}

export async function atualizarAnuncio(req, res) {
  try {
    const idAnuncio = Number(req.params.id);
    const {
      titulo,
      descricao,
      preferencia,
      categoriaId,
      disponibilidade,
      status,
    } = req.body;

    if (!idAnuncio) {
      if (req.file) fs.unlink(req.file.path, () => {});
      return res.status(400).json({ erro: "ID do anúncio não informado." });
    }

    const anuncioExistente = await prisma.anuncio.findUnique({
      where: { id: idAnuncio },
    });

    if (!anuncioExistente) {
      if (req.file) fs.unlink(req.file.path, () => {});
      return res.status(404).json({ erro: "Anúncio não encontrado." });
    }

    // NOVO: durante a troca em andamento, o conteúdo do anúncio não pode ser editado.
    // Só é permitido mudar o status (ex.: em_andamento -> trocado, ou voltar para ativo
    // se a troca for cancelada), para não travar o fluxo de troca.
    if (anuncioExistente.status === "em_andamento") {
      const tentandoEditarConteudo =
        titulo !== undefined ||
        descricao !== undefined ||
        preferencia !== undefined ||
        categoriaId !== undefined ||
        disponibilidade !== undefined ||
        Boolean(req.file);

      if (tentandoEditarConteudo) {
        if (req.file) fs.unlink(req.file.path, () => {});
        return res.status(409).json({
          erro: "Não é possível editar um anúncio com troca em andamento.",
        });
      }
    }

    if (titulo !== undefined && (typeof titulo !== "string" || titulo.trim().length < 3)) {
      if (req.file) fs.unlink(req.file.path, () => {});
      return res.status(400).json({ erro: "Informe um título com pelo menos 3 caracteres." });
    }

    if (descricao !== undefined && (typeof descricao !== "string" || descricao.trim().length < 5)) {
      if (req.file) fs.unlink(req.file.path, () => {});
      return res.status(400).json({ erro: "Informe uma descrição com pelo menos 5 caracteres." });
    }

    if (preferencia !== undefined && (typeof preferencia !== "string" || preferencia.trim().length === 0)) {
      if (req.file) fs.unlink(req.file.path, () => {});
      return res.status(400).json({ erro: "Informe a preferência de troca." });
    }

    // CORRIGIDO: inclui "em_andamento" e a mensagem de erro agora lista todos os status
    const statusValidos = ["ativo", "vendido", "pausado", "trocado", "em_andamento"];
    if (status !== undefined && !statusValidos.includes(status)) {
      if (req.file) fs.unlink(req.file.path, () => {});
      return res.status(400).json({
        erro: "Status inválido. Use: ativo, pausado, em_andamento, trocado ou vendido.",
      });
    }

    const dadosParaAtualizar = {};

    if (titulo !== undefined) dadosParaAtualizar.titulo = titulo.trim();
    if (descricao !== undefined) dadosParaAtualizar.descricao = descricao.trim();
    if (preferencia !== undefined) dadosParaAtualizar.preferencia = preferencia.trim();
    if (status !== undefined) dadosParaAtualizar.status = status;
    if (disponibilidade !== undefined) {
      dadosParaAtualizar.disponibilidade = disponibilidade.trim() || null;
    }

    if (categoriaId !== undefined) {
      const idCategoria = Number(categoriaId);
      const categoriaExiste = await prisma.categoria.findUnique({
        where: { id: idCategoria },
      });

      if (!categoriaExiste) {
        if (req.file) fs.unlink(req.file.path, () => {});
        return res.status(404).json({ erro: "Categoria não encontrada." });
      }

      dadosParaAtualizar.categoriaId = idCategoria;
    }

    // Se veio uma foto nova, apaga a antiga do disco e salva o novo caminho
    if (req.file) {
      if (anuncioExistente.foto) {
        const caminhoAntigo = path.resolve(anuncioExistente.foto);
        fs.unlink(caminhoAntigo, (err) => {
          if (err && err.code !== "ENOENT") {
            console.error("Erro ao remover foto antiga do anúncio:", err);
          }
        });
      }

      dadosParaAtualizar.foto = path.join("uploads", "anuncios", req.file.filename);
    }

    const anuncioAtualizado = await prisma.anuncio.update({
      where: { id: idAnuncio },
      data: dadosParaAtualizar,
      select: SELECT_ANUNCIO_COMPLETO,
    });

    return res.status(200).json({
      mensagem: "Anúncio atualizado com sucesso.",
      anuncio: anuncioAtualizado,
    });
  } catch (erro) {
    console.error("Erro ao atualizar anúncio:", erro);
    if (req.file) fs.unlink(req.file.path, () => {});
    return res.status(500).json({ erro: "Erro interno ao atualizar o anúncio." });
  }
}

export async function excluirAnuncio(req, res) {
  try {
    const idAnuncio = Number(req.params.id);

    if (!idAnuncio) {
      return res.status(400).json({ erro: "ID do anúncio não informado." });
    }

    const anuncioExistente = await prisma.anuncio.findUnique({
      where: { id: idAnuncio },
    });

    if (!anuncioExistente) {
      return res.status(404).json({ erro: "Anúncio não encontrado." });
    }

    // NOVO: bloqueia exclusão durante a troca
    if (anuncioExistente.status === "em_andamento") {
      return res.status(409).json({
        erro: "Não é possível excluir um anúncio com troca em andamento.",
      });
    }

    if (anuncioExistente.foto) {
      const caminhoFoto = path.resolve(anuncioExistente.foto);
      fs.unlink(caminhoFoto, (err) => {
        if (err && err.code !== "ENOENT") {
          console.error("Erro ao remover foto do anúncio excluído:", err);
        }
      });
    }

    await prisma.anuncio.delete({
      where: { id: idAnuncio },
    });

    return res.status(200).json({ mensagem: "Anúncio excluído com sucesso." });
  } catch (erro) {
    console.error("Erro ao excluir anúncio:", erro);
    return res.status(500).json({ erro: "Erro interno ao excluir o anúncio." });
  }

  
}

export async function listarServicosRealizados(req, res) {
  try {
    const idUsuario = Number(req.query.usuarioId);

    if (!idUsuario) {
      return res.status(400).json({ erro: "Usuário não informado." });
    }

    const trocas = await prisma.troca.findMany({
      where: {
        finalizada: true,
        OR: [{ usuarioAId: idUsuario }, { usuarioBId: idUsuario }],
      },
      orderBy: { atualizadoEm: "desc" },
      include: {
        anuncio: { select: SELECT_ANUNCIO_COMPLETO },
      },
    });

    // A tabela Troca só guarda os ids, então busco o nome/foto da outra pessoa
    const idsParceiros = [
      ...new Set(
        trocas.map((t) =>
          t.usuarioAId === idUsuario ? t.usuarioBId : t.usuarioAId
        )
      ),
    ];

    const parceiros = await prisma.usuario.findMany({
      where: { id: { in: idsParceiros } },
      select: { id: true, nome: true, foto: true },
    });

    const mapaParceiros = new Map(parceiros.map((u) => [u.id, u]));

    const servicos = trocas.map((t) => {
      const idParceiro = t.usuarioAId === idUsuario ? t.usuarioBId : t.usuarioAId;

      return {
        ...t.anuncio, // id, titulo, foto, categoria, cidade...
        trocaId: t.id,
        finalizadaEm: t.atualizadoEm,
        papel: t.anuncio.usuarioId === idUsuario ? "anunciante" : "solicitante",
        parceiro: mapaParceiros.get(idParceiro) || null,
      };
    });

    return res.status(200).json({ servicos });
  } catch (erro) {
    console.error("Erro ao listar serviços realizados:", erro);
    return res.status(500).json({ erro: "Erro interno ao listar os serviços realizados." });
  }
}