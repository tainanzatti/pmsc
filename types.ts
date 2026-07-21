import { Crown, RotateCcw, Loader2, Check, Moon, Sun, Monitor } from 'lucide-react'
import { memo, useEffect, useState } from 'react'
import { type Lancamento } from '@/lib/curriculum'
import { SectionLabel } from '@/components/ui-bits'
import { useAuth } from '@/lib/auth-context'
import { useTheme, type ThemeMode } from '@/lib/theme-context'
import { supabase } from '@/lib/supabase'

type Props = {
  lancamentos: Lancamento[]
  onReset: () => void
}

function PerfilViewInner({ lancamentos, onReset }: Props) {
  const { user, profile } = useAuth()
  const { theme, setTheme } = useTheme()
  const totalQ = lancamentos.reduce((a, e) => a + e.quantidade, 0)
  const dias = new Set(lancamentos.map((l) => l.data)).size

  const [fullName, setFullName] = useState('')
  const [cpf, setCpf] = useState('')
  const [phone, setPhone] = useState('')
  const [dateOfBirth, setDateOfBirth] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (!profile) return
    setFullName(profile.full_name || '')
    setCpf(profile.cpf || '')
    setDateOfBirth(profile.date_of_birth || '')
    // phone comes back on profile once schema is regenerated
    setPhone(((profile as unknown as { phone?: string }).phone) || '')
  }, [profile])

  async function handleSave() {
    if (!user) return
    setSaving(true)
    setSaved(false)
    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: fullName,
        cpf: cpf || null,
        date_of_birth: dateOfBirth || null,
        phone: phone || null,
      } as never)
      .eq('id', user.id)
    setSaving(false)
    if (error) {
      console.error('Erro ao salvar perfil:', error)
      return
    }
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-border-soft bg-card p-5">
          <SectionLabel>ASSINATURA</SectionLabel>
          <InfoRow label="Status" value="Ativa" valueColor="var(--success)" />
          <InfoRow label="Tipo" value="Operação PMSC — Premium" />
          <InfoRow label="Expiração" value="09/07/2026" />
        </div>
        <div className="rounded-2xl border border-primary/30 bg-card p-5">
          <SectionLabel>PLANO SELECIONADO</SectionLabel>
          <div className="flex items-center gap-2 rounded-lg border border-tier-mastered/40 bg-tier-mastered/10 px-3 py-3">
            <Crown size={16} className="text-tier-good" />
            <span className="font-display text-sm font-bold text-foreground">
              [PMSC] Soldado 2026
            </span>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <MiniStat label="Questões resolvidas" value={totalQ} />
            <MiniStat label="Dias ativos" value={dias} />
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-border-soft bg-card p-5">
        <SectionLabel>INFORMAÇÕES PESSOAIS</SectionLabel>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Nome completo" value={fullName} onChange={setFullName} />
          <Field label="Email" value={user?.email || ''} onChange={() => {}} disabled />
          <Field label="CPF" value={cpf} onChange={setCpf} />
          <Field label="Data de nascimento" value={dateOfBirth} onChange={setDateOfBirth} type="date" />
          <Field label="Celular" value={phone} onChange={setPhone} />
        </div>
        <div className="mt-5 flex items-center justify-end gap-3">
          {saved && (
            <span className="flex items-center gap-1 text-xs text-[color:var(--success)]">
              <Check size={14} /> Salvo
            </span>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2 font-display text-sm font-bold text-primary-foreground transition hover:brightness-110 disabled:opacity-60"
          >
            {saving && <Loader2 size={14} className="animate-spin" />}
            Salvar
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-border-soft bg-card p-5">
        <SectionLabel>APARÊNCIA</SectionLabel>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <p className="max-w-md text-[12px] leading-relaxed text-muted-foreground">
            Escolha o tema da plataforma. A opção Automático segue a preferência do seu sistema
            operacional. Sua escolha é salva na sua conta.
          </p>
          <div className="flex gap-2">
            {([
              { id: 'light', label: 'Claro', Icon: Sun },
              { id: 'dark', label: 'Escuro', Icon: Moon },
              { id: 'auto', label: 'Auto', Icon: Monitor },
            ] as { id: ThemeMode; label: string; Icon: typeof Sun }[]).map(({ id, label, Icon }) => {
              const active = theme === id
              return (
                <button
                  key={id}
                  onClick={() => setTheme(id)}
                  className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition ${
                    active
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border-soft bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground'
                  }`}
                >
                  <Icon size={14} />
                  {label}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-border-soft bg-card p-5">
        <SectionLabel>DADOS DO APLICATIVO</SectionLabel>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <p className="max-w-md text-[12px] leading-relaxed text-muted-foreground">
            Todo o seu histórico de estudos fica salvo na sua conta. Reiniciar apaga permanentemente
            todos os seus lançamentos — a conta volta ao estado inicial (zero questões, zero
            progresso).
          </p>
          <button
            onClick={onReset}
            className="flex items-center gap-2 rounded-lg border border-primary/50 px-4 py-2 text-sm font-medium text-primary transition hover:bg-primary/10"
          >
            <RotateCcw size={14} /> Reiniciar dados
          </button>
        </div>
      </div>
    </div>
  )
}

function InfoRow({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  return (
    <div className="flex items-center justify-between border-b border-border-soft/60 py-2.5 last:border-0">
      <span className="text-[11px] uppercase tracking-wider text-faint">{label}</span>
      <span className="text-sm font-semibold" style={{ color: valueColor || 'var(--foreground)' }}>
        {value}
      </span>
    </div>
  )
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-border-soft bg-secondary p-3">
      <div className="font-mono text-xl font-bold text-foreground">{value}</div>
      <div className="text-[10px] text-faint">{label}</div>
    </div>
  )
}

function Field({
  label,
  value,
  onChange,
  disabled,
  type = 'text',
}: {
  label: string
  value: string
  onChange: (v: string) => void
  disabled?: boolean
  type?: string
}) {
  return (
    <div>
      <label className="mb-1 block text-[11px] font-medium text-muted-foreground">{label}</label>
      <input
        type={type}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className="input-base disabled:opacity-60"
      />
    </div>
  )
}

export const PerfilView = memo(PerfilViewInner)
