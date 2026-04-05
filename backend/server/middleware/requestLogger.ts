import type { Request, Response, NextFunction } from 'express';

export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
    if (!req.originalUrl.startsWith('/api')) {
        next();
        return;
    }

    const start = Date.now();

    res.on('finish', () => {
        const durationMs = Date.now() - start;
        console.info(`[api] ${req.method} ${req.originalUrl} -> ${res.statusCode} (${durationMs}ms)`);
    });

    next();
};
