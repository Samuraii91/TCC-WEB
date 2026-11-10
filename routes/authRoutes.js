// routes/authRoutes.js
import express from 'express'
const router = express.Router()

import AuthController from '../controllers/authController.js'
const controle = new AuthController()

// O login/logout é tratado por usuarioRoutes.
// O cadastro é público, mas exige a senha do dono para criar o administrador.
router.get('/register', controle.registerPage)
router.post('/register', controle.register)

export default router
