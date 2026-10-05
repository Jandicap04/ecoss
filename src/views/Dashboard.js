import { escapeHtml, formatCompact, formatMoney, icons, statusLabel, statusTone, today } from '../utils/ui.js'
import { renderCommunityFeed } from '../components/FeedComunidad.js'
import { renderFeaturedBusinesses } from '../components/NegociosDestacados.js'

function requestRow(request) {
  return `
    <article class="feed-item">
      <span class="feed-avatar">P</span>
      <div>
        <b>${escapeHtml(request.title || 'Solicitud abierta')}</b>
        <p>${escapeHtml(request.location || 'Ubicación no indicada')} · ${escapeHtml(request.category || 'General')}</p>
      </div>
      <small>${escapeHtml(request.budget_amount ? formatMoney(request.budget_amount) : 'Presupuesto libre')}</small>
    </article>
  `
}

export function renderDashboard({ state, marketplaceError = '' }) {
  const userName = (state.profile?.name || 'Usuario').trim().split(/\s+/)[0] || 'usuario'
  const openRequests = Array.isArray(state.quoteRequests) ? state.quoteRequests : []
  const featuredBusinesses = Array.isArray(state.featuredBusinesses) ? state.featuredBusinesses : []
  const requestsWithBudget = openRequests.filter((request) => Number(request.budget_amount) > 0).length
  const totalBudget = openRequests.reduce((sum, request) => sum + (Number(request.budget_amount) || 0), 0)
  const budgetCoverageRate = Math.round((requestsWithBudget / Math.max(openRequests.length, 1)) * 100)

  const requestCards = openRequests.slice(0, 4).map((request) => requestRow(request)).join('')
  const featuredCards = renderFeaturedBusinesses(featuredBusinesses.slice(0, 3))

  return `
    ${marketplaceError ? `<div class="marketplace-error" role="alert"><span>${escapeHtml(marketplaceError)}</span><button class="secondary-button" data-action="retry-marketplace">Reintentar</button></div>` : ''}
    <section class="page-heading page-heading-dashboard">
      <div>
        <p class="eyebrow">${today()} · MERCADO ACTIVO</p>
        <h1>Buenos días, ${escapeHtml(userName)} <span class="wave">✦</span></h1>
        <p class="heading-subtitle">Publica necesidades y conecta con proveedores relevantes.</p>
      </div>
      <button class="primary-button" data-action="new-request">${icons.plus}<span>Publicar solicitud</span></button>
    </section>

    <div class="metric-grid">
      <article class="metric-card">
        <div class="metric-top"><span class="metric-icon orange">${icons.file}</span><span class="metric-change neutral-change">Marketplace</span></div>
        <span class="metric-label">Solicitudes activas</span>
        <strong>${openRequests.length}</strong>
        <span class="metric-foot">Nuevas oportunidades en el mercado</span>
      </article>
      <article class="metric-card">
        <div class="metric-top"><span class="metric-icon green">${icons.check}</span><span class="metric-change neutral-change">Abiertas</span></div>
        <span class="metric-label">Con presupuesto</span>
        <strong>${requestsWithBudget}</strong>
        <span class="metric-foot">Solicitudes con presupuesto indicado</span>
      </article>
      <article class="metric-card">
        <div class="metric-top"><span class="metric-icon blue">${icons.arrow}</span><span class="metric-change neutral-change">Abiertas</span></div>
        <span class="metric-label">Presupuesto total</span>
        <strong>${formatCompact(totalBudget)}</strong>
        <span class="metric-foot">Suma de presupuestos publicados</span>
      </article>
      <article class="metric-card">
        <div class="metric-top"><span class="metric-icon purple">${icons.users}</span><span class="metric-change neutral-change">Activos</span></div>
        <span class="metric-label">Proveedores visibles</span>
        <strong>${featuredBusinesses.length}</strong>
        <span class="metric-foot">Negocios activos en Pacotizar</span>
      </article>
    </div>

    <div class="dashboard-grid">
      <section class="surface recent-surface">
        <div class="surface-heading">
          <div><h2>Solicitudes abiertas</h2><p>Lo que la gente está buscando cotizar.</p></div>
          <button class="link-button" data-action="new-request">Publicar ahora ${icons.arrow}</button>
        </div>
        <div class="quote-header"><span>TÍTULO</span><span>UBICACIÓN</span><span>PRESUPUESTO</span><span>TIPO</span></div>
        <div id="all-quotes">${requestCards || '<div class="empty-row">Aún no hay solicitudes abiertas. Sé el primero en publicar una necesidad.</div>'}</div>
      </section>

      <section class="surface stats-surface">
        <div class="surface-heading">
          <div><h2>Estado del mercado</h2><p>Comparativa rápida de actividad.</p></div>
          <button class="icon-btn" aria-label="Más opciones">•••</button>
        </div>
        <div class="conversion-ring"><strong>${budgetCoverageRate}%</strong><span>con presupuesto</span></div>
        <div class="conversion-list">
          <div><span>Abiertas</span><b>${openRequests.length}</b></div>
          <div><span>Con presupuesto</span><b>${requestsWithBudget}</b></div>
          <div><span>Sin presupuesto</span><b>${openRequests.length - requestsWithBudget}</b></div>
        </div>
      </section>
    </div>

    <div class="dashboard-grid bottom-grid">
      <section class="surface chart-surface">
        <div class="surface-heading">
          <div><h2>Negocios destacados</h2><p>Proveedores visibles para tus solicitudes.</p></div>
          <button class="link-button">Ver mercado ${icons.arrow}</button>
        </div>
        ${featuredCards}
      </section>

      <section class="surface checklist-surface">
        <div class="surface-heading">
          <div><h2>Siguiente paso</h2><p>Completa tu configuración del marketplace.</p></div>
        </div>
        <div class="checklist-progress">
          <strong>75%</strong>
          <div>
            <h3>Tu presencia está casi lista</h3>
            <p>Falta configurar tu perfil, catálogo y primera solicitud.</p>
            <button class="secondary-button" data-action="new-request">Completar ahora ${icons.arrow}</button>
          </div>
        </div>
        <div class="checklist-items">
          <div class="check-item done"><span>${icons.check}</span><div><b>Perfil del negocio</b><small>Completado</small></div></div>
          <div class="check-item done"><span>${icons.check}</span><div><b>Primera solicitud</b><small>Listo para publicar</small></div></div>
        </div>
      </section>
    </div>

    ${renderCommunityFeed(openRequests)}
  `
}
