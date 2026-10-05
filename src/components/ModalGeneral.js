import { escapeHtml, formatMoney, icons, initials, statusLabel, statusTone } from '../utils/ui.js'
import { renderQuoteModal } from './ModalCotizacion.js'
import { renderAuthModal } from './ModalAuth.js'
import { renderRequestModal } from './ModalSolicitud.js'

function renderRequestDetail(request, { state, requestOffers, requestOfferError }) {
  const isOwner = (state.myQuoteRequests || []).some((item) => String(item.id) === String(request.id))
  const tags = Array.isArray(request.tags) ? request.tags : []
  const imageUrls = (Array.isArray(request.image_urls) ? request.image_urls : []).filter((value) => {
    try {
      return ['http:', 'https:'].includes(new URL(value).protocol)
    } catch {
      return false
    }
  })
  const offersMarkup = requestOffers.length
    ? `<div class="request-offers-list">${requestOffers.map((offer) => {
      const status = { pending: 'Pendiente', accepted: 'Aceptada', declined: 'No seleccionada' }[offer.status] || 'Pendiente'
      const actions = isOwner && request.status === 'open' && offer.status === 'pending'
        ? `<div class="request-offer-actions"><button type="button" class="secondary-button" data-action="respond-request-offer" data-id="${escapeHtml(offer.id)}" data-status="declined">Rechazar</button><button type="button" class="primary-button" data-action="respond-request-offer" data-id="${escapeHtml(offer.id)}" data-status="accepted">Aceptar propuesta</button></div>`
        : ''
      return `<article class="request-offer"><div><strong>${formatMoney(offer.amount)}</strong><span>${status} · ${escapeHtml(offer.created_at ? new Intl.DateTimeFormat('es-CO', { dateStyle: 'medium' }).format(new Date(offer.created_at)) : '')}</span></div><p>${escapeHtml(offer.message)}</p>${actions}</article>`
    }).join('')}</div>`
    : requestOfferError
      ? `<p class="form-error" role="alert">${escapeHtml(requestOfferError)}</p>`
      : '<p class="request-offers-empty">Aún no hay propuestas para esta solicitud.</p>'
  const statusButton = isOwner
    ? `<button type="button" class="secondary-button" data-action="set-request-status" data-id="${escapeHtml(request.id)}" data-status="${request.status === 'closed' ? 'open' : 'closed'}">${request.status === 'closed' ? 'Reabrir solicitud' : 'Cerrar solicitud'}</button>`
    : ''
  const offerForm = !isOwner && request.status === 'open'
    ? `<form id="request-offer-form" data-request-id="${escapeHtml(request.id)}"><h3>Enviar una propuesta</h3><label>Tu precio<input name="amount" type="number" min="1" step="1" required placeholder="COP" /></label><label>Mensaje<textarea name="message" minlength="10" maxlength="1000" rows="3" required placeholder="Describe lo que incluye tu propuesta, tiempos y condiciones"></textarea></label>${requestOfferError ? `<p class="form-error" role="alert">${escapeHtml(requestOfferError)}</p>` : ''}<div class="modal-actions"><button class="secondary-button" type="button" data-action="close-modal">Cerrar</button><button class="primary-button" type="submit">Enviar propuesta ${icons.arrow}</button></div></form>`
    : `<div class="modal-actions">${statusButton}<button type="button" class="secondary-button" data-action="close-modal">Cerrar</button></div>`
  return `<div class="modal-backdrop" data-action="backdrop-close"><section class="modal modal-wide request-detail-modal" role="dialog" aria-modal="true" aria-labelledby="request-detail-title"><div class="modal-header"><div><span class="eyebrow">SOLICITUD ${request.status === 'closed' ? 'CERRADA' : 'ABIERTA'} · ${escapeHtml(request.category || 'GENERAL')}</span><h2 id="request-detail-title">${escapeHtml(request.title)}</h2><p>${escapeHtml(request.location || 'Ubicación no indicada')} · ${escapeHtml(request.created_at ? new Intl.DateTimeFormat('es-CO', { dateStyle: 'medium' }).format(new Date(request.created_at)) : '')}</p></div><button class="close-button" data-action="close-modal" aria-label="Cerrar">×</button></div><p class="request-detail-description">${escapeHtml(request.description)}</p><div class="request-detail-budget"><span>Presupuesto estimado</span><strong>${request.budget_amount ? formatMoney(request.budget_amount) : 'Abierto a propuestas'}</strong></div>${tags.length ? `<div class="market-request-tags">${tags.map((tag) => `<span>${escapeHtml(tag)}</span>`).join('')}</div>` : ''}${imageUrls.length ? `<div class="request-detail-images">${imageUrls.map((url) => `<a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer"><img src="${escapeHtml(url)}" alt="Imagen adjunta a la solicitud" loading="lazy" /></a>`).join('')}</div>` : ''}<section class="request-offers"><h3>Propuestas recibidas</h3>${offersMarkup}</section>${offerForm}</section></div>`
}

