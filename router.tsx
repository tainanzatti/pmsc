// ============================================================================
// Operação PMSC — Motor do ciclo de estudos e dados do currículo
// Lógica portada do protótipo original, tipada em TypeScript.
// ============================================================================

export type Topic = {
  id: string
  name: string
  /** Peso Fibonacci: maior = mais cobrado na prova */
  fib: number
}

export type Discipline = {
  name: string
  /** Nº de questões na prova, ou "P2" para fase eliminatória (redação) */
  questoes: number | 'P2'
  topics: Topic[]
}

export type Lancamento = {
  id: string
  disciplinaId: string
  topicoId: string
  quantidade: number
  acertos: number
  minutos: number
  data: string // YYYY-MM-DD
}

export type TopicWithMastery = Topic & { mastery: number | null }
export type AllocatedTopic = TopicWithMastery & { minutes: number }

export const CURRICULUM: Record<string, Discipline> = {
  legislacaoInstitucional: {
    name: 'Legislação Institucional',
    questoes: 10,
    topics: [
      { id: 'estatuto', name: 'Lei 6.218/1983 — Estatuto dos Policiais-Militares de SC', fib: 21 },
      { id: 'rdpmsc', name: 'Decreto 12.112/1980 — RDPMSC (Regulamento Disciplinar)', fib: 13 },
      { id: 'leiorganica', name: 'Lei 14.751/2023 — Lei Orgânica Nacional das PMs/CBMs', fib: 13 },
      { id: 'orgbasica', name: 'Decreto 1.601/2021 — Organização Básica da PMSC', fib: 8 },
      { id: 'ingresso', name: 'LC 587/2013 — Ingresso nas carreiras militares', fib: 5 },
      { id: 'promocao', name: 'LC 801/2022 — Promoção de praças', fib: 5 },
      { id: 'remuneracao', name: 'LC 765/2020 — Regime Remuneratório Especial', fib: 3 },
      { id: 'conselhodisciplina', name: 'Lei 5.209/1976 — Conselho de Disciplina', fib: 3 },
    ],
  },
  direitoConstitucional: {
    name: 'Direito Constitucional',
    questoes: 8,
    topics: [
      { id: 'cf122a144', name: 'CF Art. 122 a 144 — Forças Armadas e Segurança Pública', fib: 21 },
      { id: 'cf1a6', name: 'CF Art. 1º a 6º — Princípios Fundamentais', fib: 8 },
      { id: 'cf18a28', name: 'CF Art. 18 a 28 — Organização do Estado', fib: 8 },
      { id: 'cf37a42', name: 'CF Art. 37 a 42 — Administração Pública', fib: 8 },
      { id: 'cesc1a40', name: 'CE/SC Art. 1º a 40 — Princípios e Organização', fib: 8 },
      { id: 'cf14a15', name: 'CF Art. 14 e 15 — Direitos Políticos', fib: 5 },
      { id: 'cesc90e105', name: 'CE/SC Art. 90 e Art. 105 a 109-C', fib: 5 },
      { id: 'cf70a75', name: 'CF Art. 70 a 75 — Fiscalização Contábil e Financeira', fib: 3 },
      { id: 'cf106a110', name: 'CF Art. 106 a 110 — Poder Judiciário', fib: 3 },
    ],
  },
  linguaPortuguesa: {
    name: 'Língua Portuguesa',
    questoes: 8,
    topics: [
      { id: 'interpretacao', name: 'Compreensão e interpretação de textos', fib: 21 },
      { id: 'sintaxe', name: 'Sintaxe da oração e do período', fib: 13 },
      { id: 'crase', name: 'Emprego do sinal indicativo de crase', fib: 13 },
      { id: 'regencia', name: 'Regências nominal e verbal', fib: 8 },
      { id: 'concordancia', name: 'Concordância nominal e verbal', fib: 8 },
      { id: 'pontuacao', name: 'Pontuação', fib: 5 },
      { id: 'classes', name: 'Emprego das classes de palavras', fib: 5 },
      { id: 'acentuacao', name: 'Acentuação gráfica', fib: 3 },
      { id: 'ortografia', name: 'Ortografia oficial', fib: 3 },
      { id: 'tipologia', name: 'Tipologia textual', fib: 2 },
      { id: 'significacao', name: 'Significação das palavras', fib: 2 },
    ],
  },
  direitoPenal: {
    name: 'Direito Penal',
    questoes: 6,
    topics: [
      { id: 'pg1', name: 'Parte Geral, Título I — Da Aplicação da Lei Penal', fib: 8 },
      { id: 'pg2', name: 'Parte Geral, Título II — Do Crime', fib: 13 },
      { id: 'pg3', name: 'Parte Geral, Título III — Da Imputabilidade Penal', fib: 8 },
      { id: 'pg4', name: 'Parte Geral, Título IV — Do Concurso de Pessoas', fib: 5 },
      { id: 'pg5', name: 'Parte Geral, Título V — Das Penas', fib: 13 },
      { id: 'pg6', name: 'Parte Geral, Título VI — Das Medidas de Segurança', fib: 3 },
      { id: 'pg7', name: 'Parte Geral, Título VII — Da Ação Penal', fib: 5 },
      { id: 'pg8', name: 'Parte Geral, Título VIII — Da Extinção da Punibilidade', fib: 8 },
      { id: 'pe1', name: 'Parte Especial, Título I — Crimes contra a Pessoa', fib: 21 },
      { id: 'pe2', name: 'Parte Especial, Título II — Crimes contra o Patrimônio', fib: 21 },
      { id: 'pe3', name: 'Parte Especial, Título III — Crimes contra a Propriedade Imaterial', fib: 2 },
      { id: 'pe4', name: 'Parte Especial, Título IV — Crimes contra a Organização do Trabalho', fib: 2 },
      { id: 'pe5', name: 'Parte Especial, Título V — Crimes contra o Sentimento Religioso e Respeito aos Mortos', fib: 2 },
      { id: 'pe6', name: 'Parte Especial, Título VI — Crimes contra a Dignidade Sexual', fib: 13 },
      { id: 'pe7', name: 'Parte Especial, Título VII — Crimes contra a Família', fib: 3 },
      { id: 'pe8', name: 'Parte Especial, Título VIII — Crimes contra a Incolumidade Pública', fib: 8 },
      { id: 'pe9', name: 'Parte Especial, Título IX — Crimes contra a Paz Pública', fib: 5 },
      { id: 'pe10', name: 'Parte Especial, Título X — Crimes contra a Fé Pública', fib: 8 },
      { id: 'pe11', name: 'Parte Especial, Título XI — Crimes contra a Administração Pública', fib: 13 },
    ],
  },
  direitoProcessualPenal: {
    name: 'Direito Processual Penal',
    questoes: 6,
    topics: [
      { id: 'cppI', name: 'CPP Título I — Do Inquérito Policial', fib: 21 },
      { id: 'cppII', name: 'CPP Título II — Da Ação Penal', fib: 8 },
      { id: 'cppIII', name: 'CPP Título III — Da Ação Civil', fib: 2 },
      { id: 'cppVII', name: 'CPP Título VII — Da Prova', fib: 13 },
      { id: 'cppVIII', name: 'CPP Título VIII — Juiz, MP, Acusado, Defensor e Auxiliares', fib: 5 },
      { id: 'cppIX', name: 'CPP Título IX — Da Prisão e Medidas Cautelares', fib: 21 },
      { id: 'cppL3TI', name: 'CPP Livro III, Título I — Das Nulidades', fib: 8 },
      { id: 'prisaotemp', name: 'Lei 7.960/1989 — Prisão Temporária', fib: 8 },
      { id: 'juizados', name: 'Lei 9.099/1995 — Juizados Especiais', fib: 8 },
      { id: 'juizadosfed', name: 'Lei 10.259/2001 — Juizados Especiais Federais', fib: 3 },
    ],
  },
  direitoPenalMilitar: {
    name: 'Direito Penal Militar',
    questoes: 6,
    topics: [
      { id: 'pgI', name: 'Parte Geral, Título I — Da Aplicação da Lei Penal Militar', fib: 8 },
      { id: 'pgII', name: 'Parte Geral, Título II — Do Crime', fib: 13 },
      { id: 'pgIII', name: 'Parte Geral, Título III — Da Imputabilidade Penal', fib: 8 },
      { id: 'pgIV', name: 'Parte Geral, Título IV — Do Concurso de Agentes', fib: 5 },
      { id: 'pgV', name: 'Parte Geral, Título V — Das Penas', fib: 13 },
      { id: 'pgVI', name: 'Parte Geral, Título VI — Da Aplicação da Pena', fib: 5 },
      { id: 'pgVII', name: 'Parte Geral, Título VII — Suspensão Condicional e Livramento Condicional', fib: 3 },
      { id: 'pgVIII', name: 'Parte Geral, Título VIII — Ação Penal e Extinção da Punibilidade', fib: 5 },
      { id: 'peI', name: 'Parte Especial, Título I — Crimes contra a Segurança Externa do País', fib: 3 },
      { id: 'peII', name: 'Parte Especial, Título II — Crimes contra a Autoridade ou Disciplina Militar', fib: 13 },
      { id: 'peIII', name: 'Parte Especial, Título III — Crimes contra o Serviço e o Dever Militar', fib: 21 },
      { id: 'peIV', name: 'Parte Especial, Título IV — Crimes contra a Pessoa', fib: 13 },
      { id: 'peV', name: 'Parte Especial, Título V — Crimes contra o Patrimônio', fib: 8 },
      { id: 'peVI', name: 'Parte Especial, Título VI — Crimes contra a Incolumidade Pública', fib: 5 },
      { id: 'peVII', name: 'Parte Especial, Título VII — Crimes contra a Administração Militar', fib: 8 },
      { id: 'peVIII', name: 'Parte Especial, Título VIII — Crimes contra a Administração da Justiça Militar', fib: 5 },
    ],
  },
  legislacaoEspecial: {
    name: 'Legislação Especial',
    questoes: 6,
    topics: [
      { id: 'drogas', name: 'Lei 11.343/2006 — Lei de Drogas', fib: 21 },
      { id: 'mariadapenha', name: 'Lei 11.340/2006 — Lei Maria da Penha', fib: 21 },
      { id: 'desarmamento', name: 'Lei 10.826/2003 — Estatuto do Desarmamento', fib: 13 },
      { id: 'abusoautoridade', name: 'Lei 4.898/1965 — Abuso de Autoridade', fib: 13 },
      { id: 'hediondos', name: 'Lei 8.072/1990 — Crimes Hediondos', fib: 8 },
      { id: 'crimeorganizado', name: 'Lei 12.850/2013 — Organização Criminosa', fib: 8 },
      { id: 'racismo', name: 'Lei 7.716/1989 — Crimes de Preconceito de Raça/Cor', fib: 5 },
      { id: 'tortura', name: 'Lei 9.455/1997 — Crimes de Tortura', fib: 5 },
      { id: 'eca', name: 'Lei 8.069/1990 — ECA, Título VII', fib: 5 },
      { id: 'idoso', name: 'Lei 10.741/2003 — Estatuto do Idoso', fib: 3 },
    ],
  },
  legislacaoTransito: {
    name: 'Legislação de Trânsito',
    questoes: 5,
    topics: [
      { id: 'crimestransito', name: 'Art. 291 a 312-B — Crimes de Trânsito', fib: 21 },
      { id: 'infracoes', name: 'Art. 256 a 279-A — Infrações e Penalidades', fib: 13 },
      { id: 'normasgerais', name: 'Art. 26 a 67 — Normas Gerais de Circulação e Conduta', fib: 8 },
      { id: 'habilitacao', name: 'Art. 114 a 160 — Da Habilitação', fib: 5 },
      { id: 'sinalizacao', name: 'Art. 80 a 90 — Sinalização de Trânsito', fib: 3 },
      { id: 'veiculos', name: 'Art. 96 a 102 — Dos Veículos', fib: 2 },
      { id: 'disposicoes', name: 'Art. 1º a 4º — Disposições Preliminares', fib: 2 },
    ],
  },
  informatica: {
    name: 'Informática',
    questoes: 5,
    topics: [
      { id: 'libreoffice', name: 'LibreOffice — Writer, Calc e Impress', fib: 21 },
      { id: 'windows11', name: 'Sistema Operacional Windows 11', fib: 13 },
      { id: 'seguranca', name: 'Segurança: vírus, worms e derivados', fib: 8 },
      { id: 'nuvemlgpd', name: 'Ferramentas de nuvem e LGPD', fib: 8 },
      { id: 'navegacao', name: 'Navegação e correio eletrônico', fib: 5 },
      { id: 'conceitosbasicos', name: 'Conceitos básicos de TI', fib: 3 },
      { id: 'internet', name: 'Conceitos de Internet e intranet', fib: 2 },
    ],
  },
  redacao: {
    name: 'Redação',
    questoes: 'P2',
    topics: [{ id: 'estrutura', name: 'Estrutura dissertativa-argumentativa', fib: 21 }],
  },
}

