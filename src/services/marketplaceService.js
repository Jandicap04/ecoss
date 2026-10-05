import { getState, setState } from '../store/state.js'
import { getCurrentPlatformAdmin, supabase } from '../lib/supabase.js'

function createLocalId(prefix) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

export async function getQuoteRequests() {
  if (!supabase) return getState().quoteRequests
  const { data, error } = await supabase.rpc('get_open_quote_requests')
  if (error) throw new Error('No se pudieron cargar las solicitudes. Verifica la migración marketplace.sql y los permisos públicos.')
  return data || []
}

function normalizeRequest(row) {
  return {
    id: row.id,
    title: row.titulo,
    description: row.descripcion,
    location: row.ciudad,
    budget_amount: row.presupuesto,
    category: row.categoria,
    tags: row.etiquetas,
    image_urls: row.imagenes,
    status: row.estado,
    created_at: row.created_at,
  }
}

export async function getMyQuoteRequests() {
  if (!supabase) return getState().quoteRequests.filter((request) => request.requester_id === 'local-demo')
  const { data: { session }, error: authError } = await supabase.auth.getSession()
  if (authError) throw authError
  if (!session?.user) return []
  const { data, error } = await supabase.rpc('get_my_quote_requests')
  if (error) throw new Error('No se pudieron cargar tus solicitudes. Verifica los permisos de lectura en Supabase.')
  return (data || []).map((request) => ({
    id: request.id,
    title: request.title,
    description: request.description,
    location: request.location,
    budget_amount: request.budget_amount,
    category: request.category,
    tags: request.tags,
    image_urls: request.image_urls,
    status: request.status,
    created_at: request.created_at,
  }))
}

export async function createQuoteRequest(input) {
  const request = {
    title: String(input.title || '').trim(),
    description: String(input.description || '').trim(),
    location: String(input.location || '').trim(),
    budget_amount: input.budget_amount ? Number(input.budget_amount) : null,
    category: String(input.category || '').trim() || null,
    tags: Array.isArray(input.tags) ? input.tags : [],
    image_urls: Array.isArray(input.image_urls) ? input.image_urls : [],
  }
  if (!request.title || !request.description) throw new Error('Escribe qué necesitas cotizar y agrega una descripción.')

  if (supabase) {
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    if (authError) throw authError
    if (!session?.user) throw new Error('Inicia sesión para publicar una solicitud.')
    const { data, error } = await supabase
      .from('solicitudes_cotizacion')
      .insert({
        solicitante_id: session.user.id,
        titulo: request.title,
        descripcion: request.description,
        ciudad: request.location,
        presupuesto: request.budget_amount,
        categoria: request.category,
        etiquetas: request.tags,
        imagenes: request.image_urls,
      })
      .select('id,titulo,descripcion,ciudad,presupuesto,categoria,etiquetas,imagenes,estado,created_at')
      .single()
    if (!error) {
      return normalizeRequest(data)
    }
    throw new Error('No se pudo publicar la solicitud. Verifica que la migración marketplace.sql esté aplicada.')
  }

  const localRequest = {
    ...request,
    id: createLocalId('SOL'),
    requester_id: 'local-demo',
    status: 'open',
    created_at: new Date().toISOString(),
    localOnly: true,
  }
  setState((state) => ({ quoteRequests: [localRequest, ...state.quoteRequests] }))
  return localRequest
}

export async function getRequestOffers(requestId) {
  if (!supabase) {
    return getState().requestOffers.filter((offer) => String(offer.request_id) === String(requestId))
  }
  const { data: { session }, error: authError } = await supabase.auth.getSession()
  if (authError) throw authError
  if (!session?.user) throw new Error('Inicia sesión para consultar las propuestas de esta solicitud.')
  const { data, error } = await supabase
    .from('request_offers')
    .select('id,request_id,amount,message,status,created_at')
    .eq('request_id', requestId)
    .order('created_at', { ascending: false })
  if (error) throw new Error('No se pudieron cargar las propuestas. Verifica la migración marketplace.sql y los permisos.')
  return data || []
}

export async function createRequestOffer({ requestId, amount, message }) {
  const offer = {
    request_id: requestId,
    amount: Number(amount),
    message: String(message || '').trim(),
  }
  if (!offer.request_id || !Number.isFinite(offer.amount) || offer.amount <= 0 || offer.message.length < 10 || offer.message.length > 1000) {
    throw new Error('Indica un valor mayor que cero y un mensaje de entre 10 y 1000 caracteres.')
  }

  if (supabase) {
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    if (authError) throw authError
    if (!session?.user) throw new Error('Inicia sesión para enviar una propuesta.')
    const { data, error } = await supabase
      .from('request_offers')
      .upsert({ ...offer, provider_id: session.user.id }, { onConflict: 'request_id,provider_id' })
      .select('id,request_id,amount,message,status,created_at')
      .single()
    if (error) throw new Error('No se pudo enviar la propuesta. Puede que sea tu propia solicitud o que la migración marketplace.sql no esté aplicada.')
    return data
  }

  const localOffer = {
    ...offer,
    provider_id: 'local-demo',
    id: createLocalId('PROP'),
    status: 'pending',
    created_at: new Date().toISOString(),
    localOnly: true,
  }
  setState((state) => ({
    requestOffers: [localOffer, ...state.requestOffers.filter((item) => !(String(item.request_id) === String(requestId) && item.provider_id === 'local-demo'))],
  }))
  return localOffer
}

