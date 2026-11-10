// controllers/authController.js
import Usuario from "../models/Usuario.js";
import bcrypt from "bcrypt";

export default class AuthController {
  // 🔹 Exibir tela de login
  loginPage = (req, res) => {
    res.render("usuario/login", { erro: null, sucesso: null });
  };

  // 🔹 Exibir tela de cadastro
  registerPage = (req, res) => {
    res.render("cadastro/cadastro", { erro: null, sucesso: null });
  };

  // 🔹 Cadastrar novo administrador (exige a senha do dono)
  register = async (req, res) => {
    const email = String(req.body.email || "").trim();
    const senha = String(req.body.senha || "");
    const senhaDono = String(req.body.senhaDono || "");
    const nome = String(req.body.nome || "").trim() || email.split("@")[0] || "Administrador";

    try {
      if (!email || !senha || !senhaDono) {
        return res.render("cadastro/cadastro", {
          erro: "Preencha e-mail, senha e senha do dono.",
          sucesso: null,
        });
      }

      const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      if (!emailValido) {
        return res.render("cadastro/cadastro", {
          erro: "Informe um e-mail válido.",
          sucesso: null,
        });
      }

      const senhaDonoCorreta = process.env.SENHA_DONO || "1502";
      if (senhaDono !== senhaDonoCorreta) {
        return res.render("cadastro/cadastro", {
          erro: "Senha do dono incorreta.",
          sucesso: null,
        });
      }

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

      // 🔹 Redireciona para o painel administrativo
      res.redirect("/dashboard");
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
