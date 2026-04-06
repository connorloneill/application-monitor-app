import fs from 'fs'
import path from 'path'

// Prompt registry — maps logical names to versioned files.
// Always reference prompts by name, never hardcode text inline.
// This makes rollback as simple as changing a version string.

const PROMPTS_DIR = path.join(__dirname)

interface PromptEntry {
  file: string
  version: string
}

const registry: Record<string, PromptEntry> = {
  default_system: { file: 'system/default_v1.txt', version: 'v1' },
  diagnosis_system: { file: 'system/diagnosis_v1.txt', version: 'v1' },
  snippet_analysis_system: { file: 'system/snippet_analysis_v1.txt', version: 'v1' },
  quick_diagnosis_system: { file: 'system/quick_diagnosis_v1.txt', version: 'v1' },
  dev_chat_system: { file: 'system/dev_chat_v1.txt', version: 'v1' },
}

export function getPrompt(name: string): string {
  const entry = registry[name]
  if (!entry) throw new Error(`Unknown prompt: "${name}"`)
  const filePath = path.join(PROMPTS_DIR, entry.file)
  return fs.readFileSync(filePath, 'utf-8').trim()
}

export function getPromptVersion(name: string): string {
  return registry[name]?.version ?? 'unknown'
}
