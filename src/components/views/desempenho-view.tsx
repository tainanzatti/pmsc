// src/components/views/desempenho-view.tsx
// Bloco 5 item 11: tela de desempenho com contador de evasão (quantas vezes
// cada disciplina foi pulada) + visão geral de domínio por disciplina.

import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase";
import {
  ALL_DISCIPLINE_IDS, DISCIPLINES, type DisciplineId,
  type DisciplineSkipState, type TopicWithMastery,
  consolidateTopics, masteryToTier, averageMasteryForDiscipline,
  daysSinceLastDisciplineReview, getResurfaceTopics,
} from "../../lib/curriculum";
import { loadSkipStates, type LancamentoRow, type TopicRow } from "../../lib/db";

interface DisciplineStat {
  disciplineId: DisciplineId;
  label: string;
  weight: number;
  avgMastery: number;
  tier: string;
  topicCount: number;
  daysSinceReview: number;
  skipCount: number;
  urgencyMultiplier: number;
  resurfaceCount: number;
}

export default function DesempenhoView() {
  const [stats, setStats] = useState<DisciplineStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"mastery" | "skip" | "weight">("mastery");

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [topicsRes, lancamentosRes] = await Promise.all([
        supabase.from("topics").select("*"),
        supabase.from("lancamentos").select("*"),
      ]);
      if (topicsRes.error) throw topicsRes.error;
      if (lancamentosRes.error) throw lancamentosRes.error;

      const topicRows = (topicsRes.data as TopicRow[]) ?? [];
      const lancamentoRows = (lancamentosRes.data as LancamentoRow[]) ?? [];

      const consolidated = consolidateTopics(
        lancamentoRows.map((l) => ({ ...l, discipline_id: l.discipline_id as DisciplineId })),
      );
      const topicMap = new Map<string, TopicWithMastery>();
      for (const t of consolidated) topicMap.set(t.id, t);
      for (const t of topicRows) {
        if (!topicMap.has(t.id)) {
          topicMap.set(t.id, {
            id: t.id, discipline_id: t.discipline_id as DisciplineId,
            title: t.title, mastery: 0, last_reviewed_at: null,
          });
        } else {
          const ex = topicMap.get(t.id)!;
          topicMap.set(t.id, { ...ex, title: t.title });
        }
      }
      const topics = Array.from(topicMap.values());

      const skipRows = await loadSkipStates();
      const skipMap: Record<string, DisciplineSkipState> = {};
      for (const s of skipRows) {
        skipMap[s.discipline_id] = {
          discipline_id: s.discipline_id as DisciplineId,
          skip_count: s.skip_count,
          urgency_multiplier: s.urgency_multiplier,
          updated_at: s.updated_at,
        };
      }

      const disciplineStats: DisciplineStat[] = ALL_DISCIPLINE_IDS.map((id) => {
        const cfg = DISCIPLINES[id];
        const avgMastery = averageMasteryForDiscipline(topics, id);
        const tier = masteryToTier(avgMastery);
        const topicCount = topics.filter((t) => t.discipline_id === id).length;
        const days = daysSinceLastDisciplineReview(topics, id);
        const skipCount = skipMap[id]?.skip_count ?? 0;
        const urgency = skipMap[id]?.urgency_multiplier ?? 1.0;
        const resurfaceCount = getResurfaceTopics(topics, id).length;
        return {
          disciplineId: id,
          label: cfg.label,
          weight: cfg.weight,
          avgMastery,
          tier,
          topicCount,
          daysSinceReview: days,
          skipCount,
          urgencyMultiplier: urgency,
          resurfaceCount,
        };
      });

      setStats(disciplineStats);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar desempenho");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const sortedStats = useMemo(() => {
    const sorted = [...stats];
    if (sortBy === "mastery") sorted.sort((a, b) => a.avgMastery - b.avgMastery);
    else if (sortBy === "skip") sorted.sort((a, b) => b.skipCount - a.skipCount);
    else if (sortBy === "weight") sorted.sort((a, b) => b.weight - a.weight);
    return sorted;
  }, [stats, sortBy]);

  const totalSkips = useMemo(
    () => stats.reduce((sum, s) => sum + s.skipCount, 0),
    [stats],
  );

  const overallMastery = useMemo(() => {
    if (stats.length === 0) return 0;
    return Math.round(stats.reduce((sum, s) => sum + s.avgMastery, 0) / stats.length);
  }, [stats]);

  if (loading) {
    return (
      <div style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>
        Carregando desempenho...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: "40px" }}>
        <p style={{ color: "var(--error)", marginBottom: "16px" }}>{error}</p>
        <button onClick={() => void loadData()}>Tentar novamente</button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "32px 20px" }}>
      <header style={{ marginBottom: "32px" }}>
        <h1 style={{ fontSize: "28px", fontWeight: 700, marginBottom: "8px" }}>
          Desempenho
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: "15px" }}>
          Visão geral do seu domínio por disciplina, incluindo o contador de
          evasão — quantas vezes você pulou cada disciplina.
        </p>
      </header>

      {/* Summary cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
          gap: "16px",
          marginBottom: "32px",
        }}
      >
        <div
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius)",
            padding: "20px",
          }}
        >
          <p style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "8px" }}>
            Domínio médio geral
          </p>
          <p style={{ fontSize: "24px", fontWeight: 700 }}>{overallMastery}%</p>
        </div>
        <div
          style={{
            background: "var(--surface)",
            border: totalSkips > 0 ? "2px solid var(--warning)" : "1px solid var(--border)",
            borderRadius: "var(--radius)",
            padding: "20px",
          }}
        >
          <p style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "8px" }}>
            Total de evasões
          </p>
          <p
            style={{
              fontSize: "24px",
              fontWeight: 700,
              color: totalSkips > 0 ? "var(--warning)" : "var(--text)",
            }}
          >
            {totalSkips}
          </p>
        </div>
      </div>

      {/* Sort controls */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
        <span style={{ fontSize: "13px", color: "var(--text-muted)", alignSelf: "center" }}>
          Ordenar por:
        </span>
        {([
          { id: "mastery" as const, label: "Domínio" },
          { id: "skip" as const, label: "Evasão" },
          { id: "weight" as const, label: "Peso no edital" },
        ]).map((opt) => (
          <button
            key={opt.id}
            style={{
              background: sortBy === opt.id ? "var(--primary)" : "transparent",
              color: sortBy === opt.id ? "white" : "var(--text-muted)",
              border: sortBy === opt.id ? "none" : "1px solid var(--border)",
              padding: "6px 14px",
              fontSize: "13px",
            }}
            onClick={() => setSortBy(opt.id)}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Discipline table */}
      <div
        style={{
          background: "var(--surface)",
          borderRadius: "var(--radius)",
          border: "1px solid var(--border)",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.5fr 0.6fr 0.8fr 0.8fr 0.8fr 0.8fr",
            padding: "12px 16px",
            borderBottom: "1px solid var(--border)",
            fontSize: "11px",
            fontWeight: 700,
            color: "var(--text-muted)",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}
        >
          <span>Disciplina</span>
          <span style={{ textAlign: "center" }}>Peso</span>
          <span style={{ textAlign: "center" }}>Domínio</span>
          <span style={{ textAlign: "center" }}>Revisão</span>
          <span style={{ textAlign: "center" }}>Manutenção</span>
          <span style={{ textAlign: "center" }}>Evasão</span>
        </div>

        {/* Rows */}
        {sortedStats.map((s) => {
          const tierColor =
            s.tier === "otimo"
              ? "var(--success)"
              : s.tier === "bom"
                ? "#22c55e"
                : s.tier === "medio"
                  ? "var(--warning)"
                  : "var(--error)";
          const daysText = !isFinite(s.daysSinceReview)
            ? "—"
            : s.daysSinceReview === 0
              ? "hoje"
              : `${s.daysSinceReview}d`;
          return (
            <div
              key={s.disciplineId}
              style={{
                display: "grid",
                gridTemplateColumns: "1.5fr 0.6fr 0.8fr 0.8fr 0.8fr 0.8fr",
                padding: "14px 16px",
                borderBottom: "1px solid var(--border)",
                alignItems: "center",
              }}
            >
              <span style={{ fontSize: "14px", fontWeight: 600 }}>{s.label}</span>
              <span style={{ fontSize: "13px", color: "var(--text-muted)", textAlign: "center" }}>
                {Math.round(s.weight * 100)}%
              </span>
              <div style={{ textAlign: "center" }}>
                <span style={{ fontSize: "13px", fontWeight: 600, color: tierColor }}>
                  {Math.round(s.avgMastery)}%
                </span>
                <div
                  style={{
                    height: "3px",
                    background: "var(--border)",
                    borderRadius: "2px",
                    marginTop: "4px",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: `${s.avgMastery}%`,
                      background: tierColor,
                      borderRadius: "2px",
                    }}
                  />
                </div>
              </div>
              <span
                style={{
                  fontSize: "12px",
                  color: s.daysSinceReview >= 14 ? "var(--error)" : s.daysSinceReview >= 7 ? "var(--warning)" : "var(--text-muted)",
                  textAlign: "center",
                }}
              >
                {daysText}
              </span>
              <span style={{ fontSize: "12px", color: "var(--primary)", textAlign: "center" }}>
                {s.resurfaceCount > 0 ? `${s.resurfaceCount}` : "—"}
              </span>
              <span
                style={{
                  fontSize: "14px",
                  fontWeight: 700,
                  textAlign: "center",
                  color: s.skipCount > 0 ? "var(--warning)" : "var(--text-muted)",
                }}
              >
                {s.skipCount > 0 ? `${s.skipCount}x` : "0"}
              </span>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div style={{ marginTop: "16px", display: "flex", gap: "24px", flexWrap: "wrap" }}>
        <LegendItem color="var(--error)" label="Ruim (<40%)" />
        <LegendItem color="var(--warning)" label="Médio (40-64%)" />
        <LegendItem color="#22c55e" label="Bom (65-84%)" />
        <LegendItem color="var(--success)" label="Ótimo (85%+)" />
        <LegendItem color="var(--primary)" label="Manutenção = tópicos dominados que ressurgem" />
        <LegendItem color="var(--warning)" label="Evasão = vezes que a disciplina foi pulada" />
      </div>
    </div>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
      <div
        style={{
          width: "10px",
          height: "10px",
          borderRadius: "2px",
          background: color,
          flexShrink: 0,
        }}
      />
      <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>{label}</span>
    </div>
  );
}
