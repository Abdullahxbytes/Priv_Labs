import assert from 'node:assert/strict';
import { adaptDataSafety } from '../src/retrieval/dataSafetyAdapter';

const fixture = {
  collectedData: [{ type: 'Location', data: 'Precise location', purpose: 'App functionality' }],
  sharedData: [{ type: 'Device or other IDs', data: 'Device or other IDs', purpose: 'Advertising or marketing' }],
  securityPractices: [{ practice: "Data can't be deleted" }],
  privacyPolicyUrl: 'https://example.com/privacy',
};
const result = adaptDataSafety(fixture);
assert.equal(result.status, 'available');
assert.equal(result.dataSafety.collected[0].type, 'Precise location');
assert.equal(result.dataSafety.shared.length, 1);
assert.equal(result.dataSafety.deletionAvailable, false);
assert.equal(result.privacyPolicyUrl, fixture.privacyPolicyUrl);
assert.equal(adaptDataSafety({ ...fixture, securityPractices: [{ practice: 'Deletion information' }] }).dataSafety.deletionAvailable, null);
assert.equal(adaptDataSafety({ collectedData: [], sharedData: [], securityPractices: [] }).status, 'unavailable');
assert.throws(() => adaptDataSafety([]));
console.log('Retrieval adapter smoke test passed.');
