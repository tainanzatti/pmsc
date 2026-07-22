import { useEffect, useState } from "react";
import { useAuth } from "../../lib/auth";
import { loadRanking, type RankingUser } from "../../lib/db";
import { getLeague, LEAGUES } from "../../lib/xp";

type Period = "all" | "week" | "month";

export function RankingView() {
  const { user } = useAuth();
  const [ranking, setRanking] = useState<RankingUser[]>([]);
  const [period, setPeriod] = useState<Period>("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    (async () => {
      try {
        const data = await loadRanking(period);
        setRanking(data);
      } catch (err) {
        console.error("Ranking load error:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [period]);

  if (loading) return <div style={{ padding: "40px", color: "var(--text-muted)" }}>Carregando...</div>;

  const myPosition = ranking.findIndex((u) => u.id === user?.id) + 1;
  const myData = ranking.find((u) => u.id === user?.id);

  const tabs: { id: Period; label: string }[] = [
    { id: "all", label: "Geral Histórico" },
    { id: "week", label: "Semanal (7 dias)" },
    { id: "month", label: "Mensal" },
  ];

  return (
    <div style={{ animation: "fadeIn 0.3s ease" }}>
      <h1 style={{ fontSize: "24px", fontWeight: 700, marginBottom: "24px" }}>🏆 Ranking</h1>

      {myData && (
        <div style={{
          background: "var(--surface)",
          borderRadius: "var(--radius)",
          padding: "20px",
          border: "2px solid var(--primary)",
          marginBottom: "24px",
          display: "flex",
          alignItems: "center",
          gap: "16px",
          flexWrap: "wrap",
        }}>
          <div style={{ fontSize: "32px", fontWeight: 700, color: "var(--primary)" }}>#{myPosition}</div>
          <div style={{ flex: 1, minWidth: "120px" }}>
            <div style={{ fontSize: "16px", fontWeight: 600 }}>{myData.apelido || myData.full_name}</div>
            <div style={{ fontSize: "13px", color: "var(--text-muted)" }}>
              {getLeague(myData.xp).icon} {myData.league} • {myData.xp.toLocaleString()} XP
            </div>
          </div>
          <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
            <Stat label="Questões" value={myData.total_questions} />
            <Stat label="Aproveitamento" value={`${myData.accuracy}%`} />
            <Stat label="Horas" value={`${Math.floor(myData.total_study_minutes / 60)}h`} />
            <Stat label="Sequência" value={`${myData.current_streak} dias`} />
          </div>
        </div>
      )}

      <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setPeriod(t.id)}
            style={{
              background: period === t.id ? "var(--primary)" : "transparent",
              color: period === t.id ? "#fff" : "var(--text-muted)",
              border: period === t.id ? "none" : "1px solid var(--border)",
              padding: "10px 16px",
              fontSize: "13px",
              fontWeight: 500,
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {ranking.length === 0 ? (
        <div style={{ background: "var(--surface)", borderRadius: "var(--radius)", padding: "40px", border: "1px solid var(--border)", textAlign: "center" }}>
          <div style={{ fontSize: "36px", marginBottom: "12px" }}>🏆</div>
          <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>Ainda não há dados suficientes para o ranking. Comece a estudar!</p>
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", background: "var(--surface)", borderRadius: "var(--radius)", overflow: "hidden" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid var(--border)" }}>
                <th style={{ padding: "12px 16px", textAlign: "center", fontSize: "13px", color: "var(--text-muted)" }}>#</th>
                <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "13px", color: "var(--text-muted)" }}>Nome</th>
                <th style={{ padding: "12px 16px", textAlign: "center", fontSize: "13px", color: "var(--text-muted)" }}>Patente</th>
                <th style={{ padding: "12px 16px", textAlign: "center", fontSize: "13px", color: "var(--text-muted)" }}>XP</th>
                <th style={{ padding: "12px 16px", textAlign: "center", fontSize: "13px", color: "var(--text-muted)" }}>Horas</th>
                <th style={{ padding: "12px 16px", textAlign: "center", fontSize: "13px", color: "var(--text-muted)" }}>Questões</th>
                <th style={{ padding: "12px 16px", textAlign: "center", fontSize: "13px", color: "var(--text-muted)" }}>Acertos</th>
                <th style={{ padding: "12px 16px", textAlign: "center", fontSize: "13px", color: "var(--text-muted)" }}>Sequência</th>
              </tr>
            </thead>
            <tbody>
              {ranking.map((u, i) => {
                const isMe = u.id === user?.id;
                const league = getLeague(u.xp);
                return (
                  <tr key={u.id} style={{
                    borderBottom: "1px solid var(--border)",
                    background: isMe ? "var(--primary-dim)" : "transparent",
                  }}>
                    <td style={{ padding: "12px 16px", textAlign: "center", fontSize: "15px", fontWeight: 700 }}>
                      {i + 1 <= 3 ? ["🥇", "🥈", "🥉"][i] : i + 1}
                    </td>
                    <td style={{ padding: "12px 16px", fontSize: "14px", fontWeight: isMe ? 600 : 400 }}>
                      {u.apelido || u.full_name}
                      {isMe && <span style={{ fontSize: "11px", color: "var(--primary)", marginLeft: "6px" }}>(você)</span>}
                    </td>
                    <td style={{ padding: "12px 16px", textAlign: "center", fontSize: "13px" }}>
                      <span style={{ color: league.color }}>{league.icon}</span> {u.league}
                    </td>
                    <td style={{ padding: "12px 16px", textAlign: "center", fontSize: "13px", fontWeight: 600, color: "var(--primary)" }}>{u.xp.toLocaleString()}</td>
                    <td style={{ padding: "12px 16px", textAlign: "center", fontSize: "13px" }}>{Math.floor(u.total_study_minutes / 60)}h</td>
                    <td style={{ padding: "12px 16px", textAlign: "center", fontSize: "13px" }}>{u.total_questions}</td>
                    <td style={{ padding: "12px 16px", textAlign: "center", fontSize: "13px", fontWeight: 600, color: u.accuracy >= 60 ? "var(--success)" : "var(--warning)" }}>{u.accuracy}%</td>
                    <td style={{ padding: "12px 16px", textAlign: "center", fontSize: "13px" }}>🔥 {u.current_streak}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div style={{ marginTop: "24px", background: "var(--surface)", borderRadius: "var(--radius)", padding: "20px", border: "1px solid var(--border)" }}>
        <h3 style={{ fontSize: "15px", fontWeight: 600, marginBottom: "12px" }}>Sistema de Ligas</h3>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "12px" }}>
          {LEAGUES.map((l) => (
            <div key={l.name} style={{
              padding: "8px 14px",
              borderRadius: "var(--radius-sm)",
              background: "var(--bg)",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "13px",
            }}>
              <span style={{ fontSize: "18px" }}>{l.icon}</span>
              <span style={{ fontWeight: 600, color: l.color }}>{l.name}</span>
              <span style={{ color: "var(--text-muted)", fontSize: "11px" }}>{l.minXp.toLocaleString()}+ XP</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ fontSize: "16px", fontWeight: 700 }}>{value}</div>
      <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>{label}</div>
    </div>
  );
}
