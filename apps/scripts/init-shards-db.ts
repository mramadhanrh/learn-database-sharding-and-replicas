import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { Client } from "pg";

// ─── Config ──────────────────────────────────────────────────────────────────

const SQL_FILE = join(__dirname, "init-db.sql");
const DB_NAME = process.env.DB_NAME ?? "app_db";
const DB_USER = process.env.DB_USER ?? "postgres";
const DB_PORT = parseInt(process.env.DB_PORT ?? "5432");
const REGION = process.env.AWS_REGION ?? "ap-southeast-1";
const PROFILE = process.env.AWS_PROFILE ?? "mramadhanrh";
const ENV = process.env.ENVIRONMENT ?? "dev";
const PROJECT = process.env.PROJECT ?? "learn-sharding";
const INFRA_DIR = join(__dirname, "../../infra");

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getShardEndpoints(): string[] {
  console.log("📡 Fetching shard endpoints from Terraform output...");
  try {
    const result = execSync(`terraform -chdir="${INFRA_DIR}" output -json shard_endpoints`, {
      encoding: "utf-8",
    });
    return JSON.parse(result.trim());
  } catch {
    throw new Error(
      "Failed to get shard endpoints. Make sure `terraform apply` has been run and `shard_endpoints` output exists.",
    );
  }
}

function getShardPassword(shardIndex: number): string {
  const secretId = `${PROJECT}-${ENV}/rds/shard-${shardIndex}/password`;
  console.log(`  🔑 Fetching password from Secrets Manager: ${secretId}`);
  try {
    const result = execSync(
      `aws secretsmanager get-secret-value \
        --secret-id "${secretId}" \
        --region ${REGION} \
        --profile ${PROFILE} \
        --query SecretString \
        --output text`,
      { encoding: "utf-8" },
    );
    return result.trim();
  } catch {
    throw new Error(`Failed to fetch password for shard-${shardIndex} from Secrets Manager.`);
  }
}

function getSql(): string {
  try {
    return readFileSync(SQL_FILE, "utf-8");
  } catch {
    throw new Error(`SQL file not found at: ${SQL_FILE}`);
  }
}

// ─── Core ────────────────────────────────────────────────────────────────────

async function initShard(index: number, host: string, sql: string): Promise<void> {
  console.log(`\n⏳ Initializing shard ${index} → ${host}`);

  const password = getShardPassword(index);

  const client = new Client({
    host,
    port: DB_PORT,
    database: DB_NAME,
    user: DB_USER,
    password,
    connectionTimeoutMillis: 10_000,
    ssl: { rejectUnauthorized: false }, // required for RDS
  });

  try {
    await client.connect();
    console.log(`  ✅ Connected to shard ${index}`);

    await client.query(sql);
    console.log(`  ✅ SQL executed on shard ${index}`);
  } finally {
    await client.end();
  }
}

async function main(): Promise<void> {
  console.log("🚀 Starting shard database initialization...\n");
  console.log(`   Environment : ${ENV}`);
  console.log(`   Project     : ${PROJECT}`);
  console.log(`   Region      : ${REGION}`);
  console.log(`   DB Name     : ${DB_NAME}`);
  console.log(`   DB User     : ${DB_USER}`);

  const sql = getSql();
  const endpoints = getShardEndpoints();

  console.log(`\n🔍 Found ${endpoints.length} shard(s)`);

  const results = await Promise.allSettled(
    endpoints.map((host, index) => initShard(index, host, sql)),
  );

  console.log("\n─── Summary ───────────────────────────────────────────────");
  let hasError = false;
  results.forEach((result, index) => {
    if (result.status === "fulfilled") {
      console.log(`  Shard ${index}: ✅ OK`);
    } else {
      console.log(`  Shard ${index}: ❌ FAILED — ${result.reason}`);
      hasError = true;
    }
  });
  console.log("───────────────────────────────────────────────────────────");

  if (hasError) {
    console.error("\n❌ Some shards failed to initialize. Check the errors above.");
    process.exit(1);
  }

  console.log("\n🎉 All shards initialized successfully!");
}

main().catch((err: Error) => {
  console.error(`\n❌ Unexpected error: ${err.message}`);
  process.exit(1);
});
