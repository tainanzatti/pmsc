import { memo, useMemo } from 'react'
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts'
import { ClipboardCheck, CheckCircle2, XCircle, Gauge, Zap, TrendingUp } from 'lucide-react'
import { CURRICULUM, ROTATION_ORDER, disciplineAggregate, type Lancamento } from '@/lib/curriculum'
import { SectionLabel } from '@/components/ui-bits'

type Props = { lancamentos: Lancamento[] }

const TIME_WINDOWS = [90, 60, 30, 15, 7]

function pctInWindow(lancamentos: Lancamento[], discId: string, days: number): number | null {
  const cutoff = new Date(Date.now() - days * 86400000).toISOString().slice(0, 10)
  const entries = lancamentos.filter((l) => l.disciplinaId === discId && l.data >= cutoff)
  const q = entries.reduce((a, e) => a + e.quantidade, 0)
  const a = entries.reduce((s, e) => s + e.acertos, 0)
  return q > 0 ? Math.round((a / q) * 100) : null
}

function DesempenhoViewInner({ lancamentos }: Props) {
  const totalQ = lancamentos.reduce((a, e) => a + e.quantidade, 0)
  const totalA = lancamentos.reduce((a, e) => a + e.acertos, 0)
  const totalMin = lancamentos.reduce((a, e) => a + (e.minutos || 0), 0)
  const pct = totalQ > 0 ? Math.round((totalA / totalQ) * 100) : 0
  const qHora = totalMin > 0 ? (totalQ / (totalMin / 60)).toFixed(1) : '0.0'

  const radarData = ROTATION_ORDER.filter((id) => CURRICULUM[id].questoes !== 'P2').map((id) => ({
    disciplina: CURRICULUM[id].name.replace('Direito ', 'D. ').replace('Legislação ', 'Leg. '),
    valor: disciplineAggregate(lancamentos, id).pct ?? 0,
  }))

  const monthly = useMemo(() => {
    const map = new Map<string, { q: number; a: number }>()
    lancamentos.forEach((l) => {
      const key = l.data.slice(0, 7)
      const cur = map.get(key) || { q: 0, a: 0 }
      cur.q += l.quantidade
      cur.a += l.acertos
      map.set(key, cur)
    })
    return [...map.entries()]
      .sort((a, b) => (a[0] < b[0] ? -1 : 1))
      .map(([month, v]) => ({
        month: month.split('-').reverse().join('/'),
        pct: v.q > 0 ? Math.round((v.a / v.q) * 100) : 0,
      }))
  }, [lancamentos])

  const stats = [
    { label: 'Questões resolvidas', value: totalQ, icon: ClipboardCheck, accent: '#4a86c7' },
    { label: 'Questões certas', value: totalA, icon: CheckCircle2, accent: 'var(--success)' },
    { label: 'Questões erradas', value: totalQ - totalA, icon: XCircle, accent: 'var(--primary)' },
    { label: 'Taxa de acertos', value: `${pct}%`, icon: Gauge, accent: 'var(--tier-good)' },
    { label: 'Questões/hora', value: `${qHora}/h`, icon: Zap, accent: 'var(--tier-mid)' },
  ]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {stats.map((s) => (
          <div key={s.label} className="card-hover rounded-xl border border-border-soft bg-card p-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[11px] font-medium text-muted-foreground">{s.label}</span>
              <s.icon size={14} style={{ color: s.accent }} />
            </div>
            <div className="font-mono text-2xl font-bold text-foreground">{s.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-border-soft bg-card p-5">
          <SectionLabel icon={Gauge}>DESEMPENHO POR DISCIPLINA</SectionLabel>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData} outerRadius="72%">
                <PolarGrid stroke="var(--border)" />
                <PolarAngleAxis
                  dataKey="disciplina"
                  tick={{ fill: 'var(--muted-foreground)', fontSize: 9 }}
                />
                <Radar
                  dataKey="valor"
                  stroke="var(--primary)"
                  fill="var(--primary)"
                  fillOpacity={0.35}
                />
                <Tooltip
                  contentStyle={{
                    background: 'var(--card-raised)',
                    border: '1px solid var(--border)',
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  formatter={(v: number) => [`${v}%`, 'Acertos']}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-border-soft bg-card p-5">
          <SectionLabel icon={TrendingUp}>PERFORMANCE MENSAL</SectionLabel>
          <div className="h-72">
            {monthly.length === 0 ? (
              <div className="flex h-full items-center justify-center text-xs text-faint">
                Sem dados suficientes.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthly} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="month" tick={{ fill: 'var(--faint)', fontSize: 10 }} />
                  <YAxis domain={[0, 100]} tick={{ fill: 'var(--faint)', fontSize: 10 }} />
                  <Tooltip
                    contentStyle={{
                      background: 'var(--card-raised)',
                      border: '1px solid var(--border)',
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                    formatter={(v: number) => [`${v}%`, 'Acertos']}
                  />
                  <Line
                    type="monotone"
                    dataKey="pct"
                    stroke="#4a86c7"
                    strokeWidth={2}
                    dot={{ r: 3, fill: '#4a86c7' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-border-soft bg-card p-5">
        <SectionLabel>DETALHAMENTO POR JANELA DE TEMPO</SectionLabel>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left font-mono text-[10px] uppercase tracking-wider text-faint">
                <th className="pb-2 pr-4 font-medium">Disciplina</th>
                <th className="pb-2 pr-4 text-center font-medium">Total</th>
                <th className="pb-2 pr-4 text-center font-medium">Acertos</th>
                <th className="pb-2 pr-4 text-center font-medium">Erros</th>
                <th className="pb-2 pr-4 text-center font-medium">% Geral</th>
                {TIME_WINDOWS.map((w) => (
                  <th key={w} className="pb-2 pr-4 text-center font-medium text-primary">
                    {w}d
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ROTATION_ORDER.map((id) => {
                const agg = disciplineAggregate(lancamentos, id)
                return (
                  <tr key={id} className="border-b border-border-soft/60 text-muted-foreground">
                    <td className="py-2.5 pr-4 font-medium text-foreground">{CURRICULUM[id].name}</td>
                    <td className="py-2.5 pr-4 text-center font-mono">{agg.quantidade}</td>
                    <td className="py-2.5 pr-4 text-center font-mono">{agg.acertos}</td>
                    <td className="py-2.5 pr-4 text-center font-mono">
                      {agg.quantidade - agg.acertos}
                    </td>
                    <td className="py-2.5 pr-4 text-center font-mono font-semibold">
                      <PctCell value={agg.pct} />
                    </td>
                    {TIME_WINDOWS.map((w) => (
                      <td key={w} className="py-2.5 pr-4 text-center font-mono text-xs">
                        <PctCell value={pctInWindow(lancamentos, id, w)} />
                      </td>
                    ))}
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

function PctCell({ value }: { value: number | null }) {
  if (value === null) return <span className="text-faint">—</span>
  const color = value >= 75 ? 'var(--success)' : value >= 50 ? 'var(--tier-mid)' : 'var(--primary)'
  return <span style={{ color }}>{value}%</span>
}

export const DesempenhoView = memo(DesempenhoViewInner)