export const ROTATION_ORDER = [
  'legislacaoInstitucional',
  'direitoConstitucional',
  'linguaPortuguesa',
  'direitoPenal',
  'direitoProcessualPenal',
  'direitoPenalMilitar',
  'legislacaoEspecial',
  'legislacaoTransito',
  'informatica',
  'redacao',
] as const


export const ALL_TOPICS_COUNT = Object.values(CURRICULUM).reduce(
  (a, d) => a + d.topics.length,
  0
)

// ============================== Níveis de domínio ==============================

export type TierKey = 'sem-dados' | 'fraco' | 'mediano' | 'bom' | 'dominado'

export type TierInfo = { key: TierKey; label: string; token: string }

export function tierInfo(mastery: number | null | undefined): TierInfo {
  if (mastery === null || mastery === undefined)
    return { key: 'sem-dados', label: 'Sem dados', token: 'var(--tier-none)' }
  if (mastery < 50) return { key: 'fraco', label: 'Fraco', token: 'var(--tier-weak)' }
  if (mastery < 75) return { key: 'mediano', label: 'Mediano', token: 'var(--tier-mid)' }
  if (mastery < 90) return { key: 'bom', label: 'Bom', token: 'var(--tier-good)' }
  return { key: 'dominado', label: 'Dominado', token: 'var(--tier-mastered)' }
}

