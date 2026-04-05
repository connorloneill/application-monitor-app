import { v4 as uuidv4 } from 'uuid'
import {
  QueryCommand,
  GetCommand,
  PutCommand,
  DeleteCommand,
} from '@aws-sdk/lib-dynamodb'
import { docClient, tableName } from './aws/dynamodb'
import { AppError } from '../middleware/errorHandler'
import * as applicationService from './applicationService'
import type { Issue, CreateIssueInput, UpdateIssueInput } from '../models'

const TABLE = tableName('issues')

export async function getByApplicationId(
  applicationId: string,
  filters?: { severity?: string; status?: string }
): Promise<Issue[]> {
  let filterExpression: string | undefined
  const expressionValues: Record<string, string> = {
    ':appId': applicationId,
  }
  const filterParts: string[] = []

  if (filters?.severity) {
    filterParts.push('severity = :severity')
    expressionValues[':severity'] = filters.severity
  }
  if (filters?.status) {
    filterParts.push('#issueStatus = :status')
    expressionValues[':status'] = filters.status
  }

  if (filterParts.length > 0) {
    filterExpression = filterParts.join(' AND ')
  }

  const result = await docClient.send(
    new QueryCommand({
      TableName: TABLE,
      IndexName: 'applicationId-reportedAt-index',
      KeyConditionExpression: 'applicationId = :appId',
      FilterExpression: filterExpression,
      ExpressionAttributeValues: expressionValues,
      ...(filters?.status
        ? { ExpressionAttributeNames: { '#issueStatus': 'status' } }
        : {}),
      ScanIndexForward: false,
    })
  )
  return (result.Items ?? []) as Issue[]
}

export async function getById(id: string): Promise<Issue> {
  const result = await docClient.send(
    new GetCommand({ TableName: TABLE, Key: { id } })
  )
  if (!result.Item) throw new AppError(404, `Issue ${id} not found`)
  return result.Item as Issue
}

export async function create(input: CreateIssueInput): Promise<Issue> {
  await applicationService.getById(input.applicationId)

  const now = new Date().toISOString()
  const issue: Issue = {
    id: uuidv4(),
    applicationId: input.applicationId,
    title: input.title,
    description: input.description,
    severity: input.severity,
    status: 'open',
    errorMessage: input.errorMessage,
    stackTrace: input.stackTrace,
    metadata: input.metadata,
    reportedAt: now,
    updatedAt: now,
  }
  await docClient.send(new PutCommand({ TableName: TABLE, Item: issue }))
  return issue
}

export async function update(id: string, input: UpdateIssueInput): Promise<Issue> {
  const existing = await getById(id)
  const updated: Issue = {
    ...existing,
    ...input,
    updatedAt: new Date().toISOString(),
  }
  await docClient.send(new PutCommand({ TableName: TABLE, Item: updated }))
  return updated
}

export async function remove(id: string): Promise<void> {
  await getById(id)
  await docClient.send(new DeleteCommand({ TableName: TABLE, Key: { id } }))
}
