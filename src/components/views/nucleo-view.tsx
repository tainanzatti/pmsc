import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase";
import {
  ALL_DISCIPLINE_IDS, DISCIPLINES, type DisciplineId, type DisciplineSkipState,
  type TopicWithMastery, allocateTopicsForDiscipline, averageMasteryForDiscipline,
  consolidateTopics, daysSinceLastDisciplineReview, masteryToTier,
  maxTopicsForDiscipline, nextHeroDiscipline, nextSkipMultiplier, priorityReason, scoreDisciplines,
} from "../../lib/curriculum";

interface TopicRow { id: string; discipline_id: string; title: string; created_at: string }
interface LancamentoRow { id: string; topic_id: string; discipline_id: string; mastered: number; created_at: string; cycle_number: number | null }
interface SkipStateRow { discipline_id: string; skip_count: number; urgency_multiplier: number; updated_at: string }

export default function NucleoView() {
  const [topics, setTopics] = useState<TopicWithMastery[]>([]);
  const [skipStates, setSkipStates] = useState<Record<string, DisciplineSkipState>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedDiscipline, setExpandedDiscipline] = useState<DisciplineId | null>(null);
  const [skipConfirm, setSkipConfirm] = useState<DisciplineId | null>(null);
  const [skipping, setSkipping] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const [topicsRes, lancamentosRes, skipRes] = await Promise.all([
        supabase.from("topics").select("*"),
        supabase.from("lancamentos").select("*"),
        supabase.from("discipline_skip_state").select("*"),
      ]);
      if (topicsRes.error) throw topicsRes.error;
      if (lancamentosRes.error) throw lancamentosRes.error;
      if (skipRes.error) throw skipRes.error;
      const topicRows = (topicsRes.data as TopicRow[]) ?? [];
      const lancamentoRows = (lancamentosRes.data as LancamentoRow[]) ?? [];
      const skipRows = (skipRes.data as SkipStateRow[]) ?? [];
      const consolidated = consolidateTopics(lancamentoRows.map((l) => ({ ...l, discipline_id: l.discipline_id as DisciplineId })));
      const topicMap = new Map<string, TopicWithMastery>();
      for (const t of consolidated) topicMap.set(t.id, t);
      for (const t of topicRows) {
        if (!topicMap.has(t.id)) topicMap.set(t.id, { id: t.id, discipline_id: t.discipline_id as DisciplineId, title: t.title, mastery: 0, last_reviewed_at: null });
        else { const ex = topicMap.get(t.id)!; topicMap.set(t.id, { ...ex, title: t.title }); }
      }
      setTopics(Array.from(topicMap.values()));
      const skipMap: Record<string, DisciplineSkipState> = {};
      for (const s of skipRows) skipMap[s.discipline_id] = { discipline_id: s.discipline_id as DisciplineId, skip_count: s.skip_count, urgency_multiplier: s.urgency_multiplier, updated_at: s.updated_at };
      setSkipStates(skipMap);
    } catch (err) { setError(err instanceof Error ? err.message : "Erro ao carregar dados"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { void loadData(); }, [loadData]);

  const activeDiscipline = useMemo(() => nextHeroDiscipline(topics, skipStates), [topics, skipStates]);
  const scores = useMemo(() => scoreDisciplines(topics, skipStates), [topics, skipStates]);
  const scoreMap = useMemo(() => { const m: Record<string, number> = {}; for (const s of scores) m[s.discipline] = s.score; return m; }, [scores]);

  const handleSkip = useCallback(async (discipline: DisciplineId) => {
    setSkipping(true);
    try {
      const current = skipStates[discipline]?.urgency_multiplier ?? 1.0;
      const newMultiplier = nextSkipMultiplier(current);
      const newCount = (skipStates[discipline]?.skip_count ?? 0) + 1;
      const { error: upsertError } = await supabase.from("discipline_skip_state").upsert({ discipline_id: discipline, skip_count: newCount, urgency_multiplier: newMultiplier, updated_at: new Date().toISOString() });
      if (upsertError) throw upsertError;
      setSkipConfirm(null); setExpandedDiscipline(null); await loadData();
    } catch (err) { setError(err instanceof Error ? err.message : "Erro ao pular disciplina"); }
    finally { setSkipping(false); }
  }, [skipStates, loadData]);

  if (loading) return <div style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>Carregando seu núcleo de estudos...</div>;
  if (error) return <div style={{ padding: "40px" }}><p style={{ color: "var(--error)", marginBottom: "16px" }}>{error}</p><button onClick={() => void loadData()}>Tentar novamente</button></div>;

  return (
    <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "32px 20px" }}>
      <header style={{ marginBottom: "32px" }}>
        <h1 style={{ fontSize: "28px", fontWeight: 700, marginBottom: "8px" }}>Núcleo de Estudos</h1>
        <p style={{ color: "var(--text-muted)", fontSize: "15px" }}>Soldado PMSC 2026 — banca Instituto AOCP. A disciplina em destaque é definida pelo seu desempenho real e tempo desde a última revisão.</p>
      </header>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "16px" }}>
        {ALL_DISCIPLINE_IDS.map((id) => (
          <DisciplineCard key={id} disciplineId={id} isActive={id === activeDiscipline} isExpanded={id === expandedDiscipline} isRedacao={id === "redacao"}
            topics={topics} skipStates={skipStates} score={scoreMap[id] ?? 0}
            onToggle={() => id === activeDiscipline ? setExpandedDiscipline(expandedDiscipline === id ? null : id) : undefined}
            onSkip={() => setSkipConfirm(id)} />
        ))}
      </div>
      {skipConfirm && <SkipConfirmModal discipline={skipConfirm} onCancel={() => setSkipConfirm(null)} onConfirm={() => void handleSkip(skipConfirm)} skipping={skipping} />}
    </div>
  );
}

