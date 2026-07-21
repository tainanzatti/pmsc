
// Persistência local simples (client-side) para o protótipo.
// Substitui o window.storage do ambiente original por localStorage.

const PREFIX = 'operacao-pmsc:'

export function loadJSON<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback
  try {
    const raw = window.localStorage.getItem(PREFIX + key)
    if (raw == null) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

export function saveJSON<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(PREFIX + key, JSON.stringify(value))
  } catch {
    /* ignora cotas/erros de storage */
  }
}

export function loadString(key: string): string | null {
  if (typeof window === 'undefined') return null
  try {
    return window.localStorage.getItem(PREFIX + key)
  } catch {
    return null
  }
}

export function saveString(key: string, value: string): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(PREFIX + key, value)
  } catch {
    /* ignora */
  }
}
