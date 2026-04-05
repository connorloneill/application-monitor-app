import {
  ScanCommand,
  GetCommand,
  QueryCommand,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb'
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { docClient } from './aws/dynamodb'
import { config } from '../config'
import { AppError } from '../middleware/errorHandler'
import type { ProblemReport, ReportStatus } from '../models'

const TABLE = config.problemReports.tableName
const BUCKET = config.problemReports.screenshotBucket
const s3 = new S3Client({ region: config.aws.region })

export async function getAll(): Promise<ProblemReport[]> {
  const result = await docClient.send(new ScanCommand({ TableName: TABLE }))
  return (result.Items ?? []) as ProblemReport[]
}

export async function getById(reportId: string): Promise<ProblemReport> {
  const result = await docClient.send(
    new GetCommand({ TableName: TABLE, Key: { report_id: reportId } })
  )
  if (!result.Item) throw new AppError(404, `Problem report ${reportId} not found`)
  return result.Item as ProblemReport
}

export async function getByAppName(
  appName: string,
  filters?: { status?: string }
): Promise<ProblemReport[]> {
  let filterExpression: string | undefined
  const expressionValues: Record<string, string> = { ':appName': appName }
  const expressionNames: Record<string, string> = {}

  if (filters?.status) {
    filterExpression = '#reportStatus = :status'
    expressionValues[':status'] = filters.status
    expressionNames['#reportStatus'] = 'status'
  }

  const result = await docClient.send(
    new QueryCommand({
      TableName: TABLE,
      IndexName: 'app-name-index',
      KeyConditionExpression: 'app_name = :appName',
      FilterExpression: filterExpression,
      ExpressionAttributeValues: expressionValues,
      ...(Object.keys(expressionNames).length > 0
        ? { ExpressionAttributeNames: expressionNames }
        : {}),
      ScanIndexForward: false,
    })
  )
  return (result.Items ?? []) as ProblemReport[]
}

export async function getDistinctAppNames(): Promise<string[]> {
  const reports = await getAll()
  const names = new Set(reports.map((r) => r.app_name))
  return Array.from(names).sort()
}

export async function updateStatus(
  reportId: string,
  status: ReportStatus
): Promise<ProblemReport> {
  await docClient.send(
    new UpdateCommand({
      TableName: TABLE,
      Key: { report_id: reportId },
      UpdateExpression: 'SET #reportStatus = :status',
      ExpressionAttributeNames: { '#reportStatus': 'status' },
      ExpressionAttributeValues: { ':status': status },
      ConditionExpression: 'attribute_exists(report_id)',
    })
  )
  return getById(reportId)
}

export async function getScreenshotUrl(screenshotKey: string): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: BUCKET,
    Key: screenshotKey,
  })
  return getSignedUrl(s3, command, { expiresIn: 300 })
}
