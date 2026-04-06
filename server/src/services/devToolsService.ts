import { ScanCommand, BatchWriteCommand } from '@aws-sdk/lib-dynamodb'
import { docClient, tableName } from './aws/dynamodb'
import { config } from '../config'
import { logger } from '../utils/logger'

const log = logger.child({ module: 'devToolsService' })

// Tables to reset and their primary key attribute names
const TABLES_TO_RESET: { name: string; keyAttr: string }[] = [
  { name: config.problemReports.tableName, keyAttr: 'report_id' },
  { name: tableName('issues'), keyAttr: 'id' },
  { name: tableName('diagnoses'), keyAttr: 'id' },
  { name: tableName('applications'), keyAttr: 'id' },
  { name: tableName('ai_usage'), keyAttr: 'id' },
  { name: tableName('ai_event_log'), keyAttr: 'id' },
  { name: tableName('batch_results'), keyAttr: 'id' },
  { name: tableName('batch_ratings'), keyAttr: 'id' },
]

async function deleteAllFromTable(
  tableNameStr: string,
  keyAttr: string
): Promise<number> {
  let totalDeleted = 0
  let lastEvaluatedKey: Record<string, unknown> | undefined

  do {
    const scan = await docClient.send(
      new ScanCommand({
        TableName: tableNameStr,
        ProjectionExpression: keyAttr,
        ExclusiveStartKey: lastEvaluatedKey,
      })
    )

    const items = scan.Items ?? []
    lastEvaluatedKey = scan.LastEvaluatedKey

    // BatchWrite supports max 25 items per batch
    for (let i = 0; i < items.length; i += 25) {
      const batch = items.slice(i, i + 25)
      await docClient.send(
        new BatchWriteCommand({
          RequestItems: {
            [tableNameStr]: batch.map((item) => ({
              DeleteRequest: { Key: { [keyAttr]: item[keyAttr] } },
            })),
          },
        })
      )
      totalDeleted += batch.length
    }
  } while (lastEvaluatedKey)

  return totalDeleted
}

export async function resetAllData(): Promise<{ message: string; deleted: number }> {
  log.info('Starting full data reset')
  let totalDeleted = 0

  for (const table of TABLES_TO_RESET) {
    try {
      const deleted = await deleteAllFromTable(table.name, table.keyAttr)
      log.info(`Deleted ${deleted} items from ${table.name}`)
      totalDeleted += deleted
    } catch (err) {
      // Table might not exist yet — skip gracefully
      log.warn(`Failed to reset table ${table.name}: ${(err as Error).message}`)
    }
  }

  log.info(`Data reset complete: ${totalDeleted} total items deleted`)
  return { message: 'All data has been reset', deleted: totalDeleted }
}
