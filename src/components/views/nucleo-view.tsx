import { useEffect, useState, useCallback } from "react";
import { useAuth } from "../../lib/auth";
import { loadTopics, loadLancamentos, loadSkipStates, upsertSkipState, loadTopicProgress, upsertTopicProgress, type Topic, type Lancamento, type SkipState, type TopicProgressRow } from "../../lib/db";
import { loadDisciplines, getSkipMultiplier, type Discipline } from "../../lib/curriculum";
import { getRecommendedDiscipline, getStudyQueue, formatDaysSince, type DisciplineRecommendation, type TopicRecommendation } from "../../lib/recommendation";

export function NucleoView() {
  const { user, profile } = useAuth();
  const [disciplines, setDisciplines] = useState<Discipline[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [lancamentos, setLancamentos] = useState<Lancamento[]>([]);
  const [skipStates, setSkipStates] = useState<Record<string, SkipState>>({});
  const [progressByTopic, setProgressByTopic] = useState<Record<string, TopicProgressRow>>({});
  const [loading, setLoading] = useState(true);
  const [studyQueue, setStudyQueue] = useState<DisciplineRecommendation[]>([]);
  const [recommended, setRecommended] = useState<DisciplineRecommendation | null>(null);
  const [showQueue, setShowQueue] = useState(false);

  const loadData = useCallback(async () => {
    if (!user) return;
    try {
      const [d, t, l, s, p] = await Promise.all([
        loadDisciplines(),
        loadTopics(),
        loadLancamentos(user.id),
        loadSkipStates(user.id),
        loadTopicProgress(user.id),
      ]);
      setDisciplines(d);
      setTopics(t);
      setLancamentos(l);
      setSkipStates(s);
      setProgressByTopic(p);
    } catch (err) {
      console.error("Nucleo load error:", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Recalculate recommendation whenever data changes
  useEffect(() => {
    if (disciplines.length === 0) return;
    const examDate = profile?.exam_date || null;
    const rec = getRecommendedDiscipline(disciplines, topics, progressByTopic, skipStates, examDate);
    setRecommended(rec);
    const queue = getStudyQueue(disciplines, topics, progressByTopic, skipStates, examDate);
    setStudyQueue(queue);
  }, [disciplines, topics, progressByTopic, skipStates, profile?.exam_date]);

  async function handleSkip(disciplineId: string) {
    if (!user) return;
    const current = skipStates[disciplineId];
    const newSkipCount = (current?.skip_count || 0) + 1;
    const newMultiplier = getSkipMultiplier(newSkipCount);
    try {
      await upsertSkipState(user.id, disciplineId, newSkipCount, newMultiplier);
      setSkipStates((prev) => ({
        ...prev,
        [disciplineId]: {
          discipline_id: disciplineId,
          skip_count: newSkipCount,
          urgency_multiplier: newMultiplier,
          user_id: user.id,
          updated_at: new Date().toISOString(),
        },
      }));
    } catch (err) {
      console.error("Skip error:", err);
    }
  }

  async function handleCompleteTopic(topicRec: TopicRecommendation) {
    if (!user) return;
    try {
      await upsertTopicProgress(user.id, topicRec.topic.id, topicRec.discipline.id, {
        status: "completed",
        mastery: Math.max(topicRec.mastery, 80),
        last_studied_at: new Date().toISOString(),
        study_count: (progressByTopic[topicRec.topic.id]?.study_count || 0) + 1,
      });
      await loadData();
    } catch (err) {
      console.error("Complete topic error:", err);
    }
  }

  if (loading) return <div style={{ padding: "40px", color: "var(--text-muted)" }}>Carregando...</div>;

  const unlockedDisciplineId = recommended?.discipline.id || null;

  return (
    <div style={{ animation: "fadeIn 0.3s ease" }}>
      <h1 style={{ fontSize: "24px", fontWeight: 700, marginBottom: "24px" }}>Núcleo de Estudo</h1>

      {/* Recommendation Panel */}
      {recommended && recommended.topicRecommendation && (
        <RecommendationPanel rec={recommended} />
      )}

      {/* Action buttons */}
      {recommended && (
        <div style={{ display: "flex", gap: "12px", marginBottom: "24px" }}>
          <button
            onClick={() => setShowQueue(!showQueue)}
            style={{
              background: "transparent",
              border: "1px solid var(--border)",
              color: "var(--text-muted)",
              padding: "10px 20px",
              fontSize: "13px",
            }}
          >
            {showQueue ? "Ocultar fila" : "Ver fila de estudos"}
          </button>
        </div>
      )}

      {/* Study Queue */}
      {showQueue && studyQueue.length > 0 && (
        <div style={{ background: "var(--surface)", borderRadius: "var(--radius)", padding: "20px", border: "1px solid var(--border)", marginBottom: "24px" }}>
          <h3 style={{ fontSize: "15px", fontWeight: 600, marginBottom: "12px" }}>Fila de Estudos</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {studyQueue.map((rec, i) => (
              <div key={rec.discipline.id} style={{
                display: "flex", alignItems: "center", gap: "12px",
                padding: "10px 12px",
                background: i === 0 ? "var(--primary-dim)" : "var(--bg)",
                borderRadius: "var(--radius-sm)",
              }}>
                <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-muted)", minWidth: "24px" }}>#{i + 1}</span>
                <span style={{ fontSize: "20px" }}>{rec.discipline.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "14px", fontWeight: 500 }}>
                    {rec.discipline.name}
                    {i === 0 && <span style={{ fontSize: "11px", color: "var(--primary)", marginLeft: "8px" }}>● Em estudo</span>}
                  </div>
                  <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                    Prioridade: {rec.priority}/100 • Domínio: {rec.avgMastery}% • {rec.pendingTopics} pendentes
                  </div>
                </div>
                {rec.topicRecommendation && (
                  <div style={{ fontSize: "12px", color: "var(--text-muted)", textAlign: "right", maxWidth: "200px" }}>
                    {rec.topicRecommendation.topic.title}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Discipline cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "16px" }}>
        {disciplines.map((disc) => {
          const isUnlocked = disc.id === unlockedDisciplineId;
          const skipState = skipStates[disc.id];
          const skipCount = skipState?.skip_count || 0;
          const discLancamentos = lancamentos.filter((l) => l.discipline_id === disc.id);
          const discMastery = discLancamentos.length > 0
            ? Math.round(discLancamentos.reduce((sum, l) => sum + l.accuracy, 0) / discLancamentos.length)
            : 0;
          const discTopics = topics.filter((t) => t.discipline_id === disc.id);
          const completedCount = discTopics.filter((t) => progressByTopic[t.id]?.status === "completed").length;
          const rec = studyQueue.find((r) => r.discipline.id === disc.id);
          const priority = rec?.priority ?? 0;

          return (
            <div key={disc.id} style={{
              background: "var(--surface)",
              borderRadius: "var(--radius)",
              padding: "20px",
              border: isUnlocked ? "2px solid var(--primary)" : "1px solid var(--border)",
              opacity: isUnlocked ? 1 : 0.6,
              position: "relative",
            }}>
              {isUnlocked && (
                <div style={{
                  position: "absolute", top: "-8px", right: "12px",
                  background: "var(--primary)", color: "#fff",
                  fontSize: "10px", fontWeight: 600, padding: "2px 10px",
                  borderRadius: "10px",
                }}>
                  DESBLOQUEADA
                </div>
              )}

              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                <span style={{ fontSize: "24px" }}>{isUnlocked ? disc.icon : "🔒"}</span>
                <h3 style={{ fontSize: "16px", fontWeight: 600 }}>{disc.name}</h3>
                {!disc.is_discursive && (
                  <span style={{ fontSize: "11px", color: "var(--text-muted)", marginLeft: "auto", background: "var(--bg)", padding: "2px 8px", borderRadius: "10px" }}>
                    {disc.question_count} questões
                  </span>
                )}
              </div>

              <p style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "4px" }}>
                Domínio: {discMastery}% • {discLancamentos.length} lançamentos • {completedCount}/{discTopics.length} tópicos
              </p>
              <p style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "4px" }}>
                Prioridade: <span style={{ fontWeight: 600, color: priority >= 70 ? "var(--error)" : priority >= 50 ? "var(--warning)" : "var(--text-muted)" }}>{priority}/100</span>
              </p>
              {skipCount > 0 && (
                <p style={{ fontSize: "12px", color: "var(--warning)", marginBottom: "4px" }}>
                  Pulada {skipCount}x
                </p>
              )}

              {/* Show topic recommendation for unlocked discipline */}
              {isUnlocked && rec?.topicRecommendation && (
                <div style={{
                  marginTop: "12px", padding: "12px",
                  background: "var(--bg)", borderRadius: "var(--radius-sm)",
                  border: "1px solid var(--border)",
                }}>
                  <div style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "4px" }}>Próximo tópico:</div>
                  <div style={{ fontSize: "14px", fontWeight: 600, marginBottom: "4px" }}>
                    {rec.topicRecommendation.topic.title}
                  </div>
                  {rec.topicRecommendation.subtopic && (
                    <div style={{ fontSize: "12px", color: "var(--text-muted)", marginLeft: "12px" }}>
                      ↳ {rec.topicRecommendation.subtopic.title}
                    </div>
                  )}
                  <div style={{ display: "flex", gap: "12px", marginTop: "8px", flexWrap: "wrap" }}>
                    <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                      🎯 Prioridade: {rec.topicRecommendation.priority}/100
                    </span>
                    <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                      ⏱ {rec.topicRecommendation.estimatedMinutes}min
                    </span>
                    <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                      📊 {rec.topicRecommendation.mastery}%
                    </span>
                  </div>
                </div>
              )}

              <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
                {isUnlocked ? (
                  <>
                    <button
                      onClick={() => rec?.topicRecommendation && handleCompleteTopic(rec.topicRecommendation)}
                      style={{ background: "var(--primary)", color: "#fff", flex: 1, fontSize: "13px", fontWeight: 600 }}
                    >
                      Concluir Tópico
                    </button>
                    <button
                      onClick={() => handleSkip(disc.id)}
                      style={{ background: "transparent", color: "var(--text-muted)", border: "1px solid var(--border)", fontSize: "13px", padding: "8px 12px" }}
                    >
                      Pular
                    </button>
                  </>
                ) : (
                  <div style={{
                    flex: 1, textAlign: "center", fontSize: "13px",
                    color: "var(--text-muted)", padding: "10px",
                    background: "var(--bg)", borderRadius: "var(--radius-sm)",
                  }}>
                    🔒 Bloqueada — conclua a disciplina atual
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

function RecommendationPanel({ rec }: { rec: DisciplineRecommendation }) {
  const topicRec = rec.topicRecommendation;
  if (!topicRec) return null;

  return (
    <div style={{
      background: "linear-gradient(135deg, var(--primary-dim), var(--surface))",
      borderRadius: "var(--radius)",
      padding: "24px",
      border: "2px solid var(--primary)",
      marginBottom: "24px",
    }}>
      <div style={{ fontSize: "13px", color: "var(--primary)", fontWeight: 600, marginBottom: "12px", textTransform: "uppercase", letterSpacing: "1px" }}>
        Próxima missão de estudo
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
        <span style={{ fontSize: "28px" }}>{rec.discipline.icon}</span>
        <div>
          <div style={{ fontSize: "18px", fontWeight: 700 }}>{rec.discipline.name}</div>
          {topicRec.subtopic && (
            <div style={{ fontSize: "13px", color: "var(--text-muted)" }}>
              ↳ {topicRec.subtopic.title}
            </div>
          )}
        </div>
      </div>

      <div style={{ fontSize: "16px", fontWeight: 600, marginBottom: "16px" }}>
        📖 Estude agora: {topicRec.topic.title}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: "12px", marginBottom: "16px" }}>
        <RecStat icon="🎯" label="Prioridade" value={`${topicRec.priority}/100`} />
        <RecStat icon="⏱" label="Tempo sugerido" value={`${topicRec.estimatedMinutes} min`} />
        <RecStat icon="📊" label="Domínio atual" value={`${topicRec.mastery}%`} />
        <RecStat icon="📅" label="Última revisão" value={formatDaysSince(topicRec.daysSinceLastStudy)} />
      </div>

      {topicRec.questionsTotal > 0 && (
        <div style={{ display: "flex", gap: "16px", marginBottom: "16px", flexWrap: "wrap" }}>
          <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>
            Questões resolvidas: <strong style={{ color: "var(--text)" }}>{topicRec.questionsTotal}</strong>
          </span>
          <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>
            Aproveitamento: <strong style={{ color: topicRec.accuracy >= 60 ? "var(--success)" : "var(--warning)" }}>{topicRec.accuracy}%</strong>
          </span>
        </div>
      )}

      <div style={{
        background: "var(--bg)", borderRadius: "var(--radius-sm)", padding: "14px",
        border: "1px solid var(--border)",
      }}>
        <div style={{ fontSize: "13px", fontWeight: 600, marginBottom: "8px" }}>🧠 Motivo da recomendação:</div>
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {topicRec.reasons.map((reason, i) => (
            <li key={i} style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "4px", paddingLeft: "12px", position: "relative" }}>
              <span style={{ position: "absolute", left: 0, color: "var(--primary)" }}>•</span>
              {reason}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function RecStat({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div style={{ padding: "10px", background: "var(--bg)", borderRadius: "var(--radius-sm)", textAlign: "center" }}>
      <div style={{ fontSize: "16px", marginBottom: "2px" }}>{icon}</div>
      <div style={{ fontSize: "15px", fontWeight: 700 }}>{value}</div>
      <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>{label}</div>
    </div>
  );
}
