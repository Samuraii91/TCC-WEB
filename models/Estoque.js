import mongoose from "../config/conexao.js";

const EstoqueSchema = new mongoose.Schema({
  produto: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Produto",
    required: false
  },

  categoria: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Categoria",
    required: false
  },

  quantidade: { 
    type: Number, 
    required: true,
    min: 0  // Evita quantidade negativa
  }

}, { timestamps: true });

export default mongoose.model("Estoque", EstoqueSchema);
