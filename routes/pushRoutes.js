import express from 'express'
import PushController from '../controllers/PushController.js'
import { verificarLogin } from '../middlewares/auth.js'

const router = express.Router()
const controle = new PushController()

router.get('/push/chave-publica', verificarLogin, controle.chavePublica)
router.post('/push/subscribe', verificarLogin, controle.subscribe)
router.post('/push/unsubscribe', verificarLogin, controle.unsubscribe)
router.post('/push/status', verificarLogin, controle.status)
router.post('/push/testar', verificarLogin, controle.testar)

export default router