function DisciplineCard({ disciplineId, isActive, isExpanded, isRedacao, topics, skipStates, score, onToggle, onSkip }: {
  disciplineId: DisciplineId; isActive: boolean; isExpanded: boolean; isRedacao: boolean;
  topics: TopicWithMastery[]; skipStates: Record<string, DisciplineSkipState>; score: number; onToggle: () => void; onSkip: () => void;
}) {
  const cfg = DISCIPLINES[disciplineId];
  const avgMastery = averageMasteryForDiscipline(topics, disciplineId);
  const days = daysSinceLastDisciplineReview(topics, disciplineId);
  const tier = masteryToTier(avgMastery);
  const skipCount = skipStates[disciplineId]?.skip_count ?? 0;
  const urgency = skipStates[disciplineId]?.urgency_multiplier ?? 1.0;
  const tierColor = tier === "otimo" ? "var(--success)" : tier === "bom" ? "#22c55e" : tier === "medio" ? "var(--warning)" : "var(--error)";
  const daysText = !isFinite(days) ? "sem revisão" : days === 0 ? "revisado hoje" : days === 1 ? "há 1 dia" : `há ${days} dias`;

  return (
    <div style={{
      background: isActive ? "var(--surface-hover)" : "var(--surface)",
      border: isActive ? "2px solid var(--primary)" : isRedacao ? "2px dashed var(--text-muted)" : "1px solid var(--border)",
      borderRadius: "var(--radius)", padding: "20px", cursor: isActive ? "pointer" : "default",
      transition: "all 0.2s ease", opacity: isActive ? 1 : 0.55, gridColumn: isExpanded ? "1 / -1" : undefined,
    }} onClick={onToggle}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
        <div>
          <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "4px" }}>{cfg.label}</h3>
          <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>Peso {Math.round(cfg.weight * 100)}%</span>
        </div>
        {!isActive && <span style={{ fontSize: "20px", opacity: 0.5 }} title="Disciplina bloqueada">🔒</span>}
        {isActive && <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--primary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Ativa</span>}
      </div>
      <div style={{ marginBottom: "12px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
          <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>Domínio</span>
          <span style={{ fontSize: "12px", fontWeight: 600, color: tierColor }}>{Math.round(avgMastery)}%</span>
        </div>
        <div style={{ height: "6px", background: "var(--border)", borderRadius: "3px", overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${avgMastery}%`, background: tierColor, borderRadius: "3px", transition: "width 0.4s ease" }} />
        </div>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "var(--text-muted)", marginBottom: "8px" }}>
        <span>{daysText}</span>
        {skipCount > 0 && <span style={{ color: "var(--warning)" }}>pulada {skipCount}x (urgência ×{urgency.toFixed(1)})</span>}
      </div>
      {isExpanded && isActive && <ExpandedDiscipline disciplineId={disciplineId} topics={topics} skipStates={skipStates} score={score} onSkip={onSkip} />}
      {isRedacao && !isExpanded && <p style={{ fontSize: "12px", color: "var(--text-muted)", fontStyle: "italic", marginTop: "8px" }}>Tratamento especial — detalhes em breve.</p>}
    </div>
  );
}

function ExpandedDiscipline({ disciplineId, topics, skipStates, score, onSkip }: {
  disciplineId: DisciplineId; topics: TopicWithMastery[]; skipStates: Record<string, DisciplineSkipState>; score: number; onSkip: () => void;
}) {
  const allocated = allocateTopicsForDiscipline(topics, disciplineId);
  const cap = maxTopicsForDiscipline(topics, disciplineId);
  const reason = priorityReason(disciplineId, topics, skipStates);
  const disciplineTopics = topics.filter((t) => t.discipline_id === disciplineId);
  return (
    <div style={{ marginTop: "16px", paddingTop: "16px", borderTop: "1px solid var(--border)" }} onClick={(e) => e.stopPropagation()}>
      <div style={{ background: "var(--primary-dim)", borderRadius: "var(--radius-sm)", padding: "12px 16px", marginBottom: "16px" }}>
        <p style={{ fontSize: "13px", color: "var(--text)" }}><strong>Por que esta disciplina agora?</strong><br />{reason}</p>
        <p style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "4px" }}>Score de prioridade: {score.toFixed(4)}</p>
      </div>
      <p style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "12px" }}>Teto de tópicos: {cap} {cap === 1 ? "tópico" : "tópicos"} (baseado em {disciplineTopics.filter((t) => t.mastery < 85).length} abaixo de "bom")</p>
      {allocated.length === 0 ? (
        <p style={{ fontSize: "14px", color: "var(--success)", marginBottom: "16px" }}>Todos os tópicos desta disciplina estão em nível "bom" ou superior.</p>
      ) : (
        <div style={{ marginBottom: "16px" }}>
          <h4 style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-muted)", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Tópicos para estudar</h4>
          {allocated.map(({ topic, reason: allocReason }) => (
            <div key={topic.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
              <div><span style={{ fontSize: "14px" }}>{topic.title}</span><span style={{ fontSize: "11px", color: "var(--text-muted)", marginLeft: "8px" }}>{allocReason === "primeiro-ciclo" ? "novo" : "reforço"}</span></div>
              <span style={{ fontSize: "13px", fontWeight: 600, color: topic.mastery < 40 ? "var(--error)" : topic.mastery < 65 ? "var(--warning)" : "var(--success)" }}>{Math.round(topic.mastery)}%</span>
            </div>
          ))}
        </div>
      )}
      <div style={{ display: "flex", gap: "12px", marginTop: "16px" }}>
        <button style={{ background: "var(--primary)", color: "white" }}>Estudar agora</button>
        <button style={{ background: "transparent", color: "var(--text-muted)", border: "1px solid var(--border)" }} onClick={onSkip}>Pular esta disciplina</button>
      </div>
    </div>
  );
}

function SkipConfirmModal({ discipline, onCancel, onConfirm, skipping }: { discipline: DisciplineId; onCancel: () => void; onConfirm: () => void; skipping: boolean }) {
  const label = DISCIPLINES[discipline].label;
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }} onClick={onCancel}>
      <div style={{ background: "var(--surface)", borderRadius: "var(--radius)", padding: "32px", maxWidth: "440px", width: "90%", border: "1px solid var(--border)" }} onClick={(e) => e.stopPropagation()}>
        <h3 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "12px" }}>Pular {label}?</h3>
        <p style={{ fontSize: "14px", color: "var(--text-muted)", marginBottom: "24px" }}>Pular não te livra dela — ela volta com prioridade maior e fica registrado. O multiplicador de urgência aumenta e ela reaparece como ativa mais cedo.</p>
        <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
          <button style={{ background: "transparent", color: "var(--text)", border: "1px solid var(--border)" }} onClick={onCancel} disabled={skipping}>Cancelar</button>
          <button style={{ background: "var(--error)", color: "white" }} onClick={onConfirm} disabled={skipping}>{skipping ? "Pulando..." : "Confirmar e pular"}</button>
        </div>
      </div>
    </div>
  );
}
