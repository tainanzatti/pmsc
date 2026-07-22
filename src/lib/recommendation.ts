import type { Discipline, Topic } from "./curriculum";
import type { SkipState } from "./db";
import { getFibonacciLabel } from "./curriculum";

export interface TopicProgress {
  id: string;
  user_id: string;
  topic_id: string;
  discipline_id: string;
  status: "pending" | "in_progress" | "completed";
  mastery: number;
  questions_total: number;
  questions_correct: number;
  last_studied_at: string | null;
  study_count: number;
  created_at: string;
  updated_at: string;
}

export interface TopicRecommendation {
  topic: Topic;
  discipline: Discipline;
  priority: number;
  mastery: number;
  questionsTotal: number;
  questionsCorrect: number;
  accuracy: number;
  lastStudiedAt: string | null;
  daysSinceLastStudy: number | null;
  estimatedMinutes: number;
  reasons: string[];
  subtopic: Topic | null;
}

export interface DisciplineRecommendation {
  discipline: Discipline;
  priority: number;
  topicRecommendation: TopicRecommendation | null;
  avgMastery: number;
  totalQuestions: number;
  pendingTopics: number;
  completedTopics: number;
  totalTopics: number;
  daysSinceLastStudy: number | null;
  reasons: string[];
}

const RECOMMENDATION_WEIGHTS = {
  EXAM_WEIGHT: 30,
  FIBONACCI_WEIGHT: 25,
  MASTERY_WEIGHT: 20,
  TIME_SINCE_STUDY: 15,
  PENDING_TOPICS: 5,
  ERROR_RATE: 3,
  STUDY_FREQUENCY: 1,
  EXAM_PROXIMITY: 1,
} as const;

const MAX_PRIORITY = 100;

function daysBetween(dateStr: string | null, now: Date = new Date()): number | null {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  return Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
}

function normalize(value: number, max: number): number {
  if (max === 0) return 0;
  return Math.min(1, Math.max(0, value / max));
}

