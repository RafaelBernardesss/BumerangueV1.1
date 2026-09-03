import prisma from "../prisma/Client.js";
import bcrypt from "bcrypt";

class LoginController {
  async login(req, res) {
    try {
      const { cpf, senha } = req.body;

      // Verificar campos vazios
      if (!cpf || !senha) {
        return res.status(400).json({
          erro: "Preencha CPF e senha",
        });
      }

      // remover pontos e traços do CPF
      const cpfLimpo = cpf.replace(/\D/g, "");

    

      // Procurar usuário pelo CPF e senha (texto puro, sem criptografia por enquanto)
      const usuario = await prisma.usuario.findFirst({
        where: { cpf: cpfLimpo },
      });

        const senhaCorreta = await bcrypt.compare(senha, usuario.senha);

      // Verificar se encontrou usuário
      if (!usuario || !senhaCorreta) {
        return res.status(401).json({
          erro: "CPF ou senha inválidos",
        });
      }

      // Remove a senha antes de devolver o usuário para o front-end
      const { senha: _senha, ...usuarioSemSenha } = usuario;

      return res.status(200).json({
        mensagem: "Login realizado com sucesso",
        usuario: usuarioSemSenha,
      });

    } catch (error) {
      console.log(error);

      return res.status(500).json({
        erro: "Erro ao fazer login",
      });
    }
  }
}

export default new LoginController();