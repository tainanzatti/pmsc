// src/lib/db.ts
// Funções de acesso ao banco para o sistema de flashcards e cálculo de domínio.

import { supabase } from "./supabase";
import type { DisciplineId, Lancamento, TopicWithMastery } from "./curriculum";
import { consolidateTopics } from "./curriculum";
import type { FlashcardPair } from "./ai.functions";

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

export interface TopicRow {
  id: string;
  discipline_id: string;
  title: string;
  created_at: string;
}

export interface LancamentoRow {
  id: string;
  topic_id: string;
  discipline_id: string;
  mastered: number;
  created_at: string;
  cycle_number: number | null;
}

export interface FlashcardRow {
  id: string;
  user_id: string | null;
  disciplina_id: string;
  topico_id: string;
  pergunta: string;
  resposta: string;
  caixa: number;
  proxima_revisao: string;
  created_at: string;
  updated_at: string;
}

// ---------------------------------------------------------------------------
// Cálculo de moving average mastery por tópico
// ---------------------------------------------------------------------------

/**
 * Calcula a média móvel de domínio (movingAverageMastery) para um tópico.
 * Usa os N lançamentos mais recentes (default 5) e faz média ponderada
 * dando mais peso aos mais recentes.
 */
export function movingAverageMastery(
  lancamentos: Lancamento[],
  topicId: string,
  windowSize = 5,
): number {
  const entries = lancamentos
    .filter((l) => l.topic_id === topicId)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, windowSize);

  if (entries.length === 0) return 0;

  let totalWeight = 0;
  let weightedSum = 0;
  entries.forEach((entry, idx) => {
    const weight = entries.length - idx; // most recent gets highest weight
    weightedSum += entry.mastered * weight;
    totalWeight += weight;
  });

  return weightedSum / totalWeight;
}

// ---------------------------------------------------------------------------
// Carregar todos os tópicos com suas médias de domínio
// ---------------------------------------------------------------------------

export async function loadTopicsWithMastery(): Promise<{
  topics: TopicWithMastery[];
  topicRows: TopicRow[];
}> {
  const [topicsRes, lancamentosRes] = await Promise.all([
    supabase.from("topics").select("*"),
    supabase.from("lancamentos").select("*"),
  ]);

  if (topicsRes.error) throw topicsRes.error;
  if (lancamentosRes.error) throw lancamentosRes.error;

  const topicRows = (topicsRes.data as TopicRow[]) ?? [];
  const lancamentoRows = (lancamentosRes.data as LancamentoRow[]) ?? [];

  const lancamentos: Lancamento[] = lancamentoRows.map((l) => ({
    ...l,
    discipline_id: l.discipline_id as DisciplineId,
  }));

  const consolidated = consolidateTopics(lancamentos);
  const topicMap = new Map<string, TopicWithMastery>();
  for (const t of consolidated) topicMap.set(t.id, t);

  for (const t of topicRows) {
    if (!topicMap.has(t.id)) {
      topicMap.set(t.id, {
        id: t.id,
        discipline_id: t.discipline_id as DisciplineId,
        title: t.title,
        mastery: 0,
        last_reviewed_at: null,
      });
    } else {
      const existing = topicMap.get(t.id)!;
      topicMap.set(t.id, { ...existing, title: t.title });
    }
  }

  return {
    topics: Array.from(topicMap.values()),
    topicRows,
  };
}

// ---------------------------------------------------------------------------
// Fila de flashcards — tópicos com movingAverageMastery < 60%
// ---------------------------------------------------------------------------

export async function getFlashcardQueueTopics(): Promise<
  { topic: TopicRow; mastery: number }[]
> {
  const { topics, topicRows } = await loadTopicsWithMastery();

  const belowThreshold = topics.filter((t) => t.mastery < 60);

  const result = belowThreshold
    .map((t) => {
      const row = topicRows.find((r) => r.id === t.id);
      return row ? { topic: row, mastery: t.mastery } : null;
    })
    .filter((x): x is { topic: TopicRow; mastery: number } => x !== null);

  return result.sort((a, b) => a.mastery - b.mastery);
}

