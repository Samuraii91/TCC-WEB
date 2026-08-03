import Produto from '../models/Produto.js'
import Categoria from '../models/Categoria.js'
import Servico from '../models/Servico.js'
import Entrega from '../models/Entrega.js'

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

  // 🔹 Exibe a tela de senha da área administrativa
  adminPage = (req, res) => {
    res.render('site/admin', { erro: null })
  }

  // 🔹 Verifica a senha fixa e, se correta, leva para a tela de login já existente
  adminLogin = (req, res) => {
    const { senha } = req.body

    if (senha === 'admin1502') {
      return res.redirect('/login')
    }

    res.render('site/admin', { erro: 'Senha incorreta!' })
  }

  // 🔹 Painel administrativo com indicadores gerais
  dashboardPage = async (req, res) => {
    try {
      const [
        totalProdutos,
        totalCategorias,
        totalServicos,
        totalEntregas,
        entregasPendentes,
        produtosBaixoEstoque,
        ultimasEntregas,
        todosProdutos,
        todasEntregas
      ] = await Promise.all([
        Produto.countDocuments(),
        Categoria.countDocuments(),
        Servico.countDocuments(),
        Entrega.countDocuments(),
        Entrega.countDocuments({ status: 'Pendente' }),
        Produto.countDocuments({ quantidade: { $lte: 5 } }),
        Entrega.find().populate('produto').sort({ data: -1 }).limit(5),
        Produto.find().populate('categoria'),
        Entrega.find()
      ])

      // Dados para o gráfico de produtos por categoria
      const porCategoria = {}
      todosProdutos.forEach(p => {
        const nome = p.categoria ? p.categoria.nome : 'Sem categoria'
        porCategoria[nome] = (porCategoria[nome] || 0) + 1
      })

      // Dados para o gráfico de entregas por status
      const porStatus = {}
      todasEntregas.forEach(e => {
        const s = e.status || 'Pendente'
        porStatus[s] = (porStatus[s] || 0) + 1
      })
      const statusLabels = ['Pendente', 'Em rota', 'Entregue'].filter(s => porStatus[s])

      res.render('dashboard', {
        usuarioNome: req.session.usuario ? req.session.usuario.nome : null,
        totalProdutos,
        totalCategorias,
        totalServicos,
        totalEntregas,
        entregasPendentes,
        produtosBaixoEstoque,
        ultimasEntregas,
        entregasStatus: {
          labels: statusLabels,
          data: statusLabels.map(s => porStatus[s])
        },
        produtosCat: {
          labels: Object.keys(porCategoria),
          data: Object.values(porCategoria)
        }
      })
    } catch (erro) {
      console.log(erro)
      res.status(500).send('Erro ao carregar o painel administrativo')
    }
  }
}
