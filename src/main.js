import './style.css'

const STORAGE_KEY = 'cotizarapido-mvp'
const money = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })
const dateFormat = new Intl.DateTimeFormat('es-CO', { day: '2-digit', month: 'short' })

const icons = {
  grid: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>',
  file: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6M8 13h8M8 17h5"/></svg>',
  users: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
  car: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 11 1.5-5h11L19 11M3 11h18v7H3zM7 18v2M17 18v2M6 14h.01M18 14h.01"/></svg>',
  box: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m21 8-9-5-9 5 9 5 9-5ZM3 8v8l9 5 9-5V8M12 13v8"/></svg>',
  gear: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z"/><path d="m19.4 15 .1.1a2 2 0 0 1-2.8 2.8l-.1-.1a2 2 0 0 0-3.4 1.4v.2a2 2 0 0 1-4 0v-.2a2 2 0 0 0-3.4-1.4l-.1.1a2 2 0 0 1-2.8-2.8l.1-.1A2 2 0 0 0 1.7 12a2 2 0 0 1 0-4h.2a2 2 0 0 0 1.4-3.4l-.1-.1A2 2 0 0 1 6 1.7l.1.1A2 2 0 0 0 9.5.4V.2a2 2 0 0 1 4 0v.2a2 2 0 0 0 3.4 1.4l.1-.1a2 2 0 0 1 2.8 2.8l-.1.1A2 2 0 0 0 21.1 8h.2a2 2 0 0 1 0 4h-.2a2 2 0 0 0-1.7 3Z"/></svg>',
  plus: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>',
  arrow: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
  bell: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/></svg>',
  search: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg>',
  check: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 4 4L19 6"/></svg>',
  alert: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 9v4M12 17h.01"/><path d="M10.3 3.8 2.1 18a2 2 0 0 0 1.7 3h16.4a2 2 0 0 0 1.7-3L13.7 3.8a2 2 0 0 0-3.4 0Z"/></svg>',
  menu: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16"/></svg>',
}

const seed = {
  profile: { name: 'Andrés Méndez', workshop: 'Méndez Auto Service', city: 'Bogotá', phone: '+57 310 555 0198', initials: 'AM' },
  quotes: [
    { id: 'CR-1048', customer: 'Laura Gómez', vehicle: 'Renault Duster 2021', amount: 780000, budgetMin: 650000, budgetMax: 850000, budgetNotes: 'Puede ajustar el presupuesto si se prioriza seguridad', status: 'approved', date: 'Hoy, 09:42', items: ['Cambio de aceite', 'Alineación y balanceo'] },
    { id: 'CR-1047', customer: 'Carlos Mendoza', vehicle: 'Mazda 3 2019', amount: 420000, budgetMin: 300000, budgetMax: 450000, budgetNotes: '', status: 'pending', date: 'Ayer, 16:18', items: ['Revisión de frenos'] },
    { id: 'CR-1046', customer: 'Andrés Ruiz', vehicle: 'Chevrolet Onix 2022', amount: 295000, budgetMin: 250000, budgetMax: 320000, budgetNotes: '', status: 'sent', date: 'Ayer, 11:06', items: ['Cambio de batería'] },
    { id: 'CR-1045', customer: 'Diana Castro', vehicle: 'Kia Picanto 2020', amount: 960000, budgetMin: 800000, budgetMax: 1000000, budgetNotes: '', status: 'approved', date: '12 sep, 14:20', items: ['Kit de distribución'] },
    { id: 'CR-1044', customer: 'Felipe Torres', vehicle: 'Toyota Corolla 2018', amount: 180000, budgetMin: 150000, budgetMax: 220000, budgetNotes: '', status: 'rejected', date: '11 sep, 10:03', items: ['Diagnóstico general'] },
  ],
  customers: [
    { name: 'Laura Gómez', phone: '310 440 8821', vehicle: 'Renault Duster 2021', visits: 4, value: 2840000 },
    { name: 'Carlos Mendoza', phone: '315 228 1034', vehicle: 'Mazda 3 2019', visits: 2, value: 840000 },
    { name: 'Andrés Ruiz', phone: '300 771 4409', vehicle: 'Chevrolet Onix 2022', visits: 3, value: 1290000 },
    { name: 'Diana Castro', phone: '317 902 1820', vehicle: 'Kia Picanto 2020', visits: 5, value: 3960000 },
  ],
  services: [
    { name: 'Cambio de aceite', category: 'Mantenimiento', price: 160000, used: 28 },
    { name: 'Alineación y balanceo', category: 'Mantenimiento', price: 120000, used: 19 },
    { name: 'Revisión de frenos', category: 'Diagnóstico', price: 240000, used: 16 },
    { name: 'Cambio de batería', category: 'Repuestos', price: 295000, used: 13 },
  ],
}

