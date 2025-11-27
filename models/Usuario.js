// models/Usuario.js
import mongoose from 'mongoose'

const usuarioSchema = new mongoose.Schema({
  nome: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  senha: { type: String, required: true }
})

// Evita erro de "OverwriteModelError" ao recarregar o modelo
export default mongoose.models.Usuario || mongoose.model('Usuario', usuarioSchema)
