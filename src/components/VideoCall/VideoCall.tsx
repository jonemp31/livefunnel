import { useEffect, useRef, useState, useCallback } from 'react'
import Hls from 'hls.js'
import './VideoCall.css'

// URLs do vídeo - HLS como principal, MP4 como fallback
const REMOTE_VIDEO_URL_HLS = '/hls/videolive/master.m3u8'
const REMOTE_VIDEO_URL_HLS_2 = '/hls/videolive2/master.m3u8'
const REMOTE_VIDEO_URL_MP4 = '/videolive.mp4'
const REMOTE_VIDEO_URL_MP4_2 = '/videolive2.mp4'
const AVATAR_URL = '/foto1.jpg'
const CONTACT_NAME = 'Julia 🫦'
const CONTACT_HANDLE = '@julia'
const HEART_EMOJIS = ['❤️', '💖', '💜', '💙', '💛', '🩷', '💗', '💕', '🔥', '💞', '💓', '💗', '💖', '💝', '💘', '💕', '💞', '💓', '💗', '💖', '💝', '💘']
const STORAGE_KEY = 'video_call_accessed'

// ─── Time-aware messages ────────────────────────────────────
type TimePeriod = 'madrugada' | 'manha' | 'tarde' | 'noite'
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

function getRandomTimeMessage(): string {
  const period = getTimePeriod()
  const msgs = TIME_MESSAGES[period]
  return msgs[Math.floor(Math.random() * msgs.length)]
}