let state = loadState()
let activeView = 'dashboard'
let modal = null
let toastTimer

function loadState() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY))
    return stored ? { ...seed, ...stored, profile: { ...seed.profile, ...stored.profile } } : structuredClone(seed)
  } catch { return structuredClone(seed) }
}

function saveState() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)) }
function escapeHtml(value) { return String(value).replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char])) }
function initials(name) { return name.split(' ').map((word) => word[0]).slice(0, 2).join('').toUpperCase() }
function statusLabel(status) { return ({ approved: 'Aprobada', pending: 'Pendiente', sent: 'Enviada', rejected: 'Rechazada', draft: 'Borrador' })[status] || status }
function statusTone(status) { return ({ approved: 'success', pending: 'warning', sent: 'info', rejected: 'danger', draft: 'neutral' })[status] || 'neutral' }
function formatMoney(value) { return money.format(value).replace(' ', ' ') }
function today() { return dateFormat.format(new Date()).replace('.', '') }

function render() {
  document.querySelector('#app').innerHTML = `
    <div class="app-shell">
      <aside class="sidebar" id="sidebar">
        <div class="brand"><span class="brand-logo-frame"><img src="/IMAGENES.png" alt="Pacotizar" /></span><span class="brand-word">PAC<span>OTIZAR</span></span></div>
        <div class="workspace-switcher"><span class="avatar avatar-small">${escapeHtml(state.profile.initials)}</span><span><b>${escapeHtml(state.profile.workshop)}</b><small>Operación activa</small></span><span class="chevron">⌄</span></div>
        <nav class="main-nav" aria-label="Navegación principal">
          <p class="nav-caption">OPERACIÓN</p>
          ${navItem('dashboard', icons.grid, 'Resumen')}
          ${navItem('quotes', icons.file, 'Cotizaciones', state.quotes.length)}
          ${navItem('customers', icons.users, 'Clientes')}
          ${navItem('services', icons.box, 'Servicios')}
          <p class="nav-caption nav-caption-spaced">CONFIGURACIÓN</p>
          ${navItem('settings', icons.gear, 'Ajustes')}
          <p class="nav-caption nav-caption-spaced">PLATAFORMA</p>
          ${navItem('admin', icons.gear, 'Admin principal')}
        </nav>
        <div class="sidebar-bottom"><div class="help-card"><span class="help-icon">?</span><div><b>¿Necesitas ayuda?</b><small>Habla con soporte</small></div><span class="help-arrow">${icons.arrow}</span></div><div class="user-line"><span class="avatar">${escapeHtml(state.profile.initials)}</span><span><b>${escapeHtml(state.profile.name)}</b><small>Administrador</small></span><button class="icon-btn" aria-label="Más opciones">•••</button></div></div>
      </aside>
      <main class="main-content">
        <header class="topbar"><button class="mobile-menu icon-btn" data-action="toggle-sidebar" aria-label="Abrir menú">${icons.menu}</button><div class="breadcrumb"><span>Workspace</span><i>/</i><b>${viewTitle()}</b></div><div class="top-actions"><button class="icon-btn notification-btn" data-action="notifications" aria-label="Notificaciones">${icons.bell}<span></span></button><div class="top-avatar avatar">${escapeHtml(state.profile.initials)}</div></div></header>
        <div class="page-content">${renderView()}</div>
      </main>
    </div>
    ${modal ? renderModal() : ''}
    <div class="toast-region" aria-live="polite"></div>
  `
  bindEvents()
}

function navItem(view, icon, label, count) { return `<button class="nav-item ${activeView === view ? 'active' : ''}" data-view="${view}">${icon}<span>${label}</span>${count ? `<em>${count}</em>` : ''}</button>` }
function viewTitle() { return ({ dashboard: 'Resumen', quotes: 'Cotizaciones', customers: 'Clientes', services: 'Servicios', settings: 'Ajustes', admin: 'Admin principal' })[activeView] }

