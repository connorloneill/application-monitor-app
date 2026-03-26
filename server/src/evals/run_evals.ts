import fs from 'fs'
import path from 'path'
import { logger } from '../utils/logger'

// LLM Evaluation harness.
// Run with: npm run evals
// Reads golden datasets, runs the model, scores outputs, writes metrics.json.
//
// Wire this into .github/workflows/evals.yml to catch regressions on every
// prompt or agent change before it reaches production.

interface EvalCase {
  input: string
  expected_output: string
  tags?: string[]
}

interface EvalResult {
  input: string
  expected: string
  actual: string
  passed: boolean
  latencyMs: number
}

async function runEvals() {
  const datasetsDir = path.join(__dirname, 'datasets')
  const results: EvalResult[] = []

  for (const file of fs.readdirSync(datasetsDir)) {
    if (!file.endsWith('.jsonl')) continue
    const lines = fs.readFileSync(path.join(datasetsDir, file), 'utf-8').trim().split('\n')

    for (const line of lines) {
      const evalCase = JSON.parse(line) as EvalCase
      const start = Date.now()

      // TODO: replace with your actual model call
      const actual = `[model output for: ${evalCase.input}]`
      const latencyMs = Date.now() - start

      const passed = actual.includes(evalCase.expected_output)
      results.push({ input: evalCase.input, expected: evalCase.expected_output, actual, passed, latencyMs })
    }
  }

  const passRate = results.filter((r) => r.passed).length / results.length
  const avgLatency = results.reduce((sum, r) => sum + r.latencyMs, 0) / results.length

  const metrics = { passRate, avgLatencyMs: avgLatency, total: results.length, results }
  fs.writeFileSync(path.join(__dirname, 'metrics', 'latest.json'), JSON.stringify(metrics, null, 2))

  logger.info('Evals complete', { passRate, avgLatencyMs: avgLatency, total: results.length })

  if (passRate < 0.8) {
    logger.error('Eval pass rate below threshold (0.8) — failing CI')
    process.exit(1)
  }
}

runEvals().catch((err) => {
  logger.error('Eval run failed', { error: (err as Error).message })
  process.exit(1)
})
