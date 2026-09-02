import './style.css'

document.querySelector('#app').innerHTML = `
  <main class="shell">
    <header class="topbar">
      <div class="brand"><span class="brand-mark">◌</span><span>ECHO LOOP</span></div>
      <div class="run-type"><span class="live-dot"></span><span id="mode-label">RUN 001</span></div>
      <button class="icon-button" id="sound-button" aria-label="Activar o silenciar sonido">◒</button>
    </header>
    <section class="hud" aria-label="Estado de la partida">
      <div><span class="hud-label">TIEMPO</span><strong id="time">00.0</strong></div>
      <div class="hud-center"><span class="hud-label">RÉCORD</span><strong id="best">00.0</strong></div>
      <div class="hud-right"><span class="hud-label">PODER · <span id="power-status">--</span></span><strong id="echo-count">0</strong></div>
    </section>
    <section class="skin-strip" aria-label="Skins desbloqueables">
      <div class="skin-title"><span class="hud-label">SKINS</span><strong id="currency">0⌁</strong></div>
      <div class="skin-list" id="skin-list"></div>
    </section>
    <section class="game-wrap">
      <canvas id="game" aria-label="Área de juego. Mueve el puntero para controlar tu círculo."></canvas>
      <div class="game-message" id="message">
        <span class="eyebrow">PROTOCOLO DE SUPERVIVENCIA</span>
        <h1>HUYE DE<br><em>TU PASADO.</em></h1>
        <p>Mueve el puntero. Tu eco llega en 5 segundos.</p>
        <button class="primary-button" id="start-button"><span>INICIAR RUN</span><span>→</span></button>
      </div>
      <div class="power-panel" id="power-panel" hidden>
        <span class="eyebrow">NUEVA MUTACIÓN</span>
        <h2>Elige tu ventaja</h2>
        <div class="power-grid" id="power-grid"></div>
      </div>
    </section>
    <footer class="footer"><span>ARRASTRA PARA MOVERTE</span><span id="daily-label">MODO DIARIO · DISPONIBLE</span></footer>
  </main>
`

const canvas = document.querySelector('#game')
const context = canvas.getContext('2d')
const timeElement = document.querySelector('#time')
const bestElement = document.querySelector('#best')
const echoCountElement = document.querySelector('#echo-count')
const powerStatusElement = document.querySelector('#power-status')
const message = document.querySelector('#message')
const powerPanel = document.querySelector('#power-panel')
const powerGrid = document.querySelector('#power-grid')
const startButton = document.querySelector('#start-button')
const soundButton = document.querySelector('#sound-button')
const skinList = document.querySelector('#skin-list')
const currencyElement = document.querySelector('#currency')

const delay = 5
const playerRadius = 10
const powers = [
  { id: 'slow', title: 'FRENO DE FANTASMAS', text: 'Los ecos se ralentizan durante 3 segundos.', icon: '↓' },
  { id: 'ink', title: 'TINTA VIVA', text: 'Tu rastro frena a cualquier eco que lo cruce.', icon: '✦' },
  { id: 'invert', title: 'ESPEJO ROTO', text: 'Los ecos invierten su dirección durante 2 segundos.', icon: '↔' },
]
const skins = [
  { id: 'retro', name: 'RETRO', price: 0, core: '#20a4ff', edge: '#b8e9ff' },
  { id: 'plasma', name: 'PLASMA', price: 20, core: '#a855f7', edge: '#f0abfc' },
  { id: 'candy', name: 'CANDY', price: 40, core: '#f472b6', edge: '#ffe4f3' },
  { id: 'matrix', name: 'MATRIX', price: 70, core: '#52d11c', edge: '#d4ff7c' },
  { id: 'glitch', name: 'GLITCH', price: 100, core: '#f43f5e', edge: '#22d3ee' },
  { id: 'void', name: 'VOID', price: 140, core: '#241238', edge: '#c084fc' },
  { id: 'laser', name: 'LASER', price: 190, core: '#e11d48', edge: '#fb7185' },
  { id: 'gold', name: 'GOLD', price: 250, core: '#e19b18', edge: '#fff0a8' },
  { id: 'nebula', name: 'NEBULA', price: 320, core: '#5b21b6', edge: '#e9d5ff' },
  { id: 'firewall', name: 'FIREWALL', price: 400, core: '#ea580c', edge: '#fed7aa' },
  { id: 'frost', name: 'FROST', price: 500, core: '#0ea5e9', edge: '#dff8ff' },
  { id: 'toxic', name: 'TOXIC', price: 650, core: '#3f9d16', edge: '#b8ff5b' },
]