export function explainAllocation(t: TopicWithMastery): string {
  const tier = tierInfo(t.mastery)
  if (tier.key === 'sem-dados') return `Ainda sem lançamentos — prioridade máxima (peso ${t.fib}).`
  if (tier.key === 'fraco') return `Média abaixo de 50% — mantém prioridade alta.`
  if (tier.key === 'mediano') return `Entre 50–75% — tempo reduzido, em consolidação.`
  if (tier.key === 'bom') return `Entre 75–90% — tempo reduzido, quase dominado.`
  return `Acima de 90% — piso mínimo de manutenção.`
}

// ============================== Cálculos de desempenho ==============================

export function movingAverageMastery(
  lancamentos: Lancamento[],
  disciplinaId: string,
  topicoId: string,
  n = 5
): number | null {
  const entries = lancamentos
    .filter((l) => l.disciplinaId === disciplinaId && l.topicoId === topicoId)
    .sort((a, b) => (a.data < b.data ? 1 : -1))
    .slice(0, n)
  if (entries.length === 0) return null
  const avg =
    entries.reduce((s, e) => s + (e.acertos / e.quantidade) * 100, 0) / entries.length
  return Math.round(avg)
}

const TIER_MULT: Record<TierKey, number> = {
  'sem-dados': 1,
  fraco: 1,
  mediano: 0.6,
  bom: 0.35,
  dominado: 0.15,
}

