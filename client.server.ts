import { memo, useState } from 'react'
import { ChevronDown, Folder, FileText, Sparkles } from 'lucide-react'
import { CURRICULUM, ROTATION_ORDER, type Lancamento } from '@/lib/curriculum'

type Props = {
  lancamentos: Lancamento[]
  onOpenMaterial: (discId: string, topicId: string) => void
}

function MateriaisViewInner({ onOpenMaterial }: Props) {
  const [open, setOpen] = useState<string | null>(ROTATION_ORDER[0])

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-primary/25 bg-card px-4 py-3">
        <div className="flex items-center gap-2">
          <Sparkles size={14} className="text-primary" />
          <span className="text-[13px] font-medium text-muted-foreground">
            Materiais gerados por IA sob demanda — lei seca, resumos e questões comentadas para cada
            assunto do edital.
          </span>
        </div>
      </div>

      {ROTATION_ORDER.map((discId) => {
        const disc = CURRICULUM[discId]
        const isOpen = open === discId
        return (
          <div key={discId} className="overflow-hidden rounded-xl border border-border-soft bg-card">
            <button
              onClick={() => setOpen(isOpen ? null : discId)}
              className="flex w-full items-center justify-between px-4 py-3.5 transition hover:bg-card-raised"
            >
              <div className="flex items-center gap-3">
                <Folder size={16} className="text-primary" />
                <span className="font-display text-sm font-bold text-foreground">{disc.name}</span>
                <span className="text-[11px] text-faint">{disc.topics.length} assuntos</span>
              </div>
              <ChevronDown
                size={16}
                className={`text-faint transition-transform ${isOpen ? 'rotate-180' : ''}`}
              />
            </button>
            {isOpen && (
              <div className="border-t border-border-soft">
                {disc.topics.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => onOpenMaterial(discId, t.id)}
                    className="flex w-full items-center gap-3 border-b border-border-soft/50 px-4 py-2.5 text-left transition last:border-0 hover:bg-card-raised"
                  >
                    <FileText size={14} className="shrink-0 text-muted-foreground" />
                    <span className="flex-1 text-[13px] font-medium text-muted-foreground">
                      {t.name}
                    </span>
                    <span className="shrink-0 rounded-sm border border-faint/40 px-1.5 py-0.5 font-mono text-[10px] text-faint">
                      peso {t.fib}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

export const MateriaisView = memo(MateriaisViewInner)
