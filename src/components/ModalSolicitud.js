import { escapeHtml, icons } from '../utils/ui.js'

export function renderRequestModal(prefill = {}) {
  const titleValue = escapeHtml(prefill.title || '')
  const descriptionValue = escapeHtml(prefill.description || '')
  const locationValue = escapeHtml(prefill.location || '')
  const tagsValue = escapeHtml(Array.isArray(prefill.tags) ? prefill.tags.join(', ') : prefill.tags || '')
  const imageUrlsValue = escapeHtml(Array.isArray(prefill.image_urls) ? prefill.image_urls.join('\n') : prefill.image_urls || '')
  const selectedCategory = prefill.category || ''

  return `<div class="modal-backdrop" data-action="backdrop-close"><section class="modal modal-wide request-modal" role="dialog" aria-modal="true" aria-labelledby="request-modal-title"><div class="modal-header"><div><span class="eyebrow">PACOTIZAR / NUEVA SOLICITUD</span><h2 id="request-modal-title">¿Qué necesitas cotizar?</h2><p>Cuéntalo con tus palabras. La categoría es opcional.</p></div><button class="close-button" data-action="close-modal" aria-label="Cerrar">×</button></div><form id="request-form"><label>¿Qué necesitas cotizar?<input name="title" required minlength="5" maxlength="140" value="${titleValue}" placeholder="Ej. Una puerta metálica de 2 x 2 metros" /></label><label>Cuéntanos un poco más<textarea name="description" required minlength="10" maxlength="3000" rows="4" placeholder="Medidas, materiales, cantidades u otros detalles que ayuden a cotizar">${descriptionValue}</textarea></label><div class="form-grid"><label>Ubicación aproximada<input name="location" value="${locationValue}" placeholder="Ciudad o barrio" /></label><label>Presupuesto estimado (opcional)<input name="budget" type="number" min="0" step="1000" placeholder="COP" /></label><label>Categoría (opcional)<select name="category"><option value="" ${selectedCategory === '' ? 'selected' : ''}>Prefiero no elegir una</option><option value="vehiculos" ${selectedCategory === 'vehiculos' ? 'selected' : ''}>Vehículos</option><option value="motos" ${selectedCategory === 'motos' ? 'selected' : ''}>Motos</option><option value="obras" ${selectedCategory === 'obras' ? 'selected' : ''}>Obras y remodelación</option><option value="maquinaria" ${selectedCategory === 'maquinaria' ? 'selected' : ''}>Maquinaria y movimiento de tierra</option><option value="hogar" ${selectedCategory === 'hogar' ? 'selected' : ''}>Hogar y otros servicios</option></select></label><label>Etiquetas opcionales<input name="tags" value="${tagsValue}" placeholder="ventana, aluminio, instalación" /></label></div><label>Enlaces a fotografías (opcional)<textarea name="image-urls" rows="2" placeholder="Pega enlaces públicos a imágenes, uno por línea">${imageUrlsValue}</textarea><small class="form-hint">Por ahora se admiten enlaces públicos. La carga directa de fotos requiere configurar almacenamiento.</small><div class="modal-actions"><button class="secondary-button" type="button" data-action="close-modal">Cancelar</button><button class="primary-button" type="submit">Publicar solicitud ${icons.arrow}</button></div></form></section></div>`
}

export function requestFromForm(form) {
  const data = new FormData(form)
  return {
    title: String(data.get('title') || '').trim(),
    description: String(data.get('description') || '').trim(),
    location: String(data.get('location') || '').trim(),
    budget_amount: data.get('budget') ? Number(data.get('budget')) : null,
    category: String(data.get('category') || '').trim(),
    tags: String(data.get('tags') || '').split(',').map((tag) => tag.trim()).filter(Boolean).slice(0, 8),
    image_urls: String(data.get('image-urls') || '').split(/\n+/).map((url) => url.trim()).filter((url) => /^https:\/\//i.test(url)).slice(0, 4),
  }
}