// ─── Live Chat Simulation ───────────────────────────────────
interface LiveUser { name: string; level: number; badge?: string }
const LIVE_USERS: LiveUser[] = [
  // ─── Sem badge (level 0) — ~30% dos usuários ───
  { name: 'Lucas Alves', level: 0 },
  { name: 'pedrohenrique', level: 0 },
  { name: 'caiozz', level: 0 },
  { name: 'andrezin', level: 0 },
  { name: 'gustavim', level: 0 },
  { name: 'henriquepr', level: 0 },
  { name: 'diegozin', level: 0 },
  { name: 'pedrão', level: 0 },
  { name: 'guizin', level: 0 },
  { name: 'ricardim', level: 0 },
  { name: 'kaue_01', level: 0 },
  { name: 'cleitin', level: 0 },
  { name: 'pedrin_10', level: 0 },
  { name: 'rayan_01', level: 0 },
  { name: 'caiozin_', level: 0 },
  { name: 'felipin', level: 0 },
  { name: 'thiaguim', level: 0 },
  { name: 'brunin', level: 0 },
  { name: 'kauezim', level: 0 },
  { name: 'vinny_01', level: 0 },
  { name: 'ramonzin', level: 0 },
  { name: 'carlin_01', level: 0 },
  { name: 'renanzin', level: 0 },
  { name: 'luis_10', level: 0 },
  { name: 'pedrozin', level: 0 },
  { name: 'marcoss', level: 0 },
  { name: 'jeanbr', level: 0 },
  { name: 'murilozin', level: 0 },
  { name: 'luis_33', level: 0 },
  { name: 'joao_33', level: 0 },
  { name: 'tonybr_', level: 0 },
  { name: 'lucaobr', level: 0 },
  { name: 'luisbr', level: 0 },
  { name: 'brenin', level: 0 },
  { name: 'jean_33', level: 0 },
  { name: 'rafa_10', level: 0 },
  { name: 'ramonzim', level: 0 },
  { name: 'danielplay', level: 0 },
  { name: 'jeanplay', level: 0 },
  { name: 'viniciusbr', level: 0 },
  { name: 'samuel_021', level: 0 },
  { name: 'lucas_33', level: 0 },
  { name: 'vini_021', level: 0 },
  { name: 'caio_33', level: 0 },
  { name: 'murilo_top', level: 0 },
  { name: 'fred55', level: 0 },
  { name: 'ID:938091637', level: 0 },
  { name: 'ID:7291045', level: 0 },
  { name: 'ID:551283', level: 0 },
  { name: 'user_292817', level: 0 },
  { name: 'novo_aqui_01', level: 0 },
  { name: 'visitante99', level: 0 },
  { name: 'entrei_agora', level: 0 },
  { name: 'curiosobr', level: 0 },
  { name: 'passando_', level: 0 },
  { name: 'novato2026', level: 0 },
  { name: 'ID:44820193', level: 0 },
  { name: 'ID:10293847', level: 0 },
  { name: 'user_br_55', level: 0 },
  { name: 'anonbr', level: 0 },

  // ─── Cinza — novatos (level 1-5) ───
  { name: 'Matheus_01', level: 3 },
  { name: 'brunim23', level: 2 },
  { name: 'vini_1998', level: 4 },
  { name: 'rodrigues99', level: 1 },
  { name: 'carlosbr', level: 3 },
  { name: 'leozin77', level: 2 },
  { name: 'brenno', level: 5 },
  { name: 'rafa_boy', level: 1 },
  { name: 'tonim_33', level: 4 },
  { name: 'luisantonio_', level: 3 },
  { name: 'henri_10', level: 2 },
  { name: 'marcola', level: 5 },
  { name: 'andre_lima', level: 1 },
  { name: 'igorzin', level: 3 },
  { name: 'pedro_h', level: 4 },
  { name: 'breno_021', level: 2 },
  { name: 'tony_01', level: 5 },
  { name: 'vini_br', level: 1 },
  { name: 'erick_77', level: 3 },
  { name: 'kauebr', level: 4 },
  { name: 'gustavo_021', level: 2 },
  { name: 'dan_021', level: 5 },
  { name: 'matheus_10', level: 1 },
  { name: 'vini55', level: 3 },
  { name: 'bruno_top', level: 4 },
  { name: 'fred_01', level: 2 },
  { name: 'gustavoBR55', level: 5 },
  { name: 'leo_br', level: 1 },

  // ─── Verde — casual (level 6-12) ───
  { name: 'FelipeBR', level: 10 },
  { name: 'Daniel_77', level: 11 },
  { name: 'willian_10', level: 8 },
  { name: 'Ramon_021', level: 7 },
  { name: 'murilo_7', level: 9 },
  { name: 'lucaodamassa', level: 6 },
  { name: 'tiagao', level: 10 },
  { name: 'samuel_98', level: 7 },
  { name: 'Igor_33', level: 9 },
  { name: 'allan_021', level: 11 },
  { name: 'rodrigo_11', level: 6 },
  { name: 'gustavo_123', level: 8 },
  { name: 'joaopedro', level: 12 },
  { name: 'brunogamer', level: 7 },
  { name: 'rapha_77', level: 9 },
  { name: 'JEAN_10', level: 10 },
  { name: 'RaphaelBoy', level: 8 },
  { name: 'MatheusBR', level: 11 },
  { name: 'vini_silva', level: 7 },
  { name: 'gustavobr', level: 12 },
  { name: 'daniel_021', level: 8 },
  { name: 'lucas_98', level: 11 },
  { name: 'will_33', level: 9 },
  { name: 'rafaell', level: 7 },
  { name: 'marcelo_10', level: 8 },
  { name: 'samuca', level: 6 },
  { name: 'arthurzinho', level: 10, badge: '🎪' },
  { name: 'murilobr', level: 7 },
  { name: 'joaovictor_', level: 11 },
  { name: 'davi_10', level: 9 },
  { name: 'thiagos', level: 6 },
  { name: 'caio_77', level: 8 },
  { name: 'allanbr', level: 10 },
  { name: 'matheus_s', level: 7 },
  { name: 'rafa_33', level: 9 },
  { name: 'henrique_77', level: 8 },
  { name: 'danielzin', level: 7 },
  { name: 'gustavim_', level: 6 },
  { name: 'ramon_10', level: 7 },
  { name: 'bruno_33', level: 6 },
  { name: 'samuelbr', level: 7 },
  { name: 'vini_33', level: 8 },
  { name: 'rayanbr', level: 6 },
  { name: 'marcelo_77', level: 9 },
  { name: 'henriquebr', level: 7 },
  { name: 'caio_br', level: 11 },
  { name: 'willbr', level: 6 },
  { name: 'igorzim', level: 8 },
  { name: 'joaobr', level: 10 },
  { name: 'pedro_021', level: 9 },
  { name: 'rafabr', level: 8 },
  { name: 'jean_021', level: 6 },
  { name: 'erickbr', level: 7 },
  { name: 'raphael_33', level: 10 },
  { name: 'brunobr', level: 8 },
  { name: 'leo_10', level: 7 },
  { name: 'thiago_021', level: 11 },
  { name: 'pedro_10', level: 6 },
  { name: 'gustavobr_', level: 9 },
  { name: 'caio_021', level: 10 },
  { name: 'henrique_33', level: 8 },
  { name: 'rafa_021', level: 7 },
  { name: 'igor_021', level: 8 },
  { name: 'ramonbr', level: 6 },
  { name: 'will_021', level: 9 },
  { name: 'renanbr', level: 7 },
  { name: 'rapha_021', level: 6 },
  { name: 'patrick_33', level: 8 },
  { name: 'fredbr', level: 9 },
  { name: 'erick_10', level: 7 },
  { name: 'felipe_021', level: 10 },
  { name: 'lucas_77', level: 12 },
  { name: 'thiago_33', level: 6 },
  { name: 'murilo_10', level: 9 },
  { name: 'bruno_021', level: 8 },
  { name: 'henrique_021', level: 11 },
  { name: 'pedro_33', level: 7 },
  { name: 'igorbr_', level: 6 },
  { name: 'danielbr_', level: 10 },
  { name: 'renan_021', level: 8 },
  { name: 'marcelo_021', level: 9 },
  { name: 'willianbr', level: 7 },
  { name: 'caiofire', level: 7 },
  { name: 'thiagobr55', level: 9 },
  { name: 'ramonplay', level: 6 },
  { name: 'tonyplay', level: 7 },
  { name: 'igor55', level: 8 },

  // ─── Azul claro — regular (level 13-20) ───
  { name: 'Gabriel Souza', level: 15, badge: '⭐' },
  { name: 'Rafael Lima', level: 13 },
  { name: 'JoãoVictor', level: 14 },
  { name: 'Marcos Paulo', level: 20, badge: '🦋' },
  { name: 'Thiago Silva', level: 18 },
  { name: 'Eduardo Alves', level: 16 },
  { name: 'FernandoBR', level: 13 },
  { name: 'Davi Lucca', level: 15 },
  { name: 'Renan Silva', level: 17 },
  { name: 'Marcelo Alves', level: 19 },
  { name: 'Erick Silva', level: 16 },
  { name: 'LucasBR55', level: 14 },
  { name: 'Patrick Alves', level: 18 },
  { name: 'fred31', level: 13 },
  { name: 'edu_77', level: 14 },
  { name: 'felipebrasil', level: 15 },
  { name: 'patrick_10', level: 17 },
  { name: 'thiago_br', level: 16 },
  { name: 'pedrinho_10', level: 14 },
  { name: 'leo_33', level: 13, badge: '🌙' },
  { name: 'arthur_021', level: 15 },
  { name: 'lucasplay', level: 18 },
  { name: 'pedrofire', level: 16 },
  { name: 'rafa_top', level: 14 },
  { name: 'henrique_55', level: 17 },
  { name: 'leo_top', level: 19 },
  { name: 'arthur55', level: 13 },
  { name: 'erick_top', level: 15 },
  { name: 'patrick55', level: 20 },
  { name: 'gabriel_10', level: 15 },
  { name: 'gabriel_021', level: 16 },
  { name: 'daniel_33', level: 13 },
  { name: 'raphael_021', level: 14 },

  // ─── Azul — ativo (level 21-28) ───
  { name: 'Arthur Lima', level: 22, badge: '🔥' },
  { name: 'pedrovip', level: 28 },
  { name: 'gustavovip', level: 25 },
  { name: 'henriquevip', level: 27, badge: '🎯' },
  { name: 'caiovip', level: 22 },
  { name: 'vinivip', level: 26 },
  { name: 'murilovip', level: 24 },
  { name: 'igorvip', level: 23 },
  { name: 'jeanvip', level: 25 },
  { name: 'tonyvip', level: 27 },
  { name: 'fredevip', level: 21 },
  { name: 'raphavip', level: 28, badge: '⭐' },
  { name: 'arthurbr', level: 24 },
  { name: 'edu_021', level: 26 },
  { name: 'patrickbr', level: 22 },
  { name: 'renan_33', level: 25 },
  { name: 'eduardo_021', level: 23 },

  // ─── Roxo — frequente (level 29-36) ───
  { name: 'lucasvip', level: 30, badge: '👑' },
  { name: 'rafavip', level: 35, badge: '💎' },
  { name: 'danielvip', level: 32 },
  { name: 'ramonvip', level: 29 },
  { name: 'arthurvip', level: 33, badge: '🔥' },
  { name: 'brunovip', level: 36, badge: '👑' },
  { name: 'patrickvip', level: 34 },
  { name: 'erickvip', level: 30 },
  { name: 'thiagovip', level: 31 },

  // ─── Laranja — VIP (level 37-42) ───
  { name: 'lucasofc', level: 40, badge: '💎' },
  { name: 'pedroofc', level: 42, badge: '👑' },
  { name: 'rafaofc', level: 38, badge: '🔥' },
  { name: 'danielofc', level: 41 },
  { name: 'leovip', level: 38, badge: '⭐' },

  // ─── Vermelho — elite (level 43-48) ───
  { name: 'gustavoofc', level: 45, badge: '💎' },
  { name: 'caioofc', level: 43, badge: '👑' },
  { name: 'leoofc', level: 48, badge: '🔥' },

  // ─── Dourado — top (level 49-50) ───
  { name: 'henriqueofc', level: 50, badge: '👑' },

  // ═══════════════════════════════════════════════════════════
  // ─── Novos nicks — Sem badge (level 0) — ~30% ───
  { name: 'patrick_alves', level: 0 },
  { name: 'tony_87', level: 0 },
  { name: 'fred31', level: 0 },
  { name: 'rayan22', level: 0 },
  { name: 'rapha_lima', level: 0 },
  { name: 'tonim32', level: 0 },
  { name: 'erick_85', level: 0 },
  { name: 'jean_carlos', level: 0 },
  { name: 'luis_antonio', level: 0 },
  { name: 'raphaelboy', level: 0 },
  { name: 'zezinho_79', level: 0 },
  { name: 'marcio_33', level: 0 },
  { name: 'betao_84', level: 0 },
  { name: 'ceara_mix', level: 0 },
  { name: 'dimas_82', level: 0 },
  { name: 'edinho73', level: 0 },
  { name: 'fabio_lp', level: 0 },
  { name: 'gilmar_88', level: 0 },
  { name: 'helio_80', level: 0 },
  { name: 'irineu_77', level: 0 },
  { name: 'jair_86', level: 0 },
  { name: 'kleber_81', level: 0 },
  { name: 'leandrin_78', level: 0 },
  { name: 'marquinhos_83', level: 0 },
  { name: 'nilton_85', level: 0 },
  { name: 'orlando_79', level: 0 },
  { name: 'paulinho_87', level: 0 },
  { name: 'quim_84', level: 0 },
  { name: 'robson_82', level: 0 },
  { name: 'sandro_76', level: 0 },
  { name: 'tonhao_80', level: 0 },
  { name: 'uillian_85', level: 0 },
  { name: 'valdir_81', level: 0 },
  { name: 'wagner_83', level: 0 },
  { name: 'xande_78', level: 0 },
  { name: 'yuri_86', level: 0 },
  { name: 'zeca_79', level: 0 },
  { name: 'adilson_77', level: 0 },
  { name: 'beto_82', level: 0 },
  { name: 'claudio_84', level: 0 },
  { name: 'dudu_85', level: 0 },
  { name: 'elias_80', level: 0 },
  { name: 'fabinho_83', level: 0 },
  { name: 'gustavo_81', level: 0 },
  { name: 'helder_87', level: 0 },
  { name: 'ivan_78', level: 0 },
  { name: 'juninho_79', level: 0 },
  { name: 'kadu_84', level: 0 },
  { name: 'leo_82', level: 0 },
  { name: 'maicon_86', level: 0 },
  { name: 'nando_80', level: 0 },
  { name: 'oseias_85', level: 0 },
  { name: 'paulao_77', level: 0 },
  { name: 'quinho_83', level: 0 },
  { name: 'ronaldo_81', level: 0 },
  { name: 'sergio_84', level: 0 },
  { name: 'tiago_78', level: 0 },
  { name: 'uender_85', level: 0 },
  { name: 'valter_79', level: 0 },
  { name: 'wellington_82', level: 0 },
  { name: 'xisto_86', level: 0 },
  { name: 'ytalo_80', level: 0 },
  { name: 'zelao_84', level: 0 },
  { name: 'ademir_77', level: 0 },
  { name: 'branco_83', level: 0 },
  { name: 'carlinhos_81', level: 0 },
  { name: 'djalma_85', level: 0 },
  { name: 'edson_79', level: 0 },
  { name: 'fernando_82', level: 0 },
  { name: 'genilson_86', level: 0 },
  { name: 'ivo_84', level: 0 },
  { name: 'jorge_78', level: 0 },
  { name: 'klebinho_83', level: 0 },
  { name: 'lucas_81', level: 0 },
  { name: 'marcelo_85', level: 0 },
  { name: 'nilmar_79', level: 0 },
  { name: 'odair_82', level: 0 },
  { name: 'paulo_cezar', level: 0 },
  { name: 'ID874680', level: 0 },
  { name: 'ID359172', level: 0 },
  { name: 'ID426815', level: 0 },
  { name: 'ID791243', level: 0 },
  { name: 'ID538097', level: 0 },
  { name: 'ID612384', level: 0 },
  { name: 'ID245679', level: 0 },
  { name: 'ID803561', level: 0 },
  { name: 'ID970428', level: 0 },
  { name: 'ID157836', level: 0 },
  { name: 'ID684209', level: 0 },
  { name: 'ID732541', level: 0 },
  { name: 'ID896305', level: 0 },
  { name: 'ID413782', level: 0 },
  { name: 'ID527694', level: 0 },

  // ─── Novos nicks — Cinza (level 1-5) ───
  { name: 'quaresma_84', level: 2 },
  { name: 'renato_80', level: 4 },
  { name: 'sidney_86', level: 1 },
  { name: 'toninho_81', level: 3 },
  { name: 'ula_85', level: 5 },
  { name: 'valdecir_79', level: 2 },
  { name: 'waldir_82', level: 4 },
  { name: 'xaxa_84', level: 1 },
  { name: 'yago_80', level: 3 },
  { name: 'zanata_83', level: 5 },
  { name: 'almir_77', level: 2 },
  { name: 'betinho_81', level: 4 },
  { name: 'ciro_85', level: 1 },
  { name: 'dede_79', level: 3 },
  { name: 'edvaldo_82', level: 5 },
  { name: 'finho_84', level: 2 },
  { name: 'gerson_80', level: 4 },
  { name: 'heitor_86', level: 1 },
  { name: 'ilton_81', level: 3 },
  { name: 'julinho_85', level: 5 },
  { name: 'klaus_79', level: 2 },
  { name: 'laercio_82', level: 4 },
  { name: 'miltinho_84', level: 1 },
  { name: 'ney_80', level: 3 },
  { name: 'osvaldo_83', level: 5 },
  { name: 'ID268147', level: 2 },
  { name: 'ID945036', level: 1 },
  { name: 'ID371589', level: 4 },
  { name: 'ID620473', level: 3 },
  { name: 'ID184926', level: 5 },

  // ─── Novos nicks — Verde (level 6-12) ───
  { name: 'paulista_77', level: 7 },
  { name: 'quirino_81', level: 9 },
  { name: 'rubinho_85', level: 11 },
  { name: 'saulo_79', level: 6 },
  { name: 'tadeu_82', level: 8 },
  { name: 'ubirajara_84', level: 10 },
  { name: 'vanderlei_80', level: 12 },
  { name: 'wilson_83', level: 7 },
  { name: 'xavier_81', level: 9 },
  { name: 'yuri_gago', level: 11 },
  { name: 'zequinha_85', level: 6 },
  { name: 'adauto_79', level: 8 },
  { name: 'bahia_82', level: 10 },
  { name: 'canela_84', level: 12 },
  { name: 'didi_80', level: 7 },
  { name: 'elizeu_83', level: 9 },
  { name: 'faria_81', level: 11 },
  { name: 'gaucho_85', level: 6 },
  { name: 'hulk_79', level: 8 },
  { name: 'ivanildo_82', level: 10 },
  { name: 'jessé_84', level: 12 },
  { name: 'kraus_80', level: 7 },
  { name: 'luciano_83', level: 9 },
  { name: 'mineiro_81', level: 11 },
  { name: 'nego_85', level: 6 },
  { name: 'ID759301', level: 8 },
  { name: 'ID832467', level: 10 },
  { name: 'ID408235', level: 7 },
  { name: 'ID576819', level: 12 },
  { name: 'ID293754', level: 9 },

  // ─── Novos nicks — Azul (level 13-20) ───
  { name: 'omar_79', level: 14 },
  { name: 'pepe_82', level: 17 },
  { name: 'quinto_84', level: 20 },
  { name: 'ramon_80', level: 13 },
  { name: 'soares_83', level: 16 },
  { name: 'tico_81', level: 19 },
  { name: 'udo_85', level: 14 },
  { name: 'vitor_79', level: 17 },
  { name: 'webber_82', level: 20 },
  { name: 'xuxa_84', level: 13 },
  { name: 'yann_80', level: 16 },
  { name: 'zague_83', level: 19 },
  { name: 'alessandro', level: 14 },
  { name: 'bob_85', level: 17 },
  { name: 'cuca_79', level: 20 },
  { name: 'danilo_82', level: 13 },
  { name: 'eder_84', level: 16 },
  { name: 'fabiano_80', level: 19 },
  { name: 'grego_83', level: 15 },
  { name: 'helinho_81', level: 18 },
  { name: 'iran_85', level: 14 },
  { name: 'jairo_79', level: 17 },
  { name: 'kiko_82', level: 20 },
  { name: 'lima_84', level: 13 },
  { name: 'marinho_80', level: 16 },
  { name: 'ID617480', level: 15 },
  { name: 'ID345892', level: 18 },
  { name: 'ID750163', level: 14 },
  { name: 'ID829674', level: 17 },
  { name: 'ID506238', level: 20 },

  // ─── Novos nicks — Roxo (level 21-28) ───
  { name: 'nelsinho_83', level: 22, badge: '⭐' },
  { name: 'orestes_81', level: 25, badge: '🔥' },
  { name: 'pingo_85', level: 28 },
  { name: 'quirino_79', level: 21, badge: '⭐' },
  { name: 'ricardinho', level: 24, badge: '🔥' },
  { name: 'suel_82', level: 27 },
  { name: 'tota_84', level: 22, badge: '⭐' },
  { name: 'ula_80', level: 25 },
  { name: 'valdir_83', level: 28, badge: '🔥' },
  { name: 'wesley_81', level: 21 },
  { name: 'xande_85', level: 24, badge: '⭐' },
  { name: 'yuri_82', level: 27 },
  { name: 'zildo_84', level: 22 },
  { name: 'acacio_80', level: 25, badge: '🔥' },
  { name: 'baiano_83', level: 28, badge: '⭐' },
  { name: 'canario_81', level: 21 },
  { name: 'dinho_85', level: 24, badge: '🔥' },
  { name: 'elano_79', level: 27 },
  { name: 'fininho_82', level: 22, badge: '⭐' },
  { name: 'giba_84', level: 25 },
  { name: 'hindemburgo', level: 28, badge: '🔥' },
  { name: 'itamar_81', level: 21 },
  { name: 'juca_83', level: 24 },
  { name: 'klayton_79', level: 27, badge: '⭐' },
  { name: 'leleco_82', level: 22 },
  { name: 'ID173945', level: 23, badge: '🔥' },
  { name: 'ID684071', level: 26 },
  { name: 'ID932586', level: 21, badge: '⭐' },
  { name: 'ID417203', level: 24 },
  { name: 'ID561892', level: 28 },

  // ─── Novos nicks — Rosa (level 29-36) ───
  { name: 'mazinho_84', level: 30, badge: '💎' },
  { name: 'nene_80', level: 33, badge: '⭐' },
  { name: 'oswaldo_83', level: 36, badge: '🔥' },
  { name: 'piriquito_81', level: 29 },
  { name: 'quim_85', level: 32, badge: '💎' },
  { name: 'roger_79', level: 35, badge: '⭐' },
  { name: 'sinho_82', level: 30 },
  { name: 'tony_84', level: 33, badge: '🔥' },
  { name: 'ueslei_80', level: 36, badge: '💎' },
  { name: 'vando_83', level: 29, badge: '⭐' },
  { name: 'walmir_81', level: 32 },
  { name: 'xerife_85', level: 35, badge: '🔥' },
  { name: 'yure_79', level: 30 },
  { name: 'zambia_82', level: 33, badge: '💎' },
  { name: 'aloisio_84', level: 36 },
  { name: 'barata_80', level: 29, badge: '⭐' },
  { name: 'cal_83', level: 32, badge: '🔥' },
  { name: 'dede_81', level: 35 },
  { name: 'ernane_85', level: 30, badge: '💎' },
  { name: 'fred_79', level: 33, badge: '⭐' },
  { name: 'gil_82', level: 36 },
  { name: 'helvecio_84', level: 29, badge: '🔥' },
  { name: 'irineu_80', level: 32 },
  { name: 'jajá_83', level: 35, badge: '💎' },
  { name: 'keller_81', level: 30 },
  { name: 'ID278456', level: 31, badge: '⭐' },
  { name: 'ID890123', level: 34, badge: '🔥' },
  { name: 'ID345678', level: 29, badge: '💎' },
  { name: 'ID702549', level: 32 },
  { name: 'ID136827', level: 36, badge: '⭐' },

  // ─── Novos nicks — Laranja VIP (level 37-42) ───
  { name: 'lu_85', level: 38, badge: '💎' },
  { name: 'mica_79', level: 41, badge: '👑' },
  { name: 'nivaldo_82', level: 37, badge: '🔥' },
  { name: 'orlandinho', level: 40, badge: '💎' },
  { name: 'paquito_81', level: 39 },
  { name: 'quartaroli', level: 42, badge: '👑' },
  { name: 'ramires_80', level: 38, badge: '⭐' },
  { name: 'sid_83', level: 41, badge: '🔥' },
  { name: 'toin_85', level: 37, badge: '💎' },
  { name: 'udo_79', level: 40 },
  { name: 'vicente_82', level: 39, badge: '👑' },
  { name: 'waguinho_84', level: 42, badge: '🔥' },
  { name: 'xande_80', level: 38, badge: '💎' },
  { name: 'ytalo_83', level: 41, badge: '⭐' },
  { name: 'zinho_81', level: 37 },
  { name: 'ID459083', level: 39, badge: '💎' },
  { name: 'ID527194', level: 42, badge: '👑' },
  { name: 'ID816352', level: 38, badge: '🔥' },
  { name: 'ID297465', level: 41 },
  { name: 'ID638901', level: 40, badge: '💎' },

  // ─── Novos nicks — Vermelho elite (level 43-48) ───
  { name: 'adriano_85', level: 44, badge: '💎' },
  { name: 'boca_79', level: 47, badge: '👑' },
  { name: 'canhoto_82', level: 43, badge: '🔥' },
  { name: 'dunga_84', level: 46, badge: '💎' },
  { name: 'elvis_80', level: 48, badge: '👑' },
  { name: 'flávio_83', level: 44, badge: '🔥' },
  { name: 'gordo_81', level: 47, badge: '💎' },
  { name: 'holanda_85', level: 43, badge: '👑' },
  { name: 'ismael_79', level: 46, badge: '🔥' },
  { name: 'jou_82', level: 48, badge: '💎' },
  { name: 'keno_84', level: 44, badge: '👑' },
  { name: 'lelé_80', level: 47, badge: '🔥' },
  { name: 'magrão_83', level: 43, badge: '💎' },
  { name: 'nino_81', level: 46 },
  { name: 'odvan_85', level: 48, badge: '👑' },
  { name: 'ID174582', level: 45, badge: '💎' },
  { name: 'ID483709', level: 43, badge: '🔥' },
  { name: 'ID790246', level: 47, badge: '👑' },
  { name: 'ID215863', level: 44, badge: '💎' },
  { name: 'ID957321', level: 48, badge: '👑' },

  // ─── Novos nicks — Dourado top (level 49-50) ───
  { name: 'piauí_79', level: 49, badge: '👑' },
  { name: 'quaresma_82', level: 50, badge: '👑' },
  { name: 'rato_84', level: 49, badge: '💎' },
  { name: 'sorriso_80', level: 50, badge: '👑' },
  { name: 'tião_83', level: 49, badge: '🔥' },
  { name: 'uilian_81', level: 50, badge: '👑' },
  { name: 'vavá_85', level: 49, badge: '💎' },
  { name: 'wilsinho_79', level: 50, badge: '👑' },
  { name: 'xexeu_82', level: 49, badge: '🔥' },
  { name: 'yuri_84', level: 50, badge: '👑' },
  { name: 'zóio_80', level: 49, badge: '💎' },
  { name: 'alanzinho_83', level: 50, badge: '👑' },
  { name: 'biro_81', level: 49, badge: '🔥' },
  { name: 'catatau_85', level: 50, badge: '👑' },
  { name: 'diguinho_79', level: 49, badge: '💎' },
  { name: 'ed_82', level: 50, badge: '👑' },
]

