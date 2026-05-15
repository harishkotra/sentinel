import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const apiRoot = path.resolve(__dirname, '..');

const envCandidates = [
  path.join(apiRoot, '.env'),
  path.resolve(process.cwd(), 'apps/api/.env'),
  path.resolve(process.cwd(), '.env')
];

for (const envPath of envCandidates) {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath, override: false });
    break;
  }
}

const defaultDbPath = path.join(apiRoot, 'prisma', 'dev.db');
fs.mkdirSync(path.dirname(defaultDbPath), { recursive: true });

if (!process.env.DATABASE_URL || process.env.DATABASE_URL === 'file:./prisma/dev.db') {
  process.env.DATABASE_URL = `file:${defaultDbPath}`;
}

export function getApiRoot() {
  return apiRoot;
}
