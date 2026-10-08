import { getState, resetState, setState, subscribe } from '../store/state.js'
import * as dataService from '../services/dataService.js'
import * as marketplaceService from '../services/marketplaceService.js'
import { renderModal } from '../components/ModalGeneral.js'
import { renderDashboard } from '../views/Dashboard.js'
import { renderClients, renderClientCards, filterProviders, sortProviders } from '../views/Clientes.js'
import { renderServices } from '../views/Servicios.js'
import { renderSettings } from '../views/Ajustes.js'
import { renderAdminPrincipal } from '../views/AdminPrincipal.js'
import { renderRequestCards, renderRequests } from '../views/Solicitudes.js'
import { canManageWorkshop, escapeHtml, icons } from '../utils/ui.js'
import { renderRequestCategoryFields, renderRequestModal, requestFromForm } from '../components/ModalSolicitud.js'
import { getSessionContext, requestPasswordReset, signIn, signOut, signUp, updatePassword } from '../services/authService.js'
import { supabase } from '../lib/supabase.js'

const routes = {
  dashboard: { title: 'Resumen', render: renderDashboard },
  requests: { title: 'Solicitudes', render: renderRequests },
  customers: { title: 'Proveedores', render: renderClients },
  services: { title: 'Servicios', render: renderServices },
  settings: { title: 'Ajustes', render: renderSettings },
  admin: { title: 'Admin principal', render: renderAdminPrincipal },
}

const roleName = (role) => ({ administrator: 'Administrador principal', owner: 'Proveedor', admin: 'Administrador', advisor: 'Colaborador', guest: 'Visitante' })[role] || 'Usuario'

