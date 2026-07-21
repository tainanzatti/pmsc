// src/lib/db.ts
import { supabase } from "./supabase";
import type { DisciplineId, Lancamento, TopicWithMastery } from "./curriculum";
import { consolidateTopics } from "./curriculum";
import type { FlashcardPair } from "./ai.functions";

export interface TopicRow { id: string; discipline_id: string; title: string; created_at: string }
export interface LancamentoRow { id: string; topic_id: string; discipline_id: string; mastered: number; created_at: string; cycle_number: number | null }
export interface FlashcardRow { id: string; user_id: string | null; disciplina_id: string; topico_id: string; pergunta: string; resposta: string; caixa: number; proxima_revisao: string; created_at: string; updated_at: string }
export interface StudySessionRow { id: string; discipline_id: string; topic_id: string | null; duration_minutes: number; session_date: string; created_at: string }
export interface RedacaoRow { id: string; tema: string; texto: string; nota: number | null; feedback_json: unknown; criado_em: string }
export interface SkipStateRow { discipline_id: string; skip_count: number; urgency_multiplier: number; updated_at: string }

export function movingAverageMastery(lancamentos: Lancamento[], topicId: string, windowSize = 5): number {
  const entries = lancamentos.filter((l) => l.topic_id === topicId).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, windowSize);
  if (entries.length === 0) return 0;
  let totalWeight = 0, weightedSum = 0;
  entries.forEach((entry, idx) => { const weight = entries.length - idx; weightedSum += entry.mastered * weight; totalWeight += weight; });
  return weightedSum / totalWeight;
}

export async function loadTopicsWithMastery(): Promise<{ topics: TopicWithMastery[]; topicRows: TopicRow[] }> {
  const [topicsRes, lancamentosRes] = await Promise.all([supabase.from("topics").select("*"), supabase.from("lancamentos").select("*")]);
  if (topicsRes.error) throw topicsRes.error;
  if (lancamentosRes.error) throw lancamentosRes.error;
  const topicRows = (topicsRes.data as TopicRow[]) ?? [];
  const lancamentoRows = (lancamentosRes.data as LancamentoRow[]) ?? [];
  const lancamentos: Lancamento[] = lancamentoRows.map((l) => ({ ...l, discipline_id: l.discipline_id as DisciplineId }));
  const consolidated = consolidateTopics(lancamentos);
  const topicMap = new Map<string, TopicWithMastery>();
  for (const t of consolidated) topicMap.set(t.id, t);
  for (const t of topicRows) {
    if (!topicMap.has(t.id)) topicMap.set(t.id, { id: t.id, discipline_id: t.discipline_id as DisciplineId, title: t.title, mastery: 0, last_reviewed_at: null });
    else { const ex = topicMap.get(t.id)!; topicMap.set(t.id, { ...ex, title: t.title }); }
  }
  return { topics: Array.from(topicMap.values()), topicRows };
}

export async function getFlashcardQueueTopics(): Promise<{ topic: TopicRow; mastery: number }[]> {
  const { topics, topicRows } = await loadTopicsWithMastery();
  const belowThreshold = topics.filter((t) => t.mastery < 60);
  return belowThreshold.map((t) => { const row = topicRows.find((r) => r.id === t.id); return row ? { topic: row, mastery: t.mastery } : null; }).filter((x): x is { topic: TopicRow; mastery: number } => x !== null).sort((a, b) => a.mastery - b.mastery);
}

const LEITNER_INTERVALS = [1, 2, 4, 8, 16];
export function leitnerInterval(box: number): number { return LEITNER_INTERVALS[Math.min(box - 1, LEITNER_INTERVALS.length - 1)]; }

export async function loadFlashcardsForTopic(topicId: string): Promise<FlashcardRow[]> {
  const { data, error } = await supabase.from("flashcards").select("*").eq("topico_id", topicId).order("created_at", { ascending: true });
  if (error) throw error;
  return (data as FlashcardRow[]) ?? [];
}

export async function loadDueFlashcards(): Promise<FlashcardRow[]> {
  const today = new Date().toISOString().split("T")[0];
  const { data, error } = await supabase.from("flashcards").select("*").lte("proxima_revisao", today).order("proxima_revisao", { ascending: true });
  if (error) throw error;
  return (data as FlashcardRow[]) ?? [];
}

export async function countDueFlashcards(): Promise<number> {
  const today = new Date().toISOString().split("T")[0];
  const { count, error } = await supabase.from("flashcards").select("*", { count: "exact", head: true }).lte("proxima_revisao", today);
  if (error) throw error;
  return count ?? 0;
}

export async function createFlashcardsForTopic(topicId: string, disciplineId: string, pairs: FlashcardPair[]): Promise<FlashcardRow[]> {
  const today = new Date().toISOString().split("T")[0];
  const rows = pairs.map((p) => ({ disciplina_id: disciplineId, topico_id: topicId, pergunta: p.pergunta, resposta: p.resposta, caixa: 1, proxima_revisao: today }));
  const { data, error } = await supabase.from("flashcards").insert(rows).select("*");
  if (error) throw error;
  return (data as FlashcardRow[]) ?? [];
}

export async function reviewFlashcard(flashcardId: string, remembered: boolean): Promise<FlashcardRow | null> {
  const { data: current, error: fetchError } = await supabase.from("flashcards").select("*").eq("id", flashcardId).maybeSingle();
  if (fetchError) throw fetchError;
  if (!current) return null;
  const card = current as FlashcardRow;
  const newBox = remembered ? Math.min(5, card.caixa + 1) : 1;
  const interval = leitnerInterval(newBox);
  const nextReview = new Date();
  nextReview.setDate(nextReview.getDate() + interval);
  const { data, error } = await supabase.from("flashcards").update({ caixa: newBox, proxima_revisao: nextReview.toISOString().split("T")[0], updated_at: new Date().toISOString() }).eq("id", flashcardId).select("*").maybeSingle();
  if (error) throw error;
  return (data as FlashcardRow) ?? null;
}

