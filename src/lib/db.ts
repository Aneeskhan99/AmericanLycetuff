import "server-only";
import { Pool, type PoolClient, type QueryResultRow } from "pg";

/**
 * PostgreSQL connection for the admin and the form endpoints.
 * Every query goes through q()/one() with $1, $2… placeholders — never string-built SQL.
 *
 * The public pages do not need the database to build: anything that reads content
 * for a page catches the error and falls back to the code defaults.
 */
declare global {
  var __alsPool: Pool | undefined;
}

export function dbConfigured() {
  return Boolean(process.env.DATABASE_URL);
}

function pool(): Pool {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set. Copy .env.example to .env.local and run `npm run db:setup`.");
  }
  // Reuse one pool across hot reloads in dev.
  if (!globalThis.__alsPool) {
    globalThis.__alsPool = new Pool({ connectionString: process.env.DATABASE_URL, max: 10 });
  }
  return globalThis.__alsPool;
}

export async function q<T extends QueryResultRow = QueryResultRow>(sql: string, params: unknown[] = []): Promise<T[]> {
  const res = await pool().query<T>(sql, params);
  return res.rows;
}

export async function one<T extends QueryResultRow = QueryResultRow>(sql: string, params: unknown[] = []): Promise<T | null> {
  const rows = await q<T>(sql, params);
  return rows[0] ?? null;
}

/** Runs fn inside a transaction; rolls back if it throws. */
export async function tx<T>(fn: (c: PoolClient) => Promise<T>): Promise<T> {
  const c = await pool().connect();
  try {
    await c.query("BEGIN");
    const out = await fn(c);
    await c.query("COMMIT");
    return out;
  } catch (e) {
    await c.query("ROLLBACK");
    throw e;
  } finally {
    c.release();
  }
}

/** Records who changed what. Never throws (an audit failure must not break the action). */
export async function audit(userId: number | null, entity: string, entityId: string | number | null, action: string, detail: Record<string, unknown> = {}) {
  try {
    await q(`INSERT INTO audit_log (user_id, entity, entity_id, action, detail) VALUES ($1, $2, $3, $4, $5)`, [
      userId,
      entity,
      entityId === null ? null : String(entityId),
      action,
      JSON.stringify(detail),
    ]);
  } catch (e) {
    console.error("[audit]", e);
  }
}