let width = 0
let height = 0
let player = { x: 0, y: 0, targetX: 0, targetY: 0 }
let history = []
let echoes = []
let particles = []
let trails = []
let traps = []
let idleFor = 0
let arena = { left: 20, top: 20, right: 0, bottom: 0 }
let running = false
let startTime = 0
let lastFrame = 0
let elapsedTime = 0
let nextPatternAt = 10
let nextDecoyAt = 1
let nextPowerAt = 20
let best = Number(localStorage.getItem('echo-loop-best') || 0)
let currency = Number(localStorage.getItem('echo-loop-currency') || 0)
let unlockedSkins = JSON.parse(localStorage.getItem('echo-loop-skins') || '["retro"]')
let selectedSkin = localStorage.getItem('echo-loop-selected-skin') || 'retro'
let activePower = null
let powerUntil = 0

bestElement.textContent = best.toFixed(1).padStart(4, '0')
updateSkinStore()

function updateSkinStore() {
  currencyElement.textContent = `${currency}⌁`
  skinList.innerHTML = skins.map((skin) => {
    const unlocked = unlockedSkins.includes(skin.id)
    const selected = selectedSkin === skin.id
    const label = selected ? 'USANDO' : unlocked ? 'ELEGIR' : `${skin.price}⌁`
    return `<button class="skin-chip ${selected ? 'selected' : ''}" data-skin="${skin.id}" style="--skin-core:${skin.core};--skin-edge:${skin.edge}" title="${skin.name}"><span class="skin-orb"></span><span>${skin.name}</span><small>${label}</small></button>`
  }).join('')
  skinList.querySelectorAll('.skin-chip').forEach((button) => button.addEventListener('click', () => {
    const skin = skins.find((item) => item.id === button.dataset.skin)
    if (!unlockedSkins.includes(skin.id)) {
      if (currency < skin.price) return
      currency -= skin.price
      unlockedSkins.push(skin.id)
    }
    selectedSkin = skin.id
    localStorage.setItem('echo-loop-currency', currency)
    localStorage.setItem('echo-loop-skins', JSON.stringify(unlockedSkins))
    localStorage.setItem('echo-loop-selected-skin', selectedSkin)
    updateSkinStore()
  }))
}

function resize() {
  const bounds = canvas.getBoundingClientRect()
  const ratio = Math.min(window.devicePixelRatio || 1, 2)
  width = bounds.width
  height = bounds.height
  canvas.width = width * ratio
  canvas.height = height * ratio
  context.setTransform(ratio, 0, 0, ratio, 0, 0)
  arena.right = width - 20
  arena.bottom = height - 20
  if (!running) {
    player.x = width / 2
    player.y = height / 2
    player.targetX = player.x
    player.targetY = player.y
  }
}

function randomizeArena() {
  const shapes = [
    { width: 0.92, height: 0.52 },
    { width: 0.58, height: 0.86 },
    { width: 0.68, height: 0.62 },
    { width: 0.82, height: 0.72 },
    { width: 0.48, height: 0.58 },
  ]
  const shape = shapes[Math.floor(Math.random() * shapes.length)]
  const playableWidth = Math.max(190, width * shape.width)
  const playableHeight = Math.max(220, height * shape.height)
  arena.left = (width - playableWidth) / 2
  arena.top = (height - playableHeight) / 2
  arena.right = arena.left + playableWidth
  arena.bottom = arena.top + playableHeight
  player.x = (arena.left + arena.right) / 2
  player.y = (arena.top + arena.bottom) / 2
  player.targetX = player.x
  player.targetY = player.y
}

function pointerMove(event) {
  const bounds = canvas.getBoundingClientRect()
  const point = event.touches ? event.touches[0] : event
  player.targetX = Math.max(arena.left + 16, Math.min(arena.right - 16, point.clientX - bounds.left))
  player.targetY = Math.max(arena.top + 16, Math.min(arena.bottom - 16, point.clientY - bounds.top))
}

