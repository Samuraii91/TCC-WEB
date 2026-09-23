import mongoose from 'mongoose'

const itemEntregaSchema = new mongoose.Schema({
  produto: { type: mongoose.Schema.Types.ObjectId, ref: 'Produto', required: true },
  quantidade: { type: Number, required: true, default: 1 }
}, { _id: false })

const entregaSchema = new mongoose.Schema({
  itens: { type: [itemEntregaSchema], default: [] },
  cliente: { type: String, required: true },
  endereco: { type: String, required: true },
  status: { type: String, enum: ['Pendente', 'Em rota', 'Entregue'], default: 'Pendente' },
  data: { type: Date, required: true },
})

export default mongoose.model('Entrega', entregaSchema)
