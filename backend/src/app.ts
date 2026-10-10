/**
 * PrivacyLens — Express application setup.
 * Member 3 (integration owner) coordinates the /api/analyze route.
 * Member 2 owns /api/search and /api/retrieve.
 */

import express from 'express';
import searchRouter from './routes/searchRoute';
import retrieveRouter from './routes/retrieveRoute';
import analyzeRouter from './routes/analyzeRoute';

export function createApp(): express.Application {
  const app = express();

  app.use(express.json());

  // CORS headers — permissive for local hackathon dev; tighten for production
  app.use((_req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    next();
  });

  // --- Member 2 routes ---
  app.use('/api/search', searchRouter);

  // Standalone retrieval endpoint for testing and Member 3 integration reference.
  // Member 3's /api/analyze/:appId will call retrieveAppData() directly.
  app.use('/api/retrieve', retrieveRouter);
  app.use('/api/analyze', analyzeRouter);

  // --- Health check ---
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', service: 'PrivacyLens Backend' });
  });

  // --- 404 fallback ---
  app.use((_req, res) => {
    res.status(404).json({
      error: { code: 'INTERNAL_ERROR', message: 'Route not found.' },
    });
  });

  // --- Global error handler (no stack traces to client) ---
  app.use(
    (
      err: unknown,
      _req: express.Request,
      res: express.Response,
      _next: express.NextFunction,
    ) => {
      console.error('[PrivacyLens] Unhandled error:', err);
      res.status(500).json({
        error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred.' },
      });
    },
  );

  return app;
}
