import 'server-only';
import postgres from 'postgres';
let client: ReturnType<typeof postgres> | undefined;
export function db() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_NOT_CONFIGURED');
  client ??= postgres(process.env.DATABASE_URL, { prepare: false, max: 5, idle_timeout: 20, connect_timeout: 10, ssl: process.env.DATABASE_SSL === 'false' ? false : 'require' });
  return client;
}
