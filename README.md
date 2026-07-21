import { supabase } from './supabase'
import type { Lancamento } from './curriculum'
import type { Json } from '@/integrations/supabase/types'

// ============================================================================
// Camada central de acesso ao banco (Lovable Cloud).
// Toda leitura/escrita de dados do usuário passa por aqui.
// ============================================================================

// ---------- Lançamentos (sessões de estudo / questões respondidas) ----------

export async function fetchLancamentos(userId: string): Promise<Lancamento[]> {
  const { data, error } = await supabase
    .from('lancamentos')
    .select('id, disciplina_id, topico_id, quantidade, acertos, minutos, data')
    .eq('user_id', userId)
    .order('data', { ascending: true })

  if (error) {
    console.error('Erro ao buscar lançamentos:', error)
    return []
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    disciplinaId: row.disciplina_id,
    topicoId: row.topico_id,
    quantidade: row.quantidade,
    acertos: row.acertos,
    minutos: row.minutos,
    data: row.data,
  }))
}

export async function insertLancamentos(
  userId: string,
  entries: Omit<Lancamento, 'id'>[]
): Promise<Lancamento[]> {
  const rows = entries.map((e) => ({
    user_id: userId,
    disciplina_id: e.disciplinaId,
    topico_id: e.topicoId,
    quantidade: e.quantidade,
    acertos: e.acertos,
    minutos: e.minutos,
    data: e.data,
  }))

  const { data, error } = await supabase.from('lancamentos').insert(rows).select()
  if (error) throw error

  return (data ?? []).map((row) => ({
    id: row.id,
    disciplinaId: row.disciplina_id,
    topicoId: row.topico_id,
    quantidade: row.quantidade,
    acertos: row.acertos,
    minutos: row.minutos,
    data: row.data,
  }))
}

export async function deleteLancamento(id: string): Promise<void> {
  const { error } = await supabase.from('lancamentos').delete().eq('id', id)
  if (error) throw error
}

export async function deleteAllLancamentos(userId: string): Promise<void> {
  const { error } = await supabase.from('lancamentos').delete().eq('user_id', userId)
  if (error) throw error
}

// ---------- Links de material ----------

export type SavedLink = { id: string; url: string; createdAt: number }

export async function fetchMaterialLinks(
  userId: string,
  discId: string,
  topicId: string
): Promise<SavedLink[]> {
  const { data, error } = await supabase
    .from('material_links')
    .select('id, url, created_at')
    .eq('user_id', userId)
    .eq('disciplina_id', discId)
    .eq('topico_id', topicId)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Erro ao buscar links:', error)
    return []
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    url: row.url,
    createdAt: new Date(row.created_at).getTime(),
  }))
}

export async function insertMaterialLink(
  userId: string,
  discId: string,
  topicId: string,
  url: string
): Promise<SavedLink> {
  const { data, error } = await supabase
    .from('material_links')
    .insert({ user_id: userId, disciplina_id: discId, topico_id: topicId, url })
    .select()
    .single()

  if (error) throw error

  return { id: data.id, url: data.url, createdAt: new Date(data.created_at).getTime() }
}

export async function deleteMaterialLink(id: string): Promise<void> {
  const { error } = await supabase.from('material_links').delete().eq('id', id)
  if (error) throw error
}

// ---------- Materiais gerados por IA (lei seca, resumo, questões) ----------

export type AiMaterialKind = 'leiseca' | 'resumo' | 'questoes'

export async function fetchAiMaterial(
  userId: string,
  discId: string,
  topicId: string,
  kind: AiMaterialKind
): Promise<string | null> {
  const { data, error } = await supabase
    .from('ai_materials')
    .select('content')
    .eq('user_id', userId)
    .eq('disciplina_id', discId)
    .eq('topico_id', topicId)
    .eq('kind', kind)
    .maybeSingle()

  if (error) {
    console.error('Erro ao buscar material de IA:', error)
    return null
  }
  return data?.content ?? null
}

export async function upsertAiMaterial(
  userId: string,
  discId: string,
  topicId: string,
  kind: AiMaterialKind,
  content: string
): Promise<void> {
  const { error } = await supabase.from('ai_materials').upsert(
    {
      user_id: userId,
      disciplina_id: discId,
      topico_id: topicId,
      kind,
      content,
    },
    { onConflict: 'user_id,disciplina_id,topico_id,kind' }
  )
  if (error) console.error('Erro ao salvar material de IA:', error)
}

// ---------- Briefing diário ----------

export async function fetchDailyBriefing(
  userId: string,
  date: string
): Promise<string | null> {
  const { data, error } = await supabase
    .from('daily_briefings')
    .select('content')
    .eq('user_id', userId)
    .eq('briefing_date', date)
    .maybeSingle()

  if (error) {
    console.error('Erro ao buscar briefing:', error)
    return null
  }
  return data?.content ?? null
}

export async function upsertDailyBriefing(
  userId: string,
  date: string,
  content: string
): Promise<void> {
  const { error } = await supabase.from('daily_briefings').upsert(
    { user_id: userId, briefing_date: date, content },
    { onConflict: 'user_id,briefing_date' }
  )
  if (error) console.error('Erro ao salvar briefing:', error)
}

// ---------- Configurações do usuário ----------

export async function fetchUserSettings(
  userId: string
): Promise<Record<string, unknown>> {
  const { data, error } = await supabase
    .from('user_settings')
    .select('settings')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) {
    console.error('Erro ao buscar configurações:', error)
    return {}
  }
  return (data?.settings as Record<string, unknown>) ?? {}
}

export async function upsertUserSettings(
  userId: string,
  settings: Record<string, unknown>
): Promise<void> {
  const { error } = await supabase
    .from('user_settings')
    .upsert({ user_id: userId, settings: settings as Json }, { onConflict: 'user_id' })
  if (error) console.error('Erro ao salvar configurações:', error)
}