function startRun() {
  resize()
  randomizeArena()
  running = true
  startTime = performance.now()
  lastFrame = startTime
  elapsedTime = 0
  nextPatternAt = 10
  nextDecoyAt = 1
  nextPowerAt = 20
  history = []
  echoes = []
  particles = []
  trails = []
  traps = []
  idleFor = 0
  activePower = null
  powerStatusElement.textContent = '--'
  powerPanel.hidden = true
  delete powerPanel.dataset.shown
  message.classList.add('hidden')
  requestAnimationFrame(frame)
}

function frame(now) {
  if (!running) return
  const delta = Math.min((now - lastFrame) / 1000, 0.05)
  lastFrame = now
  elapsedTime += delta
  const elapsed = elapsedTime
  update(elapsed, delta)
  draw(elapsed)
  if (running) requestAnimationFrame(frame)
}

function update(elapsed, delta) {
  const smoothing = Math.min(1, delta * 8)
  const previousX = player.x
  const previousY = player.y
  player.x += (player.targetX - player.x) * smoothing
  player.y += (player.targetY - player.y) * smoothing
  if (Math.hypot(player.x - previousX, player.y - previousY) < 0.45) idleFor += delta
  else idleFor = 0
  if (idleFor >= 3) {
    endRun(elapsed, 'TE QUEDASTE QUIETO.')
    return
  }
  history.push({ time: elapsed, x: player.x, y: player.y })
  if (history.length > 420) history.shift()
  trails.push({ time: elapsed, x: player.x, y: player.y })
  trails = trails.filter((point) => elapsed - point.time < 1.4)

  const difficulty = 1 + Math.floor(elapsed / 15)
  if (elapsed >= nextDecoyAt) {
    echoes.push({
      born: elapsed,
      color: '#ff5f56',
      drift: (Math.random() - 0.5) * (26 + difficulty * 8),
      phase: Math.random() * Math.PI * 2,
      isDecoy: true,
      x: arena.left + 20 + Math.random() * Math.max(20, arena.right - arena.left - 40),
      y: arena.top + 20 + Math.random() * Math.max(20, arena.bottom - arena.top - 40),
      speed: 62 + difficulty * 12,
    })
    nextDecoyAt = elapsed < 2 ? 10 : elapsed + Math.max(3.5, 7 - difficulty * 0.8)
    echoCountElement.textContent = echoes.length
  }
  if (elapsed >= nextPatternAt) {
    echoes.push({
      born: elapsed,
      color: echoes.length % 2 ? '#ff8a65' : '#d7ff63',
      drift: (Math.random() - 0.5) * (26 + difficulty * 8),
      phase: Math.random() * Math.PI * 2,
      isDecoy: false,
    })
    nextPatternAt += 10
    echoCountElement.textContent = echoes.length
  }
  echoes = echoes.filter((echo) => elapsed - echo.born < 5)
  echoCountElement.textContent = echoes.length
  if (elapsed >= 8 && traps.length < Math.floor(elapsed / Math.max(6, 12 - difficulty)) + 1) {
    const angle = traps.length * 2.4 + 0.8
    traps.push({ x: (arena.left + arena.right) / 2 + Math.cos(angle) * (arena.right - arena.left) * 0.28, y: (arena.top + arena.bottom) / 2 + Math.sin(angle) * (arena.bottom - arena.top) * 0.28, radius: 26, born: elapsed, speed: 7 + difficulty * 4, memoryDelay: 2 + traps.length * 0.6, phase: Math.random() * Math.PI, laserAngle: Math.random() * Math.PI * 2, laserSpeed: 0.8 + difficulty * 0.12 })
  }

  const invert = activePower === 'invert' && elapsed < powerUntil
  for (const echo of echoes) {
    if (echo.isDecoy) {
      const chaseAngle = Math.atan2(player.y - echo.y, player.x - echo.x)
      const huntSpeed = echo.speed + elapsed * 1.8
      echo.x += Math.cos(chaseAngle) * huntSpeed * delta + Math.sin(elapsed * 3 + echo.phase) * 1.2
      echo.y += Math.sin(chaseAngle) * huntSpeed * delta + Math.cos(elapsed * 3.4 + echo.phase) * 1.2
      echo.x = Math.max(arena.left + 10, Math.min(arena.right - 10, echo.x))
      echo.y = Math.max(arena.top + 10, Math.min(arena.bottom - 10, echo.y))
      continue
    }
    const echoTime = elapsed - delay
    const position = history.reduce((closest, point) => Math.abs(point.time - echoTime) < Math.abs(closest.time - echoTime) ? point : closest, history[0])
    if (position) {
      const wobble = Math.sin(elapsed * 3 + echo.phase) * echo.drift
      echo.x = (invert ? width - position.x : position.x) + wobble
      echo.y = (invert ? height - position.y : position.y) + Math.cos(elapsed * 2 + echo.phase) * echo.drift
    }
  }
  traps.forEach((trap) => {
    const cycle = Math.floor((elapsed - trap.born) / 4) % 2
    const memoryTime = Math.max(0, elapsed - trap.memoryDelay)
    const remembered = history.reduce((closest, point) => Math.abs(point.time - memoryTime) < Math.abs(closest.time - memoryTime) ? point : closest, history[0])
    const target = cycle === 0 || !remembered ? player : remembered
    const angle = Math.atan2(target.y - trap.y, target.x - trap.x)
    trap.x += Math.cos(angle) * trap.speed * delta
    trap.y += Math.sin(angle) * trap.speed * delta
    trap.x = Math.max(arena.left + 16, Math.min(arena.right - 16, trap.x))
    trap.y = Math.max(arena.top + 16, Math.min(arena.bottom - 16, trap.y))
    trap.laserAngle += trap.laserSpeed * delta
  })
  particles = particles.filter((particle) => elapsed - particle.time < particle.life)
  particles.forEach((particle) => {
    particle.x += particle.vx * delta
    particle.y += particle.vy * delta
  })
  detectCollisions(elapsed)
  timeElement.textContent = elapsed.toFixed(1).padStart(4, '0')

  if (elapsed >= nextPowerAt && !powerPanel.dataset.shown) showPowerChoice()
}

