// src/components/material-modal.tsx
// Modal de material de estudo. Para a disciplina "redacao", mostra a tela própria
// de redação (tema gerado, textarea, correção por IA). Para demais disciplinas,
// mostra as abas Lei Seca / Resumo / Questões (placeholder para blocos futuros).

import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { generateEssayTheme, correctEssay, type EssayFeedback } from "../lib/ai.functions";
import { insertRedacao, loadRedacoes, updateRedacaoCorrecao, type RedacaoRow } from "../lib/db";

interface MaterialModalProps {
  disciplineId: string;
  disciplineLabel: string;
  topicId?: string;
  topicTitle?: string;
  onClose: () => void;
}

type Tab = "leiseca" | "resumo" | "questoes";

export default function MaterialModal({
  disciplineId,
  disciplineLabel,
  topicId,
  topicTitle,
  onClose,
}: MaterialModalProps) {
  const isRedacao = disciplineId === "redacao";

  if (isRedacao) {
    return <RedacaoModal onClose={onClose} />;
  }

  return (
    <StandardMaterialModal
      disciplineId={disciplineId}
      disciplineLabel={disciplineLabel}
      topicId={topicId}
      topicTitle={topicTitle}
      onClose={onClose}
    />
  );
}

// ---------------------------------------------------------------------------
// RedacaoModal — tema gerado, textarea, correção por IA, histórico
// ---------------------------------------------------------------------------