// Distribui 60 min entre os tópicos ativos, respeitando peso Fibonacci + domínio.
export function allocateMinutes(activeTopics: TopicWithMastery[]): AllocatedTopic[] {
  if (activeTopics.length === 0) return []
  const sumFib = activeTopics.reduce((a, t) => a + t.fib, 0)
  const base = activeTopics.map((t) => (t.fib / sumFib) * 60)
  const adjusted = activeTopics.map((t, i) => base[i] * TIER_MULT[tierInfo(t.mastery).key])
  const freed = base.reduce((a, b) => a + b, 0) - adjusted.reduce((a, b) => a + b, 0)

  const recipients = activeTopics
    .map((t, i) => ({ i, fib: t.fib, tier: tierInfo(t.mastery).key }))
    .filter((r) => r.tier !== 'dominado')
    .sort((a, b) => b.fib - a.fib)

  const finalRaw = [...adjusted]
  if (freed > 0.01) {
    if (recipients.length > 0) finalRaw[recipients[0].i] += freed
    else finalRaw.forEach((_, i) => (finalRaw[i] += freed / finalRaw.length))
  }

  const minutes = finalRaw.map((m) => Math.max(1, Math.round(m)))
  const diff = 60 - minutes.reduce((a, b) => a + b, 0)
  if (diff !== 0) minutes[minutes.indexOf(Math.max(...minutes))] += diff
  return activeTopics.map((t, i) => ({ ...t, minutes: minutes[i] }))
}