export function calculateTopicRecommendation(
  topic: Topic,
  discipline: Discipline,
  progress: TopicProgress | null,
  allTopics: Topic[],
  examDate: string | null,
  now: Date = new Date()
): TopicRecommendation {
  let priority = 0;
  const reasons: string[] = [];

  // 1. Exam weight (question_count) — 30%
  const maxQuestions = 120;
  const examScore = normalize(discipline.question_count, maxQuestions);
  priority += examScore * RECOMMENDATION_WEIGHTS.EXAM_WEIGHT;
  if (discipline.question_count >= 20) {
    reasons.push(`Disciplina de alto peso na prova (${discipline.question_count} questões)`);
  }

  // 2. Fibonacci weight — 25%
  const fibScore = normalize(topic.fibonacci_weight, 89);
  priority += fibScore * RECOMMENDATION_WEIGHTS.FIBONACCI_WEIGHT;
  if (topic.fibonacci_weight >= 55) {
    reasons.push(`Tema extremamente cobrado pela AOCP (${getFibonacciLabel(topic.fibonacci_weight)})`);
  } else if (topic.fibonacci_weight >= 34) {
    reasons.push(`Tema muito cobrado pela AOCP (${getFibonacciLabel(topic.fibonacci_weight)})`);
  } else if (topic.fibonacci_weight >= 21) {
    reasons.push(`Tema cobrado com frequência pela AOCP`);
  }

  // 3. Mastery (lower mastery = higher priority) — 20%
  const mastery = progress?.mastery ?? 0;
  const masteryScore = 1 - normalize(mastery, 100);
  priority += masteryScore * RECOMMENDATION_WEIGHTS.MASTERY_WEIGHT;
  if (mastery < 50) {
    reasons.push(`Desempenho baixo: ${mastery}% de domínio`);
  } else if (mastery < 70) {
    reasons.push(`Desempenho médio: ${mastery}% de domínio, precisa reforço`);
  }

  // 4. Time since last study — 15%
  const daysSince = daysBetween(progress?.last_studied_at ?? null, now);
  const timeScore = daysSince !== null ? normalize(daysSince, 30) : 1;
  priority += timeScore * RECOMMENDATION_WEIGHTS.TIME_SINCE_STUDY;
  if (daysSince === null) {
    reasons.push(`Ainda não revisado`);
  } else if (daysSince >= 14) {
    reasons.push(`Última revisão há ${daysSince} dias — risco de esquecimento`);
  } else if (daysSince >= 7) {
    reasons.push(`Última revisão há ${daysSince} dias`);
  }

  // 5. Pending topics — 5%
  if (progress?.status === "pending" || !progress) {
    priority += RECOMMENDATION_WEIGHTS.PENDING_TOPICS;
    if (!progress) reasons.push(`Tópico nunca estudado`);
  }

  // 6. Error rate — 3%
  const questionsTotal = progress?.questions_total ?? 0;
  const questionsCorrect = progress?.questions_correct ?? 0;
  const errorRate = questionsTotal > 0 ? (questionsTotal - questionsCorrect) / questionsTotal : 0;
  const errorScore = normalize(errorRate, 1);
  priority += errorScore * RECOMMENDATION_WEIGHTS.ERROR_RATE;
  if (errorRate > 0.4 && questionsTotal > 5) {
    reasons.push(`Taxa de erros alta: ${Math.round(errorRate * 100)}%`);
  }

  // 7. Study frequency — 1%
  const studyCount = progress?.study_count ?? 0;
  const freqScore = 1 - normalize(studyCount, 10);
  priority += freqScore * RECOMMENDATION_WEIGHTS.STUDY_FREQUENCY;

  // 8. Exam proximity — 1%
  if (examDate) {
    const examDays = daysBetween(examDate, now);
    if (examDays !== null && examDays > 0) {
      const proximityScore = 1 - normalize(examDays, 180);
      priority += proximityScore * RECOMMENDATION_WEIGHTS.EXAM_PROXIMITY;
      if (examDays <= 30) {
        reasons.push(`Prova em ${examDays} dias — priorize temas de maior peso`);
      }
    }
  }

  // Find subtopic (child topic)
  const subtopic = allTopics.find((t) => t.parent_id === topic.id && t.fibonacci_weight >= 21) || null;

  // Estimated study time
  const baseMinutes = 20;
  const fibBonus = Math.round((topic.fibonacci_weight / 89) * 30);
  const masteryBonus = Math.round((1 - mastery / 100) * 20);
  const estimatedMinutes = baseMinutes + fibBonus + masteryBonus;

  const accuracy = questionsTotal > 0 ? Math.round((questionsCorrect / questionsTotal) * 100) : 0;

  const finalPriority = Math.min(MAX_PRIORITY, Math.round(priority));

  if (reasons.length === 0) {
    reasons.push("Recomendado para revisão e manutenção do conhecimento");
  }

  return {
    topic,
    discipline,
    priority: finalPriority,
    mastery,
    questionsTotal,
    questionsCorrect,
    accuracy,
    lastStudiedAt: progress?.last_studied_at ?? null,
    daysSinceLastStudy: daysSince,
    estimatedMinutes,
    reasons,
    subtopic,
  };
}