const LIVE_MESSAGES = [
  'Kkkkk', 'Linda demais', 'Que gata 😍', 'Nãooo', 'Ja ta bom assim',
  'kkkkk', '❤️❤️❤️', 'Que maneiro!😍', 'Que linda', 'Gostosa demais',
  'Tá linda hein', '🔥🔥🔥', 'Maravilhosa', 'Top demais', 'seguiu o host.',
  'Eita 😳', 'Ai meu Deus', 'Que show', 'Perfeita', 'Gataaaa',
  'sdds', 'Volta mais', '😍😍😍', 'Manda beijo', 'Humm', 'Linda',
  'Uau', '💖💖', 'Arrasou', '👏👏', 'Deusa', 'Amei', 'Que delícia',
  'cheguei agora 👀', 'olha ela 😏', 'misericórdia', 'que mulher é essa',
  'coisa linda', 'fala comigo bb', 'piscou pra mim foi?', 'to apaixonado já',
  'me nota aí', 'vc é diferente viu', 'que sorriso é esse', 'eu largava tudo',
  'fala meu nome', 'vc mexe comigo', 'para de ser perfeita', 'assim vc me complica',
  'manda beijo pra mim', 'só eu te acho absurda?', 'vc tem namorado?', 'responde eu 😅',
  'olha essa carinha', 'q isso princesa', 'to passando mal aqui', 'vc é problema viu',
  'me dá moral', 'que olhar foi esse', 'me ganhou já', 'nem dormi direito pensando em vc',
  'fala de mim aí', 'me escolhe', 'coisa mais linda da live', 'meu Deus do céu',
  'vc sabe que é linda né', 'eu banco hein', 'te levo pra jantar fácil',
  'desse jeito eu caso', 'vc me deixa fraco', 'olha isso chat 😮', 'perfeita demais',
  'to rendido', 'manda um oi pro motorista aqui 🚗', 'olha o perigo',
  'vc provoca demais', 'eu não aguento', 'para que eu me apaixono',
  'olha essa boca 🫦', 'só melhora', 'quem deixou vc ser assim',
  'ta me devendo atenção', 'eu fico quieto mas observo 👀', 'que energia boa',
  'vc é outro nível', 'sem condições', 'linda e ainda sabe conversar',
  'ta solteira mesmo?', 'faz isso comigo não', 'vc é sonho ou realidade',
  'toda vez eu caio aqui', 'me responde vai', 'eu te trato igual rainha',
  'essa risadinha aí', 'olha o charme', 'to ficando mal acostumado',
  'não me ilude assim', 'quero só vc', 'se eu for aí vc deixa?',
  'vc me dá esperança', 'olha o perigo disso', 'chat ta vendo isso?',
  'impossível ignorar', 'vc é tipo vício', 'fala comigo direito',
  'deixa eu cuidar de vc', 'ta querendo me testar', 'assim eu me apaixono',
  'vou virar membro só por vc', 'vc é meu tipo', 'que gata absurda',
  'eu fico até sem graça', 'responde o motorista aqui 😅', 'já ganhou meu follow',
  'manda salve', 'que espetáculo', 'perfeita demais slc', 'ta brincando comigo né',
  'eu sou seu fã já', 'essa live ta diferente', 'vc faz de propósito',
  'para de olhar assim', 'eu fico tímido', 'olha essa postura',
  'vc é fina demais', 'coisa rara', 'vc é diferente das outras',
  'eu te assumia fácil', 'já imaginei nós dois', 'to investindo meu tempo aqui',
  'vale cada minuto', 'vc sabe que domina né', 'só melhora isso',
  'essa câmera não faz jus', 'pessoalmente deve ser covardia',
  'eu ia travar na sua frente', 'vc hipnotiza', 'olha esse sorriso',
  'quem é seu crush', 'escolhe um do chat', 'eu me candidato',
  'ta solteira msm?', 'eu te levo pra viajar', 'olha o nível dela',
  'minha nossa senhora', 'eu me apaixono rápido', 'vc é meu ponto fraco',
  'manda coração pra mim ❤️', 'me chama no privado', 'ta me deixando bobo',
  'vc faz eu perder o foco', 'nem consigo sair da live', 'olha essa vibe',
  'vc é pura tentação', 'fala que é brincadeira', 'eu te mimava demais',
  'imagina nós em dubai 😅', 'eu bancava fácil', 'vc merece o mundo',
  'só queria um minuto seu', 'me dá uma chance', 'eu não sou ciumento não 👀',
  'olha essa presença', 'impossível competir', 'vc é fora da curva',
  'eu fico só admirando', 'olha esse estilo', 'me ensina a lidar',
  'vc é sonho de consumo', 'eu me organizo por vc', 'que mulher',
  'chat ta apaixonado', 'olha o perigo dessa menina', 'eu já to imaginando',
  'vc é muito minha vibe', 'manda áudio falando meu nome', 'vc é meu tipo ideal',
  'assim eu viro fiel', 'ta querendo casar é', 'eu te assumia hoje',
  'olha essa química', 'vc mexe comigo demais', 'vc é impossível',
  'essa boca aí complica 🫦', 'eu fico quieto mas to aqui', 'só observando',
  'fala comigo linda', 'vc me ganhou no olhar', 'olha essa elegância',
  'eu fico besta', 'vc sabe jogar', 'olha esse jeitinho',
  'eu te dava o mundo', 'vc é perigosa', 'manda beijo pro motorista',
  'já to fiel aqui', 'impossível não elogiar', 'vc é arte',
  'isso é covardia', 'chat ta fraco pra ela', 'olha esse sorriso de novo',
  'vc é meu evento favorito', 'eu fico só esperando vc entrar', 'chegou dominando',
  'olha a postura dela', 'já to rendido', 'vc me quebra',
  'para que eu me apego', 'só melhora a cada minuto', 'que presença absurda',
  'me adota', 'eu faço tudo por vc', 'deixa eu ser seu preferido',
  'me escolhe hoje', 'manda um sorriso só pra mim', 'olha isso chat',
  'eu fico até quieto', 'vc é diferenciada', 'olha esse olhar',
  'para de ser linda', 'vc é muito charme', 'eu fico vulnerável assim',
  'me nota vai', 'manda salve pro motorista', 'eu não desisto fácil',
  'vc é meu foco', 'olha o nível dela', 'eu banco essa princesa',
  'vc merece mimo', 'fala que é minha', 'eu assumo',
  'vc é luxo', 'eu invisto fácil', 'olha essa qualidade',
  'só eu to vendo isso?', 'vc é meu tipo raro', 'eu fico hipnotizado',
  'impossível sair daqui', 'olha esse close', 'vc é surreal',
  'que espetáculo de mulher', 'eu fico todo bobo', 'para de me olhar assim',
  'vc sabe que é absurda', 'olha essa postura de rainha', 'eu te trato como merece',
  'manda coração pra mim', 'eu não divido não 👀', 'vc é só minha',
  'eu to investindo aqui', 'vc vale o tempo', 'que mulher diferenciada',
  'eu fico todo rendido', 'olha o charme dela', 'vc domina o chat',
  'eu fico quieto mas sou fiel', 'deixa eu ser seu patrocinador 😅',
  'vc é outro patamar', 'eu valorizo viu', 'olha esse jeitinho',
  'para que eu me apego', 'vc me deixa sem reação', 'manda um oi só pra mim',
  'eu vi primeiro', 'chat respeita', 'olha essa obra de arte',
  'eu fico impressionado', 'vc é muito acima', 'deixa eu cuidar',
  'só queria vc agora', 'olha essa conexão', 'eu fico até nervoso',
  'vc é meu investimento favorito', 'impossível não elogiar', 'fala comigo princesa',
  'ei chat respeita que eu cheguei primeiro', 'sai fora mano ela ta falando comigo',
  'calma aí emocionado', 'menos papo mais ação', 'relaxa que ela já me notou',
  'fala baixo que eu to investindo aqui', 'esse chat é cheio de iludido',
  'ela piscou foi pra mim', 'pode tentar mas já é minha', 'respeita o pai',
  'chat tá carente hoje', 'vocês são tudo reserva', 'titular sou eu',
  'segura a emoção aí', 'ela respondeu EU', 'viu que ela riu do meu comentário?',
  'disputa saudável rapaziada', 'sai da frente novato', 'deixa os adultos conversarem',
  'pode olhar mas não toca', 'eu banco, vcs só falam', 'menos texto mais pix',
  'fala comigo princesa ignora eles', 'chat emocionado demais',
  'olha os concorrente aparecendo', 'calma soldados', 'respeito que eu sou fixo aqui',
  'esses cara some amanhã', 'eu sou constante', 'ela já sabe quem eu sou',
  'deixa eles latir', 'eu to tranquilo', 'competição fraca hoje',
  'chat cheio de promessa', 'atitude é comigo',
  'ela sabe quem investe', 'olha os ciumento', 'relaxa que ela volta pra mim',
  'vocês são só figurante', 'sai da minha vez', 'deixa eu falar',
  'chat tá se achando demais', 'menos ciúme aí', 'quem garante sou eu',
  'podem tentar', 'mas ela sempre responde o pai', 'viu? ignorou vocês',
  'disputa boa hoje', 'chat nervoso', 'só observo os concorrente',
  'ela sabe quem é prioridade', 'eu sou fiel aqui', 'não adianta forçar',
  'ela escolhe qualidade', 'pode mandar coração que eu mando presente',
  'segura essa', 'tá querendo competir comigo?', 'tenta a sorte',
  'chat virou guerra', 'eu fico quieto mas resolvo', 'menos conversa mais ação',
  'vocês só prometem', 'eu faço', 'ela riu pra mim de novo',
  'chat tá em choque', 'calma novinhos', 'deixa o experiente trabalhar',
  'já virou disputa isso aqui', 'podem tentar me superar', 'eu não divido não',
  'só um pode vencer', 'olha os desesperado', 'relaxa que ela já decidiu',
  'segura essa pressão', 'chat perdeu o controle', 'tão competindo errado',
  'aprende comigo', 'menos gritaria', 'ela gosta de atitude',
  'quem manda aqui sou eu', 'eu já garanti meu espaço', 'deixa eles se iludir',
  'podem tentar copiar', 'mas original é um só', 'olha o clima ficando tenso',
  'chat tá pegando fogo', 'calma rapaziada', 'um por vez',
  'respeita o investimento', 'ela falou meu nome', 'pronto acabou',
  'disputa encerrada', 'chat ficou quieto agora', 'eu falei',
  'menos emoção', 'mais resultado', 'pode chorar',
  'prioridade é prioridade', 'vocês são fase teste', 'chat tá com inveja',
  'segura o recalque', 'ela me escolheu', 'aceita',
  'pode insistir', 'mas ela já decidiu', 'menos ciúme',
  'vocês não aguentam pressão', 'eu fico tranquilo', 'deixa comigo',
  'calma que eu resolvo', 'não se desespera', 'chat carente demais',
  'eu sou constante aqui', 'ela sabe', 'vocês aparecem só hoje',
  'fidelidade é comigo', 'concorrência fraca', 'to confortável',
  'disputa boa essa', 'gostei da competição', 'mas vitória é minha',
  'chat emocionado', 'tá nervoso?', 'respira',
  'deixa o homem trabalhar', 'olha os reserva', 'titular presente',
  'eu não corro atrás', 'eu escolho', 'podem competir',
  'mas nível é outro', 'chat surtou', 'menos drama',
  'eu sou diferente', 'ela percebe', 'calma que é natural',
  'não precisa forçar', 'chat tá tentando demais', 'esforço errado',
  'aprende estratégia', 'atitude vence', 'podem insistir',
  'mas quem garante sou eu', 'disputa saudável', 'só não esquece quem chegou primeiro',
  'respeito é bom', 'e eu gosto', 'menos ciúme galera',
  'ela responde quem importa', 'chat ta tenso', 'vocês tão competindo comigo?',
  'boa sorte', 'eu gosto de desafio', 'mas já sei o resultado',
  'calma novato', 'aqui tem história', 'disputa elegante',
  'mas não exagera', 'chat ficou quieto agora', 'eu avisei',
  'menos ansiedade', 'pode tentar me copiar', 'mas autenticidade é raro',
  'eu fico de boa', 'quem sabe sabe', 'deixa os menino brincar',
  'homem resolve', 'podem mandar emoji', 'eu mando presença',
  'chat todo nervoso', 'relaxa', 'eu não divido atenção',
  'mas eu compartilho vitória', 'disputa interessante', 'só não esquece o nível',
  'quem acompanha sabe', 'eu sou fixo', 'chat rotativo',
  'constância vence', 'menos gritaria', 'mais atitude',
  'olha o silêncio deles', 'entenderam agora', 'não é sobre falar',
  'é sobre fazer', 'podem tentar impressionar', 'eu impressiono naturalmente',
  'chat exagerado', 'ninguém precisa brigar', 'mas prioridade é clara',
  'disputa divertida', 'eu gosto assim', 'deixa eles tentar', 'eu fico tranquilo',
  'cheguei agora', 'alguém aí',
  'começou faz tempo?', 'to ouvindo aqui', 'travou aqui', 'voltou',
  'tá me ouvindo?', 'oi', 'salve', 'de onde vc é', 'qual seu nome',
  'manda salve', 'fala meu nome', 'kkk', '😅', '👀', 'que isso',
  'caramba', 'gostei da música', 'aumenta o som', 'abaixa um pouco',
  'tá atrasado aqui', 'cheguei atrasado', 'perdi o começo', 'que linda',
  'top', 'gostei', 'arrasou', 'qual sua idade', 'vc mora onde',
  'que cidade', 'manda beijo', 'manda coração', 'vc sempre faz live',
  'amanhã tem?', 'segue de volta', 'responde aí',
  'olha o chat', 'kkkkkkk', 'rs', 'meu Deus', 'eita', 'gostei disso',
  'faz de novo', 'mostra aí', 'explica melhor', 'não entendi',
  'tá calor aí', 'aqui tá frio', 'que dia é hoje', 'vc trabalha com o que',
  'tem insta', 'manda o @', 'aceita pix?', 'brincadeira kkk',
  'tô só olhando', 'primeira vez aqui', 'cheguei pela fy', 'apareceu pra mim',
  'recomendo essa live', 'gostei da vibe', 'energia boa', 'salve pro brasil',
  'alguém de sp?', 'alguém do rj?', 'manda salve pro motorista',
  'to no intervalo', 'ouvindo escondido',
  'vai ficar salvo?',
  'manda abraço', 'tá linda hoje', 'sempre linda',
  'oi de novo', 'caiu aqui', 'agora foi', 'tá travando só pra mim?',
  'comenta aí', 'chat parado hoje', 'ninguém fala nada', 'eu falo então',
  'kkkk chat morto', 'manda salve pro fulano', 'vc lembra de mim',
  'eu tava ontem aqui', 'sempre presente', 'fiel aqui',
  '👀👀', '😏', '😅😅', '❤️',
  'desse jeito vc me testa', 'olha essa carinha provocando',
  'vc sabe o que tá fazendo né', 'não olha assim que eu perco o controle',
  'para de morder o lábio assim', 'vc gosta de deixar a gente nervoso né',
  'isso é maldade', 'vc provoca e finge que não', 'olha esse olhar',
  'assim eu fico imaginando coisa', 'vc é perigosa demais',
  'tá querendo me enlouquecer', 'olha o jeito que vc mexe o cabelo',
  'isso não é normal', 'vc sabe que é tentação pura',
  'fala baixo que eu fico pior', 'não chega tão perto assim da câmera',
  'desse jeito eu não aguento', 'vc adora provocar', 'isso é golpe baixo',
  'eu fico vulnerável assim', 'vc tá me desafiando?',
  'não faz essa cara não', 'olha essa boca',
  'vc gosta de brincar com fogo né', 'desse jeito eu atravesso a cidade',
  'vc é muito provocante', 'tá querendo me testar',
  'vc me deixa maluco fácil', 'isso é covardia', 'vc faz de propósito',
  'olha esse sorriso malicioso', 'vc sabe que mexe comigo',
  'assim eu fico imaginando nós dois', 'para de me olhar desse jeito',
  'vc adora deixar o chat nervoso', 'vc é muito quente', 'olha esse clima',
  'isso tá ficando perigoso', 'vc não tem limites não',
  'desse jeito eu fico sem reação',
  'vc sabe que eu fico olhando cada detalhe',
  'tá querendo atenção ou problema?', 'olha essa pose',
  'vc gosta de deixar a gente curioso', 'para de provocar',
  'vc não vale nada assim', 'eu fico até inquieto',
  'vc me tira do sério', 'isso é provocação pura',
  'não chega mais perto não', 'eu não sou forte assim',
  'vc sabe que eu não resisto', 'isso é maldade com o homem',
  'vc adora brincar com a imaginação', 'olha esse jeito de falar',
  'fala devagar assim não', 'vc sabe que me desarma',
  'isso é jogo psicológico', 'vc é tentação demais',
  'vc tá me desafiando', 'olha esse olhar de canto',
  'vc sabe exatamente o que faz', 'para que eu fico pensando besteira',
  'vc gosta de me deixar curioso', 'olha esse charme perigoso',
  'vc é muito envolvente', 'isso é provocação nível hard',
  'vc não facilita', 'eu fico hipnotizado',
  'não morde o lábio assim não', 'vc gosta de ver reação',
  'olha esse jeitinho', 'vc é puro perigo', 'isso é tortura',
  'vc mexe com a cabeça do homem', 'não ri assim não',
  'eu fico imaginando coisa errada', 'vc é muito intensa',
  'isso tá ficando sério', 'vc é muito atrevida',
  'para que eu fico sem foco', 'vc não presta assim',
  'olha esse close', 'vc gosta de provocar reação',
  'desse jeito eu fico inquieto', 'vc domina fácil',
  'isso é sedução pura', 'eu fico até quieto',
  'não fala assim comigo', 'vc gosta de tensão',
  'olha esse clima pesado', 'vc sabe que deixa o chat louco',
  'isso é jogo perigoso', 'vc adora deixar dúvida no ar',
  'olha esse sorriso safado', 'vc provoca e sai andando',
  'isso é covardia demais', 'vc gosta de testar limite',
  'desse jeito eu não me controlo', 'vc faz o homem perder a linha',
  'olha essa energia', 'vc é puro fogo',
  'não chega tão perto da câmera', 'eu fico até desconcertado',
  'vc é especialista em provocar', 'isso é maldade calculada',
  'vc gosta de deixar clima no ar', 'olha esse olhar intenso',
  'vc sabe que eu fico pensando', 'isso é jogo mental',
  'vc provoca e depois ri', 'olha esse detalhe', 'vc não tem dó',
  'isso é tentação demais', 'vc é muito ousada', 'olha essa expressão',
  'vc sabe que isso mexe comigo', 'eu fico até inquieto aqui',
  'vc sabe que me deixa fraco', 'isso é charme perigoso',
  'vc adora criar tensão', 'olha esse jeito de mexer no cabelo',
  'vc não ajuda o homem', 'vc gosta de ver reação no chat',
  'eu fico imaginando nós dois sozinhos', 'vc sabe que é difícil resistir',
  'vc tem noção do que faz?', 'olha essa postura',
  'isso é jogo de sedução', 'vc deixa o clima pesado',
  'não olha assim não', 'vc é puro desafio',
  'isso é provocação calculada', 'olha esse sorriso de canto',
  'vc adora me testar', 'isso é quase tortura',
  'vc mexe com o psicológico', 'vc sabe que me deixa tenso',
  'isso é charme demais', 'vc gosta de tensão no ar',
  'isso é maldade demais', 'vc sabe que domina o ambiente',
  'olha essa presença', 'vc adora brincar com a mente',
  'isso é provocação silenciosa', 'vc deixa tudo no ar',
  'eu fico até arrepiado', 'vc é muito perigosa',
  'isso é pura sedução', 'vc sabe que me deixa curioso',
  'isso é tensão pura', 'vc gosta de criar expectativa',
  'olha esse jeitinho provocando', 'vc mexe com a imaginação',
  'isso é quase injusto', 'vc gosta de me deixar pensando',
  'olha essa energia intensa', 'isso é desafio demais',
  'vc provoca e finge inocência', 'olha esse olhar fixo',
  'vc sabe que isso é perigoso', 'isso é clima de tensão',
  'vc adora me deixar nervoso', 'vc gosta de brincar com o limite',
  'isso é sedução estratégica', 'vc me deixa fora do eixo',
  'olha esse charme', 'isso é quase proibido',
  'olha esse sorriso provocando', 'vc sabe que me deixa inquieto',
  'vc gosta de mexer comigo', 'olha esse detalhe de novo',
  'vc sabe que isso não é normal', 'isso é sedução no olhar',
  'vc provoca no silêncio', 'isso é maldade pura',
  'vc sabe que deixa o homem vulnerável', 'olha essa postura intensa',
  'isso é quase crime', 'vc me deixa imaginando demais',
  'isso é provocação constante', 'vc sabe que mexe comigo fácil',
  'olha esse jeitinho malicioso', 'isso é puro jogo mental',
  'vc me deixa sem foco', 'olha esse detalhe perigoso',
  'vc sabe que deixa clima pesado', 'isso é pura tentação',
  'vc provoca até no silêncio', 'olha esse sorriso de novo',
  'vc gosta de deixar no ar', 'isso é tensão controlada',
  'vc me deixa inquieto', 'olha esse olhar desafiador',
  'vc gosta de mexer com o psicológico', 'isso é charme perigoso',
  'vc gosta de provocar reação', 'vc deixa tudo implícito',
  'isso é maldade estratégica', 'vc sabe que deixa o homem nervoso',
  'olha esse clima estranho', 'vc gosta de tensão silenciosa',
  'isso é provocação de alto nível', 'vc me deixa pensando demais',
  'olha esse sorriso suspeito', 'vc gosta de deixar dúvida',
  'isso é charme calculado', 'vc sabe que mexe comigo forte',
  'olha esse olhar profundo', 'vc gosta de brincar com fogo',
  'isso é pura intensidade', 'vc me deixa fora de mim',
  'olha essa presença marcante', 'vc gosta de me testar',
  'isso é tensão demais', 'vc sabe que deixa o clima pesado',
  'olha esse jeito de falar', 'vc gosta de provocar silêncio',
  'isso é sedução sutil', 'vc me deixa inquieto fácil',
  'olha esse detalhe provocante', 'vc gosta de deixar expectativa',
  'isso é pura provocação', 'vc sabe que eu fico imaginando',
  'olha esse sorriso perigoso', 'isso é charme intenso',
  'vc me deixa sem reação', 'isso é pura maldade',
  'vc sabe que mexe comigo demais', 'vc gosta de criar clima',
  'isso é sedução implícita', 'vc me deixa desconcentrado',
  'olha esse jeito provocante', 'vc gosta de testar o limite',
  'isso é puro jogo', 'vc sabe que deixa tensão',
  'olha esse sorriso lento', 'vc gosta de brincar com a mente',
  'isso é intensidade demais', 'vc me deixa imaginando coisa',
  'olha esse olhar provocando', 'vc gosta de deixar clima estranho',
  'vc sabe que me deixa nervoso', 'olha esse detalhe intenso',
  'vc gosta de tensão no silêncio', 'isso é provocação inteligente',
  'vc me deixa curioso demais', 'isso é pura ousadia',
  'olha esse jeito de olhar', 'vc gosta de brincar com limite',
  'olha essa presença provocante', 'vc gosta de deixar clima pesado',
  'isso é sedução silenciosa', 'vc gosta de mexer com a imaginação',
  'vc sabe que deixa o homem fraco', 'olha esse clima perigoso',
  'comprei os conteúdos dela e valeu muito a pena',
  'sinceramente, surpreendeu demais', 'cada vídeo é melhor que o outro',
  'investimento bem feito', 'não me arrependi nem um pouco',
  'qualidade absurda', 'o pacote tá insano',
  'muito acima do que eu esperava', 'ela entrega demais',
  'fiquei até sem reação', 'conteúdo de outro nível',
  'vale cada centavo mesmo', 'já quero comprar mais',
  'é diferente de tudo que já vi', 'ela caprichou demais',
  'os vídeos são muito bem feitos', 'não consigo parar de assistir',
  'recomendo demais', 'foi a melhor compra do mês',
  'conteúdo premium de verdade', 'ela sabe o que faz',
  'fiquei impressionado', 'muito mais do que imaginei',
  'entrega tudo e mais um pouco', 'realmente diferenciada',
  'não é hype, é real', 'tá de parabéns', 'conteúdo viciante',
  'já assisti tudo duas vezes', 'não decepciona',
  'superou minhas expectativas', 'qualidade lá em cima',
  'cada detalhe muito bem feito', 'ela se dedica mesmo',
  'dinheiro bem investido', 'é outro patamar', 'conteúdo intenso',
  'fiquei impactado', 'realmente exclusiva', 'é impossível não gostar',
  'já virei cliente fiel', 'o pacote completo é absurdo',
  'muito melhor do que pensei', 'vale muito a pena',
  'não tem comparação', 'ela entrega presença',
  'fiquei impressionado com a qualidade', 'já tô esperando o próximo',
  'experiência surreal', 'ela sabe provocar', 'muito envolvente',
  'conteúdo quente na medida', 'vale cada segundo',
  'não é exagero, é muito bom mesmo', 'me surpreendeu demais',
  'produção muito boa', 'tudo muito bem feito',
  'já recomendei pros amigos', 'valeu cada real', 'fiquei vidrado',
  'conteúdo exclusivo de verdade', 'nível altíssimo',
  'entrega o que promete', 'muito acima da média', 'é outra vibe',
  'cada vídeo melhorando mais', 'não me arrependo',
  'vale o investimento', 'fiquei até sem palavras',
  'realmente intensa', 'conteúdo diferenciado',
  'muito mais do que simples vídeos', 'é experiência mesmo',
  'qualidade impecável', 'impressionante demais', 'ela é diferenciada',
  'muito bem produzido', 'não tem igual', 'já quero renovar',
  'conteúdo top demais', 'ela sabe manter o interesse',
  'entrega muito', 'vale cada centavo pago', 'experiência única',
  'me surpreendeu muito', 'acima das expectativas',
  'recomendo sem medo', 'simplesmente incrível',
  'pacote premium é outro nível', 'não imaginava que era tão bom',
  'já assisti mais de uma vez', 'conteúdo bem intenso',
  'ela sabe envolver', 'muito bem feito', 'é diferenciado demais',
  'não é qualquer conteúdo', 'realmente exclusivo',
  'fiquei impressionado com a entrega', 'muito caprichado',
  'vale cada segundo assistido', 'ela manda muito bem',
  'conteúdo completo', 'surpreendeu muito',
  'experiência acima da média', 'vale muito a pena mesmo',
  'não me arrependo nada', 'ela é muito profissional',
  'conteúdo muito envolvente', 'já tô esperando atualização',
  'entrega qualidade', 'super recomendo', 'dinheiro muito bem gasto',
  'vale cada centavo investido', 'é diferente mesmo',
  'conteúdo muito intenso', 'já virou meu favorito',
  'qualidade de produção incrível', 'entrega muito mais que o básico',
  'vale demais', 'fiquei muito satisfeito', 'não decepciona em nada',
  'conteúdo muito bem feito', 'surpreende demais', 'já quero mais',
  'foi a melhor compra que fiz', 'muito diferenciado',
  'entrega intensidade', 'vale o preço', 'conteúdo de qualidade',
  'já virei fã', 'experiência muito boa',
  'superou o que eu imaginava', 'impressionante',
  'muito melhor que outros que já vi', 'já quero comprar novamente',
  'vale cada real', 'é outro nível mesmo', 'fiquei satisfeito demais',
  'não tem erro', 'é diferente de tudo', 'muito acima do comum',
  'entrega muito bem', 'qualidade top', 'fiquei surpreso',
  'é premium de verdade', 'conteúdo intenso e bem feito',
  'vale a assinatura', 'não me arrependo nenhum pouco',
  'já recomendei', 'produção impecável', 'muito bem organizado',
  'cada detalhe faz diferença', 'realmente muito bom',
  'conteúdo exclusivo mesmo', 'já quero mais vídeos',
  'é outra experiência', 'muito melhor do que imaginei',
  'entrega qualidade real', 'nível altíssimo de conteúdo',
  'não é exagero', 'é realmente muito bom',
  'superou minhas expectativas fácil', 'conteúdo de alto nível',
  'já sou cliente fixo', 'experiência muito boa mesmo',
  'entrega presença', 'vale cada segundo',
  'fiquei muito satisfeito', 'é conteúdo diferenciado',
  'vale cada centavo', 'experiência intensa',
  'fiquei impressionado com tudo', 'ela sabe entregar',
  'já assisti várias vezes', 'vale muito o investimento',
  'não me arrependo de nada',

  // ── Reações curtas / ruído de chat (~80) ──
  'kkkkkkk', 'kkkk mano', 'kkkkkkkkkkk', 'slc', 'pqp', 'mds', 'eita', 'uiii',
  'dahora', 'top', 'opa', 'carai', 'vish', 'oxe', 'eitaa', 'uau', 'hmm',
  'sério?', 'mentira', 'jura?', 'nem fudendo', 'cruz credo', 'ai meu deus',
  'que isso mano', 'tô passando mal', 'n tanko', 'perdi tudo', 'morri aqui',
  'to sem ar', 'socorro mano', 'chocado', 'surreal isso', 'nunca vi igual',
  'brabo demais', 'pesado', 'tenso', 'q absurdo', 'tá maluco', 'kkk vai',
  'nossa senhora', 'jesus amado', 'pelo amor', 'misericórdia', 'kkk morri',
  'eita lasquera', 'afff', 'no way', 'q isso bicho', 'putz',
  'lacrou', 'arrasou', 'mitou', 'zerou a internet', 'tô on', 'salve',
  'tmj', 'é isso aí', 'bora', 'chama', 'dale', 'simbora',
  'tá insano', 'pirei', 'bugou minha mente', 'to tremendo', 'q loucura',
  'nss', 'caralho mano', 'puts grila', 'Ave Maria', 'oloko meu',
  'xiu calados', 'para tudo', 'olha isso', 'repara nisso', 'gente????',
  'AI', 'ah não kkk', 'pronto morri', 'enterrem me', 'acabou pra mim',
  'eu não aguento', 'tô suando', 'calor subiu', 'pressão subiu aqui',
  'meu deus do céu', 'n acredito', 'tô rindo sozinho', 'os cara tudo pirado',

  // ── Interação entre viewers (~50) ──
  'concordo com o cara ai', 'esse cara é simp demais kk', 'todo mundo pensando a mesma coisa',
  'falou tudo mano', 'quem discorda é cego', 'o chat tá on fire hj',
  'vcs são tudo doido kkk', 'calma rapaziada', 'tão parecendo desesperado',
  'o tanto de homem carente aqui kk', 'chat mais engraçado da plataforma',
  'os cara não perdoa kkk', 'a galera aqui é diferenciada', 'só loucura nesse chat',
  'vcs fazem a live valer a pena', 'o chat tá melhor que a live kk', 'zoeira demais aqui',
  'quem mandou esse comentário é brabo', 'esses cara me fazem rir demais',
  'algum adm aí?', 'tem mod nessa live?', 'quem é vip aqui?',
  'se juntar todo mundo do chat dá uma cidade', 'a galera tá animada hj',
  'chat tá speedando', 'quantas msg por segundo kkk', 'n consigo ler tudo',
  'o chat tá voando', 'para de spammar kk', 'calma q eu quero ler',
  'cade os adm', 'chat selvagem demais', 'velho isso aqui é uma loucura',
  'os maluco aqui são tudo iguais kk', 'o nível desse chat kkk',
  'só eu que tô rindo dos comentário?',
  'minha mina ia me matar se visse',
  'escondido da namorada aqui', 'tranquei o quarto pra assistir',
  'fone de ouvido no talo', 'volume no máximo aqui',

  // ── Recém-chegados (~40) ──
  'cheguei agora oq eu perdi', 'alguém me conta oq tá rolando',
  'vim indicado por um amigo', 'primeira vez aqui e já viciei',
  'achei essa live no tiktok', 'de onde vcs conhecem ela?',
  'acabei de entrar, já tô gostando', 'oq q esse povo tá comentando kkkk',
  'cheguei atrasado dnv', 'perdi o começo, ela já mostrou oq?',
  'um amigo mandou o link', 'meu parceiro falou q era bom e n mentiu',
  'vim pelo stories', 'vi no twitter e vim correndo',
  'essa é a famosa? agora entendi o hype', 'é minha primeira live aqui',
  'como funciona isso aqui?', 'opa cheguei, salve galera',
  'é sempre assim ou hj tá especial?', 'entrei por curiosidade e fiquei',
  'vou ficar até o final hj', 'dei uma passada e já me prendi',
  'não sabia q existia isso', 'descobri hj esse app',
  'baixei o app por causa dela', 'instalei agora e já encontrei ouro',
  'alguém me explica como manda gift?', 'como faz pra virar vip?',
  'quanto custa o close?', 'vale a pena assinar?',
  'o pessoal fala bem demais dela', 'já tinha ouvido falar nela',
  'vi um vídeo dela num grupo e vim atrás', 'o hype é real memo',
  'sabia q ia ter live hj e deixei alarme', 'esperando essa live o dia todo',
  'finalmente ela entrou ao vivo', 'pensei q n ia ter live hj',
  'quase perdi essa live', 'ainda bem q cheguei a tempo',

  // ── Fidelidade / frequência (~30) ──
  'tô aqui todo dia', 'nunca perco uma live dela',
  'já assisto ela faz 3 meses', 'sou fã antigo aqui',
  'quem acompanha desde o começo sabe', 'essa mina evoluiu demais',
  'quando ela começou era tímida, agora olha', 'acompanho desde a primeira live',
  'assisto toda live completa', 'não tem uma q eu perco',
  'melhor live da plataforma disparada', 'já passei por várias e ela é a melhor',
  'nenhuma chega perto dela', 'ela é diferenciada de vdd',
  'o conteúdo dela só melhora', 'cada live melhor q a anterior',
  'hj tá melhor que ontem', 'ontem já foi bom e hj superou',
  'se vc acompanha sabe q ela entrega', 'ela nunca decepciona',
  'já conheço ela de outras plataformas', 'ela era famosa lá tbm',
  'sempre foi gata mas agora tá surreal', 'evolução absurda',
  'fiel desde o dia 1', 'não largo essa live por nada',
  'já virei noite várias vezes por causa dela', 'vale cada minuto de sono perdido',
  'meu compromisso diário é essa live', 'agenda organizada em volta da live kk',

  // ── Reações a gifts / presentes (~30) ──
  'manda gift pra ela galera', 'quem mandou aquele presente é brabo',
  'ela merece todos os gifts', 'vou mandar um gift agora',
  'se cada um mandar um gift ela fica feliz', 'quero mandar presente tb',
  'mandei meu gift já', 'gastei tudo nela e n me arrependo',
  'vou mandar o gift mais caro', 'alguém manda o foguete pra ela',
  'essa merece chuva de gifts', 'quero ver a reação dela com gift',
  'ela fica mt feliz quando manda gift', 'cada gift ela agradece olha q fofa',
  'os gifts tão chovendo hj', 'nunca vi tanto gift numa live',
  'a galera tá generosa hj', 'manda mais presentes rapaziada',
  'presente pra ela é investimento', 'ela devolveu com um sorriso lindo',
  'vale mt a pena mandar gift', 'mandei gift e ela mandou beijo',
  'quem mandou gift recebe atenção', 'vip tem q mandar gift',
  'mandei 3 gifts já hj', 'quanto mais gift mais ela mostra',
  'chuva de presentes nessa live', 'faz chover galera',
  'to juntando pra mandar um gift grande', 'o gift q mandaram agr foi top',

  // ── Pedidos e requests (~40) ──
  'dança pra gente', 'manda um beijo pro chat', 'faz aquela pose',
  'mostra o outfit completo', 'coloca uma música', 'fica de costas',
  'faz um rebolado', 'manda salve pro chat', 'mostra o look de hj',
  'dá uma voltinha', 'mostra o cabelo', 'faz a carinha de sapeca',
  'manda um oi pra mim', 'fala meu nome', 'lê minha msg',
  'faz aquele olhar', 'pisca pro chat', 'manda um coração',
  'mostra a maquiagem', 'conta uma história', 'fala algo em inglês',
  'canta alguma coisa', 'imita alguém', 'faz aquela dancinha do tiktok',
  'rebola mais', 'vem mais perto da câmera', 'mostra mais de perto',
  'tira o casaco', 'mostra o biquíni', 'fica de lado',
  'faz pose de modelo', 'joga o cabelo pra trás', 'manda aquele sorriso',
  'olha pra câmera', 'faz carão', 'levanta pra gente ver',
  'mostra o shape completo', 'dá um tchauzinho', 'manda beijo estralado',
  'faz aegyo', 'mostra a unha', 'conta quantos tão assistindo',

  // ── Competição / ciúmes entre viewers (~30) ──
  'ela olhou pra mim', 'sai fora ela é minha', 'para de mandar msg q ela vai ler a minha',
  'disputando com 700 caras aqui', 'eu sou o preferido dela', 'aceita meu pedido de amizade',
  'minha msg ela leu primeiro', 'eu q mandei o gift maior', 'sai da fila kk',
  'cheguei primeiro', 'ela já me conhece', 'ela já me mandou dm',
  'tenho chance com ela viu', 'se eu tivesse sozinho com ela', 'um dia ela vai me notar',
  'quando ela ler meu nome vou surtar', 'ela vai casar comigo', 'sou o marido dela e nem sabe',
  'se eu morasse perto dela', 'imagina encontrar ela na rua', 'eu ia travar na frente dela',
  'nem ia conseguir falar nada', 'ia pedir pra tirar foto', 'os concorrentes são fortes kkk',
  'difícil competir com esse chat', 'cada um mais desesperado q o outro kk',
  'o tanto de gente querendo atenção dela', 'mano o chat inteiro é meu rival',
  'a fila anda mas eu n saio dela', 'persistência é tudo rapaziada',
]

