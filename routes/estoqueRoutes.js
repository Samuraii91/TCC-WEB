import express from 'express'
const router = express.Router()

import EstoqueController from '../controllers/EstoqueController.js'
const controle = new EstoqueController()

const caminhobase = 'estoque/'

// Adicionar
router.get('/' + caminhobase + 'add', controle.openAdd)
router.post('/' + caminhobase + 'add', controle.add)

// Listar
router.get('/' + caminhobase + 'lst', controle.list)

// Buscar
router.post('/' + caminhobase + 'find', controle.find)

// Editar
router.get('/' + caminhobase + 'edt/:id', controle.openEdt)
router.post('/' + caminhobase + 'edt/:id', controle.edt)

// Excluir
router.get('/' + caminhobase + 'del/:id', controle.del)

export default router
