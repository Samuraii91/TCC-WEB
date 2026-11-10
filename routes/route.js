import express from 'express'
const router = express.Router()

import Controller from '../controllers/controller.js'
import { verificarLogin } from '../middlewares/auth.js'
const controle = new Controller()

// =================== SITE ===================
router.get('/site', controle.siteIndex) // rota principal do site
router.post('/site/contato', controle.salvarContato) // salva orçamento no banco
router.post('/site/avaliar', controle.avaliarProduto) // salva avaliação do produto

// =================== PAINEL ADMINISTRATIVO ===================
router.get('/dashboard', verificarLogin, controle.dashboardPage) // painel com indicadores gerais


export default router
