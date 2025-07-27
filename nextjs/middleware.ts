import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Admin路径保护（排除认证相关页面）
  if (pathname.startsWith('/admin') && pathname !== '/admin/login' && pathname !== '/admin/change-password') {
    try {
      const session = await auth();
      
      // 未登录 - 跳转到admin登录页
      if (!session?.user) {
        const loginUrl = new URL('/admin/login', request.url);
        return NextResponse.redirect(loginUrl);
      }

      // 非admin用户 - 返回403
      if (session.user.role !== 'admin') {
        return new NextResponse('Forbidden', { status: 403 });
      }

      // admin用户需要修改密码且不在修改密码页面 - 强制跳转修改密码
      if (session.user.requiresPasswordChange && pathname !== '/admin/change-password') {
        const changePasswordUrl = new URL('/admin/change-password', request.url);
        return NextResponse.redirect(changePasswordUrl);
      }

    } catch (error) {
      console.error('Middleware auth error:', error);
      const loginUrl = new URL('/admin/login', request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // 只保护admin路径
    '/admin/:path*',
  ],
}; 