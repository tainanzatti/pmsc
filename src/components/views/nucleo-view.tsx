import { useEffect, useState } from "react";
import { useAuth } from "../../lib/auth";
import { loadTopics, loadLancamentos, loadSkipStates, upsertSkipState, createStudySession, createLancamento, loadAIMaterial, createAIMaterial, type Topic, type Lancamento, type SkipState } from "../../lib/db";
import { loadDisciplines, getSkipMultiplier, getFibonacciLabel, type Discipline } from "../../lib/curriculum";
import { supabase } from "../../lib/supabase";

export function NucleoView() {
  const { user } = useAuth();
  const [disciplines, setDisciplines] = useState<Discipline[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [lancamentos, setLancamentos] = useState<Lancamento[]>([]);
  const [skipStates, setSkipStates] = useState<Record<string, SkipState>>({});
  const [loading, setLoading] = useState(true);
  const [activeDiscipline, setActiveDiscipline] = useState<string | null>(null);
  const [material, setMaterial] = useState<string | null>(null);
  const [materialLoading, setMaterialLoading] = useState(false);
  const [showTopics, setShowTopics] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const [d, t, l, s] = await Promise.all([
          loadDisciplines(),
          loadTopics(),
          loadLancamentos(user.id),
          loadSkipStates(user.id),
        ]);
        setDisciplines(d);
        setTopics(t);
        setLancamentos(l);
        setSkipStates(s);
      } catch (err) {
        console.error("Nucleo load error:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  async function handleSkip(discipline: string) {
    if (!user) return;
    const current = skipStates[discipline];
    const newSkipCount = (current?.skip_count || 0) + 1;
    const newMultiplier = getSkipMultiplier(newSkipCount);
    try {
      await upsertSkipState(user.id, discipline, newSkipCount, newMultiplier);
      const newSkipState: SkipState = {
        discipline_id: discipline,
        skip_count: newSkipCount,
        urgency_multiplier: newMultiplier,
        user_id: user.id,
        updated_at: new Date().toISOString(),
      };
      setSkipStates((prev) => ({ ...prev, [discipline]: newSkipState }));
    } catch (err) {
      console.error("Skip error:", err);
    }
  }

  async function handleStudy(discipline: string) {
    if (!user) return;
    setActiveDiscipline(discipline);
    setMaterialLoading(true);
    setMaterial(null);
    try {
      const disc = disciplines.find((d) => d.id === discipline)!;
      const discTopics = topics.filter((t) => t.discipline_id === discipline && t.parent_id === null);
      const topic = discTopics[0] || null;

      let aiMaterial = await loadAIMaterial(user.id, discipline, "resumo");
      if (!aiMaterial) {
        const content = `# ${disc.name}\n\nConteúdo de estudo para ${disc.name}. Revise os conceitos principais e pratique com questões relacionadas.\n\n## Pontos-chave\n- Conceitos fundamentais\n- Aplicações práticas\n- Casos especiais\n\n## Dicas\n- Pratique com exercícios\n- Revise periodicamente\n- Use flashcards para memorização`;
        aiMaterial = await createAIMaterial(user.id, discipline, "resumo", content, topic?.id || null);
      }
      setMaterial(aiMaterial.content);

      const flashcardRows = [
        { user_id: user.id, disciplina_id: discipline, topico_id: topic?.id || null, pergunta: `O que é ${disc.name}?`, resposta: `${disc.name} é uma disciplina fundamental que envolve princípios teóricos e aplicações práticas.`, caixa: 1, proxima_revisao: new Date().toISOString().split("T")[0] },
        { user_id: user.id, disciplina_id: discipline, topico_id: topic?.id || null, pergunta: `Defina um conceito central de ${disc.name}.`, resposta: `Um conceito central de ${disc.name} pode ser definido como um conjunto de regras e princípios.`, caixa: 1, proxima_revisao: new Date().toISOString().split("T")[0] },
        { user_id: user.id, disciplina_id: discipline, topico_id: topic?.id || null, pergunta: `Qual a importância de estudar ${disc.name}?`, resposta: `Estudar ${disc.name} é essencial para compreender tópicos avançados e resolver questões de prova.`, caixa: 1, proxima_revisao: new Date().toISOString().split("T")[0] },
      ];
      const { error: fcError } = await supabase.from("flashcards").insert(flashcardRows);
      if (fcError) console.error("Flashcard insert error:", fcError);

      await createStudySession(user.id, discipline, topic?.id || null, 30);
      await createLancamento(user.id, discipline, 50, topic?.id || null);
    } catch (err) {
      console.error("Study error:", err);
    } finally {
      setMaterialLoading(false);
    }
  }

  if (loading) return <div style={{ padding: "40px", color: "var(--text-muted)" }}>Carregando...</div>;

  return (
    <div style={{ animation: "fadeIn 0.3s ease" }}>
      <h1 style={{ fontSize: "24px", fontWeight: 700, marginBottom: "24px" }}>Núcleo de Estudo</h1>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "16px" }}>
        {disciplines.map((disc) => {
          const skipState = skipStates[disc.id];
          const skipCount = skipState?.skip_count || 0;
          const multiplier = skipState?.urgency_multiplier || 1.0;
          const discLancamentos = lancamentos.filter((l) => l.discipline_id === disc.id);
          const discMastery = discLancamentos.length > 0
            ? Math.round(discLancamentos.reduce((sum, l) => sum + l.mastered, 0) / discLancamentos.length)
            : 0;
          const discTopics = topics.filter((t) => t.discipline_id === disc.id);
          const isExpanded = showTopics === disc.id;
          return (
            <div key={disc.id} style={{ background: "var(--surface)", borderRadius: "var(--radius)", padding: "20px", border: "1px solid var(--border)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                <span style={{ fontSize: "24px" }}>{disc.icon}</span>
                <h3 style={{ fontSize: "16px", fontWeight: 600 }}>{disc.name}</h3>
                {!disc.is_discursive && (
                  <span style={{ fontSize: "11px", color: "var(--text-muted)", marginLeft: "auto", background: "var(--bg)", padding: "2px 8px", borderRadius: "10px" }}>
                    {disc.question_count} questões
                  </span>
                )}
              </div>
              <p style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "4px" }}>
                Domínio: {discMastery}% • {discLancamentos.length} lançamentos • {discTopics.length} tópicos
              </p>
              {skipCount > 0 && (
                <p style={{ fontSize: "12px", color: "var(--warning)", marginBottom: "4px" }}>
                  Pulada {skipCount}x • Multiplicador: {multiplier.toFixed(1)}x
                </p>
              )}
              <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
                <button onClick={() => handleStudy(disc.id)} style={{ background: "var(--primary)", color: "#fff", flex: 1, fontSize: "13px" }}>
                  Estudar
                </button>
                <button
                  onClick={() => handleSkip(disc.id)}
                  style={{ background: "transparent", color: "var(--text-muted)", border: "1px solid var(--border)", fontSize: "13px", padding: "8px 12px" }}
                >
                  Pular
                </button>
                <button
                  onClick={() => setShowTopics(isExpanded ? null : disc.id)}
                  style={{ background: "transparent", color: "var(--text-muted)", border: "1px solid var(--border)", fontSize: "13px", padding: "8px 12px" }}
                >
                  {isExpanded ? "Ocultar" : "Tópicos"}
                </button>
              </div>

              {isExpanded && (
                <div style={{ marginTop: "16px", borderTop: "1px solid var(--border)", paddingTop: "12px" }}>
                  {discTopics.map((topic) => {
                    const children = discTopics.filter((t) => t.parent_id === topic.id);
                    return (
                      <div key={topic.id} style={{ marginBottom: "8px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <span style={{ fontSize: "13px", fontWeight: 500 }}>{topic.title}</span>
                          <span style={{
                            fontSize: "10px",
                            padding: "1px 6px",
                            borderRadius: "8px",
                            background: topic.fibonacci_weight >= 55 ? "rgba(239,68,68,0.15)" : topic.fibonacci_weight >= 21 ? "rgba(245,158,11,0.15)" : "rgba(34,197,94,0.15)",
                            color: topic.fibonacci_weight >= 55 ? "var(--error)" : topic.fibonacci_weight >= 21 ? "var(--warning)" : "var(--success)",
                          }}>
                            {topic.fibonacci_weight} • {getFibonacciLabel(topic.fibonacci_weight)}
                          </span>
                        </div>
                        {children.length > 0 && (
                          <div style={{ marginLeft: "16px", marginTop: "4px" }}>
                            {children.map((child) => (
                              <div key={child.id} style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "2px" }}>
                                <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>{child.title}</span>
                                <span style={{
                                  fontSize: "10px",
                                  padding: "1px 5px",
                                  borderRadius: "8px",
                                  background: "var(--bg)",
                                  color: "var(--text-muted)",
                                }}>
                                  {child.fibonacci_weight}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {activeDiscipline && (
        <div style={{ marginTop: "32px", background: "var(--surface)", borderRadius: "var(--radius)", padding: "24px", border: "1px solid var(--border)" }}>
          <h2 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "16px" }}>
            {disciplines.find((d) => d.id === activeDiscipline)?.icon} {disciplines.find((d) => d.id === activeDiscipline)?.name}
          </h2>
          {materialLoading ? (
            <div style={{ color: "var(--text-muted)" }}>Carregando material...</div>
          ) : (
            <pre style={{ whiteSpace: "pre-wrap", fontSize: "14px", lineHeight: 1.6, fontFamily: "var(--font)" }}>{material}</pre>
          )}
        </div>
      )}
    </div>
  );
}
