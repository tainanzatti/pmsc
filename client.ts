import { memo, useState } from 'react'
import { RefreshCw, FileText, Lock, Repeat } from 'lucide-react'
import {
  CURRICULUM,
  ROTATION_ORDER,
  targetViews,
  viewCount,
  lerpColor,
  movingAverageMastery,
  type Lancamento,
} from '@/lib/curriculum'
import { IconTip } from '@/components/ui-bits'

type Props = {
  lancamentos: Lancamento[]
  onOpenMaterial: (discId: string, topicId: string) => void
}

// Cor fria (poucas revisões) -> quente (meta atingida): azul -> verde
function reviewColor(count: number, target: number): string {
  const t = Math.min(1, count / target)
  return lerpColor('#3b6fb5', '#2f9e5f', t)
}

function NucleoViewInner({ lancamentos, onOpenMaterial }: Props) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-4 rounded-xl border border-border-soft bg-card px-4 py-3">
        <span className="font-mono text-[10px] uppercase tracking-wider text-faint">
          Progresso de revisão
        </span>
        <div className="flex items-center gap-2">
          <span className="h-3 w-16 rounded-sm bg-gradient-to-r from-[#3b6fb5] to-[#2f9e5f]" />
          <span className="text-[11px] text-muted-foreground">poucas → meta atingida</span>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-faint">
          <Lock size={11} /> tópico ainda não iniciado
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {ROTATION_ORDER.map((discId) => (
          <DisciplineColumn
            key={discId}
            discId={discId}
            lancamentos={lancamentos}
            onOpenMaterial={onOpenMaterial}
          />
        ))}
      </div>
    </div>
  )
}

function DisciplineColumn({
  discId,
  lancamentos,
  onOpenMaterial,
}: {
  discId: string
  lancamentos: Lancamento[]
  onOpenMaterial: (discId: string, topicId: string) => void
}) {
  const [open, setOpen] = useState(true)
  const disc = CURRICULUM[discId]

  return (
    <div className="w-full min-w-0">

      <div className="mb-3 flex items-center justify-between rounded-lg border border-border-soft bg-card-raised px-3 py-2.5">
        <span className="font-display text-sm font-bold text-foreground">{disc.name}</span>
        <IconTip label={open ? 'Recolher tópicos' : 'Expandir tópicos'} side="left">
          <button
            onClick={() => setOpen((o) => !o)}
            aria-label={open ? 'Recolher' : 'Expandir'}
            className="text-faint transition hover:text-foreground"
          >
            <RefreshCw size={13} className={open ? '' : 'opacity-40'} />
          </button>
        </IconTip>
      </div>
      {open && (
        <div className="space-y-2.5">
          {disc.topics.map((t) => {
            const count = viewCount(lancamentos, discId, t.id)
            const target = targetViews(t.fib)
            const mastery = movingAverageMastery(lancamentos, discId, t.id)
            const started = count > 0
            const color = reviewColor(count, target)
            return (
              <div
                key={t.id}
                className="rounded-lg border border-border-soft bg-card p-3 transition hover:border-border"
              >
                <div className="mb-2.5 flex items-start gap-2">
                  <span
                    className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{
                      background: started ? color : 'transparent',
                      border: started ? 'none' : '1.5px solid var(--faint)',
                    }}
                  />
                  <span className="text-[13px] font-medium leading-snug text-foreground text-pretty">
                    {t.name}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1 font-mono text-[11px] text-muted-foreground">
                      <Repeat size={11} />
                      {count}
                      <span className="text-faint">/{target}</span>
                    </span>
                    {started ? (
                      <span className="font-mono text-[11px]" style={{ color }}>
                        {mastery}%
                      </span>
                    ) : (
                      <Lock size={11} className="text-faint" />
                    )}
                  </div>
                  <IconTip label="Abrir materiais deste tópico" side="left">
                    <button
                      onClick={() => onOpenMaterial(discId, t.id)}
                      aria-label="Material de estudo"
                      className="rounded p-1 text-primary transition hover:scale-125"
                    >
                      <FileText size={13} />
                    </button>
                  </IconTip>
                </div>
                <div className="mt-2 h-1 overflow-hidden rounded-full bg-card-raised">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${Math.min(100, (count / target) * 100)}%`, background: color }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export const NucleoView = memo(NucleoViewInner)
