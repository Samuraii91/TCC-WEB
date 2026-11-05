self.addEventListener('push', function (event) {
  let dados = {}

  try {
    dados = event.data ? event.data.json() : {}
  } catch (erro) {
    dados = { body: event.data ? event.data.text() : '' }
  }

  const titulo = dados.title || 'Novo Belém'
  const opcoes = {
    body: dados.body || '',
    icon: dados.icon || '/img/logo.png',
    badge: dados.badge || '/img/logo.png',
    tag: dados.tag || 'novo-belem',
    data: { url: dados.url || '/dashboard' },
    vibrate: [100, 50, 100]
  }

  event.waitUntil(self.registration.showNotification(titulo, opcoes))
})

self.addEventListener('notificationclick', function (event) {
  event.notification.close()

  const url = (event.notification.data && event.notification.data.url) || '/dashboard'

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientes) {
      for (const cliente of clientes) {
        if ('focus' in cliente) {
          if ('navigate' in cliente) {
            cliente.navigate(url)
          }
          return cliente.focus()
        }
      }

      if (self.clients.openWindow) {
        return self.clients.openWindow(url)
      }
    })
  )
})
