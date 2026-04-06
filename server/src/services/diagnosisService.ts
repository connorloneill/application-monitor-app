import { v4 as uuidv4 } from 'uuid'
import {
  QueryCommand,
  GetCommand,
  PutCommand,
} from '@aws-sdk/lib-dynamodb'
import { docClient, tableName } from './aws/dynamodb'
import { AppError } from '../middleware/errorHandler'
import { config } from '../config'
import type { Diagnosis, CreateDiagnosisInput } from '../models'

const TABLE = tableName('diagnoses')

export async function getByIssueId(issueId: string): Promise<Diagnosis[]> {
  const result = await docClient.send(
    new QueryCommand({
      TableName: TABLE,
      IndexName: 'issueId-createdAt-index',
      KeyConditionExpression: 'issueId = :issueId',
      ExpressionAttributeValues: { ':issueId': issueId },
      ScanIndexForward: false,
    })
  )
  return (result.Items ?? []) as Diagnosis[]
}

export async function getById(id: string): Promise<Diagnosis> {
  const result = await docClient.send(
    new GetCommand({ TableName: TABLE, Key: { id } })
  )
  if (!result.Item) throw new AppError(404, `Diagnosis ${id} not found`)
  return result.Item as Diagnosis
}

export async function create(input: CreateDiagnosisInput): Promise<Diagnosis> {
  const now = new Date().toISOString()
  const diagnosis: Diagnosis = {
    id: uuidv4(),
    issueId: input.issueId,
    applicationId: input.applicationId,
    level: input.level ?? 'deep',
    status: 'pending',
    summary: '',
    codeSnippets: [],
    modelId: config.bedrock.modelId,
    promptVersion: '',
    createdAt: now,
  }
  await docClient.send(new PutCommand({ TableName: TABLE, Item: diagnosis }))
  return diagnosis
}

export async function update(
  id: string,
  partial: Partial<Diagnosis>
): Promise<Diagnosis> {
  const existing = await getById(id)
  const updated: Diagnosis = { ...existing, ...partial }
  await docClient.send(new PutCommand({ TableName: TABLE, Item: updated }))
  return updated
}
