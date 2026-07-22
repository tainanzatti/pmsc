import { supabase } from "./supabase";
import { getLeague } from "./xp";

export interface Profile {
  id: string;
  full_name: string;
  apelido: string | null;
  email: string;
  birth_date: string | null;
  cpf: string | null;
  telefone: string | null;
  theme_preference: string;
  created_at: string;
  xp: number;
  league: string;
  current_streak: number;
  longest_streak: number;
  last_study_date: string | null;
  sidebar_collapsed: boolean;
}

export interface Topic {
  id: string;
  discipline_id: string;
  title: string;
  fibonacci_weight: number;
  sort_order: number;
  parent_id: string | null;
  created_at: string;
}

export interface Lancamento {
  id: string;
  topic_id: string | null;
  discipline_id: string;
  mastered: number;
  cycle_number: number | null;
  user_id: string;
  created_at: string;
  total_questions: number;
  correct_count: number;
  wrong_count: number;
  accuracy: number;
  study_date: string;
  study_time: string;
  notes: string | null;
  xp_earned: number;
}

export interface Flashcard {
  id: string;
  user_id: string;
  disciplina_id: string;
  topico_id: string | null;
  pergunta: string;
  resposta: string;
  caixa: number;
  proxima_revisao: string;
  created_at: string;
  updated_at: string;
}

export interface Redacao {
  id: string;
  user_id: string;
  tema: string;
  texto: string;
  nota: number | null;
  feedback_json: { feedback?: string; competencias?: Record<string, number> } | null;
  criado_em: string;
}

export interface StudySession {
  id: string;
  user_id: string;
  discipline_id: string;
  topic_id: string | null;
  duration_minutes: number;
  session_date: string;
  created_at: string;
}

export interface SkipState {
  discipline_id: string;
  skip_count: number;
  urgency_multiplier: number;
  user_id: string;
  updated_at: string;
}

export interface AIMaterial {
  id: string;
  kind: string;
  topic_id: string | null;
  discipline_id: string;
  content: string;
  user_id: string;
  created_at: string;
}

export interface RankingUser {
  id: string;
  full_name: string;
  apelido: string | null;
  xp: number;
  league: string;
  current_streak: number;
  longest_streak: number;
  total_questions: number;
  total_correct: number;
  total_study_minutes: number;
  accuracy: number;
  disciplines_completed: number;
  created_at: string;
}

export async function loadTopics(): Promise<Topic[]> {
  const { data, error } = await supabase
    .from("topics")
    .select("*")
    .order("discipline_id", { ascending: true })
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return (data || []) as Topic[];
}

export async function loadLancamentos(userId: string): Promise<Lancamento[]> {
  const { data, error } = await supabase
    .from("lancamentos")
    .select("*")
    .eq("user_id", userId)
    .order("study_date", { ascending: false })
    .order("study_time", { ascending: false });
  if (error) throw error;
  return (data || []) as Lancamento[];
}

export async function loadFlashcardsDue(userId: string): Promise<Flashcard[]> {
  const today = new Date().toISOString().split("T")[0];
  const { data, error } = await supabase
    .from("flashcards")
    .select("*")
    .eq("user_id", userId)
    .lte("proxima_revisao", today)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data || []) as Flashcard[];
}

export async function loadAllFlashcards(userId: string): Promise<Flashcard[]> {
  const { data, error } = await supabase
    .from("flashcards")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data || []) as Flashcard[];
}

export async function countDueFlashcards(userId: string): Promise<number> {
  const today = new Date().toISOString().split("T")[0];
  const { count, error } = await supabase
    .from("flashcards")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .lte("proxima_revisao", today);
  if (error) throw error;
  return count || 0;
}

export async function updateFlashcardBox(
  flashcardId: string,
  box: number,
  known: boolean
): Promise<void> {
  const maxBox = 5;
  const nextBox = known ? Math.min(box + 1, maxBox) : 1;
  const intervals = [1, 2, 4, 8, 16];
  const days = intervals[Math.min(nextBox - 1, intervals.length - 1)];
  const nextReview = new Date();
  nextReview.setDate(nextReview.getDate() + days);
  const reviewDate = nextReview.toISOString().split("T")[0];

  const { error } = await supabase
    .from("flashcards")
    .update({ caixa: nextBox, proxima_revisao: reviewDate, updated_at: new Date().toISOString() })
    .eq("id", flashcardId);
  if (error) throw error;
}

export async function loadRedacoes(userId: string): Promise<Redacao[]> {
  const { data, error } = await supabase
    .from("redacoes")
    .select("*")
    .eq("user_id", userId)
    .order("criado_em", { ascending: false });
  if (error) throw error;
  return (data || []) as Redacao[];
}

export async function saveRedacao(
  userId: string,
  tema: string,
  texto: string
): Promise<Redacao> {
  const { data, error } = await supabase
    .from("redacoes")
    .insert({ user_id: userId, tema, texto })
    .select()
    .single();
  if (error) throw error;
  return data as Redacao;
}

