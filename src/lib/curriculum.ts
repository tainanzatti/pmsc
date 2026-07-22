import { supabase } from "./supabase";

export interface Discipline {
  id: string;
  name: string;
  icon: string;
  color: string;
  question_count: number;
  sort_order: number;
  is_discursive: boolean;
  created_at: string;
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

export const FIBONACCI_SCALE = [1, 2, 3, 5, 8, 13, 21, 34, 55, 89] as const;

export const FIBONACCI_LABELS: Record<number, string> = {
  89: "Extremamente cobrado",
  55: "Muito cobrado",
  34: "Bastante cobrado",
  21: "Cobrado com frequência",
  13: "Importância média",
  8: "Média",
  5: "Baixa",
  3: "Muito baixa",
  2: "Rara",
  1: "Quase nunca cobrado",
};

export async function loadDisciplines(): Promise<Discipline[]> {
  const { data, error } = await supabase
    .from("disciplines")
    .select("*")
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return (data || []) as Discipline[];
}

export async function loadTopicsByDiscipline(disciplineId: string): Promise<Topic[]> {
  const { data, error } = await supabase
    .from("topics")
    .select("*")
    .eq("discipline_id", disciplineId)
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return (data || []) as Topic[];
}

export async function loadAllTopics(): Promise<Topic[]> {
  const { data, error } = await supabase
    .from("topics")
    .select("*")
    .order("discipline_id", { ascending: true })
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return (data || []) as Topic[];
}

export function getMasteryScore(correct: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((correct / total) * 100);
}

export function getSkipMultiplier(skippedCount: number): number {
  if (skippedCount === 0) return 1;
  return Math.max(0.5, 1 - skippedCount * 0.1);
}

export function getFibonacciLabel(weight: number): string {
  return FIBONACCI_LABELS[weight] || "Importância média";
}

export function getDisciplineWeight(discipline: Discipline): number {
  return discipline.question_count;
}

export function getTotalExamQuestions(disciplines: Discipline[]): number {
  return disciplines
    .filter((d) => !d.is_discursive)
    .reduce((sum, d) => sum + d.question_count, 0);
}
