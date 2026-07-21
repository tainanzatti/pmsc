import { useCallback, useEffect, useState } from "react";
import Sidebar, { type ViewId } from "./components/sidebar";
import NucleoView from "./components/views/nucleo-view";
import FlashcardsView from "./components/views/flashcards-view";
import { countDueFlashcards } from "./lib/db";

export default function App() {
  const [view, setView] = useState<ViewId>("nucleo");
  const [flashcardCount, setFlashcardCount] = useState(0);

  const refreshCount = useCallback(async () => {
    try {
      const count = await countDueFlashcards();
      setFlashcardCount(count);
    } catch {
      setFlashcardCount(0);
    }
  }, []);

  useEffect(() => {
    void refreshCount();
    const interval = setInterval(() => void refreshCount(), 30000);
    return () => clearInterval(interval);
  }, [refreshCount]);

  const handleNavigate = useCallback((v: ViewId) => {
    setView(v);
    if (v === "flashcards") {
      void refreshCount();
    }
  }, [refreshCount]);

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar
        current={view}
        onNavigate={handleNavigate}
        flashcardCount={flashcardCount}
      />
      <main style={{ flex: 1, overflowY: "auto" }}>
        {view === "nucleo" && <NucleoView />}
        {view === "flashcards" && <FlashcardsView onReviewComplete={refreshCount} />}
        {view === "painel" && <PlaceholderView title="Painel" />}
        {view === "desempenho" && <PlaceholderView title="Desempenho" />}
        {view === "redacao" && <PlaceholderView title="Redação" />}
        {view === "perfil" && <PlaceholderView title="Perfil" />}
      </main>
    </div>
  );
}

function PlaceholderView({ title }: { title: string }) {
  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", padding: "32px 20px" }}>
      <h1 style={{ fontSize: "28px", fontWeight: 700, marginBottom: "8px" }}>{title}</h1>
      <p style={{ color: "var(--text-muted)", fontSize: "15px" }}>
        Esta seção será implementada em um bloco futuro.
      </p>
    </div>
  );
}
