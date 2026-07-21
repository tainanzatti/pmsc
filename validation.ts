import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'

const inputSchema = z.object({
  kind: z.enum(['leiseca', 'resumo', 'questoes', 'briefing']),
  discName: z.string().optional(),
  topicName: z.string().optional(),
  summary: z.string().optional(),
})

type Body = z.infer<typeof inputSchema>

function buildPrompt(body: Body): string {
  const { kind, discName = '', topicName = '', summary = '' } = body
  switch (kind) {
    case 'leiseca':
      return `Você é um assistente jurídico para o concurso de Soldado da PM de Santa Catarina (banca Instituto AOCP). Tópico: "${topicName}" (disciplina: ${discName}).\n\nRetorne os artigos de lei mais cobrados em provas policiais para este tópico específico. Cite o número do artigo em negrito antes de cada trecho. Sem introdução, sem comentário — só os artigos-chave, até uns 600 palavras. Se o tópico for extenso, priorize os trechos historicamente mais cobrados e finalize indicando onde consultar o texto integral. Formate em markdown simples.`
    case 'resumo':
      return `Você é professor de cursinho para o concurso de Soldado da PM de Santa Catarina (banca AOCP). Tópico: "${topicName}" (disciplina: ${discName}).\n\nEscreva um resumo direto (400-500 palavras) com o que mais cai em prova: conceitos centrais, pegadinhas típicas da banca AOCP e exceções cobradas como "incorreta". Use marcadores quando ajudar. Sintetize com suas próprias palavras.`
    case 'questoes':
      return `Você é professor de cursinho para o concurso de Soldado da PM de Santa Catarina (banca AOCP). Tópico: "${topicName}" (disciplina: ${discName}).\n\nDeixe claro no início que são questões de TREINO inéditas, não questões reais de provas anteriores. Depois crie 3 questões de múltipla escolha originais no estilo AOCP sobre este tópico, 4 alternativas (A-D) cada, indique a correta e explique objetivamente por que cada alternativa errada está errada.`
    case 'briefing':
      return `Você é um coach de estudos para o concurso de Soldado da PM de Santa Catarina (banca AOCP). Desempenho real do candidato por tópico (peso 1-21, maior = mais cobrado; "sem dados" = nunca praticado):\n\n${summary}\n\nEscreva um briefing curto (150-200 palavras), tom direto de coach experiente: aponte 2-3 pontos mais urgentes desta semana (cruzando peso alto com desempenho fraco ou sem dados), reconheça o que já está bem encaminhado e termine com uma recomendação prática de tempo de estudo.`
  }
}

export const generateStudyMaterial = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) => inputSchema.parse(data))
  .handler(async ({ data }): Promise<{ text: string } | { error: string }> => {
    const prompt = buildPrompt(data)
    try {
      const res = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-3-flash-preview',
          messages: [{ role: 'user', content: prompt }],
          max_completion_tokens: 1600,
        }),
      })
      if (res.status === 429) return { error: 'Limite de requisições atingido. Aguarde um momento e tente novamente.' }
      if (res.status === 402) return { error: 'Créditos de IA esgotados. Adicione créditos no workspace Lovable.' }
      if (!res.ok) {
        console.error('AI gateway error', res.status, await res.text())
        return { error: `Falha na geração (HTTP ${res.status}).` }
      }
      const json = (await res.json()) as { choices?: { message?: { content?: string } }[] }
      const text = json.choices?.[0]?.message?.content ?? ''
      if (!text) return { error: 'A IA retornou uma resposta vazia.' }
      return { text }
    } catch (err) {
      console.error(err)
      return { error: 'Não foi possível conectar ao serviço de IA.' }
    }
  })
