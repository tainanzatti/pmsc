import { useCallback, useEffect, useMemo, useState } from "react";
import { ensureFlashcardsForTopic, getFlashcardQueueTopics, loadDueFlashcards, reviewFlashcard, type FlashcardRow, type TopicRow } from "../../lib/db";
import { DISCIPLINES, type DisciplineId } from "../../lib/curriculum";

interface FlashcardsViewProps { onReviewComplete?: () => void }

export default function FlashcardsView({ onReviewComplete }: FlashcardsViewProps) {
  const [queue, setQueue] = useState<{ topic: TopicRow; mastery: number }[]>([]);
  const [dueCards, setDueCards] = useState<FlashcardRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [reviewing, setReviewing] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [reviewedCount, setReviewedCount] = useState(0);

  const loadData = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const [queueTopics, due] = await Promise.all([getFlashcardQueueTopics(), loadDueFlashcards()]);
      setQueue(queueTopics); setDueCards(due); setCurrentCardIndex(0); setRevealed(false);
    } catch (err) { setError(err instanceof Error ? err.message : "Erro ao carregar flashcards"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { void loadData(); }, [loadData]);
  const currentCard = useMemo(() => (dueCards.length > 0 ? dueCards[currentCardIndex] : null), [dueCards, currentCardIndex]);

  const handleReview = useCallback(async (remembered: boolean) => {
    if (!currentCard) return;
    setReviewing(true);
    try {
      await reviewFlashcard(currentCard.id, remembered);
      setReviewedCount((c) => c + 1); setRevealed(false);
      if (currentCardIndex + 1 < dueCards.length) setCurrentCardIndex((i) => i + 1);
      else { setDueCards([]); setCurrentCardIndex(0); }
      onReviewComplete?.();
    } catch (err) { setError(err instanceof Error ? err.message : "Erro ao revisar flashcard"); }
    finally { setReviewing(false); }
  }, [currentCard, currentCardIndex, dueCards.length, onReviewComplete]);

  const handleGenerateForTopic = useCallback(async (topic: TopicRow) => {
    setGenerating(true); setError(null);
    try { await ensureFlashcardsForTopic(topic.id, topic.discipline_id, topic.title); await loadData(); }
    catch (err) { setError(err instanceof Error ? err.message : "Erro ao gerar flashcards"); }
    finally { setGenerating(false); }
  }, [loadData]);

  if (loading) return <div style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>Carregando flashcards...</div>;
  if (error) return <div style={{ padding: "40px" }}><p style={{ color: "var(--error)", marginBottom: "16px" }}>{error}</p><button onClick={() => void loadData()}>Tentar novamente</button></div>;

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", padding: "32px 20px" }}>
      <header style={{ marginBottom: "32px" }}>
        <h1 style={{ fontSize: "28px", fontWeight: 700, marginBottom: "8px" }}>Flashcards de Reforço</h1>
        <p style={{ color: "var(--text-muted)", fontSize: "15px" }}>Tópicos com domínio abaixo de 60% entram automaticamente na fila. Revise um cartão por vez com repetição espaçada Leitner.</p>
      </header>
      {currentCard ? (
        <FlashcardReview card={currentCard} revealed={revealed} onReveal={() => setRevealed(true)} onReview={handleReview} reviewing={reviewing} cardNumber={currentCardIndex + 1} totalCards={dueCards.length} />
      ) : (
        <div style={{ background: "var(--surface)", borderRadius: "var(--radius)", padding: "40px", textAlign: "center", marginBottom: "32px", border: "1px solid var(--border)" }}>
          {reviewedCount > 0 ? (<><p style={{ fontSize: "18px", fontWeight: 600, marginBottom: "8px" }}>Sessão concluída!</p><p style={{ color: "var(--text-muted)", fontSize: "14px" }}>Você revisou {reviewedCount} {reviewedCount === 1 ? "cartão" : "cartões"}.</p></>) : (<><p style={{ fontSize: "18px", fontWeight: 600, marginBottom: "8px" }}>Nenhum cartão pendente para hoje</p><p style={{ color: "var(--text-muted)", fontSize: "14px" }}>Gere flashcards para os tópicos abaixo para começar a revisar.</p></>)}
        </div>
      )}
      <section>
        <h2 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "16px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Fila de Reforço ({queue.length} tópicos)</h2>
        {queue.length === 0 ? (<p style={{ color: "var(--text-muted)", fontSize: "14px" }}>Nenhum tópico abaixo de 60% no momento. Bom trabalho!</p>) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {queue.map(({ topic, mastery }) => {
              const disciplineLabel = DISCIPLINES[topic.discipline_id as DisciplineId]?.label ?? topic.discipline_id;
              return (
                <div key={topic.id} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div><p style={{ fontSize: "15px", fontWeight: 600, marginBottom: "4px" }}>{topic.title}</p><p style={{ fontSize: "12px", color: "var(--text-muted)" }}>{disciplineLabel} · domínio {Math.round(mastery)}%</p></div>
                  <button style={{ background: "var(--primary)", color: "white", fontSize: "13px", padding: "8px 16px" }} onClick={() => void handleGenerateForTopic(topic)} disabled={generating}>{generating ? "Gerando..." : "Gerar flashcards"}</button>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

function FlashcardReview({ card, revealed, onReveal, onReview, reviewing, cardNumber, totalCards }: { card: FlashcardRow; revealed: boolean; onReveal: () => void; onReview: (remembered: boolean) => void; reviewing: boolean; cardNumber: number; totalCards: number }) {
  const disciplineLabel = DISCIPLINES[card.disciplina_id as DisciplineId]?.label ?? card.disciplina_id;
  return (
    <div style={{ background: "var(--surface)", border: "2px solid var(--primary)", borderRadius: "var(--radius)", padding: "32px", marginBottom: "32px", minHeight: "320px", display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px" }}>
        <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>{disciplineLabel}</span>
        <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>Cartão {cardNumber} de {totalCards} · Caixa {card.caixa}</span>
      </div>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <p style={{ fontSize: "20px", fontWeight: 600, marginBottom: "24px", lineHeight: 1.4 }}>{card.pergunta}</p>
        {revealed ? (
          <div style={{ background: "var(--primary-dim)", borderRadius: "var(--radius-sm)", padding: "20px", animation: "fadeIn 0.3s ease" }}>
            <p style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Resposta</p>
            <p style={{ fontSize: "16px", lineHeight: 1.5 }}>{card.resposta}</p>
          </div>
        ) : (
          <button style={{ background: "transparent", color: "var(--primary)", border: "1px solid var(--primary)", padding: "12px 24px", alignSelf: "flex-start" }} onClick={onReveal}>Revelar resposta</button>
        )}
      </div>
      {revealed && (
        <div style={{ display: "flex", gap: "12px", marginTop: "24px", animation: "fadeIn 0.3s ease" }}>
          <button style={{ background: "var(--error)", color: "white", flex: 1 }} onClick={() => onReview(false)} disabled={reviewing}>Não lembrei</button>
          <button style={{ background: "var(--success)", color: "white", flex: 1 }} onClick={() => onReview(true)} disabled={reviewing}>Lembrei</button>
        </div>
      )}
      <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }`}</style>
    </div>
  );
}
