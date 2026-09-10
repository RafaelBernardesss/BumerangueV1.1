import fs from "fs";
import path from "path";
import prisma from "../prisma/Client.js";


export async function buscarUsuario(req, res) {
  try {
    const idUsuario = Number(req.params.id || req.user?.id);

    if (!idUsuario) {
      return res.status(400).json({ erro: "ID do usuário não informado." });
    }

    const usuario = await prisma.usuario.findUnique({
      where: { id: idUsuario },
      select: {
        id: true,
        nome: true,
        email: true,
        cpf: true,
        telefone: true,
        foto: true,
        cidade: true,
        estado: true,
      },
    });

    if (!usuario) {
      return res.status(404).json({ erro: "Usuário não encontrado." });
    }

    return res.status(200).json({ usuario });
  } catch (erro) {
    console.error("Erro ao buscar usuário:", erro);
    return res.status(500).json({ erro: "Erro interno ao buscar o usuário." });
  }
}

export async function atualizarFotoPerfil(req, res) {
  try {
    const idUsuario = Number(req.params.id || req.user?.id);

    if (!idUsuario) {
      return res.status(400).json({ erro: "ID do usuário não informado." });
    }

    if (!req.file) {
      return res.status(400).json({ erro: "Nenhuma imagem foi enviada." });
    }

    const usuarioExistente = await prisma.usuario.findUnique({
      where: { id: idUsuario },
    });

    if (!usuarioExistente) {
      // Remove o arquivo enviado, já que o usuário não existe
      fs.unlink(req.file.path, () => { });
      return res.status(404).json({ erro: "Usuário não encontrado." });
    }

    // Se já existia uma foto anterior, apaga o arquivo antigo do disco
    if (usuarioExistente.foto) {
      const caminhoAntigo = path.resolve(usuarioExistente.foto);
      fs.unlink(caminhoAntigo, (err) => {
        if (err && err.code !== "ENOENT") {
          console.error("Erro ao remover foto antiga:", err);
        }
      });
    }


    const caminhoRelativo = path.join("uploads", "perfil", req.file.filename);

    const usuarioAtualizado = await prisma.usuario.update({
      where: { id: idUsuario },
      data: { foto: caminhoRelativo },
      select: {
        id: true,
        nome: true,
        email: true,
        foto: true,
        telefone: true,
        cidade: true,
        estado: true,
      },
    });

    return res.status(200).json({
      mensagem: "Foto de perfil atualizada com sucesso.",
      usuario: usuarioAtualizado,
    });
  } catch (erro) {
    console.error("Erro ao atualizar foto de perfil:", erro);
    return res.status(500).json({ erro: "Erro interno ao atualizar a foto de perfil." });
  }
}


export async function removerFotoPerfil(req, res) {
  try {
    const idUsuario = Number(req.params.id || req.user?.id);

    if (!idUsuario) {
      return res.status(400).json({ erro: "ID do usuário não informado." });
    }

    const usuarioExistente = await prisma.usuario.findUnique({
      where: { id: idUsuario },
    });

    if (!usuarioExistente) {
      return res.status(404).json({ erro: "Usuário não encontrado." });
    }

    if (usuarioExistente.foto) {
      const caminhoFoto = path.resolve(usuarioExistente.foto);
      fs.unlink(caminhoFoto, (err) => {
        if (err && err.code !== "ENOENT") {
          console.error("Erro ao remover arquivo da foto:", err);
        }
      });
    }

    const usuarioAtualizado = await prisma.usuario.update({
      where: { id: idUsuario },
      data: { foto: null },
      select: {
        id: true,
        nome: true,
        email: true,
        foto: true,
        telefone: true,
        cidade: true,
        estado: true,
      },
    });

    return res.status(200).json({
      mensagem: "Foto de perfil removida com sucesso.",
      usuario: usuarioAtualizado,
    });
  } catch (erro) {
    console.error("Erro ao remover foto de perfil:", erro);
    return res.status(500).json({ erro: "Erro interno ao remover a foto de perfil." });
  }
}


export async function atualizarNomeUsuario(req, res) {
  try {
    const idUsuario = Number(req.params.id || req.user?.id);
    const { nome } = req.body;

    if (!idUsuario) {
      return res.status(400).json({ erro: "ID do usuário não informado." });
    }

    if (!nome || typeof nome !== "string" || nome.trim().length < 2) {
      return res.status(400).json({ erro: "Nome inválido. Informe pelo menos 2 caracteres." });
    }

    const usuarioExistente = await prisma.usuario.findUnique({
      where: { id: idUsuario },
    });

    if (!usuarioExistente) {
      return res.status(404).json({ erro: "Usuário não encontrado." });
    }

    const usuarioAtualizado = await prisma.usuario.update({
      where: { id: idUsuario },
      data: { nome: nome.trim() },
      select: {
        id: true,
        nome: true,
        email: true,
        foto: true,
        telefone: true,
        cidade: true,
        estado: true,
      },
    });

    return res.status(200).json({
      mensagem: "Nome de usuário atualizado com sucesso.",
      usuario: usuarioAtualizado,
    });
  } catch (erro) {
    console.error("Erro ao atualizar nome de usuário:", erro);
    return res.status(500).json({ erro: "Erro interno ao atualizar o nome de usuário." });
  }
}


