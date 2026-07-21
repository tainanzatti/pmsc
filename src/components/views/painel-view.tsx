import { useCallback, useEffect, useMemo, useState } from "react";
import type { ViewId } from "../sidebar";
import {
  DISCIPLINES, type DisciplineId, type DisciplineSkipState,
  type TopicWithMastery, consolidateTopics, masteryToTier,
  nextHeroDiscipline, scoreDisciplines,
} from "../../lib/curriculum";
import { supabase } from "../../lib/supabase";
import {
  countDueFlashcards, getAvgMinutesPerNewTopic, getNewTopicsPerDayLast30Days,
  getTotalMinutesStudied, getMinutesStudiedToday, getUntouchedTopicCount,
  type LancamentoRow, type TopicRow,
} from "../../lib/db";

interface PainelViewProps { onNavigate: (view: ViewId) => void }

export default function PainelView({ onNavigate }: PainelViewProps) {
  const [userName, setUserName] = useState("Estudante");
  const [topics, setTopics] = useState<TopicWithMastery[]>([]);
  const [skipStates, setSkipStates] = useState<Record<string, DisciplineSkipState>>({});
  const [minutesToday, setMinutesToday] = useState(0);
  const [totalMinutes, setTotalMinutes] = useState(0);
  const [flashcardCount, setFlashcardCount] = useState(0);
  const [dueReviews, setDueReviews] = useState<{ topicId: string; disciplineId: string; days: number }[]>([]);
  const [untouchedCount, setUntouchedCount] = useState(0);
  const [, setTotalTopics] = useState(0);
  const [newTopicsPerDay, setNewTopicsPerDay] = useState(0);
  const [avgMinutesPerTopic, setAvgMinutesPerTopic] = useState(30);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sliderHours, setSliderHours] = useState(2);

  const loadData = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const stored = localStorage.getItem("pmsc-user-name");
      if (stored) setUserName(stored);
      const [topicsRes, lancamentosRes, skipRes] = await Promise.all([
        supabase.from("topics").select("*"), supabase.from("lancamentos").select("*"), supabase.from("discipline_skip_state").select("*"),
      ]);
      if (topicsRes.error) throw topicsRes.error;
      if (lancamentosRes.error) throw lancamentosRes.error;
      if (skipRes.error) throw skipRes.error;
      const topicRows = (topicsRes.data as TopicRow[]) ?? [];
      const lancamentoRows = (lancamentosRes.data as LancamentoRow[]) ?? [];
      const skipRows = (skipRes.data as { discipline_id: string; skip_count: number; urgency_multiplier: number; updated_at: string }[]) ?? [];
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
      const [mToday, mTotal, fcCount, untouched, newPerDay, avgMin] = await Promise.all([
        getMinutesStudiedToday(), getTotalMinutesStudied(), countDueFlashcards(),
        getUntouchedTopicCount(), getNewTopicsPerDayLast30Days(), getAvgMinutesPerNewTopic(),
      ]);
      setMinutesToday(mToday); setTotalMinutes(mTotal); setFlashcardCount(fcCount);
      setUntouchedCount(untouched.untouched); setTotalTopics(untouched.total);
      setNewTopicsPerDay(newPerDay); setAvgMinutesPerTopic(avgMin);
      const allTopics = Array.from(topicMap.values());
      const now = new Date();
      const overdue = allTopics.filter((t) => t.last_reviewed_at).map((t) => ({ topicId: t.id, disciplineId: t.discipline_id, days: Math.floor((now.getTime() - new Date(t.last_reviewed_at as string).getTime()) / (1000 * 60 * 60 * 24)) })).filter((r) => r.days >= 7).sort((a, b) => b.days - a.days).slice(0, 5);
      setDueReviews(overdue);
    } catch (err) { setError(err instanceof Error ? err.message : "Erro ao carregar painel"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { void loadData(); }, [loadData]);

  const activeDiscipline = useMemo(() => nextHeroDiscipline(topics, skipStates), [topics, skipStates]);
  const scores = useMemo(() => scoreDisciplines(topics, skipStates), [topics, skipStates]);
  const top4 = scores.slice(0, 4);
  const goodPct = useMemo(() => { if (topics.length === 0) return 0; const good = topics.filter((t) => { const tier = masteryToTier(t.mastery); return tier === "bom" || tier === "otimo"; }).length; return Math.round((good / topics.length) * 100); }, [topics]);
  const aproveitamento = useMemo(() => { if (topics.length === 0) return 0; return Math.round(topics.reduce((sum, t) => sum + t.mastery, 0) / topics.length); }, [topics]);
  const activeDisciplineLabel = DISCIPLINES[activeDiscipline]?.label ?? "";
  const activeScore = scores.find((s) => s.discipline === activeDiscipline);
  const activeDays = activeScore?.daysSinceReview ?? 0;
  const projectionDays = useMemo(() => { if (newTopicsPerDay <= 0) return Infinity; return Math.ceil(untouchedCount / newTopicsPerDay); }, [untouchedCount, newTopicsPerDay]);
  const calculatorDays = useMemo(() => { const minutesPerDay = sliderHours * 60; if (minutesPerDay <= 0 || avgMinutesPerTopic <= 0) return Infinity; const topicsPerDay = minutesPerDay / avgMinutesPerTopic; if (topicsPerDay <= 0) return Infinity; return Math.ceil(untouchedCount / topicsPerDay); }, [sliderHours, avgMinutesPerTopic, untouchedCount]);

  if (loading) return <div style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>Carregando seu painel...</div>;
  if (error) return <div style={{ padding: "40px" }}><p style={{ color: "var(--error)", marginBottom: "16px" }}>{error}</p><button onClick={() => void loadData()}>Tentar novamente</button></div>;

  return (
    <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "32px 20px" }}>
      <header style={{ marginBottom: "32px" }}>
        <h1 style={{ fontSize: "28px", fontWeight: 700, marginBottom: "8px" }}>Olá, {userName}!</h1>
        <p style={{ color: "var(--text)", fontSize: "16px" }}>{activeDiscipline === "redacao" ? "Redação é a disciplina ativa agora. Pratique uma redação para subir seu domínio." : `${activeDisciplineLabel} está esquecendo mais rápido — ${Math.max(1, Math.round(45 * (activeDays > 0 ? Math.min(2, 1 + activeDays / 10) : 1)))} min agora.`}</p>
      </header>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "16px", marginBottom: "32px" }}>
        <StatCard label="Horas estudadas hoje" value={`${Math.floor(minutesToday / 60)}h ${minutesToday % 60}min`} />
        <StatCard label="Total estudado" value={`${(totalMinutes / 60).toFixed(1)}h`} />
        <StatCard label="Aproveitamento" value={`${aproveitamento}%`} />
        <StatCard label="Edital com domínio bom/ótimo" value={`${goodPct}%`} />
        <StatCard label="Flashcards pendentes" value={String(flashcardCount)} highlight={flashcardCount > 0} onClick={() => onNavigate("flashcards")} />
      </div>
      <section style={{ marginBottom: "32px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <h2 style={{ fontSize: "18px", fontWeight: 600 }}>Prévia do Núcleo</h2>
          <button style={{ background: "transparent", color: "var(--primary)", border: "none", fontSize: "14px", padding: "4px 8px" }} onClick={() => onNavigate("nucleo")}>Ver tudo →</button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "12px" }}>
          {top4.map((s) => {
            const cfg = DISCIPLINES[s.discipline];
            const tier = masteryToTier(s.averageMastery);
            const tierColor = tier === "otimo" ? "var(--success)" : tier === "bom" ? "#22c55e" : tier === "medio" ? "var(--warning)" : "var(--error)";
            return (
              <div key={s.discipline} style={{ background: "var(--surface)", border: s.discipline === activeDiscipline ? "2px solid var(--primary)" : "1px solid var(--border)", borderRadius: "var(--radius)", padding: "16px" }}>
                <p style={{ fontSize: "14px", fontWeight: 600, marginBottom: "8px" }}>{cfg.label}</p>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}><span style={{ fontSize: "12px", color: "var(--text-muted)" }}>Domínio</span><span style={{ fontSize: "12px", fontWeight: 600, color: tierColor }}>{Math.round(s.averageMastery)}%</span></div>
                <div style={{ height: "4px", background: "var(--border)", borderRadius: "2px", overflow: "hidden" }}><div style={{ height: "100%", width: `${s.averageMastery}%`, background: tierColor, borderRadius: "2px" }} /></div>
              </div>
            );
          })}
        </div>
      </section>
      <section style={{ marginBottom: "32px" }}>
        <h2 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "16px" }}>Revisões Vencendo</h2>
        {dueReviews.length === 0 ? (<p style={{ color: "var(--text-muted)", fontSize: "14px" }}>Nenhuma revisão vencida. Tudo em dia!</p>) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {dueReviews.map((r) => {
              const label = DISCIPLINES[r.disciplineId as DisciplineId]?.label ?? r.disciplineId;
              return (<div key={r.topicId} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}><span style={{ fontSize: "14px" }}>{label}</span><span style={{ fontSize: "12px", color: r.days >= 14 ? "var(--error)" : "var(--warning)" }}>{r.days} dias atrás</span></div>);
            })}
          </div>
        )}
      </section>
      <section style={{ marginBottom: "32px" }}>
        <h2 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "16px" }}>Projeção de Cobertura</h2>
        <div style={{ background: "var(--surface)", borderRadius: "var(--radius)", padding: "24px", border: "1px solid var(--border)" }}>
          <p style={{ fontSize: "15px", marginBottom: "8px" }}>No seu ritmo atual, você verá todos os tópicos pela primeira vez em <strong style={{ color: "var(--primary)" }}>{isFinite(projectionDays) ? `${projectionDays} ${projectionDays === 1 ? "dia" : "dias"}` : "indeterminado"}</strong></p>
          <p style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "24px" }}>{untouchedCount} tópicos restantes · {newTopicsPerDay.toFixed(1)} tópicos novos/dia (média dos últimos 30 dias)</p>
          <div style={{ borderTop: "1px solid var(--border)", paddingTop: "20px" }}>
            <h3 style={{ fontSize: "14px", fontWeight: 600, marginBottom: "12px" }}>Calculadora de Ritmo</h3>
            <div style={{ marginBottom: "12px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}><span style={{ fontSize: "13px", color: "var(--text-muted)" }}>Horas por dia</span><span style={{ fontSize: "13px", fontWeight: 600 }}>{sliderHours}h</span></div>
              <input type="range" min={1} max={8} step={1} value={sliderHours} onChange={(e) => setSliderHours(Number(e.target.value))} style={{ width: "100%" }} />
            </div>
            <p style={{ fontSize: "15px" }}>Nesse ritmo, você cobriria todos os tópicos em <strong style={{ color: "var(--primary)" }}>{isFinite(calculatorDays) ? `${calculatorDays} ${calculatorDays === 1 ? "dia" : "dias"}` : "indeterminado"}</strong></p>
            <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px" }}>Baseado em {avgMinutesPerTopic.toFixed(0)} min/tópico (média histórica real)</p>
          </div>
          <div style={{ marginTop: "20px", paddingTop: "16px", borderTop: "1px solid var(--border)" }}>
            <p style={{ fontSize: "12px", color: "var(--text-muted)", fontStyle: "italic" }}>Estimativa baseada no seu ritmo médio real de estudo. Não considera revisões, apenas o primeiro contato com cada tópico.</p>
          </div>
        </div>
      </section>
    </div>
  );
}

function StatCard({ label, value, highlight, onClick }: { label: string; value: string; highlight?: boolean; onClick?: () => void }) {
  return (
    <div style={{ background: "var(--surface)", border: highlight ? "2px solid var(--error)" : "1px solid var(--border)", borderRadius: "var(--radius)", padding: "20px", cursor: onClick ? "pointer" : "default", transition: "border-color 0.2s ease" }} onClick={onClick}>
      <p style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "8px" }}>{label}</p>
      <p style={{ fontSize: "24px", fontWeight: 700, color: highlight ? "var(--error)" : "var(--text)" }}>{value}</p>
    </div>
  );
}
