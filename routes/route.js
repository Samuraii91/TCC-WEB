import express from 'express'
const router = express.Router()

import Controller from '../controllers/controller.js'
const controle = new Controller()

// =================== SITE ===================
router.get('/site', controle.siteIndex) // rota principal do site


export default router
