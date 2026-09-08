import './style.css'
import Peer from 'peerjs'

document.querySelector('#app').innerHTML = `
  <main class="shell">
    <header class="topbar">
      <div class="brand"><span class="brand-mark">◌</span><span>ECHO LOOP</span></div>
      <div class="run-type"><span class="live-dot"></span><span id="mode-label">ARENA LIVE</span></div>
      <div class="topbar-actions">
        <button class="back-button" data-home-button type="button">ATRÁS</button>
        <button class="icon-button" id="sound-button" aria-label="Activar o silenciar sonido">◒</button>
      </div>
    </header>

    <section class="lobby-panel" aria-label="Lobby competitivo">
      <div class="lobby-copy">
        <span class="eyebrow">ONLINE COMPETITIVE</span>
        <h2>GUERRA EN VIVO</h2>
      </div>
      <div class="lobby-actions">
        <button class="primary-button" id="play-online-button" type="button"><span>LISTO PARA COMBATIR</span><span>→</span></button>
        <button class="ghost-button" id="sim-button" type="button">JUGAR ONLINE</button>
      </div>
    </section>
    <div class="nickname-overlay" id="nickname-overlay" hidden>
      <form class="nickname-card" id="nickname-form">
        <span class="eyebrow">IDENTIDAD DE COMBATE</span>
        <h2>Elige tu apodo</h2>
        <p>Tu nombre aparecerá en el lobby mientras buscas rival.</p>
        <label for="nickname-input">APODO</label>
        <input id="nickname-input" name="nickname" maxlength="16" autocomplete="nickname" placeholder="Ej. Echo_01" required />
        <button class="primary-button" type="submit"><span>CREAR SALA</span><span>→</span></button>
        <div class="join-divider"><span>O ÚNETE A UNA SALA</span></div>
        <div class="join-row">
          <input id="room-code-input" maxlength="40" autocomplete="off" placeholder="Código de sala" />
          <button class="ghost-button" id="join-room-button" type="button">UNIRME</button>
        </div>
      </form>
    </div>

    <section class="hud" aria-label="Estado de la partida">
      <div><span class="hud-label">TIEMPO</span><strong id="time">00.0</strong></div>
      <div class="hud-center"><span class="hud-label">RÉCORD</span><strong id="best">00.0</strong></div>
      <div><span class="hud-label">VIDAS</span><strong id="lives">2</strong></div>
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
    <div class="loss-overlay" id="loss-overlay" hidden>
      <img src="https://i.pinimg.com/736x/2c/80/35/2c80351220a2fb253ec5012caed56bd5.jpg" alt="Derrota" />
      <div class="loss-overlay-label">SE ACABÓ LA RUN</div>
    </div>
    <footer class="footer"><span>ARRASTRA PARA MOVERTE</span><span id="daily-label">MODO DIARIO · DISPONIBLE</span></footer>
  </main>
`

let canvas = document.querySelector('#game')
let context = canvas.getContext('2d')
let timeElement = document.querySelector('#time')
let bestElement = document.querySelector('#best')
let echoCountElement = document.querySelector('#echo-count')
let livesElement = document.querySelector('#lives')
let powerStatusElement = document.querySelector('#power-status')
let message = document.querySelector('#message')
let powerPanel = document.querySelector('#power-panel')
let powerGrid = document.querySelector('#power-grid')
let startButton = document.querySelector('#start-button')
let soundButton = document.querySelector('#sound-button')
const goldBallButton = document.querySelector('#gold-ball')
let skinList = document.querySelector('#skin-list')
let currencyElement = document.querySelector('#currency')
const playOnlineButton = document.querySelector('#play-online-button')
const nicknameOverlay = document.querySelector('#nickname-overlay')
const nicknameForm = document.querySelector('#nickname-form')
const nicknameInput = document.querySelector('#nickname-input')
const roomCodeInput = document.querySelector('#room-code-input')
const joinRoomButton = document.querySelector('#join-room-button')

let secretClickCount = 0
let secretTimer = null
let onlineMatchActive = false
let onlineCountdown = 60
let onlineRoom = null
let onlineMode = false
let localPlayerId = sessionStorage.getItem('echo-loop-player-id') || ''
let opponent = null
let lastOnlineBroadcast = 0
let onlinePeers = new Map()
let onlineLobbyActive = false
let presenceInterval = null
let peer = null
let peerConnection = null
let peerRoomCode = ''
let peerIsConnected = false
let onlineSetupActive = false
let onlineSelectedTrap = 'bird-net'
let onlineSetupTraps = []
let onlineSetupTimer = null
let onlineBeginTimer = null
let onlineRestartTimer = null
let onlineSetupDraw = null
let onlineSetupReady = false
let remoteSetupReady = false
let onlinePlayerAlive = true
let onlineOpponentAlive = true
let onlineMatchEnded = false
let onlineSpectator = false
let spectatorEchoActive = false
let remoteControlledEcho = null
const onlineChannel = 'BroadcastChannel' in window ? new BroadcastChannel('echo-loop-live-arena') : null
const presenceKeyPrefix = 'echo-loop-online-player-'

function refreshGameReferences() {
  timeElement = document.querySelector('#time')
  bestElement = document.querySelector('#best')
  echoCountElement = document.querySelector('#echo-count')
  livesElement = document.querySelector('#lives')
  powerStatusElement = document.querySelector('#power-status')
  message = document.querySelector('#message')
  powerPanel = document.querySelector('#power-panel')
  powerGrid = document.querySelector('#power-grid')
  startButton = document.querySelector('#start-button')
  soundButton = document.querySelector('#sound-button')
  skinList = document.querySelector('#skin-list')
  currencyElement = document.querySelector('#currency')
}

function handleOnlinePresence(state) {
  if (!state || state.id === localPlayerId) return
  onlinePeers.set(state.id, { id: state.id, name: state.name || 'RIVAL', lastSeen: performance.now() })
  updateOnlinePlayersDisplay()
  if (onlineLobbyActive && !onlineMode) {
    updatePeerRoomDisplay('RIVAL ENCONTRADO · CONECTANDO')
  }
}

if (onlineChannel) {
  onlineChannel.addEventListener('message', (event) => {
    const state = event.data
    if (!state || state.id === localPlayerId) return
    if (state.type === 'player-presence') {
      handleOnlinePresence(state)
      return
    }
    if (state.type === 'player-defeated') {
      onlineOpponentAlive = false
      if (running && onlinePlayerAlive) updatePeerRoomDisplay('RIVAL ELIMINADO · CONTINUA')
      if (!onlinePlayerAlive) scheduleOnlineRestart()
      return
    }
    if (state.type === 'spectator-echo') {
      remoteControlledEcho = { x: state.x, y: state.y, name: state.name || 'ECO DEL ELIMINADO', lastSeen: performance.now() }
      return
    }
    if (state.type !== 'player-state') return
    opponent = { id: state.id, name: state.name || 'RIVAL', skin: state.skin || 'retro', x: state.x, y: state.y, elapsed: state.elapsed || 0, lastSeen: performance.now() }
  })
}

function broadcastPresence(name) {
  const state = { type: 'player-presence', id: localPlayerId, name, seenAt: Date.now() }
  localStorage.setItem(`${presenceKeyPrefix}${localPlayerId}`, JSON.stringify(state))
  if (onlineChannel) onlineChannel.postMessage(state)
}

window.addEventListener('storage', (event) => {
  if (!event.key || !event.key.startsWith(presenceKeyPrefix) || !event.newValue) return
  try {
    handleOnlinePresence(JSON.parse(event.newValue))
  } catch {
    return
  }
})

function updateOnlinePlayersDisplay() {
  const list = document.querySelector('#online-players')
  if (!list) return
  const currentName = localStorage.getItem('echo-loop-player-name') || 'JUGADOR'
  const players = [{ name: currentName, label: 'JUGADOR 1' }, ...Array.from(onlinePeers.values()).map((peer) => ({ name: peer.name, label: 'JUGADOR 2' }))]
  list.innerHTML = players.slice(0, 2).map((player) => `<div class="online-player"><span class="player-status"></span><strong>${escapeHtml(player.name)}</strong><small>${player.label}</small></div>`).join('')
}

function updatePeerRoomDisplay(message = 'ESPERANDO CONEXIÓN P2P') {
  const code = document.querySelector('#online-room-code')
  const status = document.querySelector('#online-connection-status')
  if (code) code.textContent = peerRoomCode || 'GENERANDO...'
  if (status) status.textContent = message
}

function sendMatchResult(result) {
  const message = { type: 'player-defeated', result, elapsed: elapsedTime, id: localPlayerId }
  if (peerConnection?.open) peerConnection.send(message)
  if (onlineChannel) onlineChannel.postMessage({ ...message, id: localPlayerId })
}

function startPeerMatch() {
  if (onlineSetupActive || onlineMode) return
  peerIsConnected = true
  if (presenceInterval) clearInterval(presenceInterval)
  showOnlineTrapSetup()
}

function showOnlineTrapSetup() {
  if (onlineBeginTimer) clearInterval(onlineBeginTimer)
  if (onlineRestartTimer) clearTimeout(onlineRestartTimer)
  onlineSetupActive = true
  onlineMode = false
  onlineMatchActive = false
  onlinePlayerAlive = true
  onlineOpponentAlive = true
  onlineMatchEnded = false
  onlineSetupReady = false
  remoteSetupReady = false
  onlineSetupTraps = []
  remoteControlledEcho = null
  spectatorEchoActive = false
  document.querySelector('#spectator-echo-button')?.remove()
  if (message) message.classList.add('hidden')
  if (powerPanel) powerPanel.hidden = true
  const setupPanel = document.querySelector('#online-setup')
  if (setupPanel) setupPanel.hidden = false
  updatePeerRoomDisplay('ELIGE Y COLOCA TUS TRAMPAS')
  const startButton = document.querySelector('#online-start-button')
  const countdown = document.querySelector('#online-setup-countdown')
  if (onlineSetupTimer) clearInterval(onlineSetupTimer)
  if (countdown) countdown.textContent = '--'
  startButton?.addEventListener('click', confirmOnlineSetup, { once: true })
  document.querySelectorAll('[data-trap-choice]').forEach((button) => button.addEventListener('click', () => {
    onlineSelectedTrap = button.dataset.trapChoice
    document.querySelectorAll('[data-trap-choice]').forEach((item) => item.classList.toggle('selected', item === button))
  }))
}

