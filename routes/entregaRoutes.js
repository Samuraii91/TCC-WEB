import express from 'express'
const router = express.Router()

import EntregaController from '../controllers/EntregaController.js'
import { verificarLogin } from '../middlewares/auth.js'
const controle = new EntregaController()

const caminhobase = 'entrega/'

// 🔒 Todas as rotas de entrega exigem login
router.use("/entrega", verificarLogin)

// Adicionar
router.get('/' + caminhobase + 'add', controle.openAdd)
router.post('/' + caminhobase + 'add', controle.add)

// Listar
router.get('/' + caminhobase + 'lst', controle.list)

// Buscar (opcional)
router.post('/' + caminhobase + 'find', controle.find)

// Editar
router.get('/' + caminhobase + 'edt/:id', controle.openEdt)
router.post('/' + caminhobase + 'edt/:id', controle.edt)

// Deletar
router.get('/' + caminhobase + 'del/:id', controle.del)

export default router
