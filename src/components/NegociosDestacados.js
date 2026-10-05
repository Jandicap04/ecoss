import { escapeHtml, icons } from '../utils/ui.js'

function safeImageUrl(value) {
  try {
    const url = new URL(value, window.location.origin)
    return ['http:', 'https:'].includes(url.protocol) ? url.href : ''
  } catch {
    return ''
  }
}

export function renderFeaturedBusinesses(businesses) {
  if (!businesses.length) return '<div class="featured-empty"><span class="featured-empty-mark">P</span><p>Los negocios destacados aparecerán aquí cuando estén disponibles.</p></div>'
  return `<div class="featured-business-grid">${businesses.map((business) => {
    const logo = safeImageUrl(business.logo_url)
    const name = escapeHtml(business.name || 'Negocio')
    const initials = name.trim().split(/\s+/).slice(0, 2).map((word) => word[0]).join('').toUpperCase()
    return `<article class="featured-business"><div class="featured-business-brand">${logo ? `<img src="${escapeHtml(logo)}" alt="Logo de ${name}" loading="lazy" />` : `<span class="featured-logo-fallback">${initials || 'P'}</span>`}<span class="featured-label">DESTACADO</span></div><h3>${name}</h3><p class="featured-category">${escapeHtml(business.category || 'Proveedor en Pacotizar')}</p><p class="featured-description">${escapeHtml(business.description || 'Encuentra este negocio y consulta sus servicios.')}</p>${business.city ? `<p class="featured-location">⌖ ${escapeHtml(business.city)}</p>` : ''}<button class="text-button" data-action="business-detail" data-id="${escapeHtml(business.workshop_id)}">Ver negocio ${icons.arrow}</button></article>`
  }).join('')}</div>`
}
