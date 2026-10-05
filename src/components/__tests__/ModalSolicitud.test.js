import test from 'node:test'
import assert from 'node:assert/strict'
import { renderRequestModal } from '../ModalSolicitud.js'
import { filterProviders, sortProviders } from '../../views/Clientes.js'

test('renderRequestModal prefill keeps the selected provider context', () => {
  const html = renderRequestModal({
    title: 'Puerta metálica para local',
    location: 'Bogotá',
    category: 'obras',
  })

  assert.match(html, /name="title"[^>]*value="Puerta metálica para local"/s)
  assert.match(html, /name="location"[^>]*value="Bogotá"/s)
  assert.match(html, /value="obras"/s)
})

test('filterProviders matches category and city search together', () => {
  const providers = [
    { name: 'Sofía Torres', city: 'Bogotá', category: 'Proveedor general' },
    { name: 'Luis Gómez', city: 'Medellín', category: 'Mantenimiento' },
    { name: 'Carolina Díaz', city: 'Bogotá', category: 'Mantenimiento' },
  ]

  const result = filterProviders(providers, 'bogotá', 'mantenimiento')

  assert.deepEqual(result.map((provider) => provider.name), ['Carolina Díaz'])
})

test('sortProviders prioritizes the most relevant provider first', () => {
  const providers = [
    { name: 'Alicia', city: 'Bogotá', category: 'Proveedor general', visits: 2 },
    { name: 'Bruno', city: 'Cali', category: 'Mantenimiento', visits: 8 },
    { name: 'Carmen', city: 'Medellín', category: 'Proveedor general', visits: 4 },
  ]

  const result = sortProviders(providers, 'relevance')

  assert.deepEqual(result.map((provider) => provider.name), ['Bruno', 'Carmen', 'Alicia'])
})
