import mongoose from "../config/conexao.js";

const ContatoSchema = new mongoose.Schema({
  nome: { type: String, required: true },
  email: { type: String, required: true },
  telefone: { type: String, required: true },
  produto: { type: String },
  quantidade: { type: Number },
  itens: [{
    produto: { type: String },
    quantidade: { type: Number },
    preco: { type: Number }
  }],
  total: { type: Number },
  mensagem: { type: String },
  status: {
    type: String,
    enum: ['Aguardando', 'Respondido via WhatsApp', 'Respondido via Email', 'Não respondido'],
    default: 'Aguardando'
  },
}, { timestamps: true });

export default mongoose.model("Contato", ContatoSchema);
