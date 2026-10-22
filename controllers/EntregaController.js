import mongoose from 'mongoose'
import Entrega from '../models/Entrega.js'
import Produto from '../models/Produto.js'

function escaparRegex(texto) {
  return String(texto || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function montarItens(body) {
  const produtos = Array.isArray(body.produto) ? body.produto : (body.produto ? [body.produto] : [])
  const quantidades = Array.isArray(body.quantidadeItem) ? body.quantidadeItem : (body.quantidadeItem ? [body.quantidadeItem] : [])
  return produtos
    .map((id, i) => {
      if (!id || !mongoose.isValidObjectId(id)) return null
      return { produto: id, quantidade: Math.max(1, Number(quantidades[i]) || 1) }
    })
    .filter(Boolean)
}

async function produtosValidos(itens) {
  const ids = itens.map(i => i.produto)
  const total = await Produto.countDocuments({ _id: { $in: ids } })
  return total === new Set(ids.map(String)).size
}

export default class EntregaController {
  async openAdd(req, res) {
    try {
      const produtos = await Produto.find()
      res.render('entrega/add', { produtos })
    } catch (erro) {
      console.error('Erro ao abrir formulário de entrega:', erro)
      res.status(500).send('Erro ao abrir o formulário de entrega.')
    }
  }

  async add(req, res) {
    try {
      const { cliente, endereco, status, data } = req.body
      const itens = montarItens(req.body)

      if (!itens.length || !cliente || !endereco || !data) {
        return res.redirect('/entrega/add')
      }

      if (!(await produtosValidos(itens))) {
        return res.status(400).send('Um ou mais produtos informados não existem.')
      }

      await Entrega.create({
        itens,
        cliente,
        endereco,
        status,
        data: new Date(data)
      })
      res.redirect('/entrega/lst')
    } catch (erro) {
      console.error('Erro ao cadastrar entrega:', erro)
      res.status(500).send('Erro ao cadastrar a entrega.')
    }
  }

  async list(req, res) {
    try {
      const entregas = await Entrega.find().populate('itens.produto')
      res.render('entrega/lst', { entregas })
    } catch (erro) {
      console.error('Erro ao listar entregas:', erro)
      res.status(500).send('Erro ao carregar a lista de entregas.')
    }
  }

  async openEdt(req, res) {
    try {
      const entrega = await Entrega.findById(req.params.id)
      const produtos = await Produto.find()

      if (!entrega) {
        return res.status(404).send('Entrega não encontrada')
      }

      res.render('entrega/edt', { entrega, produtos })
    } catch (erro) {
      console.error('Erro ao carregar edição de entrega:', erro)
      res.status(500).send('Erro ao carregar a página de edição.')
    }
  }

  async edt(req, res) {
    try {
      const { cliente, endereco, status, data } = req.body
      const itens = montarItens(req.body)

      if (!itens.length || !cliente || !endereco || !data) {
        return res.redirect('/entrega/edt/' + req.params.id)
      }

      if (!(await produtosValidos(itens))) {
        return res.status(400).send('Um ou mais produtos informados não existem.')
      }

      await Entrega.findByIdAndUpdate(req.params.id, {
        itens,
        cliente,
        endereco,
        status,
        data: new Date(data)
      }, { runValidators: true })
      res.redirect('/entrega/lst')
    } catch (erro) {
      console.error('Erro ao editar entrega:', erro)
      res.status(500).send('Erro ao salvar a edição da entrega.')
    }
  }

  async del(req, res) {
    try {
      await Entrega.findByIdAndDelete(req.params.id)
      res.redirect('/entrega/lst')
    } catch (erro) {
      console.error('Erro ao excluir entrega:', erro)
      res.status(500).send('Erro ao excluir a entrega.')
    }
  }

  async find(req, res) {
    try {
      const { cliente } = req.body
      const filtro = new RegExp(escaparRegex(cliente), 'i')
      const entregas = await Entrega.find({ cliente: filtro }).populate('itens.produto')
      res.render('entrega/lst', { entregas })
    } catch (erro) {
      console.error('Erro ao buscar entregas:', erro)
      res.status(500).send('Erro ao buscar entregas.')
    }
  }
}
