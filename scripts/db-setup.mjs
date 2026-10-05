#!/usr/bin/env node
/**
 * npm run db:setup
 *
 *   1. Reads DATABASE_URL from .env.local (falls back to .env).
 *   2. Connects. If the server on that port does not have the database, it looks
 *      on the other usual PostgreSQL ports (5432–5435) — handy when PostgreSQL 17
 *      and 18 are both installed — and fixes the port in .env.local if it finds it.
 *      If no server has it, it offers to create it.
 *   3. Makes sure ADMIN_SESSION_SECRET exists (generates one into .env.local).
 *   4. Applies every db/NNN_*.sql not yet in schema_migrations, one transaction each.
 *   5. Creates the first administrator if there is none.
 *
 * Non-interactive:
 *   npm run db:setup -- --username admin --name "Your Name" --email you@school.pk --password "a good password"
 *
 * Safe to run again any time: it only applies what is missing. Never prints secrets.
 */
import { randomBytes, scrypt as _scrypt } from "node:crypto";
import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { createInterface } from "node:readline";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import pg from "pg";

const scrypt = promisify(_scrypt);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const envFile = path.join(root, ".env.local");

// ---------------------------------------------------------------- helpers
const say = (m = "") => console.log(m);
const fail = (m) => {
  console.error(`\n✖ ${m}\n`);
  process.exit(1);
};

function readEnv() {
  const env = {};
  for (const f of [path.join(root, ".env"), envFile]) {
    if (!existsSync(f)) continue;
    for (const line of readFileSync(f, "utf8").split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (!m) continue;
      let v = m[2];
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
      env[m[1]] = v;
    }
  }
  return env;
}

function setEnv(key, value) {
  let text = existsSync(envFile) ? readFileSync(envFile, "utf8") : "";
  const re = new RegExp(`^${key}=.*$`, "m");
  text = re.test(text) ? text.replace(re, `${key}=${value}`) : `${text}${text && !text.endsWith("\n") ? "\n" : ""}${key}=${value}\n`;
  writeFileSync(envFile, text);
}

function args() {
  const out = {};
  const a = process.argv.slice(2);
  for (let i = 0; i < a.length; i++) if (a[i].startsWith("--")) out[a[i].slice(2)] = a[i + 1]?.startsWith("--") ? true : a[++i];
  return out;
}

function ask(question, { hidden = false } = {}) {
  return new Promise((resolve) => {
    const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    if (hidden) {
      rl._writeToOutput = (s) => {
        if (s.includes(question)) rl.output.write(s);
        else rl.output.write("*".repeat(s.length ? 1 : 0));
      };
    }
    rl.question(question, (answer) => {
      rl.close();
      if (hidden) process.stdout.write("\n");
      resolve(answer.trim());
    });
  });
}

/** Same format and cost as src/lib/auth.ts — keep them in step. */
async function hashPassword(password) {
  const N = 16384, r = 8, p = 1;
  const salt = randomBytes(16);
  const hash = await scrypt(password, salt, 64, { N, r, p, maxmem: 64 * 1024 * 1024 });
  return `scrypt$${N}$${r}$${p}$${salt.toString("hex")}$${hash.toString("hex")}`;
}

const describe = (url) => {
  const u = new URL(url);
  return `${u.hostname}:${u.port || 5432}/${decodeURIComponent(u.pathname.slice(1))}`;
};

async function tryConnect(url) {
  const client = new pg.Client({ connectionString: url, connectionTimeoutMillis: 4000 });
  try {
    await client.connect();
    return { client };
  } catch (err) {
    await client.end().catch(() => {});
    return { err };
  }
}

// ---------------------------------------------------------------- main
const opts = args();
const env = readEnv();
let url = process.env.DATABASE_URL || env.DATABASE_URL;

say("\nAmerican Lycetuff admin — database setup\n");
if (!url) {
  fail(
    "DATABASE_URL is not set.\n  Copy .env.example to .env.local and set, for example:\n" +
      "  DATABASE_URL=postgres://postgres:YOUR_PASSWORD@localhost:5432/AmericanLyetuff",
  );
}

let { client, err } = await tryConnect(url);

