// src/lib/ai.functions.ts
// Funções de geração de conteúdo de IA para diferentes tipos de material.
// Cada função produz conteúdo estruturado que é cacheado via upsertAiMaterial.

import type { DisciplineId } from "./curriculum";
import { DISCIPLINES } from "./curriculum";

export interface FlashcardPair {
  pergunta: string;
  resposta: string;
}

export interface QuestaoItem {
  enunciado: string;
  alternativas: string[];
  correta: number;
  explicacao: string;
}

export interface ResumoSecao {
  titulo: string;
  conteudo: string;
}

// ---------------------------------------------------------------------------
// Flashcards — 5 a 10 pares pergunta/resposta objetivos por tópico
// ---------------------------------------------------------------------------

const FLASHCARD_TEMPLATES: Record<string, (topic: string) => FlashcardPair[]> = {};

export async function generateFlashcardPairs(
  topicTitle: string,
  disciplineId: string,
): Promise<FlashcardPair[]> {
  const generator = FLASHCARD_TEMPLATES[disciplineId] ?? defaultFlashcardGenerator;
  return generator(topicTitle).slice(0, 10);
}

function defaultFlashcardGenerator(topic: string): FlashcardPair[] {
  return [
    {
      pergunta: `O que é "${topic}"?`,
      resposta: `${topic} é um conceito fundamental que deve ser definido com precisão para a prova.`,
    },
    {
      pergunta: `Qual a principal característica de "${topic}"?`,
      resposta: `A principal característica de ${topic} envolve sua aplicação prática e relevância no contexto da disciplina.`,
    },
    {
      pergunta: `Cite um exemplo prático de "${topic}".`,
      resposta: `Um exemplo prático de ${topic} pode ser observado em situações do cotidiano aplicadas ao contexto da prova.`,
    },
    {
      pergunta: `Qual a diferença entre "${topic}" e conceitos relacionados?`,
      resposta: `${topic} se distingue por seus elementos específicos e pela forma como se aplica em cada situação.`,
    },
    {
      pergunta: `Por que "${topic}" é importante para a prova?`,
      resposta: `${topic} é frequentemente cobrado em provas por exigir compreensão conceitual e aplicação prática.`,
    },
    {
      pergunta: `Quais são os elementos que compõem "${topic}"?`,
      resposta: `Os elementos de ${topic} incluem seus componentes principais, características e formas de aplicação.`,
    },
    {
      pergunta: `Como "${topic}" se relaciona com outros temas da disciplina?`,
      resposta: `${topic} se conecta com outros temas através de princípios compartilhados e aplicações interdisciplinares.`,
    },
    {
      pergunta: `Qual erro comum os candidatos cometem sobre "${topic}"?`,
      resposta: `O erro mais comum é confundir ${topic} com conceitos próximos, sem perceber as distinções fundamentais.`,
    },
  ];
}

// ---------------------------------------------------------------------------
// Resumo — seções estruturadas
// ---------------------------------------------------------------------------

export async function generateResumo(
  topicTitle: string,
  disciplineId: string,
): Promise<ResumoSecao[]> {
  const disciplineLabel = DISCIPLINES[disciplineId as DisciplineId]?.label ?? disciplineId;
  return [
    {
      titulo: "Conceito Central",
      conteudo: `${topicTitle} é um tema de ${disciplineLabel} que exige compreensão conceitual sólida.`,
    },
    {
      titulo: "Pontos-Chave",
      conteudo: `Os principais pontos de ${topicTitle} incluem definição, características e aplicação prática.`,
    },
    {
      titulo: "Dicas de Prova",
      conteudo: `Foque nas bancas que cobram ${topicTitle} com questões aplicadas e contextualizadas.`,
    },
  ];
}

// ---------------------------------------------------------------------------
// Questões — múltipla escolha
// ---------------------------------------------------------------------------

export async function generateQuestoes(
  topicTitle: string,
  disciplineId: string,
): Promise<QuestaoItem[]> {
  const disciplineLabel = DISCIPLINES[disciplineId as DisciplineId]?.label ?? disciplineId;
  return [
    {
      enunciado: `Sobre ${topicTitle} em ${disciplineLabel}, é correto afirmar:`,
      alternativas: [
        "Alternativa A — conceito correto",
        "Alternativa B — conceito parcialmente correto",
        "Alternativa C — conceito incorreto",
        "Alternativa D — conceito distorcido",
      ],
      correta: 0,
      explicacao: `A alternativa A está correta porque define ${topicTitle} com precisão conceitual.`,
    },
    {
      enunciado: `Qual a melhor definição de ${topicTitle}?`,
      alternativas: [
        "Definição vaga e imprecisa",
        "Definição correta e completa",
        "Definição parcial",
        "Definição incorreta",
      ],
      correta: 1,
      explicacao: `A alternativa B oferece a definição mais completa e precisa de ${topicTitle}.`,
    },
  ];
}
