import webpush from 'web-push'

const chaves = webpush.generateVAPIDKeys()

console.log('Copie estas variáveis para o ambiente de produção:')
console.log('VAPID_PUBLIC_KEY=' + chaves.publicKey)
console.log('VAPID_PRIVATE_KEY=' + chaves.privateKey)
