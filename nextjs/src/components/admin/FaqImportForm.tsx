'use client';

import { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Download, 
  Upload, 
  FileText,
  Loader2
} from 'lucide-react';
import type { FaqImportResponse } from '@/types/faq';

interface FaqImportFormProps {
  onImportComplete?: (result: FaqImportResponse) => void;
}

export default function FaqImportForm({ onImportComplete }: FaqImportFormProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [updateExisting, setUpdateExisting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [importResult, setImportResult] = useState<FaqImportResponse | null>(null);
  const [isDownloadingTemplate, setIsDownloadingTemplate] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 处理文件选择
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // 验证文件类型
      if (!file.name.toLowerCase().endsWith('.csv')) {
        alert('请选择CSV文件');
        return;
      }
      
      // 验证文件大小（限制5MB）
      if (file.size > 5 * 1024 * 1024) {
        alert('文件大小不能超过5MB');
        return;
      }
      
      setSelectedFile(file);
      setImportResult(null); // 清除之前的结果
    }
  };

  // 下载CSV模板
  const handleDownloadTemplate = async () => {
    try {
      setIsDownloadingTemplate(true);
      
      const response = await fetch('/api/admin/faq/template');
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '下载模板失败');
      }
      
      // 创建下载链接
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'faq_import_template.csv';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('下载模板失败:', error);
      alert(error instanceof Error ? error.message : '下载模板失败');
    } finally {
      setIsDownloadingTemplate(false);
    }
  };

  // 处理文件上传和导入
  const handleImport = async () => {
    if (!selectedFile) {
      alert('请先选择CSV文件');
      return;
    }

    try {
      setIsUploading(true);
      setUploadProgress(0);
      
      // 读取文件内容
      const fileContent = await readFileAsText(selectedFile);
      setUploadProgress(30);
      
      // 发送导入请求
      const response = await fetch('/api/admin/faq/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          csvData: fileContent,
          updateExisting,
        }),
      });
      
      setUploadProgress(80);
      
      const result: FaqImportResponse = await response.json();
      setUploadProgress(100);
      
      setImportResult(result);
      onImportComplete?.(result);
      
      // 清除文件选择
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
    } catch (error) {
      console.error('导入失败:', error);
      alert(error instanceof Error ? error.message : '导入失败');
    } finally {
      setIsUploading(false);
      setTimeout(() => setUploadProgress(0), 1000);
    }
  };

  // 读取文件内容
  const readFileAsText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = () => reject(new Error('文件读取失败'));
      reader.readAsText(file, 'UTF-8');
    });
  };

  // 下载错误报告
  const handleDownloadErrorReport = () => {
    if (!importResult?.result?.errors) return;
    
    const errors = importResult.result.errors;
    const csvContent = [
      'row,field,message,title,category',
      ...errors.map(error => {
        const title = error.data?.title || '';
        const category = error.data?.category || '';
        const field = error.field || '';
        const message = error.message.replace(/"/g, '""');
        return `${error.row},"${field}","${message}","${title}","${category}"`;
      })
    ].join('\n');
    
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv; charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'faq_import_errors.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* 下载模板区域 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="w-5 h-5" />
            下载CSV模板
          </CardTitle>
          <CardDescription>
            下载标准的CSV模板文件，按照格式填写FAQ数据
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={handleDownloadTemplate}
            disabled={isDownloadingTemplate}
            className="w-full sm:w-auto"
          >
            {isDownloadingTemplate ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                下载中...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                下载模板文件
              </>
            )}
          </Button>
          
          <div className="mt-4 text-sm text-muted-foreground">
            <p className="font-medium mb-2">模板包含以下字段：</p>
            <ul className="space-y-1 list-disc list-inside">
              <li><span className="font-medium">title</span> - 问题标题（必填）</li>
              <li><span className="font-medium">content_md</span> - 问题内容，支持Markdown（必填）</li>
              <li><span className="font-medium">answer_md</span> - 答案内容，支持Markdown（必填）</li>
              <li><span className="font-medium">category</span> - 分类名称（必填）</li>
              <li><span className="font-medium">product_model</span> - 产品型号（可选）</li>
              <li><span className="font-medium">tags</span> - 标签，用逗号分隔（可选）</li>
              <li><span className="font-medium">software_version</span> - 软件版本（可选）</li>
              <li><span className="font-medium">bilibili_bvid</span> - B站视频BVID（可选）</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* 文件上传区域 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            上传CSV文件
          </CardTitle>
          <CardDescription>
            选择填写好的CSV文件进行批量导入
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="csv-file">选择CSV文件</Label>
            <div className="flex items-center gap-4">
              <Input
                id="csv-file"
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                ref={fileInputRef}
                disabled={isUploading}
                className="flex-1"
              />
              {selectedFile && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <FileText className="w-4 h-4" />
                  {selectedFile.name}
                  <span>({(selectedFile.size / 1024).toFixed(1)} KB)</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="update-existing"
              checked={updateExisting}
              onChange={(e) => setUpdateExisting(e.target.checked)}
              disabled={isUploading}
              className="rounded"
            />
            <Label htmlFor="update-existing" className="text-sm">
              更新已存在的问题（基于标题匹配）
            </Label>
          </div>

          {/* 上传进度 */}
          {isUploading && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>导入进度</span>
                <span>{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="w-full" />
            </div>
          )}

          <Button 
            onClick={handleImport}
            disabled={!selectedFile || isUploading}
            className="w-full"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                导入中...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                开始导入
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* 导入结果显示 */}
      {importResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {importResult.success ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <XCircle className="w-5 h-5 text-red-600" />
              )}
              导入结果
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert className={importResult.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{importResult.message}</AlertDescription>
            </Alert>

            {importResult.result && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {importResult.result.successCount}
                  </div>
                  <div className="text-sm text-muted-foreground">成功导入</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {importResult.result.errorCount}
                  </div>
                  <div className="text-sm text-muted-foreground">导入失败</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">
                    {importResult.result.skippedCount}
                  </div>
                  <div className="text-sm text-muted-foreground">跳过重复</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {importResult.result.successCount + importResult.result.errorCount + importResult.result.skippedCount}
                  </div>
                  <div className="text-sm text-muted-foreground">总行数</div>
                </div>
              </div>
            )}

            {/* 新创建的实体信息 */}
            {importResult.result && (
              <div className="space-y-3">
                {importResult.result.newCategories.length > 0 && (
                  <div>
                    <div className="text-sm font-medium mb-2">新创建的分类：</div>
                    <div className="flex flex-wrap gap-2">
                      {importResult.result.newCategories.map(category => (
                        <Badge key={category} variant="secondary">{category}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {importResult.result.newProductModels.length > 0 && (
                  <div>
                    <div className="text-sm font-medium mb-2">新创建的产品型号：</div>
                    <div className="flex flex-wrap gap-2">
                      {importResult.result.newProductModels.map(model => (
                        <Badge key={model} variant="secondary">{model}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {importResult.result.newTags.length > 0 && (
                  <div>
                    <div className="text-sm font-medium mb-2">新创建的标签：</div>
                    <div className="flex flex-wrap gap-2">
                      {importResult.result.newTags.map(tag => (
                        <Badge key={tag} variant="secondary">{tag}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 错误详情 */}
            {importResult.result?.errors && importResult.result.errors.length > 0 && (
              <div className="space-y-3">
                <Separator />
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium">错误详情</h4>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={handleDownloadErrorReport}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    下载错误报告
                  </Button>
                </div>
                
                <div className="max-h-60 overflow-y-auto space-y-2">
                  {importResult.result.errors.slice(0, 10).map((error, index) => (
                    <div key={index} className="p-3 bg-red-50 border border-red-200 rounded text-sm">
                      <div className="font-medium text-red-800">
                        第 {error.row} 行
                        {error.field && <span> - {error.field}</span>}
                      </div>
                      <div className="text-red-600 mt-1">{error.message}</div>
                      {error.data?.title && (
                        <div className="text-red-500 mt-1 text-xs">
                          标题: {error.data.title}
                        </div>
                      )}
                    </div>
                  ))}
                  
                  {importResult.result.errors.length > 10 && (
                    <div className="text-center text-sm text-muted-foreground py-2">
                      还有 {importResult.result.errors.length - 10} 个错误，请下载完整报告查看
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
} 