import mongoose from "../config/conexao.js";

const CategoriaSchema = new mongoose.Schema({
  nome: { type: String, required: true },
  descricao: { type: String, required: false },

  imagemBase64: { type: String, required: false },
  mimetype: { type: String, required: false }

}, { timestamps: true });

export default mongoose.model("Categoria", CategoriaSchema);
