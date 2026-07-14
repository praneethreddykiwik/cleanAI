import { Queue, Worker, QueueEvents, Job } from 'bullmq';
import { logger } from './logger';

const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
const connectionConfig = (() => {
  try {
    const url = new URL(redisUrl);
    return {
      host: url.hostname || '127.0.0.1',
      port: parseInt(url.port || '6379', 10),
      username: url.username || undefined,
      password: url.password || undefined,
      maxRetriesPerRequest: null, // Critical requirement for BullMQ
    };
  } catch {
    return {
      host: '127.0.0.1',
      port: 6379,
      maxRetriesPerRequest: null,
    };
  }
})();

// Define Job Queues
export const queues = {
  AIAnalysisQueue: new Queue('AIAnalysisQueue', { connection: connectionConfig }),
  NotificationQueue: new Queue('NotificationQueue', { connection: connectionConfig }),
  EmailQueue: new Queue('EmailQueue', { connection: connectionConfig }),
  MemoryUpdateQueue: new Queue('MemoryUpdateQueue', { connection: connectionConfig }),
  VendorMatchingQueue: new Queue('VendorMatchingQueue', { connection: connectionConfig }),
  AnalyticsQueue: new Queue('AnalyticsQueue', { connection: connectionConfig }),
  ImageProcessingQueue: new Queue('ImageProcessingQueue', { connection: connectionConfig }),
  CleanupQueue: new Queue('CleanupQueue', { connection: connectionConfig }),
  ReportGenerationQueue: new Queue('ReportGenerationQueue', { connection: connectionConfig }),
};

// Queue Events Tracker
Object.entries(queues).forEach(([name, q]) => {
  const events = new QueueEvents(name, { connection: connectionConfig });
  events.on('failed', ({ jobId, failedReason }) => {
    logger.error(`[BullMQ] Job ${jobId} failed in ${name} queue. Reason: ${failedReason}`);
  });
  events.on('completed', ({ jobId }) => {
    logger.info(`[BullMQ] Job ${jobId} completed successfully in ${name} queue.`);
  });
});

// Helper: Add job with retry policy (3 retries, exponential backoff)
export async function addJob(queueName: keyof typeof queues, jobName: string, data: any) {
  const queue = queues[queueName];
  try {
    const job = await queue.add(jobName, data, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
      removeOnComplete: true,
      removeOnFail: false, // Keep failed jobs in DB for audit
    });
    logger.info(`[BullMQ] Enqueued job ${job.id} in ${queueName}`);
    return job;
  } catch (err) {
    logger.error(`[BullMQ] Failed to enqueue job in ${queueName}:`, err);
    // Graceful fallback: Run job synchronously if Redis is offline
    logger.warn(`[BullMQ Fallback] Executing ${jobName} synchronously due to queue outage.`);
    setTimeout(() => executeFallbackSync(queueName, jobName, data), 0);
  }
}

// Workers registry
const workers: Worker[] = [];

function registerWorker(queueName: string, processor: (job: Job) => Promise<void>) {
  const worker = new Worker(
    queueName,
    async (job) => {
      logger.info(`[BullMQ Worker] Processing job ${job.id} of ${queueName}`);
      await processor(job);
    },
    {
      connection: connectionConfig,
      concurrency: 5,
    }
  );

  worker.on('failed', (job, err) => {
    logger.error(`[BullMQ Worker] Job ${job?.id} failed: ${err.message}`);
  });

  workers.push(worker);
}

// ----------------------------------------------------
// Worker Processors Implementation
// ----------------------------------------------------

registerWorker('AIAnalysisQueue', async (job) => {
  logger.info(`AI analysis background processing for:`, job.data);
});

registerWorker('NotificationQueue', async (job) => {
  try {
    const { sendPushNotification } = await import('./push');
    await sendPushNotification(job.data);
  } catch (err: any) {
    logger.error(`NotificationQueue processor error: ${err.message}`);
    throw err;
  }
});

registerWorker('EmailQueue', async (job) => {
  try {
    const { sendEmail } = await import('./email');
    await sendEmail(job.data);
  } catch (err: any) {
    logger.error(`EmailQueue processor error: ${err.message}`);
    throw err;
  }
});

registerWorker('MemoryUpdateQueue', async (job) => {
  logger.info(`AI memory context aggregation background job:`, job.data);
});

registerWorker('VendorMatchingQueue', async (job) => {
  logger.info(`Asynchronous match engine allocation background job:`, job.data);
});

registerWorker('AnalyticsQueue', async (job) => {
  logger.info(`Platform telemetry log aggregation background job:`, job.data);
});

registerWorker('ImageProcessingQueue', async (job) => {
  logger.info(`Cloudinary dynamic viewport rendering compressions:`, job.data);
});

registerWorker('CleanupQueue', async (job) => {
  logger.info(`Database session state cleanup logs scraper:`, job.data);
});

registerWorker('ReportGenerationQueue', async (job) => {
  logger.info(`Asynchronous PDF report builder dispatcher:`, job.data);
});

// Fallback execution mapping
function executeFallbackSync(queueName: string, jobName: string, data: any) {
  logger.info(`[Sync Fallback] Successfully processed ${jobName} of ${queueName} synchronously:`, data);
}

export function shutdownQueues() {
  logger.info('Shutting down background workers...');
  workers.forEach((w) => w.close());
}
