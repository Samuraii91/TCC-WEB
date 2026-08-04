import Produto from '../models/Produto.js'
import Categoria from '../models/Categoria.js'
import Servico from '../models/Servico.js'
import Entrega from '../models/Entrega.js'
import Contato from '../models/Contato.js'

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

  // 🔹 Recebe a nota dada pelo cliente e salva no produto
  avaliarProduto = async (req, res) => {
    try {
      const { id, nota } = req.body
      const valor = Number(nota)

      if (!id || !valor || valor < 1 || valor > 5) {
        return res.status(400).json({ ok: false, erro: 'Nota inválida' })
      }

      const produto = await Produto.findById(id)
      if (!produto) {
        return res.status(404).json({ ok: false, erro: 'Produto não encontrado' })
      }

      produto.avaliacoes.push(valor)
      await produto.save()

      const media = produto.avaliacoes.reduce((s, v) => s + v, 0) / produto.avaliacoes.length
      res.status(200).json({
        ok: true,
        notaMedia: Math.round(media * 10) / 10,
        total: produto.avaliacoes.length
      })
    } catch (erro) {
      console.log(erro)
      res.status(500).json({ ok: false, erro: 'Erro ao avaliar o produto' })
    }
  }

  // 🔹 Salva o formulário de contato/orçamento no banco (o e-mail continua indo pelo Formspree)
  salvarContato = async (req, res) => {
    try {
      const { nome, email, telefone, produto, quantidade, mensagem } = req.body
      await Contato.create({
        nome,
        email,
        telefone,
        produto,
        quantidade: quantidade || undefined,
        mensagem
      })
      res.status(200).json({ ok: true })
    } catch (erro) {
      console.log(erro)
      res.status(500).json({ ok: false, erro: 'Erro ao salvar o contato' })
    }
  }

  // 🔹 Tela de senha fixa da área administrativa
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
        todasEntregas,
        totalContatos,
        contatosAguardando,
        ultimosContatos,
        todosContatos
      ] = await Promise.all([
        Produto.countDocuments(),
        Categoria.countDocuments(),
        Servico.countDocuments(),
        Entrega.countDocuments(),
        Entrega.countDocuments({ status: 'Pendente' }),
        Produto.countDocuments({ quantidade: { $lte: 5 } }),
        Entrega.find().populate('produto').sort({ data: -1 }).limit(5),
        Produto.find().populate('categoria'),
        Entrega.find(),
        Contato.countDocuments(),
        Contato.countDocuments({ status: 'Aguardando' }),
        Contato.find().sort({ createdAt: -1 }).limit(5),
        Contato.find()
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

      // Dados para o gráfico de orçamentos por status
      const porStatusContato = {}
      todosContatos.forEach(c => {
        const s = c.status || 'Aguardando'
        porStatusContato[s] = (porStatusContato[s] || 0) + 1
      })
      const contatoStatusLabels = ['Aguardando', 'Respondido via WhatsApp', 'Respondido via Email', 'Não respondido'].filter(s => porStatusContato[s])

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
        contatosStatus: {
          labels: contatoStatusLabels,
          data: contatoStatusLabels.map(s => porStatusContato[s])
        },
        produtosCat: {
          labels: Object.keys(porCategoria),
          data: Object.values(porCategoria)
        },
        totalContatos,
        contatosAguardando,
        ultimosContatos
      })
    } catch (erro) {
      console.log(erro)
      res.status(500).send('Erro ao carregar o painel administrativo')
    }
  }
}
