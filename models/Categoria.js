import mongoose from "../config/conexao.js";

const CategoriaSchema = new mongoose.Schema({
  nome: { type: String, required: true },
});

export default mongoose.model("Categoria", CategoriaSchema);
