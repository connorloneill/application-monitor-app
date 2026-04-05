export type ApplicationStatus = 'active' | 'inactive' | 'archived'

export interface Application {
  id: string
  name: string
  repoUrl: string
  description: string
  language: string
  defaultBranch: string
  status: ApplicationStatus
  createdAt: string
  updatedAt: string
}

export interface CreateApplicationInput {
  name: string
  repoUrl: string
  description: string
  language?: string
  defaultBranch?: string
}

export interface UpdateApplicationInput {
  name?: string
  repoUrl?: string
  description?: string
  status?: ApplicationStatus
  language?: string
  defaultBranch?: string
}
