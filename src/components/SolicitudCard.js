import { escapeHtml, formatMoney } from '../utils/ui.js'

function safeImageUrl(value) {
  try {
    const url = new URL(value, window.location.origin)
    return ['http:', 'https:'].includes(url.protocol) ? url.href : ''
  } catch {
    return ''
  }
}

function requestDate(value) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? 'Reciente' : new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'short' }).format(date)
}

export function renderRequestCard(request) {
  const images = (request.image_urls || []).map(safeImageUrl).filter(Boolean).slice(0, 3)
  const category = request.category ? `<span class="request-tag">${escapeHtml(request.category)}</span>` : ''
  const tags = (request.tags || []).slice(0, 5).map((tag) => `<span class="request-tag">${escapeHtml(tag)}</span>`).join('')
  const budget = request.budget_amount ? `<span class="request-budget">Presupuesto estimado · ${formatMoney(request.budget_amount)}</span>` : ''
  return `<article class="request-card"><div class="request-card-top"><span class="request-state"><i></i>Solicitud abierta</span><time>${escapeHtml(requestDate(request.created_at))}</time></div><h3>${escapeHtml(request.title)}</h3><p class="request-description">${escapeHtml(request.description)}</p>${images.length ? `<div class="request-images">${images.map((image) => `<img src="${escapeHtml(image)}" alt="Imagen de ${escapeHtml(request.title)}" loading="lazy" />`).join('')}</div>` : ''}<div class="request-meta">${request.location ? `<span class="request-location">⌖ ${escapeHtml(request.location)}</span>` : ''}${budget}</div>${category || tags ? `<div class="request-tags">${category}${tags}</div>` : ''}<div class="request-card-actions"><button class="text-button" data-action="request-detail" data-id="${escapeHtml(request.id)}">Ver solicitud</button><button class="secondary-button" data-action="request-response" data-id="${escapeHtml(request.id)}">Quiero cotizar</button></div></article>`
}
