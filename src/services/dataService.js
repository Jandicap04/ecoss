import { getState, setState } from '../store/state.js'

function makeId(prefix) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
}

export async function getQuotes() {
  return [...getState().quotes]
}

export async function createQuote(quote) {
  const saved = { ...quote, id: quote.id || makeId('CR') }
  setState((state) => ({ quotes: [saved, ...state.quotes] }))
  return saved
}

export async function updateQuote(id, updates) {
  let updated
  setState((state) => ({
    quotes: state.quotes.map((quote) => {
      if (quote.id !== id) return quote
      updated = { ...quote, ...updates }
      return updated
    }),
  }))
  return updated || null
}

export async function getClients() {
  return [...getState().customers]
}

export async function createClient(client) {
  const saved = { ...client, id: client.id || makeId('CL') }
  setState((state) => ({ customers: [saved, ...state.customers] }))
  return saved
}

export async function deleteClient(id) {
  setState((state) => ({ customers: state.customers.filter((client) => client.id !== id && client.name !== id) }))
}

export async function getServices() {
  return [...getState().services]
}

export async function createService(service) {
  const saved = { ...service, id: service.id || makeId('SV') }
  setState((state) => ({ services: [saved, ...state.services] }))
  return saved
}

export async function updateWorkshopProfile(profile) {
  setState((state) => ({ profile: { ...state.profile, ...profile } }))
  return getState().profile
}
