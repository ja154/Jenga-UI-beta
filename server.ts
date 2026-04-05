import express from 'express';
import cors from 'cors';
import path from 'path';
import { createServer as createViteServer, loadEnv } from 'vite';
import { aiRouter } from './backend/server/routes/aiRoutes.ts';
import { scrapeRouter } from './backend/server/routes/scrapeRoutes.ts';
import { designSystemRouter } from './backend/server/routes/designSystemRoutes.ts';
import { requestLogger } from './backend/server/middleware/requestLogger.ts';
import { apiErrorHandler } from './backend/server/middleware/apiErrorHandler.ts';

const PORT = 5000;

const bootstrapEnv = (): void => {
    const mode = process.env.NODE_ENV === 'production' ? 'production' : 'development';
    const env = loadEnv(mode, process.cwd(), '');

    if (!process.env.GEMINI_API_KEY && env.GEMINI_API_KEY) {
        process.env.GEMINI_API_KEY = env.GEMINI_API_KEY;
    }
};

async function startServer() {
    bootstrapEnv();

    const app = express();

    app.disable('x-powered-by');
    app.use(cors());
    app.use(express.json({ limit: '25mb' }));
    app.use(express.urlencoded({ extended: true, limit: '25mb' }));
    app.use(requestLogger);

    app.use('/api/ai', aiRouter);
    app.use('/api', scrapeRouter);
    app.use('/api', designSystemRouter);

    app.use('/api', (_req, res) => {
        res.status(404).json({ error: 'API route not found' });
    });

    app.use(apiErrorHandler);

    if (process.env.NODE_ENV !== 'production') {
        const vite = await createViteServer({
            server: { middlewareMode: true },
            appType: 'spa',
        });
        app.use(vite.middlewares);
    } else {
        const distPath = path.resolve(process.cwd(), 'dist');
        app.use(express.static(distPath));
        app.get('*', (_req, res) => {
            res.sendFile(path.join(distPath, 'index.html'));
        });
    }

    app.listen(PORT, '0.0.0.0', () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
}

startServer().catch((error) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[server] Failed to start: ${message}`);
    process.exit(1);
});