export function renderModal(modal, { state, services, canManage, requestOffers = [], requestOfferError = '' }) {
  if (!modal) return ''
  if (modal.type === 'quote') return renderQuoteModal(services)
  if (modal.type === 'request') return renderRequestModal()
  if (modal.type === 'auth') return renderAuthModal(modal.mode || 'login', modal.error || '', modal.notice || '')
  if (modal.type === 'request-detail') {
    const request = [...(state.quoteRequests || []), ...(state.myQuoteRequests || [])].find((item) => String(item.id) === String(modal.id))
    if (!request) return ''
    return renderRequestDetail(request, { state, requestOffers, requestOfferError })
  }
  if (modal.type === 'feed') return `<div class="modal-backdrop" data-action="backdrop-close"><section class="modal feed-modal" role="dialog" aria-modal="true"><button class="close-button" data-action="close-modal" aria-label="Cerrar">×</button><span class="modal-spark">✦</span><span class="eyebrow">FEED DE PACOTIZAR</span><h2>¿Puedes ser tú el siguiente?</h2><p>Tu negocio puede aparecer con información general de actividad, sin publicar datos privados del cliente.</p><div class="feed-rules"><span>${icons.check}</span><b>Solo compartimos actividad y valor total.</b><span>${icons.check}</span><b>No se publican notas ni datos del cliente.</b></div><button class="primary-button full-button" data-action="new-request">Publicar mi primera solicitud ${icons.arrow}</button></section></div>`
  if (modal.type === 'service') return `<div class="modal-backdrop" data-action="backdrop-close"><section class="modal" role="dialog" aria-modal="true"><div class="modal-header"><div><span class="eyebrow">CATÁLOGO DEL TALLER</span><h2>Agregar servicio</h2></div><button class="close-button" data-action="close-modal" aria-label="Cerrar">×</button></div><form id="service-form"><label>Nombre del servicio<input name="name" required placeholder="Ej. Cambio de aceite" /></label><label>Categoría<input name="category" placeholder="Mantenimiento, diagnóstico..." /></label><label>Precio predeterminado<input name="price" type="number" min="0" required placeholder="Ej. 150000" /></label><div class="modal-actions"><button class="secondary-button" type="button" data-action="close-modal">Cancelar</button><button class="primary-button" type="submit">Guardar servicio ${icons.arrow}</button></div></form></section></div>`
  if (modal.type === 'customer') return `<div class="modal-backdrop" data-action="backdrop-close"><section class="modal" role="dialog" aria-modal="true"><div class="modal-header"><div><span class="eyebrow">NUEVO REGISTRO</span><h2>Agregar cliente</h2></div><button class="close-button" data-action="close-modal" aria-label="Cerrar">×</button></div><form id="customer-form"><label>Nombre completo<input name="name" required placeholder="Ej. María Rodríguez" /></label><label>Teléfono<input name="phone" placeholder="310 555 0101" /></label><label>Vehículo<input name="vehicle" placeholder="Ej. Mazda CX-5 2020" /></label><div class="modal-actions"><button class="secondary-button" type="button" data-action="close-modal">Cancelar</button><button class="primary-button" type="submit">Guardar cliente ${icons.arrow}</button></div></form></section></div>`
  if (modal.type === 'detail') {
    const quote = state.quotes.find((item) => item.id === modal.id)
    if (!quote) return ''
    return `<div class="modal-backdrop" data-action="backdrop-close"><section class="modal detail-modal" role="dialog" aria-modal="true"><div class="modal-header"><div><span class="eyebrow">${escapeHtml(quote.id)}</span><h2>${escapeHtml(quote.customer)}</h2><p>${escapeHtml(quote.vehicle)} · creada ${escapeHtml(quote.date)}</p></div><button class="close-button" data-action="close-modal" aria-label="Cerrar">×</button></div><div class="detail-total"><span>Valor de la cotización</span><strong>${formatMoney(quote.amount)}</strong><em class="status status-${statusTone(quote.status)}"><i></i>${statusLabel(quote.status)}</em></div><div class="budget-summary"><b>Presupuesto sugerido por el cliente</b><span>${quote.budgetMin || quote.budgetMax ? `${formatMoney(quote.budgetMin || 0)} - ${formatMoney(quote.budgetMax || 0)}` : 'No especificado'}</span>${quote.budgetNotes ? `<small>${escapeHtml(quote.budgetNotes)}</small>` : ''}</div><div class="detail-items">${(quote.items || []).map((item) => `<div><span>${escapeHtml(item)}</span><b>Incluido</b></div>`).join('')}</div><div class="modal-actions">${canManage ? `<button class="secondary-button" data-action="duplicate-quote" data-id="${escapeHtml(quote.id)}">Duplicar</button>` : ''}<button class="primary-button" data-action="send-quote" data-id="${escapeHtml(quote.id)}">Enviar por WhatsApp ${icons.arrow}</button></div></section></div>`
  }
  if (modal.type === 'business') {
    const business = [...(state.featuredBusinesses || []), ...(state.customers || [])].find((item) => {
      const id = item?.workshop_id || item?.id
      return String(id) === String(modal.id)
    }) || { name: 'Negocio', category: 'Proveedor general', city: 'Bogotá', description: 'Proveedor activo en Pacotizar.', phone: 'Contacto disponible por solicitud' }
    return `<div class="modal-backdrop" data-action="backdrop-close"><section class="modal detail-modal" role="dialog" aria-modal="true"><div class="modal-header"><div><span class="eyebrow">PROVEEDOR</span><h2>${escapeHtml(business.name || 'Negocio')}</h2><p>${escapeHtml(business.category || 'Proveedor general')} · ${escapeHtml(business.city || 'Bogotá')}</p></div><button class="close-button" data-action="close-modal" aria-label="Cerrar">×</button></div><div class="detail-total"><span>Especialidad</span><strong>${escapeHtml(business.category || 'Proveedor general')}</strong><em class="status status-approved"><i></i>Disponible</em></div><div class="budget-summary"><b>Descripción</b><span>${escapeHtml(business.description || 'Proveedor activo en Pacotizar.')}</span><small>${escapeHtml(business.phone || 'Contacto disponible por solicitud')}</small></div><div class="detail-items"><div><span>Ciudad</span><b>${escapeHtml(business.city || 'Bogotá')}</b></div><div><span>Canal</span><b>Solicitud por Pacotizar</b></div></div><div class="modal-actions"><button class="secondary-button" data-action="close-modal">Cerrar</button><button class="primary-button" data-action="new-request">Solicitar presupuesto ${icons.arrow}</button></div></section></div>`
  }
  return `<div class="modal-backdrop" data-action="backdrop-close"><section class="modal" role="dialog" aria-modal="true"><p>${escapeHtml(initials(state.profile.name))}</p></section></div>`
}
