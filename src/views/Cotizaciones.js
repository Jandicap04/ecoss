import { escapeHtml, formatMoney, icons, statusLabel, statusTone } from '../utils/ui.js'

export function renderQuoteRow(quote) {
  return `<button class="quote-row quote-row-full" data-action="quote-detail" data-id="${escapeHtml(quote.id)}"><span class="customer-cell"><span class="customer-avatar">${escapeHtml((quote.customer || 'PT').trim().slice(0, 2).toUpperCase())}</span><span><b>${escapeHtml(quote.customer)}</b><small>${escapeHtml(quote.id)}</small></span></span><span>${escapeHtml(quote.vehicle)}</span><span>${escapeHtml(quote.date)}</span><strong>${formatMoney(quote.amount)}</strong><span><em class="status status-${statusTone(quote.status)}"><i></i>${statusLabel(quote.status)}</em></span><span class="row-arrow">${icons.arrow}</span></button>`
}

export function renderQuoteRows(quotes) {
  return quotes.map(renderQuoteRow).join('')
}

export function renderQuotes({ quotes }) {
  return `<section class="page-heading"><div><p class="eyebrow">OPERACIÓN / COTIZACIONES</p><h1>Tus cotizaciones</h1><p class="heading-subtitle">Crea, envía y haz seguimiento sin perder oportunidades.</p></div><button class="primary-button" data-action="new-quote">${icons.plus}<span>Nueva cotización</span></button></section><div class="toolbar"><div class="search-box">${icons.search}<input id="quote-search" placeholder="Buscar por cliente o vehículo" /></div><div class="filter-tabs"><button class="filter-tab active">Todas <span>${quotes.length}</span></button><button class="filter-tab">Pendientes <span>${quotes.filter((quote) => quote.status === 'pending').length}</span></button><button class="filter-tab">Aprobadas</button></div></div><section class="surface full-table"><div class="table-head"><span>CLIENTE</span><span>VEHÍCULO</span><span>FECHA</span><span>VALOR</span><span>ESTADO</span><span></span></div><div id="all-quotes">${renderQuoteRows(quotes)}</div></section>`
}
