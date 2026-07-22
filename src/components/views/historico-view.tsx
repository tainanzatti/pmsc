import { useEffect, useState, useMemo } from "react";
import { loadLancamentos, updateLancamento, deleteLancamento, recalculateProfileXP, upsertTopicProgress, type Lancamento } from "../../lib/db";
import { loadDisciplines, loadAllTopics, type Discipline, type Topic } from "../../lib/curriculum";
import { useAuth } from "../../lib/auth";

export function HistoricoView() {
  const { user, refreshProfile } = useAuth();
  const [lancamentos, setLancamentos] = useState<Lancamento[]>([]);
  const [disciplines, setDisciplines] = useState<Discipline[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [filterDiscipline, setFilterDiscipline] = useState("");
  const [filterTopic, setFilterTopic] = useState("");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const [sortBy, setSortBy] = useState<"date_desc" | "date_asc" | "accuracy_desc" | "accuracy_asc" | "questions_desc">("date_desc");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTotal, setEditTotal] = useState(0);
  const [editCorrect, setEditCorrect] = useState(0);
  const [editDate, setEditDate] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const [l, d, t] = await Promise.all([
          loadLancamentos(user.id),
          loadDisciplines(),
          loadAllTopics(),
        ]);
        setLancamentos(l);
        setDisciplines(d);
        setTopics(t);
      } catch (err) {
        console.error("Historico load error:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  const disciplineMap = useMemo(() => {
    const m: Record<string, Discipline> = {};
    for (const d of disciplines) m[d.id] = d;
    return m;
  }, [disciplines]);

  const topicMap = useMemo(() => {
    const m: Record<string, Topic> = {};
    for (const t of topics) m[t.id] = t;
    return m;
  }, [topics]);

  const filtered = useMemo(() => {
    let result = [...lancamentos];

    if (search) {
      const q = search.toLowerCase();
      result = result.filter((l) => {
        const discName = disciplineMap[l.discipline_id]?.name || "";
        const topicName = l.topic_id ? topicMap[l.topic_id]?.title || "" : "";
        return discName.toLowerCase().includes(q) || topicName.toLowerCase().includes(q) || (l.notes || "").toLowerCase().includes(q);
      });
    }
    if (filterDiscipline) result = result.filter((l) => l.discipline_id === filterDiscipline);
    if (filterTopic) result = result.filter((l) => l.topic_id === filterTopic);
    if (filterDateFrom) result = result.filter((l) => l.study_date >= filterDateFrom);
    if (filterDateTo) result = result.filter((l) => l.study_date <= filterDateTo);

    switch (sortBy) {
      case "date_desc": result.sort((a, b) => b.study_date.localeCompare(a.study_date) || b.study_time.localeCompare(a.study_time)); break;
      case "date_asc": result.sort((a, b) => a.study_date.localeCompare(b.study_date) || a.study_time.localeCompare(b.study_time)); break;
      case "accuracy_desc": result.sort((a, b) => b.accuracy - a.accuracy); break;
      case "accuracy_asc": result.sort((a, b) => a.accuracy - b.accuracy); break;
      case "questions_desc": result.sort((a, b) => b.total_questions - a.total_questions); break;
    }
    return result;
  }, [lancamentos, search, filterDiscipline, filterTopic, filterDateFrom, filterDateTo, sortBy, disciplineMap, topicMap]);

  function startEdit(l: Lancamento) {
    setEditingId(l.id);
    setEditTotal(l.total_questions);
    setEditCorrect(l.correct_count);
    setEditDate(l.study_date);
    setEditNotes(l.notes || "");
  }

  async function handleSaveEdit() {
    if (!editingId || !user) return;
    setSaving(true);
    try {
      const wrong = Math.max(0, editTotal - editCorrect);
      const acc = editTotal > 0 ? Math.round((editCorrect / editTotal) * 100) : 0;
      await updateLancamento(editingId, {
        total_questions: editTotal,
        correct_count: editCorrect,
        wrong_count: wrong,
        accuracy: acc,
        study_date: editDate,
        notes: editNotes.trim() || null,
      });
      // Update topic progress for the edited lancamento
      const editedLanc = lancamentos.find((l) => l.id === editingId);
      if (editedLanc?.topic_id) {
        const allLancsForTopic = lancamentos.filter((l) => l.topic_id === editedLanc.topic_id && l.id !== editingId);
        const newTotal = allLancsForTopic.reduce((s, l) => s + l.total_questions, 0) + editTotal;
        const newCorrect = allLancsForTopic.reduce((s, l) => s + l.correct_count, 0) + editCorrect;
        const newMastery = newTotal > 0 ? Math.min(100, Math.round((newCorrect / newTotal) * 100)) : 0;
        const newStatus = newMastery >= 80 ? "completed" : "in_progress";
        await upsertTopicProgress(user.id, editedLanc.topic_id, editedLanc.discipline_id, {
          status: newStatus,
          mastery: newMastery,
          questions_total: newTotal,
          questions_correct: newCorrect,
        });
      }
      await recalculateProfileXP(user.id);
      await refreshProfile();

      const [l] = await Promise.all([loadLancamentos(user.id)]);
      setLancamentos(l);
      setEditingId(null);
    } catch (err) {
      console.error("Edit lancamento error:", err);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!user) return;
    if (!confirm("Excluir este lançamento? Esta ação não pode ser desfeita.")) return;
    try {
      await deleteLancamento(id);
      await recalculateProfileXP(user.id);
      await refreshProfile();
      setLancamentos((prev) => prev.filter((l) => l.id !== id));
    } catch (err) {
      console.error("Delete lancamento error:", err);
    }
  }

  if (loading) return <div style={{ padding: "40px", color: "var(--text-muted)" }}>Carregando...</div>;

  const inputStyle: React.CSSProperties = {
    padding: "8px 10px",
    borderRadius: "var(--radius-sm)",
    border: "1px solid var(--border)",
    background: "var(--bg)",
    color: "var(--text)",
    fontSize: "13px",
  };

  return (
    <div style={{ animation: "fadeIn 0.3s ease" }}>
      <h1 style={{ fontSize: "24px", fontWeight: 700, marginBottom: "24px" }}>Histórico de Lançamentos</h1>

      <div style={{ background: "var(--surface)", borderRadius: "var(--radius)", padding: "16px", border: "1px solid var(--border)", marginBottom: "16px" }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", alignItems: "flex-end" }}>
          <div style={{ flex: "1", minWidth: "150px" }}>
            <label style={{ fontSize: "12px", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>Pesquisar</label>
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Disciplina, tópico, observações..." style={{ ...inputStyle, width: "100%" }} />
          </div>
          <div>
            <label style={{ fontSize: "12px", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>Disciplina</label>
            <select value={filterDiscipline} onChange={(e) => setFilterDiscipline(e.target.value)} style={inputStyle}>
              <option value="">Todas</option>
              {disciplines.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: "12px", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>Tópico</label>
            <select value={filterTopic} onChange={(e) => setFilterTopic(e.target.value)} style={inputStyle}>
              <option value="">Todos</option>
              {topics.map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: "12px", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>De</label>
            <input type="date" value={filterDateFrom} onChange={(e) => setFilterDateFrom(e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label style={{ fontSize: "12px", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>Até</label>
            <input type="date" value={filterDateTo} onChange={(e) => setFilterDateTo(e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label style={{ fontSize: "12px", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>Ordenar</label>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value as typeof sortBy)} style={inputStyle}>
              <option value="date_desc">Data (recente)</option>
              <option value="date_asc">Data (antiga)</option>
              <option value="accuracy_desc">Aproveitamento (alto)</option>
              <option value="accuracy_asc">Aproveitamento (baixo)</option>
              <option value="questions_desc">Mais questões</option>
            </select>
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div style={{ background: "var(--surface)", borderRadius: "var(--radius)", padding: "40px", border: "1px solid var(--border)", textAlign: "center" }}>
          <div style={{ fontSize: "36px", marginBottom: "12px" }}>📋</div>
          <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>
            {lancamentos.length === 0 ? "Nenhum lançamento ainda. Comece a registrar suas questões!" : "Nenhum resultado para os filtros aplicados."}
          </p>
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", background: "var(--surface)", borderRadius: "var(--radius)", overflow: "hidden" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid var(--border)" }}>
                <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "13px", color: "var(--text-muted)" }}>Data</th>
                <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "13px", color: "var(--text-muted)" }}>Hora</th>
                <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "13px", color: "var(--text-muted)" }}>Disciplina</th>
                <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "13px", color: "var(--text-muted)" }}>Tópico</th>
                <th style={{ padding: "12px 16px", textAlign: "center", fontSize: "13px", color: "var(--text-muted)" }}>Questões</th>
                <th style={{ padding: "12px 16px", textAlign: "center", fontSize: "13px", color: "var(--text-muted)" }}>Acertos</th>
                <th style={{ padding: "12px 16px", textAlign: "center", fontSize: "13px", color: "var(--text-muted)" }}>Erros</th>
                <th style={{ padding: "12px 16px", textAlign: "center", fontSize: "13px", color: "var(--text-muted)" }}>Aproveitamento</th>
                <th style={{ padding: "12px 16px", textAlign: "center", fontSize: "13px", color: "var(--text-muted)" }}>XP</th>
                <th style={{ padding: "12px 16px", textAlign: "center", fontSize: "13px", color: "var(--text-muted)" }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((l) => {
                const disc = disciplineMap[l.discipline_id];
                const topic = l.topic_id ? topicMap[l.topic_id] : null;
                const isEditing = editingId === l.id;
                return (
                  <tr key={l.id} style={{ borderBottom: "1px solid var(--border)" }}>
                    {isEditing ? (
                      <>
                        <td style={{ padding: "8px 16px" }}>
                          <input type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)} style={inputStyle} />
                        </td>
                        <td style={{ padding: "8px 16px", color: "var(--text-muted)", fontSize: "13px" }}>{l.study_time?.slice(0, 5)}</td>
                        <td style={{ padding: "8px 16px", fontSize: "13px" }}>{disc?.icon} {disc?.name || "—"}</td>
                        <td style={{ padding: "8px 16px", fontSize: "13px", color: "var(--text-muted)" }}>{topic?.title || "Geral"}</td>
                        <td style={{ padding: "8px 16px", textAlign: "center" }}>
                          <input type="number" min={0} value={editTotal} onChange={(e) => setEditTotal(Math.max(0, parseInt(e.target.value) || 0))} style={{ ...inputStyle, width: "60px" }} />
                        </td>
                        <td style={{ padding: "8px 16px", textAlign: "center" }}>
                          <input type="number" min={0} max={editTotal} value={editCorrect} onChange={(e) => setEditCorrect(Math.max(0, Math.min(editTotal, parseInt(e.target.value) || 0)))} style={{ ...inputStyle, width: "60px" }} />
                        </td>
                        <td style={{ padding: "8px 16px", textAlign: "center", fontSize: "13px", color: "var(--error)" }}>{Math.max(0, editTotal - editCorrect)}</td>
                        <td style={{ padding: "8px 16px", textAlign: "center", fontSize: "13px", fontWeight: 600, color: (editTotal > 0 ? Math.round((editCorrect / editTotal) * 100) : 0) >= 60 ? "var(--success)" : "var(--warning)" }}>
                          {editTotal > 0 ? Math.round((editCorrect / editTotal) * 100) : 0}%
                        </td>
                        <td style={{ padding: "8px 16px", textAlign: "center", fontSize: "13px", color: "var(--primary)" }}>{l.xp_earned}</td>
                        <td style={{ padding: "8px 16px", textAlign: "center" }}>
                          <div style={{ display: "flex", gap: "4px", justifyContent: "center" }}>
                            <button onClick={handleSaveEdit} disabled={saving} style={{ background: "var(--primary)", color: "#fff", fontSize: "12px", padding: "6px 10px" }}>OK</button>
                            <button onClick={() => setEditingId(null)} style={{ background: "transparent", border: "1px solid var(--border)", color: "var(--text-muted)", fontSize: "12px", padding: "6px 10px" }}>✕</button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td style={{ padding: "12px 16px", fontSize: "13px" }}>{new Date(l.study_date).toLocaleDateString("pt-BR")}</td>
                        <td style={{ padding: "12px 16px", fontSize: "13px", color: "var(--text-muted)" }}>{l.study_time?.slice(0, 5)}</td>
                        <td style={{ padding: "12px 16px", fontSize: "13px" }}>{disc?.icon} {disc?.name || "—"}</td>
                        <td style={{ padding: "12px 16px", fontSize: "13px", color: "var(--text-muted)" }}>{topic?.title || "Geral"}</td>
                        <td style={{ padding: "12px 16px", textAlign: "center", fontSize: "13px" }}>{l.total_questions}</td>
                        <td style={{ padding: "12px 16px", textAlign: "center", fontSize: "13px", color: "var(--success)" }}>{l.correct_count}</td>
                        <td style={{ padding: "12px 16px", textAlign: "center", fontSize: "13px", color: "var(--error)" }}>{l.wrong_count}</td>
                        <td style={{ padding: "12px 16px", textAlign: "center", fontSize: "13px", fontWeight: 600, color: l.accuracy >= 60 ? "var(--success)" : "var(--warning)" }}>{l.accuracy}%</td>
                        <td style={{ padding: "12px 16px", textAlign: "center", fontSize: "13px", color: "var(--primary)" }}>{l.xp_earned}</td>
                        <td style={{ padding: "12px 16px", textAlign: "center" }}>
                          <div style={{ display: "flex", gap: "4px", justifyContent: "center" }}>
                            <button onClick={() => startEdit(l)} style={{ background: "transparent", border: "1px solid var(--border)", color: "var(--text-muted)", fontSize: "12px", padding: "6px 10px" }}>Editar</button>
                            <button onClick={() => handleDelete(l.id)} style={{ background: "transparent", border: "1px solid var(--error)", color: "var(--error)", fontSize: "12px", padding: "6px 10px" }}>Excluir</button>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
