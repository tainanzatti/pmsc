import { memo, useMemo, useState } from 'react'
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  Legend,
  Tooltip,
} from 'recharts'
import { Clock, BookOpen, TrendingUp, ArrowUp, ArrowDown } from 'lucide-react'
import { CURRICULUM, ROTATION_ORDER, disciplineAggregate, type Lancamento } from '@/lib/curriculum'
import { SectionLabel } from '@/components/ui-bits'

type Props = { lancamentos: Lancamento[] }

// Médias fictícias da "concorrência" para comparação.
const RIVAL_HOURS = 18
const RIVAL_TOPICS_DAY = 3.1
const RIVAL_DISC_PCT: Record<string, number> = {
  legislacaoInstitucional: 74,
  direitoConstitucional: 68,
  linguaPortuguesa: 71,
  direitoPenal: 66,
  direitoProcessualPenal: 63,
  direitoPenalMilitar: 60,
  legislacaoEspecial: 65,
  legislacaoTransito: 70,
  informatica: 72,
  redacao: 55,
}

function ComparativoViewInner({ lancamentos }: Props) {
  const [win, setWin] = useState<number | null>(30)

  const filtered = useMemo(() => {
    if (win === null) return lancamentos
    const cutoff = new Date(Date.now() - win * 86400000).toISOString().slice(0, 10)
    return lancamentos.filter((l) => l.data >= cutoff)
  }, [lancamentos, win])

  const userMin = filtered.reduce((a, e) => a + (e.minutos || 0), 0)
  const userHours = +(userMin / 60).toFixed(1)
  const days = new Set(filtered.map((l) => l.data)).size || 1
  const touched = new Set(filtered.map((l) => l.disciplinaId + l.topicoId)).size
  const userTopicsDay = +(touched / days).toFixed(1)

  const radarData = ROTATION_ORDER.filter((id) => CURRICULUM[id].questoes !== 'P2').map((id) => ({
    disciplina: CURRICULUM[id].name.replace('Direito ', 'D. ').replace('Legislação ', 'Leg. '),
    voce: disciplineAggregate(filtered, id).pct ?? 0,
    concorrencia: RIVAL_DISC_PCT[id] ?? 65,
  }))

  return (
    <div className="space-y-6">
      <div className="flex gap-1.5">
        {[
          { label: '30 dias', days: 30 },
          { label: '90 dias', days: 90 },
          { label: 'Tudo', days: null },
        ].map((w) => (
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

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <CompareCard
          label="Horas estudadas"
          icon={Clock}
          userValue={`${userHours}h`}
          rivalValue={`${RIVAL_HOURS}h`}
          up={userHours >= RIVAL_HOURS}
        />
        <CompareCard
          label="Assuntos estudados"
          icon={BookOpen}
          userValue={String(touched)}
          rivalValue="20"
          up={touched >= 20}
        />
        <CompareCard
          label="Média de assuntos/dia"
          icon={TrendingUp}
          userValue={userTopicsDay.toFixed(1)}
          rivalValue={RIVAL_TOPICS_DAY.toFixed(1)}
          up={userTopicsDay >= RIVAL_TOPICS_DAY}
        />
      </div>

      <div className="rounded-2xl border border-border-soft bg-card p-5">
        <SectionLabel>DESEMPENHO POR DISCIPLINA — VOCÊ vs CONCORRÊNCIA</SectionLabel>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={radarData} outerRadius="70%">
              <PolarGrid stroke="var(--border)" />
              <PolarAngleAxis
                dataKey="disciplina"
                tick={{ fill: 'var(--muted-foreground)', fontSize: 9 }}
              />
              <Radar
                name="Concorrência"
                dataKey="concorrencia"
                stroke="var(--faint)"
                fill="var(--faint)"
                fillOpacity={0.15}
              />
              <Radar
                name="Você"
                dataKey="voce"
                stroke="var(--primary)"
                fill="var(--primary)"
                fillOpacity={0.4}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{
                  background: 'var(--card-raised)',
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                  fontSize: 12,
                }}
                formatter={(v: number) => `${v}%`}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}

function CompareCard({
  label,
  icon: Icon,
  userValue,
  rivalValue,
  up,
}: {
  label: string
  icon: typeof Clock
  userValue: string
  rivalValue: string
  up: boolean
}) {
  return (
    <div className="rounded-xl border border-border-soft bg-card p-4">
      <div className="mb-3 flex items-center gap-2">
        <Icon size={14} className="text-muted-foreground" />
        <span className="text-[11px] font-medium text-muted-foreground">{label}</span>
      </div>
      <div className="flex items-end justify-between">
        <div>
          <div className="flex items-center gap-1.5">
            <span className="font-mono text-2xl font-bold text-foreground">{userValue}</span>
            {up ? (
              <ArrowUp size={16} className="text-success" />
            ) : (
              <ArrowDown size={16} className="text-primary" />
            )}
          </div>
          <span className="text-[10px] text-faint">Você</span>
        </div>
        <div className="text-right">
          <div className="font-mono text-lg font-bold text-faint">{rivalValue}</div>
          <span className="text-[10px] text-faint">Concorrência</span>
        </div>
      </div>
    </div>
  )
}

export const ComparativoView = memo(ComparativoViewInner)
