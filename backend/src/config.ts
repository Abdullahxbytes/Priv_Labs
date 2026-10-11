import { config } from 'dotenv';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';

// Find the backend package from either source or compiled location, independent of cwd.
let directory = __dirname;
while (!existsSync(join(directory, 'package.json')) && dirname(directory) !== directory) directory = dirname(directory);
config({ path: join(directory, '.env') });
config({ path: join(directory, '..', '.env') });
// Existing deployment environment variables take precedence over both local files.
