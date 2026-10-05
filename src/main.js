import './style.css'
import { createRouter } from './router/router.js'

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js'))
}

const router = createRouter()
router.start()