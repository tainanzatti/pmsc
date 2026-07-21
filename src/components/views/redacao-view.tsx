import { useState } from "react";
import MaterialModal from "../material-modal";

interface RedacaoViewProps {
  onMasteryUpdate?: () => void;
}

export default function RedacaoView({ onMasteryUpdate }: RedacaoViewProps) {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", padding: "32px 20px" }}>
      <header style={{ marginBottom: "32px" }}>
        <h1 style={{ fontSize: "28px", fontWeight: 700, marginBottom: "8px" }}>Redação</h1>
        <p style={{ color: "var(--text-muted)", fontSize: "15px" }}>
          Treine redações dissertativas-argumentativas com temas gerados por IA
          baseados no edital do PMSC. Cada redação é corrigida com nota de 0 a 10
          e feedback por critério.
        </p>
      </header>

      <div
        style={{
          background: "var(--surface)",
          border: "2px dashed var(--text-muted)",
          borderRadius: "var(--radius)",
          padding: "48px",
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: "48px", marginBottom: "16px" }}>✍️</div>
        <h2 style={{ fontSize: "20px", fontWeight: 600, marginBottom: "12px" }}>
          Pratique Redação
        </h2>
        <p style={{ color: "var(--text-muted)", fontSize: "14px", marginBottom: "24px", maxWidth: "480px", margin: "0 auto 24px" }}>
          Gere um tema, escreva sua redação e receba correção por IA com nota
          e feedback detalhado por critério. A nota alimenta diretamente o
          domínio da disciplina.
        </p>
        <button
          style={{ background: "var(--primary)", color: "white", fontSize: "16px", padding: "14px 32px" }}
          onClick={() => setModalOpen(true)}
        >
          Começar redação
        </button>
      </div>

      {modalOpen && (
        <MaterialModal
          disciplineId="redacao"
          disciplineLabel="Redação"
          onClose={() => {
            setModalOpen(false);
            onMasteryUpdate?.();
          }}
        />
      )}
    </div>
  );
}
