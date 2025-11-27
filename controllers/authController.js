// controllers/authController.js
import Usuario from "../models/Usuario.js";
import bcrypt from "bcrypt";

export default class AuthController {
  // 🔹 Exibir tela de login
  loginPage = (req, res) => {
    res.render("login", { erro: null, sucesso: null });
  };

  // 🔹 Exibir tela de cadastro
  registerPage = (req, res) => {
    res.render("cadastro/cadastro", { erro: null, sucesso: null });
  };

  // 🔹 Cadastrar novo usuário
  register = async (req, res) => {
    const { nome, email, senha } = req.body;

    try {
      const userExists = await Usuario.findOne({ email });
      if (userExists) {
        return res.render("cadastro/cadastro", {
          erro: "E-mail já cadastrado!",
          sucesso: null,
        });
      }

      const salt = await bcrypt.genSalt(10);
      const senhaCriptografada = await bcrypt.hash(senha, salt);

      const novoUsuario = new Usuario({ nome, email, senha: senhaCriptografada });
      await novoUsuario.save();

      // ✅ Redireciona corretamente para a tela de login
      res.redirect("/login");
    } catch (err) {
      console.error("Erro ao cadastrar usuário:", err);
      res.render("cadastro/cadastro", {
        erro: "Erro ao cadastrar usuário.",
        sucesso: null,
      });
    }
  };

  // 🔹 Login de usuário
  login = async (req, res) => {
    const { email, senha } = req.body;

    try {
      const usuario = await Usuario.findOne({ email });
      if (!usuario) {
        return res.render("login", {
          erro: "Usuário não encontrado!",
          sucesso: null,
        });
      }

      const senhaCorreta = await bcrypt.compare(senha, usuario.senha);
      if (!senhaCorreta) {
        return res.render("login", {
          erro: "Senha incorreta!",
          sucesso: null,
        });
      }

      // 🔹 Salva o usuário logado na sessão
      req.session.usuario = {
        id: usuario._id,
        nome: usuario.nome,
        email: usuario.email,
      };

      // 🔹 Redireciona para a página principal
      res.redirect("/");
    } catch (err) {
      console.error("Erro no login:", err);
      res.render("login", {
        erro: "Erro ao fazer login.",
        sucesso: null,
      });
    }
  };

  // 🔹 Logout de usuário
  logout = (req, res) => {
    req.session.destroy(() => {
      res.redirect("/login");
    });
  };
}
