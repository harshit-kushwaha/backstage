import { errorHandler } from '@backstage/backend-common';
import express from 'express';
import Router from 'express-promise-router';
import { Logger } from 'winston';

export interface RouterOptions {
  logger: Logger;
}

export async function createRouter(
  options: RouterOptions,
): Promise<express.Router> {
  const { logger } = options;

  const router = Router();
  router.use(express.json());

  router.get('/health', (_, response) => {
    logger.info('PONG!');
    response.statusCode = 200
    // response.statusCode = Math.random() > 0.5 ? 200 : 400;
    response.json({ status: 'ok' });
  });
  router.use(errorHandler());
  return router;
}
