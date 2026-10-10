/**
 * PrivacyLens backend entry point.
 * Reads PORT from environment (default 4000).
 */

import { createApp } from './app';

const PORT = parseInt(process.env['PORT'] ?? '4000', 10);

const app = createApp();

app.listen(PORT, () => {
  console.log(`[PrivacyLens] Server running on http://localhost:${PORT}`);
  console.log(`[PrivacyLens] Health: http://localhost:${PORT}/health`);
  console.log(`[PrivacyLens] Search: http://localhost:${PORT}/api/search?q=spotify`);
});
