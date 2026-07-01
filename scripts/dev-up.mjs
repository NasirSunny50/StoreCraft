#!/usr/bin/env node
/**
 * One-command local startup for StoreCraft.
 *
 *   node scripts/dev-up.mjs      (or: npm run start:local)
 *
 * Brings everything up locally:
 *   1. Postgres (Docker container "storecraft-pg" on port 5433)
 *   2. .env (created from .env.example if missing)
 *   3. dependencies (npm install if node_modules missing)
 *   4. Prisma client + migrations + seed
 *   5. Next.js dev server — serves storefront (/), admin portal (/admin) and API
 *
 * The whole app (frontend + backend server actions/API + admin) is one Next.js
 * process, so this single command runs "everything".
 *
 * Flags: --no-seed (skip seeding), --fresh (reset the database first)
 */
import { execSync, spawn } from "node:child_process";
import { existsSync, copyFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const SKIP_SEED = args.includes("--no-seed");
const FRESH = args.includes("--fresh");

const PG = {
  name: "storecraft-pg",
  user: "storecraft",
  password: "storecraft",
  db: "storecraft",
  port: 5433,
  image: "postgres:16-alpine",
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const log = (m) => console.log(`\x1b[36m▸\x1b[0m ${m}`);
const ok = (m) => console.log(`\x1b[32m✓\x1b[0m ${m}`);
const die = (m) => {
  console.error(`\x1b[31m✗ ${m}\x1b[0m`);
  process.exit(1);
};

/** Run a command, inherit stdio (used for long/visible steps). */
function run(cmd) {
  execSync(cmd, { stdio: "inherit", shell: true, cwd: ROOT });
}
/** Run a command quietly and return trimmed stdout (throws on failure). */
function capture(cmd) {
  return execSync(cmd, { encoding: "utf8", shell: true, cwd: ROOT, stdio: ["ignore", "pipe", "ignore"] }).trim();
}
function quietOk(cmd) {
  try {
    capture(cmd);
    return true;
  } catch {
    return false;
  }
}

async function ensureDocker() {
  if (!quietOk("docker --version")) {
    die("Docker is not available. Install Docker Desktop, or point DATABASE_URL at your own Postgres and run `npm run dev`.");
  }
}

async function ensurePostgres() {
  const exists = capture(`docker ps -a --filter "name=^/${PG.name}$" --format "{{.Names}}"`) === PG.name;
  if (exists) {
    if (FRESH) {
      log("Removing existing database container (--fresh)…");
      quietOk(`docker rm -f ${PG.name}`);
    } else {
      log("Starting existing Postgres container…");
      quietOk(`docker start ${PG.name}`);
    }
  }
  if (!exists || FRESH) {
    log("Creating Postgres container…");
    run(
      `docker run -d --name ${PG.name} ` +
        `-e POSTGRES_USER=${PG.user} -e POSTGRES_PASSWORD=${PG.password} -e POSTGRES_DB=${PG.db} ` +
        `-p ${PG.port}:5432 ${PG.image}`,
    );
  }

  log("Waiting for Postgres to accept connections…");
  for (let i = 0; i < 60; i++) {
    if (quietOk(`docker exec ${PG.name} pg_isready -U ${PG.user} -d ${PG.db}`)) {
      ok(`Postgres ready on localhost:${PG.port}`);
      return;
    }
    await sleep(1000);
  }
  die("Postgres did not become ready in time.");
}

function ensureEnv() {
  const env = join(ROOT, ".env");
  if (!existsSync(env)) {
    if (existsSync(join(ROOT, ".env.example"))) {
      copyFileSync(join(ROOT, ".env.example"), env);
      ok("Created .env from .env.example");
    } else {
      die(".env is missing and no .env.example to copy from.");
    }
  } else {
    ok(".env present");
  }
}

function ensureDeps() {
  if (!existsSync(join(ROOT, "node_modules"))) {
    log("Installing dependencies (first run)…");
    run("npm install");
  } else {
    ok("Dependencies installed");
  }
}

function setupDatabase() {
  log("Generating Prisma client…");
  run("npx prisma generate");
  log("Applying migrations…");
  run("npx prisma migrate deploy");
  if (!SKIP_SEED) {
    log("Seeding database (idempotent)…");
    run("npx tsx prisma/seed.ts");
  }
}

function startDev() {
  console.log("");
  ok("Everything is up. Starting the app…");
  console.log("\x1b[2m  Storefront : http://localhost:3000");
  console.log("  Admin      : http://localhost:3000/admin");
  console.log("  Accounts   : admin@storecraft.test / Admin@12345  ·  customer@storecraft.test / Customer@12345\x1b[0m");
  console.log("");

  const dev = spawn("npm run dev", { stdio: "inherit", shell: true, cwd: ROOT });
  const stop = () => {
    dev.kill();
    process.exit(0);
  };
  process.on("SIGINT", stop);
  process.on("SIGTERM", stop);
  dev.on("exit", (code) => process.exit(code ?? 0));
}

(async () => {
  console.log("\x1b[1m\nStoreCraft — local startup\x1b[0m\n");
  await ensureDocker();
  await ensurePostgres();
  ensureEnv();
  ensureDeps();
  setupDatabase();
  startDev();
})().catch((e) => die(e?.message ?? String(e)));
