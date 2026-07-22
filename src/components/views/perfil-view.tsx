import { useState, useEffect } from "react";
import { useAuth } from "../../lib/auth";
import { resetUserProgress, loadLancamentos, loadStudySessions, loadRanking, type Lancamento, type StudySession, type RankingUser } from "../../lib/db";
import { formatCPF, formatPhone, validatePhone, validateBirthDate } from "../../lib/validators";
import { getLeague, getLeagueProgress, getNextLeague } from "../../lib/xp";

export function PerfilView() {
  const { profile, updateProfile, user, refreshProfile } = useAuth();
  const [fullName, setFullName] = useState(profile?.full_name || "");
  const [apelido, setApelido] = useState(profile?.apelido || "");
  const [telefone, setTelefone] = useState(profile?.telefone ? formatPhone(profile.telefone) : "");
  const [birthDate, setBirthDate] = useState(profile?.birth_date || "");
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [resetting, setResetting] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);

  const [lancamentos, setLancamentos] = useState<Lancamento[]>([]);
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [ranking, setRanking] = useState<RankingUser[]>([]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const [l, s, r] = await Promise.all([
          loadLancamentos(user.id),
          loadStudySessions(user.id),
          loadRanking("all"),
        ]);
        setLancamentos(l);
        setSessions(s);
        setRanking(r);
      } catch (err) {
        console.error("Perfil load error:", err);
      }
    })();
  }, [user]);

  async function handleSave() {
    setEditError(null);
    setSaving(true);
    try {
      if (!fullName.trim()) {
        setEditError("Nome completo é obrigatório.");
        setSaving(false);
        return;
      }
      const updates: Record<string, string | null> = {
        full_name: fullName.trim(),
        apelido: apelido.trim() || null,
      };
      if (telefone) {
        if (!validatePhone(telefone)) {
          setEditError("Telefone inválido. Use o formato (00) 00000-0000.");
          setSaving(false);
          return;
        }
        updates.telefone = telefone.replace(/\D/g, "");
      } else {
        updates.telefone = null;
      }
      if (birthDate) {
        const bdResult = validateBirthDate(birthDate);
        if (!bdResult.valid) {
          setEditError(bdResult.error || "Data de nascimento inválida.");
          setSaving(false);
          return;
        }
        updates.birth_date = birthDate;
      } else {
        updates.birth_date = null;
      }

      const { error } = await updateProfile(updates);
      if (error) {
        setEditError("Erro ao salvar. Tente novamente.");
      } else {
        setSavedMsg(true);
        setTimeout(() => setSavedMsg(false), 3000);
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleReset() {
    setResetError(null);
    setResetting(true);
    try {
      await resetUserProgress();
      await refreshProfile();
      setLancamentos([]);
      setSessions([]);
      setShowResetConfirm(false);
      setSavedMsg(true);
      setTimeout(() => setSavedMsg(false), 3000);
    } catch {
      setResetError("Erro ao resetar progresso. Tente novamente.");
    } finally {
      setResetting(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "12px",
    borderRadius: "var(--radius-sm)",
    border: "1px solid var(--border)",
    background: "var(--bg)",
    color: "var(--text)",
    fontSize: "14px",
  };
  const labelStyle: React.CSSProperties = {
    fontSize: "13px",
    color: "var(--text-muted)",
    display: "block",
    marginBottom: "6px",
  };
  const fieldStyle: React.CSSProperties = {
    width: "100%",
    padding: "12px",
    borderRadius: "var(--radius-sm)",
    border: "1px solid var(--border)",
    background: "var(--surface-hover)",
    color: "var(--text-muted)",
    fontSize: "14px",
  };

  const xp = profile?.xp || 0;
  const league = getLeague(xp);
  const leagueProgress = getLeagueProgress(xp);
  const nextLeague = getNextLeague(xp);
  const myPosition = ranking.findIndex((u) => u.id === user?.id) + 1;
  const totalQuestions = lancamentos.reduce((sum, l) => sum + l.total_questions, 0);
  const totalCorrect = lancamentos.reduce((sum, l) => sum + l.correct_count, 0);
  const avgAccuracy = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;
  const totalMinutes = sessions.reduce((sum, s) => sum + s.duration_minutes, 0);

  const createdDate = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })
    : "—";

  return (
    <div style={{ animation: "fadeIn 0.3s ease", maxWidth: "700px" }}>
      <h1 style={{ fontSize: "24px", fontWeight: 700, marginBottom: "24px" }}>Perfil</h1>

      {/* Public Profile Card */}
      <div style={{ background: "var(--surface)", borderRadius: "var(--radius)", padding: "24px", border: "1px solid var(--border)", marginBottom: "24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "20px" }}>
          <div style={{
            width: "64px", height: "64px", borderRadius: "50%",
            background: league.color, display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "28px", flexShrink: 0,
          }}>
            {league.icon}
          </div>
          <div>
            <h2 style={{ fontSize: "20px", fontWeight: 700 }}>{profile?.full_name || "—"}</h2>
            <p style={{ fontSize: "14px", color: "var(--text-muted)" }}>
              {profile?.apelido ? `"${profile.apelido}" • ` : ""}{league.name} • {xp.toLocaleString()} XP
            </p>
            {myPosition > 0 && <p style={{ fontSize: "13px", color: "var(--primary)", marginTop: "2px" }}>Posição #{myPosition} no ranking</p>}
          </div>
        </div>

        {/* League progress bar */}
        {nextLeague && (
          <div style={{ marginBottom: "16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "var(--text-muted)", marginBottom: "4px" }}>
              <span>{league.icon} {league.name}</span>
              <span>{nextLeague.icon} {nextLeague.name}</span>
            </div>
            <div style={{ height: "8px", background: "var(--bg)", borderRadius: "4px", overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${leagueProgress.percent}%`, background: league.color, borderRadius: "4px", transition: "width 0.3s ease" }} />
            </div>
            <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "4px", textAlign: "center" }}>
              {leagueProgress.current}/{leagueProgress.needed} XP para {nextLeague.name}
            </div>
          </div>
        )}

        {/* Stats grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: "12px" }}>
          <StatBox label="XP Total" value={xp.toLocaleString()} />
          <StatBox label="Posição" value={myPosition > 0 ? `#${myPosition}` : "—"} />
          <StatBox label="Questões" value={totalQuestions} />
          <StatBox label="Aproveitamento" value={`${avgAccuracy}%`} />
          <StatBox label="Horas estudadas" value={`${Math.floor(totalMinutes / 60)}h`} />
          <StatBox label="Sequência atual" value={`${profile?.current_streak || 0} dias`} />
          <StatBox label="Maior sequência" value={`${profile?.longest_streak || 0} dias`} />
          <StatBox label="Ingresso" value={createdDate} />
        </div>
      </div>

      {/* Account info */}
      <div style={{ background: "var(--surface)", borderRadius: "var(--radius)", padding: "24px", border: "1px solid var(--border)", marginBottom: "24px" }}>
        <h2 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "20px" }}>Informações da conta</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div>
            <label style={labelStyle}>E-mail</label>
            <div style={fieldStyle}>{profile?.email || "—"}</div>
          </div>
          <div>
            <label style={labelStyle}>CPF</label>
            <div style={fieldStyle}>{profile?.cpf ? formatCPF(profile.cpf) : "—"}</div>
          </div>
          <div>
            <label style={labelStyle}>Data de criação da conta</label>
            <div style={fieldStyle}>{createdDate}</div>
          </div>
        </div>
      </div>

      {/* Edit form */}
      <div style={{ background: "var(--surface)", borderRadius: "var(--radius)", padding: "24px", border: "1px solid var(--border)", marginBottom: "24px" }}>
        <h2 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "20px" }}>Editar dados</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div>
            <label style={labelStyle}>Nome completo</label>
            <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Apelido</label>
            <input type="text" value={apelido} onChange={(e) => setApelido(e.target.value)} placeholder="Como gostaria de ser chamado" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Telefone</label>
            <input type="tel" value={telefone} onChange={(e) => setTelefone(formatPhone(e.target.value))} placeholder="(00) 00000-0000" maxLength={15} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Data de nascimento</label>
            <input type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} max={new Date().toISOString().split("T")[0]} style={inputStyle} />
          </div>
        </div>

        {editError && (
          <div style={{ color: "var(--error)", fontSize: "13px", marginTop: "12px", padding: "8px 12px", background: "rgba(239,68,68,0.1)", borderRadius: "var(--radius-sm)" }}>
            {editError}
          </div>
        )}

        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "20px" }}>
          <button onClick={handleSave} disabled={saving} style={{ background: "var(--primary)", color: "#fff", fontWeight: 600, padding: "12px 24px" }}>
            {saving ? "Salvando..." : "Salvar"}
          </button>
          {savedMsg && <span style={{ color: "var(--success)", fontSize: "13px" }}>Salvo!</span>}
        </div>
      </div>

      {/* Danger zone */}
      <div style={{ background: "var(--surface)", borderRadius: "var(--radius)", padding: "24px", border: "1px solid var(--error)" }}>
        <h2 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "8px", color: "var(--error)" }}>Zona de Perigo</h2>
        <p style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "16px" }}>
          Resetar todo o progresso de estudo: lançamentos, flashcards, redações, sessões, estado de disciplinas e materiais de IA. Esta ação não pode ser desfeita.
        </p>
        {!showResetConfirm ? (
          <button onClick={() => setShowResetConfirm(true)} style={{ background: "transparent", border: "1px solid var(--error)", color: "var(--error)", fontWeight: 600, padding: "12px 24px" }}>
            Resetar Progresso
          </button>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <p style={{ fontSize: "14px", fontWeight: 500 }}>Tem certeza? Todos os dados de estudo serão apagados permanentemente.</p>
            {resetError && <div style={{ color: "var(--error)", fontSize: "13px" }}>{resetError}</div>}
            <div style={{ display: "flex", gap: "8px" }}>
              <button onClick={handleReset} disabled={resetting} style={{ background: "var(--error)", color: "#fff", fontWeight: 600, padding: "12px 24px" }}>
                {resetting ? "Resetando..." : "Sim, resetar tudo"}
              </button>
              <button onClick={() => { setShowResetConfirm(false); setResetError(null); }} style={{ background: "transparent", border: "1px solid var(--border)", color: "var(--text-muted)", padding: "12px 24px" }}>
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatBox({ label, value }: { label: string; value: string | number }) {
  return (
    <div style={{ padding: "12px", background: "var(--bg)", borderRadius: "var(--radius-sm)", textAlign: "center" }}>
      <div style={{ fontSize: "18px", fontWeight: 700 }}>{value}</div>
      <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>{label}</div>
    </div>
  );
}
