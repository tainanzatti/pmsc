import { useState } from "react";
import { MaterialModal } from "../material-modal";

export function RedacaoView() {
  const [showModal, setShowModal] = useState(false);

  return (
    <div style={{ animation: "fadeIn 0.3s ease" }}>
      <h1 style={{ fontSize: "24px", fontWeight: 700, marginBottom: "24px" }}>Redação</h1>

      <div style={{ background: "var(--surface)", borderRadius: "var(--radius)", padding: "32px", border: "1px solid var(--border)", textAlign: "center" }}>
        <div style={{ fontSize: "48px", marginBottom: "16px" }}>✍️</div>
        <h2 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "8px" }}>Pratique redação</h2>
        <p style={{ color: "var(--text-muted)", fontSize: "14px", marginBottom: "24px", maxWidth: "400px", margin: "0 auto 24px" }}>
          Escreva sua redação, receba correção automática com pontuação de 0 a 1000 e feedback detalhado.
        </p>
        <button
          onClick={() => setShowModal(true)}
          style={{ background: "var(--primary)", color: "#fff", fontWeight: 600, padding: "14px 32px", fontSize: "15px" }}
        >
          Começar Redação
        </button>
      </div>

      {showModal && <MaterialModal onClose={() => setShowModal(false)} />}
    </div>
  );
}
