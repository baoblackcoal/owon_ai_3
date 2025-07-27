/**
 * 验证请求的Origin头，防止CSRF攻击
 */
export function verifyOrigin(request: Request): boolean {
  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');
  
  // 允许的域名列表
  const allowedOrigins = [
    'http://localhost:3000', // 开发环境
    'https://owonai.top', // 生产环境
    process.env.NEXTAUTH_URL, // 从环境变量获取
  ].filter(Boolean);
  
  // 检查Origin头
  if (origin && allowedOrigins.includes(origin)) {
    return true;
  }
  
  // 如果没有Origin头，检查Referer头
  if (!origin && referer) {
    try {
      const refererUrl = new URL(referer);
      const refererOrigin = `${refererUrl.protocol}//${refererUrl.host}`;
      return allowedOrigins.includes(refererOrigin);
    } catch {
      return false;
    }
  }
  
  return false;
}

/**
 * 验证请求方法
 */
export function verifyMethod(request: Request, allowedMethods: string[]): boolean {
  return allowedMethods.includes(request.method);
} 