import Entrega from '../models/Entrega.js'
import Produto from '../models/Produto.js'

export default class EntregaController {
  async openAdd(req, res) {
    const produtos = await Produto.find()
    res.render('entrega/add', { produtos })
  }

  async add(req, res) {
    const { produto, cliente, endereco, status, data } = req.body
    await Entrega.create({
      produto,
      cliente,
      endereco,
      status,
      data: new Date(data)
    })
    res.redirect('/entrega/lst')
  }

  async list(req, res) {
    const entregas = await Entrega.find().populate('produto')
    res.render('entrega/lst', { entregas })
  }

  async openEdt(req, res) {
    const entrega = await Entrega.findById(req.params.id)
    const produtos = await Produto.find()
    res.render('entrega/edt', { entrega, produtos })
  }

  async edt(req, res) {
    const { produto, cliente, endereco, status, data } = req.body
    await Entrega.findByIdAndUpdate(req.params.id, {
      produto,
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
    const entregas = await Entrega.find({ cliente: new RegExp(cliente, 'i') }).populate('produto')
    res.render('entrega/lst', { entregas })
  }
}
