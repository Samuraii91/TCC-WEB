import Servico from '../models/Servico.js'

export default class ServicoController {
  constructor(caminhoBase = 'servico/') {
    this.caminhoBase = caminhoBase

    // Abrir formulário de adicionar
    this.openAdd = async (req, res) => {
      try {
        res.render(this.caminhoBase + 'add')
      } catch (err) {
        console.error(err)
        res.send('Erro ao abrir o formulário de serviço.')
      }
    }

    // Adicionar serviço
    this.add = async (req, res) => {
      try {
        await Servico.create({
          nome: req.body.nome,
          descricao: req.body.descricao,
          preco: Number(req.body.preco) // converte para número
        })
        res.redirect('/' + this.caminhoBase + 'lst')
      } catch (err) {
        console.error(err)
        res.send('Erro ao adicionar serviço.')
      }
    }

    // Listar serviços
    this.openLst = async (req, res) => {
      try {
        const servicos = await Servico.find()
        res.render(this.caminhoBase + 'lst', { servicos })
      } catch (err) {
        console.error(err)
        res.send('Erro ao listar serviços.')
      }
    }

    // Buscar serviço por nome
    this.find = async (req, res) => {
      try {
        const filtro = req.body.filtro
        const servicos = await Servico.find({ nome: { $regex: filtro, $options: 'i' } })
        res.render(this.caminhoBase + 'lst', { servicos })
      } catch (err) {
        console.error(err)
        res.send('Erro ao buscar serviços.')
      }
    }

    // Abrir formulário de edição
    this.openEdt = async (req, res) => {
      try {
        const servico = await Servico.findById(req.params.id)
        res.render(this.caminhoBase + 'edt', { servico })
      } catch (err) {
        console.error(err)
        res.send('Erro ao abrir formulário de edição.')
      }
    }

    // Editar serviço
    this.edt = async (req, res) => {
      try {
        await Servico.findByIdAndUpdate(req.params.id, {
          nome: req.body.nome,
          descricao: req.body.descricao,
          preco: Number(req.body.preco) // converte para número
        })
        res.redirect('/' + this.caminhoBase + 'lst')
      } catch (err) {
        console.error(err)
        res.send('Erro ao editar serviço.')
      }
    }

    // Deletar serviço
    this.del = async (req, res) => {
      try {
        await Servico.findByIdAndDelete(req.params.id)
        res.redirect('/' + this.caminhoBase + 'lst')
      } catch (err) {
        console.error(err)
        res.send('Erro ao deletar serviço.')
      }
    }
  }
}
