// routes/authRoutes.js
import express from 'express'
const router = express.Router()

import AuthController from '../controllers/authController.js'
const controle = new AuthController()

// 🔹 Rotas de autenticação
router.get('/login', controle.loginPage)
router.post('/login', controle.login)
router.get('/register', controle.registerPage)
router.post('/register', controle.register)

export default router
