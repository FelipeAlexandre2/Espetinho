import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL;

export const client = connectionString ? postgres(connectionString, { max: 10 }) : null;
export const db = client ? drizzle(client, { schema }) : null;
