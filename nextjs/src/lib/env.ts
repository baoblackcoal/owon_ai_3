interface CloudflareEnv {
  NEXTAUTH_URL?: string;
  NEXTAUTH_SECRET?: string;
  DASHSCOPE_API_KEY?: string;
  DASHSCOPE_APP_ID?: string;
  BCRYPT_SALT_ROUNDS?: string;
}

interface Env extends CloudflareEnv {
  DB: D1Database;
}

export async function getCloudflareContext() {
  // @ts-expect-error Cloudflare bindings
  const env = process?.env ?? globalThis?.process?.env;
  return { env } as { env: Env };
}

export async function resolveConfig() {
  const { env } = await getCloudflareContext();
  
  return {
    nextAuth: {
      url: env.NEXTAUTH_URL ?? process.env.NEXTAUTH_URL,
      secret: env.NEXTAUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
    },
    dashScope: {
      apiKey: env.DASHSCOPE_API_KEY ?? process.env.DASHSCOPE_API_KEY,
      appId: env.DASHSCOPE_APP_ID ?? process.env.DASHSCOPE_APP_ID,
    },
    bcrypt: {
      saltRounds: parseInt(env.BCRYPT_SALT_ROUNDS ?? process.env.BCRYPT_SALT_ROUNDS ?? "12", 10),
    },
  };
}

// 用于类型检查的辅助函数
export function assertEnvVars() {
  const requiredEnvVars = [
    'NEXTAUTH_URL',
    'NEXTAUTH_SECRET',
    'DASHSCOPE_API_KEY',
    'DASHSCOPE_APP_ID',
  ];

  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar] && process.env.NODE_ENV === 'production') {
      throw new Error(`Missing required environment variable: ${envVar}`);
    }
  }
} 