import { useEffect, useState } from "react";
import { useAuth } from "../../lib/auth";
import { loadStudySessions, loadLancamentos, type StudySession, type Lancamento } from "../../lib/db";
import { loadDisciplines, getTotalExamQuestions, type Discipline } from "../../lib/curriculum";

export function DesempenhoView() {
  const { user } = useAuth();
  const [disciplines, setDisciplines] = useState<Discipline[]>([]);
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [lancamentos, setLancamentos] = useState<Lancamento[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const [d, s, l] = await Promise.all([
          loadDisciplines(),
          loadStudySessions(user.id),
          loadLancamentos(user.id),
        ]);
        setDisciplines(d);
        setSessions(s);
        setLancamentos(l);
      } catch (err) {
        console.error("Desempenho load error:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  if (loading) return <div style={{ padding: "40px", color: "var(--text-muted)" }}>Carregando...</div>;

  const byDiscipline: Record<string, { minutes: number; sessionCount: number; lancamentoCount: number; totalAccuracy: number; totalQuestions: number; totalCorrect: number }> = {};
  for (const disc of disciplines) {
    byDiscipline[disc.id] = { minutes: 0, sessionCount: 0, lancamentoCount: 0, totalAccuracy: 0, totalQuestions: 0, totalCorrect: 0 };
  }
  for (const s of sessions) {
    const d = byDiscipline[s.discipline_id];
    if (d) {
      d.minutes += s.duration_minutes;
      d.sessionCount += 1;
    }
  }
  for (const l of lancamentos) {
    const d = byDiscipline[l.discipline_id];
    if (d) {
      d.lancamentoCount += 1;
      d.totalAccuracy += l.accuracy;
      d.totalQuestions += l.total_questions;
      d.totalCorrect += l.correct_count;
    }
  }

  const totalExamQuestions = getTotalExamQuestions(disciplines);
  const totalQuestions = lancamentos.reduce((sum, l) => sum + l.total_questions, 0);
  const totalCorrect = lancamentos.reduce((sum, l) => sum + l.correct_count, 0);
  const overallAccuracy = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;

  return (
    <div style={{ animation: "fadeIn 0.3s ease" }}>
      <h1 style={{ fontSize: "24px", fontWeight: 700, marginBottom: "24px" }}>Desempenho</h1>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "16px", marginBottom: "24px" }}>
        <div style={{ background: "var(--surface)", borderRadius: "var(--radius)", padding: "24px", border: "1px solid var(--border)" }}>
          <div style={{ fontSize: "13px", color: "var(--text-muted)" }}>Aproveitamento geral</div>
          <div style={{ fontSize: "32px", fontWeight: 700, color: overallAccuracy >= 60 ? "var(--success)" : "var(--warning)" }}>{overallAccuracy}%</div>
        </div>
        <div style={{ background: "var(--surface)", borderRadius: "var(--radius)", padding: "24px", border: "1px solid var(--border)" }}>
          <div style={{ fontSize: "13px", color: "var(--text-muted)" }}>Questões resolvidas</div>
          <div style={{ fontSize: "32px", fontWeight: 700 }}>{totalQuestions}</div>
        </div>
        <div style={{ background: "var(--surface)", borderRadius: "var(--radius)", padding: "24px", border: "1px solid var(--border)" }}>
          <div style={{ fontSize: "13px", color: "var(--text-muted)" }}>Total de acertos</div>
          <div style={{ fontSize: "32px", fontWeight: 700, color: "var(--success)" }}>{totalCorrect}</div>
        </div>
        <div style={{ background: "var(--surface)", borderRadius: "var(--radius)", padding: "24px", border: "1px solid var(--border)" }}>
          <div style={{ fontSize: "13px", color: "var(--text-muted)" }}>Questões na prova</div>
          <div style={{ fontSize: "32px", fontWeight: 700 }}>{totalExamQuestions}</div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "16px" }}>
        {disciplines.map((disc) => {
          const d = byDiscipline[disc.id];
          const avgAccuracy = d.lancamentoCount > 0 ? Math.round(d.totalAccuracy / d.lancamentoCount) : 0;
          return (
            <div key={disc.id} style={{ background: "var(--surface)", borderRadius: "var(--radius)", padding: "20px", border: "1px solid var(--border)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
                <span style={{ fontSize: "24px" }}>{disc.icon}</span>
                <h3 style={{ fontSize: "16px", fontWeight: 600 }}>{disc.name}</h3>
                {!disc.is_discursive && (
                  <span style={{ fontSize: "11px", color: "var(--text-muted)", marginLeft: "auto", background: "var(--bg)", padding: "2px 8px", borderRadius: "10px" }}>
                    {disc.question_count} questões
                  </span>
                )}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>Sessões</span>
                  <span style={{ fontSize: "13px", fontWeight: 500 }}>{d.sessionCount}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>Lançamentos</span>
                  <span style={{ fontSize: "13px", fontWeight: 500 }}>{d.lancamentoCount}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>Questões resolvidas</span>
                  <span style={{ fontSize: "13px", fontWeight: 500 }}>{d.totalQuestions}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>Aproveitamento</span>
                  <span style={{ fontSize: "13px", fontWeight: 600, color: avgAccuracy >= 60 ? "var(--success)" : "var(--warning)" }}>{avgAccuracy}%</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>Tempo</span>
                  <span style={{ fontSize: "13px", fontWeight: 500 }}>{Math.floor(d.minutes / 60)}h {d.minutes % 60}m</span>
                </div>
                {!disc.is_discursive && (
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>Peso na prova</span>
                    <span style={{ fontSize: "13px", fontWeight: 500 }}>
                      {Math.round((disc.question_count / totalExamQuestions) * 100)}%
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