export function disciplineTopicsWithMastery(
  lancamentos: Lancamento[],
  discId: string
): TopicWithMastery[] {
  return CURRICULUM[discId].topics.map((t) => ({
    ...t,
    mastery: movingAverageMastery(lancamentos, discId, t.id),
  }))
}

export function disciplineAggregate(lancamentos: Lancamento[], discId: string) {
  const entries = lancamentos.filter((l) => l.disciplinaId === discId)
  const quantidade = entries.reduce((a, e) => a + e.quantidade, 0)
  const acertos = entries.reduce((a, e) => a + e.acertos, 0)
  return {
    quantidade,
    acertos,
    pct: quantidade > 0 ? Math.round((acertos / quantidade) * 100) : null,
  }
}

export function computeStreak(lancamentos: Lancamento[]): number {
  const dates = [...new Set(lancamentos.map((l) => l.data))].sort().reverse()
  if (dates.length === 0) return 0
  const today = new Date().toISOString().slice(0, 10)
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
  if (dates[0] !== today && dates[0] !== yesterday) return 0
  let streak = 1
  for (let i = 0; i < dates.length - 1; i++) {
    const diffDays = Math.round(
      (new Date(dates[i]).getTime() - new Date(dates[i + 1]).getTime()) / 86400000
    )
    if (diffDays === 1) streak++
    else break
  }
  return streak
}

// Próxima disciplina "herói" na sequência: a que vem depois do último lançamento.
// Empate de datas é resolvido pela ordem de inserção (o registro mais recente vence).
export function nextHeroDiscipline(lancamentos: Lancamento[]): string {
  if (lancamentos.length === 0) return ROTATION_ORDER[0]
  const last = lancamentos
    .map((l, idx) => ({ l, idx }))
    .sort((a, b) => (a.l.data === b.l.data ? b.idx - a.idx : a.l.data < b.l.data ? 1 : -1))[0].l
  const idx = ROTATION_ORDER.indexOf(last.disciplinaId as (typeof ROTATION_ORDER)[number])
  return ROTATION_ORDER[(idx + 1) % ROTATION_ORDER.length]
}