function updateSetupReadyDisplay() {
  const status = document.querySelector('#online-connection-status')
  if (!status || !onlineSetupActive) return
  if (onlineSetupReady && remoteSetupReady) status.textContent = 'AMBOS LISTOS · INICIANDO'
  else if (onlineSetupReady) status.textContent = 'LISTO · ESPERANDO AL RIVAL'
  else if (remoteSetupReady) status.textContent = 'EL RIVAL YA ESTA LISTO'
  else status.textContent = 'COLOCA TRAMPAS Y PULSA EMPEZAR'
}

function confirmOnlineSetup() {
  if (!onlineSetupActive || onlineSetupReady) return
  onlineSetupReady = true
  if (!onlineSetupTraps.length) {
    onlineSetupTraps = [
      { type: 'bird-net', x: width * .25, y: height * .35, radius: 34, born: 0, active: true, laserAngle: 0 },
      { type: 'wolf-laser', x: width * .7, y: height * .55, radius: 26, born: 0, active: true, laserAngle: .4 },
      { type: 'axe', x: width * .45, y: height * .72, radius: 26, born: 0, active: true, laserAngle: 0 },
    ]
  }
  const setupMessage = { type: 'setup-state', ready: true, traps: onlineSetupTraps }
  if (peerConnection?.open) peerConnection.send(setupMessage)
  if (onlineChannel) onlineChannel.postMessage({ ...setupMessage, id: localPlayerId })
  updateSetupReadyDisplay()
  if (remoteSetupReady) scheduleOnlineMatchStart()
}

function scheduleOnlineMatchStart() {
  if (!onlineSetupActive || !onlineSetupReady || !remoteSetupReady || onlineBeginTimer) return
  const countdown = document.querySelector('#online-setup-countdown')
  let remaining = 5
  if (countdown) countdown.textContent = remaining
  updatePeerRoomDisplay('AMBOS LISTOS · COMIENZA EN 5s')
  onlineBeginTimer = setInterval(() => {
    remaining -= 1
    if (countdown) countdown.textContent = remaining
    if (remaining <= 0) {
      clearInterval(onlineBeginTimer)
      onlineBeginTimer = null
      beginOnlineMatch()
    }
  }, 1000)
}

function placeOnlineTrap(event) {
  if (!onlineSetupActive || onlineSetupReady || !canvas) return false
  const bounds = canvas.getBoundingClientRect()
  const point = event.touches ? event.touches[0] : event
  onlineSetupTraps.push({ type: onlineSelectedTrap, x: point.clientX - bounds.left, y: point.clientY - bounds.top, radius: onlineSelectedTrap === 'bird-net' ? 34 : 26, born: 0, active: true, laserAngle: 0 })
  onlineSetupDraw?.()
  return true
}

function beginOnlineMatch() {
  if (!onlineSetupActive) return
  onlineSetupActive = false
  onlineSetupReady = true
  if (onlineSetupTimer) clearInterval(onlineSetupTimer)
  if (onlineBeginTimer) clearInterval(onlineBeginTimer)
  onlineBeginTimer = null
  if (!onlineSetupTraps.length) {
    onlineSetupTraps = [
      { type: 'bird-net', x: width * .25, y: height * .35, radius: 34, born: 0, active: true, laserAngle: 0 },
      { type: 'wolf-laser', x: width * .7, y: height * .55, radius: 26, born: 0, active: true, laserAngle: .4 },
      { type: 'axe', x: width * .45, y: height * .72, radius: 26, born: 0, active: true, laserAngle: 0 },
    ]
  }
  const setupPanel = document.querySelector('#online-setup')
  if (setupPanel) setupPanel.hidden = true
  onlineMode = true
  onlineMatchActive = true
  onlineSpectator = false
  spectatorEchoActive = false
  onlineCountdown = 60
  updatePeerRoomDisplay('PERSEGUIR AL RIVAL')
  startRun()
}

function scheduleOnlineRestart() {
  if (onlinePlayerAlive || onlineOpponentAlive || onlineRestartTimer) return
  onlineMatchEnded = true
  running = false
  onlineMode = false
  onlineMatchActive = false
  updatePeerRoomDisplay('AMBOS ELIMINADOS · NUEVA RONDA EN 10s')
  onlineRestartTimer = setTimeout(() => {
    onlineRestartTimer = null
    showOnlineTrapSetup()
  }, 10000)
}

function sendSpectatorEcho(x, y) {
  const message = { type: 'spectator-echo', x, y, name: localStorage.getItem('echo-loop-player-name') || 'ECO DEL ELIMINADO', id: localPlayerId }
  if (peerConnection?.open) peerConnection.send(message)
  if (onlineChannel) onlineChannel.postMessage(message)
}

function activateSpectatorEcho() {
  if (!onlineSpectator) return
  spectatorEchoActive = true
  const button = document.querySelector('#spectator-echo-button')
  if (button) {
    button.textContent = 'MOVER ECO EN EL MAPA'
    button.disabled = true
  }
  updatePeerRoomDisplay('ECO ACTIVO · TOCA EL MAPA PARA PERSEGUIR')
}

function moveSpectatorEcho(event) {
  if (!onlineSpectator || !spectatorEchoActive || !canvas) return false
  const bounds = canvas.getBoundingClientRect()
  const point = event.touches ? event.touches[0] : event
  const x = Math.max(arena.left + 16, Math.min(arena.right - 16, point.clientX - bounds.left))
  const y = Math.max(arena.top + 16, Math.min(arena.bottom - 16, point.clientY - bounds.top))
  sendSpectatorEcho(x, y)
  return true
}

function attachPeerConnection(connection, name) {
  peerConnection = connection
  connection.on('open', () => {
    peerIsConnected = true
    connection.send({ type: 'player-info', name })
    updatePeerRoomDisplay('RIVAL CONECTADO')
    startPeerMatch()
  })
  connection.on('data', (message) => {
    if (message?.type === 'setup-state') {
      remoteSetupReady = message.ready === true
      if (Array.isArray(message.traps)) remoteTraps = message.traps
      updateSetupReadyDisplay()
      if (onlineSetupReady && remoteSetupReady) scheduleOnlineMatchStart()
      return
    }
    if (message?.type === 'player-defeated') {
      onlineOpponentAlive = false
      if (running && onlinePlayerAlive) updatePeerRoomDisplay('RIVAL ELIMINADO · CONTINUA')
      if (!onlinePlayerAlive) scheduleOnlineRestart()
      return
    }
    if (message?.type === 'spectator-echo') {
      remoteControlledEcho = { x: message.x, y: message.y, name: message.name || 'ECO DEL ELIMINADO', lastSeen: performance.now() }
      return
    }
    if (!message || message.type !== 'player-state') return
    opponent = { id: connection.peer, name: message.name || 'RIVAL', skin: message.skin || 'retro', x: message.x, y: message.y, elapsed: message.elapsed || 0, lastSeen: performance.now() }
    if (Array.isArray(message.traps)) remoteTraps = message.traps
    onlinePeers.set(connection.peer, { id: connection.peer, name: opponent.name, lastSeen: performance.now() })
    updateOnlinePlayersDisplay()
  })
  connection.on('close', () => {
    peerIsConnected = false
    peerConnection = null
    opponent = null
    updatePeerRoomDisplay('RIVAL DESCONECTADO')
  })
  connection.on('error', () => updatePeerRoomDisplay('ERROR DE CONEXIÓN'))
}

function createPeerRoom(name) {
  if (peer) peer.destroy()
  peerRoomCode = createRoomCode()
  peer = new Peer(peerRoomCode, { debug: 0 })
  peer.on('open', () => {
    updatePeerRoomDisplay('COMPARTE ESTE CÓDIGO')
    broadcastPresence(name)
  })
  peer.on('connection', (connection) => attachPeerConnection(connection, name))
  peer.on('error', () => updatePeerRoomDisplay('NO SE PUDO CREAR LA SALA'))
}

function createRoomCode() {
  const alphabet = 'abcdefghijkmnopqrstuvwxyz23456789-'
  let code = ''
  for (let index = 0; index < 6; index += 1) {
    code += alphabet[Math.floor(Math.random() * alphabet.length)]
  }
  return code
}

function joinPeerRoom(name, roomCode) {
  if (peer) peer.destroy()
  peer = new Peer(undefined, { debug: 0 })
  peer.on('open', () => {
    const connection = peer.connect(roomCode.trim(), { reliable: true })
    attachPeerConnection(connection, name)
    updatePeerRoomDisplay('CONECTANDO CON LA SALA')
  })
  peer.on('error', () => updatePeerRoomDisplay('CÓDIGO INVÁLIDO O SALA CERRADA'))
}

function getOnlineRoomState() {
  try {
    const stored = JSON.parse(localStorage.getItem('echo-loop-online-room') || '{"players":[],"updatedAt":0}')
    return {
      players: Array.isArray(stored.players) ? stored.players.map((player) => typeof player === 'string' ? { id: player, name: 'RIVAL', seenAt: 0 } : player).filter((player) => player && player.id) : [],
      updatedAt: Number(stored.updatedAt || 0),
      startedAt: Number(stored.startedAt || 0),
    }
  } catch {
    return { players: [], updatedAt: 0, startedAt: 0 }
  }
}

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character]))
}

