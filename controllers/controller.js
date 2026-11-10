import mongoose from 'mongoose'
import Produto from '../models/Produto.js'
import Categoria from '../models/Categoria.js'
import Servico from '../models/Servico.js'
import Entrega from '../models/Entrega.js'
import Contato from '../models/Contato.js'
import { enviarNotificacao } from '../services/pushService.js'

export default class Controller {
  siteIndex = async (req, res) => {
    try {
      const categorias = await Categoria.find()
      // Produtos fora de estoque não aparecem na listagem pública do site
      const produtos = (await Produto.find().populate('categoria')).filter(p => p.quantidade > 0)

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

      if (!id || !mongoose.isValidObjectId(id) || !valor || valor < 1 || valor > 5) {
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
    const normalizarTexto = (valor, limite) => {
      if (typeof valor !== 'string' && typeof valor !== 'number') return ''
      return String(valor).trim().slice(0, limite)
    }

    const normalizarLista = (valor) => {
      if (Array.isArray(valor)) return valor
      if (valor === undefined || valor === null) return []
      return [valor]
    }

    try {
      const nome = normalizarTexto(req.body.nome, 120)
      const email = normalizarTexto(req.body.email, 160)
      const telefone = normalizarTexto(req.body.telefone, 40)
      const mensagem = normalizarTexto(req.body.mensagem, 2000)
      const clientId = normalizarTexto(req.body.clientId, 80)

      if (!nome || !email || !telefone) {
        return res.status(400).json({ ok: false, erro: 'Nome, e-mail e telefone são obrigatórios.' })
      }

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({ ok: false, erro: 'E-mail inválido.' })
      }

      // Se o mesmo formulário for reenviado (timeout, duplo clique), não duplica o orçamento.
      if (clientId) {
        const existente = await Contato.findOne({ clientId }).lean()
        if (existente) {
          return res.status(200).json({ ok: true, jaSalvo: true })
        }
      }

      const nomesProdutos = normalizarLista(req.body.produtoItem)
      const quantidades = normalizarLista(req.body.quantidadeItem)

      const pedidos = new Map()
      nomesProdutos.forEach((nomeItem, i) => {
        const nomeLimpo = String(nomeItem || '').trim()
        if (!nomeLimpo) return
        const qtd = Math.max(1, Math.floor(Number(quantidades[i]) || 1))
        pedidos.set(nomeLimpo, (pedidos.get(nomeLimpo) || 0) + qtd)
      })

      // Compatibilidade com o formato antigo (um único produto por formulário).
      const produtoAntigo = normalizarTexto(req.body.produto, 200)
      if (pedidos.size === 0 && produtoAntigo) {
        const qtd = Math.max(1, Math.floor(Number(req.body.quantidade) || 1))
        pedidos.set(produtoAntigo, qtd)
      }

      if (pedidos.size === 0) {
        return res.status(400).json({ ok: false, erro: 'Selecione ao menos um produto para solicitar o orçamento.' })
      }

      // Usa sempre o preço e o estoque atuais do banco, nunca os valores enviados pelo cliente.
      const produtosCadastrados = await Produto.find()
      const produtosPorNome = new Map(
        produtosCadastrados.map(produto => [String(produto.nome || '').trim(), produto])
      )

      const itens = []
      const indisponiveis = []

      for (const [nomePedido, qtdPedida] of pedidos) {
        const produto = produtosPorNome.get(nomePedido)

        if (!produto) {
          indisponiveis.push(nomePedido)
          continue
        }

        const estoque = Number(produto.quantidade)
        if (Number.isFinite(estoque) && estoque <= 0) {
          indisponiveis.push(produto.nome)
          continue
        }

        const quantidade = Number.isFinite(estoque)
          ? Math.min(qtdPedida, Math.max(1, Math.floor(estoque)))
          : qtdPedida

        itens.push({
          produto: produto.nome,
          quantidade,
          preco: Number(produto.preco) || 0
        })
      }

      if (indisponiveis.length > 0) {
        return res.status(400).json({
          ok: false,
          erro: `Produto(s) indisponível(is): ${indisponiveis.join(', ')}. Atualize a página e tente novamente.`
        })
      }

      if (itens.length === 0) {
        return res.status(400).json({ ok: false, erro: 'Nenhum produto válido foi selecionado.' })
      }

      const total = itens.reduce((soma, item) => soma + (item.preco * item.quantidade), 0)

      const dadosContato = {
        nome,
        email,
        telefone,
        produto: itens[0].produto,
        quantidade: itens[0].quantidade,
        itens,
        total,
        mensagem: mensagem || undefined,
        clientId: clientId || undefined
      }

      let contato
      for (let tentativa = 1; tentativa <= 2; tentativa++) {
        try {
          contato = await Contato.create(dadosContato)
          break
        } catch (erroCriacao) {
          if (clientId && erroCriacao && erroCriacao.code === 11000) {
            const existente = await Contato.findOne({ clientId }).lean()
            if (existente) {
              return res.status(200).json({ ok: true, jaSalvo: true })
            }
          }

          if (tentativa === 2) throw erroCriacao
          await new Promise(resolver => setTimeout(resolver, 250))
        }
      }

      const resumoItens = itens.map(item => `${item.quantidade}x ${item.produto}`).join(', ')

      try {
        await enviarNotificacao({
          title: 'Novo orçamento recebido',
          body: `${nome} enviou um orçamento${total > 0 ? ' de R$ ' + total.toFixed(2) : ''}: ${resumoItens}.`,
          icon: '/img/logo.png',
          badge: '/img/logo.png',
          url: '/contato/lst',
          tag: `orcamento-${contato._id}`
        })
      } catch (erroPush) {
        console.error('Erro ao enviar notificação de orçamento:', erroPush)
      }

      return res.status(200).json({ ok: true, protocolo: contato._id })
    } catch (erro) {
      console.error('Erro ao salvar orçamento:', erro)
      return res.status(500).json({ ok: false, erro: 'Não foi possível salvar o orçamento. Tente novamente.' })
    }
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
        Entrega.find().populate('itens.produto').sort({ data: -1 }).limit(5),
        Produto.find().populate('categoria'),
        Entrega.find(),
        Contato.countDocuments(),
        Contato.countDocuments({ status: 'Aguardando' }),
        Contato.find().sort({ createdAt: -1 }).limit(10),
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
