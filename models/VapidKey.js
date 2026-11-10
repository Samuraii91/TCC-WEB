import mongoose from '../config/conexao.js'

const vapidKeySchema = new mongoose.Schema({
  _id: { type: String, required: true, default: 'vapid' },
  publicKey: { type: String, required: true },
  privateKey: { type: String, required: true }
})

export default mongoose.models.VapidKey || mongoose.model('VapidKey', vapidKeySchema)
