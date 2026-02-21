const getEnv = (key: string, defaultValue?: string): string => {
  const value = process.env[key];
  if (!value && defaultValue === undefined) {
    throw new Error(`Missing environment variable: ${key}`);
  }
  return value || defaultValue || "";
};

export const config = {
  port: parseInt(getEnv("PORT", "3000"), 10),
  nodeEnv: getEnv("NODE_ENV", "development"),
  database: {
    host: getEnv("DB_HOST", "localhost"),
    port: parseInt(getEnv("DB_PORT", "5432"), 10),
    user: getEnv("DB_USER", "postgres"),
    password: getEnv("DB_PASSWORD", "postgres"),
    database: getEnv("DB_NAME", "app_db"),
  },
};
