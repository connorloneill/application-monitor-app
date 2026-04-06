import { createContext, useContext, useState, useCallback, ReactNode } from 'react'

export interface FeatureFlags {
  enableQuickDiagnosis: boolean
  enableBatchComparison: boolean
  enableDevChat: boolean
  showAiCostEstimates: boolean
  verboseLogging: boolean
}

export interface ModelOverrides {
  [feature: string]: {
    primary?: string
    secondary?: string[]
  }
}

interface DevToolsContextValue {
  flags: FeatureFlags
  setFlag: (key: keyof FeatureFlags, value: boolean) => void
  modelOverrides: ModelOverrides
  setModelOverride: (feature: string, primary?: string, secondary?: string[]) => void
  clearModelOverrides: () => void
}

const DEFAULT_FLAGS: FeatureFlags = {
  enableQuickDiagnosis: true,
  enableBatchComparison: false,
  enableDevChat: true,
  showAiCostEstimates: true,
  verboseLogging: false,
}

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

const DevToolsContext = createContext<DevToolsContextValue | null>(null)

export function DevToolsProvider({ children }: { children: ReactNode }) {
  const [flags, setFlags] = useState<FeatureFlags>(
    () => loadFromStorage('devtools_flags', DEFAULT_FLAGS)
  )
  const [modelOverrides, setModelOverrides] = useState<ModelOverrides>(
    () => loadFromStorage('devtools_model_overrides', {})
  )

  const setFlag = useCallback((key: keyof FeatureFlags, value: boolean) => {
    setFlags((prev) => {
      const next = { ...prev, [key]: value }
      localStorage.setItem('devtools_flags', JSON.stringify(next))
      return next
    })
  }, [])

  const setModelOverride = useCallback(
    (feature: string, primary?: string, secondary?: string[]) => {
      setModelOverrides((prev) => {
        const next = { ...prev, [feature]: { primary, secondary } }
        localStorage.setItem('devtools_model_overrides', JSON.stringify(next))
        return next
      })
    },
    []
  )

  const clearModelOverrides = useCallback(() => {
    setModelOverrides({})
    localStorage.removeItem('devtools_model_overrides')
  }, [])

  return (
    <DevToolsContext.Provider
      value={{ flags, setFlag, modelOverrides, setModelOverride, clearModelOverrides }}
    >
      {children}
    </DevToolsContext.Provider>
  )
}

export function useDevTools() {
  const ctx = useContext(DevToolsContext)
  if (!ctx) throw new Error('useDevTools must be used within DevToolsProvider')
  return ctx
}