// ── Close messages — 15% chance during first 90s of video 2 ──
const CLOSE_MESSAGES = [
  'Caralho, entrei no close dela e que delícia, ela tá muito gostosa',
  'Mano, os vídeos no close dela são top demais, pqp',
  'Entrei no close daquela mina, ela tava se trocando ao vivo, delícia',
  'Nossa, ela postou um banho agora no close, que gostosa',
  'Pqp, entrei no close da morena, só putaria boa',
  'Mano, tô vidrado no close dela, todo dia tem nude novo',
  'Ela tá ao vivo agora no close, tomando banho, delícia demais',
  'Caralho, que close gostoso o dela, entrei e não me arrependo',
  'Os vídeos dela no close são mt pika, muito top',
  'Mano, entrei no close da loira, ela é muito gostosa pqp',
  'Ela postou stories agora no close, tava de calcinha, delícia',
  'Caralho, a mina é muito gata, o close dela é sensacional',
  'Tô dentro do close dela, ela manda vídeo todo santo dia, top',
  'Nossa, que delícia de close, ela se gravando toda',
  'Mano, ela meteu um ao vivo agora no close, pelada, pqp',
  'Entre no close dela também, mano, os vídeos são muito bons',
  'Caralho, a gostosa postou mais um vídeo no close, muito top',
  'Ela tá toda molhada no banho agora, mostrando no close, delícia',
  'Pqp, entrei no close da sarada, que corpo em, gostosa',
  'Mano, o close dela é pago mas vale cada centavo, muito bom',
  'Ela meteu uma foto de quatro agora no close, pqp que gostosa',
  'Caralho, to fissurado no close dela, só coisa linda',
  'Nossa, ela é muito cavala, os vídeos do close dela são tops',
  'Mano, ela postou um vídeo se masturbando no close, muito delícia',
  'Entre no close dela, ela mostra tudo, muito top',
  'Caralho, a mina rebolou no close agora, quase infartei',
  'Ela tava ao vivo no close de conchinha, mostrando os peitos, gostosa',
  'Pqp, entrei no close da vizinha, que safadeza boa',
  'Mano, os stories do close dela são os melhores, muito pika',
  'Caralho, ela postou um vídeo drenando no close, que delícia',
  'A morena do close é muito gostosa, pqp, não aguento',
  'Ela tá no banho agora, gravando tudo no close, delícia',
  'Mano, entrei no close da amiga dela também, é bom pra caralho',
  'Nossa, que raba gostosa, vi agora no close dela',
  'Caralho, ela meteu a mão na ppk no close agora, delícia',
  'Os vídeos dela no close são top dms, muito gostosa',
  'Mano, ela fez um boquete imaginário no close, pqp',
  'Tô dentro do close dela e ela posta cada pérola, muito bom',
  'Caralho, ela é muito gostosa, o close dela é viciante',
  'Ela postou um ensaio no close hoje, que delícia de mulher',
  'Mano, a loira do close é muito safada, pqp',
  'Entre no close dela, ela mostra os peitos direto, muito top',
  'Caralho, ela abriu os stories no close agora, tava pelada',
  'Nossa, ela se tocando no close agora, que delícia',
  'Pqp, a gostosa postou um vídeo no banho no close, muito bom',
  'Mano, o close dela é o paraíso, só mulher gostosa',
  'Caralho, entrei no close da mina e me apaixonei, que gostosa',
  'Ela gravou um vídeo rebolando no close, pqp que delícia',
  'Tô de olho no close dela, ela posta coisa boa toda hora',
  'Mano, a morena postou um close agora, tava de fio dental, gostosa',
  'Caralho, ela é muito gostosa pqp, amo o close dela',
  'Os vídeos do close dela são muito pika, mano, entra lá',
  'Ela tá ao vivo agora no close, se exibindo toda, delícia',
  'Nossa, que close gostoso, ela mostrou a bunda agora',
  'Mano, entrei no close da mina e ela tava se passando, muito bom',
  'Caralho, ela meteu um close agora de calcinha molhada, gostosa',
  'Pqp, ela postou um vídeo no banho agora no close, delícia',
  'A mina do close é muito cavala, pqp, que gostosa',
  'Mano, ela postou stories agora no close, tava de sutiã, top',
  'Caralho, entrei no close dela e tem foto vazada, muito bom',
  'Ela fez um boquete na banana no close agora, pqp delícia',
  'Nossa, ela é muito gostosa, o close dela é 10/10',
  'Mano, a loira postou um vídeo pelada no close, delícia demais',
  'Caralho, ela tava se dedando no close agora, muito pika',
  'Entre no close dela mano, ela é muito safada e gostosa',
  'Os vídeos dela no close são muito top, pqp, não perco um',
  'Ela postou um vídeo drenando de quatro no close, que delícia',
  'Mano, ela tá ao vivo no close agora, toda nua, gostosa',
  'Caralho, que rabo é esse no close dela, pqp, muito gostosa',
  'Nossa, ela meteu um close agora de conchinha, mostrando os peitos',
  'Tô dentro do close dela, ela posta nude todo dia, muito bom',
  'Mano, a morena do close é muito gostosa, pqp, me acabo',
  'Caralho, ela postou um vídeo no banho agora no close, delícia',
  'Ela se masturbou no close agora, pqp que vídeo gostoso',
  'Mano, entrei no close dela e vale a pena, só putaria de qualidade',
  'Nossa, que gostosa, os vídeos do close dela são os melhores',
  'Caralho, ela meteu a mão na buceta no close agora, delícia',
  'Pqp, a loira postou um close rebolando, muito gostosa',
  'Mano, ela tava de quatro no close agora, pqp, quase gozei',
  'Entre no close dela, ela é muito gostosa e mostra tudo',
  'Caralho, ela postou stories agora no close, tava de calcinha fio',
  'Ela tá no banho ao vivo no close agora, muito delícia',
  'Mano, a mina do close é muito pika, gostosa demais',
  'Nossa, ela mostrou a bunda no close agora, que raba em',
  'Caralho, entrei no close da cavala, ela é muito gostosa pqp',
  'Os vídeos dela no close são tops, ela é muito safada',
  'Ela postou um vídeo com o vibrador no close agora, delícia',
  'Mano, ela tá ao vivo no close agora, se tocando toda, gostosa',
  'Caralho, que close bom o dela, ela posta cada putaria',
  'Pqp, a morena postou um nude agora no close, muito gostosa',
  'Tô viciado no close dela, mano, ela posta coisa boa demais',
  'Ela meteu um close agora de sutiã transparente, delícia',
  'Mano, a loira do close é muito gostosa, pqp, que mulher',
  'Caralho, entrei no close dela e ela tava pelada, muito bom',
  'Nossa, que vídeo gostoso ela postou no close agora',
  'Ela postou um banho agora no close, toda ensaboada, delícia',
  'Mano, a mina é muito gostosa, os vídeos do close dela são pika',
  'Caralho, ela meteu a mão na ppk no close agora, que delícia',
  'Entre no close dela, mano, você não vai se arrepender, ela é top',
  'Pqp, que gostosa, o close dela é o melhor que já vi',
]

