// src/lib/ai-client.ts
// Cliente de IA para geração de material de estudo (resumos, questões, flashcards).
// Reaproveita cache via upsertAiMaterial/fetchAiMaterial.

import { supabase } from "./supabase";
import type { FlashcardPair } from "./ai.functions";

export type AIKind = "leiseca" | "resumo" | "questoes" | "flashcards";

export interface AiMaterial {
  id: string;
  kind: AIKind;
  topic_id: string;
  discipline_id: string;
  content: string;
  created_at: string;
}

interface AiMaterialRow {
  id: string;
  kind: string;
  topic_id: string;
  discipline_id: string;
  content: string;
  created_at: string;
}

const TABLE = "ai_material";

export async function fetchAiMaterial(
  kind: AIKind,
  topicId: string,
): Promise<AiMaterial | null> {
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .eq("kind", kind)
    .eq("topic_id", topicId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const row = data as AiMaterialRow;
  return {
    id: row.id,
    kind: row.kind as AIKind,
    topic_id: row.topic_id,
    discipline_id: row.discipline_id,
    content: row.content,
    created_at: row.created_at,
  };
}

export async function upsertAiMaterial(
  kind: AIKind,
  topicId: string,
  disciplineId: string,
  content: string,
): Promise<AiMaterial> {
  const { data, error } = await supabase
    .from(TABLE)
    .upsert(
      {
        kind,
        topic_id: topicId,
        discipline_id: disciplineId,
        content,
      },
      { onConflict: "kind,topic_id" },
    )
    .select("*")
    .single();

  if (error) throw error;
  const row = data as AiMaterialRow;
  return {
    id: row.id,
    kind: row.kind as AIKind,
    topic_id: row.topic_id,
    discipline_id: row.discipline_id,
    content: row.content,
    created_at: row.created_at,
  };
}

// ---------------------------------------------------------------------------
// AI generation — flashcards
// ---------------------------------------------------------------------------

export interface GenerateFlashcardsResult {
  pairs: FlashcardPair[];
  cached: boolean;
}

export async function generateFlashcards(
  topicId: string,
  disciplineId: string,
  topicTitle: string,
): Promise<GenerateFlashcardsResult> {
  const cached = await fetchAiMaterial("flashcards", topicId);
  if (cached) {
    try {
      const parsed = JSON.parse(cached.content) as FlashcardPair[];
      if (Array.isArray(parsed) && parsed.length > 0) {
        return { pairs: parsed, cached: true };
      }
    } catch {
      // fall through to generation
    }
  }

  const { generateFlashcardPairs } = await import("./ai.functions");
  const pairs = await generateFlashcardPairs(topicTitle, disciplineId);
  await upsertAiMaterial("flashcards", topicId, disciplineId, JSON.stringify(pairs));
  return { pairs, cached: false };
}