function renderView() {
  if (activeView === 'quotes') return renderQuotes()
  if (activeView === 'customers') return renderCustomers()
  if (activeView === 'services') return renderServices()
  if (activeView === 'settings') return renderSettings()
  if (activeView === 'admin') return renderAdmin()
  return renderDashboard()
}

function renderDashboard() {
  const approved = state.quotes.filter((quote) => quote.status === 'approved').length
  const pending = state.quotes.filter((quote) => quote.status === 'pending' || quote.status === 'sent').length
  const total = state.quotes.filter((quote) => quote.status === 'approved').reduce((sum, quote) => sum + quote.amount, 0)
  return `<section class="page-heading page-heading-dashboard"><div><p class="eyebrow">${today()} · RESUMEN DEL TALLER</p><h1>Buenos días, ${escapeHtml(state.profile.name.split(' ')[0])} <span class="wave">✦</span></h1><p class="heading-subtitle">Aquí tienes lo que está pasando con tu operación.</p></div><button class="primary-button" data-action="new-quote">${icons.plus}<span>Crear cotización</span></button></section>
    <div class="metric-grid"><article class="metric-card"><div class="metric-top"><span class="metric-icon orange">${icons.file}</span><span class="metric-change up">↗ 18%</span></div><span class="metric-label">Cotizaciones este mes</span><strong>${state.quotes.length + 43}</strong><span class="metric-foot">vs. ${state.quotes.length + 25} el mes pasado</span></article><article class="metric-card"><div class="metric-top"><span class="metric-icon green">${icons.check}</span><span class="metric-change up">↗ 7%</span></div><span class="metric-label">Tasa de aprobación</span><strong>${Math.round((approved / Math.max(state.quotes.length, 1)) * 100)}%</strong><span class="metric-foot">${approved + 27} cotizaciones aprobadas</span></article><article class="metric-card"><div class="metric-top"><span class="metric-icon blue">${icons.arrow}</span><span class="metric-change up">↗ 24%</span></div><span class="metric-label">Ingresos estimados</span><strong>${formatCompact(total + 7600000)}</strong><span class="metric-foot">${formatMoney(total + 7600000)} en aprobadas</span></article><article class="metric-card"><div class="metric-top"><span class="metric-icon purple">${icons.users}</span><span class="metric-change neutral-change">+ 12 nuevos</span></div><span class="metric-label">Clientes activos</span><strong>${state.customers.length + 38}</strong><span class="metric-foot">En los últimos 30 días</span></article></div>
    <div class="dashboard-grid"><section class="surface recent-surface"><div class="surface-heading"><div><h2>Cotizaciones recientes</h2><p>Los últimos movimientos de tu taller.</p></div><button class="link-button" data-view="quotes">Ver todas ${icons.arrow}</button></div><div class="quote-table"><div class="table-head"><span>CLIENTE</span><span>VEHÍCULO</span><span>VALOR</span><span>ESTADO</span><span></span></div>${state.quotes.slice(0, 4).map(quoteRow).join('')}</div></section><section class="surface conversion-surface"><div class="surface-heading"><div><h2>Estado de conversión</h2><p>Rendimiento de tus cotizaciones.</p></div><button class="more-button" aria-label="Más opciones">•••</button></div><div class="donut-wrap"><div class="donut" style="--rate: ${Math.max(12, Math.round((approved / Math.max(state.quotes.length, 1)) * 100))}%"><div><strong>${Math.round((approved / Math.max(state.quotes.length, 1)) * 100)}%</strong><span>aprobadas</span></div></div></div><div class="legend"><div><span class="legend-dot orange-dot"></span><span>Aprobadas</span><b>${approved + 27}</b></div><div><span class="legend-dot pale-dot"></span><span>Pendientes</span><b>${pending + 11}</b></div><div><span class="legend-dot gray-dot"></span><span>Rechazadas</span><b>${2 + state.quotes.filter((q) => q.status === 'rejected').length}</b></div></div></section></div>
    <section class="lower-grid"><section class="surface pipeline-surface"><div class="surface-heading"><div><h2>Actividad de la semana</h2><p>Cotizaciones creadas y aprobadas.</p></div><button class="select-button">Últimos 7 días <span>⌄</span></button></div><div class="chart"><div class="chart-y"><span>20</span><span>15</span><span>10</span><span>5</span><span>0</span></div><div class="chart-area"><div class="grid-lines"><i></i><i></i><i></i><i></i><i></i></div><div class="bars">${[10, 14, 9, 17, 13, 18, 12].map((value, index) => `<div class="bar-col"><div class="bar-total" style="height:${value * 4.1}px"><i style="height:${Math.max(12, value * 2.4)}px"></i></div><span>${['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'][index]}</span></div>`).join('')}</div></div></div></section><section class="surface next-surface"><div class="surface-heading"><div><h2>Siguiente paso</h2><p>Completa tu configuración.</p></div></div><div class="setup-progress"><div class="progress-ring"><strong>75%</strong></div><div><b>Tu taller está casi listo</b><span>Solo falta configurar tu catálogo de servicios.</span><button class="link-button" data-view="services">Completar ahora ${icons.arrow}</button></div></div><div class="mini-checks"><span>${icons.check}</span><div><b>Perfil del taller</b><small>Completado</small></div><span>${icons.check}</span><div><b>Primer cliente</b><small>Completado</small></div></div></section></section>`
}

