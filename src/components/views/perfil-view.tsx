import { useEffect, useState } from "react";

export default function PerfilView() {
  const [userName, setUserName] = useState<string>("");

  useEffect(() => {
    const stored = localStorage.getItem("pmsc-user-name");
    if (stored) setUserName(stored);
  }, []);

  const handleSave = () => {
    localStorage.setItem("pmsc-user-name", userName || "Estudante");
  };

  return (
    <div style={{ maxWidth: "600px", margin: "0 auto", padding: "32px 20px" }}>
      <header style={{ marginBottom: "32px" }}>
        <h1 style={{ fontSize: "28px", fontWeight: 700, marginBottom: "8px" }}>Perfil</h1>
        <p style={{ color: "var(--text-muted)", fontSize: "15px" }}>
          Suas informações de estudo e preferências.
        </p>
      </header>

      <div style={{ background: "var(--surface)", borderRadius: "var(--radius)", padding: "24px", border: "1px solid var(--border)", marginBottom: "24px" }}>
        <label style={{ display: "block", fontSize: "14px", fontWeight: 600, marginBottom: "8px" }}>
          Como você se chama?
        </label>
        <input
          type="text"
          value={userName}
          onChange={(e) => setUserName(e.target.value)}
          placeholder="Seu nome"
          style={{
            width: "100%", padding: "12px", fontSize: "15px",
            background: "var(--bg)", color: "var(--text)",
            border: "1px solid var(--border)", borderRadius: "var(--radius-sm)",
          }}
        />
        <button
          style={{ background: "var(--primary)", color: "white", marginTop: "16px" }}
          onClick={handleSave}
        >
          Salvar
        </button>
      </div>

      <div style={{ background: "var(--surface)", borderRadius: "var(--radius)", padding: "24px", border: "1px solid var(--border)" }}>
        <h2 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "16px" }}>Sobre o Operação PMSC</h2>
        <p style={{ fontSize: "14px", color: "var(--text-muted)", marginBottom: "8px" }}>
          Sistema de estudo para o concurso de Soldado PMSC 2026 (banca Instituto AOCP).
        </p>
        <p style={{ fontSize: "14px", color: "var(--text-muted)" }}>
          Motor de prioridade ponderada, flashcards Leitner, redação com correção por IA.
        </p>
      </div>
    </div>
  );
}
