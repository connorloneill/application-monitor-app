import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb'
import { config } from '../../config'

const client = new DynamoDBClient({ region: config.aws.region })

export const docClient = DynamoDBDocumentClient.from(client, {
  marshallOptions: { removeUndefinedValues: true },
})

export function tableName(suffix: string): string {
  return `${config.dynamodb.tablePrefix}${suffix}`
}
