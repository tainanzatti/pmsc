import { memo, useEffect, useState } from 'react'
import { Trophy, Percent, CalendarRange, Clock, ListChecks, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'

type RankingRow = {
  user_id: string
  full_name: string | null
  total_questoes: number
  total_acertos: number
  total_minutos: number
  dias_ativos: number
  pct_acertos: number
}

type Metric = 'questoes' | 'pct' | 'dias' | 'tempo'

const METRICS: { id: Metric; label: string; icon: typeof Trophy; format: (r: RankingRow) => string; sortKey: (r: RankingRow) => number }[] = [
  { id: 'questoes', label: 'Questões respondidas', icon: ListChecks, format: (r) => `${r.total_questoes}`, sortKey: (r) => r.total_questoes },
  { id: 'pct', label: 'Percentual de acertos', icon: Percent, format: (r) => `${Number(r.pct_acertos).toFixed(2)}%`, sortKey: (r) => Number(r.pct_acertos) },
  { id: 'dias', label: 'Dias ativos', icon: CalendarRange, format: (r) => `${r.dias_ativos}`, sortKey: (r) => r.dias_ativos },
  { id: 'tempo', label: 'Tempo estudado', icon: Clock, format: (r) => `${Math.round(r.total_minutos / 60)}h`, sortKey: (r) => r.total_minutos },
]

function RankingViewInner() {
  const { user } = useAuth()
  const [rows, setRows] = useState<RankingRow[]>([])
  const [loading, setLoading] = useState(true)
  const [metric, setMetric] = useState<Metric>('questoes')

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    supabase
      .rpc('get_ranking_stats')
      .then(({ data, error }) => {
        if (cancelled) return
        if (error) {
          console.error('Ranking error:', error)
          setRows([])
        } else {
          setRows((data ?? []) as RankingRow[])
        }
        setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const active = METRICS.find((m) => m.id === metric)!
  const sorted = [...rows].sort((a, b) => active.sortKey(b) - active.sortKey(a))
  const userIdx = sorted.findIndex((r) => r.user_id === user?.id)

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">
        {METRICS.map((m) => {
          const Icon = m.icon
          const isActive = m.id === metric
          return (
            <button
              key={m.id}
              onClick={() => setMetric(m.id)}
              className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition ${
                isActive
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border-soft bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground'
              }`}
            >
              <Icon size={14} />
              {m.label}
            </button>
          )
        })}
      </div>

      <div className="rounded-2xl border border-border-soft bg-card p-5">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy size={16} className="text-primary" />
            <h3 className="font-display text-base font-bold text-foreground">{active.label}</h3>
          </div>
          <span className="rounded-sm bg-primary/15 px-2 py-0.5 font-mono text-[10px] font-bold text-primary">
            {userIdx >= 0 ? `Sua posição: #${userIdx + 1} de ${sorted.length}` : `${sorted.length} alunos`}
          </span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="animate-spin text-primary" size={20} />
          </div>
        ) : sorted.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">
            Nenhum aluno cadastrado ainda.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left font-mono text-[10px] uppercase tracking-wider text-faint">
                <th className="pb-2 pr-2 font-medium">#</th>
                <th className="pb-2 pr-4 font-medium">Aluno</th>
                <th className="pb-2 pr-4 text-right font-medium">Questões</th>
                <th className="pb-2 pr-4 text-right font-medium">Acertos</th>
                <th className="pb-2 pr-4 text-right font-medium">Dias</th>
                <th className="pb-2 text-right font-medium">{active.label}</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((r, i) => {
                const isUser = r.user_id === user?.id
                return (
                  <tr
                    key={r.user_id}
                    className={`border-b border-border-soft/50 ${isUser ? 'bg-primary/10' : ''}`}
                  >
                    <td className="py-2 pr-2">
                      <span className={`font-mono text-xs font-bold ${i < 3 ? 'text-primary' : 'text-faint'}`}>
                        {i + 1}
                      </span>
                    </td>
                    <td className="py-2 pr-4">
                      <span className={`text-[13px] ${isUser ? 'font-bold text-primary' : 'font-medium text-foreground'}`}>
                        {r.full_name || 'Aluno'}
                        {isUser && <span className="ml-1.5 text-[10px] text-faint">(você)</span>}
                      </span>
                    </td>
                    <td className="py-2 pr-4 text-right font-mono text-xs text-muted-foreground">{r.total_questoes}</td>
                    <td className="py-2 pr-4 text-right font-mono text-xs text-muted-foreground">{Number(r.pct_acertos).toFixed(1)}%</td>
                    <td className="py-2 pr-4 text-right font-mono text-xs text-muted-foreground">{r.dias_ativos}</td>
                    <td className="py-2 text-right font-mono text-xs font-semibold text-foreground">{active.format(r)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

export const RankingView = memo(RankingViewInner)