// ── Urgency messages — 25% chance during last 120s of video 2 ──
const URGENCY_MESSAGES = [
  'nossa que delicia vou sonhar com vc',
  'q novinha gostosa',
  'essa loirinha é fogo',
  'q loirinha linda',
  'alguém tem o @ dela?',
  'eu vou entrar no close agora',
  'vou perder essa chance n',
  'ta doido, entra no close logo ai galera',
  'antes q ela fecha as vagas',
  'aproveitem pq te falar viu ela peladinha ao vivo é surreal',
  'q morena delicia da porra',
  'alguém sabe o nome dessa deusa',
  'vou ter q entrar nessa',
  'essa mina é mt pika',
  'q vontade de apertar essa raba',
  'mano ela é mt gostosa pqp',
  'vou fechar com ela agora msm',
  'alguém tem o link do close dela',
  'corre q ela ta ao vivo',
  'ngm merece perder isso',
  'essa ta de parabéns viu',
  'q sonho acordar com essa mulher',
  'mano ela rebolou agr mt gostoso',
  'alguém gravou o vídeo dela agora',
  'manda o close dela no pv',
  'não da pra perder essa oportunidade',
  'essa mina vai longe',
  'q loirinha safada',
  'ela é mt novinha e gostosa',
  'vou ter q bater uma pensando nela',
  'alguém sabe se ela faz vídeo chamada',
  'mano ela ta mto tesuda hj',
  'essa morena me quebra',
  'q delicia de mulher slc',
  'antes q ela apague os stories',
  'entra logo rapaziada',
  'ela ta mostrando os peitos agr',
  'vou me acabar no close dela',
  'alguém tem mais fotos dela',
  'q raba perfeita pqp',
  'mano ela é mt linda de rosto',
  'vou pagar o close dela agr msm',
  'corre q ela ta quase saindo do ar',
  'alguém pegou o @ do insta dela',
  'essa mina merece meu dinheiro',
  'q novinha cavala',
  'mano ela gemendo é mt tesão',
  'vou sonhar com essa bunda',
  'alguém sabe se ela tem privacy',
  'ela ta peladinha agr no close',
  'entra logo pelo amor de deus',
  'q gostosa do caralho',
  'mano ela meteu o dedo na ppk agr',
  'vou ter q me inscrever',
  'essa loirinha me mata do coração',
  'antes q ela mude de ideia',
  'alguém tem o telefone dela',
  'q delicia de morena jesus',
  'mano ela é surreal ao vivo',
  'vou bater uma vendo ela agr',
  'q novinha safadinha',
  'ela ta de quatro agr pqp',
  'corre q ela vai sair',
  'alguém tem o conteúdo dela',
  'q mulher maravilhosa',
  'mano ela mt gostosa de conchinha',
  'vou pagar p ver essa raba',
  'essa mina é foda dms',
  'q loirinha gostosa da porra',
  'alguém sabe se ela vende pack',
  'mano ela ta se tocando agr',
  'entra no close dela é top',
  'q morena tesuda',
  'vou me acabar no banho dela',
  'antes q ela bloqueie',
  'alguém tem o only dela',
  'q delicia de novinha pqp',
  'mano ela mt gostosa de lingerie',
  'vou fechar o close agr msm',
  'essa mina n brinca em serviço',
  'q loirinha maravilhosa',
  'alguém tem o zap dela',
  'mano ela gozando é mt pika',
  'corre q ela ta terminando a live',
  'q raba deliciosa',
  'ela ta mt safada hj',
  'vou ter q assinar o close dela',
  'q novinha gostosa slc',
  'mano ela mt linda sorrindo',
  'alguém conseguiu gravar',
  'entra logo rapaziada nessa',
  'q morena maravilhosa',
  'vou bater uma p vc hj',
  'essa mina merece oscar',
  'q loirinha perfeita',
  'alguém sabe a idade dela',
  'mano ela ta nua agr pqp',
  'corre antes q acabe',
  'q mulher surreal de linda',
  'vou me inscrever agr msm',
  'essa mina é uma deusa grega',
]

