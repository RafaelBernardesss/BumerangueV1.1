import prisma from "../prisma/Client.js";

class AdminController {
  async listar(req, res) {
    try {
      const usuarios = await prisma.usuario.findMany({
        select: {
          id: true,
          nome: true,
          cpf: true,
          email: true,
        },
      });

      return res.status(200).json({ usuarios });
    } catch (error) {
      console.log(error);
      return res.status(500).json({
        erro: "Erro ao buscar usuários",
      });
    }
  }

  async deletar(req, res) {
    try {
      const { id } = req.params;

      await prisma.usuario.delete({
        where: { id: Number(id) },
      });

      return res.status(200).json({
        mensagem: "Usuário removido com sucesso",
      });
    } catch (error) {
      console.log(error);
      return res.status(500).json({
        erro: "Erro ao remover usuário",
      });
    }
  }
}

export default new AdminController();