export async function ensureFlashcardsForTopic(topicId: string, disciplineId: string, topicTitle: string): Promise<{ flashcards: FlashcardRow[]; generated: boolean }> {
  const existing = await loadFlashcardsForTopic(topicId);
  if (existing.length > 0) return { flashcards: existing, generated: false };
  const { generateFlashcards } = await import("./ai-client");
  const { pairs } = await generateFlashcards(topicId, disciplineId, topicTitle);
  const created = await createFlashcardsForTopic(topicId, disciplineId, pairs);
  return { flashcards: created, generated: true };
}

export async function loadStudySessions(): Promise<StudySessionRow[]> {
  const { data, error } = await supabase.from("study_sessions").select("*").order("session_date", { ascending: false });
  if (error) throw error;
  return (data as StudySessionRow[]) ?? [];
}

export async function getMinutesStudiedToday(): Promise<number> {
  const today = new Date().toISOString().split("T")[0];
  const { data, error } = await supabase.from("study_sessions").select("duration_minutes").eq("session_date", today);
  if (error) throw error;
  const rows = (data as { duration_minutes: number }[]) ?? [];
  return rows.reduce((sum, r) => sum + r.duration_minutes, 0);
}

export async function getTotalMinutesStudied(): Promise<number> {
  const { data, error } = await supabase.from("study_sessions").select("duration_minutes");
  if (error) throw error;
  const rows = (data as { duration_minutes: number }[]) ?? [];
  return rows.reduce((sum, r) => sum + r.duration_minutes, 0);
}

export async function loadRedacoes(): Promise<RedacaoRow[]> {
  const { data, error } = await supabase.from("redacoes").select("*").order("criado_em", { ascending: false });
  if (error) throw error;
  return (data as RedacaoRow[]) ?? [];
}

export async function insertRedacao(tema: string, texto: string): Promise<RedacaoRow> {
  const { data, error } = await supabase.from("redacoes").insert({ tema, texto }).select("*").single();
  if (error) throw error;
  return data as RedacaoRow;
}

export async function updateRedacaoCorrecao(id: string, nota: number, feedbackJson: unknown): Promise<void> {
  const { error } = await supabase.from("redacoes").update({ nota, feedback_json: feedbackJson }).eq("id", id);
  if (error) throw error;
}

export async function getUntouchedTopicCount(): Promise<{ untouched: number; total: number }> {
  const [topicsRes, lancamentosRes] = await Promise.all([
    supabase.from("topics").select("id", { count: "exact", head: true }),
    supabase.from("lancamentos").select("topic_id"),
  ]);
  if (topicsRes.error) throw topicsRes.error;
  if (lancamentosRes.error) throw lancamentosRes.error;
  const total = topicsRes.count ?? 0;
  const touchedIds = new Set((lancamentosRes.data as { topic_id: string }[])?.map((r) => r.topic_id) ?? []);
  return { untouched: total - touchedIds.size, total };
}

export async function getNewTopicsPerDayLast30Days(): Promise<number> {
  const since = new Date();
  since.setDate(since.getDate() - 30);
  const sinceStr = since.toISOString();
  const { data: lancamentos, error } = await supabase.from("lancamentos").select("topic_id, created_at").gte("created_at", sinceStr);
  if (error) throw error;
  const rows = (lancamentos as { topic_id: string; created_at: string }[]) ?? [];
  const firstTouchByTopic = new Map<string, string>();
  for (const r of rows) { const existing = firstTouchByTopic.get(r.topic_id); if (!existing || r.created_at < existing) firstTouchByTopic.set(r.topic_id, r.created_at); }
  const uniqueDays = new Set<string>();
  for (const dateStr of firstTouchByTopic.values()) uniqueDays.add(dateStr.split("T")[0]);
  const activeDays = uniqueDays.size || 1;
  return firstTouchByTopic.size / activeDays;
}

export async function getAvgMinutesPerNewTopic(): Promise<number> {
  const since = new Date();
  since.setDate(since.getDate() - 30);
  const [lancRes, sessionRes] = await Promise.all([
    supabase.from("lancamentos").select("topic_id, created_at").gte("created_at", since.toISOString()),
    supabase.from("study_sessions").select("duration_minutes, session_date").gte("session_date", since.toISOString().split("T")[0]),
  ]);
  if (lancRes.error) throw lancRes.error;
  if (sessionRes.error) throw sessionRes.error;
  const lancRows = (lancRes.data as { topic_id: string; created_at: string }[]) ?? [];
  const firstTouchByTopic = new Map<string, string>();
  for (const r of lancRows) { const existing = firstTouchByTopic.get(r.topic_id); if (!existing || r.created_at < existing) firstTouchByTopic.set(r.topic_id, r.created_at); }
  const newTopicCount = firstTouchByTopic.size;
  if (newTopicCount === 0) return 30;
  const sessionRows = (sessionRes.data as { duration_minutes: number; session_date: string }[]) ?? [];
  const totalMinutes = sessionRows.reduce((sum, r) => sum + r.duration_minutes, 0);
  if (totalMinutes === 0) return 30;
  return totalMinutes / newTopicCount;
}

// ---------------------------------------------------------------------------
// Bloco 5: load skip states for desempenho view
// ---------------------------------------------------------------------------

export async function loadSkipStates(): Promise<SkipStateRow[]> {
  const { data, error } = await supabase.from("discipline_skip_state").select("*").order("discipline_id", { ascending: true });
  if (error) throw error;
  return (data as SkipStateRow[]) ?? [];
}