function detectCollisions(elapsed) {
  for (const trap of traps) {
    if (Math.hypot(player.x - trap.x, player.y - trap.y) < trap.radius + playerRadius) {
      burst(player.x, player.y, '#ff8a65', elapsed)
      endRun(elapsed, 'PISASTE UNA TRAMPA.')
      return
    }
    const laserEndX = trap.x + Math.cos(trap.laserAngle) * Math.max(arena.right - arena.left, arena.bottom - arena.top)
    const laserEndY = trap.y + Math.sin(trap.laserAngle) * Math.max(arena.right - arena.left, arena.bottom - arena.top)
    if (distanceToSegment(player.x, player.y, trap.x, trap.y, laserEndX, laserEndY) < playerRadius + 4) {
      burst(player.x, player.y, '#ff5f56', elapsed)
      endRun(elapsed, 'TOCASTE EL LÁSER.')
      return
    }
  }
  for (const echo of echoes) {
    if (echo.x === undefined) continue
    const distance = Math.hypot(player.x - echo.x, player.y - echo.y)
    if (distance < playerRadius + 8) endRun(elapsed)
  }
  for (let first = 0; first < echoes.length; first += 1) {
    for (let second = first + 1; second < echoes.length; second += 1) {
      if (echoes[first].x === undefined || echoes[second].x === undefined) continue
      if (Math.hypot(echoes[first].x - echoes[second].x, echoes[first].y - echoes[second].y) < 18) {
        burst(echoes[first].x, echoes[first].y, echoes[first].color, elapsed)
        echoes.splice(second, 1)
        echoes.splice(first, 1)
        echoCountElement.textContent = echoes.length
        return
      }
    }
  }
}

function distanceToSegment(pointX, pointY, startX, startY, endX, endY) {
  const segmentX = endX - startX
  const segmentY = endY - startY
  const lengthSquared = segmentX * segmentX + segmentY * segmentY
  const projection = lengthSquared === 0 ? 0 : Math.max(0, Math.min(1, ((pointX - startX) * segmentX + (pointY - startY) * segmentY) / lengthSquared))
  return Math.hypot(pointX - (startX + projection * segmentX), pointY - (startY + projection * segmentY))
}

