/**
 * Retrieval route — GET /api/analyze/:appId (retrieval portion)
 *
 * Member 2 owns the retrieval data logic behind this endpoint.
 * Member 3 (integration owner) owns the full Express route wiring,
 * AI analysis, and the final report assembly.
 *
 * This handler returns the raw RetrievalOutput so that Member 3 can
 * consume it in the integration route. In the final integrated app,
 * Member 3's route will call retrieveAppData() directly and pass its
 * output to the Privacy Engine — this handler exists for standalone
 * testing and for Member 3 to use as a reference.
 *
 * Endpoint: GET /api/retrieve/:appId
 */

import { Router, Request, Response } from 'express';
import { retrieveAppData } from '../retrieval/retrievalOrchestrator';
import { ErrorResponse } from '../types';

const router = Router();

router.get('/:appId', async (req: Request, res: Response) => {
  const appIdParam = req.params['appId'];
  const appId = Array.isArray(appIdParam) ? appIdParam[0] : appIdParam;

  if (!appId || appId.trim().length === 0) {
    const body: ErrorResponse = {
      error: { code: 'INVALID_APP_ID', message: 'A valid app ID is required.' },
    };
    res.status(400).json(body);
    return;
  }

  const result = await retrieveAppData(appId.trim());

  if (result.notFound) {
    const body: ErrorResponse = {
      error: { code: 'APP_NOT_FOUND', message: 'The requested application could not be found.' },
    };
    res.status(404).json(body);
    return;
  }

  if (!result.output) {
    const body: ErrorResponse = {
      error: {
        code: 'RETRIEVAL_FAILED',
        message: 'App data retrieval could not be completed. Please try again.',
      },
    };
    res.status(502).json(body);
    return;
  }

  // Return retrieval output directly (for M2 standalone testing / M3 integration)
  res.status(200).json(result.output);
});

export default router;
