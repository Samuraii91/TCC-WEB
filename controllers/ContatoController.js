import Contato from '../models/Contato.js'

export default class ContatoController {
  async openAdd(req, res) {
    res.redirect('/contato/lst')
  }

  async add(req, res) {
    const { nome, email, telefone, produto, quantidade, mensagem, status } = req.body
    await Contato.create({ nome, email, telefone, produto, quantidade, mensagem, status })
    res.redirect('/contato/lst')
  }

  async list(req, res) {
    const contatos = await Contato.find().sort({ createdAt: -1 })
    res.render('contato/lst', { contatos })
  }

  async find(req, res) {
    const { busca } = req.body
    const contatos = await Contato.find({
      $or: [
        { nome: new RegExp(busca, 'i') },
        { email: new RegExp(busca, 'i') },
        { telefone: new RegExp(busca, 'i') },
        { produto: new RegExp(busca, 'i') }
      ]
    }).sort({ createdAt: -1 })
    res.render('contato/lst', { contatos })
  }

  async openEdt(req, res) {
    const contato = await Contato.findById(req.params.id)
    res.render('contato/edt', { contato })
  }

  async edt(req, res) {
    const { status } = req.body
    await Contato.findByIdAndUpdate(req.params.id, { status })
    res.redirect('/contato/lst')
  }

  async del(req, res) {
    await Contato.findByIdAndDelete(req.params.id)
    res.redirect('/contato/lst')
  }
}
