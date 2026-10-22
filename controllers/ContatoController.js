import Contato from '../models/Contato.js'

function escaparRegex(texto) {
  return String(texto || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export default class ContatoController {
  async openAdd(req, res) {
    res.redirect('/contato/lst')
  }

  async add(req, res) {
    try {
      const { nome, email, telefone, produto, quantidade, mensagem, status } = req.body

      if (!nome || !email || !telefone) {
        return res.status(400).send('Nome, e-mail e telefone são obrigatórios.')
      }

      await Contato.create({ nome, email, telefone, produto, quantidade, mensagem, status })
      res.redirect('/contato/lst')
    } catch (erro) {
      console.error('Erro ao cadastrar contato:', erro)
      res.status(500).send('Erro ao cadastrar o contato.')
    }
  }

  async list(req, res) {
    try {
      const contatos = await Contato.find().sort({ createdAt: -1 })
      res.render('contato/lst', { contatos })
    } catch (erro) {
      console.error('Erro ao listar contatos:', erro)
      res.status(500).send('Erro ao carregar a lista de orçamentos.')
    }
  }

  async find(req, res) {
    try {
      const { busca } = req.body
      const regex = new RegExp(escaparRegex(busca), 'i')
      const contatos = await Contato.find({
        $or: [
          { nome: regex },
          { email: regex },
          { telefone: regex },
          { produto: regex }
        ]
      }).sort({ createdAt: -1 })
      res.render('contato/lst', { contatos })
    } catch (erro) {
      console.error('Erro ao buscar contatos:', erro)
      res.status(500).send('Erro ao buscar orçamentos.')
    }
  }

  async openEdt(req, res) {
    try {
      const contato = await Contato.findById(req.params.id)

      if (!contato) {
        return res.status(404).send('Orçamento não encontrado')
      }

      res.render('contato/edt', { contato })
    } catch (erro) {
      console.error('Erro ao abrir orçamento:', erro)
      res.status(500).send('Erro ao abrir o orçamento.')
    }
  }

  async edt(req, res) {
    try {
      const { status } = req.body
      await Contato.findByIdAndUpdate(req.params.id, { status }, { runValidators: true })
      res.redirect('/contato/lst')
    } catch (erro) {
      console.error('Erro ao editar contato:', erro)
      res.status(500).send('Erro ao salvar o status do orçamento.')
    }
  }

  async del(req, res) {
    try {
      await Contato.findByIdAndDelete(req.params.id)
      res.redirect('/contato/lst')
    } catch (erro) {
      console.error('Erro ao excluir contato:', erro)
      res.status(500).send('Erro ao excluir o orçamento.')
    }
  }
}