const QUICK_REACTIONS = [
  { text: '👍👍👍', id: 'thumbs' },
  { text: '✦ Curioso!', id: 'curious' },
  { text: '✦ Entendi!', id: 'got-it' },
  { text: '✦ Vamos ver!', id: 'lets-see' },
  { text: 'Que maneiro!😍', id: 'cool' },
]

const getLevelColor = (level: number): string => {
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

interface ChatMessage {
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

interface VideoCallProps {
  onExit?: () => void
  onOpenClose?: () => void
}

export default function VideoCall({ onExit, onOpenClose }: VideoCallProps) {
  const remoteVideoRef = useRef<HTMLVideoElement>(null)
  const heartsContainerRef = useRef<HTMLDivElement>(null)
  const chatMessagesRef = useRef<HTMLDivElement>(null)
  const hlsRef = useRef<Hls | null>(null)
  const video2StartTimeRef = useRef<number>(0)

  const [isSpeakerOn, setIsSpeakerOn] = useState(true)
  const [isTyping, setIsTyping] = useState(false)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [chatInput, setChatInput] = useState('')
  const liveChatTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [finalMessagesSent, setFinalMessagesSent] = useState(false)
  const [hasJoined, setHasJoined] = useState(false)
  const [isConnecting, setIsConnecting] = useState(true) // Auto-start connecting
  const [showEndCallConfirm, setShowEndCallConfirm] = useState(false)
  const [callEnded, setCallEnded] = useState(false)
  const [videoEnded, setVideoEnded] = useState(false)
  const [showCallEndedScreen, setShowCallEndedScreen] = useState(false)
  const [videoPhase, setVideoPhase] = useState<1 | 'transition' | 2>(1)
  const [transitionCountdown, setTransitionCountdown] = useState(5)
  const [isVideoLoaded, setIsVideoLoaded] = useState(false)
  const [showReconnectingFallback, setShowReconnectingFallback] = useState(false)
  const [showHeartsTip, setShowHeartsTip] = useState(false)
  const [viewerCount, setViewerCount] = useState(781)
  const [hostDiamonds, setHostDiamonds] = useState(2_305_131)
  const [showCtaCard, setShowCtaCard] = useState(false)
  const [ctaFading, setCtaFading] = useState<'in' | 'out' | null>(null)
  const ctaShownTimesRef = useRef<Set<number>>(new Set())
  const [hasPreviouslyAccessed] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(STORAGE_KEY) === 'true'
    }
    return false
  })

  const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent)
  const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent) || (isIOS && !/CriOS|iPhone.*Chrome|iPad.*Chrome/i.test(navigator.userAgent))

  // Meta Pixel: WatchedLive engagement events (instant, 30s, 2min, 5min, 8min)
  useEffect(() => {
    if (typeof window.fbq === 'function') window.fbq('trackCustom', 'WatchedLive')

    const timer30s = setTimeout(() => {
      if (typeof window.fbq === 'function') window.fbq('trackCustom', 'WatchedLive_30s')
    }, 30_000)

    const timer2min = setTimeout(() => {
      if (typeof window.fbq === 'function') window.fbq('trackCustom', 'WatchedLive_2min')
    }, 120_000)

    const timer5min = setTimeout(() => {
      if (typeof window.fbq === 'function') window.fbq('trackCustom', 'WatchedLive_5min')
    }, 300_000)

    const timer8min = setTimeout(() => {
      if (typeof window.fbq === 'function') window.fbq('trackCustom', 'WatchedLive_8min')
    }, 480_000)

    return () => {
      clearTimeout(timer30s)
      clearTimeout(timer2min)
      clearTimeout(timer5min)
      clearTimeout(timer8min)
    }
  }, [])

  const scrollToBottom = useCallback(() => {
    if (chatMessagesRef.current) {
      chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight
    }
  }, [])

  // If previously accessed, show ended screen immediately
  useEffect(() => {
    if (hasPreviouslyAccessed && !hasJoined) {
      setCallEnded(true)
      setIsConnecting(false)
    }
  }, [hasPreviouslyAccessed, hasJoined])

  // Auto-scroll on new messages
  useEffect(() => {
    if (chatMessages.length > 0) scrollToBottom()
  }, [chatMessages, scrollToBottom])

  // Connecting → joined after 3s
  useEffect(() => {
    if (isConnecting && !hasJoined) {
      const timer = setTimeout(() => {
        setHasJoined(true)
        setIsConnecting(false)
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [isConnecting, hasJoined])

  // Initial chat messages from Julia
  useEffect(() => {
    if (!hasJoined) return
    const initialMessages: ChatMessage[] = [
      { id: `ju-1-${Date.now()}`, type: 'message', author: CONTACT_NAME, text: 'Oi amor! Tudo bem? 😘', isOwn: false, isHost: true },
      { id: `ju-2-${Date.now() + 1}`, type: 'message', author: CONTACT_NAME, text: 'Que bom que conseguiu entrar na chamada', isOwn: false, isHost: true },
      { id: `ju-3-${Date.now() + 2}`, type: 'message', author: CONTACT_NAME, text: 'Espero que goste do meu showzinho haha 😈', isOwn: false, isHost: true },
      { id: `ju-4-${Date.now() + 3}`, type: 'message', author: CONTACT_NAME, text: 'Me manda um ❤️ se gostar do que ver, tá?', isOwn: false, isHost: true },
    ]
    setChatMessages(initialMessages)
  }, [hasJoined])

  // Save accessed flag
  useEffect(() => {
    if (hasJoined) localStorage.setItem(STORAGE_KEY, 'true')
  }, [hasJoined])

  // "Toque na tela para reagir" tip — shows at start then every 35-45s
  useEffect(() => {
    if (!hasJoined) return
    let active = true

    // Show after a short delay on load
    const initialTimer = setTimeout(() => {
      if (!active) return
      showTip()
    }, 2000)

    const showTip = () => {
      if (!active) return
      setShowHeartsTip(true)
      setTimeout(() => { if (active) setShowHeartsTip(false) }, 3000)
    }

    const scheduleNext = () => {
      if (!active) return
      const delay = 35000 + Math.random() * 10000 // 35-45s
      return setTimeout(() => {
        if (!active) return
        showTip()
        tipTimer = scheduleNext()
      }, delay)
    }
    let tipTimer = scheduleNext()

    return () => { active = false; clearTimeout(initialTimer); if (tipTimer) clearTimeout(tipTimer) }
  }, [hasJoined])

  // ── Small random viewer drops to look realistic ──
  useEffect(() => {
    if (!hasJoined) return
    let active = true
    const scheduleDrop = () => {
      if (!active) return
      // Drop every 20-50s
      const delay = 20000 + Math.random() * 30000
      timer = setTimeout(() => {
        if (!active) return
        const drop = 5 + Math.floor(Math.random() * 16) // -5 to -20
        setViewerCount(prev => Math.max(650, prev - drop))
        scheduleDrop()
      }, delay)
    }
    let timer: ReturnType<typeof setTimeout>
    scheduleDrop()
    return () => { active = false; clearTimeout(timer) }
  }, [hasJoined])

  // ── Host diamonds slowly rising ──
  useEffect(() => {
    if (!hasJoined) return
    let active = true
    const tick = () => {
      if (!active) return
      // Every 8-25s, add 3-45 diamonds
      const delay = 8000 + Math.random() * 17000
      timer = setTimeout(() => {
        if (!active) return
        const gain = 3 + Math.floor(Math.random() * 43)
        setHostDiamonds(prev => prev + gain)
        tick()
      }, delay)
    }
    let timer: ReturnType<typeof setTimeout>
    tick()
    return () => { active = false; clearTimeout(timer) }
  }, [hasJoined])

  // ── CTA Card timed appearances ──
  // Video 1: 75s | Video 2: 30s, 126s, 277s, 320s, 378s, 485s
  useEffect(() => {
    if (!hasJoined || !isVideoLoaded) return
    const CTA_TIMES_V1 = [75]  // 1:15
    const CTA_TIMES_V2 = [30, 126, 277, 320, 378, 485] // 0:30, 2:06, 4:37, 5:20, 6:18, 8:05

    const check = () => {
      const vid = remoteVideoRef.current
      if (!vid) return
      const t = Math.floor(vid.currentTime)
      const times = videoPhase === 2 ? CTA_TIMES_V2 : CTA_TIMES_V1
      const phase = videoPhase === 2 ? 2 : 1
      for (const target of times) {
        const key = phase * 10000 + target
        if (t === target && !ctaShownTimesRef.current.has(key)) {
          ctaShownTimesRef.current.add(key)
          setCtaFading('in')
          setShowCtaCard(true)
          break
        }
      }
    }
    const iv = setInterval(check, 500)
    return () => clearInterval(iv)
  }, [hasJoined, isVideoLoaded, videoPhase])

  // ── CTA Card auto-hide after 15s ──
  useEffect(() => {
    if (!showCtaCard) return
    const timer = setTimeout(() => {
      setCtaFading('out')
      setTimeout(() => {
        setShowCtaCard(false)
        setCtaFading(null)
      }, 500) // fade-out duration
    }, 15000)
    return () => clearTimeout(timer)
  }, [showCtaCard])

  // ── Auto-hearts from chat viewers ──
  useEffect(() => {
    if (!hasJoined) return
    let active = true
    const spawnAutoHearts = () => {
      if (!active || !heartsContainerRef.current) return
      // 1-4 hearts in a burst
      const count = 1 + Math.floor(Math.random() * 4)
      for (let i = 0; i < count; i++) {
        setTimeout(() => {
          if (!active || !heartsContainerRef.current) return
          const heart = document.createElement('div')
          heart.className = 'vc-heart'
          heart.textContent = HEART_EMOJIS[Math.floor(Math.random() * HEART_EMOJIS.length)]
          heart.style.setProperty('--tx', `${(Math.random() - 0.5) * 60}px`)
          heart.style.left = `${Math.random() * 80}px`
          heartsContainerRef.current!.appendChild(heart)
          setTimeout(() => heart.remove(), 3000)
        }, i * (150 + Math.random() * 300))
      }
      // Next burst in 4-12s
      timer = setTimeout(spawnAutoHearts, 4000 + Math.random() * 8000)
    }
    let timer = setTimeout(spawnAutoHearts, 5000 + Math.random() * 5000)
    return () => { active = false; clearTimeout(timer) }
  }, [hasJoined])

  // Simulated live chat — S-curve speed: burst → calm → ramp-up → peak
  useEffect(() => {
    if (!hasJoined || !isVideoLoaded) return
    let active = true
    const startTime = Date.now()
    const timers: ReturnType<typeof setTimeout>[] = []

    const addAction = () => {
      if (!active) return
      const user = LIVE_USERS[Math.floor(Math.random() * LIVE_USERS.length)]
      const isJoin = Math.random() < 0.25

      if (isJoin) {
        setChatMessages(prev => [...prev, {
          id: `lj-${Date.now()}-${Math.random()}`,
          type: 'join' as const,
          author: user.name,
          text: '',
          level: user.level,
          levelColor: getLevelColor(user.level),
          isOwn: false,
          isHost: false,
        }].slice(-50))
        // Bump viewer count on join
        setViewerCount(prev => prev + 1)
      } else {
        // Determine special message pools
        const vid = remoteVideoRef.current
        const inVideo2 = video2StartTimeRef.current > 0
        const inVideo2Early = inVideo2 && (Date.now() - video2StartTimeRef.current) < 90_000
        const inVideo2Last120 = inVideo2 && vid && vid.duration > 0 && (vid.duration - vid.currentTime) <= 120
        const roll = Math.random()
        let text: string
        if (inVideo2Last120 && roll < 0.25) {
          text = URGENCY_MESSAGES[Math.floor(Math.random() * URGENCY_MESSAGES.length)]
        } else if (inVideo2Early && roll < 0.15) {
          text = CLOSE_MESSAGES[Math.floor(Math.random() * CLOSE_MESSAGES.length)]
        } else if (Math.random() < 0.06) {
          text = getRandomTimeMessage()
        } else {
          text = LIVE_MESSAGES[Math.floor(Math.random() * LIVE_MESSAGES.length)]
        }
        setChatMessages(prev => [...prev, {
          id: `lm-${Date.now()}-${Math.random()}`,
          type: 'message' as const,
          author: user.name,
          text,
          level: user.level,
          levelColor: getLevelColor(user.level),
          badgeEmoji: user.badge,
          isOwn: false,
          isHost: false,
        }].slice(-50))
      }
      setTimeout(() => scrollToBottom(), 0)
    }

    // S-curve delay: returns ms until next message based on elapsed time
    const getDelay = (): number => {
      const elapsed = Date.now() - startTime
      if (elapsed < 30_000) {
        // Phase 1 — Burst (0-30s): fast, simulates joining an active live
        return 800 + Math.random() * 1200
      } else if (elapsed < 120_000) {
        // Phase 2 — Calm (30s-2min): chat settles down
        return 3000 + Math.random() * 4000
      } else if (elapsed < 300_000) {
        // Phase 3 — Ramp-up (2min-5min): S-curve acceleration
        const progress = (elapsed - 120_000) / 180_000 // 0→1
        const minDelay = 3000 - progress * 2200        // 3000→800
        const range = 4000 - progress * 2500            // 4000→1500
        return minDelay + Math.random() * range
      } else {
        // Phase 4 — Peak (5min+): chat is flying
        return 600 + Math.random() * 1900
      }
    }

    // Mini-burst: 15% chance of 1-3 rapid follow-up messages (real chats have chain reactions)
    const maybeMiniBurst = () => {
      if (!active || Math.random() > 0.15) return
      const count = 1 + Math.floor(Math.random() * 3) // 1-3 rapid msgs
      let burstDelay = 0
      for (let i = 0; i < count; i++) {
        burstDelay += 200 + Math.random() * 400 // 200-600ms apart
        const t = setTimeout(() => { if (active) addAction() }, burstDelay)
        timers.push(t)
      }
    }

    const scheduleNext = () => {
      if (!active) return
      const delay = getDelay()
      liveChatTimerRef.current = setTimeout(() => {
        if (!active) return
        addAction()
        maybeMiniBurst()
        scheduleNext()
      }, delay)
    }

    // Initial burst: 4 quick messages to fill up the chat on entry
    let initDelay = 800
    for (let i = 0; i < 4; i++) {
      timers.push(setTimeout(() => { if (active) addAction() }, initDelay))
      initDelay += 500 + Math.random() * 700
    }

    // Then start the S-curve loop
    const startTimer = setTimeout(() => {
      if (active) scheduleNext()
    }, initDelay + 500)
    timers.push(startTimer)

    return () => {
      active = false
      timers.forEach(clearTimeout)
      if (liveChatTimerRef.current) clearTimeout(liveChatTimerRef.current)
    }
  }, [hasJoined, isVideoLoaded, scrollToBottom])

  // Setup remote video (HLS/MP4)
  useEffect(() => {
    if (!hasJoined || !remoteVideoRef.current) return
    setIsVideoLoaded(false)
    let retryCount = 0
    const MAX_RETRIES = 3
    const LOAD_TIMEOUT = 15000
    const RETRY_DELAY = 2000
    let loadTimeoutId: ReturnType<typeof setTimeout> | null = null
    let retryTimeoutId: ReturnType<typeof setTimeout> | null = null
    let isUsingFallback = false
    let isUsingMP4 = false
    let hlsInstance: Hls | null = null

    const cleanup = () => {
      if (loadTimeoutId) { clearTimeout(loadTimeoutId); loadTimeoutId = null }
      if (retryTimeoutId) { clearTimeout(retryTimeoutId); retryTimeoutId = null }
      if (hlsInstance) { hlsInstance.destroy(); hlsInstance = null; hlsRef.current = null }
    }

    const playVideo = () => {
      if (!remoteVideoRef.current || isUsingFallback) return
      cleanup()
      const video = remoteVideoRef.current
      video.muted = false
      video.volume = 1.0
      video.play().then(() => { retryCount = 0; setIsVideoLoaded(true) }).catch(() => {
        if (video?.readyState >= 2) setIsVideoLoaded(true)
      })
    }

    const handleLoadSuccess = () => {
      if (!remoteVideoRef.current || isUsingFallback) return
      cleanup()
      setIsVideoLoaded(true)
      setShowReconnectingFallback(false)
      playVideo()
    }

    const handleLoadError = () => {
      if (isUsingFallback) return
      cleanup()
      retryCount++
      if (retryCount < MAX_RETRIES) {
        retryTimeoutId = setTimeout(() => {
          if (!isUsingFallback && remoteVideoRef.current) {
            if (isUsingMP4) { isUsingFallback = true; setShowReconnectingFallback(true) }
            else loadHLS()
          }
        }, RETRY_DELAY)
      } else {
        if (!isUsingMP4) { isUsingMP4 = true; retryCount = 0; loadMP4() }
        else { isUsingFallback = true; setShowReconnectingFallback(true) }
      }
    }

    const loadHLS = () => {
      if (!remoteVideoRef.current || isUsingFallback) return
      cleanup()
      const video = remoteVideoRef.current
      if (isSafari) {
        video.pause(); video.removeAttribute('src'); video.load()
        setTimeout(() => setupHLSVideoNative(), 200)
        return
      }
      setupHLSVideoNative()
    }

    const setupHLSVideoNative = () => {
      if (!remoteVideoRef.current || isUsingFallback) return
      const video = remoteVideoRef.current
      video.setAttribute('crossorigin', 'anonymous')
      video.loop = false
      video.playsInline = true
      video.muted = false
      video.volume = 1.0

      if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = REMOTE_VIDEO_URL_HLS
        video.addEventListener('error', () => { if (!isUsingFallback && !isUsingMP4) { isUsingMP4 = true; retryCount = 0; loadMP4() } }, { once: true })
        video.addEventListener('loadeddata', () => { if (!isUsingFallback) handleLoadSuccess() }, { once: true })
        if (isSafari) {
          video.addEventListener('canplay', () => { if (!isUsingFallback && !isVideoLoaded) handleLoadSuccess() }, { once: true })
          video.addEventListener('canplaythrough', () => { if (!isUsingFallback && !isVideoLoaded) handleLoadSuccess() }, { once: true })
          video.addEventListener('loadedmetadata', () => { if (!isUsingFallback && !isVideoLoaded && video.readyState >= 1) handleLoadSuccess() }, { once: true })
        }
        video.addEventListener('ended', () => setVideoEnded(true))
        loadTimeoutId = setTimeout(() => { if (video.readyState < 2 && !isUsingMP4) { isUsingMP4 = true; retryCount = 0; loadMP4() } }, LOAD_TIMEOUT)
      } else if (Hls.isSupported()) {
        hlsInstance = new Hls({ enableWorker: true, lowLatencyMode: false, backBufferLength: 90 })
        hlsRef.current = hlsInstance
        hlsInstance.loadSource(REMOTE_VIDEO_URL_HLS)
        hlsInstance.attachMedia(video)
        hlsInstance.on(Hls.Events.MANIFEST_PARSED, () => handleLoadSuccess())
        video.addEventListener('ended', () => setVideoEnded(true))
        hlsInstance.on(Hls.Events.ERROR, (_e, data) => {
          if (data.fatal) {
            if (data.type === Hls.ErrorTypes.MEDIA_ERROR) hlsInstance?.recoverMediaError()
            else { isUsingMP4 = true; retryCount = 0; loadMP4() }
          }
        })
        loadTimeoutId = setTimeout(() => {
          if (!hlsInstance?.media || hlsInstance.media.readyState < 2) { if (!isUsingMP4) { isUsingMP4 = true; retryCount = 0; loadMP4() } }
        }, LOAD_TIMEOUT)
      } else { isUsingMP4 = true; loadMP4() }
    }

    const loadMP4 = () => {
      if (!remoteVideoRef.current || isUsingFallback) return
      cleanup()
      const video = remoteVideoRef.current
      if (isSafari) { video.pause(); video.src = ''; video.load() }
      video.setAttribute('crossorigin', 'anonymous')
      video.src = REMOTE_VIDEO_URL_MP4
      video.loop = false
      video.preload = 'auto'
      video.playsInline = true
      video.muted = false
      video.volume = 1.0
      loadTimeoutId = setTimeout(() => { if (video.readyState < 2) handleLoadError() }, LOAD_TIMEOUT)
      video.addEventListener('error', () => { if (!isUsingFallback) handleLoadError() }, { once: true })
      video.addEventListener('stalled', () => {
        if (!isUsingFallback && remoteVideoRef.current?.readyState !== undefined && remoteVideoRef.current.readyState < 2) {
          setTimeout(() => { if (remoteVideoRef.current && remoteVideoRef.current.readyState < 2 && !isUsingFallback) handleLoadError() }, 5000)
        }
      }, { once: true })
      video.addEventListener('loadeddata', () => { if (!isUsingFallback) handleLoadSuccess() }, { once: true })
      video.addEventListener('canplay', () => { if (!isUsingFallback) handleLoadSuccess() }, { once: true })
      video.addEventListener('ended', () => setVideoEnded(true))
      if (video.readyState >= 2) handleLoadSuccess()
    }

    loadHLS()
    return () => { cleanup(); isUsingFallback = true }
  }, [hasJoined])

  // Controls
  const toggleSpeaker = useCallback(() => {
    setIsSpeakerOn(prev => {
      const next = !prev
      if (remoteVideoRef.current) {
        remoteVideoRef.current.muted = !next
        remoteVideoRef.current.volume = next ? 1.0 : 0
        if (next) remoteVideoRef.current.play().catch(() => {})
      }
      return next
    })
  }, [])

  const handleEndCallClick = useCallback(() => setShowEndCallConfirm(true), [])

  const confirmEndCall = useCallback(() => {
    if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null }
    if (remoteVideoRef.current) { remoteVideoRef.current.pause(); remoteVideoRef.current.src = '' }
    localStorage.setItem(STORAGE_KEY, 'true')
    setShowEndCallConfirm(false)
    setCallEnded(true)
  }, [])

  const cancelEndCall = useCallback(() => setShowEndCallConfirm(false), [])

  const createHeart = useCallback(() => {
    if (!heartsContainerRef.current) return
    const heart = document.createElement('div')
    heart.className = 'vc-heart'
    heart.textContent = HEART_EMOJIS[Math.floor(Math.random() * HEART_EMOJIS.length)]
    heart.style.setProperty('--tx', `${(Math.random() - 0.5) * 60}px`)
    heart.style.left = `${Math.random() * 80}px`
    heartsContainerRef.current.appendChild(heart)
    setTimeout(() => heart.remove(), 3000)
  }, [])

  const sendHeart = useCallback(() => {
    setChatMessages(prev => [...prev, { id: `heart-${Date.now()}`, type: 'message' as const, author: 'Você', text: '❤️', isOwn: true, isHost: false }].slice(-50))
    setTimeout(() => scrollToBottom(), 0)
    createHeart()
  }, [scrollToBottom, createHeart])

  const sendMessage = useCallback(() => {
    if (!chatInput.trim()) return
    setChatMessages(prev => [...prev, { id: `me-${Date.now()}`, type: 'message' as const, author: 'Você', text: chatInput.trim(), isOwn: true, isHost: false }].slice(-50))
    setChatInput('')
    setTimeout(() => scrollToBottom(), 0)
  }, [chatInput, scrollToBottom])

  const sendQuickReaction = useCallback((text: string) => {
    setChatMessages(prev => [...prev, { id: `qr-${Date.now()}`, type: 'message' as const, author: 'Você', text, isOwn: true, isHost: false }].slice(-50))
    setTimeout(() => scrollToBottom(), 0)
  }, [scrollToBottom])

  // Final messages from Julia at 14:19
  const finalMessages = [
    { text: 'Preciso sair da call agora amor, desculpa 😔', delay: 0 },
    { text: 'O que vc achou da nossa chamada? Gostou? 😏', delay: 3000 },
    { text: 'foi meio rápido, mas foi legal te ver aqui haha', delay: 4000 },
    { text: 'Me chama no whats depois, vamos conversar mais! ❤️', delay: 3000 },
    { text: 'ia adorar te ver de novo, anjo...', delay: 4000 },
    { text: 'Quem sabe logo logo a gente nao marca outra, ne? 😈 Ia gostar disso?', delay: 3000 },
    { text: 'Ate mais amor, bjim 😘😘', delay: 4000 },
  ]

  const sendFinalMessages = useCallback(() => {
    let cumulativeDelay = 0
    finalMessages.forEach((msg, index) => {
      cumulativeDelay += index === 0 ? 0 : finalMessages[index - 1].delay
      setTimeout(() => {
        setIsTyping(true)
        const typingDuration = 1500 + Math.random() * 1000
        setTimeout(() => {
          setIsTyping(false)
          setChatMessages(prev => [...prev.slice(-49), { id: `ju-final-${Date.now()}-${index}`, type: 'message' as const, author: CONTACT_NAME, text: msg.text, isOwn: false, isHost: true }])
          setTimeout(() => scrollToBottom(), 0)
        }, typingDuration)
      }, cumulativeDelay)
    })
  }, [scrollToBottom])

  // Monitor video time for final messages
  useEffect(() => {
    if (!hasJoined || !isVideoLoaded || finalMessagesSent) return
    const video = remoteVideoRef.current
    if (!video) return
    const checkTime = () => {
      if (video.currentTime >= 859 && !finalMessagesSent) {
        setFinalMessagesSent(true)
        setIsTyping(true)
        setTimeout(() => { setIsTyping(false); sendFinalMessages() }, 2000)
      }
    }
    const interval = setInterval(checkTime, 100)
    video.addEventListener('timeupdate', checkTime)
    return () => { clearInterval(interval); video.removeEventListener('timeupdate', checkTime) }
  }, [hasJoined, isVideoLoaded, finalMessagesSent, sendFinalMessages])

  // Video ended → trigger transition or end
  useEffect(() => {
    if (!videoEnded || !hasJoined) return
    if (videoPhase === 1) {
      setVideoPhase('transition')
    }
    if (videoPhase === 2) {
      const timer = setTimeout(() => setShowCallEndedScreen(true), 3000)
      return () => clearTimeout(timer)
    }
  }, [videoEnded, hasJoined, videoPhase])

  // Transition countdown → load video 2
  useEffect(() => {
    if (videoPhase !== 'transition') return
    let count = 5
    setTransitionCountdown(5)
    const interval = setInterval(() => {
      count--
      setTransitionCountdown(count)
      if (count <= 0) {
        clearInterval(interval)
        const video = remoteVideoRef.current
        if (video) {
          video.pause()
          // Destroy existing HLS instance if any
          if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null }

          const onVideo2Ready = () => {
            setVideoEnded(false)
            setVideoPhase(2)
            video2StartTimeRef.current = Date.now()
            video.play().catch(() => {})
          }

          // Try HLS first for video 2, fallback to MP4
          if (REMOTE_VIDEO_URL_HLS_2 && video.canPlayType('application/vnd.apple.mpegurl')) {
            // Safari native HLS
            video.src = REMOTE_VIDEO_URL_HLS_2
            video.load()
            video.addEventListener('canplay', () => onVideo2Ready(), { once: true })
            video.addEventListener('ended', () => setVideoEnded(true), { once: true })
          } else if (REMOTE_VIDEO_URL_HLS_2 && Hls.isSupported()) {
            // hls.js for Chrome/Firefox
            const hls2 = new Hls({ enableWorker: true, lowLatencyMode: false, backBufferLength: 90 })
            hlsRef.current = hls2
            hls2.loadSource(REMOTE_VIDEO_URL_HLS_2)
            hls2.attachMedia(video)
            hls2.on(Hls.Events.MANIFEST_PARSED, () => onVideo2Ready())
            hls2.on(Hls.Events.ERROR, (_e, data) => {
              if (data.fatal) {
                // HLS failed, fallback to MP4
                hls2.destroy(); hlsRef.current = null
                video.src = REMOTE_VIDEO_URL_MP4_2
                video.load()
                video.addEventListener('canplay', () => onVideo2Ready(), { once: true })
              }
            })
            video.addEventListener('ended', () => setVideoEnded(true), { once: true })
          } else {
            // No HLS support, use MP4 directly
            video.src = REMOTE_VIDEO_URL_MP4_2
            video.load()
            video.addEventListener('canplay', () => onVideo2Ready(), { once: true })
            video.addEventListener('ended', () => setVideoEnded(true), { once: true })
          }
        }
      }
    }, 1000)
    return () => clearInterval(interval)
  }, [videoPhase])

  // ─── Render: Call Ended screens ───────────────────────────────
  const isNaturalEnd = videoEnded && !callEnded && showCallEndedScreen
  const isManualEnd = callEnded
  const isPreviousAccess = hasPreviouslyAccessed && !hasJoined

  // Auto-redirect to Close Friends after 10s when video ends naturally
  useEffect(() => {
    if (!isNaturalEnd || !onOpenClose) return
    const timer = setTimeout(() => onOpenClose(), 10000)
    return () => clearTimeout(timer)
  }, [isNaturalEnd, onOpenClose])

  if (isNaturalEnd || isManualEnd || isPreviousAccess) {
    const message = isManualEnd ? 'Você se desconectou da chamada.' : 'Esta transmissão chegou ao fim.'
    return (
      <div className="vc-ended-container">
        <div className="vc-ended-modal">
          <div className="vc-ended-header">
            <div className="vc-ended-logo">privacy.</div>
            <h1 className="vc-ended-title">Chamada Encerrada</h1>
          </div>
          <div className="vc-ended-content">
            <p className="vc-ended-message">{message}</p>
            <p className="vc-ended-thanks">Obrigado por participar desta chamada privada.</p>
            <p className="vc-ended-security">Protegido para manter sua experiência segura.</p>
            {onExit && !isNaturalEnd && (
              <button className="vc-ended-back" onClick={onExit}>Voltar ao perfil</button>
            )}
          </div>
        </div>
      </div>
    )
  }

  // ─── Render: Reconnecting ────────────────────────────────────
  if (hasJoined && showReconnectingFallback && !videoEnded && !callEnded) {
    return (
      <div className="vc-connecting-container">
        <div className="vc-connecting-modal">
          <div className="vc-connecting-spinner">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" strokeDasharray="60" strokeDashoffset="60" strokeLinecap="round">
                <animate attributeName="stroke-dasharray" dur="1.5s" values="0 60;30 60;0 60;0 60" repeatCount="indefinite" />
                <animate attributeName="stroke-dashoffset" dur="1.5s" values="0;-30;-60;-60" repeatCount="indefinite" />
              </circle>
            </svg>
          </div>
          <div className="vc-connecting-content">
            <h2 className="vc-connecting-title">Reconectando...</h2>
            <div className="vc-connecting-status">
              <div className="vc-status-item">
                <span className="vc-status-dot-loading" />
                <span>Estabelecendo conexão com sala privada...</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ─── Render: Connecting ──────────────────────────────────────
  if (isConnecting && !hasJoined) {
    return (
      <div className="vc-connecting-container">
        <div className="vc-connecting-modal">
          <div className="vc-connecting-spinner">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" strokeDasharray="60" strokeDashoffset="60" strokeLinecap="round">
                <animate attributeName="stroke-dasharray" dur="1.5s" values="0 60;30 60;0 60;0 60" repeatCount="indefinite" />
                <animate attributeName="stroke-dashoffset" dur="1.5s" values="0;-30;-60;-60" repeatCount="indefinite" />
              </circle>
            </svg>
          </div>
          <div className="vc-connecting-content">
            <h2 className="vc-connecting-title">Confirmando conexão</h2>
            <div className="vc-connecting-status">
              <div className="vc-status-item">
                <span className="vc-status-dot-online" />
                <span>{CONTACT_HANDLE} está online</span>
              </div>
              <div className="vc-status-item">
                <span className="vc-status-dot-loading" />
                <span>Entrando na sala ao vivo</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ─── Render: Active Call ─────────────────────────────────────
  return (
    <div className="vc-call-container">
      {/* Top bar — Bigo style */}
      <div className="vc-top-bar">
        <div className="vc-host-pill">
          <div className="vc-host-avatar-ring">
            <img src={AVATAR_URL} alt={CONTACT_NAME} className="vc-host-avatar" />
            <div className="vc-host-live-dot" />
          </div>
          <div className="vc-host-info">
            <span className="vc-host-name">{CONTACT_NAME}</span>
            <span className="vc-host-id">💎 {hostDiamonds.toLocaleString('pt-BR')}</span>
          </div>
        </div>
        <div className="vc-viewer-count">
          <span className="vc-viewer-dot" />
          <span>{viewerCount >= 1000 ? `${(viewerCount / 1000).toFixed(1)}k` : viewerCount}</span>
        </div>
        <button className="vc-close-btn" onClick={handleEndCallClick} title="Sair da live">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>

      {/* Remote video */}
      <div className="vc-remote-video-container" onClick={createHeart}>
        {!isVideoLoaded && (
          <div className="vc-video-loading-overlay">
            <div className="vc-video-loading-spinner" />
            <p>Carregando transmissão...</p>
          </div>
        )}
        {/* Transition overlay between video 1 and 2 */}
        {videoPhase === 'transition' && (
          <div className="vc-video-loading-overlay vc-transition-overlay">
            <div className="vc-video-loading-spinner" />
            <p className="vc-transition-text">Carregando transmissão da live de ontem...</p>
            <div className="vc-transition-countdown">{transitionCountdown}</div>
          </div>
        )}
        <video id="vc-remote-video" ref={remoteVideoRef} autoPlay playsInline />
        <div className="vc-video-overlay">
          {showHeartsTip && <div className="vc-hearts-tip">Toque na tela para reagir ❤️</div>}
          <div className="vc-hearts-container" ref={heartsContainerRef} />
        </div>
      </div>

      {/* Live Chat Overlay */}
      <div className="vc-live-chat">
        <div className="vc-live-messages" ref={chatMessagesRef}>
          {chatMessages.map(msg =>
            msg.type === 'join' ? (
              <div key={msg.id} className="vc-live-join">
                {(msg.level ?? 0) > 0 && (
                  <span className="vc-live-badge" style={{ background: msg.levelColor }}>💎 {msg.level}</span>
                )}
                <span className="vc-live-join-name">{msg.author}</span>
                <span className="vc-live-join-text">entrou</span>
              </div>
            ) : (
              <div key={msg.id} className={`vc-live-msg ${msg.isOwn ? 'vc-live-msg-own' : ''} ${msg.isHost ? 'vc-live-msg-host' : ''}`}>
                {msg.badgeEmoji && <span className="vc-live-emoji-badge">{msg.badgeEmoji}</span>}
                {(msg.level ?? 0) > 0 && (
                  <span className="vc-live-badge" style={{ background: msg.levelColor }}>💎 {msg.level}</span>
                )}
                <span className="vc-live-author" style={{ color: msg.isHost ? '#ff6ba3' : msg.isOwn ? '#fbbf24' : (msg.levelColor || '#94a3b8') }}>
                  {msg.author}
                </span>
                <span className="vc-live-separator">:</span>
                <span className="vc-live-text">{msg.text}</span>
              </div>
            )
          )}
          {isTyping && (
            <div className="vc-live-msg vc-live-msg-host">
              <span className="vc-live-author" style={{ color: '#ff6ba3' }}>{CONTACT_NAME}</span>
              <span className="vc-live-typing"><span /><span /><span /></span>
            </div>
          )}
        </div>

        {/* CTA Card — close friends invite */}
        {showCtaCard && (
          <div className={`vc-cta-card ${ctaFading === 'in' ? 'vc-cta-card--fade-in' : ''} ${ctaFading === 'out' ? 'vc-cta-card--fade-out' : ''}`} onClick={() => { setShowCtaCard(false); setCtaFading(null); onOpenClose?.() }} style={{ cursor: 'pointer' }}>
            <div className="vc-cta-card__avatar-ring">
              <img src="/foto1.jpg" alt="Julia" className="vc-cta-card__avatar" />
            </div>
            <div className="vc-cta-card__body">
              <span className="vc-cta-card__name">Julia🫦😏</span>
              <span className="vc-cta-card__text">Convidou você para o close com lives privadas e conteúdos +18...</span>
            </div>
            <span className="vc-cta-card__btn">Entrar 🙈</span>
          </div>
        )}

        <div className="vc-live-reactions">
          {QUICK_REACTIONS.map(r => (
            <button key={r.id} className="vc-live-reaction-btn" onClick={() => sendQuickReaction(r.text)}>
              {r.text}
            </button>
          ))}
        </div>

        <div className="vc-live-input-bar">
          <button className="vc-live-input-icon" onClick={sendHeart} title="Reagir">😊</button>
          <input
            type="text"
            value={chatInput}
            onChange={e => setChatInput(e.target.value)}
            onKeyPress={e => { if (e.key === 'Enter') sendMessage() }}
            placeholder="Diga Oi..."
            maxLength={200}
          />
          <button className="vc-live-send-btn" onClick={sendMessage} title="Enviar">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
          </button>
          <button className={`vc-live-input-icon ${!isSpeakerOn ? 'vc-live-icon-off' : ''}`} onClick={toggleSpeaker} title={isSpeakerOn ? 'Desativar som' : 'Ativar som'}>
            {isSpeakerOn ? '🔊' : '🔇'}
          </button>
          <button className="vc-live-input-icon vc-live-gift-btn" onClick={sendHeart} title="Presente">🎁</button>
        </div>
      </div>

      {/* End call confirm */}
      {showEndCallConfirm && (
        <div className="vc-end-confirm-overlay">
          <div className="vc-end-confirm-modal">
            <h2 className="vc-end-confirm-title">Encerrar chamada?</h2>
            <p className="vc-end-confirm-warning">Tem certeza que deseja encerrar esta chamada? Esta ação não pode ser desfeita.</p>
            <div className="vc-end-confirm-buttons">
              <button className="vc-end-confirm-cancel" onClick={cancelEndCall}>Cancelar</button>
              <button className="vc-end-confirm-continue" onClick={confirmEndCall}>Continuar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
