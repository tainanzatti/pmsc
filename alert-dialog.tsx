import { useState } from 'react'
import { X, CheckCircle2, ArrowRight } from 'lucide-react'
import { CURRICULUM, type AllocatedTopic, type Lancamento } from '@/lib/curriculum'

type Draft = { quantidade: string; acertos: string }

export function ConcluirModal({
  discId,
  topics,
  nextDiscName,
  onConfirm,
  onClose,
}: {
  discId: string
  topics: AllocatedTopic[]
  nextDiscName: string
  onConfirm: (entries: Omit<Lancamento, 'id'>[]) => void
  onClose: () => void
}) {
  const discName = CURRICULUM[discId].name
  const today = new Date().toISOString().slice(0, 10)
  const [drafts, setDrafts] = useState<Record<string, Draft>>(
    Object.fromEntries(topics.map((t) => [t.id, { quantidade: '10', acertos: '' }]))
  )

  function update(id: string, patch: Partial<Draft>) {
    setDrafts((p) => ({ ...p, [id]: { ...p[id], ...patch } }))
  }

  const entries = topics
    .map((t) => {
      const d = drafts[t.id]
      const q = Number(d.quantidade)
      const a = Number(d.acertos)
      return { t, q, a }
    })
    .filter(({ q, a, t }) => q > 0 && a >= 0 && a <= q && drafts[t.id].acertos !== '')

  const valid = entries.length > 0

  function confirm() {
    if (!valid) return
    onConfirm(
      entries.map(({ t, q, a }) => ({
        disciplinaId: discId,
        topicoId: t.id,
        quantidade: q,
        acertos: a,
        minutos: t.minutes,
        data: today,
      }))
    )
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="flex max-h-[88vh] w-full flex-col overflow-hidden rounded-t-2xl border border-border bg-card sm:mx-4 sm:max-w-md sm:rounded-2xl animate-in slide-in-from-bottom-4 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between border-b border-border-soft px-5 pt-5 pb-4">
          <div>
            <div className="mb-1 font-mono text-[10px] tracking-[0.14em] text-faint uppercase">
              Concluir sessão de estudo
            </div>
            <div className="font-display text-base font-bold text-foreground">{discName}</div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-faint transition hover:scale-110 hover:text-foreground"
            aria-label="Fechar"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
          <p className="text-[12px] leading-relaxed text-muted-foreground">
            Registre seu resultado nos tópicos desta hora. Ao concluir, o ciclo avança
            automaticamente para <span className="font-semibold text-foreground">{nextDiscName}</span>.
          </p>

          {topics.map((t) => (
            <div key={t.id} className="rounded-lg border border-border-soft bg-secondary p-3">
              <div className="mb-2 flex items-center gap-2">
                <span className="flex-1 text-[13px] font-medium text-foreground">{t.name}</span>
                <span className="shrink-0 font-mono text-[10px] text-faint">{t.minutes}′</span>
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="mb-1 block font-mono text-[9px] tracking-wide text-faint uppercase">
                    Questões
                  </label>
                  <input
                    type="number"
                    min="0"
                    inputMode="numeric"
                    value={drafts[t.id].quantidade}
                    onChange={(e) => update(t.id, { quantidade: e.target.value })}
                    className="w-full rounded-md border border-input bg-card px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="mb-1 block font-mono text-[9px] tracking-wide text-faint uppercase">
                    Acertos
                  </label>
                  <input
                    type="number"
                    min="0"
                    inputMode="numeric"
                    placeholder="0"
                    value={drafts[t.id].acertos}
                    onChange={(e) => update(t.id, { acertos: e.target.value })}
                    className="w-full rounded-md border border-input bg-card px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-border-soft p-4">
          <button
            onClick={confirm}
            disabled={!valid}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-3 font-display text-sm font-bold uppercase tracking-wide text-primary-foreground transition enabled:hover:brightness-110 disabled:opacity-40"
          >
            <CheckCircle2 size={16} />
            Concluir e avançar
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}
