import mongoose from 'mongoose'

const servicoSchema = new mongoose.Schema({
  nome: { type: String, required: true },
  descricao: { type: String },
  preco: { type: Number, required: true } // <--- obrigatório
})

export default mongoose.model('Servico', servicoSchema)
