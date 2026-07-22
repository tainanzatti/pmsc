export function generateResumo(discipline: string, topic: string): string {
  return `Resumo de ${discipline} — ${topic}\n\nEste é um resumo estruturado do tópico ${topic}. Foque nos conceitos principais e nas aplicações mais cobradas em prova.\n\nPrincipais pontos:\n1. Definição e conceitos básicos\n2. Propriedades e características\n3. Aplicações práticas\n4. Casos especiais e exceções\n\nRevise este material e pratique com questões para fixar o conteúdo.`;
}

export function generateQuestoes(discipline: string, topic: string): string {
  return `Questões de ${discipline} — ${topic}\n\n1. O que é ${topic}?\na) ...\nb) ...\nc) ...\nd) ...\n\n2. Qual alternativa melhor descreve ${topic}?\na) ...\nb) ...\nc) ...\nd) ...\n\n3. Sobre ${topic}, é correto afirmar que:\na) ...\nb) ...\nc) ...\nd) ...\n\nGabarito: 1-B, 2-C, 3-A`;
}

export function generateEssayTheme(): string {
  const themes = [
    "Os desafios da segurança pública no Brasil contemporâneo",
    "Tecnologia e educação: caminhos e desafios",
    "Sustentabilidade ambiental e crescimento econômico",
    "O papel do Estado na garantia dos direitos sociais",
    "Redes sociais e seus impactos na sociedade",
  ];
  return themes[Math.floor(Math.random() * themes.length)];
}

export function correctEssay(content: string): { score: number; feedback: string } {
  const wordCount = content.trim().split(/\s+/).length;
  let score = 400;
  if (wordCount >= 200) score += 200;
  if (wordCount >= 300) score += 100;
  if (content.includes("portanto") || content.includes("assim") || content.includes("concluindo")) score += 100;
  if (content.includes("primeiramente") || content.includes("além disso") || content.includes("por outro lado")) score += 100;
  if (content.includes("segundo") || content.includes("terceiro") || content.includes("finalmente")) score += 100;
  score = Math.min(score, 1000);

  const feedback = `Sua redação obteve ${score} pontos.\n\nPontos positivos:\n- ${wordCount >= 200 ? "Boa extensão de texto" : "Texto curto, considere desenvolver mais"}\n- ${content.includes("portanto") ? "Boa conclusão" : "Faltam conectivos de conclusão"}\n\nSugestões de melhoria:\n- Use mais conectivos lógicos\n- Estruture melhor os parágrafos\n- Revise a coesão e coerência`;

  return { score, feedback };
}
