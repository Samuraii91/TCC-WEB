import fs from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import webpush from 'web-push'

const __dirname = dirname(fileURLToPath(import.meta.url))
const arquivoChaves = join(__dirname, '..', '.vapid.json')

const assunto = process.env.VAPID_SUBJECT || 'mailto:contato@novobelem.com.br'

let chavePublica = process.env.VAPID_PUBLIC_KEY
let chavePrivada = process.env.VAPID_PRIVATE_KEY

if (!chavePublica || !chavePrivada) {
  try {
    if (fs.existsSync(arquivoChaves)) {
      const dados = JSON.parse(fs.readFileSync(arquivoChaves, 'utf8'))
      chavePublica = chavePublica || dados.publicKey
      chavePrivada = chavePrivada || dados.privateKey
    }
  } catch (erro) {
    console.warn('[push] Não foi possível ler .vapid.json:', erro.message)
  }
}

if (!chavePublica || !chavePrivada) {
  const geradas = webpush.generateVAPIDKeys()
  chavePublica = geradas.publicKey
  chavePrivada = geradas.privateKey

  try {
    fs.writeFileSync(arquivoChaves, JSON.stringify({ publicKey: chavePublica, privateKey: chavePrivada }, null, 2))
    console.warn('[push] Chaves VAPID geradas em .vapid.json. Em produção, defina VAPID_PUBLIC_KEY e VAPID_PRIVATE_KEY.')
  } catch (erro) {
    console.warn('[push] Não foi possível salvar .vapid.json neste ambiente:', erro.message)
  }
}

webpush.setVapidDetails(assunto, chavePublica, chavePrivada)

export const pushAtivo = Boolean(chavePublica && chavePrivada)
export const vapidPublicKey = chavePublica
export { webpush }
export default webpush
