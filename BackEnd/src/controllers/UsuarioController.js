import fs from "fs";
import path from "path";
import prisma from "../prisma/Client.js"; 

/**
 * Busca os dados do usuário logado para preencher a tela de Perfil.
 * Rota sugerida: GET /usuario/:id
 */
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
      fs.unlink(req.file.path, () => {});
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

    // Caminho relativo salvo no banco (ajuste conforme como você vai servir os arquivos estáticos)
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

/**
 * Remove a foto de perfil do usuário (apaga o arquivo do disco e limpa o campo no banco).
 * Rota sugerida: DELETE /usuario/:id/foto
 */
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

/**
 * Atualiza o nome de usuário.
 * Rota sugerida: PUT /usuario/:id/nome  (ou /usuario/nome se usar auth por token)
 * Body esperado: { "nome": "Novo Nome" }
 */
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

/**
 * Atualiza o telefone do usuário.
 * Rota sugerida: PUT /usuario/:id/telefone  (ou /usuario/telefone se usar auth por token)
 * Body esperado: { "telefone": "(11) 99999-9999" }
 */
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

/**
 * Atualiza a cidade/estado do usuário (preenchido via GPS ou manualmente no app).
 * Rota sugerida: PUT /usuario/:id/localizacao  (ou /usuario/localizacao se usar auth por token)
 * Body esperado: { "cidade": "São Paulo", "estado": "SP" }
 *
 * Os dois campos são opcionais individualmente (o app pode mandar só um deles),
 * mas pelo menos um precisa vir preenchido.
 */
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

/**
 * Redefine a senha do usuário.
 * Rota sugerida: PUT /usuario/:id/senha  (ou /usuario/senha se usar auth por token)
 * Body esperado: { "senhaAtual": "...", "novaSenha": "...", "confirmarNovaSenha": "..." }
 *
 * Exige a senha atual por segurança. Se preferir um fluxo de "esqueci minha senha"
 * (sem senha atual, com token por e-mail), me avise que crio essa variação também.
 */
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

/**
 * Exclui a conta do usuário permanentemente, junto com a foto de perfil salva no disco.
 * Rota sugerida: DELETE /usuario/:id
 */
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