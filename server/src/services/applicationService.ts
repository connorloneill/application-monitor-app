import { v4 as uuidv4 } from 'uuid'
import {
  ScanCommand,
  GetCommand,
  PutCommand,
} from '@aws-sdk/lib-dynamodb'
import { docClient, tableName } from './aws/dynamodb'
import { AppError } from '../middleware/errorHandler'
import type { Application, CreateApplicationInput, UpdateApplicationInput } from '../models'

const TABLE = tableName('applications')

export async function getAll(): Promise<Application[]> {
  const result = await docClient.send(new ScanCommand({ TableName: TABLE }))
  return (result.Items ?? []) as Application[]
}

export async function getById(id: string): Promise<Application> {
  const result = await docClient.send(
    new GetCommand({ TableName: TABLE, Key: { id } })
  )
  if (!result.Item) throw new AppError(404, `Application ${id} not found`)
  return result.Item as Application
}

export async function create(input: CreateApplicationInput): Promise<Application> {
  const now = new Date().toISOString()
  const application: Application = {
    id: uuidv4(),
    name: input.name,
    repoUrl: input.repoUrl,
    description: input.description,
    language: input.language ?? 'unknown',
    defaultBranch: input.defaultBranch ?? 'main',
    status: 'active',
    createdAt: now,
    updatedAt: now,
  }
  await docClient.send(new PutCommand({ TableName: TABLE, Item: application }))
  return application
}

export async function update(
  id: string,
  input: UpdateApplicationInput
): Promise<Application> {
  const existing = await getById(id)
  const updated: Application = {
    ...existing,
    ...input,
    updatedAt: new Date().toISOString(),
  }
  await docClient.send(new PutCommand({ TableName: TABLE, Item: updated }))
  return updated
}

export async function remove(id: string): Promise<void> {
  await update(id, { status: 'archived' })
}
