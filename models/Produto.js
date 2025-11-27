import mongoose from "../config/conexao.js";

const ProdutoSchema = new mongoose.Schema({
  nome: { type: String, required: true },
  descricao: { type: String },
  preco: { type: Number, required: true },

  categoria: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Categoria",
    required: false
  },

  // Agora a imagem é salva como Base64 e não mais Buffer
  imagemBase64: { type: String, required: false },

  // Tipo do arquivo (image/png, image/jpeg, etc)
  mimetype: { type: String, required: false },

}, { timestamps: true });

export default mongoose.model("Produto", ProdutoSchema);
