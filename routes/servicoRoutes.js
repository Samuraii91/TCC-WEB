import express from 'express'
const router = express.Router()

import ServicoController from '../controllers/ServicoController.js'
const controle = new ServicoController()

const caminhobase = 'servico/'

// Formulário de adicionar
router.get('/' + caminhobase + 'add', controle.openAdd)
router.post('/' + caminhobase + 'add', controle.add)

// Listar
router.get('/' + caminhobase + 'lst', controle.openLst)

// Buscar (caso queira implementar depois)
router.post('/' + caminhobase + 'find', controle.find)

// Editar
router.get('/' + caminhobase + 'edt/:id', controle.openEdt)
router.post('/' + caminhobase + 'edt/:id', controle.edt)

// Deletar
router.get('/' + caminhobase + 'del/:id', controle.del)

export default router