export async function updateRedacaoScore(
  redacaoId: string,
  nota: number,
  feedback: string
): Promise<void> {
  const { error } = await supabase
    .from("redacoes")
    .update({ nota, feedback_json: { feedback } })
    .eq("id", redacaoId);
  if (error) throw error;
}

export async function loadStudySessions(userId: string): Promise<StudySession[]> {
  const { data, error } = await supabase
    .from("study_sessions")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []) as StudySession[];
}

export async function createStudySession(
  userId: string,
  discipline: string,
  topicId: string | null,
  durationMinutes: number
): Promise<void> {
  const { error } = await supabase.from("study_sessions").insert({
    user_id: userId,
    discipline_id: discipline,
    topic_id: topicId,
    duration_minutes: durationMinutes,
  });
  if (error) throw error;
}

export async function loadSkipStates(userId: string): Promise<Record<string, SkipState>> {
  const { data, error } = await supabase
    .from("discipline_skip_state")
    .select("*")
    .eq("user_id", userId);
  if (error) throw error;
  const result: Record<string, SkipState> = {};
  for (const row of (data || []) as SkipState[]) {
    result[row.discipline_id] = row;
  }
  return result;
}

export async function upsertSkipState(
  userId: string,
  discipline: string,
  skipCount: number,
  urgencyMultiplier: number
): Promise<void> {
  const { error } = await supabase
    .from("discipline_skip_state")
    .upsert(
      {
        user_id: userId,
        discipline_id: discipline,
        skip_count: skipCount,
        urgency_multiplier: urgencyMultiplier,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "discipline_id,user_id" }
    );
  if (error) throw error;
}

export async function loadAIMaterial(
  userId: string,
  discipline: string,
  kind: string
): Promise<AIMaterial | null> {
  const { data, error } = await supabase
    .from("ai_material")
    .select("*")
    .eq("user_id", userId)
    .eq("discipline_id", discipline)
    .eq("kind", kind)
    .maybeSingle();
  if (error) throw error;
  return data as AIMaterial | null;
}

export async function createAIMaterial(
  userId: string,
  discipline: string,
  kind: string,
  content: string,
  topicId: string | null
): Promise<AIMaterial> {
  const { data, error } = await supabase
    .from("ai_material")
    .insert({
      user_id: userId,
      discipline_id: discipline,
      kind,
      content,
      topic_id: topicId,
    })
    .select()
    .single();
  if (error) throw error;
  return data as AIMaterial;
}

export async function createLancamento(
  userId: string,
  discipline: string,
  mastered: number,
  topicId: string | null
): Promise<void> {
  const { error } = await supabase.from("lancamentos").insert({
    user_id: userId,
    discipline_id: discipline,
    mastered,
    topic_id: topicId,
  });
  if (error) throw error;
}

export interface LancamentoInput {
  discipline_id: string;
  topic_id: string | null;
  total_questions: number;
  correct_count: number;
  wrong_count: number;
  accuracy: number;
  study_date: string;
  notes: string | null;
  xp_earned: number;
}

export async function saveLancamento(
  userId: string,
  input: LancamentoInput
): Promise<Lancamento> {
  const { data, error } = await supabase
    .from("lancamentos")
    .insert({
      user_id: userId,
      discipline_id: input.discipline_id,
      topic_id: input.topic_id,
      total_questions: input.total_questions,
      correct_count: input.correct_count,
      wrong_count: input.wrong_count,
      accuracy: input.accuracy,
      mastered: input.accuracy,
      study_date: input.study_date,
      study_time: new Date().toTimeString().split(" ")[0],
      notes: input.notes,
      xp_earned: input.xp_earned,
    })
    .select()
    .single();
  if (error) throw error;
  return data as Lancamento;
}

export async function updateLancamento(
  lancamentoId: string,
  input: Partial<LancamentoInput>
): Promise<void> {
  const { error } = await supabase
    .from("lancamentos")
    .update(input)
    .eq("id", lancamentoId);
  if (error) throw error;
}

export async function deleteLancamento(lancamentoId: string): Promise<void> {
  const { error } = await supabase
    .from("lancamentos")
    .delete()
    .eq("id", lancamentoId);
  if (error) throw error;
}

