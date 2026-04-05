import type { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/errors.ts';

export const apiErrorHandler = (err: unknown, req: Request, res: Response, next: NextFunction): void => {
    if (!req.originalUrl.startsWith('/api')) {
        next(err);
        return;
    }

    if (err instanceof ApiError) {
        console.error(`[api] ${req.method} ${req.originalUrl} failed: ${err.message}`);
        res.status(err.statusCode).json({ error: err.message });
        return;
    }

    const message = err instanceof Error ? err.message : 'Internal server error';
    console.error(`[api] ${req.method} ${req.originalUrl} failed: ${message}`);
    res.status(500).json({ error: message || 'Internal server error' });
};
