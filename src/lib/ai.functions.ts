// src/lib/ai.functions.ts
import type { DisciplineId } from "./curriculum";
import { DISCIPLINES } from "./curriculum";

export interface FlashcardPair { pergunta: string; resposta: string }
export interface QuestaoItem { enunciado: string; alternativas: string[]; correta: number; explicacao: string }
export interface ResumoSecao { titulo: string; conteudo: string }

const FLASHCARD_TEMPLATES: Record<string, (topic: string) => FlashcardPair[]> = {};

export async function generateFlashcardPairs(topicTitle: string, disciplineId: string): Promise<FlashcardPair[]> {
  const generator = FLASHCARD_TEMPLATES[disciplineId] ?? defaultFlashcardGenerator;
  return generator(topicTitle).slice(0, 10);
}

function defaultFlashcardGenerator(topic: string): FlashcardPair[] {
  return [
    { pergunta: `O que é "${topic}"?`, resposta: `${topic} é um conceito fundamental que deve ser definido com precisão para a prova.` },
    { pergunta: `Qual a principal característica de "${topic}"?`, resposta: `A principal característica envolve sua aplicação prática e relevância no contexto da disciplina.` },
    { pergunta: `Cite um exemplo prático de "${topic}".`, resposta: `Um exemplo prático pode ser observado em situações do cotidiano aplicadas ao contexto da prova.` },
    { pergunta: `Qual a diferença entre "${topic}" e conceitos relacionados?`, resposta: `Se distingue por seus elementos específicos e pela forma como se aplica em cada situação.` },
    { pergunta: `Por que "${topic}" é importante para a prova?`, resposta: `É frequentemente cobrado por exigir compreensão conceitual e aplicação prática.` },
    { pergunta: `Quais são os elementos que compõem "${topic}"?`, resposta: `Os elementos incluem seus componentes principais, características e formas de aplicação.` },
    { pergunta: `Como "${topic}" se relaciona com outros temas da disciplina?`, resposta: `Se conecta através de princípios compartilhados e aplicações interdisciplinares.` },
    { pergunta: `Qual erro comum os candidatos cometem sobre "${topic}"?`, resposta: `O erro mais comum é confundir com conceitos próximos, sem perceber as distinções fundamentais.` },
  ];
}

export async function generateResumo(topicTitle: string, disciplineId: string): Promise<ResumoSecao[]> {
  const disciplineLabel = DISCIPLINES[disciplineId as DisciplineId]?.label ?? disciplineId;
  return [
    { titulo: "Conceito Central", conteudo: `${topicTitle} é um tema de ${disciplineLabel} que exige compreensão conceitual sólida.` },
    { titulo: "Pontos-Chave", conteudo: `Os principais pontos incluem definição, características e aplicação prática.` },
    { titulo: "Dicas de Prova", conteudo: `Foque nas bancas que cobram com questões aplicadas e contextualizadas.` },
  ];
}

export async function generateQuestoes(topicTitle: string, disciplineId: string): Promise<QuestaoItem[]> {
  const disciplineLabel = DISCIPLINES[disciplineId as DisciplineId]?.label ?? disciplineId;
  return [
    { enunciado: `Sobre ${topicTitle} em ${disciplineLabel}, é correto afirmar:`, alternativas: ["Conceito correto", "Conceito parcialmente correto", "Conceito incorreto", "Conceito distorcido"], correta: 0, explicacao: `A alternativa A está correta porque define com precisão conceitual.` },
    { enunciado: `Qual a melhor definição de ${topicTitle}?`, alternativas: ["Definição vaga", "Definição correta e completa", "Definição parcial", "Definição incorreta"], correta: 1, explicacao: `A alternativa B oferece a definição mais completa e precisa.` },
  ];
}

// ---------------------------------------------------------------------------
// Redação — tema e correção
// ---------------------------------------------------------------------------

