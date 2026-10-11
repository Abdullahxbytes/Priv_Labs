import { z } from 'zod';
import type { DataSafetyResult } from './appDataRetrieval';

const row = z.object({ type: z.string(), data: z.string(), purpose: z.string().optional() });
const shape = z.object({
  collectedData: z.array(row), sharedData: z.array(row),
  securityPractices: z.array(z.object({ practice: z.string(), description: z.string().optional() })),
  privacyPolicyUrl: z.string().nullish(),
});

export function adaptDataSafety(raw: unknown): DataSafetyResult {
  const data = shape.parse(raw);
  const mapRow = (item: z.infer<typeof row>) => ({ type: item.data, label: item.data, purposes: item.purpose ? [item.purpose] : [] });
  const practices = data.securityPractices.map(item => [item.practice, item.description].filter(Boolean).join(': '));
  // Only explicit positive/negative declarations establish deletion availability.
  const positive = data.securityPractices.some(item => /^you can request that data be deleted\.?$/i.test(item.practice.trim()));
  const negative = data.securityPractices.some(item => /^data can[’']t be deleted\.?$/i.test(item.practice.trim()));
  const hasContent = data.collectedData.length + data.sharedData.length + practices.length > 0;
  return {
    dataSafety: {
      collected: data.collectedData.map(mapRow),
      shared: data.sharedData.map(item => ({ ...mapRow(item), recipients: [] })),
      securityPractices: practices,
      deletionAvailable: positive && !negative ? true : negative && !positive ? false : null,
    },
    status: hasContent ? 'available' : 'unavailable',
    privacyPolicyUrl: data.privacyPolicyUrl ?? null,
  };
}
