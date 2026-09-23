import Entrega from '../models/Entrega.js'
import Produto from '../models/Produto.js'

function montarItens(body) {
  const produtos = Array.isArray(body.produto) ? body.produto : (body.produto ? [body.produto] : [])
  const quantidades = Array.isArray(body.quantidadeItem) ? body.quantidadeItem : (body.quantidadeItem ? [body.quantidadeItem] : [])
  return produtos
    .map((id, i) => id ? { produto: id, quantidade: Math.max(1, Number(quantidades[i]) || 1) } : null)
    .filter(Boolean)
}

export default class EntregaController {
  async openAdd(req, res) {
    const produtos = await Produto.find()
    res.render('entrega/add', { produtos })
  }

  async add(req, res) {
    const { cliente, endereco, status, data } = req.body
    const itens = montarItens(req.body)
    if (!itens.length) {
      return res.redirect('/entrega/add')
    }
    await Entrega.create({
      itens,
      cliente,
      endereco,
      status,
      data: new Date(data)
    })
    res.redirect('/entrega/lst')
  }

  async list(req, res) {
    const entregas = await Entrega.find().populate('itens.produto')
    res.render('entrega/lst', { entregas })
  }

  async openEdt(req, res) {
    const entrega = await Entrega.findById(req.params.id)
    const produtos = await Produto.find()
    res.render('entrega/edt', { entrega, produtos })
  }

  async edt(req, res) {
    const { cliente, endereco, status, data } = req.body
    const itens = montarItens(req.body)
    if (!itens.length) {
      return res.redirect('/entrega/edt/' + req.params.id)
    }
    await Entrega.findByIdAndUpdate(req.params.id, {
      itens,
      cliente,
      endereco,
      status,
      data: new Date(data)
    })
    res.redirect('/entrega/lst')
  }

  async del(req, res) {
    await Entrega.findByIdAndDelete(req.params.id)
    res.redirect('/entrega/lst')
  }

  async find(req, res) {
    const { cliente } = req.body
    const entregas = await Entrega.find({ cliente: new RegExp(cliente, 'i') }).populate('itens.produto')
    res.render('entrega/lst', { entregas })
  }
}