export async function setQuoteRequestStatus(requestId, status) {
  if (!['open', 'closed'].includes(status)) throw new Error('Estado de solicitud no válido.')
  if (supabase) {
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    if (authError) throw authError
    if (!session?.user) throw new Error('Inicia sesión para administrar tus solicitudes.')
    const { error } = await supabase.rpc('set_quote_request_status', {
      p_request_id: requestId,
      p_status: status,
    })
    if (error) throw new Error('No se pudo actualizar la solicitud. Comprueba que eres su autor y que marketplace.sql está aplicado.')
    return
  }
  const request = getState().quoteRequests.find((item) => String(item.id) === String(requestId))
  if (!request || request.requester_id !== 'local-demo') throw new Error('Solo puedes administrar tus propias solicitudes.')
  setState((state) => ({
    quoteRequests: state.quoteRequests.map((item) => String(item.id) === String(requestId) ? { ...item, status } : item),
  }))
}

export async function respondToRequestOffer(offerId, status) {
  if (!['accepted', 'declined'].includes(status)) throw new Error('Respuesta a la propuesta no válida.')
  if (supabase) {
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    if (authError) throw authError
    if (!session?.user) throw new Error('Inicia sesión para responder propuestas.')
    const { error } = await supabase.rpc('respond_to_request_offer', {
      p_offer_id: offerId,
      p_status: status,
    })
    if (error) throw new Error('No se pudo responder a la propuesta. Comprueba que eres el autor de la solicitud y que sigue abierta.')
    return
  }
  const target = getState().requestOffers.find((item) => item.id === offerId)
  if (!target) throw new Error('No encontramos esa propuesta.')
  setState((state) => ({
    requestOffers: state.requestOffers.map((offer) => {
      if (offer.request_id !== target.request_id) return offer
      if (offer.id === offerId) return { ...offer, status }
      return status === 'accepted' && offer.status === 'pending' ? { ...offer, status: 'declined' } : offer
    }),
    quoteRequests: status === 'accepted'
      ? state.quoteRequests.map((request) => String(request.id) === String(target.request_id) ? { ...request, status: 'closed' } : request)
      : state.quoteRequests,
  }))
}

export async function getFeaturedBusinesses() {
  if (!supabase) return getState().featuredBusinesses
  const { data, error } = await supabase.rpc('get_featured_businesses')
  if (error) throw new Error('No se pudieron cargar los proveedores destacados. Verifica schema.sql y los permisos públicos.')
  return data || []
}

export async function getBusinessesForAdmin() {
  const { isAdmin } = await getCurrentPlatformAdmin()
  if (!isAdmin || !supabase) throw new Error('Acceso reservado al administrador de la plataforma.')
  const [businessResult, featuredResult] = await Promise.all([
    supabase.from('workshops').select('id,name,city,logo_url').order('name'),
    supabase.from('featured_businesses').select('workshop_id,is_active,sort_order,category,description'),
  ])
  if (businessResult.error || featuredResult.error) {
    throw new Error('No se pudieron cargar los negocios. Verifica la migración marketplace.sql y los permisos RLS.')
  }
  const featuredByWorkshop = new Map(featuredResult.data.map((item) => [item.workshop_id, item]))
  return businessResult.data.map((business) => ({
    ...business,
    featured: featuredByWorkshop.get(business.id) || null,
  }))
}

export async function saveFeaturedBusiness(workshopId, settings) {
  const { isAdmin } = await getCurrentPlatformAdmin()
  if (!isAdmin || !supabase) throw new Error('Solo un administrador autenticado puede editar los destacados.')
  const { data, error } = await supabase.from('negocios_destacados').upsert({
    workshop_id: workshopId,
    activo: Boolean(settings.is_active),
    orden: Math.max(0, Number(settings.sort_order) || 0),
    categoria: String(settings.category || '').trim() || null,
    descripcion: String(settings.description || '').trim() || null,
  }, { onConflict: 'workshop_id' }).select('workshop_id,activo,orden,categoria,descripcion').single()
  if (error) throw new Error('No se pudo guardar el destacado. Verifica los permisos de administrador.')
  return data
}