function burst(x, y, color, elapsed) {
  for (let index = 0; index < 14; index += 1) {
    const angle = (Math.PI * 2 * index) / 14
    particles.push({ x, y, vx: Math.cos(angle) * 70, vy: Math.sin(angle) * 70, time: elapsed, life: 0.7, color })
  }
}

function draw(elapsed) {
  context.clearRect(0, 0, width, height)
  const gradient = context.createRadialGradient(width / 2, height / 2, 10, width / 2, height / 2, Math.max(width, height) * 0.7)
  gradient.addColorStop(0, '#162634')
  gradient.addColorStop(1, '#081116')
  context.fillStyle = gradient
  context.fillRect(0, 0, width, height)
  context.strokeStyle = 'rgba(202, 241, 209, 0.08)'
  context.lineWidth = 1
  for (let x = 0; x < width; x += 42) { context.beginPath(); context.moveTo(x, 0); context.lineTo(x, height); context.stroke() }
  for (let y = 0; y < height; y += 42) { context.beginPath(); context.moveTo(0, y); context.lineTo(width, y); context.stroke() }
  context.fillStyle = 'rgba(2, 7, 10, 0.68)'
  context.fillRect(0, 0, width, arena.top)
  context.fillRect(0, arena.bottom, width, height - arena.bottom)
  context.fillRect(0, arena.top, arena.left, arena.bottom - arena.top)
  context.fillRect(arena.right, arena.top, width - arena.right, arena.bottom - arena.top)
  context.strokeStyle = 'rgba(215, 255, 99, 0.32)'
  context.setLineDash([5, 8])
  context.strokeRect(arena.left, arena.top, arena.right - arena.left, arena.bottom - arena.top)
  context.setLineDash([])
  traps.forEach((trap) => {
    const pulse = 1 + Math.sin((elapsed - trap.born) * 4) * 0.08
    context.globalAlpha = 0.28
    context.strokeStyle = '#ff8a65'
    context.lineWidth = 2
    context.beginPath(); context.arc(trap.x, trap.y, trap.radius * pulse, 0, Math.PI * 2); context.stroke()
    context.globalAlpha = 0.12
    context.fillStyle = '#ff8a65'
    context.beginPath(); context.arc(trap.x, trap.y, trap.radius, 0, Math.PI * 2); context.fill()
    const laserLength = Math.max(arena.right - arena.left, arena.bottom - arena.top)
    context.globalAlpha = 0.58
    context.strokeStyle = '#ff304f'
    context.lineWidth = 2
    context.beginPath()
    context.moveTo(trap.x, trap.y)
    context.lineTo(trap.x + Math.cos(trap.laserAngle) * laserLength, trap.y + Math.sin(trap.laserAngle) * laserLength)
    context.stroke()
  })
  context.globalAlpha = 1
  trails.forEach((point, index) => {
    context.globalAlpha = (index / trails.length) * 0.25
    context.fillStyle = '#d7ff63'
    context.beginPath(); context.arc(point.x, point.y, 2.5, 0, Math.PI * 2); context.fill()
  })
  context.globalAlpha = 1
  echoes.forEach((echo) => drawCircle(echo.x, echo.y, 9, echo.color, true))
  particles.forEach((particle) => drawCircle(particle.x, particle.y, 2, particle.color, false))
  drawPlayer(elapsed)
  context.beginPath(); context.arc(player.x, player.y, 19 + Math.sin(elapsed * 5) * 2, 0, Math.PI * 2)
  context.strokeStyle = 'rgba(215, 255, 99, 0.45)'; context.stroke()
  if (idleFor > 1.5) {
    context.fillStyle = '#ff8a65'
    context.font = '11px DM Mono, monospace'
    context.textAlign = 'center'
    context.fillText(`MUEVETE · ${(3 - idleFor).toFixed(1)}s`, width / 2, 28)
  }
}

