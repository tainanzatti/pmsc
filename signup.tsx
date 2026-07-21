import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { useAuth } from './auth-context'
import { fetchUserSettings, upsertUserSettings } from './db'

export type ThemeMode = 'dark' | 'light' | 'auto'

type ThemeContextValue = {
  theme: ThemeMode
  resolved: 'dark' | 'light'
  setTheme: (mode: ThemeMode) => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

function resolveTheme(mode: ThemeMode): 'dark' | 'light' {
  if (mode === 'auto') {
    if (typeof window === 'undefined') return 'dark'
    return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
  }
  return mode
}

function applyTheme(resolved: 'dark' | 'light') {
  if (typeof document === 'undefined') return
  const el = document.documentElement
  el.classList.remove('dark', 'light')
  el.classList.add(resolved)
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [theme, setThemeState] = useState<ThemeMode>('dark')
  const [resolved, setResolved] = useState<'dark' | 'light'>('dark')

  // Load from localStorage immediately (avoids flash), then from Supabase.
  useEffect(() => {
    if (typeof window === 'undefined') return
    const stored = (localStorage.getItem('theme') as ThemeMode | null) || 'dark'
    setThemeState(stored)
  }, [])

  useEffect(() => {
    if (!user) return
    fetchUserSettings(user.id).then((s) => {
      const t = (s?.theme as ThemeMode | undefined) || 'dark'
      setThemeState(t)
      if (typeof window !== 'undefined') localStorage.setItem('theme', t)
    })
  }, [user])

  // Apply resolved theme + subscribe to system changes when auto.
  useEffect(() => {
    const r = resolveTheme(theme)
    setResolved(r)
    applyTheme(r)
    if (theme !== 'auto' || typeof window === 'undefined') return
    const mq = window.matchMedia('(prefers-color-scheme: light)')
    const handler = () => {
      const nr = mq.matches ? 'light' : 'dark'
      setResolved(nr)
      applyTheme(nr)
    }
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [theme])

  function setTheme(mode: ThemeMode) {
    setThemeState(mode)
    if (typeof window !== 'undefined') localStorage.setItem('theme', mode)
    if (user) {
      fetchUserSettings(user.id).then((s) =>
        upsertUserSettings(user.id, { ...s, theme: mode }),
      )
    }
  }

  return (
    <ThemeContext.Provider value={{ theme, resolved, setTheme }}>{children}</ThemeContext.Provider>
  )
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider')
  return ctx
}
