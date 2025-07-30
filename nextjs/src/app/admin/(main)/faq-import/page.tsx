import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, FileSpreadsheet } from 'lucide-react';
import Link from 'next/link';
import FaqImportForm from '@/components/admin/FaqImportForm';

export default function FaqImportPage() {
  return (
    <div className="space-y-6">
      {/* 页面头部 */}
      <div className="flex items-center gap-4">
        <Link href="/admin">
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回后台
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <FileSpreadsheet className="w-8 h-8" />
            FAQ 批量导入
          </h1>
          <p className="text-muted-foreground">
            通过CSV文件批量导入FAQ问答数据，支持自动创建分类、产品型号和标签
          </p>
        </div>
      </div>

      {/* 使用说明 */}
      <Card>
        <CardHeader>
          <CardTitle>使用说明</CardTitle>
          <CardDescription>
            在开始导入之前，请仔细阅读以下说明
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium mb-3">导入流程</h3>
              <ol className="space-y-2 text-sm text-muted-foreground list-decimal list-inside">
                <li>下载CSV模板文件</li>
                <li>按照格式填写FAQ数据</li>
                <li>上传填写好的CSV文件</li>
                <li>选择导入选项（是否更新已存在的问题）</li>
                <li>开始导入并查看结果</li>
              </ol>
            </div>
            <div>
              <h3 className="font-medium mb-3">注意事项</h3>
              <ul className="space-y-2 text-sm text-muted-foreground list-disc list-inside">
                <li>CSV文件大小不能超过5MB</li>
                <li>必填字段：标题、问题内容、答案内容、分类</li>
                <li>标签用逗号分隔，如&quot;连接,USB,驱动&quot;</li>
                <li>Bilibili BVID格式：BV开头的12位字符</li>
                <li>系统会自动创建不存在的分类、产品型号和标签</li>
                <li>导入失败的行会生成错误报告供下载</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 导入表单 */}
      <FaqImportForm />

      {/* 相关链接 */}
      <Card>
        <CardHeader>
          <CardTitle>相关功能</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <Link href="/faq">
              <Button variant="outline">
                查看FAQ页面
              </Button>
            </Link>
            <Link href="/admin/d1_all">
              <Button variant="outline">
                数据库管理
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 