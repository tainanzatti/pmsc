import { useEffect, useState } from "react";
import { useAuth } from "../../lib/auth";
import { loadTopics, loadLancamentos, loadStudySessions, loadAllFlashcards, type Topic, type Lancamento, type StudySession, type Flashcard } from "../../lib/db";
import { loadDisciplines, getTotalExamQuestions, type Discipline } from "../../lib/curriculum";
import { getLeague } from "../../lib/xp";

export function PainelView() {
  const { user, profile } = useAuth();
  const [disciplines, setDisciplines] = useState<Discipline[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [lancamentos, setLancamentos] = useState<Lancamento[]>([]);
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const [d, t, l, s, f] = await Promise.all([
          loadDisciplines(),
          loadTopics(),
          loadLancamentos(user.id),
          loadStudySessions(user.id),
          loadAllFlashcards(user.id),
        ]);
        setDisciplines(d);
        setTopics(t);
        setLancamentos(l);
        setSessions(s);
        setFlashcards(f);
      } catch (err) {
        console.error("Painel load error:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  if (loading) return <div style={{ padding: "40px", color: "var(--text-muted)" }}>Carregando...</div>;

  const totalStudyMinutes = sessions.reduce((sum, s) => sum + s.duration_minutes, 0);
  const totalQuestions = lancamentos.reduce((sum, l) => sum + l.total_questions, 0);
  const avgAccuracy = lancamentos.length > 0
    ? Math.round(lancamentos.reduce((sum, l) => sum + l.accuracy, 0) / lancamentos.length)
    : 0;
  const today = new Date().toISOString().split("T")[0];
  const dueFlashcards = flashcards.filter((f) => f.proxima_revisao <= today).length;
  const totalExamQuestions = getTotalExamQuestions(disciplines);
  const xp = profile?.xp || 0;
  const league = getLeague(xp);

  const stats = [
    { label: "Disciplinas", value: disciplines.length, icon: "📚" },
    { label: "Tópicos do edital", value: topics.length, icon: "📋" },
    { label: "Questões na prova", value: totalExamQuestions, icon: "📝" },
    { label: "Questões resolvidas", value: totalQuestions, icon: "✅" },
    { label: "Aproveitamento médio", value: `${avgAccuracy}%`, icon: "🎯" },
    { label: "Tempo de estudo", value: `${Math.floor(totalStudyMinutes / 60)}h ${totalStudyMinutes % 60}m`, icon: "⏱️" },
    { label: "Flashcards para revisar", value: dueFlashcards, icon: "🃏" },
    { label: "Sequência de dias", value: `${profile?.current_streak || 0} dias`, icon: "🔥" },
  ];

  return (
    <div style={{ animation: "fadeIn 0.3s ease" }}>
      <h1 style={{ fontSize: "24px", fontWeight: 700, marginBottom: "24px" }}>Painel</h1>

      {/* XP / League banner */}
      <div style={{
        background: "var(--surface)",
        borderRadius: "var(--radius)",
        padding: "20px",
        border: "1px solid var(--border)",
        marginBottom: "24px",
        display: "flex",
        alignItems: "center",
        gap: "16px",
      }}>
        <div style={{
          width: "56px", height: "56px", borderRadius: "50%",
          background: league.color, display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "24px", flexShrink: 0,
        }}>
          {league.icon}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: "16px", fontWeight: 600 }}>{league.name} • {xp.toLocaleString()} XP</div>
          <div style={{ fontSize: "13px", color: "var(--text-muted)" }}>
            {profile?.current_streak || 0} dias de sequência • {totalQuestions} questões resolvidas
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "16px", marginBottom: "32px" }}>
        {stats.map((stat) => (
          <div key={stat.label} style={{ background: "var(--surface)", borderRadius: "var(--radius)", padding: "20px", border: "1px solid var(--border)" }}>
            <div style={{ fontSize: "28px", marginBottom: "8px" }}>{stat.icon}</div>
            <div style={{ fontSize: "28px", fontWeight: 700 }}>{stat.value}</div>
            <div style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: "4px" }}>{stat.label}</div>
          </div>
        ))}
      </div>

      <div style={{ background: "var(--surface)", borderRadius: "var(--radius)", padding: "24px", border: "1px solid var(--border)" }}>
        <h2 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "16px" }}>Progresso por disciplina</h2>
        {disciplines.map((disc) => {
          const discLancamentos = lancamentos.filter((l) => l.discipline_id === disc.id);
          const discMastery = discLancamentos.length > 0
            ? Math.round(discLancamentos.reduce((sum, l) => sum + l.accuracy, 0) / discLancamentos.length)
            : 0;
          const discQuestions = discLancamentos.reduce((sum, l) => sum + l.total_questions, 0);
          const discTopics = topics.filter((t) => t.discipline_id === disc.id);
          return (
            <div key={disc.id} style={{ marginBottom: "12px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                <span style={{ fontSize: "14px" }}>
                  {disc.icon} {disc.name}
                  {!disc.is_discursive && (
                    <span style={{ fontSize: "11px", color: "var(--text-muted)", marginLeft: "8px" }}>
                      {disc.question_count} questões • {discTopics.length} tópicos • {discQuestions} resolvidas
                    </span>
                  )}
                </span>
                <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>{discMastery}%</span>
              </div>
              <div style={{ height: "8px", background: "var(--bg)", borderRadius: "4px", overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${discMastery}%`, background: disc.color, borderRadius: "4px", transition: "width 0.3s ease" }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
