import { escapeHtml, formatMoney, icons, initials } from '../utils/ui.js'

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

export function renderClientCards(clients, canManage) {
  const providers = (Array.isArray(clients) ? clients : []).map(normalizeProvider).filter(Boolean)
  if (!providers.length) {
    return '<div class="empty-feed"><span class="empty-feed-icon">✦</span><h3>No hay proveedores visibles</h3><p>Aún no hay negocios activos para mostrar en el marketplace.</p></div>'
  }

  return providers.map((provider) => `<article class="customer-card"><div class="customer-card-top"><span class="customer-avatar large">${initials(provider.name)}</span>${canManage ? `<button class="more-button" data-action="delete-customer" data-id="${escapeHtml(provider.id)}" aria-label="Eliminar ${escapeHtml(provider.name)}">×</button>` : ''}</div><h3>${escapeHtml(provider.name)}</h3><p>${escapeHtml(provider.category)}</p><div class="customer-vehicle">${icons.car}<span>${escapeHtml(provider.city)}</span></div><div class="customer-card-foot"><span>${Number(provider.visits) || 0} trabajos</span><b>${escapeHtml(provider.description)}</b></div><button class="text-button" data-action="business-detail" data-id="${escapeHtml(provider.id)}">Ver negocio ${icons.arrow}</button></article>`).join('')
}

export function renderClients({ clients, canManage }) {
  return `<section class="page-heading"><div><p class="eyebrow">MERCADO / PROVEEDORES</p><h1>Proveedores</h1><p class="heading-subtitle">Descubre negocios activos y encuentra a la persona ideal para cada necesidad.</p></div>${canManage ? `<button class="secondary-button" data-action="new-customer">${icons.plus}<span>Agregar proveedor</span></button>` : ''}</section><div class="toolbar"><div class="search-box">${icons.search}<input id="customer-search" placeholder="Buscar por nombre o ciudad" /></div><button class="select-button">Más relevantes <span>⌄</span></button></div><section class="surface customer-grid">${renderClientCards(clients, canManage)}</section>`
}
