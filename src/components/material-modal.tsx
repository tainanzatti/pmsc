import { useState } from "react";
import { useAuth } from "../lib/auth";
import { saveRedacao, updateRedacaoScore } from "../lib/db";
import { generateEssayTheme, correctEssay } from "../lib/ai.functions";

interface MaterialModalProps {
  onClose: () => void;
}

export function MaterialModal({ onClose }: MaterialModalProps) {
  const { user } = useAuth();
  const [theme, setTheme] = useState(generateEssayTheme());
  const [content, setContent] = useState("");
  const [result, setResult] = useState<{ score: number; feedback: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleCorrect() {
    if (!content.trim() || content.trim().length < 50) return;
    setLoading(true);
    try {
      const correction = correctEssay(content);
      setResult(correction);
      if (user) {
        const redacao = await saveRedacao(user.id, theme, content);
        const notaScale = correction.score / 100;
        await updateRedacaoScore(redacao.id, notaScale, correction.feedback);
        setSaved(true);
      }
    } catch (err) {
      console.error("Essay correction error:", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.6)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: "20px",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "var(--surface)",
          borderRadius: "var(--radius)",
          width: "100%",
          maxWidth: "600px",
          maxHeight: "85vh",
          overflow: "auto",
          border: "1px solid var(--border)",
          padding: "24px",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <h2 style={{ fontSize: "20px", fontWeight: 700 }}>Redação</h2>
          <button onClick={onClose} style={{ background: "transparent", border: "none", fontSize: "24px", color: "var(--text-muted)" }}>×</button>
        </div>

        <div style={{ marginBottom: "16px" }}>
          <label style={{ fontSize: "13px", color: "var(--text-muted)", display: "block", marginBottom: "6px" }}>Tema</label>
          <div style={{ display: "flex", gap: "8px" }}>
            <input
              type="text"
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              style={{
                flex: 1,
                padding: "10px",
                borderRadius: "var(--radius-sm)",
                border: "1px solid var(--border)",
                background: "var(--bg)",
                color: "var(--text)",
                fontSize: "14px",
              }}
            />
            <button onClick={() => setTheme(generateEssayTheme())} style={{ background: "var(--surface-hover)", border: "1px solid var(--border)", color: "var(--text)", padding: "10px 14px" }}>
              Sortear
            </button>
          </div>
        </div>

        <div style={{ marginBottom: "16px" }}>
          <label style={{ fontSize: "13px", color: "var(--text-muted)", display: "block", marginBottom: "6px" }}>Sua redação</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={12}
            placeholder="Escreva sua redação aqui (mínimo 50 caracteres)..."
            style={{
              width: "100%",
              padding: "12px",
              borderRadius: "var(--radius-sm)",
              border: "1px solid var(--border)",
              background: "var(--bg)",
              color: "var(--text)",
              fontSize: "14px",
              resize: "vertical",
              lineHeight: 1.6,
            }}
          />
          <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px" }}>{content.trim().split(/\s+/).filter(Boolean).length} palavras</div>
        </div>

        <button
          onClick={handleCorrect}
          disabled={loading || content.trim().length < 50}
          style={{ background: "var(--primary)", color: "#fff", fontWeight: 600, width: "100%", padding: "12px" }}
        >
          {loading ? "Corrigindo..." : "Corrigir Redação"}
        </button>

        {result && (
          <div style={{ marginTop: "20px", padding: "16px", background: "var(--bg)", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)" }}>
            <div style={{ fontSize: "24px", fontWeight: 700, color: result.score >= 600 ? "var(--success)" : "var(--warning)" }}>
              {result.score} / 1000
            </div>
            <pre style={{ whiteSpace: "pre-wrap", fontSize: "13px", color: "var(--text-muted)", marginTop: "12px", fontFamily: "var(--font)" }}>
              {result.feedback}
            </pre>
            {saved && <div style={{ fontSize: "12px", color: "var(--success)", marginTop: "8px" }}>Redação salva e corrigida!</div>}
          </div>
        )}
      </div>
    </div>
  );
}
