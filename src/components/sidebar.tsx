import { useCallback, useEffect, useState } from "react";

export type ViewId = "painel" | "nucleo" | "flashcards" | "desempenho" | "redacao" | "perfil";

interface NavItem { id: ViewId; label: string; icon: string }

const NAV_ITEMS: NavItem[] = [
  { id: "painel", label: "Painel", icon: "📊" },
  { id: "nucleo", label: "Núcleo", icon: "🎯" },
  { id: "flashcards", label: "Flashcards", icon: "🃏" },
  { id: "desempenho", label: "Desempenho", icon: "📈" },
  { id: "redacao", label: "Redação", icon: "✍️" },
  { id: "perfil", label: "Perfil", icon: "👤" },
];

interface SidebarProps {
  current: ViewId;
  onNavigate: (view: ViewId) => void;
  flashcardCount: number;
}

const STORAGE_KEY = "pmsc-sidebar-expanded";

export default function Sidebar({ current, onNavigate, flashcardCount }: SidebarProps) {
  const [expanded, setExpanded] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored !== null) setExpanded(stored === "true");
  }, []);

  const toggleExpanded = useCallback(() => {
    setExpanded((prev) => { const next = !prev; localStorage.setItem(STORAGE_KEY, String(next)); return next; });
  }, []);

  const sidebarWidth = expanded ? "var(--sidebar-w)" : "var(--sidebar-collapsed-w)";

  return (
    <aside style={{ width: sidebarWidth, minWidth: sidebarWidth, background: "var(--surface)", borderRight: "1px solid var(--border)", display: "flex", flexDirection: "column", transition: "width 0.2s ease, min-width 0.2s ease", height: "100vh", position: "sticky", top: 0 }}>
      <button onClick={toggleExpanded} style={{ background: "transparent", color: "var(--text-muted)", padding: expanded ? "16px 20px" : "16px 0", textAlign: expanded ? "left" : "center", fontSize: "18px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: expanded ? "space-between" : "center", gap: "12px" }} title={expanded ? "Recolher" : "Expandir"}>
        <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--text)" }}>{expanded ? "Operação PMSC" : "PMSC"}</span>
        <span style={{ fontSize: "16px" }}>{expanded ? "◀" : "▶"}</span>
      </button>
      <nav style={{ flex: 1, padding: "12px 8px", display: "flex", flexDirection: "column", gap: "4px" }}>
        {NAV_ITEMS.map((item) => {
          const isActive = current === item.id;
          const showBadge = item.id === "flashcards" && flashcardCount > 0;
          return (
            <button key={item.id} onClick={() => onNavigate(item.id)} title={expanded ? undefined : item.label} style={{ background: isActive ? "var(--surface-hover)" : "transparent", color: isActive ? "var(--primary)" : "var(--text-muted)", padding: expanded ? "12px 16px" : "12px 0", textAlign: "left", display: "flex", alignItems: "center", gap: "12px", justifyContent: expanded ? "flex-start" : "center", borderRadius: "var(--radius-sm)", border: "none", fontSize: "14px", fontWeight: isActive ? 600 : 500, position: "relative" }}>
              <span style={{ fontSize: "18px", flexShrink: 0 }}>{item.icon}</span>
              {expanded && <span>{item.label}</span>}
              {showBadge && <span style={{ background: "var(--error)", color: "white", fontSize: "11px", fontWeight: 700, borderRadius: "10px", padding: "2px 7px", minWidth: "20px", textAlign: "center", marginLeft: expanded ? "auto" : "0", position: expanded ? "static" : "absolute", top: expanded ? "auto" : "4px", right: expanded ? "auto" : "4px" }}>{flashcardCount > 99 ? "99+" : flashcardCount}</span>}
            </button>
          );
        })}
      </nav>
      <div style={{ padding: expanded ? "12px 20px" : "12px 0", textAlign: "center", borderTop: "1px solid var(--border)", fontSize: "11px", color: "var(--text-muted)" }}>{expanded ? "Soldado PMSC 2026" : "2026"}</div>
    </aside>
  );
}
