const getEnv = (key: string, defaultValue?: string): string => {
  const value = process.env[key];
  if (!value && defaultValue === undefined) {
    throw new Error(`Missing environment variable: ${key}`);
  }
  return value || defaultValue || "";
};

export interface ShardConfig {
  writeHost: string;
  readHosts: string[];
  port: number;
  user: string;
  password: string;
  database: string;
}

const buildShardConfigs = (): ShardConfig[] => {
  const count = parseInt(getEnv("DB_SHARD_COUNT", "2"), 10);
  const globalPort = parseInt(getEnv("DB_PORT", "5432"), 10);
  const user = getEnv("DB_USER", "postgres");
  const database = getEnv("DB_NAME", "app_db");

  const shards: ShardConfig[] = [];

  for (let i = 0; i < count; i++) {
    const writeHost = getEnv(`DB_SHARD_${i}_WRITE_HOST`, "localhost");
    const readHostsRaw = getEnv(`DB_SHARD_${i}_READ_HOST`, writeHost);
    const readHosts = readHostsRaw.split(",").map((h) => h.trim());
    const password = getEnv(`DB_SHARD_${i}_PASSWORD`, "postgres");
    // Per-shard port override (useful for local dev with multiple containers)
    const port = parseInt(getEnv(`DB_SHARD_${i}_PORT`, String(globalPort)), 10);

    shards.push({ writeHost, readHosts, port, user, password, database });
  }

  return shards;
};

export const config = {
  port: parseInt(getEnv("PORT", "3000"), 10),
  nodeEnv: getEnv("NODE_ENV", "development"),
  shardCount: parseInt(getEnv("DB_SHARD_COUNT", "2"), 10),
  shards: buildShardConfigs(),
};