function quoteRow(quote) { return `<button class="quote-row" data-action="quote-detail" data-id="${quote.id}"><span class="customer-cell"><span class="customer-avatar">${initials(quote.customer)}</span><b>${escapeHtml(quote.customer)}</b></span><span>${escapeHtml(quote.vehicle)}</span><strong>${formatMoney(quote.amount)}</strong><span><em class="status status-${statusTone(quote.status)}"><i></i>${statusLabel(quote.status)}</em></span><span class="row-arrow">${icons.arrow}</span></button>` }
function formatCompact(value) { return value >= 1000000 ? `$${(value / 1000000).toFixed(1).replace('.', ',')}M` : formatMoney(value) }

function renderQuotes() { return `<section class="page-heading"><div><p class="eyebrow">OPERACIÓN / COTIZACIONES</p><h1>Tus cotizaciones</h1><p class="heading-subtitle">Crea, envía y haz seguimiento sin perder oportunidades.</p></div><button class="primary-button" data-action="new-quote">${icons.plus}<span>Nueva cotización</span></button></section><div class="toolbar"><div class="search-box">${icons.search}<input id="quote-search" placeholder="Buscar por cliente o vehículo" /></div><div class="filter-tabs"><button class="filter-tab active">Todas <span>${state.quotes.length}</span></button><button class="filter-tab">Pendientes <span>${state.quotes.filter((q) => q.status === 'pending').length}</span></button><button class="filter-tab">Aprobadas</button></div></div><section class="surface full-table"><div class="table-head"><span>CLIENTE</span><span>VEHÍCULO</span><span>FECHA</span><span>VALOR</span><span>ESTADO</span><span></span></div><div id="all-quotes">${state.quotes.map(quoteRowFull).join('')}</div></section>` }
function quoteRowFull(quote) { return `<button class="quote-row quote-row-full" data-action="quote-detail" data-id="${quote.id}"><span class="customer-cell"><span class="customer-avatar">${initials(quote.customer)}</span><span><b>${escapeHtml(quote.customer)}</b><small>${quote.id}</small></span></span><span>${escapeHtml(quote.vehicle)}</span><span>${quote.date}</span><strong>${formatMoney(quote.amount)}</strong><span><em class="status status-${statusTone(quote.status)}"><i></i>${statusLabel(quote.status)}</em></span><span class="row-arrow">${icons.arrow}</span></button>` }

