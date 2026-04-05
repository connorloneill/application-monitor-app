import { config } from '../../config'
import { AppError } from '../../middleware/errorHandler'
import { getLogger } from '../../utils/logger'

const log = getLogger('codeRetrieval')

export interface FileTreeEntry {
  path: string
  type: 'blob' | 'tree'
  size?: number
}

export interface SearchResult {
  filePath: string
  matches: string[]
}

function parseRepo(repoUrl: string): { owner: string; repo: string } {
  const match = repoUrl.match(/github\.com[/:]([^/]+)\/([^/.]+)/)
  if (!match) throw new AppError(400, `Invalid GitHub repo URL: ${repoUrl}`)
  return { owner: match[1], repo: match[2] }
}

async function githubFetch(path: string): Promise<Response> {
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github.v3+json',
    'User-Agent': 'application-monitor',
  }
  if (config.github.token) {
    headers.Authorization = `token ${config.github.token}`
  }

  const response = await fetch(`https://api.github.com${path}`, { headers })

  const remaining = response.headers.get('X-RateLimit-Remaining')
  if (remaining && parseInt(remaining, 10) < 10) {
    log.warn('GitHub API rate limit low', { remaining })
  }

  if (!response.ok) {
    const body = await response.text()
    throw new AppError(
      response.status === 404 ? 404 : 502,
      `GitHub API error (${response.status}): ${body.slice(0, 200)}`
    )
  }

  return response
}

export async function getRepoTree(
  repoUrl: string,
  branch?: string
): Promise<FileTreeEntry[]> {
  const { owner, repo } = parseRepo(repoUrl)
  const ref = branch ?? 'main'

  const response = await githubFetch(
    `/repos/${owner}/${repo}/git/trees/${ref}?recursive=1`
  )
  const data = (await response.json()) as {
    tree: Array<{ path: string; type: string; size?: number }>
  }

  return data.tree
    .filter((entry) => entry.type === 'blob')
    .map((entry) => ({
      path: entry.path,
      type: entry.type as 'blob' | 'tree',
      size: entry.size,
    }))
}

export async function getFileContent(
  repoUrl: string,
  filePath: string,
  branch?: string
): Promise<string> {
  const { owner, repo } = parseRepo(repoUrl)
  const ref = branch ?? 'main'

  const response = await githubFetch(
    `/repos/${owner}/${repo}/contents/${filePath}?ref=${ref}`
  )
  const data = (await response.json()) as { content?: string; encoding?: string }

  if (!data.content || data.encoding !== 'base64') {
    throw new AppError(502, `Unexpected content format for ${filePath}`)
  }

  return Buffer.from(data.content, 'base64').toString('utf-8')
}

export async function searchCode(
  repoUrl: string,
  query: string
): Promise<SearchResult[]> {
  const { owner, repo } = parseRepo(repoUrl)

  const response = await githubFetch(
    `/search/code?q=${encodeURIComponent(query)}+repo:${owner}/${repo}`
  )
  const data = (await response.json()) as {
    items: Array<{ path: string; text_matches?: Array<{ fragment: string }> }>
  }

  return data.items.map((item) => ({
    filePath: item.path,
    matches: item.text_matches?.map((m) => m.fragment) ?? [],
  }))
}
