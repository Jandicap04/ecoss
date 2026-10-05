import { escapeHtml, icons } from '../utils/ui.js'

export function renderAdminPrincipal({ role, businesses = [], state, adminError = '' }) {
  if (role !== 'administrator') {
    return '<section class="surface empty-admin"><span class="empty-feed-icon">!</span><h2>Acceso restringido</h2><p>Esta vista está disponible únicamente para el administrador principal de la plataforma.</p></section>'
  }

  const activeFeatured = businesses.filter((business) => business.featured && business.featured.is_active).length
  const totalBusinesses = businesses.length
  const totalRequests = Array.isArray(state?.quoteRequests) ? state.quoteRequests.length : 0

  const businessMarkup = businesses.length
    ? businesses.map((business) => {
        const featured = business.featured
        return `<article class="featured-business admin-business" data-workshop-id="${escapeHtml(business.id)}"><div class="featured-business-brand">${business.logo_url ? `<img src="${escapeHtml(business.logo_url)}" alt="Logo de ${escapeHtml(business.name || 'Negocio')}" loading="lazy" />` : `<span class="featured-logo-fallback">${escapeHtml((business.name || 'P').trim().slice(0, 2).toUpperCase()) || 'P'}</span>`}<span class="featured-label">${featured && featured.is_active ? 'DESTACADO' : 'ACTIVO'}</span></div><h3>${escapeHtml(business.name || 'Negocio')}</h3><p class="featured-category">${escapeHtml(business.city || 'Ubicación no definida')}</p><label class="admin-featured-active"><input type="checkbox" data-featured-active ${featured && featured.is_active ? 'checked' : ''} /> Mostrar en negocios destacados</label><label class="admin-featured-field">Categoría destacada<input data-featured-category maxlength="100" value="${escapeHtml(featured?.category || '')}" placeholder="Ej. Reparaciones del hogar" /></label><label class="admin-featured-field">Descripción<textarea data-featured-description maxlength="240" rows="3" placeholder="Describe brevemente el negocio">${escapeHtml(featured?.description || '')}</textarea></label><label class="admin-featured-field">Orden<input data-featured-order type="number" min="0" step="1" value="${Number(featured?.sort_order) || 0}" /></label><button class="primary-button" data-action="save-featured">${icons.check}<span>Guardar destacado</span></button></article>`
      }).join('')
    : '<div class="empty-feed"><span class="empty-feed-icon">✦</span><h3>No hay negocios conectados</h3><p>Aún no se han sincronizado talleres con la plataforma. La vista se llenará cuando se registren proveedores reales.</p></div>'

  return `
    <section class="page-heading">
      <div>
        <p class="eyebrow">PLATAFORMA / CONTROL CENTRAL</p>
        <h1>Admin principal</h1>
        <p class="heading-subtitle">Monitorea el marketplace y la visibilidad de los negocios asociados.</p>
      </div>
      <button class="primary-button" data-action="connect-gmail">${icons.arrow}<span>Conectar Gmail</span></button>
    </section>

    <div class="metric-grid">
      <article class="metric-card">
        <div class="metric-top"><span class="metric-icon orange">${icons.users}</span><span class="metric-change up">↗ 0%</span></div>
        <span class="metric-label">Negocios</span>
        <strong>${totalBusinesses}</strong>
        <span class="metric-foot">Talleres activos en Pacotizar</span>
      </article>
      <article class="metric-card">
        <div class="metric-top"><span class="metric-icon green">${icons.check}</span><span class="metric-change up">↗ 0%</span></div>
        <span class="metric-label">Destacados</span>
        <strong>${activeFeatured}</strong>
        <span class="metric-foot">Negocios visibles en el mercado</span>
      </article>
      <article class="metric-card">
        <div class="metric-top"><span class="metric-icon purple">${icons.file}</span><span class="metric-change neutral-change">•</span></div>
        <span class="metric-label">Solicitudes</span>
        <strong>${totalRequests}</strong>
        <span class="metric-foot">Seguimiento de la operación</span>
      </article>
    </div>

    <section class="surface">
      ${adminError ? `<div class="marketplace-error" role="alert"><span>${escapeHtml(adminError)}</span><button class="secondary-button" data-action="retry-admin">Reintentar</button></div>` : ''}
      <div class="surface-heading">
        <div>
          <h2>Negocios de la plataforma</h2>
          <p>Revisa qué talleres están activos y cuáles están visibles en el marketplace.</p>
        </div>
        <button class="secondary-button" data-action="admin-guide">Ver guía ${icons.arrow}</button>
      </div>
      <div class="featured-business-grid">${businessMarkup}</div>
    </section>
  `
}
