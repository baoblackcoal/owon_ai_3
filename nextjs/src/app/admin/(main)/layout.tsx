import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import SessionProvider from '@/components/SessionProvider';
import LogoutButton from '@/components/admin/LogoutButton';

export default async function AdminMainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  // 未登录 - 重定向到登录页
  if (!session?.user) {
    redirect('/admin/login');
  }

  // 非admin用户 - 返回403错误页面
  if (session.user.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-destructive mb-4">403</h1>
          <p className="text-lg text-muted-foreground mb-4">
            访问被拒绝
          </p>
          <p className="text-sm text-muted-foreground">
            您没有权限访问管理员页面
          </p>
        </div>
      </div>
    );
  }

  // admin用户需要修改密码 - 重定向到修改密码页面
  if (session.user.requiresPasswordChange) {
    redirect('/admin/change-password');
  }

  return (
    <SessionProvider>
      <div className="min-h-screen bg-background">
        {/* Admin Header */}
        <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container flex h-14 items-center">
            <div className="mr-4 flex">
              <a className="mr-6 flex items-center space-x-2" href="/admin">
                <span className="font-bold">管理员后台</span>
              </a>
            </div>
            <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end" id="admin-header-nav">
              <nav className="flex items-center space-x-6">
                                 <a
                   className="text-sm font-medium transition-colors hover:text-primary"
                   href="/admin/d1_all"
                 >
                   数据库管理
                 </a>
                 <a
                   className="text-sm font-medium transition-colors hover:text-primary"
                   href="/admin/change-password"
                 >
                   修改密码
                 </a>
                 <div className="flex items-center space-x-4">
                   <div className="text-sm text-muted-foreground">
                     欢迎，{session?.user?.id || 'Guest'}
                   </div>
                   <LogoutButton />
                 </div>
              </nav>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto py-6">
          {children}
        </main>
      </div>
    </SessionProvider>
  );
} 