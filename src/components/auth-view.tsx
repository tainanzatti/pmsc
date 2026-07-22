import { useState } from "react";
import { useAuth } from "../lib/auth";
import { formatCPF, formatPhone, validateCPF, validatePhone, validateEmail, validatePassword, validateBirthDate } from "../lib/validators";

export function AuthView() {
  const { signUp, signIn } = useAuth();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [apelido, setApelido] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [cpf, setCpf] = useState("");
  const [telefone, setTelefone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (mode === "signup") {
      if (!fullName.trim()) {
        setError("Nome completo é obrigatório.");
        return;
      }
      if (!validateEmail(email)) {
        setError("Digite um e-mail válido.");
        return;
      }
      if (!validatePassword(password)) {
        setError("A senha deve ter pelo menos 6 caracteres.");
        return;
      }
      if (password !== confirmPassword) {
        setError("As senhas não coincidem.");
        return;
      }
      const bdResult = validateBirthDate(birthDate);
      if (!bdResult.valid) {
        setError(bdResult.error || "Data de nascimento inválida.");
        return;
      }
      if (!cpf.trim()) {
        setError("CPF é obrigatório.");
        return;
      }
      if (!validateCPF(cpf)) {
        setError("CPF inválido. Verifique os dígitos.");
        return;
      }
      if (!telefone.trim()) {
        setError("Telefone é obrigatório.");
        return;
      }
      if (!validatePhone(telefone)) {
        setError("Telefone inválido. Use o formato (00) 00000-0000.");
        return;
      }
    } else {
      if (!validateEmail(email)) {
        setError("Digite um e-mail válido.");
        return;
      }
      if (!password) {
        setError("Senha é obrigatória.");
        return;
      }
    }

    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await signUp({
          email,
          password,
          fullName: fullName.trim(),
          apelido: apelido.trim() || undefined,
          birthDate,
          cpf: cpf.replace(/\D/g, ""),
          telefone: telefone.replace(/\D/g, ""),
        });
        if (error) {
          setError(error);
          return;
        }
      } else {
        const { error } = await signIn(email, password);
        if (error) {
          setError(error);
          return;
        }
      }
    } catch {
      setError("Erro de conexão. Verifique sua internet e tente novamente.");
    } finally {
      setLoading(false);
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

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
      <div style={{ width: "100%", maxWidth: mode === "signup" ? "480px" : "400px" }}>
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <h1 style={{ fontSize: "28px", fontWeight: 700, marginBottom: "8px" }}>Operação PMSC</h1>
          <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>Soldado 2026 — Sistema de Estudos</p>
        </div>

        <div style={{ background: "var(--surface)", borderRadius: "var(--radius)", padding: "32px", border: "1px solid var(--border)" }}>
          <div style={{ display: "flex", gap: "8px", marginBottom: "24px" }}>
            <button
              onClick={() => { setMode("login"); setError(null); }}
              style={{
                flex: 1,
                background: mode === "login" ? "var(--primary)" : "transparent",
                color: mode === "login" ? "#fff" : "var(--text-muted)",
                border: `1px solid ${mode === "login" ? "var(--primary)" : "var(--border)"}`,
              }}
            >
              Entrar
            </button>
            <button
              onClick={() => { setMode("signup"); setError(null); }}
              style={{
                flex: 1,
                background: mode === "signup" ? "var(--primary)" : "transparent",
                color: mode === "signup" ? "#fff" : "var(--text-muted)",
                border: `1px solid ${mode === "signup" ? "var(--primary)" : "var(--border)"}`,
              }}
            >
              Criar Conta
            </button>
          </div>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {mode === "signup" && (
              <>
                <div>
                  <label style={labelStyle}>Nome completo *</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Seu nome completo"
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Apelido (opcional)</label>
                  <input
                    type="text"
                    value={apelido}
                    onChange={(e) => setApelido(e.target.value)}
                    placeholder="Como gostaria de ser chamado"
                    style={inputStyle}
                  />
                </div>
              </>
            )}

            <div>
              <label style={labelStyle}>E-mail *</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                required
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Senha *</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                required
                minLength={6}
                style={inputStyle}
              />
            </div>

            {mode === "signup" && (
              <>
                <div>
                  <label style={labelStyle}>Confirmar senha *</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Digite a senha novamente"
                    required
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Data de nascimento *</label>
                  <input
                    type="date"
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    max={new Date().toISOString().split("T")[0]}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>CPF *</label>
                  <input
                    type="text"
                    value={cpf}
                    onChange={(e) => setCpf(formatCPF(e.target.value))}
                    placeholder="000.000.000-00"
                    maxLength={14}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Telefone *</label>
                  <input
                    type="tel"
                    value={telefone}
                    onChange={(e) => setTelefone(formatPhone(e.target.value))}
                    placeholder="(00) 00000-0000"
                    maxLength={15}
                    style={inputStyle}
                  />
                </div>
              </>
            )}

            {error && (
              <div style={{ color: "var(--error)", fontSize: "13px", padding: "10px 12px", background: "rgba(239,68,68,0.1)", borderRadius: "var(--radius-sm)", border: "1px solid rgba(239,68,68,0.3)" }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                background: "var(--primary)",
                color: "#fff",
                fontWeight: 600,
                padding: "14px",
                width: "100%",
                fontSize: "15px",
              }}
            >
              {loading ? "Aguarde..." : mode === "login" ? "Entrar" : "Criar Conta"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
