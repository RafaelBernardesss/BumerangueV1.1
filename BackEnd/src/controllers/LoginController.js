import bcrypt from "bcrypt";
import prisma from "../prisma/Client.js";

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

      // Verificar se encontrou usuário
      if (!usuario) {
        return res.status(401).json({
          erro: "CPF ou senha inválidos",
        });
      }

      // Suporta senhas armazenadas em texto puro ou bcrypt
      let senhaCorreta = false;
      try {
        if (typeof usuario.senha === "string" && usuario.senha.startsWith("$2")) {
          senhaCorreta = await bcrypt.compare(senha, usuario.senha);
        } else {
          senhaCorreta = senha === usuario.senha;
        }
      } catch (e) {
        senhaCorreta = false;
      }

      if (!senhaCorreta) {
        return res.status(401).json({ erro: "CPF ou senha inválidos" });
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