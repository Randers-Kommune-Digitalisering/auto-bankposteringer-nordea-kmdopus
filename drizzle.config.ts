import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';
import env from './app/lib/env';

export default defineConfig({
  out: './drizzle',
  schema: './app/lib/db/schema/index.ts',
  dialect: 'postgresql',
  dbCredentials: {
    url: env.DATABASE_URL,
  },
});
