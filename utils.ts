import { generateStudyMaterial } from './ai.functions'

export type AIKind = 'leiseca' | 'resumo' | 'questoes' | 'briefing'

export async function generateAI(payload: {
  kind: AIKind
  discName?: string
  topicName?: string
  summary?: string
}): Promise<string> {
  const result = await generateStudyMaterial({ data: payload })
  if ('error' in result) throw new Error(result.error)
  return result.text
}
