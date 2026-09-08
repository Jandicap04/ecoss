import './style.css'

document.querySelector('#app').innerHTML = `
  <main class="shell">
    <header class="topbar">
      <div class="brand"><span class="brand-mark">◌</span><span>ECHO LOOP</span></div>
      <div class="run-type"><span class="live-dot"></span><span id="mode-label">ARENA LIVE</span></div>
      <div class="topbar-actions">
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
        <button class="primary-button" type="submit"><span>ENTRAR AL LOBBY</span><span>→</span></button>
      </form>
    </div>

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
    <div class="loss-overlay" id="loss-overlay" hidden>
      <img src="https://i.pinimg.com/736x/2c/80/35/2c80351220a2fb253ec5012caed56bd5.jpg" alt="Derrota" />
      <div class="loss-overlay-label">SE ACABÓ LA RUN</div>
    </div>
    <footer class="footer"><span>ARRASTRA PARA MOVERTE</span><span id="daily-label">MODO DIARIO · DISPONIBLE</span></footer>
  </main>
`

let canvas = document.querySelector('#game')
let context = canvas.getContext('2d')
const timeElement = document.querySelector('#time')
const bestElement = document.querySelector('#best')
const echoCountElement = document.querySelector('#echo-count')
const powerStatusElement = document.querySelector('#power-status')
const message = document.querySelector('#message')
const powerPanel = document.querySelector('#power-panel')
const powerGrid = document.querySelector('#power-grid')
const startButton = document.querySelector('#start-button')
const soundButton = document.querySelector('#sound-button')
const goldBallButton = document.querySelector('#gold-ball')
const skinList = document.querySelector('#skin-list')
const currencyElement = document.querySelector('#currency')
const playOnlineButton = document.querySelector('#play-online-button')
const nicknameOverlay = document.querySelector('#nickname-overlay')
const nicknameForm = document.querySelector('#nickname-form')
const nicknameInput = document.querySelector('#nickname-input')

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
const onlineChannel = 'BroadcastChannel' in window ? new BroadcastChannel('echo-loop-live-arena') : null
const presenceKeyPrefix = 'echo-loop-online-player-'

function handleOnlinePresence(state) {
  if (!state || state.id === localPlayerId) return
  onlinePeers.set(state.id, { id: state.id, name: state.name || 'RIVAL', lastSeen: performance.now() })
  updateOnlinePlayersDisplay()
  if (onlineLobbyActive && !onlineMode) {
    onlineLobbyActive = false
    if (presenceInterval) clearInterval(presenceInterval)
    onlineMode = true
    onlineMatchActive = true
    onlineCountdown = 60
    startRun()
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
    if (state.type !== 'player-state') return
    opponent = { id: state.id, name: state.name || 'RIVAL', x: state.x, y: state.y, lastSeen: performance.now() }
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
        <div class="topbar-actions"><button class="icon-button" id="sound-button" aria-label="Activar o silenciar sonido">◒</button></div>
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
      <section class="game-wrap online-match-wrap">
        <canvas id="game" aria-label="Arena de preparación online."></canvas>
      </section>
    </main>
  `

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
    }
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
  if (onlineChannel && onlinePeers.size > 0) {
    onlineLobbyActive = false
    clearInterval(presenceInterval)
    onlineMode = true
    onlineMatchActive = true
    onlineCountdown = 60
    startRun()
    return
  }
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
  const room = registerOnlinePlayer(name || localStorage.getItem('echo-loop-player-name') || 'JUGADOR')
  if (!onlineChannel && room.players.length >= 2) {
    onlineMode = true
    onlineCountdown = 60
    onlineMatchActive = true
    startRun()
    return
  }
  renderOnlineWaitingState(name)
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

playOnlineButton.addEventListener('click', () => {
  nicknameOverlay.hidden = false
  nicknameInput.value = localStorage.getItem('echo-loop-player-name') || ''
  nicknameInput.focus()
})

nicknameForm.addEventListener('submit', (event) => {
  event.preventDefault()
  const name = nicknameInput.value.trim().replace(/\s+/g, ' ').slice(0, 16)
  if (!name) return
  nicknameOverlay.hidden = true
  startOnlineArena(name)
})

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
let powerGraceUntil = 0

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
  powerGraceUntil = 0
  powerStatusElement.textContent = '--'
  powerPanel.hidden = true
  delete powerPanel.dataset.shown
  message.classList.add('hidden')
  if (onlineMode) {
    onlineCountdown = 60
    setTimeout(() => {
      if (!running) return
      for (let i = 0; i < 5; i += 1) {
        echoes.push({
          born: elapsedTime,
          color: i % 2 ? '#ff8a65' : '#d7ff63',
          drift: (Math.random() - 0.5) * 36,
          phase: Math.random() * Math.PI * 2,
          isDecoy: false,
          x: arena.left + 40 + Math.random() * (arena.right - arena.left - 80),
          y: arena.top + 40 + Math.random() * (arena.bottom - arena.top - 80),
        })
      }
      for (let i = 0; i < 2; i += 1) {
        traps.push({
          x: arena.left + 60 + Math.random() * (arena.right - arena.left - 120),
          y: arena.top + 60 + Math.random() * (arena.bottom - arena.top - 120),
          radius: 26,
          born: elapsedTime,
          speed: 10,
          memoryDelay: 2,
          phase: Math.random() * Math.PI,
          laserAngle: Math.random() * Math.PI * 2,
          laserSpeed: 0.9,
        })
      }
    }, 1000)
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
  if (onlineMode && onlineChannel && performance.now() - lastOnlineBroadcast > 50) {
    onlineChannel.postMessage({ type: 'player-state', id: localPlayerId, name: localStorage.getItem('echo-loop-player-name') || 'JUGADOR', x: player.x, y: player.y })
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
  if (elapsed < powerGraceUntil) return
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
  if (onlineMode && opponent && performance.now() - opponent.lastSeen < 3000) {
    drawCircle(opponent.x, opponent.y, playerRadius + 1, '#ff8a65', false)
    context.fillStyle = '#ffcfbf'
    context.font = '10px DM Mono, monospace'
    context.textAlign = 'center'
    context.fillText(opponent.name, opponent.x, opponent.y - 18)
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

  setTimeout(() => {
    window.location.reload()
  }, 6000)
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
  canvas.addEventListener('pointermove', pointerMove)
  canvas.addEventListener('pointerdown', pointerMove)
  canvas.addEventListener('touchmove', pointerMove, { passive: true })
  canvas.dataset.controlsBound = 'true'
}

startButton.addEventListener('click', startRun)
soundButton.addEventListener('click', () => {
  const muted = soundButton.textContent === '◒'
  soundButton.textContent = muted ? '◐' : '◒'
  soundButton.setAttribute('aria-label', muted ? 'Silenciar sonido' : 'Activar sonido')
})
bindCanvasControls()
window.addEventListener('resize', resize)
resize()
