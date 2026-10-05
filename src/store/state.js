const STORAGE_KEY = 'cotizarapido-mvp'
const LEGACY_STORAGE_KEYS = ['pacotizar-workspace-v2']

const initialState = {
  user: null,
  workshop_id: null,
  role: 'owner',
  profile: { name: 'Usuario', workshop: 'Mi negocio', city: '', phone: '', initials: '' },
  quotes: [],
  customers: [],
  services: [],
  quoteRequests: [],
  myQuoteRequests: [],
  requestOffers: [],
  featuredBusinesses: [],
}

function buildDemoState() {
  const demoQuotes = [
    { id: 'Q-1001', customer: 'María G.', phone: '3001122334', vehicle: 'Toyota Corolla', plate: 'ABC-123', amount: 2450000, status: 'approved', date: 'Hoy', items: ['Diagnóstico', 'Cambio de frenos'] },
    { id: 'Q-1002', customer: 'Luis P.', phone: '3109988776', vehicle: 'Chevrolet Spark', plate: 'XYZ-456', amount: 1320000, status: 'pending', date: 'Ayer', items: ['Mantenimiento general'] },
    { id: 'Q-1003', customer: 'Ana R.', phone: '3156677889', vehicle: 'Renault Logan', plate: 'DEF-789', amount: 860000, status: 'sent', date: 'Hace 2 días', items: ['Alineación'] },
  ]

  const demoServices = [
    { id: 'SV-1', name: 'Diagnóstico electrónico', category: 'Diagnóstico', price: 180000, used: 12 },
    { id: 'SV-2', name: 'Cambio de frenos', category: 'Frenos', price: 640000, used: 8 },
    { id: 'SV-3', name: 'Mantenimiento general', category: 'Servicio', price: 420000, used: 14 },
    { id: 'SV-4', name: 'Alineación y balanceo', category: 'Alineación', price: 280000, used: 9 },
  ]

  const demoCustomers = [
    { id: 'CL-1', name: 'Sofía Torres', phone: '3002233445', vehicle: 'Volkswagen Gol', visits: 4, value: 1800000 },
    { id: 'CL-2', name: 'Camilo Ruiz', phone: '3015566778', vehicle: 'Mazda 2', visits: 2, value: 960000 },
    { id: 'CL-3', name: 'Daniela F.', phone: '3201122334', vehicle: 'Kia Rio', visits: 3, value: 1340000 },
  ]

  const demoQuoteRequests = [
    { id: 'SOL-100', title: 'Necesito cambio de frenos', description: 'Busco un taller con garantía para cambiar frenos delanteros y revisar discos.', location: 'Bogotá', budget_amount: 1400000, category: 'Frenos', tags: ['frenos', 'seguridad'], image_urls: [], status: 'open', created_at: new Date().toISOString(), localOnly: true },
    { id: 'SOL-101', title: 'Mantenimiento general de auto', description: 'Revisión completa para un vehículo familiar con cambio de filtros y revisión de aceite.', location: 'Medellín', budget_amount: 980000, category: 'Mantenimiento', tags: ['mantenimiento', 'servicio'], image_urls: [], status: 'open', created_at: new Date(Date.now() - 86400000).toISOString(), localOnly: true },
    { id: 'SOL-102', title: 'Alineación para vehículo de trabajo', description: 'Necesito servicio rápido, con disponibilidad habitual y atención por WhatsApp.', location: 'Cali', budget_amount: 350000, category: 'Alineación', tags: ['alineación', 'rapido'], image_urls: [], status: 'open', created_at: new Date(Date.now() - 172800000).toISOString(), localOnly: true },
  ]

  const demoFeaturedBusinesses = [
    { workshop_id: 'ws-1', name: 'MotoFix Bogotá', city: 'Bogotá', category: 'Mecánica general', description: 'Especialistas en servicio rápido, cambios de frenos y revisión vehicular.', logo_url: '', featured: true },
    { workshop_id: 'ws-2', name: 'AlineaMax', city: 'Medellín', category: 'Alineación y suspensión', description: 'Atención ágil para vehículos particulares y flotas.', logo_url: '', featured: true },
    { workshop_id: 'ws-3', name: 'AutoCare Plus', city: 'Cali', category: 'Mantenimiento integral', description: 'Revisión completa y servicios preventivos para tu vehículo.', logo_url: '', featured: true },
  ]

  return {
    ...initialState,
    profile: { ...initialState.profile, name: 'Usuario', workshop: 'Mi negocio', city: 'Bogotá', phone: '3001234567', initials: 'US' },
    quotes: demoQuotes,
    customers: demoCustomers,
    services: demoServices,
    quoteRequests: demoQuoteRequests,
    featuredBusinesses: demoFeaturedBusinesses,
  }
}

function readStoredState() {
  for (const key of [STORAGE_KEY, ...LEGACY_STORAGE_KEYS]) {
    try {
      const stored = JSON.parse(localStorage.getItem(key))
      if (stored && typeof stored === 'object') return stored
    } catch {
      continue
    }
  }
  return null
}

function normalizeState(stored = {}) {
  const profile = { ...initialState.profile, ...(stored.profile || {}) }
  return {
    ...initialState,
    ...stored,
    user: stored.user ?? null,
    workshop_id: stored.workshop_id ?? stored.workshopId ?? null,
    role: stored.role || initialState.role,
    profile,
    quotes: Array.isArray(stored.quotes) ? stored.quotes : [],
    customers: Array.isArray(stored.customers) ? stored.customers : [],
    services: Array.isArray(stored.services) ? stored.services : [],
    quoteRequests: Array.isArray(stored.quoteRequests) ? stored.quoteRequests : [],
    myQuoteRequests: Array.isArray(stored.myQuoteRequests) ? stored.myQuoteRequests : [],
    requestOffers: Array.isArray(stored.requestOffers) ? stored.requestOffers : [],
    featuredBusinesses: Array.isArray(stored.featuredBusinesses) ? stored.featuredBusinesses : [],
  }
}

let state = normalizeState(readStoredState() || buildDemoState())
const listeners = new Set()

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // Storage can be unavailable in private browsing or quota-limited contexts.
  }
}

export function getState() {
  return state
}

export function setState(update) {
  const patch = typeof update === 'function' ? update(state) : update
  if (!patch || typeof patch !== 'object') return state
  state = normalizeState({ ...state, ...patch, profile: { ...state.profile, ...(patch.profile || {}) } })
  persist()
  listeners.forEach((listener) => listener(state))
  return state
}

export function subscribe(listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function resetState() {
  state = normalizeState(buildDemoState())
  try {
    localStorage.removeItem(STORAGE_KEY)
    LEGACY_STORAGE_KEYS.forEach((key) => localStorage.removeItem(key))
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // The in-memory state is still reset when storage is unavailable.
  }
  listeners.forEach((listener) => listener(state))
  return state
}

export const storageKey = STORAGE_KEY
