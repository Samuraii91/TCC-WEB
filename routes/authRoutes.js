// routes/authRoutes.js
import express from 'express'
const router = express.Router()

import AuthController from '../controllers/authController.js'
import { verificarLogin } from '../middlewares/auth.js'
const controle = new AuthController()

// O login/logout é tratado por usuarioRoutes.
// O cadastro de novos usuários é restrito a quem já está logado.
router.get('/register', verificarLogin, controle.registerPage)
router.post('/register', verificarLogin, controle.register)

export default router