function RedacaoModal({ onClose }: { onClose: () => void }) {
  const [tema, setTema] = useState<string>("");
  const [texto, setTexto] = useState("");
  const [loading, setLoading] = useState(true);
  const [correcting, setCorrecting] = useState(false);
  const [generatingTema, setGeneratingTema] = useState(false);
  const [feedback, setFeedback] = useState<EssayFeedback | null>(null);
  const [redacoes, setRedacoes] = useState<RedacaoRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [currentRedacaoId, setCurrentRedacaoId] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  const loadRedacaoData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const history = await loadRedacoes();
      setRedacoes(history);
      if (history.length > 0 && !tema) {
        // Load most recent as draft
        const latest = history[0];
        setTema(latest.tema);
        setTexto(latest.texto);
        setCurrentRedacaoId(latest.id);
        if (latest.nota !== null && latest.feedback_json) {
          setFeedback(latest.feedback_json as EssayFeedback);
        }
      } else if (!tema) {
        // Generate a new theme
        const newTema = await generateEssayTheme();
        setTema(newTema);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar redações");
    } finally {
      setLoading(false);
    }
  }, [tema]);

  useEffect(() => {
    void loadRedacaoData();
  }, [loadRedacaoData]);

  const handleGenerateNewTema = useCallback(async () => {
    setGeneratingTema(true);
    setError(null);
    try {
      const newTema = await generateEssayTheme();
      setTema(newTema);
      setTexto("");
      setFeedback(null);
      setCurrentRedacaoId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao gerar tema");
    } finally {
      setGeneratingTema(false);
    }
  }, []);

  const handleCorrect = useCallback(async () => {
    if (!texto.trim() || !tema) return;
    setCorrecting(true);
    setError(null);
    try {
      // Insert or get existing redacao
      let redacaoId = currentRedacaoId;
      if (!redacaoId) {
        const inserted = await insertRedacao(tema, texto);
        redacaoId = inserted.id;
        setCurrentRedacaoId(redacaoId);
      } else {
        // Update text if changed
        await supabase.from("redacoes").update({ texto }).eq("id", redacaoId);
      }

      // Generate correction
      const result = await correctEssay(tema, texto);
      setFeedback(result);

      // Persist correction
      await updateRedacaoCorrecao(redacaoId, result.nota, result);

      // Also create a lancamento so redacao mastery updates (dominio = nota × 10)
      const masteryScore = Math.round(result.nota * 10);
      await supabase.from("lancamentos").insert({
        topic_id: null,
        discipline_id: "redacao",
        mastered: masteryScore,
        cycle_number: 1,
      });

      // Reload history
      const history = await loadRedacoes();
      setRedacoes(history);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao corrigir redação");
    } finally {
      setCorrecting(false);
    }
  }, [tema, texto, currentRedacaoId]);

  const wordCount = texto.trim() ? texto.trim().split(/\s+/).length : 0;

  if (loading) {
    return (
      <ModalShell onClose={onClose} title="Redação">
        <div style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>Carregando...</div>
      </ModalShell>
    );
  }

  return (
    <ModalShell onClose={onClose} title="Redação Dissertativa-Argumentativa">
      {error && (
        <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid var(--error)", borderRadius: "var(--radius-sm)", padding: "12px 16px", marginBottom: "16px" }}>
          <p style={{ fontSize: "14px", color: "var(--error)" }}>{error}</p>
        </div>
      )}

      {/* Theme */}
      <div style={{ marginBottom: "20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
          <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Tema</span>
          <button
            style={{ background: "transparent", color: "var(--primary)", border: "1px solid var(--primary)", fontSize: "12px", padding: "6px 12px" }}
            onClick={() => void handleGenerateNewTema()}
            disabled={generatingTema}
          >
            {generatingTema ? "Gerando..." : "Gerar novo tema"}
          </button>
        </div>
        <div style={{ background: "var(--primary-dim)", borderRadius: "var(--radius-sm)", padding: "16px" }}>
          <p style={{ fontSize: "15px", lineHeight: 1.5 }}>{tema}</p>
        </div>
      </div>

      {/* Textarea */}
      <div style={{ marginBottom: "16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
          <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Sua Redação</span>
          <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>{wordCount} palavras</span>
        </div>
        <textarea
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder="Escreva sua redação dissertativa-argumentativa aqui..."
          rows={12}
          style={{ minHeight: "300px" }}
        />
      </div>

      {/* Submit */}
      <div style={{ display: "flex", gap: "12px", marginBottom: "24px" }}>
        <button
          style={{ background: "var(--primary)", color: "white", flex: 1 }}
          onClick={() => void handleCorrect()}
          disabled={correcting || !texto.trim()}
        >
          {correcting ? "Corrigindo..." : "Enviar para correção"}
        </button>
        <button
          style={{ background: "transparent", color: "var(--text-muted)", border: "1px solid var(--border)" }}
          onClick={() => setShowHistory(!showHistory)}
        >
          {showHistory ? "Ocultar histórico" : `Histórico (${redacoes.length})`}
        </button>
      </div>

      {/* Feedback */}
      {feedback && (
        <div style={{ marginBottom: "24px" }}>
          <h3 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "16px" }}>Correção</h3>
          <div style={{ background: "var(--surface)", borderRadius: "var(--radius)", padding: "20px", border: "1px solid var(--border)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "20px" }}>
              <div style={{
                width: "64px", height: "64px", borderRadius: "50%",
                background: feedback.nota >= 7 ? "var(--success)" : feedback.nota >= 5 ? "var(--warning)" : "var(--error)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "24px", fontWeight: 700, color: "white",
              }}>
                {feedback.nota.toFixed(1)}
              </div>
              <div>
                <p style={{ fontSize: "14px", fontWeight: 600 }}>Nota geral</p>
                <p style={{ fontSize: "12px", color: "var(--text-muted)" }}>de 0 a 10</p>
              </div>
            </div>
            {Object.entries(feedback.criterios).map(([key, val]) => (
              <div key={key} style={{ marginBottom: "12px", paddingBottom: "12px", borderBottom: "1px solid var(--border)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                  <span style={{ fontSize: "13px", fontWeight: 600 }}>{CRITERIO_LABELS[key] ?? key}</span>
                  <span style={{ fontSize: "13px", fontWeight: 600, color: val.nota >= 7 ? "var(--success)" : val.nota >= 5 ? "var(--warning)" : "var(--error)" }}>{val.nota.toFixed(1)}</span>
                </div>
                <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>{val.comentario}</p>
              </div>
            ))}
            <div style={{ marginTop: "12px" }}>
              <p style={{ fontSize: "13px", fontWeight: 600, marginBottom: "4px" }}>Comentário geral</p>
              <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>{feedback.comentario_geral}</p>
            </div>
          </div>
        </div>
      )}

      {/* History */}
      {showHistory && (
        <div>
          <h3 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "16px" }}>Histórico de Redações</h3>
          {redacoes.length === 0 ? (
            <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>Nenhuma redação enviada ainda.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {redacoes.map((r) => (
                <div key={r.id} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", padding: "12px 16px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "13px", fontWeight: 600, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginRight: "12px" }}>{r.tema}</span>
                    {r.nota !== null && (
                      <span style={{ fontSize: "14px", fontWeight: 700, color: r.nota >= 7 ? "var(--success)" : r.nota >= 5 ? "var(--warning)" : "var(--error)" }}>{r.nota.toFixed(1)}</span>
                    )}
                  </div>
                  <p style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "4px" }}>{new Date(r.criado_em).toLocaleDateString("pt-BR")}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </ModalShell>
  );
}

const CRITERIO_LABELS: Record<string, string> = {
  compreensao_tema: "Compreensão do Tema",
  argumentacao: "Argumentação",
  estrutura_coesao: "Estrutura e Coesão",
  norma_culta: "Norma Culta",
  conclusao_proposta: "Conclusão e Proposta",
};

// ---------------------------------------------------------------------------
// StandardMaterialModal — abas Lei Seca / Resumo / Questões (placeholder)
// ---------------------------------------------------------------------------

function StandardMaterialModal({
  disciplineLabel,
  topicTitle,
  onClose,
}: {
  disciplineId: string;
  disciplineLabel: string;
  topicId?: string;
  topicTitle?: string;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<Tab>("resumo");

  const tabs: { id: Tab; label: string }[] = [
    { id: "leiseca", label: "Lei Seca" },
    { id: "resumo", label: "Resumo" },
    { id: "questoes", label: "Questões" },
  ];

  return (
    <ModalShell onClose={onClose} title={`${disciplineLabel}${topicTitle ? ` — ${topicTitle}` : ""}`}>
      <div style={{ display: "flex", gap: "4px", marginBottom: "20px" }}>
        {tabs.map((t) => (
          <button
            key={t.id}
            style={{
              background: tab === t.id ? "var(--primary)" : "transparent",
              color: tab === t.id ? "white" : "var(--text-muted)",
              border: tab === t.id ? "none" : "1px solid var(--border)",
              padding: "8px 16px",
              fontSize: "13px",
            }}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div style={{ padding: "20px", background: "var(--surface)", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)" }}>
        <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>
          Conteúdo de {tabs.find((t) => t.id === tab)?.label} para {disciplineLabel}
          {topicTitle ? ` — ${topicTitle}` : ""} será gerado pela IA em um bloco futuro.
        </p>
      </div>
    </ModalShell>
  );
}

// ---------------------------------------------------------------------------
// ModalShell
// ---------------------------------------------------------------------------

function ModalShell({ onClose, title, children }: { onClose: () => void; title: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)",
        display: "flex", alignItems: "flex-start", justifyContent: "center",
        zIndex: 200, overflowY: "auto", padding: "40px 20px",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "var(--bg)", borderRadius: "var(--radius)", maxWidth: "720px",
          width: "100%", padding: "32px", border: "1px solid var(--border)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
          <h2 style={{ fontSize: "20px", fontWeight: 700 }}>{title}</h2>
          <button
            style={{ background: "transparent", color: "var(--text-muted)", padding: "4px 8px", fontSize: "20px" }}
            onClick={onClose}
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
