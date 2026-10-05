import { escapeHtml, formatMoney, icons } from '../utils/ui.js'

function requestCard(request) {
  const tags = Array.isArray(request.tags) ? request.tags : []
  return `<article class="market-request-card"><div class="market-request-top"><span class="market-category">${escapeHtml(request.category || 'General')}</span><time>${escapeHtml(request.created_at ? new Intl.DateTimeFormat('es-CO', { dateStyle: 'medium' }).format(new Date(request.created_at)) : '')}</time></div><h2>${escapeHtml(request.title || 'Solicitud abierta')}</h2><p class="market-request-description">${escapeHtml(request.description || '')}</p><div class="market-request-meta"><span>⌖ ${escapeHtml(request.location || 'Ubicación no indicada')}</span><strong>${request.budget_amount ? formatMoney(request.budget_amount) : 'Presupuesto abierto'}</strong></div>${tags.length ? `<div class="market-request-tags">${tags.map((tag) => `<span>${escapeHtml(tag)}</span>`).join('')}</div>` : ''}${request.status === 'closed' ? '<span class="request-closed-badge">Cerrada</span>' : ''}<button class="text-button" data-action="request-detail" data-id="${escapeHtml(request.id)}">Ver solicitud ${icons.arrow}</button></article>`
}

export function renderRequestCards(requests) {
  return requests.length
    ? requests.map(requestCard).join('')
    : '<div class="empty-feed"><span class="empty-feed-icon">⌕</span><h3>No encontramos solicitudes</h3><p>Prueba con otra búsqueda o categoría, o publica una solicitud nueva.</p></div>'
}

export function renderRequests({ state, marketplaceError = '', requestScope = 'market' }) {
  const marketRequests = Array.isArray(state.quoteRequests) ? state.quoteRequests : []
  const myRequests = Array.isArray(state.myQuoteRequests) ? state.myQuoteRequests : []
  const requests = requestScope === 'mine' ? myRequests : marketRequests
  const categories = [...new Set(requests.map((request) => request.category).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'es'))
  const errorNotice = marketplaceError
    ? `<div class="marketplace-error" role="alert"><span>${escapeHtml(marketplaceError)}</span><button class="secondary-button" data-action="retry-marketplace">Reintentar</button></div>`
    : ''
  return `<section class="page-heading"><div><p class="eyebrow">MERCADO / SOLICITUDES</p><h1>${requestScope === 'mine' ? 'Mis solicitudes' : 'Necesidades por cotizar'}</h1><p class="heading-subtitle">${requestScope === 'mine' ? 'Administra tus solicitudes y revisa las propuestas recibidas.' : 'Explora solicitudes abiertas y encuentra oportunidades cerca de ti.'}</p></div><button class="primary-button" data-action="new-request">${icons.plus}<span>Publicar solicitud</span></button></section>${errorNotice}<div class="request-scope-switch" role="group" aria-label="Tipo de solicitudes"><button type="button" class="${requestScope === 'market' ? 'active' : ''}" data-action="request-scope" data-scope="market">Explorar mercado <span>${marketRequests.length}</span></button><button type="button" class="${requestScope === 'mine' ? 'active' : ''}" data-action="request-scope" data-scope="mine">Mis solicitudes <span>${myRequests.length}</span></button></div><div class="toolbar market-request-toolbar"><label class="search-box">${icons.search}<input id="request-search" type="search" placeholder="Buscar solicitud, descripción o ciudad" aria-label="Buscar solicitudes" /></label><label class="market-category-filter"><span>Categoría</span><select id="request-category"><option value="">Todas</option>${categories.map((category) => `<option value="${escapeHtml(category)}">${escapeHtml(category)}</option>`).join('')}</select></label><span class="market-request-count" id="request-count">${requests.length} ${requests.length === 1 ? 'solicitud' : 'solicitudes'}</span></div><section class="market-request-grid" id="request-results" aria-live="polite">${renderRequestCards(requests)}</section>`
}
