// ─── VideoCall static data — extracted for code splitting & readability ───

export const REMOTE_VIDEO_URL_HLS = '/hls/videolive/master.m3u8'
export const REMOTE_VIDEO_URL_HLS_2 = '/hls/videolive2/master.m3u8'
export const REMOTE_VIDEO_URL_MP4 = '/videolive.mp4'
export const REMOTE_VIDEO_URL_MP4_2 = '/videolive2.mp4'
export const AVATAR_URL = '/foto1.jpg'
export const CONTACT_NAME = 'Julia 🫦'
export const CONTACT_HANDLE = '@julia'
export const HEART_EMOJIS = ['❤️', '💖', '💜', '💙', '💛', '🩷', '💗', '💕', '🔥', '💞', '💓', '💗', '💖', '💝', '💘', '💕', '💞', '💓', '💗', '💖', '💝', '💘']
export const STORAGE_KEY = 'video_call_accessed'

export const QUICK_REACTIONS = [
  { text: '👍👍👍', id: 'thumbs' },
  { text: '✦ Curioso!', id: 'curious' },
  { text: '✦ Entendi!', id: 'got-it' },
  { text: '✦ Vamos ver!', id: 'lets-see' },
  { text: 'Que maneiro!😍', id: 'cool' },
]

// ─── Time-aware messages ────────────────────────────────────
export type TimePeriod = 'madrugada' | 'manha' | 'tarde' | 'noite'

function getTimePeriod(): TimePeriod {
  const h = new Date().getHours()
  if (h >= 0 && h < 6) return 'madrugada'
  if (h >= 6 && h < 12) return 'manha'
  if (h >= 12 && h < 18) return 'tarde'
  return 'noite'
}

const TIME_MESSAGES: Record<TimePeriod, string[]> = {
  madrugada: [
    'boa noite', 'que horas são??', 'quase dormindo',
    'a galera não dorme não?', 'quem tá assistindo de madrugada levanta a mão',
    'de madrugada e o chat lotado', 'eu devia tar dormindo mas tô aqui',
    'manda eles irem dormir', 'essa galera n tem sono n kk',
    'todo mundo insone nessa live', 'ninguém dorme nessa porra',
    'minha cama me esperando mas tô aqui', '3 da manhã e eu aqui firme',
    'vou perder a hora amanhã por causa dessa live', 'vai amanhecer e eu aqui',
    'quem precisa de sono quando tem ela', 'larguei até o travesseiro',
    'mais uma noite perdida por essa live', 'fone no escuro assistindo kkk',
    'o silêncio da madrugada e essa live de fundo',
  ],
  manha: [
    'bom dia', 'acordei agora', 'que horas começa isso?',
    'a galera não trabalha não?', 'quem tá assistindo agora cedo levanta a mão',
    'de manhã e o chat lotado', 'eu devia ta trabalhando mas tô aqui',
    'manda eles irem trabalhar', 'essa galera n tem emprego n kk',
    'assistindo no café da manhã', 'mal acordei e já tô aqui',
    'tô no ônibus assistindo', 'começar o dia assim é top',
    'bom dia galera insana', 'café e live é a combinação perfeita',
    'de manhã e o chat já tá animado', 'acordei por causa dessa live',
    'melhor despertador é essa live', 'tô no trabalho assistindo escondido',
    'assistindo no banheiro do trampo kk',
  ],
  tarde: [
    'boa tarde', 'que horas são??', 'to no intervalo assistindo',
    'a galera não trabalha não?', 'quem tá assistindo de tarde levanta a mão',
    'de tarde e o chat lotado', 'eu devia ta trabalhando mas tô aqui',
    'manda eles irem estudar', 'essa galera n tem emprego n kk',
    'tô na aula assistindo kk', 'almoço e live combinação perfeita',
    'pausa no trampo pra assistir', 'o patrão ia me demitir se visse',
    'boa tarde rapaziada', 'tarde produtiva aqui', 'assistindo no intervalo',
    'troquei o almoço pela live', 'de boa na tarde vendo live',
    'tô no trabalho assistindo escondido',
    'assistindo no banheiro do trampo kk',
  ],
  noite: [
    'boa noite', 'que horas são??', 'quase dormindo',
    'a galera não dorme não?', 'quem tá assistindo de noite levanta a mão',
    'de noite e o chat lotado', 'eu devia tar dormindo mas tô aqui',
    'manda eles irem dormir', 'essa galera n tem sono n kk',
    'boa noite galera insana', 'noite de live é noite boa',
    'jantei e vim pra live', 'melhor programa da noite é esse',
    'o patrão ia me demitir se visse', 'noite perfeita com essa live',
    'tranquei o quarto e vim assistir', 'todo mundo de boa a noite',
    'noite produtiva hein', 'tô no escuro assistindo kk',
    'boa noite pra quem acabou de chegar',
  ],
}

export function getRandomTimeMessage(): string {
  const period = getTimePeriod()
  const msgs = TIME_MESSAGES[period]
  return msgs[Math.floor(Math.random() * msgs.length)]
}

// ─── Types ──────────────────────────────────────────────────
export interface LiveUser { name: string; level: number; badge?: string }

export interface ChatMessage {
  id: string
  type: 'message' | 'join'
  author: string
  text: string
  level?: number
  levelColor?: string
  badgeEmoji?: string
  isOwn: boolean
  isHost: boolean
}

// ─── Level color helper ─────────────────────────────────────
export const getLevelColor = (level: number): string => {
  if (level >= 49) return 'linear-gradient(135deg, #fbbf24, #f59e0b)' // Dourado — top
  if (level >= 43) return '#ef4444'   // Vermelho — elite
  if (level >= 37) return '#f97316'   // Laranja — VIP
  if (level >= 29) return '#c084fc'   // Roxo — frequente
  if (level >= 21) return '#3b82f6'   // Azul — ativo
  if (level >= 13) return '#38bdf8'   // Azul claro — regular
  if (level >= 6) return '#4ade80'    // Verde — casual
  if (level >= 1) return '#22d3ee'    // Ciano — novato
  return '#64748b'
}

// ─── Final messages from Julia ──────────────────────────────
export const FINAL_MESSAGES = [
  { text: 'Preciso sair da call agora amor, desculpa 😔', delay: 0 },
  { text: 'O que vc achou da nossa chamada? Gostou? 😏', delay: 3000 },
  { text: 'foi meio rápido, mas foi legal te ver aqui haha', delay: 4000 },
  { text: 'Me chama no whats depois, vamos conversar mais! ❤️', delay: 3000 },
  { text: 'ia adorar te ver de novo, anjo...', delay: 4000 },
  { text: 'Quem sabe logo logo a gente nao marca outra, ne? 😈 Ia gostar disso?', delay: 3000 },
  { text: 'Ate mais amor, bjim 😘😘', delay: 4000 },
]
