'use client';

import { Card } from "@/components/ui/card";

export default function BilibiliTestPage() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">B站视频嵌入测试</h1>
      
      <Card className="p-4">
        <h2 className="text-xl font-semibold mb-2">视频示例</h2>
        <div className="relative w-full" style={{ paddingTop: '56.25%' }}>
          <iframe 
            className="absolute top-0 left-0 w-full h-full"
            src="//player.bilibili.com/player.html?isOutside=true&aid=114905323670404&bvid=BV1nL8NzkEyx&cid=31239767768&p=1" 
            scrolling="no" 
            border="0" 
            frameBorder="no" 
            framespacing="0" 
            allowFullScreen={true}
          />
        </div>
        
        <div className="mt-4">
          <h3 className="text-lg font-medium mb-2">使用说明：</h3>
          <ul className="list-disc list-inside space-y-2">
            <li>视频使用响应式布局，会自适应容器宽度</li>
            <li>视频默认使用16:9的宽高比</li>
            <li>支持全屏播放功能</li>
            <li>可以通过修改aid、bvid、cid参数来更换视频</li>
          </ul>
        </div>
      </Card>
    </div>
  );
} 