// Usa a ordem de inserção real (não a data) — reflete a sequência de ações do usuário.
export function computeCycleStats(lancamentos: Lancamento[]) {
  let covered = new Set<string>()
  let completedCycles = 0
  let lastCompletionWasFinalEntry = false
  lancamentos.forEach((l, idx) => {
    covered.add(l.disciplinaId)
    lastCompletionWasFinalEntry = false
    if (covered.size === ROTATION_ORDER.length) {
      completedCycles++
      covered = new Set()
      lastCompletionWasFinalEntry = idx === lancamentos.length - 1
    }
  })
  return {
    completedCycles,
    coverage: covered.size,
    total: ROTATION_ORDER.length,
    justCompleted: lastCompletionWasFinalEntry,
  }
}

export function daysSinceLastStudy(lancamentos: Lancamento[]): number | null {
  if (lancamentos.length === 0) return null
  const dates = [...new Set(lancamentos.map((l) => l.data))].sort().reverse()
  const today = new Date().toISOString().slice(0, 10)
  return Math.round((new Date(today).getTime() - new Date(dates[0]).getTime()) / 86400000)
}

// Progressão: ciclo 1 = 1 tópico (hora cheia), ciclo 2 = 2 tópicos, ciclo 3+ = 3 (teto).
export function maxTopicsForCycle(cycleNumber: number): number {
  if (cycleNumber <= 1) return 1
  if (cycleNumber === 2) return 2
  return 3
}

const TIER_ORDER: Record<TierKey, number> = {
  'sem-dados': 0,
  fraco: 1,
  mediano: 2,
  bom: 3,
  dominado: 4,
}

// Seleciona quais tópicos disputam a hora desta disciplina no ciclo atual.
export function selectActiveTopics(
  topicsWithMastery: TopicWithMastery[],
  discId: string,
  lancamentos: Lancamento[],
  maxCount: number
): TopicWithMastery[] {
  const touchedIds = new Set(
    lancamentos.filter((l) => l.disciplinaId === discId).map((l) => l.topicoId)
  )
  const touched = topicsWithMastery
    .filter((t) => touchedIds.has(t.id))
    .sort((a, b) => {
      const ta = TIER_ORDER[tierInfo(a.mastery).key]
      const tb = TIER_ORDER[tierInfo(b.mastery).key]
      return ta !== tb ? ta - tb : b.fib - a.fib
    })
  const untouched = topicsWithMastery
    .filter((t) => !touchedIds.has(t.id))
    .sort((a, b) => b.fib - a.fib)

  let selected = [...touched]
  while (selected.length < maxCount && untouched.length > 0) selected.push(untouched.shift()!)
  if (selected.length > maxCount) selected = selected.slice(0, maxCount)

  const allDominado =
    selected.length > 0 && selected.every((t) => tierInfo(t.mastery).key === 'dominado')
  if (allDominado && untouched.length > 0) selected = [...selected.slice(1), untouched[0]]

  return selected
}

// ============================== Revisão por cores ==============================

export function targetViews(fib: number): number {
  return Math.round(8 + ((fib - 2) / (21 - 2)) * (20 - 8))
}

export function viewCount(lancamentos: Lancamento[], discId: string, topicId: string): number {
  return lancamentos.filter((l) => l.disciplinaId === discId && l.topicoId === topicId).length
}

export function lerpColor(hexA: string, hexB: string, t: number): string {
  t = Math.max(0, Math.min(1, t))
  const parse = (h: string) => h.replace('#', '').match(/\w\w/g)!.map((v) => parseInt(v, 16))
  const a = parse(hexA)
  const b = parse(hexB)
  const c = a.map((v, i) => Math.round(v + (b[i] - v) * t))
  return `rgb(${c[0]}, ${c[1]}, ${c[2]})`
}