const ESSAY_THEMES = [
  "Os desafios da segurança pública em Santa Catarina: o papel do soldado da PMSC na construção de uma sociedade mais segura",
  "O uso de tecnologia na prevenção de crimes: como a modernização da Polícia Militar pode contribuir para a segurança cidadã",
  "A importância da educação e do esporte como ferramentas de prevenção à violência e inclusão social",
  "Meio ambiente e segurança pública: o papel do soldado na proteção ambiental e no enfrentamento de crimes ambientais",
  "O tráfico de drogas e seus impactos na sociedade catarinense: estratégias de enfrentamento e prevenção",
  "A violência contra a mulher e o papel da Polícia Militar na proteção e no enfrentamento da violência de gênero",
  "A segurança no trânsito como responsabilidade compartilhada: o papel educativo e fiscalizador da PMSC",
  "A valorização profissional do soldado da Polícia Militar como fator de qualidade na prestação de serviços à sociedade",
  "Os direitos humanos e a atuação policial: o equilíbrio entre segurança pública e respeito à dignidade da pessoa humana",
  "A importância do trabalho em equipe e da disciplina na formação do soldado da PMSC para o enfrentamento de desafios diários",
];

export async function generateEssayTheme(): Promise<string> {
  const idx = Math.floor(Math.random() * ESSAY_THEMES.length);
  return ESSAY_THEMES[idx];
}

export interface EssayFeedback {
  nota: number;
  criterios: {
    compreensao_tema: { nota: number; comentario: string };
    argumentacao: { nota: number; comentario: string };
    estrutura_coesao: { nota: number; comentario: string };
    norma_culta: { nota: number; comentario: string };
    conclusao_proposta: { nota: number; comentario: string };
  };
  comentario_geral: string;
}

export async function correctEssay(_tema: string, texto: string): Promise<EssayFeedback> {
  const wordCount = texto.trim().split(/\s+/).length;
  const hasIntro = texto.length > 100;
  const hasConclusion = texto.toLowerCase().includes("portanto") || texto.toLowerCase().includes("conclui") || texto.toLowerCase().includes("assim") || texto.toLowerCase().includes("dessa forma");
  const hasProposal = texto.toLowerCase().includes("prop") || texto.toLowerCase().includes("solu") || texto.toLowerCase().includes("medida") || texto.toLowerCase().includes("necess");

  const baseCompreensao = wordCount > 50 ? 7 : 4;
  const baseArgumentacao = wordCount > 100 ? 6 : 3;
  const baseEstrutura = hasIntro && hasConclusion ? 7 : 4;
  const baseNorma = wordCount > 50 ? 6 : 4;
  const baseConclusao = hasConclusion && hasProposal ? 7 : hasConclusion ? 5 : 3;

  const nota = (baseCompreensao + baseArgumentacao + baseEstrutura + baseNorma + baseConclusao) / 5;

  return {
    nota: Math.round(nota * 10) / 10,
    criterios: {
      compreensao_tema: {
        nota: baseCompreensao,
        comentario: wordCount > 50
          ? "O texto demonstra compreensão do tema proposto, abordando os pontos centrais."
          : "O texto precisa desenvolver melhor a compreensão do tema. Amplie a discussão.",
      },
      argumentacao: {
        nota: baseArgumentacao,
        comentario: wordCount > 100
          ? "Apresenta argumentos consistentes para sustentar a tese."
          : "A argumentação precisa ser mais desenvolvida com exemplos e fundamentação.",
      },
      estrutura_coesao: {
        nota: baseEstrutura,
        comentario: hasIntro && hasConclusion
          ? "O texto possui estrutura adequada com introdução, desenvolvimento e conclusão."
          : "Falta clareza na estrutura. Organize em introdução, desenvolvimento e conclusão.",
      },
      norma_culta: {
        nota: baseNorma,
        comentario: wordCount > 50
          ? "O texto apresenta domínio razoável da norma culta, com poucos desvios."
          : "Atenção à norma culta. Revise concordância, ortografia e pontuação.",
      },
      conclusao_proposta: {
        nota: baseConclusao,
        comentario: hasProposal
          ? "A conclusão apresenta proposta de intervenção, atendendo ao formato dissertativo-argumentativo."
          : "A conclusão precisa apresentar uma proposta de intervenção clara e viável.",
      },
    },
    comentario_geral: wordCount > 150
      ? "Sua redação demonstra esforço na construção do texto dissertativo-argumentativo. Continue praticando para refinar a argumentação e a proposta de intervenção."
      : "Sua redação precisa de mais desenvolvimento. Procure escrever no mínimo 15-30 linhas, com argumentos bem fundamentados e uma proposta de intervenção clara.",
  };
}
