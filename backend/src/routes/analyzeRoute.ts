import { Router, Request, Response } from 'express';
import { retrieveAppData } from '../retrieval/retrievalOrchestrator';
import {
  analyzePrivacyPolicy,
  requiresSelectivePolicyAnalysis,
} from '../../../src/privacy-engine/policy-extraction';
import { comparePrivacySources } from '../../../src/privacy-engine/comparison-engine';
import { buildPrivacyReport } from '../../../src/privacy-engine/report-generator';

const router = Router();

router.get('/:appId', async (req: Request, res: Response) => {
  const appId = Array.isArray(req.params.appId) ? req.params.appId[0] : req.params.appId;
  if (!appId?.trim()) {
    res.status(400).json({ error: { code: 'INVALID_APP_ID', message: 'A valid app ID is required.' } });
    return;
  }

  const retrieval = await retrieveAppData(appId.trim());
  if (retrieval.notFound) {
    res.status(404).json({ error: { code: 'APP_NOT_FOUND', message: 'The requested application could not be found.' } });
    return;
  }
  if (!retrieval.output) {
    res.status(502).json({ error: { code: 'RETRIEVAL_FAILED', message: 'App data retrieval could not be completed.' } });
    return;
  }

  const data = retrieval.output;
  let policyAnalysis = null;
  let aiAnalysisStatus: 'available' | 'failed' | 'unavailable' = 'unavailable';
  const usedSelectivePolicyAnalysis = Boolean(
    data.privacyPolicy.text && requiresSelectivePolicyAnalysis(data.privacyPolicy.text),
  );
  if (data.privacyPolicy.text && data.sourceStatus.privacyPolicy !== 'failed') {
    try {
      policyAnalysis = await analyzePrivacyPolicy(data.privacyPolicy.text);
      aiAnalysisStatus = 'available';
    } catch (error: unknown) {
      aiAnalysisStatus = 'failed';
      const message = error instanceof Error ? error.message : 'Unknown analysis error';
      console.warn(`[PrivacyLens] Policy analysis failed for ${appId}: ${message}`);
    }
  }

  const sourceStatus = { ...data.sourceStatus, aiAnalysis: aiAnalysisStatus } as const;
  const comparisonSourceStatus = usedSelectivePolicyAnalysis
    ? { ...sourceStatus, privacyPolicy: 'unavailable' as const }
    : sourceStatus;
  const comparisons = comparePrivacySources({
    permissions: data.permissions,
    dataSafety: data.dataSafety,
    policyAnalysis,
    sourceStatus: comparisonSourceStatus,
  });
  if (usedSelectivePolicyAnalysis && policyAnalysis) {
    comparisons.push({
      id: 'comparison-policy-selective-analysis',
      type: 'INSUFFICIENT_INFORMATION',
      severity: null,
      title: 'Long policy analyzed using selected excerpts',
      explanation:
        'The policy exceeded the analysis limit, so privacy-relevant excerpts were inspected. Unseen policy text remains unknown.',
      sources: ['privacyPolicy'],
      evidenceIds: [],
      status: 'insufficient_information',
    });
  }
  const report = buildPrivacyReport({
    app: data.app,
    permissions: data.permissions,
    dataSafety: data.dataSafety,
    policyAnalysis,
    sourceStatus,
    comparisons,
    policyUrl: data.privacyPolicy.url,
    aiAnalysisStatus,
  });
  res.status(200).json(report);
});

export default router;
