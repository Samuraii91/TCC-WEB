import PushSubscription from '../models/PushSubscription.js'
import { webpush, pushAtivo } from '../config/webpush.js'

export async function enviarNotificacao(payload) {
  if (!pushAtivo) {
    return { enviados: 0, removidos: 0, desativado: true }
  }

  const assinaturas = await PushSubscription.find()
  let enviados = 0
  let removidos = 0

  await Promise.all(assinaturas.map(async (assinatura) => {
    const inscricao = {
      endpoint: assinatura.endpoint,
      keys: {
        p256dh: assinatura.keys.p256dh,
        auth: assinatura.keys.auth
      }
    }

    try {
      await webpush.sendNotification(inscricao, JSON.stringify(payload))
      enviados++
    } catch (erro) {
      if ([401, 403, 404, 410].includes(erro.statusCode)) {
        await PushSubscription.deleteOne({ _id: assinatura._id })
        removidos++
      } else {
        console.error('[push] Falha ao enviar notificação:', erro.statusCode || erro.message)
      }
    }
  }))

  return { enviados, removidos }
}

export async function notificarEstoqueBaixo(produto, limite = 5) {
  if (!produto || Number(produto.quantidade) > limite) return

  const quantidade = Number(produto.quantidade) || 0
  const situacao = quantidade === 0 ? 'está em falta' : `está com apenas ${quantidade} unidade(s)`

  await enviarNotificacao({
    title: 'Estoque baixo',
    body: `${produto.nome} ${situacao}.`,
    icon: '/img/logo.png',
    badge: '/img/logo.png',
    url: '/produto/lst',
    tag: `estoque-${produto._id}`
  })
}
