import prisma from "../prisma/Client.js";

/**
 * Lista todas as categorias disponíveis.
 * Rota sugerida: GET /categorias
 */
export async function listarCategorias(req, res) {
  try {
    const categorias = await prisma.categoria.findMany({
      orderBy: { nome: "asc" },
    });

    return res.status(200).json({ categorias });
  } catch (erro) {
    console.error("Erro ao listar categorias:", erro);
    return res.status(500).json({ erro: "Erro interno ao listar as categorias." });
  }
}

/**
 * Exclui uma categoria. Não permite excluir se ainda houver anúncios
 * usando essa categoria, pra evitar anúncio órfão.
 * Rota sugerida: DELETE /categorias/:id
 */
export async function excluirCategoria(req, res) {
  try {
    const idCategoria = Number(req.params.id);

    if (!idCategoria) {
      return res.status(400).json({ erro: "ID da categoria não informado." });
    }

    const categoriaExistente = await prisma.categoria.findUnique({
      where: { id: idCategoria },
      include: { _count: { select: { anuncios: true } } },
    });

    if (!categoriaExistente) {
      return res.status(404).json({ erro: "Categoria não encontrada." });
    }

    if (categoriaExistente._count.anuncios > 0) {
      return res.status(400).json({
        erro: `Não é possível excluir: existem ${categoriaExistente._count.anuncios} anúncio(s) usando essa categoria.`,
      });
    }

    await prisma.categoria.delete({
      where: { id: idCategoria },
    });

    return res.status(200).json({ mensagem: "Categoria excluída com sucesso." });
  } catch (erro) {
    console.error("Erro ao excluir categoria:", erro);
    return res.status(500).json({ erro: "Erro interno ao excluir a categoria." });
  }
}

/**
 * Cria uma nova categoria.
 * Rota sugerida: POST /categorias
 * Body esperado: { "nome": "Design" }
 */
export async function criarCategoria(req, res) {
  try {
    const { nome } = req.body;

    if (!nome || typeof nome !== "string" || nome.trim().length < 2) {
      return res.status(400).json({ erro: "Informe um nome de categoria com pelo menos 2 caracteres." });
    }

    const categoria = await prisma.categoria.create({
      data: { nome: nome.trim() },
    });

    return res.status(201).json({
      mensagem: "Categoria criada com sucesso.",
      categoria,
    });
  } catch (erro) {
    if (erro.code === "P2002") {
      return res.status(409).json({ erro: "Já existe uma categoria com esse nome." });
    }
    console.error("Erro ao criar categoria:", erro);
    return res.status(500).json({ erro: "Erro interno ao criar a categoria." });
  }
}