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

  function chaveDaAssinatura(assinatura) {
    var chave = assinatura && assinatura.options && assinatura.options.applicationServerKey

    if (!chave) return null

    var bytes = new Uint8Array(chave)
    var binario = ''

    for (var i = 0; i < bytes.length; i++) {
      binario += String.fromCharCode(bytes[i])
    }

    return window.btoa(binario).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
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

  async function obterChaveServidor() {
    var resposta = await fetch('/push/chave-publica')

    if (!resposta.ok) {
      throw new Error('Não foi possível obter a chave pública.')
    }

    var dados = await resposta.json()
    return dados.publicKey
  }

  async function salvarAssinatura(assinatura) {
    var resposta = await fetch('/push/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(assinatura)
    })

    if (!resposta.ok) {
      throw new Error('Não foi possível salvar a assinatura.')
    }
  }

  async function assinar() {
    var chavePublica = await obterChaveServidor()
    var registroSw = await obterRegistro()

    var assinatura = await registroSw.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: base64ParaUint8Array(chavePublica)
    })

    await salvarAssinatura(assinatura)

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

  async function sincronizar() {
    var registroSw = await obterRegistro()
    var assinatura = await registroSw.pushManager.getSubscription()

    if (!assinatura) {
      assinaturaAtual = null
      atualizarInterface(null)
      return
    }

    var chaveServidor = null

    try {
      chaveServidor = await obterChaveServidor()
    } catch (erro) {
      console.warn('Não foi possível consultar a chave pública do push:', erro)
    }

    var chaveAssinatura = chaveDaAssinatura(assinatura)

    if (chaveServidor && chaveAssinatura && chaveServidor !== chaveAssinatura) {
      var endpointAntigo = assinatura.endpoint

      try {
        await assinatura.unsubscribe()

        assinatura = await registroSw.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: base64ParaUint8Array(chaveServidor)
        })

        await salvarAssinatura(assinatura)

        if (endpointAntigo !== assinatura.endpoint) {
          fetch('/push/unsubscribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ endpoint: endpointAntigo })
          }).catch(function () {})
        }

        avisar('Notificações renovadas. Tudo certo!')
      } catch (erro) {
        console.error('Erro ao renovar a assinatura push:', erro)
        assinaturaAtual = null
        atualizarInterface(null)
        avisar('Reative as notificações clicando no botão.')
        return
      }
    } else {
      try {
        var respostaStatus = await fetch('/push/status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: assinatura.endpoint })
        })

        if (respostaStatus.ok) {
          var status = await respostaStatus.json()

          if (status && status.inscrito === false) {
            await salvarAssinatura(assinatura)
            avisar('Assinatura de notificações restaurada.')
          }
        }
      } catch (erro) {
        console.warn('Não foi possível verificar a assinatura no servidor:', erro)
      }
    }

    assinaturaAtual = assinatura
    atualizarInterface(assinatura)
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
        var dados = await resposta.json().catch(function () { return null })

        if (!resposta.ok) {
          throw new Error((dados && dados.erro) || 'Falha no teste.')
        }

        if (!dados || dados.enviados === 0) {
          avisar('Nenhuma assinatura ativa. Reative as notificações.')
        } else {
          avisar('Notificação de teste enviada.')
        }
      } catch (erro) {
        console.error('Erro no teste de push:', erro)
        avisar('Não foi possível enviar a notificação de teste.')
      } finally {
        botaoTeste.disabled = false
      }
    })
  }

  sincronizar().catch(function (erro) {
    console.error('Serviço de push indisponível:', erro)
  })
})()
