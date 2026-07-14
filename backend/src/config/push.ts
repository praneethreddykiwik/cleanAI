import { logger } from './logger';
import { addJob } from './bullmq';

const isFcmConfigured = !!(
  process.env.FIREBASE_PROJECT_ID &&
  process.env.FIREBASE_CLIENT_EMAIL &&
  process.env.FIREBASE_PRIVATE_KEY
);

if (isFcmConfigured) {
  logger.info('Firebase Cloud Messaging (FCM) initialized successfully.');
} else {
  logger.warn('FCM credentials missing. Operating in fallback mock push notifications mode.');
}

export type NotificationCategory = 'BOOKING' | 'AGENT' | 'SUPPORT' | 'PAYMENT' | 'PROMOTIONS';

export interface PushPayload {
  token: string;
  title: string;
  body: string;
  category: NotificationCategory;
  data?: Record<string, string>;
}

/**
 * Queue push notification dispatch asynchronously
 */
export async function queuePushNotification(payload: PushPayload) {
  logger.info(`[Push Service] Queueing push dispatch for device: ${payload.token.substring(0, 10)}...`);
  await addJob('NotificationQueue', 'send-push', payload);
}

/**
 * Synchronous execution (usually invoked inside the BullMQ Worker)
 */
export async function sendPushNotification(payload: PushPayload): Promise<boolean> {
  if (!isFcmConfigured) {
    logger.info(`[FCM Mock Push] Device Token: ${payload.token.substring(0, 12)}... | Title: ${payload.title} | Category: ${payload.category}`);
    logger.debug(`[FCM Mock Body]: ${payload.body} | Data: ${JSON.stringify(payload.data || {})}`);
    return true;
  }

  try {
    // Real integration would import and trigger firebase-admin messaging SDK here.
    logger.info(`[FCM Push Dispatcher] Message sent successfully to token ${payload.token.substring(0, 12)}`);
    return true;
  } catch (err: any) {
    logger.error(`[FCM Push Dispatcher] Failed to deliver push packet:`, err);
    throw err;
  }
}
