import { useEffect, useState } from "react";
import { useAuth } from "../../lib/auth";
import { loadFlashcardsDue, updateFlashcardBox, type Flashcard } from "../../lib/db";

export function FlashcardsView() {
  const { user } = useAuth();
  const [dueCards, setDueCards] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const cards = await loadFlashcardsDue(user.id);
        setDueCards(cards);
      } catch (err) {
        console.error("Flashcards load error:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  async function handleReview(known: boolean) {
    const card = dueCards[currentIndex];
    if (!card) return;
    try {
      await updateFlashcardBox(card.id, card.caixa, known);
      setFlipped(false);
      if (currentIndex + 1 < dueCards.length) {
        setCurrentIndex(currentIndex + 1);
      } else {
        setCompleted(true);
      }
    } catch (err) {
      console.error("Review error:", err);
    }
  }

  if (loading) return <div style={{ padding: "40px", color: "var(--text-muted)" }}>Carregando...</div>;

  if (completed || dueCards.length === 0) {
    return (
      <div style={{ animation: "fadeIn 0.3s ease", textAlign: "center", padding: "60px 20px" }}>
        <div style={{ fontSize: "48px", marginBottom: "16px" }}>🎉</div>
        <h2 style={{ fontSize: "20px", fontWeight: 600, marginBottom: "8px" }}>Tudo em dia!</h2>
        <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>Não há flashcards para revisar agora. Volte mais tarde.</p>
      </div>
    );
  }

  const card = dueCards[currentIndex];

  return (
    <div style={{ animation: "fadeIn 0.3s ease" }}>
      <h1 style={{ fontSize: "24px", fontWeight: 700, marginBottom: "8px" }}>Flashcards</h1>
      <p style={{ color: "var(--text-muted)", fontSize: "14px", marginBottom: "24px" }}>
        Cartão {currentIndex + 1} de {dueCards.length} • Caixa {card.caixa}
      </p>

      <div
        onClick={() => setFlipped(!flipped)}
        style={{
          background: "var(--surface)",
          borderRadius: "var(--radius)",
          padding: "40px",
          border: "1px solid var(--border)",
          minHeight: "200px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          marginBottom: "24px",
          transition: "transform 0.2s ease",
        }}
      >
        <div style={{ textAlign: "center" }}>
          {!flipped ? (
            <>
              <div style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "12px" }}>Frente</div>
              <div style={{ fontSize: "18px", fontWeight: 500 }}>{card.pergunta}</div>
            </>
          ) : (
            <>
              <div style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "12px" }}>Verso</div>
              <div style={{ fontSize: "16px" }}>{card.resposta}</div>
            </>
          )}
        </div>
      </div>

      {flipped && (
        <div style={{ display: "flex", gap: "12px" }}>
          <button
            onClick={() => handleReview(false)}
            style={{ flex: 1, background: "rgba(239,68,68,0.15)", color: "var(--error)", border: "1px solid var(--error)", fontWeight: 600, padding: "14px" }}
          >
            Não sei
          </button>
          <button
            onClick={() => handleReview(true)}
            style={{ flex: 1, background: "rgba(34,197,94,0.15)", color: "var(--success)", border: "1px solid var(--success)", fontWeight: 600, padding: "14px" }}
          >
            Sei
          </button>
        </div>
      )}

      {!flipped && (
        <p style={{ textAlign: "center", color: "var(--text-muted)", fontSize: "13px" }}>Clique no cartão para virar</p>
      )}
    </div>
  );
}