// Wrong port? Look on the other usual ports for a server that has this database.
if (err && ["3D000", "ECONNREFUSED", "28P01"].includes(err.code)) {
  const u = new URL(url);
  const tried = u.port || "5432";
  for (const port of ["5432", "5433", "5434", "5435"].filter((p) => p !== tried)) {
    u.port = port;
    const r = await tryConnect(u.toString());
    if (r.client) {
      say(`• The database was not on port ${tried}; found it on port ${port}. Updating .env.local.`);
      url = u.toString();
      setEnv("DATABASE_URL", url);
      ({ client, err } = r);
      break;
    }
  }
}

if (err?.code === "3D000") {
  const dbName = decodeURIComponent(new URL(url).pathname.slice(1));
  const yes = opts.yes || (await ask(`Database "${dbName}" does not exist. Create it? (y/n) `)).toLowerCase().startsWith("y");
  if (!yes) fail("Stopped. Create the database (pgAdmin → Databases → Create) and run this again.");
  const admin = new URL(url);
  admin.pathname = "/postgres";
  const r = await tryConnect(admin.toString());
  if (!r.client) fail(`Could not connect to create the database: ${r.err.message}`);
  await r.client.query(`CREATE DATABASE "${dbName.replace(/"/g, '""')}"`);
  await r.client.end();
  say(`• Created database "${dbName}".`);
  ({ client, err } = await tryConnect(url));
}

if (err) {
  if (err.code === "ECONNREFUSED") fail("PostgreSQL is not running (connection refused). Start the PostgreSQL service and try again.");
  if (err.code === "28P01") fail("PostgreSQL refused that username/password. Check DATABASE_URL in .env.local.");
  fail(`Could not connect to ${describe(url)}: ${err.message}`);
}
say(`• Connected to ${describe(url)}`);

// Session secret
if (!(process.env.ADMIN_SESSION_SECRET || env.ADMIN_SESSION_SECRET)) {
  setEnv("ADMIN_SESSION_SECRET", randomBytes(32).toString("hex"));
  say("• Generated ADMIN_SESSION_SECRET in .env.local");
}

// Migrations
await client.query(
  "CREATE TABLE IF NOT EXISTS schema_migrations (name text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())",
);
const applied = new Set((await client.query("SELECT name FROM schema_migrations")).rows.map((r) => r.name));
const files = readdirSync(path.join(root, "db"))
  .filter((f) => /^\d{3}_.+\.sql$/.test(f))
  .sort();
let ran = 0;
for (const f of files) {
  if (applied.has(f)) continue;
  const sql = readFileSync(path.join(root, "db", f), "utf8");
  try {
    await client.query("BEGIN");
    await client.query(sql);
    await client.query("INSERT INTO schema_migrations (name) VALUES ($1) ON CONFLICT DO NOTHING", [f]);
    await client.query("COMMIT");
    say(`• Applied ${f}`);
    ran++;
  } catch (e) {
    await client.query("ROLLBACK");
    fail(`Migration ${f} failed: ${e.message}`);
  }
}
if (!ran) say("• Schema already up to date");

// First administrator
const { rows } = await client.query("SELECT count(*)::int AS n FROM users WHERE role = 'administrator' AND NOT disabled");
if (rows[0].n === 0) {
  say("\nNo administrator yet — let's create the first one.");
  const username = (opts.username || (await ask("  Username: "))).toLowerCase();
  const name = opts.name || (await ask("  Full name: "));
  const email = opts.email || (await ask("  Email (for notifications, optional): "));
  let password = opts.password;
  while (!password) {
    const p1 = await ask("  Password (min 10 characters): ", { hidden: true });
    if (p1.length < 10) {
      say("  Too short.");
      continue;
    }
    const p2 = await ask("  Repeat password: ", { hidden: true });
    if (p1 !== p2) {
      say("  Those do not match.");
      continue;
    }
    password = p1;
  }
  if (!/^[a-z0-9._-]{3,40}$/.test(username)) fail("Username: 3–40 characters, letters, numbers, dot, dash or underscore.");
  if (!name) fail("Full name is required.");
  if (String(password).length < 10) fail("Password must be at least 10 characters.");
  await client.query(
    `INSERT INTO users (username, email, name, role, password_hash) VALUES ($1, $2, $3, 'administrator', $4)`,
    [username, email || "", name, await hashPassword(String(password))],
  );
  say(`• Created administrator "${username}".`);
} else {
  say("• Administrator account already exists");
}

await client.end();
say("\n✔ Done. Start the site with `npm run dev` and open http://localhost:3002/admin\n");