function renderCustomers() { return `<section class="page-heading"><div><p class="eyebrow">RELACIONES / CLIENTES</p><h1>Clientes</h1><p class="heading-subtitle">El historial que te ayuda a construir confianza.</p></div><button class="secondary-button" data-action="new-customer">${icons.plus}<span>Agregar cliente</span></button></section><div class="toolbar"><div class="search-box">${icons.search}<input id="customer-search" placeholder="Buscar cliente" /></div><button class="select-button">Más recientes <span>⌄</span></button></div><section class="surface customer-grid">${state.customers.map((customer) => `<article class="customer-card"><div class="customer-card-top"><span class="customer-avatar large">${initials(customer.name)}</span><button class="more-button">•••</button></div><h3>${escapeHtml(customer.name)}</h3><p>${customer.phone}</p><div class="customer-vehicle">${icons.car}<span>${escapeHtml(customer.vehicle)}</span></div><div class="customer-card-foot"><span>${customer.visits} visitas</span><b>${formatMoney(customer.value)}</b></div></article>`).join('')}</section>` }
function renderServices() { return `<section class="page-heading"><div><p class="eyebrow">CATÁLOGO / SERVICIOS</p><h1>Servicios y precios</h1><p class="heading-subtitle">Precios listos para cotizar en segundos.</p></div><button class="primary-button" data-action="new-service">${icons.plus}<span>Agregar servicio</span></button></section><section class="surface service-list"><div class="service-list-head"><div><h2>Catálogo activo</h2><p>${state.services.length} servicios disponibles para tu equipo.</p></div><div class="search-box small-search">${icons.search}<input placeholder="Buscar servicio" /></div></div>${state.services.map((service) => `<div class="service-row"><span class="service-icon">${icons.box}</span><span class="service-info"><b>${escapeHtml(service.name)}</b><small>${escapeHtml(service.category)} · Usado ${service.used} veces</small></span><strong>${formatMoney(service.price)}</strong><button class="more-button">•••</button></div>`).join('')}</section>` }
function renderSettings() { return `<section class="page-heading"><div><p class="eyebrow">CONFIGURACIÓN / PERFIL</p><h1>Ajustes del taller</h1><p class="heading-subtitle">Mantén la información que ven tus clientes al día.</p></div><button class="primary-button" data-action="save-settings">${icons.check}<span>Guardar cambios</span></button></section><div class="settings-grid"><section class="surface settings-card"><div class="surface-heading"><div><h2>Información del taller</h2><p>Estos datos aparecen en tus cotizaciones.</p></div></div><div class="form-grid"><label>Nombre del taller<input id="setting-workshop" value="${escapeHtml(state.profile.workshop)}" /></label><label>Ciudad<input id="setting-city" value="${escapeHtml(state.profile.city)}" /></label><label class="wide-field">WhatsApp de atención<input id="setting-phone" value="${escapeHtml(state.profile.phone)}" /></label></div></section><section class="surface plan-card"><span class="plan-kicker">MONETIZACIÓN</span><h2>Ingresos por anuncios</h2><p>Activa espacios publicitarios relevantes para generar ingresos adicionales.</p><div class="plan-days"><strong>0</strong><span>COP<br>este mes</span></div><button class="primary-button full-button" data-action="ad-settings">Configurar anuncios</button><p class="plan-note">Solo anuncios aprobados y relacionados con automoción.</p></section></div><section class="surface danger-zone"><div><h2>Datos de prueba</h2><p>Restablece el espacio de trabajo para volver a ver el ejemplo inicial.</p></div><button class="secondary-button danger-button" data-action="reset">Restablecer demo</button></section>` }

