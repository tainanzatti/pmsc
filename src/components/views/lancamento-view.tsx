import { useEffect, useState } from "react";
import { useAuth } from "../../lib/auth";
import { saveLancamento, updateProfileXP, updateTopicProgressFromLancamento, type LancamentoInput } from "../../lib/db";
import { loadDisciplines, loadTopicsByDiscipline, type Discipline, type Topic } from "../../lib/curriculum";
import { calculateLancamentoXP } from "../../lib/xp";

export function LancamentoView({ onNavigate }: { onNavigate?: (v: string) => void }) {
  const { user, profile, refreshProfile } = useAuth();
  const [disciplines, setDisciplines] = useState<Discipline[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);

  const [disciplineId, setDisciplineId] = useState("");
  const [topicId, setTopicId] = useState<string | null>(null);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [studyDate, setStudyDate] = useState(new Date().toISOString().split("T")[0]);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const d = await loadDisciplines();
        setDisciplines(d);
      } catch (err) {
        console.error("Load disciplines error:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!disciplineId) {
      setTopics([]);
      return;
    }
    (async () => {
      try {
        const t = await loadTopicsByDiscipline(disciplineId);
        setTopics(t);
      } catch (err) {
        console.error("Load topics error:", err);
      }
    })();
  }, [disciplineId]);

  const wrongCount = Math.max(0, totalQuestions - correctCount);
  const accuracy = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
  const currentStreak = profile?.current_streak || 0;
  const xpToEarn = calculateLancamentoXP(totalQuestions, accuracy, currentStreak);

  async function handleSubmit() {
    if (!user) return;
    setError(null);
    setSuccess(null);

    if (!disciplineId) {
      setError("Selecione uma disciplina.");
      return;
    }
    if (totalQuestions <= 0) {
      setError("Quantidade de questões deve ser maior que zero.");
      return;
    }
    if (correctCount > totalQuestions) {
      setError("Acertos não pode ser maior que o total de questões.");
      return;
    }
    if (!studyDate) {
      setError("Selecione a data do estudo.");
      return;
    }

    setSaving(true);
    try {
      const input: LancamentoInput = {
        discipline_id: disciplineId,
        topic_id: topicId,
        total_questions: totalQuestions,
        correct_count: correctCount,
        wrong_count: wrongCount,
        accuracy,
        study_date: studyDate,
        notes: notes.trim() || null,
        xp_earned: xpToEarn,
      };
      await saveLancamento(user.id, input);
      await updateTopicProgressFromLancamento(user.id, topicId, disciplineId, totalQuestions, correctCount);
      await updateProfileXP(user.id, xpToEarn, studyDate);
      await refreshProfile();

      setSuccess(`Lançamento salvo! +${xpToEarn} XP`);
      setDisciplineId("");
      setTopicId(null);
      setTotalQuestions(0);
      setCorrectCount(0);
      setNotes("");
      setStudyDate(new Date().toISOString().split("T")[0]);

      setTimeout(() => setSuccess(null), 4000);
    } catch (err) {
      console.error("Save lancamento error:", err);
      setError("Erro ao salvar lançamento. Tente novamente.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div style={{ padding: "40px", color: "var(--text-muted)" }}>Carregando...</div>;

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "12px",
    borderRadius: "var(--radius-sm)",
    border: "1px solid var(--border)",
    background: "var(--bg)",
    color: "var(--text)",
    fontSize: "14px",
  };
  const labelStyle: React.CSSProperties = {
    fontSize: "13px",
    color: "var(--text-muted)",
    display: "block",
    marginBottom: "6px",
  };

  return (
    <div style={{ animation: "fadeIn 0.3s ease", maxWidth: "600px" }}>
      <h1 style={{ fontSize: "24px", fontWeight: 700, marginBottom: "24px" }}>Lançar Questões</h1>

      <div style={{ background: "var(--surface)", borderRadius: "var(--radius)", padding: "24px", border: "1px solid var(--border)" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div>
            <label style={labelStyle}>Disciplina *</label>
            <select
              value={disciplineId}
              onChange={(e) => { setDisciplineId(e.target.value); setTopicId(null); }}
              style={inputStyle}
            >
              <option value="">Selecione...</option>
              {disciplines.map((d) => (
                <option key={d.id} value={d.id}>{d.icon} {d.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={labelStyle}>Tópico</label>
            <select
              value={topicId || ""}
              onChange={(e) => setTopicId(e.target.value || null)}
              style={inputStyle}
              disabled={!disciplineId}
            >
              <option value="">Geral da disciplina</option>
              {topics.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.parent_id ? "  ↳ " : ""}{t.title} ({t.fibonacci_weight})
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <div>
              <label style={labelStyle}>Quantidade de questões *</label>
              <input
                type="number"
                min={0}
                value={totalQuestions || ""}
                onChange={(e) => setTotalQuestions(Math.max(0, parseInt(e.target.value) || 0))}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Quantidade de acertos *</label>
              <input
                type="number"
                min={0}
                max={totalQuestions}
                value={correctCount || ""}
                onChange={(e) => setCorrectCount(Math.max(0, Math.min(totalQuestions, parseInt(e.target.value) || 0)))}
                style={inputStyle}
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
            <div style={{ padding: "12px", background: "var(--bg)", borderRadius: "var(--radius-sm)", textAlign: "center" }}>
              <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>Erros</div>
              <div style={{ fontSize: "20px", fontWeight: 600, color: "var(--error)" }}>{wrongCount}</div>
            </div>
            <div style={{ padding: "12px", background: "var(--bg)", borderRadius: "var(--radius-sm)", textAlign: "center" }}>
              <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>Aproveitamento</div>
              <div style={{ fontSize: "20px", fontWeight: 600, color: accuracy >= 60 ? "var(--success)" : "var(--warning)" }}>{accuracy}%</div>
            </div>
            <div style={{ padding: "12px", background: "var(--primary-dim)", borderRadius: "var(--radius-sm)", textAlign: "center" }}>
              <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>XP a ganhar</div>
              <div style={{ fontSize: "20px", fontWeight: 600, color: "var(--primary)" }}>+{xpToEarn}</div>
            </div>
          </div>

          <div>
            <label style={labelStyle}>Data do estudo *</label>
            <input
              type="date"
              value={studyDate}
              onChange={(e) => setStudyDate(e.target.value)}
              max={new Date().toISOString().split("T")[0]}
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>Observações (opcional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Anotações sobre o estudo..."
              rows={3}
              style={{ ...inputStyle, resize: "vertical" }}
            />
          </div>

          {error && (
            <div style={{ color: "var(--error)", fontSize: "13px", padding: "8px 12px", background: "rgba(239,68,68,0.1)", borderRadius: "var(--radius-sm)" }}>
              {error}
            </div>
          )}
          {success && (
            <div style={{ color: "var(--success)", fontSize: "13px", padding: "8px 12px", background: "rgba(34,197,94,0.1)", borderRadius: "var(--radius-sm)" }}>
              {success}
            </div>
          )}

          <div style={{ display: "flex", gap: "12px" }}>
            <button
              onClick={handleSubmit}
              disabled={saving}
              style={{ background: "var(--primary)", color: "#fff", fontWeight: 600, padding: "14px 32px", flex: 1 }}
            >
              {saving ? "Salvando..." : "Salvar Lançamento"}
            </button>
            {onNavigate && (
              <button
                onClick={() => onNavigate("historico")}
                style={{ background: "transparent", border: "1px solid var(--border)", color: "var(--text-muted)", padding: "14px 24px" }}
              >
                Ver Histórico
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