function routeFromHash() {
  const route = window.location.hash.replace(/^#\/?/, '').split('/')[0]
  return routes[route] ? route : 'customers'
}

function navItem(view, icon, label, count, active) {
  return `<button class="nav-item ${active === view ? 'active' : ''}" data-view="${view}">${icon}<span>${label}</span>${count ? `<em>${count}</em>` : ''}</button>`
}

function renderShell(state, route, viewMarkup, modalMarkup, toast, accountMenuOpen, sidebarOpen = false, theme = 'light') {
  const profile = state.profile
  const displayName = profile.name || (state.role === 'administrator' ? 'Administrador principal' : 'Usuario del marketplace')
  const initials = profile.initials || displayName.trim().split(/\s+/).map((part) => part[0]).slice(0, 2).join('').toUpperCase()
  const allowSettings = canManageWorkshop(state.role)
  const nav = `${navItem('dashboard', icons.grid, 'Resumen', 0, route)}${navItem('requests', icons.file, 'Solicitudes', state.quoteRequests.length, route)}${navItem('customers', icons.users, 'Proveedores', 0, route)}${navItem('services', icons.box, 'Servicios', 0, route)}${allowSettings ? `<p class="nav-caption nav-caption-spaced">CONFIGURACIÓN</p>${navItem('settings', icons.gear, 'Ajustes', 0, route)}` : ''}${state.role === 'administrator' ? `<p class="nav-caption nav-caption-spaced">PLATAFORMA</p>${navItem('admin', icons.gear, 'Admin principal', 0, route)}` : ''}`
  return `<div class="app-shell"><div class="sidebar-backdrop ${sidebarOpen ? 'visible' : ''}" data-action="toggle-sidebar"></div><aside class="sidebar ${sidebarOpen ? 'open' : ''}" id="sidebar"><div class="brand"><span class="brand-logo-frame"><img src="/IMAGENES.png" alt="Pacotizar" /></span><span class="brand-word">PAC<span>OTIZAR</span></span></div><div class="workspace-switcher"><span class="avatar avatar-small">${escapeHtml(initials)}</span><span><b>${escapeHtml(profile.workshop || 'Mi negocio')}</b><small>Marketplace activo</small></span><span class="chevron">⌄</span></div><nav class="main-nav" aria-label="Navegación principal"><p class="nav-caption">OPERACIÓN</p>${nav}</nav><div class="sidebar-bottom"><div class="help-card"><span class="help-icon">?</span><div><b>¿Necesitas ayuda?</b><small>Habla con soporte</small></div><span class="help-arrow">${icons.arrow}</span></div><div class="user-line"><span class="avatar">${escapeHtml(initials)}</span><span><b>${escapeHtml(displayName)}</b><small>${escapeHtml(roleName(state.role))}</small></span>${state.user ? `<button class="icon-btn account-menu-trigger" data-action="account-menu" aria-expanded="${accountMenuOpen}" aria-label="Opciones de la cuenta">•••</button>` : ''}</div>${accountMenuOpen && state.user ? `<div class="account-menu" role="menu"><div class="account-menu-heading"><b>${escapeHtml(displayName)}</b><small>${escapeHtml(roleName(state.role))}</small></div><button type="button" role="menuitem" data-action="sign-out">Cerrar sesión</button></div>` : ''}</div></aside><main class="main-content"><header class="topbar"><button class="mobile-menu icon-btn" data-action="toggle-sidebar" aria-label="Abrir menú">${icons.menu}</button><div class="breadcrumb"><span>Workspace</span><i>/</i><b>${routes[route].title}</b></div><div class="top-actions"><button class="icon-btn theme-toggle" type="button" data-action="toggle-theme" aria-label="Activar modo ${theme === 'dark' ? 'claro' : 'oscuro'}" title="Cambiar a modo ${theme === 'dark' ? 'claro' : 'oscuro'}">${theme === 'dark' ? '☀' : '☾'}</button><button class="icon-btn notification-btn" data-action="notifications" aria-label="Notificaciones">${icons.bell}<span></span></button><div class="top-avatar avatar">${escapeHtml(initials)}</div></div></header><div class="page-content">${viewMarkup}</div></main></div>${modalMarkup}<div class="toast-region" aria-live="polite">${toast ? `<div class="toast toast-${escapeHtml(toast.tone)}">${toast.tone === 'error' ? icons.alert : icons.check}<span>${escapeHtml(toast.message)}</span></div>` : ''}</div>`
}

export function createRouter(root = document.querySelector('#app')) {
  if (!root) throw new Error('No se encontró el contenedor #app')
  let modal = null
  let toast = null
  let toastTimer
  let renderVersion = 0
  let isStarted = false
  let marketplaceLoaded = false
  let marketplaceError = ''
  let requestOffers = []
  let requestOfferError = ''
  let requestScope = 'market'
  let accountMenuOpen = false
  let sidebarOpen = false
  let sessionLoaded = false
  let pendingPasswordRecovery = false
  let theme = localStorage.getItem('pacotizar-theme') || (window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
  document.documentElement.dataset.theme = theme
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#101B26' : '#F7F4EA')

  function notify(message, tone = 'info') {
    clearTimeout(toastTimer)
    toast = { message, tone }
    render()
    toastTimer = setTimeout(() => {
      toast = null
      render()
    }, 3500)
  }

  async function render() {
    const version = ++renderVersion
    let state = getState()

    if (supabase && !sessionLoaded) {
      const { user, isAdmin, error } = await getSessionContext()
      sessionLoaded = true
      if (user) {
        setState((current) => ({
          user: user.id,
          role: isAdmin ? 'administrator' : current.role === 'administrator' ? 'owner' : current.role,
          profile: {
            ...current.profile,
            name: user.user_metadata?.full_name || current.profile.name,
            initials: (user.user_metadata?.full_name || current.profile.name || 'Usuario').trim().split(/\s+/).map((part) => part[0]).slice(0, 2).join('').toUpperCase(),
          },
        }))
      } else {
        setState(() => ({
          user: null,
          role: 'guest',
          myQuoteRequests: [],
          profile: { name: 'Usuario', workshop: 'Mi negocio', city: '', phone: '', initials: 'US' },
        }))
        if (error) modal = { type: 'auth', mode: 'login', error }
        else if (!modal) modal = { type: 'auth', mode: 'login' }
      }
      if (version !== renderVersion) return
      state = getState()
    }
    if (pendingPasswordRecovery) {
      modal = { type: 'auth', mode: 'update-password' }
      pendingPasswordRecovery = false
    }

    let route = routeFromHash()
    if (route === 'admin' && state.role !== 'administrator') {
      window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}#/customers`)
      route = 'customers'
      if (isStarted) {
        toast = { message: 'Acceso reservado al administrador principal', tone: 'error' }
        clearTimeout(toastTimer)
        toastTimer = setTimeout(() => { toast = null; render() }, 3500)
      }
    }
    if (route === 'settings' && !canManageWorkshop(state.role)) {
      window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}#/customers`)
      route = 'customers'
      if (isStarted) toast = { message: 'Tu rol no puede acceder a Ajustes', tone: 'error' }
    }

    if (!marketplaceLoaded) {
      const [requestsResult, businessesResult, myRequestsResult] = await Promise.allSettled([
        marketplaceService.getQuoteRequests(),
        marketplaceService.getFeaturedBusinesses(),
        marketplaceService.getMyQuoteRequests(),
      ])
      if (version !== renderVersion) return
      marketplaceLoaded = true
      const errors = []
      const marketplaceData = {}
      if (requestsResult.status === 'fulfilled') marketplaceData.quoteRequests = requestsResult.value
      else errors.push(requestsResult.reason.message || 'No se pudieron cargar las solicitudes.')
      if (businessesResult.status === 'fulfilled') marketplaceData.featuredBusinesses = businessesResult.value
      else errors.push(businessesResult.reason.message || 'No se pudieron cargar los proveedores.')
      if (myRequestsResult.status === 'fulfilled') marketplaceData.myQuoteRequests = myRequestsResult.value
      else errors.push(myRequestsResult.reason.message || 'No se pudieron cargar tus solicitudes.')
      marketplaceError = errors.join(' ')
      if (Object.keys(marketplaceData).length) setState(marketplaceData)
      if (version !== renderVersion) return
    }

    let adminBusinesses = []
    let adminError = ''
    if (route === 'admin') {
      try {
        adminBusinesses = await marketplaceService.getBusinessesForAdmin()
      } catch (error) {
        adminError = error.message || 'No se pudieron cargar los negocios.'
      }
    }

    const [clients, services] = await Promise.all([dataService.getClients(), dataService.getServices()])
    if (version !== renderVersion) return
    const currentState = getState()
    const providerList = route === 'customers' && currentState.featuredBusinesses.length ? currentState.featuredBusinesses : clients
    const viewMarkup = routes[route].render({
      state: currentState,
      role: currentState.role,
      clients: providerList,
      services,
      businesses: adminBusinesses,
      marketplaceError,
      adminError,
      requestScope,
      canManage: canManageWorkshop(currentState.role),
    })
    root.innerHTML = renderShell(currentState, route, viewMarkup, renderModal(modal, {
      state: currentState,
      services,
      canManage: canManageWorkshop(currentState.role),
      requestOffers,
      requestOfferError,
    }), toast, accountMenuOpen, sidebarOpen, theme)
  }

  async function handleAction(action, element) {
    const state = getState()
    if (action === 'toggle-theme') {
      theme = theme === 'dark' ? 'light' : 'dark'
      localStorage.setItem('pacotizar-theme', theme)
      document.documentElement.dataset.theme = theme
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#101B26' : '#F7F4EA')
    }
    else if (action === 'account-menu') accountMenuOpen = !accountMenuOpen
    else if (action === 'toggle-sidebar') sidebarOpen = !sidebarOpen
    else if (action === 'sign-out') {
      try {
        await signOut()
      } catch (error) {
        notify(error.message || 'No se pudo cerrar la sesión.', 'error')
        return
      }
    } else if (action === 'new-request') {
      const businessName = element.dataset.businessName || ''
      const businessCity = element.dataset.businessCity || ''
      const businessCategory = element.dataset.businessCategory || element.dataset.exampleCategory || ''
      const businessDescription = element.dataset.businessDescription || ''
      modal = {
        type: 'request',
        prefill: {
          title: businessName ? `Solicitud para ${businessName}` : '',
          description: businessDescription ? `Necesito información sobre ${businessName || 'este proveedor'} en ${businessCity || 'mi ciudad'}.\n\n${businessDescription}` : '',
          location: businessCity || '',
          category: businessCategory || '',
        },
      }
    }
    else if (action === 'view-customers') window.location.hash = '/customers'
    else if (action === 'new-customer' && canManageWorkshop(state.role)) modal = { type: 'customer' }
    else if (action === 'new-service' && canManageWorkshop(state.role)) modal = { type: 'service' }
    else if (action === 'business-detail') modal = { type: 'business', id: element.dataset.id }
    else if (action === 'request-detail') {
      modal = { type: 'request-detail', id: element.dataset.id }
      requestOffers = []
      requestOfferError = ''
      try {
        requestOffers = await marketplaceService.getRequestOffers(element.dataset.id)
      } catch (error) {
        requestOfferError = error.message || 'No se pudieron cargar las propuestas.'
      }
    }
    else if (action === 'request-scope') {
      requestScope = element.dataset.scope === 'mine' ? 'mine' : 'market'
    }
    else if (action === 'set-request-status') {
      try {
        await marketplaceService.setQuoteRequestStatus(element.dataset.id, element.dataset.status)
        const [quoteRequests, myQuoteRequests] = await Promise.all([
          marketplaceService.getQuoteRequests(),
          marketplaceService.getMyQuoteRequests(),
        ])
        setState({ quoteRequests, myQuoteRequests })
        notify(element.dataset.status === 'closed' ? 'Solicitud cerrada' : 'Solicitud reabierta', 'success')
        if (modal?.type === 'request-detail') requestOffers = await marketplaceService.getRequestOffers(modal.id)
      } catch (error) {
        notify(error.message || 'No se pudo actualizar la solicitud.', 'error')
      }
    }
    else if (action === 'respond-request-offer') {
      try {
        await marketplaceService.respondToRequestOffer(element.dataset.id, element.dataset.status)
        const request = modal?.type === 'request-detail' ? modal.id : ''
        if (request) requestOffers = await marketplaceService.getRequestOffers(request)
        const [quoteRequests, myQuoteRequests] = await Promise.all([
          marketplaceService.getQuoteRequests(),
          marketplaceService.getMyQuoteRequests(),
        ])
        setState({ quoteRequests, myQuoteRequests })
        notify(element.dataset.status === 'accepted' ? 'Propuesta aceptada; la solicitud se cerró' : 'Propuesta rechazada', 'success')
      } catch (error) {
        notify(error.message || 'No se pudo responder a la propuesta.', 'error')
      }
    }
    else if (action === 'save-featured') {
      const card = element.closest('.admin-business')
      if (!card || state.role !== 'administrator') {
        notify('Solo el administrador principal puede guardar destacados.', 'error')
        return
      }
      try {
        await marketplaceService.saveFeaturedBusiness(card.dataset.workshopId, {
          is_active: card.querySelector('[data-featured-active]').checked,
          category: card.querySelector('[data-featured-category]').value,
          description: card.querySelector('[data-featured-description]').value,
          sort_order: Number(card.querySelector('[data-featured-order]').value),
        })
        notify('Negocio destacado actualizado', 'success')
      } catch (error) {
        notify(error.message || 'No se pudo guardar el negocio destacado.', 'error')
        return
      }
    }
    else if (action === 'retry-marketplace') {
      marketplaceLoaded = false
      marketplaceError = ''
    } else if (action === 'retry-admin') {
      await render()
      return
    }
    else if (action === 'feed-dialog') modal = { type: 'feed' }
    else if (action === 'auth-mode') modal = { type: 'auth', mode: element.dataset.mode || 'login' }
    else if (action === 'close-modal' || action === 'backdrop-close') modal = null
    else if (action === 'ad-settings' && canManageWorkshop(state.role)) notify('La configuración de anuncios se conectará con Supabase', 'info')
    else if (action === 'connect-gmail' && state.role === 'administrator') notify('Gmail se conectará mediante OAuth de Google en Supabase', 'info')
    else if (action === 'admin-guide' && state.role === 'administrator') notify('Ejecuta supabase/schema.sql y crea el primer usuario administrador', 'info')
    else if (action === 'delete-customer' && canManageWorkshop(state.role)) {
      await dataService.deleteClient(element.dataset.id || element.dataset.name)
      notify('Cliente eliminado', 'success')
    } else if (action === 'save-settings' && canManageWorkshop(state.role)) {
      await dataService.updateWorkshopProfile({
        workshop: root.querySelector('#setting-workshop')?.value || state.profile.workshop,
        city: root.querySelector('#setting-city')?.value || state.profile.city,
        phone: root.querySelector('#setting-phone')?.value || state.profile.phone,
      })
      notify('Cambios guardados correctamente', 'success')
    } else if (action === 'reset' && canManageWorkshop(state.role)) {
      modal = null
      resetState()
      notify('Demo restablecida', 'success')
    } else if (action === 'toggle-sidebar') {
      sidebarOpen = !sidebarOpen
    } else if (action === 'notifications') notify('No tienes notificaciones nuevas', 'info')
    else return
    await render()
  }

  function handleInput(event) {
    if (event.target.id === 'customer-search' || event.target.id === 'customer-category' || event.target.id === 'customer-sort') {
      const query = root.querySelector('#customer-search')?.value || ''
      const category = root.querySelector('#customer-category')?.value || ''
      const sort = root.querySelector('#customer-sort')?.value || 'relevance'
      const baseProviders = getState().featuredBusinesses.length ? getState().featuredBusinesses : getState().customers
      const providers = sortProviders(filterProviders(baseProviders, query, category), sort)
      root.querySelector('.customer-grid').innerHTML = renderClientCards(providers, canManageWorkshop(getState().role))
    }
    if (event.target.id === 'request-search' || event.target.id === 'request-category') filterRequests()
  }

  function filterRequests() {
    const search = root.querySelector('#request-search')?.value.trim().toLocaleLowerCase() || ''
    const category = root.querySelector('#request-category')?.value || ''
    const sourceRequests = requestScope === 'mine' ? getState().myQuoteRequests : getState().quoteRequests
    const requests = sourceRequests.filter((request) => {
      const haystack = [request.title, request.description, request.location, request.category, ...(request.tags || [])].join(' ').toLocaleLowerCase()
      return haystack.includes(search) && (!category || request.category === category)
    })
    const results = root.querySelector('#request-results')
    if (results) results.innerHTML = renderRequestCards(requests)
    const count = root.querySelector('#request-count')
    if (count) count.textContent = `${requests.length} ${requests.length === 1 ? 'solicitud' : 'solicitudes'}`
  }

  function handleChange(event) {
    if (event.target.matches('[name="category"][data-category-select]')) {
      const fields = root.querySelector('[data-category-fields]')
      if (fields) fields.innerHTML = renderRequestCategoryFields(event.target.value)
      return
    }
    if (event.target.id === 'request-category') {
      filterRequests()
      return
    }
    if (event.target.id === 'customer-sort' || event.target.id === 'customer-category') {
      const query = root.querySelector('#customer-search')?.value || ''
      const category = root.querySelector('#customer-category')?.value || ''
      const sort = root.querySelector('#customer-sort')?.value || 'relevance'
      const baseProviders = getState().featuredBusinesses.length ? getState().featuredBusinesses : getState().customers
      const providers = sortProviders(filterProviders(baseProviders, query, category), sort)
      root.querySelector('.customer-grid').innerHTML = renderClientCards(providers, canManageWorkshop(getState().role))
      return
    }
  }

  function handleSubmit(event) {
    if (event.target.id === 'auth-form') {
      event.preventDefault()
      const form = event.target
      const mode = form.dataset.mode || 'login'
      const data = new FormData(form)
      const email = String(data.get('email') || '').trim()
      const rawPassword = String(data.get('password') || '')
      const password = mode === 'update-password' ? rawPassword : rawPassword.trim()
      const name = String(data.get('name') || '').trim()

      const runAuth = async () => {
        try {
          if (mode === 'forgot-password') {
            await requestPasswordReset(email)
            modal = {
              type: 'auth',
              mode,
              notice: 'Si el correo está registrado, recibirás un enlace para restablecer tu contraseña.',
            }
            await render()
            return
          }
          if (mode === 'update-password') {
            const confirmPassword = String(data.get('confirm-password') || '')
            if (password !== confirmPassword) {
              modal = { type: 'auth', mode, error: 'Las contraseñas no coinciden.' }
              await render()
              return
            }
            await updatePassword(password)
            modal = null
            notify('Tu contraseña se actualizó correctamente', 'success')
            await render()
            return
          }
          const result = mode === 'signup'
            ? await signUp({ name, email, password })
            : await signIn(email, password)
          const { isAdmin } = await getSessionContext()
          const user = result?.user || result?.session?.user || null
          if (user) {
            setState((current) => ({
              user: user.id || current.user,
              role: isAdmin ? 'administrator' : current.role === 'administrator' ? 'owner' : current.role,
              profile: {
                ...current.profile,
                name: user.user_metadata?.full_name || current.profile.name || name || 'Usuario',
                initials: (user.user_metadata?.full_name || current.profile.name || name || 'Usuario').trim().split(/\s+/).map((part) => part[0]).slice(0, 2).join('').toUpperCase(),
              },
            }))
            modal = null
            notify(mode === 'signup' ? 'Cuenta creada. Revisa tu correo para confirmar tu sesión.' : 'Sesión iniciada correctamente', 'success')
            await render()
            return
          }
          modal = { type: 'auth', mode, error: 'No pudimos iniciar la sesión. Intenta nuevamente.' }
          notify('No pudimos completar la autenticación', 'error')
          await render()
        } catch (error) {
          modal = { type: 'auth', mode, error: error.message || 'No se pudo completar la autenticación.' }
          notify(error.message || 'No se pudo completar la autenticación.', 'error')
          await render()
        }
      }

      void runAuth()
      return
    }
    if (event.target.id === 'request-form') {
      event.preventDefault()
      const payload = requestFromForm(event.target)
      void marketplaceService.createQuoteRequest(payload).then((request) => {
        setState((state) => ({
          quoteRequests: request.status === 'open' ? [request, ...state.quoteRequests.filter((item) => String(item.id) !== String(request.id))] : state.quoteRequests,
          myQuoteRequests: [request, ...state.myQuoteRequests.filter((item) => String(item.id) !== String(request.id))],
        }))
        modal = null
        requestScope = 'mine'
        notify('Solicitud publicada correctamente', 'success')
        render()
      }).catch((error) => notify(error.message || 'No se pudo publicar la solicitud', 'error'))
    }
    if (event.target.id === 'request-offer-form') {
      event.preventDefault()
      const form = event.target
      const data = new FormData(form)
      void (async () => {
        try {
          await marketplaceService.createRequestOffer({
            requestId: form.dataset.requestId,
            amount: data.get('amount'),
            message: data.get('message'),
          })
          requestOffers = await marketplaceService.getRequestOffers(form.dataset.requestId)
          const [quoteRequests, myQuoteRequests] = await Promise.all([
            marketplaceService.getQuoteRequests(),
            marketplaceService.getMyQuoteRequests(),
          ])
          setState({ quoteRequests, myQuoteRequests })
          requestOfferError = ''
          notify('Propuesta enviada correctamente', 'success')
          await render()
        } catch (error) {
          requestOfferError = error.message || 'No se pudo enviar la propuesta.'
          notify(requestOfferError, 'error')
          await render()
        }
      })()
    }
    if (event.target.id === 'customer-form') {
      event.preventDefault()
      const data = new FormData(event.target)
      void dataService.createClient({ name: data.get('name'), phone: data.get('phone') || 'Sin teléfono', visits: 0, value: 0 }).then(() => {
        modal = null
        notify('Proveedor agregado correctamente', 'success')
        render()
      })
    }
    if (event.target.id === 'service-form') {
      event.preventDefault()
      const data = new FormData(event.target)
      void dataService.createService({ name: data.get('name'), category: data.get('category') || 'General', price: Number(data.get('price')) || 0, used: 0 }).then(() => {
        modal = null
        notify('Servicio agregado al catálogo', 'success')
        render()
      })
    }
  }

  function handleClick(event) {
    const viewButton = event.target.closest('[data-view]')
    if (viewButton) {
      event.preventDefault()
      const requestedRoute = viewButton.dataset.view
      if (routes[requestedRoute]) {
        sidebarOpen = false
        window.location.hash = `/${requestedRoute}`
      }
      return
    }
    const actionButton = event.target.closest('[data-action]')
    if (actionButton) {
      if (actionButton.dataset.action === 'backdrop-close' && event.target !== actionButton) return
      void handleAction(actionButton.dataset.action, actionButton)
    }
  }

  function start() {
    if (isStarted) return
    isStarted = true
    if (supabase) {
      supabase.auth.onAuthStateChange((event) => {
        if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'USER_UPDATED') {
          setTimeout(() => {
            marketplaceLoaded = false
            sessionLoaded = false
            accountMenuOpen = false
            if (event === 'SIGNED_OUT') {
              modal = { type: 'auth', mode: 'login' }
              requestScope = 'market'
              requestOffers = []
              requestOfferError = ''
              setState({
                user: null,
                role: 'guest',
                myQuoteRequests: [],
                profile: { name: 'Usuario', workshop: 'Mi negocio', city: '', phone: '', initials: 'US' },
              })
            }
            void render()
          }, 0)
        }
        if (event !== 'PASSWORD_RECOVERY') return
        pendingPasswordRecovery = true
        if (sessionLoaded) {
          modal = { type: 'auth', mode: 'update-password' }
          pendingPasswordRecovery = false
          void render()
        }
      })
    }
    if (!window.location.hash) window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}#/customers`)
    window.addEventListener('hashchange', render)
    root.addEventListener('click', handleClick)
    root.addEventListener('input', handleInput)
    root.addEventListener('change', handleChange)
    root.addEventListener('submit', handleSubmit)
    subscribe(render)
    void render()
  }

  return { start, navigate: (route) => { if (routes[route]) window.location.hash = `/${route}` } }
}
