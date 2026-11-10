import fs from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import webpush from 'web-push'
import VapidKey from '../models/VapidKey.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const arquivoChaves = join(__dirname, '..', '.vapid.json')

const assunto = process.env.VAPID_SUBJECT || 'mailto:contato@novobelem.com.br'

const chavePublicaEnv = process.env.VAPID_PUBLIC_KEY
const chavePrivadaEnv = process.env.VAPID_PRIVATE_KEY

async function lerChavesDoBanco() {
  try {
    const dados = await VapidKey.findOne({ _id: 'vapid' }).lean()

    if (dados && dados.publicKey && dados.privateKey) {
      return { publicKey: dados.publicKey, privateKey: dados.privateKey }
    }
  } catch (erro) {
    console.warn('[push] NÃ£o foi possÃ­vel ler as chaves VAPID do banco:', erro.message)
  }

  return null
}

function lerChavesLocais() {
  try {
    if (!fs.existsSync(arquivoChaves)) return null

    const dados = JSON.parse(fs.readFileSync(arquivoChaves, 'utf8'))

    if (dados && dados.publicKey && dados.privateKey) {
      return { publicKey: dados.publicKey, privateKey: dados.privateKey }
    }
  } catch (erro) {
    console.warn('[push] NÃ£o foi possÃ­vel ler .vapid.json:', erro.message)
  }

  return null
}

async function salvarChavesNoBanco(publicKey, privateKey) {
  try {
    await VapidKey.updateOne(
      { _id: 'vapid' },
      { $set: { publicKey, privateKey } },
      { upsert: true, runValidators: true }
    )
  } catch (erro) {
    console.warn('[push] NÃ£o foi possÃ­vel salvar as chaves VAPID no banco:', erro.message)
  }
}

async function criarChavesNoBanco(publicKey, privateKey) {
  try {
    const dados = await VapidKey.findOneAndUpdate(
      { _id: 'vapid' },
      { $setOnInsert: { publicKey, privateKey } },
      { upsert: true, new: true, runValidators: true }
    )

    if (dados && dados.publicKey && dados.privateKey) {
      return { publicKey: dados.publicKey, privateKey: dados.privateKey }
    }
  } catch (erro) {
    if (erro && erro.code === 11000) {
      const existentes = await lerChavesDoBanco()
      if (existentes) return existentes
    }

    console.warn('[push] NÃ£o foi possÃ­vel persistir as chaves VAPID:', erro.message)
  }

  return { publicKey, privateKey }
}

let chaves = null

if (chavePublicaEnv && chavePrivadaEnv) {
  chaves = { publicKey: chavePublicaEnv, privateKey: chavePrivadaEnv }
  await salvarChavesNoBanco(chaves.publicKey, chaves.privateKey)
} else {
  if ((chavePublicaEnv && !chavePrivadaEnv) || (!chavePublicaEnv && chavePrivadaEnv)) {
    console.warn('[push] VAPID_PUBLIC_KEY e VAPID_PRIVATE_KEY devem ser definidas juntas. Ignorando valor parcial.')
  }

  chaves = await lerChavesDoBanco()

  if (!chaves) {
    const locais = lerChavesLocais()

    if (locais) {
      chaves = await criarChavesNoBanco(locais.publicKey, locais.privateKey)
      console.log('[push] Chaves VAPID locais persistidas no banco.')
    } else {
      const geradas = webpush.generateVAPIDKeys()
      chaves = await criarChavesNoBanco(geradas.publicKey, geradas.privateKey)
      console.warn('[push] Chaves VAPID geradas e persistidas no banco. Elas sobrevivem a novos deploys.')
    }
  }
}

webpush.setVapidDetails(assunto, chaves.publicKey, chaves.privateKey)

export const pushAtivo = Boolean(chaves.publicKey && chaves.privateKey)
export const vapidPublicKey = chaves.publicKey
export { webpush }
export default webpush