export async function atualizarTelefone(req, res) {
  try {
    const idUsuario = Number(req.params.id || req.user?.id);
    const { telefone } = req.body;

    if (!idUsuario) {
      return res.status(400).json({ erro: "ID do usuário não informado." });
    }

    if (!telefone || typeof telefone !== "string") {
      return res.status(400).json({ erro: "Telefone inválido." });
    }

    // Mantém apenas dígitos para validar a quantidade de números
    const somenteDigitos = telefone.replace(/\D/g, "");
    if (somenteDigitos.length < 10 || somenteDigitos.length > 11) {
      return res.status(400).json({ erro: "Informe um telefone válido, com DDD." });
    }

    const usuarioExistente = await prisma.usuario.findUnique({
      where: { id: idUsuario },
    });

    if (!usuarioExistente) {
      return res.status(404).json({ erro: "Usuário não encontrado." });
    }

    const usuarioAtualizado = await prisma.usuario.update({
      where: { id: idUsuario },
      data: { telefone: telefone.trim() },
      select: {
        id: true,
        nome: true,
        email: true,
        foto: true,
        telefone: true,
        cidade: true,
        estado: true,
      },
    });

    return res.status(200).json({
      mensagem: "Telefone atualizado com sucesso.",
      usuario: usuarioAtualizado,
    });
  } catch (erro) {
    console.error("Erro ao atualizar telefone:", erro);
    return res.status(500).json({ erro: "Erro interno ao atualizar o telefone." });
  }
}


export async function atualizarLocalizacao(req, res) {
  try {
    const idUsuario = Number(req.params.id || req.user?.id);
    const { cidade, estado } = req.body;

    if (!idUsuario) {
      return res.status(400).json({ erro: "ID do usuário não informado." });
    }

    if (
      (cidade === undefined || cidade === null) &&
      (estado === undefined || estado === null)
    ) {
      return res.status(400).json({ erro: "Informe a cidade e/ou o estado." });
    }

    if (cidade !== undefined && cidade !== null && typeof cidade !== "string") {
      return res.status(400).json({ erro: "Cidade inválida." });
    }

    if (estado !== undefined && estado !== null && typeof estado !== "string") {
      return res.status(400).json({ erro: "Estado inválido." });
    }

    if (typeof estado === "string" && estado.trim().length > 0 && estado.trim().length !== 2) {
      return res.status(400).json({ erro: "Informe o estado na sigla (ex: SP, RJ)." });
    }

    const usuarioExistente = await prisma.usuario.findUnique({
      where: { id: idUsuario },
    });

    if (!usuarioExistente) {
      return res.status(404).json({ erro: "Usuário não encontrado." });
    }

    const dadosParaAtualizar = {};

    if (cidade !== undefined) {
      dadosParaAtualizar.cidade = cidade.trim() || null;
    }

    if (estado !== undefined) {
      dadosParaAtualizar.estado = estado.trim().toUpperCase() || null;
    }

    const usuarioAtualizado = await prisma.usuario.update({
      where: { id: idUsuario },
      data: dadosParaAtualizar,
      select: {
        id: true,
        nome: true,
        email: true,
        foto: true,
        telefone: true,
        cidade: true,
        estado: true,
      },
    });

    return res.status(200).json({
      mensagem: "Localização atualizada com sucesso.",
      usuario: usuarioAtualizado,
    });
  } catch (erro) {
    console.error("Erro ao atualizar localização:", erro);
    return res.status(500).json({ erro: "Erro interno ao atualizar a localização." });
  }
}


export async function redefinirSenha(req, res) {
  try {
    const idUsuario = Number(req.params.id || req.user?.id);
    const { senhaAtual, novaSenha, confirmarNovaSenha } = req.body;

    if (!idUsuario) {
      return res.status(400).json({ erro: "ID do usuário não informado." });
    }

    if (!senhaAtual || !novaSenha || !confirmarNovaSenha) {
      return res.status(400).json({
        erro: "Informe a senha atual, a nova senha e a confirmação da nova senha.",
      });
    }

    if (novaSenha !== confirmarNovaSenha) {
      return res.status(400).json({ erro: "A nova senha e a confirmação não coincidem." });
    }

    if (novaSenha.length < 6) {
      return res.status(400).json({ erro: "A nova senha deve ter pelo menos 6 caracteres." });
    }

    const usuarioExistente = await prisma.usuario.findUnique({
      where: { id: idUsuario },
    });

    if (!usuarioExistente) {
      return res.status(404).json({ erro: "Usuário não encontrado." });
    }

    if (senhaAtual !== usuarioExistente.senha) {
      return res.status(401).json({ erro: "Senha atual incorreta." });
    }

    if (novaSenha === usuarioExistente.senha) {
      return res.status(400).json({ erro: "A nova senha deve ser diferente da senha atual." });
    }

    await prisma.usuario.update({
      where: { id: idUsuario },
      data: { senha: novaSenha },
    });

    return res.status(200).json({ mensagem: "Senha redefinida com sucesso." });
  } catch (erro) {
    console.error("Erro ao redefinir senha:", erro);
    return res.status(500).json({ erro: "Erro interno ao redefinir a senha." });
  }
}


