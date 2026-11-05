(function () {
  var botao = document.getElementById('btnPush')
  var botaoTeste = document.getElementById('btnPushTeste')
  var suportado = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window

  if (!botao) return

  if (!suportado) {
    botao.disabled = true
    botao.textContent = 'Push indisponível'
    botao.title = 'Este navegador não suporta notificações push.'
    return
  }

  var registro = null
  var assinaturaAtual = null

  function base64ParaUint8Array(base64) {
    var padding = '='.repeat((4 - (base64.length % 4)) % 4)
    var texto = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/')
    var bruto = window.atob(texto)
    var saida = new Uint8Array(bruto.length)

    for (var i = 0; i < bruto.length; i++) {
      saida[i] = bruto.charCodeAt(i)
    }

    return saida
  }

  function atualizarInterface(assinatura) {
    if (assinatura) {
      botao.textContent = 'Notificações ativas'
      botao.classList.add('ativo')
      botao.title = 'Clique para desativar as notificações push.'
      if (botaoTeste) botaoTeste.hidden = false
    } else {
      botao.textContent = 'Ativar notificações'
      botao.classList.remove('ativo')
      botao.title = 'Clique para receber notificações do painel.'
      if (botaoTeste) botaoTeste.hidden = true
    }
  }

  function avisar(mensagem) {
    var aviso = document.getElementById('pushAviso')
    if (!aviso) {
      aviso = document.createElement('div')
      aviso.id = 'pushAviso'
      aviso.className = 'push-aviso'
      document.body.appendChild(aviso)
    }

    aviso.textContent = mensagem
    aviso.classList.add('visivel')
    clearTimeout(avisar.timer)
    avisar.timer = setTimeout(function () {
      aviso.classList.remove('visivel')
    }, 4000)
  }

  async function obterRegistro() {
    if (registro) return registro
    registro = await navigator.serviceWorker.register('/sw.js')
    return registro
  }

  async function assinar() {
    var resposta = await fetch('/push/chave-publica')
    if (!resposta.ok) {
      throw new Error('Não foi possível obter a chave pública.')
    }

    var dados = await resposta.json()
    var registroSw = await obterRegistro()

    var assinatura = await registroSw.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: base64ParaUint8Array(dados.publicKey)
    })

    var salvar = await fetch('/push/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(assinatura)
    })

    if (!salvar.ok) {
      throw new Error('Não foi possível salvar a assinatura.')
    }

    assinaturaAtual = assinatura
    atualizarInterface(assinatura)
    avisar('Notificações ativadas!')
  }

  async function desassinar(assinatura) {
    await assinatura.unsubscribe()
    await fetch('/push/unsubscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ endpoint: assinatura.endpoint })
    })

    assinaturaAtual = null
    atualizarInterface(null)
    avisar('Notificações desativadas.')
  }

  botao.addEventListener('click', async function () {
    botao.disabled = true

    try {
      if (!assinaturaAtual && Notification.permission === 'default') {
        var permissao = await Notification.requestPermission()

        if (permissao !== 'granted') {
          avisar('Permissão de notificação negada.')
          return
        }
      }

      if (!assinaturaAtual && Notification.permission === 'denied') {
        avisar('Permissão de notificação bloqueada no navegador.')
        return
      }

      var registroSw = await obterRegistro()
      var assinatura = assinaturaAtual || await registroSw.pushManager.getSubscription()

      if (assinatura) {
        await desassinar(assinatura)
      } else {
        await assinar()
      }
    } catch (erro) {
      console.error('Erro no push:', erro)
      avisar('Não foi possível configurar as notificações.')
    } finally {
      botao.disabled = false
    }
  })

  if (botaoTeste) {
    botaoTeste.addEventListener('click', async function () {
      botaoTeste.disabled = true

      try {
        var resposta = await fetch('/push/testar', { method: 'POST' })
        if (!resposta.ok) throw new Error('Falha no teste.')
        avisar('Notificação de teste enviada.')
      } catch (erro) {
        console.error('Erro no teste de push:', erro)
        avisar('Não foi possível enviar a notificação de teste.')
      } finally {
        botaoTeste.disabled = false
      }
    })
  }

  obterRegistro()
    .then(function (registroSw) {
      return registroSw.pushManager.getSubscription()
    })
    .then(function (assinatura) {
      assinaturaAtual = assinatura
      atualizarInterface(assinatura)
    })
    .catch(function (erro) {
      console.error('Serviço de push indisponível:', erro)
    })
})()
