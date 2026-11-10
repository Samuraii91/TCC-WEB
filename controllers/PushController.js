import PushSubscription from '../models/PushSubscription.js'
import { vapidPublicKey, pushAtivo } from '../config/webpush.js'
import { enviarNotificacao } from '../services/pushService.js'

export default class PushController {
  async chavePublica(req, res) {
    if (!pushAtivo) {
      return res.status(503).json({ erro: 'Notificações push não estão configuradas.' })
    }

    res.json({ publicKey: vapidPublicKey })
  }

  async subscribe(req, res) {
    try {
      const assinatura = req.body

      if (
        !assinatura ||
        !assinatura.endpoint ||
        !assinatura.keys ||
        !assinatura.keys.p256dh ||
        !assinatura.keys.auth
      ) {
        return res.status(400).json({ ok: false, erro: 'Assinatura inválida.' })
      }

      await PushSubscription.findOneAndUpdate(
        { endpoint: assinatura.endpoint },
        {
          endpoint: assinatura.endpoint,
          keys: {
            p256dh: assinatura.keys.p256dh,
            auth: assinatura.keys.auth
          },
          usuarioId: req.session.usuario ? req.session.usuario.id : undefined
        },
        { upsert: true, new: true, runValidators: true }
      )

      res.status(201).json({ ok: true })
    } catch (erro) {
      console.error('Erro ao salvar assinatura push:', erro)
      res.status(500).json({ ok: false, erro: 'Erro ao salvar a assinatura.' })
    }
  }

  async unsubscribe(req, res) {
    try {
      const { endpoint } = req.body || {}
      if (endpoint) {
        await PushSubscription.deleteOne({ endpoint })
      }
      res.json({ ok: true })
    } catch (erro) {
      console.error('Erro ao remover assinatura push:', erro)
      res.status(500).json({ ok: false, erro: 'Erro ao remover a assinatura.' })
    }
  }

  async status(req, res) {
    try {
      const { endpoint } = req.body || {}

      if (!endpoint) {
        return res.status(400).json({ ok: false, erro: 'Endpoint ausente.' })
      }

      const inscrito = Boolean(await PushSubscription.exists({ endpoint }))
      res.json({ ok: true, inscrito })
    } catch (erro) {
      console.error('Erro ao consultar assinatura push:', erro)
      res.status(500).json({ ok: false, erro: 'Erro ao consultar a assinatura.' })
    }
  }

  async testar(req, res) {
    try {
      const resultado = await enviarNotificacao({
        title: 'Novo Belém',
        body: 'Notificações ativadas com sucesso!',
        icon: '/img/logo.png',
        badge: '/img/logo.png',
        url: '/dashboard',
        tag: 'teste-push'
      })

      res.json({ ok: true, ...resultado })
    } catch (erro) {
      console.error('Erro ao enviar notificação de teste:', erro)
      res.status(500).json({ ok: false, erro: 'Erro ao enviar a notificação de teste.' })
    }
  }
}
