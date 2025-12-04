import Estoque from '../models/Estoque.js'
import Produto from '../models/Produto.js'
import Categoria from '../models/Categoria.js'

export default class EstoqueController {

  // Abrir formulário de cadastro
  async openAdd(req, res) {
    const produtos = await Produto.find()
    const categorias = await Categoria.find()
    res.render('estoque/add', { produtos, categorias })
  }

  // Adicionar item ao estoque
  async add(req, res) {
    const { produto, categoria, quantidade } = req.body

    await Estoque.create({
      produto,
      categoria,
      quantidade: Number(quantidade)
    })

    res.redirect('/estoque/lst')
  }

  // Listar estoque
  async list(req, res) {
    const itens = await Estoque.find()
      .populate('produto')
      .populate('categoria')

    res.render('estoque/lst', { itens })
  }

  // Abrir edição
  async openEdt(req, res) {
    const item = await Estoque.findById(req.params.id)
    const produtos = await Produto.find()
    const categorias = await Categoria.find()

    res.render('estoque/edt', { item, produtos, categorias })
  }

  // Editar
  async edt(req, res) {
    const { produto, categoria, quantidade } = req.body

    await Estoque.findByIdAndUpdate(req.params.id, {
      produto,
      categoria,
      quantidade: Number(quantidade)
    })

    res.redirect('/estoque/lst')
  }

  // Excluir
  async del(req, res) {
    await Estoque.findByIdAndDelete(req.params.id)
    res.redirect('/estoque/lst')
  }

  // Buscar por nome de produto
  async find(req, res) {
    const { produto } = req.body

    const itens = await Estoque.find()
      .populate({
        path: 'produto',
        match: { nome: new RegExp(produto, 'i') }
      })
      .populate('categoria')

    // Filtra apenas os itens que tenham o produto populado
    const resultado = itens.filter(i => i.produto)

    res.render('estoque/lst', { itens: resultado })
  }
}
