import React, { useEffect, useState } from 'react'
import type { LucideIcon } from 'lucide-react'
import { tierInfo, explainAllocation, type AllocatedTopic } from '@/lib/curriculum'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

// ============================== IconTip: botão com tooltip ==============================
export function IconTip({
  label,
  side = 'top',
  children,
}: {
  label: string
  side?: 'top' | 'bottom' | 'left' | 'right'
  children: React.ReactNode
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side={side}>{label}</TooltipContent>
    </Tooltip>
  )
}

// ============================== Rótulo de seção ==============================
export function SectionLabel({
  children,
  icon: Icon,
}: {
  children: React.ReactNode
  icon?: LucideIcon
}) {
  return (
    <div className="mb-3 flex items-center gap-1.5">
      {Icon && <Icon size={12} className="text-faint" />}
      <span className="font-mono text-[10px] font-semibold tracking-[0.18em] text-faint uppercase">
        {children}
      </span>
    </div>
  )
}

// ============================== Badge de peso ==============================
export function PesoBadge({ value }: { value: number }) {
  return (
    <span className="shrink-0 rounded-sm border border-faint/40 px-1.5 py-0.5 font-mono text-[10px] text-faint">
      peso {value}
    </span>
  )
}

// ============================== Ponto de tier ==============================
export function TierDot({ token }: { token: string }) {
  return (
    <span
      className="inline-block h-2 w-2 shrink-0 rounded-full"
      style={{ background: token }}
    />
  )
}

// ============================== Cinto de munição (alocação de minutos) ==============================
function AmmoBeltSegment({
  topic,
  isFirst,
  isLast,
}: {
  topic: AllocatedTopic
  isFirst: boolean
  isLast: boolean
}) {
  const [hover, setHover] = useState(false)
  const tier = tierInfo(topic.mastery)
  const isStripe = tier.key === 'sem-dados'
  const lightText = tier.key === 'dominado' || tier.key === 'bom'
  return (
    <div
      className="relative flex h-full items-center justify-center transition-[filter] duration-200 hover:brightness-110"
      style={{
        width: `${(topic.minutes / 60) * 100}%`,
        background: isStripe
          ? `repeating-linear-gradient(135deg, color-mix(in srgb, ${tier.token} 55%, transparent) 0px, color-mix(in srgb, ${tier.token} 55%, transparent) 6px, color-mix(in srgb, ${tier.token} 20%, transparent) 6px, color-mix(in srgb, ${tier.token} 20%, transparent) 12px)`
          : tier.token,
        borderRight: isLast ? 'none' : '1px solid var(--background)',
        borderTopLeftRadius: isFirst ? 5 : 0,
        borderBottomLeftRadius: isFirst ? 5 : 0,
        borderTopRightRadius: isLast ? 5 : 0,
        borderBottomRightRadius: isLast ? 5 : 0,
      }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {topic.minutes >= 6 && (
        <span
          className="font-mono text-[10px] font-bold"
          style={{ color: lightText ? 'var(--foreground)' : 'var(--background)' }}
        >
          {topic.minutes}
          {"'"}
        </span>
      )}
      {hover && (
        <div className="pointer-events-none absolute bottom-full left-1/2 z-30 mb-2 w-56 -translate-x-1/2 rounded-lg border border-border bg-card-raised p-3 shadow-2xl">
          <div className="mb-1 text-[11px] font-semibold text-foreground">{topic.name}</div>
          <div className="font-mono text-[10px]" style={{ color: tier.token }}>
            {tier.key === 'sem-dados' ? 'Sem dados' : `${topic.mastery}% de acerto`} ·{' '}
            {topic.minutes} min
          </div>
          <div className="mt-1.5 text-[10px] leading-snug text-faint">
            {explainAllocation(topic)}
          </div>
        </div>
      )}
    </div>
  )
}

export function AmmoBelt({
  topics,
  height = 34,
}: {
  topics: AllocatedTopic[]
  height?: number
}) {
  return (
    <div
      className="flex w-full overflow-hidden rounded-md border border-border"
      style={{ height }}
    >
      {topics.map((t, i) => (
        <AmmoBeltSegment
          key={t.id || i}
          topic={t}
          isFirst={i === 0}
          isLast={i === topics.length - 1}
        />
      ))}
    </div>
  )
}

// ============================== Markdown leve ==============================
function renderInline(line: string, keyPrefix: string) {
  const parts = line.split(/(\*\*[^*]+\*\*)/g)
  return parts.map((p, i) =>
    p.startsWith('**') && p.endsWith('**') ? (
      <strong key={`${keyPrefix}-${i}`} className="text-foreground">
        {p.slice(2, -2)}
      </strong>
    ) : (
      <React.Fragment key={`${keyPrefix}-${i}`}>{p}</React.Fragment>
    )
  )
}

export function MarkdownLite({ text }: { text: string }) {
  const blocks = text.split(/\n\s*\n/)
  return (
    <div className="space-y-3">
      {blocks.map((block, i) => {
        const lines = block.split('\n').filter(Boolean)
        const isList = lines.length > 0 && lines.every((l) => /^[-•]\s/.test(l.trim()))
        if (isList) {
          return (
            <ul key={i} className="list-disc space-y-1.5 pl-4">
              {lines.map((l, j) => (
                <li
                  key={j}
                  className="text-[13px] font-medium leading-relaxed text-muted-foreground"
                >
                  {renderInline(l.replace(/^[-•]\s/, ''), `${i}-${j}`)}
                </li>
              ))}
            </ul>
          )
        }
        return (
          <p
            key={i}
            className="text-[13px] font-medium leading-relaxed text-muted-foreground"
          >
            {lines.map((l, j) => (
              <React.Fragment key={j}>
                {renderInline(l, `${i}-${j}`)}
                {j < lines.length - 1 && <br />}
              </React.Fragment>
            ))}
          </p>
        )
      })}
    </div>
  )
}

// ============================== Typewriter ==============================
export function useTypewriter(text: string, speed = 12, enabled = true) {
  const [shown, setShown] = useState(enabled ? '' : text)
  useEffect(() => {
    if (!enabled) {
      setShown(text)
      return
    }
    setShown('')
    if (!text) return
    let i = 0
    const id = window.setInterval(() => {
      i += 2
      if (i >= text.length) {
        setShown(text)
        window.clearInterval(id)
      } else {
        setShown(text.slice(0, i))
      }
    }, speed)
    return () => window.clearInterval(id)
  }, [text, speed, enabled])
  return shown
}

export function TypewriterMarkdown({
  text,
  animate = true,
  speed = 12,
}: {
  text: string
  animate?: boolean
  speed?: number
}) {
  const shown = useTypewriter(text, speed, animate)
  const isDone = shown.length >= text.length
  return (
    <div className="relative">
      <MarkdownLite text={shown} />
      {animate && !isDone && (
        <span
          aria-hidden
          className="ml-0.5 inline-block h-4 w-[2px] translate-y-[3px] animate-pulse bg-primary align-middle"
        />
      )}
    </div>
  )
}