export async function excluirConta(req, res) {
  try {
    const idUsuario = Number(req.params.id || req.user?.id);

    if (!idUsuario) {
      return res.status(400).json({ erro: "ID do usuário não informado." });
    }

    const usuarioExistente = await prisma.usuario.findUnique({
      where: { id: idUsuario },
    });

    if (!usuarioExistente) {
      return res.status(404).json({ erro: "Usuário não encontrado." });
    }

    // Remove a foto de perfil do disco, se existir
    if (usuarioExistente.foto) {
      const caminhoFoto = path.resolve(usuarioExistente.foto);
      fs.unlink(caminhoFoto, (err) => {
        if (err && err.code !== "ENOENT") {
          console.error("Erro ao remover foto do usuário excluído:", err);
        }
      });
    }

    await prisma.usuario.delete({
      where: { id: idUsuario },
    });

    return res.status(200).json({ mensagem: "Conta excluída com sucesso." });
  } catch (erro) {
    console.error("Erro ao excluir conta:", erro);
    return res.status(500).json({ erro: "Erro interno ao excluir a conta." });
  }
}


export async function salvarPushToken(req, res) {
  try {
    const idUsuario = Number(req.params.id || req.user?.id);
    const { pushToken } = req.body;

    if (!idUsuario) {
      return res.status(400).json({ erro: "ID do usuário não informado." });
    }

    if (!pushToken || typeof pushToken !== "string") {
      return res.status(400).json({ erro: "Token de notificação inválido." });
    }

    const usuarioExistente = await prisma.usuario.findUnique({
      where: { id: idUsuario },
    });

    if (!usuarioExistente) {
      return res.status(404).json({ erro: "Usuário não encontrado." });
    }

    const usuarioAtualizado = await prisma.usuario.update({
      where: { id: idUsuario },
      data: { pushToken: pushToken.trim() },
      select: {
        id: true,
        nome: true,
        email: true,
        foto: true,
        telefone: true,
        cidade: true,
        estado: true,
      },
    });

    return res.status(200).json({
      mensagem: "Token de notificação salvo com sucesso.",
      usuario: usuarioAtualizado,
    });
  } catch (erro) {
    console.error("Erro ao salvar token de notificação:", erro);
    return res.status(500).json({ erro: "Erro interno ao salvar o token de notificação." });
  }
}

export async function listarContatos(req, res) {
  try {
    const idUsuario = Number(req.params.id || req.user?.id);

    if (!idUsuario) {
      return res.status(400).json({ erro: "ID do usuário não informado." });
    }

    // Propostas aceitas onde o usuário é o DONO do anúncio
    const comoAnunciante = await prisma.proposta.findMany({
      where: {
        status: "aceita",
        anuncio: { usuarioId: idUsuario },
      },
      include: {
        usuario: { select: { id: true, nome: true, foto: true } }, // quem propôs
      },
      orderBy: { criadoEm: "desc" },
    });

    // Propostas aceitas onde o usuário é QUEM PROPÔS
    const comoProponente = await prisma.proposta.findMany({
      where: {
        status: "aceita",
        propostoPor: idUsuario,
      },
      include: {
        anuncio: {
          select: {
            usuario: { select: { id: true, nome: true, foto: true } }, // dono do anúncio
          },
        },
      },
      orderBy: { criadoEm: "desc" },
    });

    const mapaContatos = new Map();

    for (const proposta of comoAnunciante) {
      const outraPessoa = proposta.usuario;
      if (outraPessoa.id !== idUsuario) {
        mapaContatos.set(outraPessoa.id, outraPessoa);
      }
    }

    for (const proposta of comoProponente) {
      const outraPessoa = proposta.anuncio.usuario;
      if (outraPessoa.id !== idUsuario) {
        mapaContatos.set(outraPessoa.id, outraPessoa);
      }
    }

    const contatos = Array.from(mapaContatos.values()).map((usuario) => ({
      id: usuario.id,
      nome: usuario.nome,
      foto: usuario.foto,
      ultimaMensagem: null,
      horaUltimaMensagem: null,
      naoLidas: 0,
      online: false,
      favorito: false,
    }));

    return res.status(200).json({ contatos });
  } catch (erro) {
    console.error("Erro ao listar contatos:", erro);
    return res.status(500).json({ erro: "Erro interno ao listar contatos." });
  }
}