function renderAdmin() { return `<section class="page-heading"><div><p class="eyebrow">PLATAFORMA / CONTROL CENTRAL</p><h1>Admin principal</h1><p class="heading-subtitle">Supervisa talleres, actividad e ingresos publicitarios desde una sola vista.</p></div><button class="primary-button" data-action="connect-gmail">${icons.arrow}<span>Conectar Gmail</span></button></section><div class="admin-identity"><span class="avatar avatar-admin">AM</span><div><b>Administrador principal</b><span>andres@cotizarapido.co</span></div><em class="connection-badge"><i></i> Cuenta pendiente de conectar</em></div><div class="metric-grid"><article class="metric-card"><div class="metric-top"><span class="metric-icon orange">${icons.users}</span><span class="metric-change up">↗ 12%</span></div><span class="metric-label">Talleres registrados</span><strong>42</strong><span class="metric-foot">8 nuevos este mes</span></article><article class="metric-card"><div class="metric-top"><span class="metric-icon green">${icons.file}</span><span class="metric-change up">↗ 24%</span></div><span class="metric-label">Cotizaciones creadas</span><strong>1.284</strong><span class="metric-foot">Últimos 30 días</span></article><article class="metric-card"><div class="metric-top"><span class="metric-icon blue">${icons.arrow}</span><span class="metric-change up">↗ 18%</span></div><span class="metric-label">Ingresos por anuncios</span><strong>$1,8M</strong><span class="metric-foot">COP acumulados</span></article><article class="metric-card"><div class="metric-top"><span class="metric-icon purple">${icons.check}</span><span class="metric-change neutral-change">Activo</span></div><span class="metric-label">Estado de plataforma</span><strong>99,8%</strong><span class="metric-foot">Disponibilidad este mes</span></article></div><div class="admin-grid"><section class="surface admin-table-surface"><div class="surface-heading"><div><h2>Talleres recientes</h2><p>Actividad de las cuentas registradas.</p></div><button class="link-button" data-action="admin-export">Exportar ${icons.arrow}</button></div><div class="admin-list"><div><span class="customer-avatar">MA</span><span><b>Méndez Auto Service</b><small>Bogotá · creado hoy</small></span><em class="status status-success"><i></i>Activo</em></div><div><span class="customer-avatar">TA</span><span><b>Taller Águila</b><small>Medellín · hace 2 días</small></span><em class="status status-success"><i></i>Activo</em></div><div><span class="customer-avatar">CM</span><span><b>CarFix Centro</b><small>Cali · hace 4 días</small></span><em class="status status-warning"><i></i>Revisión</em></div></div></section><section class="surface gmail-surface"><div class="surface-heading"><div><h2>Correo administrativo</h2><p>Gmail para alertas y reportes.</p></div><span class="gmail-mark">M</span></div><div class="gmail-state"><span class="gmail-icon">@</span><div><b>Conecta una cuenta de Gmail</b><p>Recibe avisos de nuevos talleres, ingresos y errores críticos.</p></div></div><button class="secondary-button full-button" data-action="connect-gmail">Conectar con Google ${icons.arrow}</button><small class="security-note">OAuth seguro de Google · No guardamos tu contraseña</small></section></div>` }

function renderModal() {
  if (modal.type === 'quote') return `<div class="modal-backdrop" data-action="close-modal"><section class="modal modal-wide" role="dialog" aria-modal="true" onclick="event.stopPropagation()"><div class="modal-header"><div><span class="eyebrow">NUEVA COTIZACIÓN</span><h2>Arma una propuesta en minutos</h2></div><button class="close-button" data-action="close-modal">×</button></div><form id="quote-form"><div class="form-section"><h3>1. Datos del cliente</h3><div class="form-grid"><label>Nombre completo<input name="customer" required placeholder="Ej. María Rodríguez" /></label><label>Teléfono / WhatsApp<input name="phone" placeholder="Ej. 310 555 0101" /></label><label>Vehículo<input name="vehicle" required placeholder="Ej. Mazda CX-5 2020" /></label><label>Placa<input name="plate" placeholder="ABC 123" /></label><label>Presupuesto mínimo<input name="budget-min" type="number" min="0" placeholder="Ej. 300000" /></label><label>Presupuesto máximo<input name="budget-max" type="number" min="0" placeholder="Ej. 500000" /></label><label class="wide-field">Notas del presupuesto<textarea name="budget-notes" rows="2" placeholder="Qué puede priorizar o ajustar el cliente"></textarea></label></div></div><div class="form-section"><div class="form-section-heading"><h3>2. Servicios</h3><button class="text-button" type="button" data-action="add-line">+ Agregar línea</button></div><div id="quote-lines"><div class="quote-line"><select name="service"><option value="">Selecciona un servicio</option>${state.services.map((service) => `<option value="${service.price}">${escapeHtml(service.name)} · ${formatMoney(service.price)}</option>`).join('')}</select><input name="line-description" placeholder="Detalle opcional" /><input class="line-price" name="price" type="number" min="0" placeholder="Precio" required /></div></div></div><div class="quote-total"><span>Total estimado</span><strong id="quote-total-value">$ 0</strong></div><div class="modal-actions"><button class="secondary-button" type="button" data-action="close-modal">Cancelar</button><button class="primary-button" type="submit">Guardar y preparar envío ${icons.arrow}</button></div></form></section></div>`
  if (modal.type === 'detail') { const quote = state.quotes.find((item) => item.id === modal.id); return quote ? `<div class="modal-backdrop" data-action="close-modal"><section class="modal detail-modal" role="dialog" aria-modal="true" onclick="event.stopPropagation()"><div class="modal-header"><div><span class="eyebrow">${quote.id}</span><h2>${escapeHtml(quote.customer)}</h2><p>${escapeHtml(quote.vehicle)} · creada ${quote.date}</p></div><button class="close-button" data-action="close-modal">×</button></div><div class="detail-total"><span>Valor de la cotización</span><strong>${formatMoney(quote.amount)}</strong><em class="status status-${statusTone(quote.status)}"><i></i>${statusLabel(quote.status)}</em></div><div class="budget-summary"><b>Presupuesto sugerido por el cliente</b><span>${quote.budgetMin || quote.budgetMax ? `${formatMoney(quote.budgetMin || 0)} - ${formatMoney(quote.budgetMax || 0)}` : 'No especificado'}</span>${quote.budgetNotes ? `<small>${escapeHtml(quote.budgetNotes)}</small>` : ''}</div><div class="detail-items">${quote.items.map((item) => `<div><span>${escapeHtml(item)}</span><b>Incluido</b></div>`).join('')}</div><div class="modal-actions"><button class="secondary-button" data-action="duplicate-quote" data-id="${quote.id}">Duplicar</button><button class="primary-button" data-action="send-quote" data-id="${quote.id}">Enviar por WhatsApp ${icons.arrow}</button></div></section></div>` : '' }
  return `<div class="modal-backdrop" data-action="close-modal"><section class="modal" role="dialog" aria-modal="true" onclick="event.stopPropagation()"><div class="modal-header"><div><span class="eyebrow">NUEVO REGISTRO</span><h2>Agregar cliente</h2></div><button class="close-button" data-action="close-modal">×</button></div><form id="customer-form"><label>Nombre completo<input name="name" required placeholder="Ej. María Rodríguez" /></label><label>Teléfono<input name="phone" placeholder="310 555 0101" /></label><label>Vehículo<input name="vehicle" placeholder="Ej. Mazda CX-5 2020" /></label><div class="modal-actions"><button class="secondary-button" type="button" data-action="close-modal">Cancelar</button><button class="primary-button" type="submit">Guardar cliente ${icons.arrow}</button></div></form></section></div>`
}

