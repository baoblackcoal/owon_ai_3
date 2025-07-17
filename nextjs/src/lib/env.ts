// 定义环境变量类型
interface EnvVars {
  NEXTAUTH_URL?: string;
  NEXTAUTH_SECRET?: string;
  DASHSCOPE_API_KEY?: string;
  DASHSCOPE_APP_ID?: string;
  BCRYPT_SALT_ROUNDS?: string;
  [key: string]: string | undefined;
}

// Cloudflare Workers 环境类型
interface CloudflareEnv {
  env: EnvVars & {
    DB?: D1Database;
  };
}

export async function getCloudflareContext() {
  try {
    // 尝试获取 Cloudflare Workers 环境
    return (globalThis as unknown as CloudflareEnv);
  } catch {
    // 如果失败，返回 Node.js 环境
    return { env: process.env };
  }
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
  ] as const;

  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar] && process.env.NODE_ENV === 'production') {
      throw new Error(`Missing required environment variable: ${envVar}`);
    }
  }
} 