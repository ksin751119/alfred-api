import type { AWS } from '@serverless/typescript';

const serverlessConfiguration: AWS = {
  service: 'position-automation-poc-backend',
  frameworkVersion: '3',
  plugins: ['serverless-esbuild', 'serverless-offline'],
  useDotenv: true,
  provider: {
    name: 'aws',
    runtime: 'nodejs18.x',
    stage: '${opt:stage}',
    apiName: '${self:service}-${self:provider.stage}',
    apiGateway: {
      minimumCompressionSize: 1024,
      shouldStartNameWithService: true,
      usagePlan: { throttle: { burstLimit: 30, rateLimit: 60 } },
    },
    environment: {
      AWS_NODEJS_CONNECTION_REUSE_ENABLED: '1',
      NODE_OPTIONS: '--enable-source-maps --stack-trace-limit=1000',
    },
  },
  package: {
    individually: true,
    patterns: [
      '!node_modules/.prisma/client/libquery_engine-*',
      '!node_modules/@prisma/engines/**',
      'node_modules/.prisma/client/schema.prisma',
      'node_modules/.prisma/client/libquery_engine-rhel-*',
      'node_modules/.prisma/client/libquery_engine-linux-arm64-*',
    ],
  },
  custom: {
    esbuild: {
      bundle: true,
      minify: false,
      sourcemap: true,
      exclude: ['@aws-sdk/*'],
      target: 'node18',
      define: { 'require.resolve': undefined },
      platform: 'node',
      concurrency: 10,
    },
    warmup: {
      default: {
        enabled: true,
        timeout: 60,
        prewarm: true,
      },
    },
  },
  functions: {
    api: {
      name: '${self:service}-api-${self:provider.stage}',
      handler: 'src/index.handler',
      timeout: 30,
      memorySize: 256,
      events: [{ http: { path: '/{proxy+}', method: 'any', cors: { origin: '*', allowCredentials: false } } }],
      environment: {
        DATABASE_URL: '${env:DATABASE_URL}',
      },
    },
    txMonitor: {
      name: '${self:service}-${self:provider.stage}',
      handler: 'src/task_monitor.handler',
      timeout: 300,
      memorySize: 256,
      events: [
        {
          schedule: {
            name: 'alfred-task-monitor',
            rate: ['cron(0/15 * * * ? *)'], // every 15 mins, for testing set to 1 mins for temp
          },
        },
      ],
      environment: {
        DATABASE_URL: '${env:DATABASE_URL}',
        EXECUTOR_PRIVATE_KEY: '${env:EXECUTOR_PRIVATE_KEY}',
        ALCHEMY_KEY: '${env:ALCHEMY_KEY}',
      },
    },
    txMonitorOp: {
      name: '${self:service}-op-${self:provider.stage}',
      handler: 'src/task_monitor_op.handler',
      timeout: 300,
      memorySize: 256,
      events: [
        {
          schedule: {
            name: 'alfred-task-monitor-op',
            rate: ['cron(0/15 * * * ? *)'], // every 15 mins, for testing set to 1 mins for temp
          },
        },
      ],
      environment: {
        DATABASE_URL: '${env:DATABASE_URL}',
        EXECUTOR_PRIVATE_KEY: '${env:EXECUTOR_PRIVATE_KEY}',
        ALCHEMY_KEY: '${env:ALCHEMY_KEY}',
      },
    },
  },
};

module.exports = serverlessConfiguration;
