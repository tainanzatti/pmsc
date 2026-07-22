import { useEffect, useState } from "react";
import { AuthProvider, useAuth } from "./lib/auth";
import { AuthView } from "./components/auth-view";
import { Sidebar, type ViewId } from "./components/sidebar";
import { ThemeToggle } from "./components/theme-toggle";
import { PainelView } from "./components/views/painel-view";
import { NucleoView } from "./components/views/nucleo-view";
import { FlashcardsView } from "./components/views/flashcards-view";
import { LancamentoView } from "./components/views/lancamento-view";
import { HistoricoView } from "./components/views/historico-view";
import { DesempenhoView } from "./components/views/desempenho-view";
import { RankingView } from "./components/views/ranking-view";
import { RedacaoView } from "./components/views/redacao-view";
import { PerfilView } from "./components/views/perfil-view";
import { countDueFlashcards } from "./lib/db";

function AppContent() {
  const { user, profile, loading, signOut } = useAuth();
  const [view, setView] = useState<ViewId>("painel");
  const [flashcardCount, setFlashcardCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const count = await countDueFlashcards(user.id);
        setFlashcardCount(count);
      } catch (err) {
        console.error("Flashcard count error:", err);
      }
    })();
  }, [user, view]);

  useEffect(() => {
    const saved = localStorage.getItem("theme") || "dark";
    document.documentElement.setAttribute("data-theme", saved);
  }, []);

  if (loading) {
    return <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", color: "var(--text-muted)" }}>Carregando...</div>;
  }

  if (!user || !profile) {
    return <AuthView />;
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar current={view} onNavigate={setView} flashcardCount={flashcardCount} onSignOut={signOut} />
      <main style={{ flex: 1, padding: "32px", overflow: "auto" }}>
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "16px" }}>
          <ThemeToggle />
        </div>
        {view === "painel" && <PainelView />}
        {view === "nucleo" && <NucleoView />}
        {view === "flashcards" && <FlashcardsView />}
        {view === "lancamento" && <LancamentoView onNavigate={(v) => setView(v as ViewId)} />}
        {view === "historico" && <HistoricoView />}
        {view === "desempenho" && <DesempenhoView />}
        {view === "ranking" && <RankingView />}
        {view === "redacao" && <RedacaoView />}
        {view === "perfil" && <PerfilView />}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
