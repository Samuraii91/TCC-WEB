// middlewares/auth.js
export function verificarLogin(req, res, next) {
  if (req.session && req.session.usuario) {
    // Usuário está logado → continua
    next();
  } else {
    // Redireciona para a tela de login
    res.redirect("/login");
  }
}
