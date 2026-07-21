import {
  CURRICULUM,
  ROTATION_ORDER,
  disciplineAggregate,
  type Lancamento,
} from '@/lib/curriculum'

const SHORT: Record<string, string> = {
  legislacaoInstitucional: 'Leg. Institucional',
  direitoConstitucional: 'Dir. Constitucional',
  linguaPortuguesa: 'Português',
  direitoPenal: 'Direito Penal',
  direitoProcessualPenal: 'Proc. Penal',
  direitoPenalMilitar: 'Dir. Penal Militar',
  legislacaoEspecial: 'Leis Especiais',
  legislacaoTransito: 'Leg. Trânsito',
  informatica: 'Informática',
  redacao: 'Redação',
}

type Props = {
  lancamentos: Lancamento[]
  activeDiscId: string
  onSelect?: (discId: string) => void
  size?: number
}

function polar(cx: number, cy: number, r: number, deg: number) {
  const rad = (deg * Math.PI) / 180
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
}

function sectorPath(
  cx: number,
  cy: number,
  innerR: number,
  outerR: number,
  startDeg: number,
  endDeg: number
) {
  const p0 = polar(cx, cy, innerR, startDeg)
  const p1 = polar(cx, cy, outerR, startDeg)
  const p2 = polar(cx, cy, outerR, endDeg)
  const p3 = polar(cx, cy, innerR, endDeg)
  const large = endDeg - startDeg > 180 ? 1 : 0
  return [
    `M ${p0.x} ${p0.y}`,
    `L ${p1.x} ${p1.y}`,
    `A ${outerR} ${outerR} 0 ${large} 1 ${p2.x} ${p2.y}`,
    `L ${p3.x} ${p3.y}`,
    `A ${innerR} ${innerR} 0 ${large} 0 ${p0.x} ${p0.y}`,
    'Z',
  ].join(' ')
}

export function StudyWheel({ lancamentos, activeDiscId, onSelect, size = 540 }: Props) {
  const cx = size / 2
  const cy = size / 2
  const outerR = size / 2 - 42
  const innerR = outerR * 0.42
  const n = ROTATION_ORDER.length
  const seg = 360 / n
  const gap = 5

  return (
    <div className="relative flex items-center justify-center">
      <svg
        width="100%"
        viewBox={`0 0 ${size} ${size}`}
        style={{ maxWidth: size }}
        role="img"
        aria-label="Roda do ciclo de estudos por disciplina"
      >
        {ROTATION_ORDER.map((discId, i) => {
          const startDeg = -90 + i * seg + gap / 2
          const endDeg = -90 + (i + 1) * seg - gap / 2
          const midDeg = (startDeg + endDeg) / 2
          const isActive = discId === activeDiscId
          const agg = disciplineAggregate(lancamentos, discId)
          const studied = agg.quantidade > 0

          const labelR = (innerR + outerR) / 2
          const lp = polar(cx, cy, labelR, midDeg)
          let rot = midDeg
          if (midDeg > 90 && midDeg < 270) rot += 180

          const tip = polar(cx, cy, outerR + 16, midDeg)

          const fill = isActive
            ? 'var(--primary)'
            : studied
              ? 'color-mix(in srgb, var(--primary) 16%, var(--card-raised))'
              : 'var(--card-raised)'

          const pctAcertos =
            agg.quantidade > 0 ? Math.round((agg.acertos / agg.quantidade) * 100) : null
          const tooltip = `${CURRICULUM[discId].name}\n${
            studied
              ? `${agg.quantidade} questões · ${pctAcertos}% acertos`
              : 'ainda sem lançamentos'
          }`

          return (
            <g
              key={discId}
              className="wheel-sector cursor-pointer transition-[opacity,transform] duration-200"
              onClick={() => onSelect?.(discId)}
              style={{ opacity: isActive ? 1 : studied ? 0.96 : 0.82, transformOrigin: `${cx}px ${cy}px` }}
            >
              <title>{tooltip}</title>
              <path
                d={sectorPath(
                  cx,
                  cy,
                  innerR,
                  isActive ? outerR + 8 : outerR,
                  startDeg,
                  endDeg
                )}
                fill={fill}
                stroke={fill}
                strokeWidth={8}
                strokeLinejoin="round"
                strokeLinecap="round"
                paintOrder="stroke"
                style={
                  isActive
                    ? { filter: 'drop-shadow(0 0 14px color-mix(in srgb, var(--primary) 55%, transparent))' }
                    : undefined
                }
              />
              <text
                x={lp.x}
                y={lp.y}
                transform={`rotate(${rot} ${lp.x} ${lp.y})`}
                textAnchor="middle"
                dominantBaseline="middle"
                className="pointer-events-none select-none font-mono"
                style={{
                  fontSize: 10,
                  fontWeight: isActive ? 700 : 500,
                  fill: isActive
                    ? 'var(--primary-foreground)'
                    : studied
                      ? 'var(--foreground)'
                      : 'var(--muted-foreground)',
                }}
              >
                {SHORT[discId]}
              </text>

              {/* marcador na ponta */}
              <circle
                cx={tip.x}
                cy={tip.y}
                r={isActive ? 7 : 5}
                fill={
                  isActive
                    ? 'var(--primary)'
                    : studied
                      ? 'var(--tier-good)'
                      : 'var(--card)'
                }
                stroke={studied && !isActive ? 'var(--tier-good)' : 'var(--border)'}
                strokeWidth={1.2}
              />
              {studied && !isActive && (
                <polyline
                  points={`${tip.x - 2.6},${tip.y} ${tip.x - 0.6},${tip.y + 2} ${tip.x + 2.8},${tip.y - 2.4}`}
                  fill="none"
                  stroke="var(--background)"
                  strokeWidth={1.6}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}
            </g>
          )
        })}
      </svg>

      {/* núcleo central (vazio) */}
      <div
        className="pointer-events-none absolute rounded-full border border-border bg-background"
        style={{ width: innerR * 1.55, height: innerR * 1.55 }}
        aria-hidden
      />
    </div>
  )
}
