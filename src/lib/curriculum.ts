// src/lib/curriculum.ts
// Núcleo do motor de estudos da Operação PMSC (Soldado PMSC 2026 - banca Instituto AOCP).
// Bloco 1: fila de prioridade ponderada + teto de tópicos por desempenho real.
// Bloco 2: multiplicador de urgência por disciplina pulada.

// ---------------------------------------------------------------------------
// Tipos públicos (compatíveis com o que já é persistido no Supabase)
// ---------------------------------------------------------------------------

export type DisciplineId =
  | "portugues"
  | "matematica"
  | "historia-sc"
  | "geografia-sc"
  | "atualidades"
  | "legislacao"
  | "raciocinio-logico"
  | "informatica"
  | "redacao";

export type MasteryTier = "ruim" | "medio" | "bom" | "otimo";

export interface Lancamento {
  id: string;
  topic_id: string;
  discipline_id: DisciplineId;
  mastered: number;
  created_at: string;
  cycle_number?: number | null;
}

export interface TopicWithMastery {
  id: string;
  discipline_id: DisciplineId;
  title: string;
  mastery: number;
  last_reviewed_at: string | null;
}

export interface AllocatedTopic {
  topic: TopicWithMastery;
  reason: "abaixo-do-teto" | "reforco" | "primeiro-ciclo";
}

export interface DisciplineSkipState {
  discipline_id: DisciplineId;
  skip_count: number;
  urgency_multiplier: number;
  updated_at: string;
}

// ---------------------------------------------------------------------------
// Configuração do edital
// ---------------------------------------------------------------------------

export interface DisciplineConfig {
  id: DisciplineId;
  label: string;
  weight: number;
  rotationOrder: number;
}

export const DISCIPLINES: Record<DisciplineId, DisciplineConfig> = {
  portugues: { id: "portugues", label: "Língua Portuguesa", weight: 0.2, rotationOrder: 0 },
  matematica: { id: "matematica", label: "Matemática", weight: 0.15, rotationOrder: 1 },
  "raciocinio-logico": { id: "raciocinio-logico", label: "Raciocínio Lógico", weight: 0.1, rotationOrder: 2 },
  "historia-sc": { id: "historia-sc", label: "História de SC", weight: 0.12, rotationOrder: 3 },
  "geografia-sc": { id: "geografia-sc", label: "Geografia de SC", weight: 0.12, rotationOrder: 4 },
  atualidades: { id: "atualidades", label: "Atualidades", weight: 0.08, rotationOrder: 5 },
  legislacao: { id: "legislacao", label: "Legislação", weight: 0.13, rotationOrder: 6 },
  informatica: { id: "informatica", label: "Informática", weight: 0.1, rotationOrder: 7 },
  redacao: { id: "redacao", label: "Redação", weight: 0.0, rotationOrder: 8 },
};

export const ALL_DISCIPLINE_IDS = Object.keys(DISCIPLINES) as DisciplineId[];

export const GOOD_TIER: MasteryTier = "bom";

// ---------------------------------------------------------------------------
// Helpers de tier e domínio médio
// ---------------------------------------------------------------------------

export function masteryToTier(mastery: number): MasteryTier {
  if (mastery < 40) return "ruim";
  if (mastery < 65) return "medio";
  if (mastery < 85) return "bom";
  return "otimo";
}

export function isBelowGood(mastery: number): boolean {
  const tier = masteryToTier(mastery);
  return tier !== "bom" && tier !== "otimo";
}

export function averageMasteryForDiscipline(
  topics: TopicWithMastery[],
  discipline: DisciplineId,
): number {
  const filtered = topics.filter((t) => t.discipline_id === discipline);
  if (filtered.length === 0) return 0;
  return filtered.reduce((sum, t) => sum + t.mastery, 0) / filtered.length;
}

// ---------------------------------------------------------------------------
// 1) FILA DE PRIORIDADE PONDERADA
// ---------------------------------------------------------------------------

export function forgettingFactor(daysSinceLastReview: number): number {
  if (daysSinceLastReview <= 0) return 1;
  if (!isFinite(daysSinceLastReview)) return 2.5;
  return Math.min(2.5, 1 + daysSinceLastReview / 5);
}

export function daysSinceLastDisciplineReview(
  topics: TopicWithMastery[],
  discipline: DisciplineId,
  now: Date = new Date(),
): number {
  const filtered = topics.filter(
    (t) => t.discipline_id === discipline && t.last_reviewed_at,
  );
  if (filtered.length === 0) return Infinity;
  const latest = filtered.reduce((max, t) => {
    const ts = new Date(t.last_reviewed_at as string).getTime();
    return ts > max ? ts : max;
  }, 0);
  const diffMs = now.getTime() - latest;
  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
}

export interface DisciplineScore {
  discipline: DisciplineId;
  score: number;
  weight: number;
  averageMastery: number;
  daysSinceReview: number;
  forgetting: number;
  urgencyMultiplier: number;
}

/**
 * score = pesoEdital × (1 − dominioMedio/100) × fatorEsquecimento × multiplicadorUrgencia
 */
