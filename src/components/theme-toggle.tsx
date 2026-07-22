export function ThemeToggle() {
  function toggle() {
    const current = document.documentElement.getAttribute("data-theme") || "dark";
    const next = current === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("theme", next);
  }

  const current = document.documentElement.getAttribute("data-theme") || "dark";

  return (
    <button
      onClick={toggle}
      style={{
        background: "transparent",
        border: "1px solid var(--border)",
        padding: "8px 12px",
        fontSize: "18px",
      }}
      title="Alternar tema"
    >
      {current === "dark" ? "☀️" : "🌙"}
    </button>
  );
}
