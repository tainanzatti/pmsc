import { memo, useMemo, useState } from 'react'
import { Send, Trash2, Filter, ClipboardList } from 'lucide-react'
import { CURRICULUM, ROTATION_ORDER, type Lancamento } from '@/lib/curriculum'
import { SectionLabel } from '@/components/ui-bits'

type Props = {
  lancamentos: Lancamento[]
  onAdd: (l: Omit<Lancamento, 'id'>) => void
  onDelete: (id: string) => void
}

const WINDOWS = [
  { label: 'Tudo', days: null },
  { label: '90 dias', days: 90 },
  { label: '30 dias', days: 30 },
  { label: '7 dias', days: 7 },
] as const

function LancamentoViewInner({ lancamentos, onAdd, onDelete }: Props) {
  const [discId, setDiscId] = useState('')
  const [topicId, setTopicId] = useState('')
  const [quantidade, setQuantidade] = useState('')
  const [acertos, setAcertos] = useState('')
  const [minutos, setMinutos] = useState('60')
  const [data, setData] = useState(() => new Date().toISOString().slice(0, 10))
  const [win, setWin] = useState<number | null>(null)
  const [error, setError] = useState('')

  const topics = discId ? CURRICULUM[discId].topics : []

  const filtered = useMemo(() => {
    const sorted = [...lancamentos].sort((a, b) => (a.data < b.data ? 1 : -1))
    if (win === null) return sorted
    const cutoff = new Date(Date.now() - win * 86400000).toISOString().slice(0, 10)
    return sorted.filter((l) => l.data >= cutoff)
  }, [lancamentos, win])

  function submit() {
    const q = parseInt(quantidade, 10)
    const a = parseInt(acertos, 10)
    const m = parseInt(minutos, 10)
    if (!discId || !topicId) return setError('Selecione disciplina e assunto.')
    if (!q || q <= 0) return setError('Informe a quantidade de questões.')
    if (isNaN(a) || a < 0 || a > q) return setError('Acertos devem estar entre 0 e a quantidade.')
    setError('')
    onAdd({ disciplinaId: discId, topicoId: topicId, quantidade: q, acertos: a, minutos: m || 0, data })
    setQuantidade('')
    setAcertos('')
    setTopicId('')
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border-soft bg-card p-5">
        <SectionLabel icon={ClipboardList}>LANÇAR QUESTÕES</SectionLabel>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-6">
          <div className="lg:col-span-2">
            <FieldLabel>Disciplina</FieldLabel>
            <select
              value={discId}
              onChange={(e) => {
                setDiscId(e.target.value)
                setTopicId('')
              }}
              className="input-base"
            >
              <option value="">Selecionar disciplina</option>
              {ROTATION_ORDER.map((id) => (
                <option key={id} value={id}>
                  {CURRICULUM[id].name}
                </option>
              ))}
            </select>
          </div>
          <div className="lg:col-span-2">
            <FieldLabel>Assunto</FieldLabel>
            <select
              value={topicId}
              onChange={(e) => setTopicId(e.target.value)}
              disabled={!discId}
              className="input-base disabled:opacity-40"
            >
              <option value="">Selecionar assunto</option>
              {topics.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <FieldLabel>Questões</FieldLabel>
            <input
              type="number"
              min={1}
              value={quantidade}
              onChange={(e) => setQuantidade(e.target.value)}
              className="input-base"
              placeholder="0"
            />
          </div>
          <div>
            <FieldLabel>Acertos</FieldLabel>
            <input
              type="number"
              min={0}
              value={acertos}
              onChange={(e) => setAcertos(e.target.value)}
              className="input-base"
              placeholder="0"
            />
          </div>
          <div>
            <FieldLabel>Minutos</FieldLabel>
            <input
              type="number"
              min={0}
              value={minutos}
              onChange={(e) => setMinutos(e.target.value)}
              className="input-base"
            />
          </div>
          <div>
            <FieldLabel>Data</FieldLabel>
            <input
              type="date"
              value={data}
              onChange={(e) => setData(e.target.value)}
              className="input-base"
            />
          </div>
          <div className="flex items-end lg:col-span-4">
            <button
              onClick={submit}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-2.5 font-display text-sm font-bold text-primary-foreground transition hover:brightness-110"
            >
              <Send size={15} /> Enviar
            </button>
          </div>
        </div>
        {error && <p className="mt-2 text-xs text-primary">{error}</p>}
      </div>

      <div className="rounded-2xl border border-border-soft bg-card p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <SectionLabel icon={Filter}>HISTÓRICO</SectionLabel>
          <div className="flex gap-1.5">
            {WINDOWS.map((w) => (
              <button
                key={w.label}
                onClick={() => setWin(w.days)}
                className={`rounded-md px-3 py-1 text-[11px] font-medium transition ${
                  win === w.days
                    ? 'bg-primary text-primary-foreground'
                    : 'border border-border text-muted-foreground hover:text-foreground'
                }`}
              >
                {w.label}
              </button>
            ))}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left font-mono text-[10px] uppercase tracking-wider text-faint">
                <th className="pb-2 pr-4 font-medium">Disciplina</th>
                <th className="pb-2 pr-4 font-medium">Assunto</th>
                <th className="pb-2 pr-4 text-center font-medium">Questões</th>
                <th className="pb-2 pr-4 text-center font-medium">Acertos</th>
                <th className="pb-2 pr-4 text-center font-medium">%</th>
                <th className="pb-2 pr-4 font-medium">Data</th>
                <th className="pb-2 font-medium" />
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-xs text-faint">
                    Nenhum lançamento no período.
                  </td>
                </tr>
              )}
              {filtered.map((l) => {
                const disc = CURRICULUM[l.disciplinaId]
                const topic = disc?.topics.find((t) => t.id === l.topicoId)
                const pct = Math.round((l.acertos / l.quantidade) * 100)
                return (
                  <tr key={l.id} className="border-b border-border-soft/60 text-muted-foreground">
                    <td className="py-2.5 pr-4 font-medium text-foreground">{disc?.name}</td>
                    <td className="py-2.5 pr-4">{topic?.name}</td>
                    <td className="py-2.5 pr-4 text-center font-mono">{l.quantidade}</td>
                    <td className="py-2.5 pr-4 text-center font-mono">{l.acertos}</td>
                    <td
                      className="py-2.5 pr-4 text-center font-mono font-semibold"
                      style={{ color: pct >= 75 ? 'var(--success)' : pct >= 50 ? 'var(--tier-mid)' : 'var(--primary)' }}
                    >
                      {pct}%
                    </td>
                    <td className="py-2.5 pr-4 font-mono text-xs">
                      {l.data.split('-').reverse().join('/')}
                    </td>
                    <td className="py-2.5 text-right">
                      <button
                        onClick={() => onDelete(l.id)}
                        className="rounded p-1 text-faint transition hover:text-primary"
                        title="Excluir"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="mb-1 block text-[11px] font-medium text-muted-foreground">{children}</label>
}

export const LancamentoView = memo(LancamentoViewInner)
