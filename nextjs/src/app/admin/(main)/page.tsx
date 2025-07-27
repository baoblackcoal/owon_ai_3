import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function AdminPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">管理员后台</h1>
        <p className="text-muted-foreground">
          欢迎使用后台管理系统
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>数据库管理</CardTitle>
            <CardDescription>
              查看和管理 Cloudflare D1 数据库中的所有表和数据
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/admin/d1_all">
              <Button className="w-full">
                进入数据库管理
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>用户管理</CardTitle>
            <CardDescription>
              管理系统用户、查看用户统计信息
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" variant="outline" disabled>
              即将上线
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>系统设置</CardTitle>
            <CardDescription>
              配置系统参数、查看系统状态
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" variant="outline" disabled>
              即将上线
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>快速操作</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <h3 className="font-medium mb-2">数据库操作</h3>
                <div className="space-y-2">
                  <Link href="/admin/d1_all">
                    <Button variant="outline" size="sm" className="w-full justify-start">
                      查看所有表
                    </Button>
                  </Link>
                </div>
              </div>
              <div>
                <h3 className="font-medium mb-2">账户管理</h3>
                <div className="space-y-2">
                                     <Link href="/admin/change-password">
                     <Button variant="outline" size="sm" className="w-full justify-start">
                       修改密码
                     </Button>
                   </Link>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 