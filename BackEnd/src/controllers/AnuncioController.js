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

/**
 * Cria um novo anúncio.
 * Rota sugerida: POST /anuncios
 * Body (multipart/form-data): titulo, descricao, preferencia, categoriaId, usuarioId,
 *   disponibilidade (opcional), foto (arquivo, opcional)
 *
 * A localização (cidade/estado) é copiada automaticamente do perfil do
 * usuário no momento da criação — o usuário não precisa digitar isso.
 */
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
      return res.status(400).json({ erro: "Informe um título com pelo menos 3 caracteres." });
    }

    if (!descricao || typeof descricao !== "string" || descricao.trim().length < 5) {
      return res.status(400).json({ erro: "Informe uma descrição com pelo menos 5 caracteres." });
    }

    if (!preferencia || typeof preferencia !== "string" || preferencia.trim().length === 0) {
      return res.status(400).json({ erro: "Informe a preferência de troca." });
    }

    if (!categoriaId) {
      return res.status(400).json({ erro: "Informe a categoria do anúncio." });
    }

    if (!usuarioId) {
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
        // Localização puxada do perfil do usuário no momento do cadastro do anúncio
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

/**
 * Lista todos os anúncios, com filtros opcionais por query string.
 * Rota sugerida: GET /anuncios?categoriaId=1&cidade=São Paulo&usuarioId=3&status=ativo
 */
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

/**
 * Busca um anúncio específico pelo id.
 * Rota sugerida: GET /anuncios/:id
 */
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

/**
 * Edita um anúncio existente. Todos os campos são opcionais — só atualiza
 * o que vier no body. Se vier uma foto nova, a antiga é apagada do disco.
 * Rota sugerida: PUT /anuncios/:id
 * Body (multipart/form-data): titulo, descricao, preferencia, categoriaId,
 *   disponibilidade, status, foto (arquivo, opcional)
 */
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
      return res.status(400).json({ erro: "ID do anúncio não informado." });
    }

    const anuncioExistente = await prisma.anuncio.findUnique({
      where: { id: idAnuncio },
    });

    if (!anuncioExistente) {
      if (req.file) fs.unlink(req.file.path, () => {});
      return res.status(404).json({ erro: "Anúncio não encontrado." });
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

    const statusValidos = ["ativo", "vendido", "pausado"];
    if (status !== undefined && !statusValidos.includes(status)) {
      if (req.file) fs.unlink(req.file.path, () => {});
      return res.status(400).json({ erro: "Status inválido. Use: ativo, vendido ou pausado." });
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

/**
 * Exclui um anúncio permanentemente, junto com a foto salva no disco.
 * Rota sugerida: DELETE /anuncios/:id
 */
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