function registerOnlinePlayer(name) {
  const room = getOnlineRoomState()
  const playerId = sessionStorage.getItem('echo-loop-player-id') || `player-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  localPlayerId = playerId
  sessionStorage.setItem('echo-loop-player-id', playerId)
  localStorage.setItem('echo-loop-player-name', name)
  const now = Date.now()
  const activePlayers = (room.players || []).filter((player) => player.id === playerId || now - Number(player.seenAt || 0) < 10000)
  const players = [...activePlayers.filter((player) => player.id !== playerId), { id: playerId, name, seenAt: now }].slice(-2)
  const nextRoom = { players, updatedAt: now, startedAt: players.length >= 2 ? room.startedAt || now + 60000 : 0 }
  localStorage.setItem('echo-loop-online-room', JSON.stringify(nextRoom))
  return nextRoom
}

function renderOnlineWaitingState(name) {
  const playerName = name || localStorage.getItem('echo-loop-player-name') || 'JUGADOR'
  const room = registerOnlinePlayer(playerName)
  const playerRows = room.players.map((player, index) => `<div class="online-player"><span class="player-status"></span><strong>${escapeHtml(player.name)}</strong><small>${index === 0 ? 'JUGADOR 1' : 'JUGADOR 2'}</small></div>`).join('')
  document.querySelector('#app').innerHTML = `
    <main class="shell">
      <header class="topbar">
        <div class="brand"><span class="brand-mark">◌</span><span>ECHO LOOP</span></div>
        <div class="run-type"><span class="live-dot"></span><span>ARENA LIVE</span></div>
        <div class="topbar-actions"><button class="back-button" data-home-button type="button">ATRÁS</button><button class="icon-button" id="sound-button" aria-label="Activar o silenciar sonido">◒</button></div>
      </header>
      <section class="lobby-panel online-panel">
        <div class="lobby-copy">
          <span class="eyebrow">ONLINE COMPETITIVE</span>
          <h2>ESPERANDO RIVAL</h2>
          <p>Se conectará cuando haya dos personas en la arena. Las trampas y los ecos se activan automáticamente al inicio del duelo.</p>
        </div>
        <div class="lobby-actions">
          <div class="online-players" id="online-players">${playerRows}</div>
          <div class="timer-box"><span>PREP</span><strong id="online-timer">60</strong></div>
        </div>
      </section>
      <section class="room-panel">
        <div><span class="eyebrow">SALA P2P GRATUITA</span><strong id="online-room-code">GENERANDO...</strong></div>
        <span id="online-connection-status">ESPERANDO CONEXIÓN P2P</span>
      </section>
      <section class="hud" aria-label="Estado de la partida">
        <div><span class="hud-label">TIEMPO</span><strong id="time">00.0</strong></div>
        <div class="hud-center"><span class="hud-label">RÉCORD</span><strong id="best">00.0</strong></div>
        <div><span class="hud-label">VIDAS</span><strong id="lives">2</strong></div>
        <div class="hud-right"><span class="hud-label">PODER · <span id="power-status">--</span></span><strong id="echo-count">0</strong></div>
      </section>
      <section class="skin-strip" aria-label="Skins desbloqueables">
        <div class="skin-title"><span class="hud-label">SKINS</span><strong id="currency">0⌁</strong></div>
        <div class="skin-list" id="skin-list"></div>
      </section>
      <section class="online-setup" id="online-setup" hidden>
        <div class="setup-heading"><span class="eyebrow">FASE DE PREPARACIÓN</span><strong>COLOCA TUS TRAMPAS</strong><small>Elige una y toca el mapa. Inicio automático en <b id="online-setup-countdown">5</b>s.</small></div>
        <div class="trap-choice-list">
          <button class="trap-choice selected" data-trap-choice="bird-net" type="button"><span>◆</span><strong>PÁJARO</strong><small>Red móvil</small></button>
          <button class="trap-choice" data-trap-choice="wolf-laser" type="button"><span>◢</span><strong>LOBO</strong><small>Láser inicial</small></button>
          <button class="trap-choice" data-trap-choice="axe" type="button"><span>╱</span><strong>HACHA</strong><small>Persigue al eco</small></button>
        </div>
        <button class="primary-button setup-start-button" id="online-start-button" type="button"><span>EMPEZAR</span><span>→</span></button>
      </section>
      <section class="game-wrap online-match-wrap">
        <canvas id="game" aria-label="Arena de preparación online."></canvas>
        <div class="game-message hidden" id="message">
          <span class="eyebrow">ARENA ONLINE</span>
          <h1>ESPERA<br><em>AL RIVAL.</em></h1>
          <p>La ronda comenzará cuando ambos jugadores estén listos.</p>
          <button class="primary-button" id="start-button" hidden type="button"><span>INICIAR RUN</span><span>→</span></button>
        </div>
        <div class="power-panel" id="power-panel" hidden>
          <span class="eyebrow">NUEVA MUTACIÓN</span>
          <h2>Elige tu ventaja</h2>
          <div class="power-grid" id="power-grid"></div>
        </div>
      </section>
    </main>
  `

  refreshGameReferences()
  updateSkinStore()
  const waitingCanvas = document.querySelector('#game')
  window.requestAnimationFrame(() => {
    canvas = document.querySelector('#game')
    context = canvas ? canvas.getContext('2d') : context
    bindCanvasControls()
  })
  if (waitingCanvas) {
    const waitingContext = waitingCanvas.getContext('2d')
    const drawWaiting = () => {
      const width = waitingCanvas.clientWidth || 900
      const height = waitingCanvas.clientHeight || 420
      waitingCanvas.width = width * (window.devicePixelRatio || 1)
      waitingCanvas.height = height * (window.devicePixelRatio || 1)
      waitingContext.setTransform(window.devicePixelRatio || 1, 0, 0, window.devicePixelRatio || 1, 0, 0)
      waitingContext.clearRect(0, 0, width, height)
      const gradient = waitingContext.createLinearGradient(0, 0, width, height)
      gradient.addColorStop(0, '#0a1621')
      gradient.addColorStop(1, '#040b11')
      waitingContext.fillStyle = gradient
      waitingContext.fillRect(0, 0, width, height)
      waitingContext.fillStyle = '#d7ff63'
      waitingContext.font = "700 22px 'DM Mono', monospace"
      waitingContext.textAlign = 'center'
      waitingContext.fillText('RIVAL EN BUSCA...', width / 2, height / 2)
      if (onlineSetupActive) {
        onlineSetupTraps.forEach((trap) => {
          waitingContext.fillStyle = trap.type === 'wolf-laser' ? '#ff304f' : trap.type === 'axe' ? '#f7c66b' : '#d7ff63'
          waitingContext.beginPath()
          waitingContext.arc(trap.x, trap.y, trap.radius, 0, Math.PI * 2)
          waitingContext.fill()
        })
      }
    }
    onlineSetupDraw = drawWaiting
    drawWaiting()
  }

  const timerLabel = document.querySelector('#online-timer')
  onlineLobbyActive = true
  for (let index = 0; index < localStorage.length; index += 1) {
    const key = localStorage.key(index)
    if (!key || !key.startsWith(presenceKeyPrefix)) continue
    try {
      const state = JSON.parse(localStorage.getItem(key))
      if (Date.now() - Number(state.seenAt || 0) < 10000) handleOnlinePresence(state)
    } catch {
      continue
    }
  }
  broadcastPresence(playerName)
  if (presenceInterval) clearInterval(presenceInterval)
  presenceInterval = setInterval(() => broadcastPresence(playerName), 1000)
  updateOnlinePlayersDisplay()
  onlineLobbyActive = false
  const interval = setInterval(() => {
    const state = registerOnlinePlayer(playerName)
    const playersReady = onlineChannel ? onlinePeers.size >= 1 : state.players.length >= 2
    if (playersReady) {
      const remaining = Math.max(0, Math.ceil((state.startedAt - Date.now()) / 1000))
      if (timerLabel) timerLabel.textContent = remaining
      if (remaining <= 0) {
        clearInterval(interval)
        onlineMode = true
        onlineMatchActive = true
        onlinePlayerAlive = true
        onlineOpponentAlive = true
        onlineMatchEnded = false
        onlineCountdown = 0
        startRun()
      }
    } else {
      if (timerLabel) timerLabel.textContent = '60'
    }
  }, 1000)

  window.addEventListener('storage', (event) => {
    if (event.key === 'echo-loop-online-room') {
      const roomState = getOnlineRoomState()
      if (!onlineChannel && roomState.players.length >= 2) {
        clearInterval(interval)
        onlineMode = true
        onlineMatchActive = true
        onlineCountdown = 60
        startRun()
      }
    }
  }, { once: true })
}

function startOnlineArena(name) {
  const playerName = name || localStorage.getItem('echo-loop-player-name') || 'JUGADOR'
  renderOnlineWaitingState(name)
  createPeerRoom(playerName)
}

function startOnlineJoin(name, roomCode) {
  const playerName = name || localStorage.getItem('echo-loop-player-name') || 'JUGADOR'
  renderOnlineWaitingState(playerName)
  joinPeerRoom(playerName, roomCode)
}

function renderSecretPage() {
  const leagueData = {
    'Champions': {
      header: 'LIVE PREDICT · Champions',
      matches: [
        {
          home: 'Real Madrid', away: 'Inter Milan', homeShort: 'RMA', awayShort: 'INT', score: '2 - 1', time: '21:00', date: '8 sep 2026', formHome: 'LWW', formAway: 'WWW', strengthHome: 92, strengthAway: 88, keyHome: ['Mbappé', 'Vinícius', 'Rodrygo'], keyAway: ['Lautaro', 'Barella', 'Bastoni'], odds: { home: 1.85, draw: 3.40, away: 4.10 }, confidence: 82, forecast: '2-1 Madrid', reason: 'Dominio histórico en casa, ofensiva letal Mbappé-Vinícius y presión alta en la creación.'
        },
        {
          home: 'Manchester City', away: 'Porto', homeShort: 'MCI', awayShort: 'POR', score: '2 - 0', time: '15:00', date: '8 sep 2026', formHome: 'WWW', formAway: 'LWW', strengthHome: 94, strengthAway: 81, keyHome: ['Haaland', 'De Bruyne', 'Foden'], keyAway: ['Pepê', 'Evanilson', 'Grujic'], odds: { home: 1.85, draw: 3.90, away: 4.40 }, confidence: 78, forecast: '2-0 City', reason: 'City es favorito claro; Porto resiente defensivamente ante presión alta y tercer cuarto del campo.'
        },
        {
          home: 'Borussia Dortmund', away: 'Villarreal', homeShort: 'DOR', awayShort: 'VIL', score: '3 - 1', time: '15:00', date: '8 sep 2026', formHome: 'WWL', formAway: 'WWD', strengthHome: 82, strengthAway: 79, keyHome: ['Guirassy', 'Adeyemi', 'Süle'], keyAway: ['Baena', 'Pais', 'Mandi'], odds: { home: 1.95, draw: 3.50, away: 4.25 }, confidence: 76, forecast: '3-1 Dortmund', reason: 'Casa fuerte, intensidad alta y mejor capacidad para ser agresivo en contraataque.'
        },
        {
          home: 'Lille', away: 'Real Betis', homeShort: 'LIL', awayShort: 'BET', score: '1 - 2', time: '15:00', date: '8 sep 2026', formHome: 'DWW', formAway: 'WWD', strengthHome: 76, strengthAway: 77, keyHome: ['David', 'Andre', 'Sanchez'], keyAway: ['Isco', 'Rui Silva', 'Rodrigo'], odds: { home: 2.90, draw: 3.30, away: 2.45 }, confidence: 68, forecast: '1-2 Betis', reason: 'Betis muestra mejor transición y más equilibrio en mediocampo, especialmente con la salida del balón.'
        },
        {
          home: 'Club Brugge', away: 'Aston Villa', homeShort: 'BRU', awayShort: 'AVL', score: '1 - 1', time: '18:45', date: '8 sep 2026', formHome: 'DWL', formAway: 'WWD', strengthHome: 75, strengthAway: 83, keyHome: ['Nusa', 'Vanaken', 'Mechele'], keyAway: ['Watkins', 'McGinn', 'Mings'], odds: { home: 3.20, draw: 3.40, away: 2.10 }, confidence: 70, forecast: '1-1', reason: 'Partido muy igualado; Brugge controla la posesión, Villa es más letal en espacios abiertos.'
        },
        {
          home: 'AEK Athens', away: 'LASK', homeShort: 'AEK', awayShort: 'LAS', score: '1 - 0', time: '18:45', date: '8 sep 2026', formHome: 'DWW', formAway: 'DWL', strengthHome: 72, strengthAway: 74, keyHome: ['Marmoush', 'Ponce', 'Rojas'], keyAway: ['Mihalic', 'Ljubicic', 'Zivkovic'], odds: { home: 2.35, draw: 3.10, away: 3.05 }, confidence: 66, forecast: '1-0 AEK', reason: 'AEK impone mejor velocidad de circulación y alcanza más metros en campo rival.'
        }
      ],
      standings: [
        { team: 'Man City', pts: 18, gd: '+8', form: 'WWW' },
        { team: 'Real Madrid', pts: 15, gd: '+6', form: 'WWL' },
        { team: 'Inter Milan', pts: 15, gd: '+5', form: 'WWD' },
        { team: 'Dortmund', pts: 14, gd: '+4', form: 'WWL' },
        { team: 'Aston Villa', pts: 13, gd: '+3', form: 'WWD' }
      ],
      scorers: [
        { player: 'Haaland', club: 'Man City', goals: 16 },
        { player: 'Mbappé', club: 'Real Madrid', goals: 15 },
        { player: 'Lautaro', club: 'Inter', goals: 14 },
        { player: 'Guirassy', club: 'Dortmund', goals: 12 },
        { player: 'Watkins', club: 'Aston Villa', goals: 11 }
      ]
    },
    'La Liga': {
      header: 'LIVE PREDICT · LaLiga',
      matches: [
        {
          home: 'Barcelona', away: 'Feyenoord', homeShort: 'BAR', awayShort: 'FEY', score: '2 - 0', time: '18:45', date: '9 sep 2026', formHome: 'WWD', formAway: 'WWL', strengthHome: 89, strengthAway: 78, keyHome: ['Lamine', 'Pedri', 'Lewandowski'], keyAway: ['Sá', 'Jahanbakhsh', 'Timber'], odds: { home: 1.55, draw: 4.20, away: 5.10 }, confidence: 81, forecast: '2-0 Barcelona', reason: 'Barcelona tiene más ritmo en alas y mejor circulación en el último tercio.'
        },
        {
          home: 'Stuttgart', away: 'Viking', homeShort: 'STU', awayShort: 'VIK', score: '1 - 1', time: '18:45', date: '9 sep 2026', formHome: 'WDL', formAway: 'DWL', strengthHome: 78, strengthAway: 71, keyHome: ['Mavropanos', 'Millot', 'Borja'], keyAway: ['Aune', 'Hjelde', 'Segberg'], odds: { home: 1.80, draw: 3.50, away: 4.60 }, confidence: 67, forecast: '1-1', reason: 'Partido con muchos duelos físicos y poca claridad en la finalización.'
        },
        {
          home: 'Real Madrid', away: 'Inter Milan', homeShort: 'RMA', awayShort: 'INT', score: '2 - 1', time: '21:00', date: '8 sep 2026', formHome: 'LWW', formAway: 'WWW', strengthHome: 92, strengthAway: 88, keyHome: ['Mbappé', 'Vinícius', 'Bellingham'], keyAway: ['Lautaro', 'Barella', 'Bastoni'], odds: { home: 1.85, draw: 3.40, away: 4.10 }, confidence: 82, forecast: '2-1 Madrid', reason: 'Dominio histórico en casa, ofensiva letal Mbappé-Vinícius y presión alta en la creación.'
        },
        {
          home: 'Girona', away: 'Sevilla', homeShort: 'GIR', awayShort: 'SEV', score: '2 - 0', time: '17:15', date: '8 sep 2026', formHome: 'WWW', formAway: 'LWL', strengthHome: 80, strengthAway: 74, keyHome: ['Stuani', 'Rashford', 'Van de Beek'], keyAway: ['Suso', 'Navas', 'Soumaré'], odds: { home: 2.05, draw: 3.40, away: 3.70 }, confidence: 69, forecast: '2-0 Girona', reason: 'Girona gana la fase de bloqueo y convierte la primera gran ocasión con muy buena circulación.'
        },
        {
          home: 'Valencia', away: 'Betis', homeShort: 'VAL', awayShort: 'BET', score: '1 - 2', time: '15:00', date: '8 sep 2026', formHome: 'LWL', formAway: 'WWD', strengthHome: 72, strengthAway: 77, keyHome: ['Gaya', 'López', 'Duro'], keyAway: ['Isco', 'Rui Silva', 'Rodrigo'], odds: { home: 3.10, draw: 3.20, away: 2.20 }, confidence: 68, forecast: '1-2 Betis', reason: 'Betis controla mejor los segundos balones y corta la salida del centro.'
        },
        {
          home: 'Celta', away: 'Villarreal', homeShort: 'CEL', awayShort: 'VIL', score: '1 - 1', time: '18:45', date: '8 sep 2026', formHome: 'DWL', formAway: 'WWD', strengthHome: 75, strengthAway: 79, keyHome: ['Bamba', 'Mina', 'Carvalho'], keyAway: ['Baena', 'Pape Gueye', 'Pais'], odds: { home: 2.65, draw: 3.30, away: 2.60 }, confidence: 66, forecast: '1-1', reason: 'Partido equilibrado, con dos equipos muy ordenados en transición.'
        }
      ],
      standings: [
        { team: 'Barcelona', pts: 12, gd: '+13', form: 'WWW' },
        { team: 'Real Madrid', pts: 10, gd: '+10', form: 'WWL' },
        { team: 'Atletico Madrid', pts: 10, gd: '+8', form: 'LWW' },
        { team: 'Real Sociedad', pts: 9, gd: '+4', form: 'WWD' },
        { team: 'Real Betis', pts: 7, gd: '+2', form: 'WWD' }
      ],
      scorers: [
        { player: 'Raphinha', club: 'Barcelona', goals: 6 },
        { player: 'Mbappé', club: 'Real Madrid', goals: 5 },
        { player: 'Lewandowski', club: 'Barcelona', goals: 4 },
        { player: 'Vinícius', club: 'Real Madrid', goals: 4 },
        { player: 'Sorloth', club: 'Atleti', goals: 4 }
      ]
    },
    'Premier League': {
      header: 'LIVE PREDICT · Premier',
      matches: [
        {
          home: 'Liverpool', away: 'Chelsea', homeShort: 'LIV', awayShort: 'CHE', score: '2 - 2', time: '17:30', date: '8 sep 2026', formHome: 'WWD', formAway: 'LWW', strengthHome: 91, strengthAway: 84, keyHome: ['Salah', 'Diaz', 'Van Dijk'], keyAway: ['Jackson', 'Palmer', 'Colwill'], odds: { home: 2.00, draw: 3.40, away: 3.65 }, confidence: 75, forecast: '2-2', reason: 'Partido de alta intensidad con mucha carga en los espacios centrales.'
        },
        {
          home: 'Arsenal', away: 'Tottenham', homeShort: 'ARS', awayShort: 'TOT', score: '1 - 0', time: '16:00', date: '8 sep 2026', formHome: 'WWD', formAway: 'DWL', strengthHome: 89, strengthAway: 81, keyHome: ['Saka', 'Rice', 'Martinelli'], keyAway: ['Son', 'Kulusevski', 'Van de Ven'], odds: { home: 2.20, draw: 3.30, away: 3.15 }, confidence: 73, forecast: '1-0 Arsenal', reason: 'Arsenal impone dominio territorial y se prepara mejor para cerrar el juego.'
        },
        {
          home: 'Aston Villa', away: 'Newcastle', homeShort: 'AVL', awayShort: 'NEW', score: '2 - 1', time: '19:45', date: '8 sep 2026', formHome: 'WWL', formAway: 'WWW', strengthHome: 82, strengthAway: 85, keyHome: ['Watkins', 'Mings', 'McGinn'], keyAway: ['Isak', 'Guimarães', 'Tonali'], odds: { home: 2.50, draw: 3.35, away: 2.80 }, confidence: 68, forecast: '2-1 Villa', reason: 'Villa logra exceder el ritmo del partido en la segunda parte con mucha verticalidad.'
        },
        {
          home: 'Fulham', away: 'Brighton', homeShort: 'FUL', awayShort: 'BHA', score: '1 - 1', time: '15:00', date: '8 sep 2026', formHome: 'DWW', formAway: 'WWW', strengthHome: 74, strengthAway: 78, keyHome: ['Adama', 'Andreas', 'Leno'], keyAway: ['Mitoma', 'Pedro', 'Van Hecke'], odds: { home: 2.80, draw: 3.30, away: 2.40 }, confidence: 66, forecast: '1-1', reason: 'Poca claridad en el área; Brighton domina el balón, Fulham la transición.'
        },
        {
          home: 'Man United', away: 'West Ham', homeShort: 'MUN', awayShort: 'WHU', score: '1 - 2', time: '18:30', date: '8 sep 2026', formHome: 'LWW', formAway: 'DWL', strengthHome: 76, strengthAway: 73, keyHome: ['Amad', 'Mainoo', 'Hojlund'], keyAway: ['Bowen', 'Paquetá', 'Souček'], odds: { home: 2.10, draw: 3.35, away: 3.50 }, confidence: 67, forecast: '1-2 West Ham', reason: 'West Ham crea mejores ventajas tras balón parado y mejora el bloqueo en zona media.'
        },
        {
          home: 'Leicester', away: 'Nottingham', homeShort: 'LEI', awayShort: 'NFO', score: '0 - 0', time: '14:30', date: '8 sep 2026', formHome: 'LWD', formAway: 'DWW', strengthHome: 69, strengthAway: 72, keyHome: ['Mavididi', 'Winks', 'Buonanotte'], keyAway: ['Wood', 'Aurier', 'Elanga'], odds: { home: 2.55, draw: 3.25, away: 2.75 }, confidence: 65, forecast: '0-0', reason: 'Encuentro de baja producción y combates directos en el centro del campo.'
        }
      ],
      standings: [
        { team: 'Arsenal', pts: 57, gd: '+21', form: 'WWD' },
        { team: 'Liverpool', pts: 54, gd: '+18', form: 'WWD' },
        { team: 'Man City', pts: 53, gd: '+17', form: 'WWW' },
        { team: 'Chelsea', pts: 47, gd: '+7', form: 'LWW' },
        { team: 'Villa', pts: 45, gd: '+8', form: 'WWL' }
      ],
      scorers: [
        { player: 'Haaland', club: 'Man City', goals: 16 },
        { player: 'Salah', club: 'Liverpool', goals: 14 },
        { player: 'Watkins', club: 'Aston Villa', goals: 12 },
        { player: 'Jackson', club: 'Chelsea', goals: 11 },
        { player: 'Isak', club: 'Newcastle', goals: 11 }
      ]
    }
  }

  const selectedLeague = 'Champions'
  const activeData = leagueData[selectedLeague]

  document.querySelector('#app').innerHTML = `
    <main class="secret-shell">
      <div class="secret-lock" id="secret-lock" aria-label="Protección de acceso">
        <img src="https://img.wattpad.com/cover/333762199-288-k582744.jpg" alt="Portada de protección" />
        <div class="lock-hint">Toca para desbloquear</div>
      </div>

      <header class="secret-header premium-header">
        <div class="header-left">
          <div class="brand small"><span class="brand-mark">◌</span><span>LIVE FOOTBALL</span></div>
          <div class="live-pill"><span class="live-dot red"></span><span>EN VIVO</span></div>
        </div>

        <div class="header-center">
          <div class="header-clock" id="live-clock">${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
        </div>

        <div class="header-actions">
          <button class="primary-button secret-back" id="back-button" type="button"><span>VOLVER</span><span>→</span></button>
        </div>
      </header>

      <section class="full-football-panel">
        <div class="feature-block big">
          <span class="eyebrow">PARTIDO DESTACADO</span>
          <h1>Real Madrid vs Inter Milan</h1>
          <div class="score-box">2 - 1</div>
          <p>El duelo del día con rendimiento real, presión alta y posibilidad de contraataque letal.</p>
        </div>

        <div class="feature-block">
          <span class="eyebrow">SÍNTESIS</span>
          <ul>
            <li>Forma reciente: W W D L W</li>
            <li>Goles esperados: 2.4</li>
            <li>Control: 58% / 42%</li>
            <li>Fósforos: Mbappé, Vinícius, Lautaro</li>
          </ul>
        </div>

        <div class="feature-block">
          <span class="eyebrow">ONLINE</span>
          <ul>
            <li>1 minuto de preparación</li>
            <li>Trampas activas</li>
            <li>Eco agresivo</li>
            <li>Rival: espera de conexión</li>
          </ul>
        </div>
      </section>
    </main>
  `

  const secretLock = document.querySelector('#secret-lock')
  if (secretLock) {
    secretLock.addEventListener('click', () => {
      secretLock.classList.add('is-hidden')
      setTimeout(() => {
        secretLock.remove()
      }, 220)
    })
  }

  const liveClock = document.querySelector('#live-clock')
  if (liveClock) {
    setInterval(() => {
      liveClock.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }, 1000)
  }

  document.querySelectorAll('.league-chip').forEach((button) => {
    button.addEventListener('click', () => {
      const nextLeague = button.dataset.league
      if (!nextLeague) return
      const root = document.querySelector('#app')
      root.innerHTML = `
        <div class="secret-loading">Cargando ${nextLeague}...</div>
      `
      setTimeout(() => {
        renderSecretPage()
      }, 100)
    })
  })

  document.querySelector('#back-button').addEventListener('click', () => {
    window.location.reload()
  })
}

if (goldBallButton) {
  goldBallButton.addEventListener('click', () => {
    secretClickCount += 1

    if (secretTimer) clearTimeout(secretTimer)
    secretTimer = setTimeout(() => {
      secretClickCount = 0
    }, 900)

    if (secretClickCount >= 5) {
      secretClickCount = 0
      renderSecretPage()
    }
  })
}

document.addEventListener('click', (event) => {
  const homeButton = event.target.closest('[data-home-button]')
  if (!homeButton) return
  running = false
  if (presenceInterval) clearInterval(presenceInterval)
  if (peer) peer.destroy()
  window.location.reload()
})

playOnlineButton.addEventListener('click', () => {
  nicknameOverlay.hidden = false
  nicknameInput.value = localStorage.getItem('echo-loop-player-name') || ''
  nicknameInput.focus()
})

document.querySelector('#sim-button')?.addEventListener('click', () => playOnlineButton.click())

nicknameForm.addEventListener('submit', (event) => {
  event.preventDefault()
  const name = nicknameInput.value.trim().replace(/\s+/g, ' ').slice(0, 16)
  if (!name) return
  nicknameOverlay.hidden = true
  startOnlineArena(name)
})

joinRoomButton.addEventListener('click', () => {
  const name = nicknameInput.value.trim().replace(/\s+/g, ' ').slice(0, 16)
  const roomCode = roomCodeInput.value.trim()
  if (!name || !roomCode) return
  nicknameOverlay.hidden = true
  startOnlineJoin(name, roomCode)
})

const delay = 5
const playerRadius = 10
const powers = [
  { id: 'slow', title: 'FRENO DE FANTASMAS', text: 'Los ecos se ralentizan durante 3 segundos.', icon: '↓' },
  { id: 'ink', title: 'TINTA VIVA', text: 'Tu rastro frena a cualquier eco que lo cruce.', icon: '✦' },
  { id: 'invert', title: 'ESPEJO ROTO', text: 'Los ecos invierten su dirección durante 2 segundos.', icon: '↔' },
]
const skins = [
  { id: 'retro', name: 'SCOUT', price: 0, core: '#20a4ff', edge: '#b8e9ff', role: 'EXPLORADOR', character: 'scout' },
  { id: 'plasma', name: 'ENGINEER', price: 20, core: '#a855f7', edge: '#f0abfc', role: 'CASCO NARANJA', character: 'engineer' },
  { id: 'candy', name: 'BIRD', price: 40, core: '#f472b6', edge: '#ffe4f3', role: 'TRAMPAS AEREAS', character: 'bird' },
  { id: 'matrix', name: 'RANGER', price: 70, core: '#52d11c', edge: '#d4ff7c', role: 'RASTREADOR', character: 'ranger' },
  { id: 'glitch', name: 'AXE', price: 100, core: '#f43f5e', edge: '#22d3ee', role: 'LANZA HACHA', character: 'axe' },
  { id: 'void', name: 'ZOMBIE', price: 140, core: '#241238', edge: '#c084fc', role: 'ECO DEL PASADO', character: 'zombie' },
  { id: 'laser', name: 'WOLF', price: 190, core: '#e11d48', edge: '#fb7185', role: 'LASER INICIAL', character: 'wolf' },
  { id: 'gold', name: 'COMMANDER', price: 250, core: '#e19b18', edge: '#fff0a8', role: 'GUERRERO', character: 'commander' },
  { id: 'nebula', name: 'NINJA', price: 320, core: '#5b21b6', edge: '#e9d5ff', role: 'ECO OSCURO', character: 'ninja' },
  { id: 'firewall', name: 'MEDIC', price: 400, core: '#ea580c', edge: '#fed7aa', role: 'RESISTENCIA', character: 'medic' },
  { id: 'frost', name: 'SPEED', price: 500, core: '#0ea5e9', edge: '#dff8ff', role: 'SUPER VELOCIDAD', character: 'speed' },
  { id: 'toxic', name: 'TOXIC', price: 650, core: '#3f9d16', edge: '#b8ff5b', role: 'ZOMBI TOXICO', character: 'toxic' },
  { id: 'sniper', name: 'SNIPER', price: 800, core: '#64748b', edge: '#dbeafe', role: 'ECO A DISTANCIA', character: 'sniper' },
  { id: 'heavy', name: 'HEAVY', price: 950, core: '#334155', edge: '#94a3b8', role: 'ARMADURA PESADA', character: 'heavy' },
  { id: 'pilot', name: 'PILOT', price: 1100, core: '#0f766e', edge: '#99f6e4', role: 'MOVILIDAD AEREA', character: 'pilot' },
  { id: 'samurai', name: 'SAMURAI', price: 1300, core: '#991b1b', edge: '#fecaca', role: 'CORTE RAPIDO', character: 'samurai' },
  { id: 'robot', name: 'ROBOT', price: 1500, core: '#475569', edge: '#67e8f9', role: 'ESCUDO MECANICO', character: 'robot' },
  { id: 'commando', name: 'COMMANDO', price: 1800, core: '#365314', edge: '#bef264', role: 'CAZADOR ELITE', character: 'commando' },
  { id: 'shadow', name: 'SHADOW', price: 2200, core: '#18181b', edge: '#a1a1aa', role: 'ECO INVISIBLE', character: 'shadow' },
  { id: 'boss', name: 'BOSS', price: 2800, core: '#7f1d1d', edge: '#fbbf24', role: 'JEFE FINAL', character: 'boss' },
]

let width = 0
let height = 0
let player = { x: 0, y: 0, targetX: 0, targetY: 0 }
let history = []
let echoes = []
let particles = []
let trails = []
let traps = []
let remoteTraps = []
let idleFor = 0
let arena = { left: 20, top: 20, right: 0, bottom: 0 }
let running = false
let lives = 2
let startTime = 0
let lastFrame = 0
let elapsedTime = 0
let nextPatternAt = 10
let nextTrapAt = 15
let difficultyLevel = 1
let nextDecoyAt = 1
let nextPowerAt = 20
let best = Number(localStorage.getItem('echo-loop-best') || 0)
let currency = Number(localStorage.getItem('echo-loop-currency') || 0)
let unlockedSkins = JSON.parse(localStorage.getItem('echo-loop-skins') || '["retro"]')
let selectedSkin = localStorage.getItem('echo-loop-selected-skin') || 'retro'
let activePower = null
let powerUntil = 0
let powerGraceUntil = 0
let onlineBoosted = false
let onlineLastEliminationAt = 0

bestElement.textContent = best.toFixed(1).padStart(4, '0')
updateSkinStore()

function updateSkinStore() {
  currencyElement.textContent = `${currency}⌁`
  skinList.innerHTML = skins.map((skin) => {
    const unlocked = unlockedSkins.includes(skin.id)
    const selected = selectedSkin === skin.id
    const label = selected ? 'USANDO' : unlocked ? 'ELEGIR' : `${skin.price}⌁`
    return `<button class="skin-chip ${selected ? 'selected' : ''}" data-skin="${skin.id}" data-character="${skin.character}" style="--skin-core:${skin.core};--skin-edge:${skin.edge}" title="${skin.name} · ${skin.role}"><span class="skin-orb"><i></i></span><span>${skin.name}</span><small>${label}</small></button>`
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
  arena.right = width - 10
  arena.bottom = height - 10
  if (!running) {
    player.x = width / 2
    player.y = height / 2
    player.targetX = player.x
    player.targetY = player.y
  }
}

function randomizeArena() {
  const shapes = [
    { width: 0.98, height: 0.88 },
    { width: 0.9, height: 0.98 },
    { width: 0.94, height: 0.9 },
    { width: 0.98, height: 0.96 },
    { width: 0.86, height: 0.92 },
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

function createOnlineTrap(type, born) {
  return {
    type,
    x: arena.left + 50 + Math.random() * Math.max(30, arena.right - arena.left - 100),
    y: arena.top + 50 + Math.random() * Math.max(30, arena.bottom - arena.top - 100),
    radius: type === 'bird-net' ? 34 : 26,
    born,
    speed: type === 'axe' ? 170 : type === 'zombie-echo' ? 26 : 0,
    memoryDelay: 2.5,
    phase: Math.random() * Math.PI * 2,
    laserAngle: Math.random() * Math.PI * 2,
    laserSpeed: type === 'wolf-laser' ? 0.75 : 0,
    orbitAngle: Math.random() * Math.PI * 2,
    orbitSpeed: type === 'axe' ? 0.9 : 0,
    orbitRadius: type === 'axe' ? 70 : 0,
    homeX: 0,
    homeY: 0,
    active: false,
  }
}

function createLocalTrapSet() {
  return [0, 3, 6].map((born) => createRandomLocalTrap(born, 1))
}

function createRandomLocalTrap(born, level = difficultyLevel) {
  const trapTypes = level >= 3 ? ['wolf-laser', 'bird-net', 'axe'] : level === 2 ? ['wolf-laser', 'bird-net', 'axe'] : ['wolf-laser', 'bird-net']
  const trap = createOnlineTrap(trapTypes[Math.floor(Math.random() * trapTypes.length)], born)
  trap.active = born <= 0
  if (trap.type === 'axe') {
    trap.speed = 170 + level * 18
    trap.orbitRadius = 60 + level * 12
  }
  if (trap.type === 'wolf-laser') trap.laserSpeed = 0.75 + level * 0.12
  trap.homeX = trap.x
  trap.homeY = trap.y
  return trap
}

function startRun() {
  const preparedOnlineTraps = onlineMode ? [...onlineSetupTraps] : []
  resize()
  randomizeArena()
  running = true
  lives = 2
  livesElement.textContent = lives
  startTime = performance.now()
  lastFrame = startTime
  elapsedTime = 0
  nextPatternAt = 10
  nextTrapAt = 15
  difficultyLevel = 1
  nextDecoyAt = 1
  nextPowerAt = 20
  history = []
  echoes = []
  particles = []
  trails = []
  traps = []
  remoteTraps = []
  idleFor = 0
  activePower = null
  powerGraceUntil = 3
  onlineBoosted = false
  onlineLastEliminationAt = 0
  powerStatusElement.textContent = '--'
  powerPanel.hidden = true
  delete powerPanel.dataset.shown
  message.classList.add('hidden')
  if (onlineMode) {
    traps = preparedOnlineTraps
    onlineCountdown = 60
    playBattleAudio()
  } else {
    traps = createLocalTrapSet()
  }
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
  if (onlineMode && performance.now() - lastOnlineBroadcast > 50) {
    const state = { type: 'player-state', id: localPlayerId, name: localStorage.getItem('echo-loop-player-name') || 'JUGADOR', skin: selectedSkin, x: player.x, y: player.y, elapsed, traps: onlineMode ? traps.map(({ type, x, y, radius, born, laserAngle, active }) => ({ type, x, y, radius, born, laserAngle, active })) : [] }
    if (onlineChannel) onlineChannel.postMessage(state)
    if (peerConnection?.open) peerConnection.send(state)
    lastOnlineBroadcast = performance.now()
  }
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

  const difficulty = 1 + Math.floor(elapsed / 30)
  difficultyLevel = difficulty
  if (!onlineMode && elapsed >= nextTrapAt) {
    traps.push(createRandomLocalTrap(elapsed, difficulty))
    nextTrapAt += 15
  }
  if (onlineMode && elapsed >= 100 && !onlineBoosted) {
    onlineBoosted = true
    powerStatusElement.textContent = 'SUPER VELOCIDAD'
  }
  const movementSmoothing = onlineBoosted ? Math.min(1, delta * 14) : smoothing
  player.x += (player.targetX - player.x) * (movementSmoothing - smoothing)
  player.y += (player.targetY - player.y) * (movementSmoothing - smoothing)
  if (elapsed >= nextDecoyAt) {
    echoes.push({
      born: elapsed,
      color: '#7dbb54',
      drift: (Math.random() - 0.5) * (26 + difficulty * 8),
      phase: Math.random() * Math.PI * 2,
      isDecoy: true,
      skin: onlineMode ? 'zombie' : null,
      x: arena.left + 20 + Math.random() * Math.max(20, arena.right - arena.left - 40),
      y: arena.top + 20 + Math.random() * Math.max(20, arena.bottom - arena.top - 40),
      speed: 62 + difficulty * 12,
    })
    nextDecoyAt = elapsed < 2 ? 10 : elapsed + Math.max(3.5, 7 - difficulty * 0.8)
    echoCountElement.textContent = echoes.length
  }
  if (!onlineMode && elapsed >= nextPatternAt) {
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
    if (onlineMode || trap.type) {
      if (onlineMode && trap.type === 'bird-net' && trap.spawned) {
        trap.active = false
        return
      }
      if (elapsed < trap.born) return
      if (trap.type === 'thrown-hammer' && trap.active === false) return
      trap.active = true
      trap.homeX ??= trap.x
      trap.homeY ??= trap.y
      trap.orbitAngle ??= Math.random() * Math.PI * 2
      trap.orbitSpeed ??= trap.type === 'axe' ? 0.9 : 0
      trap.orbitRadius ??= trap.type === 'axe' ? 70 : 0
      if (trap.type === 'wolf-laser' && elapsed - trap.born > 10) {
        trap.type = 'axe'
        trap.homeX = trap.x
        trap.homeY = trap.y
        trap.orbitAngle = 0
        trap.orbitSpeed = 0.9
        trap.orbitRadius = 70
        trap.laserAngle = 0
      }
      if (trap.type === 'bird-net' && !trap.spawned && elapsed - trap.born > 3) {
        trap.spawned = true
        for (let index = 0; index < 3; index += 1) {
          traps.push({
            type: 'mini-zombie',
            x: trap.x + (index - 1) * 28,
            y: trap.y + 24,
            radius: 13,
            born: elapsed,
            active: true,
            laserAngle: 0,
            moveAxis: index === 1 ? 'horizontal' : 'vertical',
            movePhase: index * Math.PI * 0.7,
            moveRange: 72,
            moveSpeed: 1.4,
            homeX: trap.x + (index - 1) * 28,
            homeY: trap.y + 24,
          })
        }
        if (onlineMode) {
          trap.active = false
          return
        }
      }
      if (trap.type === 'wolf-laser') {
        trap.laserAngle += (0.9 + difficultyLevel * 0.18) * delta
      } else if (trap.type === 'bird-net') {
        trap.x += Math.cos(elapsed * 1.15 + trap.phase) * 7 * delta
        trap.y += Math.sin(elapsed * 0.9 + trap.phase) * 7 * delta
      } else if (trap.type === 'axe') {
        trap.orbitAngle += trap.orbitSpeed * delta
        trap.x = trap.homeX + Math.cos(trap.orbitAngle) * trap.orbitRadius
        trap.y = trap.homeY + Math.sin(trap.orbitAngle) * trap.orbitRadius
        trap.throwCooldown = (trap.throwCooldown ?? 2.5) - delta
        if (trap.throwCooldown <= 0) {
          const throwAngle = Math.atan2(player.y - trap.y, player.x - trap.x)
          const throwSpeed = 180 + difficultyLevel * 35
          traps.push({
            type: 'thrown-hammer',
            x: trap.x,
            y: trap.y,
            radius: 15,
            born: elapsed,
            active: true,
            laserAngle: throwAngle,
            vx: Math.cos(throwAngle) * throwSpeed,
            vy: Math.sin(throwAngle) * throwSpeed,
          })
          trap.throwCooldown = Math.max(1.8, 4.2 - difficultyLevel * 0.35)
        }
      } else if (trap.type === 'thrown-hammer') {
        trap.x += trap.vx * delta
        trap.y += trap.vy * delta
        if (trap.x < arena.left - 40 || trap.x > arena.right + 40 || trap.y < arena.top - 40 || trap.y > arena.bottom + 40) {
          trap.active = false
        }
      } else if (trap.type === 'mini-zombie') {
        const approach = Math.min(1, delta * (0.08 + difficultyLevel * 0.018))
        trap.homeX += (player.x - trap.homeX) * approach
        trap.homeY += (player.y - trap.homeY) * approach
        const movement = Math.sin((elapsed - trap.born) * trap.moveSpeed + trap.movePhase) * (trap.moveRange + difficultyLevel * 18)
        trap.x = trap.moveAxis === 'horizontal' ? trap.homeX + movement : trap.homeX
        trap.y = trap.moveAxis === 'vertical' ? trap.homeY + movement : trap.homeY
      } else if (trap.type === 'zombie-echo') {
        const echoTime = Math.max(0, elapsed - trap.memoryDelay)
        const remembered = history.reduce((closest, point) => Math.abs(point.time - echoTime) < Math.abs(closest.time - echoTime) ? point : closest, history[0])
        if (remembered) {
          trap.x += (remembered.x - trap.x) * delta * 2
          trap.y += (remembered.y - trap.y) * delta * 2
        }
      }
      if (trap.type !== 'mini-zombie') {
        trap.x = Math.max(arena.left + 16, Math.min(arena.right - 16, trap.x))
        trap.y = Math.max(arena.top + 16, Math.min(arena.bottom - 16, trap.y))
      }
      return
    }
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
  detectOnlineCombat(elapsed)

  function detectOnlineCombat(elapsed) {
    if (!onlineMode || !opponent || !onlinePlayerAlive || onlineMatchEnded) return
      if (remoteControlledEcho && performance.now() - remoteControlledEcho.lastSeen < 10000 && Math.hypot(player.x - remoteControlledEcho.x, player.y - remoteControlledEcho.y) < playerRadius * 2) {
        endRun(elapsed, 'EL ECO DEL ELIMINADO TE ENCONTRO.')
        return
      }
    if (Math.hypot(player.x - opponent.x, player.y - opponent.y) < playerRadius * 2.3) {
      const attackerWins = elapsed >= Number(opponent.elapsed || 0)
      if (attackerWins) {
        endRun(elapsed, 'EL RIVAL TE DERRIBO.')
      } else {
        onlineOpponentAlive = false
        sendMatchResult('defeated')
        updatePeerRoomDisplay('RIVAL ELIMINADO · CONTINUA')
      }
    }
  }
  timeElement.textContent = elapsed.toFixed(1).padStart(4, '0')

  if (!onlineMode && elapsed >= nextPowerAt && !powerPanel.dataset.shown) showPowerChoice()
}

function detectCollisions(elapsed) {
  if (elapsed < powerGraceUntil) return
  const collisionTraps = onlineMode ? [...traps, ...remoteTraps] : traps
  for (const trap of collisionTraps) {
    if (onlineMode || trap.type) {
      if (!trap.active) continue
      if (trap.type === 'wolf-laser') {
        const laserLength = Math.max(arena.right - arena.left, arena.bottom - arena.top)
        const laserEndX = trap.x + Math.cos(trap.laserAngle) * laserLength
        const laserEndY = trap.y + Math.sin(trap.laserAngle) * laserLength
        if (distanceToSegment(player.x, player.y, trap.x, trap.y, laserEndX, laserEndY) < playerRadius + 4) {
          burst(player.x, player.y, '#ff304f', elapsed)
          endRun(elapsed, 'EL LOBO TE ALCANZO.')
          return
        }
      } else if (Math.hypot(player.x - trap.x, player.y - trap.y) < trap.radius + playerRadius) {
        burst(player.x, player.y, trap.type === 'zombie-echo' ? '#8dff70' : '#ff8a65', elapsed)
        endRun(elapsed, trap.type === 'axe' ? 'EL HACHA TE ENCONTRO.' : trap.type === 'thrown-hammer' ? 'EL MARTILLO TE GOLPEO.' : trap.type === 'bird-net' ? 'CAISTE EN LA TRAMPA DEL PAJARO.' : trap.type === 'mini-zombie' ? 'UN ZOMBI PEQUENO TE ALCANZO.' : 'TU ECO ZOMBI TE ALCANZO.')
        return
      }
      continue
    }
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
  const visibleTraps = onlineMode ? [...traps, ...remoteTraps] : traps
  visibleTraps.forEach((trap) => {
    if (onlineMode || trap.type) {
      if (!trap.active) return
      const color = trap.type === 'wolf-laser' ? '#ff304f' : trap.type === 'zombie-echo' ? '#8dff70' : trap.type === 'axe' || trap.type === 'thrown-hammer' ? '#f7c66b' : '#d7ff63'
      context.globalAlpha = 0.82
      context.fillStyle = color
      context.strokeStyle = color
      context.lineWidth = 2
      if (trap.type === 'wolf-laser') {
        const laserLength = Math.max(arena.right - arena.left, arena.bottom - arena.top)
        context.beginPath()
        context.moveTo(trap.x, trap.y)
        context.lineTo(trap.x + Math.cos(trap.laserAngle) * laserLength, trap.y + Math.sin(trap.laserAngle) * laserLength)
        context.stroke()
        drawTrapCharacter(trap.x, trap.y, 'wolf', elapsed)
      } else if (trap.type === 'axe') {
        drawTrapCharacter(trap.x, trap.y, 'axe', elapsed)
        context.save()
        context.translate(trap.x, trap.y)
        context.rotate(trap.orbitAngle || Math.atan2((opponent?.y || player.y) - trap.y, (opponent?.x || player.x) - trap.x))
        context.fillRect(-12, -2, 24, 4)
        context.fillRect(5, -9, 8, 18)
        context.restore()
      } else if (trap.type === 'thrown-hammer') {
        context.save()
        context.translate(trap.x, trap.y)
        context.rotate(trap.laserAngle)
        context.fillStyle = '#f7c66b'
        context.fillRect(-14, -3, 22, 6)
        context.fillRect(5, -10, 9, 20)
        context.restore()
      } else if (trap.type === 'mini-zombie' || trap.type === 'zombie-echo') {
        drawTrapCharacter(trap.x, trap.y, 'zombie', elapsed, trap.type === 'zombie-echo' ? 0.72 : 1)
      } else if (trap.type === 'bird-net') {
        drawTrapCharacter(trap.x, trap.y, 'bird', elapsed)
        context.fillStyle = '#d7ff63'
        context.font = '9px DM Mono, monospace'
        context.textAlign = 'center'
        context.fillText('PAJARO', trap.x, trap.y - 24)
      } else {
        context.beginPath()
        context.arc(trap.x, trap.y, trap.radius, 0, Math.PI * 2)
        context.stroke()
        context.font = '9px DM Mono, monospace'
        context.textAlign = 'center'
        context.fillText(trap.type === 'bird-net' ? 'PAJARO' : 'ZOMBI ECO', trap.x, trap.y - trap.radius - 6)
      }
      context.globalAlpha = 1
      return
    }
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
  echoes.forEach((echo) => {
    if (onlineMode && echo.skin === 'zombie') drawCharacter(echo.x, echo.y, skins.find((skin) => skin.character === 'zombie') || skins[5], elapsed, true)
    else drawCircle(echo.x, echo.y, 9, echo.color, true)
  })
  if (onlineMode && remoteControlledEcho && performance.now() - remoteControlledEcho.lastSeen < 3000) {
    drawTrapCharacter(remoteControlledEcho.x, remoteControlledEcho.y, 'zombie', elapsed, 0.9)
    context.fillStyle = '#b8ff5b'
    context.font = '9px DM Mono, monospace'
    context.textAlign = 'center'
    context.fillText('ECO CONTROLADO', remoteControlledEcho.x, remoteControlledEcho.y - 25)
  }
  particles.forEach((particle) => drawCircle(particle.x, particle.y, 2, particle.color, false))
  if (onlineMode && opponent && performance.now() - opponent.lastSeen < 3000) {
    drawCharacter(opponent.x, opponent.y, skins.find((skin) => skin.id === opponent.skin) || skins[0], elapsed, true)
    context.fillStyle = '#ffcfbf'
    context.font = '10px DM Mono, monospace'
    context.textAlign = 'center'
    context.fillText(`${opponent.name} · ECO`, opponent.x, opponent.y - 18)
  }
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
  drawCharacter(player.x, player.y, skin, elapsed, false)
}

function drawTrapCharacter(x, y, character, elapsed, opacity = 1) {
  const skin = skins.find((item) => item.character === character) || skins[0]
  drawCharacter(x, y, skin, elapsed, opacity < 1)
  context.save()
  context.globalAlpha = opacity
  if (character === 'wolf') {
    context.fillStyle = '#ff304f'
    context.shadowBlur = 9
    context.shadowColor = '#ff304f'
    context.fillRect(x - 5, y - 13, 3, 3)
    context.fillRect(x + 3, y - 13, 3, 3)
  }
  context.restore()
}

function drawCharacter(x, y, skin, elapsed, ghost) {
  const alpha = ghost ? 0.62 : 1
  const scale = ghost ? 0.86 : 1
  const bodyWidth = 13 * scale
  const bodyHeight = 16 * scale
  const headRadius = 7 * scale
  context.save()
  context.globalAlpha = alpha
  context.shadowBlur = ghost ? 14 : 26
  context.shadowColor = skin.edge
  context.fillStyle = '#101820'
  context.beginPath(); context.ellipse(x, y + 18 * scale, 16 * scale, 4 * scale, 0, 0, Math.PI * 2); context.fill()
  context.shadowBlur = 0
  context.lineWidth = 1.6 * scale
  context.strokeStyle = '#050b0f'
  context.fillStyle = skin.core
  context.beginPath(); context.roundRect(x - bodyWidth / 2, y - 2 * scale, bodyWidth, bodyHeight, 3 * scale); context.fill(); context.stroke()
  context.fillStyle = skin.edge
  context.beginPath(); context.arc(x, y - 10 * scale, headRadius, 0, Math.PI * 2); context.fill(); context.stroke()
  context.fillStyle = '#18212a'
  context.beginPath(); context.arc(x - 2.5 * scale, y - 11 * scale, 1.2 * scale, 0, Math.PI * 2); context.fill()
  context.beginPath(); context.arc(x + 2.5 * scale, y - 11 * scale, 1.2 * scale, 0, Math.PI * 2); context.fill()
  context.fillStyle = skin.core
  context.beginPath(); context.roundRect(x - 8 * scale, y + 11 * scale, 6 * scale, 10 * scale, 2 * scale); context.fill(); context.stroke()
  context.beginPath(); context.roundRect(x + 2 * scale, y + 11 * scale, 6 * scale, 10 * scale, 2 * scale); context.fill(); context.stroke()
  context.strokeStyle = skin.edge
  context.beginPath(); context.moveTo(x - 7 * scale, y + 3 * scale); context.lineTo(x - 13 * scale, y + 8 * scale); context.moveTo(x + 7 * scale, y + 3 * scale); context.lineTo(x + 13 * scale, y + 8 * scale); context.stroke()
  context.strokeStyle = '#050b0f'
  if (skin.character === 'engineer' || skin.character === 'speed' || skin.character === 'robot') {
    context.fillStyle = skin.edge; context.beginPath(); context.roundRect(x - 10 * scale, y - 18 * scale, 20 * scale, 5 * scale, 2 * scale); context.fill(); context.stroke()
    context.fillRect(x - 6 * scale, y - 21 * scale, 12 * scale, 3 * scale)
  } else if (skin.character === 'zombie' || skin.character === 'toxic') {
    context.fillStyle = '#78b34d'; context.beginPath(); context.arc(x, y - 10 * scale, headRadius, 0, Math.PI * 2); context.fill(); context.stroke()
    context.fillStyle = '#eaffb0'; context.fillRect(x - 4 * scale, y - 12 * scale, 2 * scale, 2 * scale); context.fillRect(x + 2 * scale, y - 12 * scale, 2 * scale, 2 * scale)
  } else if (skin.character === 'bird' || skin.character === 'pilot') {
    context.fillStyle = skin.edge; context.beginPath(); context.moveTo(x + 5 * scale, y - 7 * scale); context.lineTo(x + 17 * scale, y - 13 * scale); context.lineTo(x + 8 * scale, y - 1 * scale); context.fill(); context.stroke()
  } else if (skin.character === 'wolf') {
    context.beginPath(); context.moveTo(x - 8 * scale, y - 14 * scale); context.lineTo(x - 6 * scale, y - 23 * scale); context.lineTo(x, y - 16 * scale); context.lineTo(x + 6 * scale, y - 23 * scale); context.lineTo(x + 8 * scale, y - 14 * scale); context.stroke()
  } else if (skin.character === 'axe' || skin.character === 'samurai') {
    context.strokeStyle = skin.edge; context.lineWidth = 2 * scale; context.beginPath(); context.moveTo(x + 9 * scale, y - 7 * scale); context.lineTo(x + 19 * scale, y - 19 * scale); context.stroke()
    context.fillStyle = skin.edge; context.fillRect(x + 14 * scale, y - 21 * scale, 7 * scale, 5 * scale)
  } else if (skin.character === 'sniper' || skin.character === 'commando') {
    context.strokeStyle = skin.edge; context.beginPath(); context.moveTo(x + 7 * scale, y); context.lineTo(x + 22 * scale, y - 7 * scale); context.stroke(); context.fillStyle = skin.edge; context.fillRect(x + 17 * scale, y - 9 * scale, 6 * scale, 3 * scale)
  } else if (skin.character === 'heavy') {
    context.strokeStyle = skin.edge; context.strokeRect(x - 12 * scale, y - 19 * scale, 24 * scale, 31 * scale)
  } else if (skin.character === 'ninja' || skin.character === 'shadow') {
    context.fillStyle = '#050b0f'; context.fillRect(x - 8 * scale, y - 12 * scale, 16 * scale, 4 * scale)
  } else if (skin.character === 'commander' || skin.character === 'boss') {
    context.strokeStyle = skin.edge; context.lineWidth = 2 * scale; context.beginPath(); context.moveTo(x - 9 * scale, y - 17 * scale); context.lineTo(x - 4 * scale, y - 24 * scale); context.lineTo(x, y - 17 * scale); context.lineTo(x + 5 * scale, y - 24 * scale); context.lineTo(x + 10 * scale, y - 17 * scale); context.stroke()
  } else if (skin.character === 'medic') {
    context.fillStyle = '#fff'; context.fillRect(x - 2 * scale, y - 17 * scale, 4 * scale, 10 * scale); context.fillRect(x - 5 * scale, y - 14 * scale, 10 * scale, 4 * scale)
  }
  if (skin.character === 'speed') {
    context.strokeStyle = skin.edge; context.globalAlpha = alpha * 0.45; context.beginPath(); context.moveTo(x - 20 * scale, y + 4 * scale); context.lineTo(x - 10 * scale, y + 4 * scale); context.moveTo(x - 19 * scale, y + 10 * scale); context.lineTo(x - 9 * scale, y + 10 * scale); context.stroke()
  }
  context.restore()
}

function playBattleAudio() {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext
  if (!AudioContextClass) return
  const audioContext = new AudioContextClass()
  const master = audioContext.createGain()
  master.gain.value = 0.035
  master.connect(audioContext.destination)
  const start = audioContext.currentTime
  ;[110, 146.8, 164.8, 220, 164.8, 146.8].forEach((frequency, index) => {
    const oscillator = audioContext.createOscillator()
    const gain = audioContext.createGain()
    const time = start + index * 0.32
    oscillator.type = 'triangle'
    oscillator.frequency.setValueAtTime(frequency, time)
    gain.gain.setValueAtTime(0.0001, time)
    gain.gain.exponentialRampToValueAtTime(0.18, time + 0.04)
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.28)
    oscillator.connect(gain)
    gain.connect(master)
    oscillator.start(time)
    oscillator.stop(time + 0.3)
  })
  setTimeout(() => audioContext.close(), 2400)
}

function playLossLaugh() {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext
  if (!AudioContextClass) return
  const audioContext = new AudioContextClass()
  const master = audioContext.createGain()
  master.gain.value = 0.045
  master.connect(audioContext.destination)
  ;[180, 250, 180, 250, 160].forEach((frequency, index) => {
    const oscillator = audioContext.createOscillator()
    const gain = audioContext.createGain()
    const time = audioContext.currentTime + index * 0.18
    oscillator.type = 'square'
    oscillator.frequency.setValueAtTime(frequency, time)
    gain.gain.setValueAtTime(0.0001, time)
    gain.gain.exponentialRampToValueAtTime(0.22, time + 0.03)
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.13)
    oscillator.connect(gain)
    gain.connect(master)
    oscillator.start(time)
    oscillator.stop(time + 0.15)
  })
  setTimeout(() => audioContext.close(), 1100)
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

function playLossAudio() {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext
  if (!AudioContextClass) return

  const audioContext = new AudioContextClass()
  const master = audioContext.createGain()
  master.gain.value = 0.08
  master.connect(audioContext.destination)

  const sequence = [220, 196, 174, 146, 130, 110, 98]
  const start = audioContext.currentTime

  sequence.forEach((frequency, index) => {
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()
    const attack = 0.02
    const decay = 0.5
    const time = start + index * 0.8

    oscillator.type = 'sawtooth'
    oscillator.frequency.setValueAtTime(frequency, time)
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(frequency * 0.72, 60), time + decay)

    gainNode.gain.setValueAtTime(0.0001, time)
    gainNode.gain.exponentialRampToValueAtTime(0.12, time + attack)
    gainNode.gain.exponentialRampToValueAtTime(0.0001, time + decay)

    oscillator.connect(gainNode)
    gainNode.connect(master)

    oscillator.start(time)
    oscillator.stop(time + decay + 0.08)
  })

  setTimeout(() => {
    audioContext.close()
  }, 6200)
}

function showLossScreen() {
  const overlay = document.querySelector('#loss-overlay')
  if (!overlay) return
  overlay.hidden = false
  overlay.classList.add('is-visible')
  playLossAudio()
  playLossLaugh()

  setTimeout(() => {
    window.location.reload()
  }, 6000)
}

function showWinScreen() {
  if (onlineMatchEnded) return
  onlineMatchEnded = true
  running = false
  message.querySelector('.eyebrow').textContent = 'VICTORIA DE ARENA'
  message.querySelector('h1').innerHTML = 'EL RIVAL<br><em>HA CAÍDO.</em>'
  message.querySelector('p').textContent = `Sobreviviste ${elapsedTime.toFixed(1)} segundos. El ganador queda en pie.`
  startButton.querySelector('span:first-child').textContent = 'VOLVER A JUGAR'
  message.classList.remove('hidden')
  playLossLaugh()
}

function showSpectatorScreen(reason) {
  onlineSpectator = true
  spectatorEchoActive = false
  running = false
  message.querySelector('.eyebrow').textContent = 'MODO ESPECTADOR'
  message.querySelector('h1').innerHTML = 'TE ELIMINARON<br><em>CONTROLA UN ECO.</em>'
  message.querySelector('p').textContent = `${reason} El rival sigue vivo. Puedes añadir un eco controlable.`
  startButton.hidden = true
  if (!document.querySelector('#spectator-echo-button')) {
    const spectatorButton = document.createElement('button')
    spectatorButton.className = 'primary-button'
    spectatorButton.id = 'spectator-echo-button'
    spectatorButton.innerHTML = '<span>AÑADIR ECO</span><span>+</span>'
    spectatorButton.addEventListener('click', activateSpectatorEcho)
    message.append(spectatorButton)
  }
  message.classList.remove('hidden')
}

function endRun(elapsed, reason = 'Tu pasado te encontró.') {
  if (onlineMode && !onlinePlayerAlive) return
  if (lives > 1) {
    lives -= 1
    livesElement.textContent = lives
    powerGraceUntil = elapsed + 2.5
    idleFor = 0
    updatePeerRoomDisplay(onlineMode ? 'VIDA PERDIDA · CONTINUA EN LA ARENA' : 'VIDA PERDIDA · TE QUEDA 1')
    return
  }
  if (onlineMode && !onlineMatchEnded) {
    onlinePlayerAlive = false
    sendMatchResult('defeated')
    showSpectatorScreen(reason)
    scheduleOnlineRestart()
    return
  }
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
  showLossScreen()
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
    powerGraceUntil = elapsedTime + 1.5
    powerPanel.hidden = true
    delete powerPanel.dataset.shown
    running = true
    lastFrame = performance.now()
    requestAnimationFrame(frame)
  }, { once: true }))
}

function bindCanvasControls() {
  if (!canvas || canvas.dataset.controlsBound === 'true') return
  canvas.addEventListener('pointermove', (event) => {
    if (onlineSpectator) moveSpectatorEcho(event)
    else if (!onlineSetupActive) pointerMove(event)
  })
  canvas.addEventListener('pointerdown', (event) => {
    if (onlineSpectator) moveSpectatorEcho(event)
    else if (!placeOnlineTrap(event)) pointerMove(event)
  })
  canvas.addEventListener('touchmove', (event) => {
    if (onlineSpectator) moveSpectatorEcho(event)
    else if (!onlineSetupActive) pointerMove(event)
  }, { passive: true })
  canvas.dataset.controlsBound = 'true'
}

document.addEventListener('click', (event) => {
  if (event.target.closest('#start-button')) startRun()
})
soundButton.addEventListener('click', () => {
  const muted = soundButton.textContent === '◒'
  soundButton.textContent = muted ? '◐' : '◒'
  soundButton.setAttribute('aria-label', muted ? 'Silenciar sonido' : 'Activar sonido')
})
bindCanvasControls()
window.addEventListener('resize', resize)
resize()