function drawPlayer(elapsed) {
  const skin = skins.find((item) => item.id === selectedSkin) || skins[0]
  const orbGradient = context.createRadialGradient(player.x - 3, player.y - 4, 1, player.x, player.y, playerRadius + 7)
  orbGradient.addColorStop(0, skin.edge)
  orbGradient.addColorStop(0.5, skin.core)
  orbGradient.addColorStop(1, '#050b0f')
  context.fillStyle = orbGradient
  context.shadowBlur = 25
  context.shadowColor = skin.edge
  context.beginPath(); context.arc(player.x, player.y, playerRadius + (selectedSkin === 'gold' ? 2 : 0), 0, Math.PI * 2); context.fill()
  context.shadowBlur = 0
  if (selectedSkin === 'matrix') {
    context.fillStyle = skin.edge
    context.font = '7px DM Mono, monospace'
    context.textAlign = 'center'
    context.fillText('01', player.x, player.y + 3)
  } else if (selectedSkin === 'laser') {
    context.strokeStyle = skin.edge
    context.lineWidth = 2
    context.beginPath(); context.moveTo(player.x - 9, player.y + 7); context.lineTo(player.x + 9, player.y - 7); context.stroke()
  } else if (selectedSkin === 'glitch') {
    context.fillStyle = skin.edge
    context.fillRect(player.x - 12, player.y - 2, 5, 2)
    context.fillRect(player.x + 7, player.y + 3, 6, 2)
  } else if (selectedSkin === 'gold') {
    context.strokeStyle = skin.edge
    context.lineWidth = 2
    context.beginPath(); context.arc(player.x, player.y, 15 + Math.sin(elapsed * 3), 0, Math.PI * 2); context.stroke()
  }
}

function drawCircle(x, y, radius, color, ghost) {
  if (x === undefined) return
  context.globalAlpha = ghost ? 0.7 : 1
  context.fillStyle = color
  context.shadowBlur = ghost ? 18 : 24
  context.shadowColor = color
  context.beginPath(); context.arc(x, y, radius, 0, Math.PI * 2); context.fill()
  context.shadowBlur = 0
  context.globalAlpha = 1
}

function endRun(elapsed, reason = 'Tu pasado te encontró.') {
  running = false
  const earned = Math.floor(elapsed * (elapsed > 20 ? 2 : 1))
  currency += earned
  localStorage.setItem('echo-loop-currency', currency)
  updateSkinStore()
  best = Math.max(best, elapsed)
  localStorage.setItem('echo-loop-best', best.toFixed(1))
  bestElement.textContent = best.toFixed(1).padStart(4, '0')
  message.querySelector('.eyebrow').textContent = 'SEÑAL INTERRUMPIDA'
  message.querySelector('h1').innerHTML = `LLEGASTE A<br><em>${elapsed.toFixed(1)} SEGUNDOS.</em>`
  message.querySelector('p').textContent = `${reason} +${earned}⌁ · El récord queda guardado.`
  startButton.querySelector('span:first-child').textContent = 'REINTENTAR'
  message.classList.remove('hidden')
}

function showPowerChoice() {
  running = false
  nextPowerAt += 20
  powerPanel.dataset.shown = 'true'
  powerPanel.hidden = false
  powerGrid.innerHTML = powers.map((power) => `<button class="power-card" data-power="${power.id}"><span class="power-icon">${power.icon}</span><strong>${power.title}</strong><small>${power.text}</small></button>`).join('')
  powerGrid.querySelectorAll('.power-card').forEach((card) => card.addEventListener('click', () => {
    activePower = card.dataset.power
    powerStatusElement.textContent = powers.find((power) => power.id === activePower).title
    powerUntil = elapsedTime + (activePower === 'slow' ? 3 : activePower === 'invert' ? 2 : 999)
    powerPanel.hidden = true
    delete powerPanel.dataset.shown
    running = true
    lastFrame = performance.now()
    requestAnimationFrame(frame)
  }, { once: true }))
}

startButton.addEventListener('click', startRun)
soundButton.addEventListener('click', () => {
  const muted = soundButton.textContent === '◒'
  soundButton.textContent = muted ? '◐' : '◒'
  soundButton.setAttribute('aria-label', muted ? 'Silenciar sonido' : 'Activar sonido')
})
canvas.addEventListener('pointermove', pointerMove)
canvas.addEventListener('pointerdown', pointerMove)
canvas.addEventListener('touchmove', pointerMove, { passive: true })
window.addEventListener('resize', resize)
resize()
