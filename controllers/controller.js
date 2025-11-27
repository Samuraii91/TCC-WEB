import Produto from '../models/Produto.js'
import Categoria from '../models/Categoria.js'

export default class Controller {
  siteIndex = async (req, res) => {
    try {
      const categorias = await Categoria.find()
      const produtos = await Produto.find().populate('categoria')

      res.render('site/index', { categorias, produtos })
    } catch (erro) {
      console.log(erro)
      res.status(500).send('Erro ao carregar a página')
    }
  }
}
