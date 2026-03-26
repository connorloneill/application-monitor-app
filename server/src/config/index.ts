function required(key: string): string {
  const value = process.env[key]
  if (!value) throw new Error(`Missing required environment variable: ${key}`)
  return value
}

export const config = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: parseInt(process.env.PORT ?? '3000', 10),
  clientUrl: process.env.CLIENT_URL ?? 'http://localhost:5173',

  jwt: {
    secret: required('JWT_SECRET'),
    expiresIn: process.env.JWT_EXPIRES_IN ?? '8h',
  },

  aws: {
    region: process.env.AWS_REGION ?? 'us-east-1',
  },

  bedrock: {
    modelId: process.env.BEDROCK_MODEL_ID ?? 'anthropic.claude-sonnet-4-6',
  },

  dynamodb: {
    tablePrefix: process.env.DYNAMODB_TABLE_PREFIX ?? 'myapp_',
  },

  s3: {
    bucketName: process.env.S3_BUCKET_NAME ?? '',
  },

  log: {
    level: process.env.LOG_LEVEL ?? 'info',
  },
}
