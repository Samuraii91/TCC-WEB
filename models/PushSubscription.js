import mongoose from '../config/conexao.js'

const pushSubscriptionSchema = new mongoose.Schema({
  endpoint: { type: String, required: true, unique: true },
  keys: {
    p256dh: { type: String, required: true },
    auth: { type: String, required: true }
  },
  usuarioId: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario' },
  criadoEm: { type: Date, default: Date.now }
})

export default mongoose.models.PushSubscription || mongoose.model('PushSubscription', pushSubscriptionSchema)
