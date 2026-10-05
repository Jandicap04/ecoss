import { escapeHtml, icons, initials } from '../utils/ui.js'

function normalizeProvider(item) {
  if (!item || typeof item !== 'object') return null
  const name = item.name || item.business || 'Proveedor'
  return {
    id: item.id || item.workshop_id || name,
    name,
    phone: item.phone || 'Contacto disponible por solicitud',
    vehicle: item.city || item.location || 'Bogotá',
    visits: item.visits || item.total_jobs || 0,
    value: item.value || item.budget_amount || 0,
    category: item.category || 'Proveedor general',
    description: item.description || 'Proveedor disponible para colaborar en Pacotizar.',
    city: item.city || item.location || 'Bogotá',
    logo_url: item.logo_url || '',
  }
}

export function filterProviders(providers, query = '', category = '') {
  const searchTerm = String(query || '').trim().toLowerCase()
  const categoryTerm = String(category || '').trim().toLowerCase()

  return (Array.isArray(providers) ? providers : []).map(normalizeProvider).filter(Boolean).filter((provider) => {
    const haystack = `${provider.name || ''} ${provider.city || ''} ${provider.category || ''}`.toLowerCase()
    const matchesQuery = !searchTerm || haystack.includes(searchTerm)
    const matchesCategory = !categoryTerm || String(provider.category || '').toLowerCase() === categoryTerm
    return matchesQuery && matchesCategory
  })
}

export function sortProviders(providers, sort = 'relevance') {
  const list = [...(Array.isArray(providers) ? providers : [])].map(normalizeProvider).filter(Boolean)

  const byName = [...list].sort((a, b) => String(a.name || '').localeCompare(String(b.name || ''), 'es'))
  const byCity = [...list].sort((a, b) => String(a.city || '').localeCompare(String(b.city || ''), 'es') || String(a.name || '').localeCompare(String(b.name || ''), 'es'))
  const byCategory = [...list].sort((a, b) => String(a.category || '').localeCompare(String(b.category || ''), 'es') || String(a.name || '').localeCompare(String(b.name || ''), 'es'))
  const byRelevance = [...list].sort((a, b) => Number(b.visits || 0) - Number(a.visits || 0) || String(a.name || '').localeCompare(String(b.name || ''), 'es'))

  return {
    relevance: byRelevance,
    name: byName,
    city: byCity,
    category: byCategory,
  }[sort] || byRelevance
}

export function renderClientCards(clients, canManage) {
  const providers = sortProviders(clients)
  if (!providers.length) {
    return '<div class="empty-feed"><span class="empty-feed-icon">✦</span><h3>No hay proveedores visibles</h3><p>Aún no hay negocios activos para mostrar en el marketplace.</p></div>'
  }

  return providers.map((provider) => `<article class="customer-card"><div class="customer-card-top"><span class="customer-avatar large">${initials(provider.name)}</span>${canManage ? `<button class="more-button" data-action="delete-customer" data-id="${escapeHtml(provider.id)}" aria-label="Eliminar ${escapeHtml(provider.name)}">×</button>` : ''}</div><h3>${escapeHtml(provider.name)}</h3><p>${escapeHtml(provider.category)}</p><div class="customer-vehicle">${icons.car}<span>${escapeHtml(provider.city)}</span></div><div class="customer-card-foot"><span>${Number(provider.visits) || 0} trabajos</span><b>${escapeHtml(provider.description)}</b></div><button class="text-button" data-action="business-detail" data-id="${escapeHtml(provider.id)}">Ver negocio ${icons.arrow}</button></article>`).join('')
}

export function renderClients({ clients, canManage }) {
  const categories = [...new Set((Array.isArray(clients) ? clients : []).map((provider) => provider?.category || '').filter(Boolean).map((value) => String(value).trim()))].sort((a, b) => a.localeCompare(b, 'es'))

  return `<section class="page-heading"><div><p class="eyebrow">MERCADO / PROVEEDORES</p><h1>Proveedores</h1><p class="heading-subtitle">Descubre negocios activos y encuentra a la persona ideal para cada necesidad.</p></div>${canManage ? `<button class="secondary-button" data-action="new-customer">${icons.plus}<span>Agregar proveedor</span></button>` : ''}</section><div class="toolbar"><div class="search-box">${icons.search}<input id="customer-search" placeholder="Buscar por nombre o ciudad" /></div><label class="market-category-filter"><span>Categoría</span><select id="customer-category"><option value="">Todas</option>${categories.map((category) => `<option value="${escapeHtml(category)}">${escapeHtml(category)}</option>`).join('')}</select></label><label class="market-category-filter"><span>Ordenar</span><select id="customer-sort"><option value="relevance">Más relevantes</option><option value="city">Ciudad</option><option value="name">Nombre</option><option value="category">Categoría</option></select></label></div><section class="surface customer-grid">${renderClientCards(clients, canManage)}</section>`
}