function bindEvents() {
  document.querySelectorAll('[data-view]').forEach((element) => element.addEventListener('click', () => { activeView = element.dataset.view; render() }))
  document.querySelectorAll('[data-action]').forEach((element) => element.addEventListener('click', handleAction))
  document.querySelector('#quote-form')?.addEventListener('submit', submitQuote)
  document.querySelector('#customer-form')?.addEventListener('submit', submitCustomer)
  document.querySelectorAll('select[name="service"]').forEach((select) => select.addEventListener('change', (event) => { const price = event.target.value; const input = event.target.closest('.quote-line').querySelector('.line-price'); input.value = price; updateQuoteTotal() }))
  document.querySelectorAll('.line-price').forEach((input) => input.addEventListener('input', updateQuoteTotal))
  document.querySelector('#quote-search')?.addEventListener('input', filterQuotes)
  document.querySelector('#customer-search')?.addEventListener('input', filterCustomers)
}

function handleAction(event) {
  const action = event.currentTarget.dataset.action
  if (action === 'new-quote') modal = { type: 'quote' }
  if (action === 'new-customer') modal = { type: 'customer' }
  if (action === 'quote-detail') modal = { type: 'detail', id: event.currentTarget.dataset.id }
  if (action === 'close-modal') modal = null
  if (action === 'ad-settings') showToast('La configuración de anuncios se conectará con Supabase', 'info')
  if (action === 'connect-gmail') showToast('Gmail se conectará mediante OAuth de Google en Supabase', 'info')
  if (action === 'admin-export') showToast('La exportación estará disponible con los datos reales de Supabase', 'info')
  if (action === 'send-quote') { modal = null; showToast('Cotización lista para enviar por WhatsApp', 'success') }
  if (action === 'duplicate-quote') { const source = state.quotes.find((quote) => quote.id === event.currentTarget.dataset.id); state.quotes.unshift({ ...source, id: `CR-${1050 + state.quotes.length}`, status: 'draft', date: 'Ahora' }); saveState(); modal = null; showToast('Cotización duplicada como borrador', 'success') }
  if (action === 'add-line') { const lines = document.querySelector('#quote-lines'); if (lines) { lines.insertAdjacentHTML('beforeend', `<div class="quote-line"><select name="service"><option value="">Selecciona un servicio</option>${state.services.map((service) => `<option value="${service.price}">${escapeHtml(service.name)} · ${formatMoney(service.price)}</option>`).join('')}</select><input name="line-description" placeholder="Detalle opcional" /><input class="line-price" name="price" type="number" min="0" placeholder="Precio" required /></div>`); render(); modal = { type: 'quote' } } }
  if (action === 'save-settings') { state.profile.workshop = document.querySelector('#setting-workshop')?.value || state.profile.workshop; state.profile.city = document.querySelector('#setting-city')?.value || state.profile.city; state.profile.phone = document.querySelector('#setting-phone')?.value || state.profile.phone; saveState(); showToast('Cambios guardados correctamente', 'success') }
  if (action === 'reset') { localStorage.removeItem(STORAGE_KEY); state = loadState(); showToast('Demo restablecida', 'success') }
  if (action === 'toggle-sidebar') document.querySelector('#sidebar')?.classList.toggle('open')
  if (action === 'notifications') showToast('No tienes notificaciones nuevas', 'info')
  render()
}

