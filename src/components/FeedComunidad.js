import { escapeHtml, formatMoney, icons } from '../utils/ui.js'

const privateDataPatterns = [
  /\b[\w.+-]+@[\w.-]+\.[A-Z]{2,}\b/gi,
  /(?:\+?\d[\d\s().-]{6,}\d)/g,
  /\b(?:calle|carrera|avenida|av\.?|transversal|diagonal|cll\.?|cra\.?|tv\.?|dg\.?)\s*\d+[^,;\n]*/gi,
  /\b(?:placa|direcci[oó]n|tel[eé]fono)\s*[:#-]?\s*[^,;\n]+/gi,
]

export function sanitizeCommunityText(value) {
  return privateDataPatterns.reduce((text, pattern) => text.replace(pattern, '[dato privado]'), String(value ?? '')).slice(0, 180)
}

export function renderCommunityFeed(requests) {
  const latestRequests = requests.slice(0, 5)
  return `<section class="surface community-feed"><div class="surface-heading"><div><p class="eyebrow">FEED DE LA COMUNIDAD</p><h2>Actividad reciente</h2><p>Solicitudes públicas del marketplace, sin datos privados del cliente.</p></div><button class="link-button" data-action="feed-dialog">¿Puedes ser tú el siguiente? ${icons.arrow}</button></div>${latestRequests.length ? `<div class="feed-list">${latestRequests.map((request) => {
    const title = escapeHtml(sanitizeCommunityText(request.title || 'Nueva solicitud'))
    const category = escapeHtml(sanitizeCommunityText(request.category || 'General'))
    const location = escapeHtml(sanitizeCommunityText(request.location || 'Ubicación no indicada'))
    const budget = request.budget_amount ? formatMoney(request.budget_amount) : 'Presupuesto libre'
    const createdAt = request.created_at ? new Intl.DateTimeFormat('es-CO', { dateStyle: 'medium' }).format(new Date(request.created_at)) : ''
    return `<article class="feed-item"><span class="feed-avatar" aria-hidden="true">P</span><div><b>${title}</b><p>${location} · ${category} · ${budget}</p></div><small>${escapeHtml(createdAt)}</small></article>`
  }).join('')}</div>` : `<div class="empty-feed"><span class="empty-feed-icon">✦</span><h3>Aún no hay actividad</h3><p>Publica una solicitud para iniciar la actividad del marketplace.</p><button class="primary-button" data-action="new-request">Publicar solicitud ${icons.arrow}</button></div>`}</section>`
}
