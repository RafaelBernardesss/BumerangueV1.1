import prisma from "../prisma/Client.js";
import bcrypt from "bcrypt";

class UsuarioController {
    async cadastrar(req, res) {
        try {
            const { nome, email, cpf, senha } = req.body;

            // Verificar campos vazios
            if (!nome || !email || !cpf || !senha) {
                return res.status(400).json({
                    erro: "Preencha todos os campos"
                });
            }

            const cpfLimpo = cpf.replace(/\D/g, "");

            // Verificar email existente
            const emailExiste = await prisma.usuario.findUnique({
                where: {
                    email
                }
            });
            if (emailExiste) {
                return res.status(400).json({
                    erro: "Email já cadastrado"
                });
            }

            // Verificar CPF existente
            const cpfExiste = await prisma.usuario.findUnique({
                where: {
                    cpf: cpfLimpo
                }
            });
            if (cpfExiste) {
                return res.status(400).json({
                    erro: "CPF já cadastrado"
                });
            }

            const senhaHash = await bcrypt.hash(req.body.senha, 10);

            // Criar usuário
            const usuario = await prisma.usuario.create({
                data: {
                    nome,
                    email,
                    cpf: cpfLimpo,
                    senha: senhaHash
                }
            });

            

            return res.status(201).json({
                mensagem: "Usuário cadastrado com sucesso",
                usuario
            });
        } catch (error) {
            console.log(error);
            return res.status(500).json({
                erro: "Erro ao cadastrar usuário"
            });
        }
    }
}

export default new UsuarioController();