export function calculateDisciplineRecommendation(
  discipline: Discipline,
  topics: Topic[],
  progressByTopic: Record<string, TopicProgress>,
  allTopics: Topic[],
  examDate: string | null,
  now: Date = new Date()
): DisciplineRecommendation {
  const discTopics = topics.filter((t) => t.discipline_id === discipline.id && t.parent_id === null);
  const childTopics = topics.filter((t) => t.discipline_id === discipline.id && t.parent_id !== null);
  const allDiscTopics = [...discTopics, ...childTopics];

  let topicRecs: TopicRecommendation[] = discTopics.map((topic) => {
    const progress = progressByTopic[topic.id] || null;
    return calculateTopicRecommendation(topic, discipline, progress, allTopics, examDate, now);
  });

  // Also consider child topics for recommendation
  const childRecs: TopicRecommendation[] = childTopics.map((topic) => {
    const progress = progressByTopic[topic.id] || null;
    return calculateTopicRecommendation(topic, discipline, progress, allTopics, examDate, now);
  });

  // Pick the highest priority topic (from both parents and children)
  const allRecs = [...topicRecs, ...childRecs].sort((a, b) => b.priority - a.priority);
  const bestTopicRec = allRecs[0] || null;

  // Discipline-level stats
  const completedTopics = allDiscTopics.filter((t) => progressByTopic[t.id]?.status === "completed").length;
  const pendingTopics = allDiscTopics.filter((t) => !progressByTopic[t.id] || progressByTopic[t.id]?.status === "pending").length;
  const totalQuestions = allDiscTopics.reduce((sum, t) => sum + (progressByTopic[t.id]?.questions_total || 0), 0);
  const studiedTopics = allDiscTopics.filter((t) => progressByTopic[t.id]);
  const avgMastery = studiedTopics.length > 0
    ? Math.round(studiedTopics.reduce((sum, t) => sum + (progressByTopic[t.id]?.mastery || 0), 0) / studiedTopics.length)
    : 0;

  // Last study date for the discipline
  const lastStudyDates = allDiscTopics
    .map((t) => progressByTopic[t.id]?.last_studied_at)
    .filter((d): d is string => d !== null && d !== undefined)
    .sort((a, b) => b.localeCompare(a));
  const lastStudyDate = lastStudyDates[0] || null;
  const daysSince = daysBetween(lastStudyDate, now);

  // Discipline priority: use the best topic's priority
  const priority = bestTopicRec?.priority ?? 0;

  const reasons: string[] = [];
  if (discipline.question_count >= 20) {
    reasons.push(`Alta prioridade no edital (${discipline.question_count} questões)`);
  } else if (discipline.question_count >= 10) {
    reasons.push(`Peso médio no edital (${discipline.question_count} questões)`);
  }
  if (avgMastery < 50 && studiedTopics.length > 0) {
    reasons.push(`Domínio baixo: ${avgMastery}%`);
  }
  if (pendingTopics > 0) {
    reasons.push(`${pendingTopics} tópicos pendentes`);
  }
  if (daysSince !== null && daysSince >= 7) {
    reasons.push(`Sem estudar há ${daysSince} dias`);
  } else if (daysSince === null) {
    reasons.push(`Nunca estudada`);
  }

  return {
    discipline,
    priority,
    topicRecommendation: bestTopicRec,
    avgMastery,
    totalQuestions,
    pendingTopics,
    completedTopics,
    totalTopics: allDiscTopics.length,
    daysSinceLastStudy: daysSince,
    reasons,
  };
}

export function getRecommendedDiscipline(
  disciplines: Discipline[],
  topics: Topic[],
  progressByTopic: Record<string, TopicProgress>,
  skipStates: Record<string, SkipState>,
  examDate: string | null,
  now: Date = new Date()
): DisciplineRecommendation | null {
  if (disciplines.length === 0) return null;

  const recs = disciplines.map((disc) => {
    const rec = calculateDisciplineRecommendation(disc, topics, progressByTopic, topics, examDate, now);
    // Apply skip penalty: each skip reduces effective priority by 20%
    const skipCount = skipStates[disc.id]?.skip_count || 0;
    if (skipCount > 0) {
      rec.priority = Math.round(rec.priority * Math.pow(0.8, skipCount));
    }
    return rec;
  });

  recs.sort((a, b) => b.priority - a.priority);
  return recs[0] || null;
}

export function getStudyQueue(
  disciplines: Discipline[],
  topics: Topic[],
  progressByTopic: Record<string, TopicProgress>,
  skipStates: Record<string, SkipState>,
  examDate: string | null,
  now: Date = new Date()
): DisciplineRecommendation[] {
  if (disciplines.length === 0) return [];

  const recs = disciplines.map((disc) => {
    const rec = calculateDisciplineRecommendation(disc, topics, progressByTopic, topics, examDate, now);
    const skipCount = skipStates[disc.id]?.skip_count || 0;
    if (skipCount > 0) {
      rec.priority = Math.round(rec.priority * Math.pow(0.8, skipCount));
    }
    return rec;
  });

  recs.sort((a, b) => b.priority - a.priority);
  return recs;
}

export function formatDaysSince(days: number | null): string {
  if (days === null) return "Nunca estudado";
  if (days === 0) return "Estudado hoje";
  if (days === 1) return "Estudado há 1 dia";
  return `Estudado há ${days} dias`;
}