export async function updateProfileXP(
  userId: string,
  xpToAdd: number,
  studyDate: string
): Promise<{ newXP: number; newStreak: number; newLeague: string; longestStreak: number }> {
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("xp, current_streak, longest_streak, last_study_date")
    .eq("id", userId)
    .maybeSingle();
  if (profileError) throw profileError;
  if (!profile) throw new Error("Profile not found");

  const oldXP = profile.xp || 0;
  const newXP = oldXP + xpToAdd;

  const lastDate = profile.last_study_date;
  const today = new Date(studyDate);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  let newStreak = profile.current_streak || 0;
  if (lastDate) {
    const last = new Date(lastDate);
    const diffDays = Math.round((today.getTime() - last.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 1) {
      newStreak = (profile.current_streak || 0) + 1;
    } else if (diffDays === 0) {
      // same day, keep streak
    } else {
      newStreak = 1;
    }
  } else {
    newStreak = 1;
  }

  const longestStreak = Math.max(profile.longest_streak || 0, newStreak);

  const newLeague = getLeague(newXP).name;

  const { error: updateError } = await supabase
    .from("profiles")
    .update({
      xp: newXP,
      current_streak: newStreak,
      longest_streak: longestStreak,
      last_study_date: studyDate,
      league: newLeague,
    })
    .eq("id", userId);
  if (updateError) throw updateError;

  return { newXP, newStreak, newLeague, longestStreak };
}

export async function recalculateProfileXP(userId: string): Promise<void> {
  const { data: lancamentos, error } = await supabase
    .from("lancamentos")
    .select("xp_earned, study_date")
    .eq("user_id", userId);
  if (error) throw error;

  const totalXP = (lancamentos || []).reduce((sum, l) => sum + (l.xp_earned || 0), 0);
  const studyDates = [...new Set((lancamentos || []).map((l) => l.study_date))].sort();

  let longestStreak = 0;
  let currentStreak = 0;
  let lastDate: Date | null = null;
  for (const dateStr of studyDates) {
    const d = new Date(dateStr);
    if (lastDate) {
      const diff = Math.round((d.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
      if (diff === 1) {
        currentStreak++;
      } else if (diff > 1) {
        currentStreak = 1;
      }
    } else {
      currentStreak = 1;
    }
    longestStreak = Math.max(longestStreak, currentStreak);
    lastDate = d;
  }

  const today = new Date().toISOString().split("T")[0];
  const lastStudyDate = studyDates.length > 0 ? studyDates[studyDates.length - 1] : null;

  let finalStreak = currentStreak;
  if (lastStudyDate) {
    const last = new Date(lastStudyDate);
    const now = new Date(today);
    const diff = Math.round((now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24));
    if (diff > 1) finalStreak = 0;
  }

  const league = getLeague(totalXP).name;

  const { error: updateError } = await supabase
    .from("profiles")
    .update({
      xp: totalXP,
      current_streak: finalStreak,
      longest_streak: longestStreak,
      last_study_date: lastStudyDate,
      league,
    })
    .eq("id", userId);
  if (updateError) throw updateError;
}

export async function loadRanking(period: "all" | "week" | "month"): Promise<RankingUser[]> {
  let dateFilter: string | null = null;
  if (period === "week") {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    dateFilter = d.toISOString().split("T")[0];
  } else if (period === "month") {
    const d = new Date();
    d.setDate(1);
    dateFilter = d.toISOString().split("T")[0];
  }

  let lancamentoQuery = supabase
    .from("lancamentos")
    .select("user_id, total_questions, correct_count, xp_earned, study_date");
  if (dateFilter) {
    lancamentoQuery = lancamentoQuery.gte("study_date", dateFilter);
  }
  const { data: lancamentoData, error: lancamentoError } = await lancamentoQuery;
  if (lancamentoError) throw lancamentoError;

  let sessionQuery = supabase
    .from("study_sessions")
    .select("user_id, duration_minutes, session_date");
  if (dateFilter) {
    sessionQuery = sessionQuery.gte("session_date", dateFilter);
  }
  const { data: sessionData, error: sessionError } = await sessionQuery;
  if (sessionError) throw sessionError;

  const { data: profileData, error: profileError } = await supabase
    .from("profiles")
    .select("id, full_name, apelido, xp, league, current_streak, longest_streak, created_at");
  if (profileError) throw profileError;

  const userMap: Record<string, RankingUser> = {};
  for (const p of (profileData || [])) {
    userMap[p.id] = {
      id: p.id,
      full_name: p.full_name || "—",
      apelido: p.apelido,
      xp: period === "all" ? (p.xp || 0) : 0,
      league: p.league || "Bronze",
      current_streak: period === "all" ? (p.current_streak || 0) : 0,
      longest_streak: p.longest_streak || 0,
      total_questions: 0,
      total_correct: 0,
      total_study_minutes: 0,
      accuracy: 0,
      disciplines_completed: 0,
      created_at: p.created_at,
    };
  }

  for (const l of (lancamentoData || [])) {
    const u = userMap[l.user_id];
    if (!u) continue;
    u.total_questions += l.total_questions || 0;
    u.total_correct += l.correct_count || 0;
    if (period !== "all") u.xp += l.xp_earned || 0;
  }

  for (const s of (sessionData || [])) {
    const u = userMap[s.user_id];
    if (!u) continue;
    u.total_study_minutes += s.duration_minutes || 0;
  }

  for (const u of Object.values(userMap)) {
    u.accuracy = u.total_questions > 0 ? Math.round((u.total_correct / u.total_questions) * 100) : 0;
  }

  const ranking = Object.values(userMap)
    .filter((u) => u.total_questions > 0 || u.xp > 0 || u.total_study_minutes > 0)
    .sort((a, b) => b.xp - a.xp);

  return ranking;
}

export async function updateSidebarCollapsed(userId: string, collapsed: boolean): Promise<void> {
  const { error } = await supabase
    .from("profiles")
    .update({ sidebar_collapsed: collapsed })
    .eq("id", userId);
  if (error) throw error;
}

export async function resetUserProgress(): Promise<void> {
  const { error } = await supabase.rpc("reset_user_progress");
  if (error) throw error;
}
