import type { Application } from 'express';
import { createApp } from './app';
import { EnvValidator } from './config/env.validation';
import { initEventBusListeners } from './utils/listeners';

/**
 * The Express application is built once per server instance and reused across
 * requests. On Vercel this means it is created on a cold start and then shared
 * by every warm invocation, which is what we want — building it per request
 * would re-run all middleware setup and leak Prisma connections.
 */
let app: Application | undefined;

export function getApp(): Application {
  if (!app) {
    EnvValidator.validate();
    initEventBusListeners();
    app = createApp();
  }
  return app;
}
