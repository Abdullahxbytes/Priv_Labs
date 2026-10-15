import path from 'node:path';
import dotenv from 'dotenv';

// Local development keeps shared secrets in the repository-root .env file.
// Existing deployment environment variables retain priority.
dotenv.config({
  path: path.resolve(__dirname, '../../.env'),
  override: false,
});
