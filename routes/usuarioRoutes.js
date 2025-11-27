import express from "express";
import UsuarioController from "../controllers/UsuarioController.js";

const router = express.Router();
const controle = new UsuarioController();

const base = "usuario/";

// Tela de login
router.get("/login", (req, res) => controle.openLogin(req, res));

// Verifica login
router.post("/login", (req, res) => controle.login(req, res));

// Logout
router.get("/logout", (req, res) => controle.logout(req, res));

export default router;