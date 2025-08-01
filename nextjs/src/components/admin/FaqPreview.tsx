'use client';

import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Video, Tag, Package, FolderOpen } from 'lucide-react';
import type { FaqPreviewProps } from '@/types/faq';

// Bilibili视频组件
function BilibiliVideo({ bvid }: { bvid: string }) {
  if (!bvid || !bvid.startsWith('BV')) {
    return null;
  }

  return (
    <div className="my-4">
      <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
        <iframe
          src={`https://player.bilibili.com/player.html?bvid=${bvid}&autoplay=0`}
          className="absolute top-0 left-0 w-full h-full"
          frameBorder="0"
          allowFullScreen
          title="Bilibili视频"
        />
      </div>
    </div>
  );
}

export default function FaqPreview({ data, isPreview = false }: FaqPreviewProps) {
  if (!data.title && !data.content && !data.answer) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        <div className="text-center">
          <p>暂无内容可预览</p>
          <p className="text-sm">请先填写FAQ内容</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 标题 */}
      {data.title && (
        <div>
          <h1 className="text-2xl font-bold mb-2">{data.title}</h1>
        </div>
      )}

      {/* 标签信息 */}
      {(data.tags && data.tags.length > 0) && (
        <div className="flex flex-wrap gap-2">
          {data.tags.map(tag => (
            <Badge key={tag} variant="secondary">
              <Tag className="w-3 h-3 mr-1" />
              {tag}
            </Badge>
          ))}
        </div>
      )}

      {/* 问题内容 */}
      {data.content && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">问题</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose dark:prose-invert max-w-none">
              <ReactMarkdown
                remarkPlugins={[remarkMath, remarkGfm]}
                rehypePlugins={[rehypeKatex]}
              >
                {data.content}
              </ReactMarkdown>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 答案内容 */}
      {data.answer && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">答案</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose dark:prose-invert max-w-none">
              <ReactMarkdown
                remarkPlugins={[remarkMath, remarkGfm]}
                rehypePlugins={[rehypeKatex]}
              >
                {data.answer}
              </ReactMarkdown>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 视频 */}
      {data.video_bilibili_bvid && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Video className="w-5 h-5" />
              相关视频
            </CardTitle>
          </CardHeader>
          <CardContent>
            <BilibiliVideo bvid={data.video_bilibili_bvid} />
          </CardContent>
        </Card>
      )}

      {/* 元数据信息 */}
      {(data.category_id || data.product_model_id || data.software_version) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">附加信息</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4 text-sm">
              {data.category_id && (
                <div className="flex items-center gap-2">
                  <FolderOpen className="w-4 h-4" />
                  <span>分类: {data.category_id}</span>
                </div>
              )}
              {data.product_model_id && (
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  <span>产品型号: {data.product_model_id}</span>
                </div>
              )}
              {data.software_version && (
                <div className="flex items-center gap-2">
                  <span>软件版本: {data.software_version}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 预览模式提示 */}
      {isPreview && (
        <div className="text-center text-sm text-muted-foreground p-4 border border-dashed rounded-lg">
          <p>这是预览效果，实际显示时可能会有所不同</p>
        </div>
      )}
    </div>
  );
} 