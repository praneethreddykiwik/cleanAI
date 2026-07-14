import { Request, Response, NextFunction } from 'express';

export function notFoundHandler(req: Request, res: Response, _next: NextFunction) {
  res.status(404).json({
    success: false,
    message: `API Route Not Found — Cannot ${req.method} ${req.originalUrl}`,
  });
}