export function scoreDisciplines(
  topics: TopicWithMastery[],
  skipStates: Record<string, DisciplineSkipState>,
  now: Date = new Date(),
): DisciplineScore[] {
  const scores: DisciplineScore[] = ALL_DISCIPLINE_IDS.map((id) => {
    const cfg = DISCIPLINES[id];
    const avg = averageMasteryForDiscipline(topics, id);
    const days = daysSinceLastDisciplineReview(topics, id, now);
    const forgetting = forgettingFactor(days);
    const urgency = skipStates[id]?.urgency_multiplier ?? 1.0;
    const score = cfg.weight * (1 - avg / 100) * forgetting * urgency;
    return {
      discipline: id,
      score,
      weight: cfg.weight,
      averageMastery: avg,
      daysSinceReview: days,
      forgetting,
      urgencyMultiplier: urgency,
    };
  });
  scores.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return DISCIPLINES[a.discipline].rotationOrder - DISCIPLINES[b.discipline].rotationOrder;
  });
  return scores;
}

export function nextHeroDiscipline(
  topics: TopicWithMastery[],
  skipStates: Record<string, DisciplineSkipState>,
  options: { now?: Date; cycleLength?: number } = {},
): DisciplineId {
  const now = options.now ?? new Date();
  const cycleLength = options.cycleLength ?? 1;
  const scores = scoreDisciplines(topics, skipStates, now);

  const top = scores.slice(0, cycleLength).map((s) => s.discipline);

  const mostNeglected = [...scores].sort(
    (a, b) => b.daysSinceReview - a.daysSinceReview,
  )[0];
  if (mostNeglected && !top.includes(mostNeglected.discipline)) {
    if (mostNeglected.daysSinceReview > ALL_DISCIPLINE_IDS.length) {
      top[top.length - 1] = mostNeglected.discipline;
    }
  }

  return top[0];
}

// ---------------------------------------------------------------------------
// 2) TETO DE TÓPICOS POR DESEMPENHO REAL
// ---------------------------------------------------------------------------

export function countTopicsBelowGood(
  topics: TopicWithMastery[],
  discipline: DisciplineId,
): number {
  return topics.filter(
    (t) => t.discipline_id === discipline && isBelowGood(t.mastery),
  ).length;
}

export function maxTopicsForDiscipline(
  topics: TopicWithMastery[],
  discipline: DisciplineId,
): number {
  const belowGood = countTopicsBelowGood(topics, discipline);
  return Math.min(3, belowGood);
}

export function allocateTopicsForDiscipline(
  topics: TopicWithMastery[],
  discipline: DisciplineId,
): AllocatedTopic[] {
  const cap = maxTopicsForDiscipline(topics, discipline);
  if (cap === 0) return [];

  const candidates = topics
    .filter((t) => t.discipline_id === discipline && isBelowGood(t.mastery))
    .sort((a, b) => {
      if (a.mastery !== b.mastery) return a.mastery - b.mastery;
      const aTs = a.last_reviewed_at ? new Date(a.last_reviewed_at).getTime() : 0;
      const bTs = b.last_reviewed_at ? new Date(b.last_reviewed_at).getTime() : 0;
      return aTs - bTs;
    });

  return candidates.slice(0, cap).map((topic) => ({
    topic,
    reason: topic.last_reviewed_at ? ("abaixo-do-teto" as const) : ("primeiro-ciclo" as const),
  }));
}

// ---------------------------------------------------------------------------
// 4) TRAVA DA DISCIPLINA ATIVA — multiplicador de urgência por skip
// ---------------------------------------------------------------------------

/**
 * Calcula o próximo multiplicador de urgência ao pular uma disciplina.
 * Empilha: 1.0 → 1.5 → 2.0 → 2.5 → 3.0 (teto de 3.0).
 */
export function nextSkipMultiplier(current: number): number {
  return Math.min(3.0, current + 0.5);
}

/**
 * Texto explicativo do motivo da prioridade de uma disciplina.
 */
export function priorityReason(
  discipline: DisciplineId,
  topics: TopicWithMastery[],
  skipStates: Record<string, DisciplineSkipState>,
): string {
  const cfg = DISCIPLINES[discipline];
  const avg = averageMasteryForDiscipline(topics, discipline);
  const days = daysSinceLastDisciplineReview(topics, discipline);
  const skip = skipStates[discipline];
  const weightPct = Math.round(cfg.weight * 100);
  const masteryPct = Math.round(avg);
  const daysText = !isFinite(days) ? "sem revisão registrada" : `sem revisão há ${days} ${days === 1 ? "dia" : "dias"}`;
  const skipText = skip && skip.skip_count > 0 ? `, pulada ${skip.skip_count}x` : "";
  return `peso ${weightPct}% no edital, domínio médio ${masteryPct}%, ${daysText}${skipText}`;
}

// ---------------------------------------------------------------------------
// Utilitário: consolidar lançamentos em TopicWithMastery
// ---------------------------------------------------------------------------

export function consolidateTopics(lancamentos: Lancamento[]): TopicWithMastery[] {
  const byTopic = new Map<string, Lancamento[]>();
  for (const l of lancamentos) {
    const arr = byTopic.get(l.topic_id) ?? [];
    arr.push(l);
    byTopic.set(l.topic_id, arr);
  }

  const topics: TopicWithMastery[] = [];
  for (const [topicId, entries] of byTopic) {
    const mastery = entries.reduce((sum, e) => sum + e.mastered, 0) / entries.length;
    const latest = entries.reduce((max, e) => {
      const ts = new Date(e.created_at).getTime();
      return ts > max ? ts : max;
    }, 0);
    const first = entries[0];
    topics.push({
      id: topicId,
      discipline_id: first.discipline_id,
      title: topicId,
      mastery,
      last_reviewed_at: latest > 0 ? new Date(latest).toISOString() : null,
    });
  }
  return topics;
}