// ---------------------------------------------------------------------------
// Flashcards CRUD + Leitner
// ---------------------------------------------------------------------------

const LEITNER_INTERVALS = [1, 2, 4, 8, 16]; // days per box 1-5

export function leitnerInterval(box: number): number {
  return LEITNER_INTERVALS[Math.min(box - 1, LEITNER_INTERVALS.length - 1)];
}

export async function loadFlashcardsForTopic(topicId: string): Promise<FlashcardRow[]> {
  const { data, error } = await supabase
    .from("flashcards")
    .select("*")
    .eq("topico_id", topicId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return (data as FlashcardRow[]) ?? [];
}

export async function loadDueFlashcards(): Promise<FlashcardRow[]> {
  const today = new Date().toISOString().split("T")[0];
  const { data, error } = await supabase
    .from("flashcards")
    .select("*")
    .lte("proxima_revisao", today)
    .order("proxima_revisao", { ascending: true });

  if (error) throw error;
  return (data as FlashcardRow[]) ?? [];
}

export async function countDueFlashcards(): Promise<number> {
  const today = new Date().toISOString().split("T")[0];
  const { count, error } = await supabase
    .from("flashcards")
    .select("*", { count: "exact", head: true })
    .lte("proxima_revisao", today);

  if (error) throw error;
  return count ?? 0;
}

export async function createFlashcardsForTopic(
  topicId: string,
  disciplineId: string,
  pairs: FlashcardPair[],
): Promise<FlashcardRow[]> {
  const today = new Date().toISOString().split("T")[0];
  const rows = pairs.map((p) => ({
    disciplina_id: disciplineId,
    topico_id: topicId,
    pergunta: p.pergunta,
    resposta: p.resposta,
    caixa: 1,
    proxima_revisao: today,
  }));

  const { data, error } = await supabase
    .from("flashcards")
    .insert(rows)
    .select("*");

  if (error) throw error;
  return (data as FlashcardRow[]) ?? [];
}

export async function reviewFlashcard(
  flashcardId: string,
  remembered: boolean,
): Promise<FlashcardRow | null> {
  const { data: current, error: fetchError } = await supabase
    .from("flashcards")
    .select("*")
    .eq("id", flashcardId)
    .maybeSingle();

  if (fetchError) throw fetchError;
  if (!current) return null;

  const card = current as FlashcardRow;
  const newBox = remembered
    ? Math.min(5, card.caixa + 1)
    : 1;

  const interval = leitnerInterval(newBox);
  const nextReview = new Date();
  nextReview.setDate(nextReview.getDate() + interval);
  const nextReviewStr = nextReview.toISOString().split("T")[0];

  const { data, error } = await supabase
    .from("flashcards")
    .update({
      caixa: newBox,
      proxima_revisao: nextReviewStr,
      updated_at: new Date().toISOString(),
    })
    .eq("id", flashcardId)
    .select("*")
    .maybeSingle();

  if (error) throw error;
  return (data as FlashcardRow) ?? null;
}

export async function deleteFlashcardsForTopic(topicId: string): Promise<void> {
  const { error } = await supabase
    .from("flashcards")
    .delete()
    .eq("topico_id", topicId);
  if (error) throw error;
}

/**
 * Garante que existem flashcards para um tópico. Se não existem, gera via IA
 * e persiste. Se já existem, retorna os existentes.
 */
export async function ensureFlashcardsForTopic(
  topicId: string,
  disciplineId: string,
  topicTitle: string,
): Promise<{ flashcards: FlashcardRow[]; generated: boolean }> {
  const existing = await loadFlashcardsForTopic(topicId);
  if (existing.length > 0) {
    return { flashcards: existing, generated: false };
  }

  const { generateFlashcards } = await import("./ai-client");
  const { pairs } = await generateFlashcards(topicId, disciplineId, topicTitle);
  const created = await createFlashcardsForTopic(topicId, disciplineId, pairs);
  return { flashcards: created, generated: true };
}