function submitQuote(event) { event.preventDefault(); const data = new FormData(event.currentTarget); const prices = [...event.currentTarget.querySelectorAll('.line-price')].map((input) => Number(input.value) || 0); const amount = prices.reduce((sum, value) => sum + value, 0); const budgetMin = Number(data.get('budget-min')) || null; const budgetMax = Number(data.get('budget-max')) || null; if (budgetMin && budgetMax && budgetMin > budgetMax) { showToast('El presupuesto mínimo no puede superar el máximo', 'error'); return } if (!amount) { showToast('Agrega al menos un servicio con precio', 'error'); return } state.quotes.unshift({ id: `CR-${1050 + state.quotes.length}`, customer: data.get('customer'), vehicle: data.get('vehicle'), amount, budgetMin, budgetMax, budgetNotes: data.get('budget-notes') || '', status: 'draft', date: 'Ahora', items: [...event.currentTarget.querySelectorAll('.line-price')].map((input) => input.closest('.quote-line').querySelector('select').selectedOptions[0]?.textContent.split(' · ')[0] || 'Servicio personalizado') }); saveState(); modal = null; showToast('Cotización guardada como borrador', 'success'); render() }
function submitCustomer(event) { event.preventDefault(); const data = new FormData(event.currentTarget); state.customers.unshift({ name: data.get('name'), phone: data.get('phone') || 'Sin teléfono', vehicle: data.get('vehicle') || 'Vehículo pendiente', visits: 0, value: 0 }); saveState(); modal = null; showToast('Cliente agregado correctamente', 'success'); render() }
function updateQuoteTotal() { const total = [...document.querySelectorAll('.line-price')].reduce((sum, input) => sum + (Number(input.value) || 0), 0); const target = document.querySelector('#quote-total-value'); if (target) target.textContent = formatMoney(total) }
function filterQuotes(event) { const query = event.target.value.toLowerCase(); document.querySelector('#all-quotes').innerHTML = state.quotes.filter((quote) => `${quote.customer} ${quote.vehicle}`.toLowerCase().includes(query)).map(quoteRowFull).join('') ; bindEvents() }
function filterCustomers(event) { const query = event.target.value.toLowerCase(); document.querySelector('.customer-grid').innerHTML = state.customers.filter((customer) => customer.name.toLowerCase().includes(query)).map((customer) => `<article class="customer-card"><div class="customer-card-top"><span class="customer-avatar large">${initials(customer.name)}</span></div><h3>${escapeHtml(customer.name)}</h3><p>${customer.phone}</p><div class="customer-vehicle">${icons.car}<span>${escapeHtml(customer.vehicle)}</span></div><div class="customer-card-foot"><span>${customer.visits} visitas</span><b>${formatMoney(customer.value)}</b></div></article>`).join('') }
function showToast(message, tone = 'info') { clearTimeout(toastTimer); const region = document.querySelector('.toast-region'); if (!region) return; region.innerHTML = `<div class="toast toast-${tone}">${tone === 'error' ? icons.alert : icons.check}<span>${escapeHtml(message)}</span></div>`; toastTimer = setTimeout(() => { region.innerHTML = '' }, 3500) }

render()
