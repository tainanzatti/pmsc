import { useState, useEffect } from "react";
import { useAuth } from "../lib/auth";
import { updateSidebarCollapsed } from "../lib/db";

export type ViewId = "painel" | "nucleo" | "flashcards" | "lancamento" | "historico" | "desempenho" | "ranking" | "redacao" | "perfil";

interface SidebarProps {
  current: ViewId;
  onNavigate: (view: ViewId) => void;
  flashcardCount: number;
  onSignOut: () => void;
}

const NAV_ITEMS: { id: ViewId; label: string; icon: string }[] = [
  { id: "painel", label: "Painel", icon: "📊" },
  { id: "nucleo", label: "Núcleo de Estudo", icon: "📚" },
  { id: "flashcards", label: "Flashcards", icon: "🃏" },
  { id: "lancamento", label: "Lançar Questões", icon: "📝" },
  { id: "historico", label: "Histórico", icon: "📋" },
  { id: "desempenho", label: "Desempenho", icon: "📈" },
  { id: "ranking", label: "Ranking", icon: "🏆" },
  { id: "redacao", label: "Redação", icon: "✍️" },
  { id: "perfil", label: "Perfil", icon: "👤" },
];

export function Sidebar({ current, onNavigate, flashcardCount, onSignOut }: SidebarProps) {
  const { profile, refreshProfile } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    setCollapsed(profile?.sidebar_collapsed ?? false);
  }, [profile?.sidebar_collapsed]);

  async function toggleSidebar() {
    const next = !collapsed;
    setCollapsed(next);
    if (profile) {
      try {
        await updateSidebarCollapsed(profile.id, next);
        await refreshProfile();
      } catch (err) {
        console.error("Failed to save sidebar state:", err);
      }
    }
  }

  return (
    <aside
      style={{
        width: collapsed ? "64px" : "240px",
        minHeight: "100vh",
        background: "var(--surface)",
        borderRight: "1px solid var(--border)",
        display: "flex",
        flexDirection: "column",
        padding: collapsed ? "16px 8px" : "16px",
        flexShrink: 0,
        transition: "width 0.25s ease, padding 0.25s ease",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "24px", padding: collapsed ? "4px 0" : "8px 12px" }}>
        <button
          onClick={toggleSidebar}
          title={collapsed ? "Expandir" : "Recolher"}
          style={{
            background: "transparent",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-sm)",
            padding: "6px 8px",
            fontSize: "16px",
            flexShrink: 0,
            color: "var(--text-muted)",
          }}
        >
          {collapsed ? "▶" : "◀"}
        </button>
        {!collapsed && (
          <div>
            <h2 style={{ fontSize: "16px", fontWeight: 700 }}>Operação PMSC</h2>
            <p style={{ fontSize: "12px", color: "var(--text-muted)" }}>Soldado 2026</p>
          </div>
        )}
      </div>

      <nav style={{ display: "flex", flexDirection: "column", gap: "4px", flex: 1 }}>
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            title={collapsed ? item.label : undefined}
            style={{
              background: current === item.id ? "var(--primary-dim)" : "transparent",
              color: current === item.id ? "var(--primary)" : "var(--text)",
              border: "none",
              textAlign: "left",
              padding: collapsed ? "10px 8px" : "10px 12px",
              borderRadius: "var(--radius-sm)",
              fontSize: "14px",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              justifyContent: collapsed ? "center" : "flex-start",
              whiteSpace: "nowrap",
              overflow: "hidden",
            }}
          >
            <span style={{ flexShrink: 0 }}>{item.icon}</span>
            {!collapsed && <span>{item.label}</span>}
            {item.id === "flashcards" && flashcardCount > 0 && !collapsed && (
              <span
                style={{
                  background: "var(--primary)",
                  color: "#fff",
                  borderRadius: "10px",
                  padding: "2px 8px",
                  fontSize: "11px",
                  fontWeight: 600,
                  marginLeft: "auto",
                }}
              >
                {flashcardCount}
              </span>
            )}
            {item.id === "flashcards" && flashcardCount > 0 && collapsed && (
              <span
                style={{
                  background: "var(--primary)",
                  color: "#fff",
                  borderRadius: "10px",
                  padding: "1px 5px",
                  fontSize: "9px",
                  fontWeight: 600,
                  position: "absolute",
                  marginLeft: "20px",
                  marginTop: "-12px",
                }}
              >
                {flashcardCount}
              </span>
            )}
          </button>
        ))}
      </nav>

      <button
        onClick={onSignOut}
        title={collapsed ? "Sair" : undefined}
        style={{
          background: "transparent",
          border: "1px solid var(--border)",
          color: "var(--text-muted)",
          padding: collapsed ? "10px 8px" : "10px 12px",
          fontSize: "13px",
          marginTop: "16px",
          textAlign: "center",
        }}
      >
        {collapsed ? "⏻" : "Sair"}
      </button>
    </aside>
  );
}
