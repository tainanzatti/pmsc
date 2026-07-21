import { useEffect, useState } from 'react'
import { X, Sparkles, Loader2, RefreshCw, Link2, Trash2, ExternalLink } from 'lucide-react'
import { CURRICULUM } from '@/lib/curriculum'
import { generateAI, type AIKind } from '@/lib/ai-client'
import { loadString, saveString } from '@/lib/storage'
import {
  fetchMaterialLinks,
  insertMaterialLink,
  deleteMaterialLink,
  fetchAiMaterial,
  upsertAiMaterial,
  type SavedLink,
} from '@/lib/db'
import { useAuth } from '@/lib/auth-context'
import { TypewriterMarkdown } from '@/components/ui-bits'

type TabId = 'leiseca' | 'resumo' | 'questoes'

const TABS: { id: TabId; label: string }[] = [
  { id: 'leiseca', label: 'Lei Seca' },
  { id: 'resumo', label: 'Resumo' },
  { id: 'questoes', label: 'Questões' },
]

type TabState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'ready'; text: string; fresh: boolean }
  | { status: 'error'; message: string }

export function MaterialModal({
  discId,
  topicId,
  onClose,
}: {
  discId: string
  topicId: string
  onClose: () => void
}) {
  const topic = CURRICULUM[discId].topics.find((t) => t.id === topicId)!
  const discName = CURRICULUM[discId].name
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<TabId>('leiseca')
  const [cache, setCache] = useState<Record<string, TabState>>({})

  // Links salvos para a aba "Lei Seca" (persistidos no Supabase, por usuário)
  const [links, setLinks] = useState<SavedLink[]>([])
  const [linkInput, setLinkInput] = useState('')
  const [linkError, setLinkError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    fetchMaterialLinks(user.id, discId, topicId).then(setLinks)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [discId, topicId, user])

  const cacheKey = (tab: string) => `mat:${discId}:${topicId}:${tab}`

  useEffect(() => {
    if (activeTab === 'leiseca') return
    if (cache[activeTab]) return
    const tab = activeTab
    // 1) Cache local (rápido, apenas temporário)
    const stored = loadString(cacheKey(tab))
    setCache((p) => ({
      ...p,
      [tab]: stored ? { status: 'ready', text: stored, fresh: false } : { status: 'idle' },
    }))
    // 2) Banco de dados = fonte oficial
    if (user) {
      fetchAiMaterial(user.id, discId, topicId, tab).then((dbText) => {
        if (!dbText) return
        saveString(cacheKey(tab), dbText)
        setCache((p) => ({ ...p, [tab]: { status: 'ready', text: dbText, fresh: false } }))
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab])

  async function generate(tab: Exclude<TabId, 'leiseca'>) {
    setCache((p) => ({ ...p, [tab]: { status: 'loading' } }))
    try {
      const text = await generateAI({
        kind: tab as AIKind,
        discName,
        topicName: topic.name,
      })
      setCache((p) => ({ ...p, [tab]: { status: 'ready', text, fresh: true } }))
      saveString(cacheKey(tab), text)
      if (user) await upsertAiMaterial(user.id, discId, topicId, tab, text)
    } catch (err) {
      setCache((p) => ({
        ...p,
        [tab]: {
          status: 'error',
          message: err instanceof Error ? err.message : String(err),
        },
      }))
    }
  }

  async function saveLink() {
    if (!user) return
    const raw = linkInput.trim()
    if (!raw) {
      setLinkError('Cole uma URL antes de salvar.')
      return
    }
    let url = raw
    if (!/^https?:\/\//i.test(url)) url = 'https://' + url
    try {
      // valida
      // eslint-disable-next-line no-new
      new URL(url)
    } catch {
      setLinkError('URL inválida.')
      return
    }
    setLinkError(null)
    const saved = await insertMaterialLink(user.id, discId, topicId, url)
    setLinks((prev) => [...prev, saved])
    setLinkInput('')
  }

  async function deleteLink(id: string) {
    setLinks((prev) => prev.filter((l) => l.id !== id))
    await deleteMaterialLink(id)
  }

  const current = cache[activeTab] || { status: 'idle' }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="flex max-h-[86vh] w-full flex-col overflow-hidden rounded-t-2xl border border-border bg-card sm:mx-4 sm:max-w-xl sm:rounded-2xl animate-in slide-in-from-bottom-4 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between border-b border-border-soft px-5 pt-5 pb-4">
          <div className="min-w-0 pr-3">
            <div className="mb-1 font-mono text-[10px] text-faint">{discName}</div>
            <div className="truncate font-display text-sm font-semibold text-foreground">
              {topic.name}
            </div>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 rounded-full p-1.5 text-faint transition-transform duration-200 hover:scale-110 hover:text-foreground active:scale-95"
            aria-label="Fechar"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex gap-1 px-5 pt-3">
          {TABS.map((mt) => {
            const active = activeTab === mt.id
            return (
              <button
                key={mt.id}
                onClick={() => setActiveTab(mt.id)}
                className={`rounded-md border px-3 py-1.5 text-xs font-medium transition-all duration-300 ease-in-out active:scale-95 ${
                  active
                    ? 'border-primary/50 bg-card-raised text-primary'
                    : 'border-transparent text-faint hover:text-muted-foreground'
                }`}
              >
                {mt.label}
              </button>
            )
          })}
        </div>

        <div
          key={activeTab}
          className="flex-1 overflow-y-auto px-5 py-4 animate-in fade-in duration-300"
        >
          {activeTab === 'leiseca' ? (
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 flex items-center gap-1.5 font-mono text-[10px] font-semibold tracking-[0.15em] text-faint uppercase">
                  <Link2 size={12} /> Anexar link
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    inputMode="url"
                    value={linkInput}
                    onChange={(e) => {
                      setLinkInput(e.target.value)
                      if (linkError) setLinkError(null)
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') saveLink()
                    }}
                    placeholder="https://exemplo.com/lei-seca"
                    className="flex-1 min-w-0 rounded-md border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-faint outline-none transition-all duration-200 focus:border-primary/60 focus:ring-1 focus:ring-primary/40"
                  />
                  <button
                    onClick={saveLink}
                    className="shrink-0 rounded-md bg-primary px-4 py-2 font-display text-xs font-bold text-primary-foreground transition-all duration-200 hover:brightness-110 active:scale-95"
                  >
                    Salvar
                  </button>
                </div>
                {linkError && (
                  <p className="mt-1.5 text-[10px] text-primary">{linkError}</p>
                )}
              </div>

              <div>
                <div className="mb-2 font-mono text-[10px] font-semibold tracking-[0.15em] text-faint uppercase">
                  Links salvos ({links.length})
                </div>
                {links.length === 0 ? (
                  <p className="rounded-md border border-dashed border-border-soft px-3 py-6 text-center text-[11px] text-faint">
                    Nenhum link anexado ainda. Cole uma URL acima e clique em Salvar.
                  </p>
                ) : (
                  <ul className="space-y-1.5">
                    {links.map((l) => (
                      <li
                        key={l.id}
                        className="flex items-center gap-2 rounded-md border border-border-soft bg-background px-3 py-2 transition-all duration-200 hover:border-primary/40"
                      >
                        <ExternalLink size={12} className="shrink-0 text-primary" />
                        <a
                          href={l.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 min-w-0 truncate text-[12px] text-muted-foreground transition hover:text-foreground"
                          title={l.url}
                        >
                          {l.url}
                        </a>
                        <button
                          onClick={() => deleteLink(l.id)}
                          className="shrink-0 rounded p-1 text-faint transition-all duration-200 hover:text-primary active:scale-95"
                          aria-label="Remover link"
                        >
                          <Trash2 size={12} />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          ) : (
            <>
              {current.status === 'idle' && (
                <div className="py-8 text-center">
                  <Sparkles size={22} className="mx-auto mb-2.5 text-primary" />
                  <p className="mb-4 text-xs text-muted-foreground">
                    Nenhum material gerado ainda para esta aba.
                  </p>
                  <button
                    onClick={() => generate(activeTab)}
                    className="rounded-md bg-primary px-4 py-2 font-display text-xs font-bold text-primary-foreground transition-all duration-200 hover:brightness-110 active:scale-95"
                  >
                    Gerar com IA
                  </button>
                </div>
              )}

              {current.status === 'loading' && (
                <div className="flex flex-col items-center justify-center gap-2 py-10">
                  <Loader2 size={18} className="animate-spin text-primary" />
                  <span className="text-[11px] text-faint">Gerando conteúdo…</span>
                </div>
              )}

              {current.status === 'error' && (
                <div className="py-8 text-center">
                  <p className="mb-2 text-xs text-primary">Não foi possível gerar agora.</p>
                  <p className="mb-3 break-words px-3 font-mono text-[10px] text-faint">
                    {current.message}
                  </p>
                  <button
                    onClick={() => generate(activeTab)}
                    className="rounded-md bg-card-raised px-4 py-2 text-xs font-bold text-foreground transition-all duration-200 hover:brightness-110 active:scale-95"
                  >
                    Tentar novamente
                  </button>
                </div>
              )}

              {current.status === 'ready' && (
                <>
                  <TypewriterMarkdown text={current.text} animate={current.fresh} />
                  <button
                    onClick={() => generate(activeTab)}
                    className="mt-4 flex items-center gap-1 text-[11px] text-faint transition hover:text-muted-foreground"
                  >
                    <RefreshCw size={11} /> Gerar novamente
                  </button>
                </>
              )}
            </>
          )}
        </div>

        <div className="flex items-center gap-1.5 border-t border-border-soft bg-secondary px-5 py-2.5">
          <Sparkles size={11} className="text-faint" />
          <span className="text-[9px] leading-snug text-faint">
            {activeTab === 'leiseca'
              ? 'Anexe suas fontes favoritas (site da lei, PDFs, artigos) para consultar rápido.'
              : 'Gerado por IA. Confira o texto oficial antes de memorizar trechos literais.'}
          </span>
        </div>
      </div>
    </div>
  )
}
