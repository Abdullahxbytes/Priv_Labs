/**
 * Search route — GET /api/search?q=<app-name>
 *
 * Owned by Member 2 (App Data / Retrieval).
 * Endpoint wiring coordinated with Member 3 (integration owner).
 *
 * Returns multiple matching apps. Never auto-selects the first result.
 * Empty results → 200 with { results: [] }.
 * Failed search → 502 with SEARCH_FAILED error.
 */

import { Router, Request, Response } from 'express';
import { searchApps } from '../search/appSearch';
import { ErrorResponse, SearchResponse } from '../types';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  const q = req.query['q'];

  // Validate query — missing, empty, or whitespace-only → 400
  if (!q || typeof q !== 'string' || q.trim().length === 0) {
    const body: ErrorResponse = {
      error: { code: 'INVALID_QUERY', message: 'A non-empty search query is required.' },
    };
    res.status(400).json(body);
    return;
  }

  const result = await searchApps(q.trim());

  if (result.error !== undefined) {
    const body: ErrorResponse = {
      error: {
        code: 'SEARCH_FAILED',
        message: 'App search could not be completed. Please try again.',
      },
    };
    res.status(502).json(body);
    return;
  }

  const body: SearchResponse = { results: result.results };
  res.status(200).json(body);
});

export default router;
