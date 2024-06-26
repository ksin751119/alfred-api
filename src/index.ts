import 'dotenv/config';

import { Route } from './types';
import cors from '@middy/http-cors';
import { eoaAutomation } from './eoa';
import { errorHandler, logger, responseSerializer } from './middlewares';
import { getHealthRate } from './info';
import httpHeaderNormalizer from '@middy/http-header-normalizer';
import httpJsonBodyParser from '@middy/http-json-body-parser';
import httpRouterHandler from '@middy/http-router';
import middy from '@middy/core';
import { safeAutomation } from './safe';
import { taskAutomation } from './task';
import warmup from '@middy/warmup';

const routes: Route[] = [
  {
    method: 'GET',
    path: '/healthRate',
    handler: getHealthRate,
  },
  {
    method: 'POST',
    path: '/task/{account}',
    handler: taskAutomation,
  },
  // {
  //   method: "POST",
  //   path: "/safe/{account}",
  //   handler: safeAutomation,
  // },
];

export const handler = middy()
  .use(warmup())
  .use(httpHeaderNormalizer())
  .use(httpJsonBodyParser())
  .use(logger)
  .use(errorHandler)
  .use(responseSerializer)
  .use(cors())
  .handler(httpRouterHandler(routes));
