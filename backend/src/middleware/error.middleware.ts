import { Request, Response, NextFunction } from 'express';
import { logger } from '@/config/logger';

export interface StandardRequest extends Request {
  requestId?: string;
  startTime?: bigint;
}

/**
 * Assigns a unique Request ID and initializes high-resolution duration tracking
 */
export function requestInitializer(req: StandardRequest, res: Response, next: NextFunction) {
  const shortId = Math.random().toString(36).substring(2, 9);
  req.requestId = `req_${shortId}`;
  req.startTime = process.hrtime.bigint();
  
  // Set in response header so clients/inspectors can reference it
  res.setHeader('X-Request-Id', req.requestId);
  
  next();
}

/**
 * Centralized error handler returning structured errors
 */
export function globalErrorHandler(
  err: any,
  req: StandardRequest,
  res: Response,
  next: NextFunction
) {
  const requestId = req.requestId || 'N/A';
  const statusCode = err.status || err.statusCode || 500;
  
  logger.error(`[API Error] Request: ${requestId} | Path: ${req.path} | Error: ${err.message || err}`, {
    stack: process.env.NODE_ENV !== 'production' ? err.stack : undefined,
  });

  return res.status(statusCode).json({
    success: false,
    error: {
      code: err.code || 'INTERNAL_SERVER_ERROR',
      message: err.message || 'An unexpected error occurred.',
      requestId,
      details: err.details || {}
    }
  });
}
