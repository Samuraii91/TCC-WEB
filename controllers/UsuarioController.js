import Usuario from "../models/Usuario.js";
import bcrypt from "bcrypt";

export default class UsuarioController {
  // Middleware para proteger rotas
  static verificarLogin(req, res, next) {
    if (req.session && req.session.usuario) {
      next();
    } else {
      res.redirect("/login");
    }
  }

  // 🔹 Exibe a tela de login
  async openLogin(req, res) {
    res.render("usuario/login", { erro: null });
  }

  // 🔹 Realiza o login do usuário
  async login(req, res) {
    const { email, senha } = req.body;

    try {
      const usuario = await Usuario.findOne({ email });

      if (!usuario) {
        return res.render("usuario/login", { erro: "Usuário não encontrado!" });
      }

      const senhaCorreta = await bcrypt.compare(senha, usuario.senha);
      if (!senhaCorreta) {
        return res.render("usuario/login", { erro: "Senha incorreta!" });
      }

      // Salva o usuário logado na sessão
      req.session.usuario = {
        id: usuario._id,
        nome: usuario.nome,
        email: usuario.email,
      };

      // Redireciona após o login bem-sucedido
      res.redirect("/dashboard");
    } catch (err) {
      console.error("Erro ao fazer login:", err);
      res.render("usuario/login", { erro: "Erro ao realizar login." });
    }
  }

  // 🔹 Realiza o logout do usuário
  async logout(req, res) {
    req.session.destroy(() => {
      res.redirect("/login");
    });
  }
}
