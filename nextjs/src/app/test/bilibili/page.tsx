'use client';

import { Card } from "@/components/ui/card";
import { useState, useEffect, useRef, useCallback } from "react";

interface VideoProps {
  title: string;
  videoUrl: string;
  isVisible: boolean;
}

const BilibiliVideo = ({ title, videoUrl, isVisible }: VideoProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setShouldRender(true);
    }
  }, [isVisible]);

  if (!shouldRender) {
    return (
      <Card className="h-full">
        <div className="p-4">
          <h2 className="text-lg font-semibold mb-2 line-clamp-1">{title}</h2>
          <div className="relative w-full" style={{ paddingTop: '56.25%' }}>
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-gray-100"></div>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <div className="p-4">
        <h2 className="text-lg font-semibold mb-2 line-clamp-1">{title}</h2>
        <div className="relative w-full" style={{ paddingTop: '56.25%' }}>
          <iframe 
            className={`absolute top-0 left-0 w-full h-full transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
            src={videoUrl}
            scrolling="no" 
            frameBorder="no" 
            allowFullScreen={true}
            onLoad={() => setIsLoading(false)}
          />
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-gray-100"></div>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

const allVideos = Array.from({ length: 20 }, (_, index) => ({
  id: index + 1,
  title: `视频示例 ${index + 1}`,
  videoUrl: `//player.bilibili.com/player.html?isOutside=true&aid=${114905323670404 }&bvid=BV1nL8NzkEyx&cid=${31239767768}&p=1&autoplay=0`
}));

export default function BilibiliTestPage() {
  const [visibleVideos, setVisibleVideos] = useState(allVideos.slice(0, 3));
  const observer = useRef<IntersectionObserver | null>(null);

  const lastVideoElementRef = useCallback((node: HTMLDivElement) => {
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && visibleVideos.length < allVideos.length) {
        const nextVideos = allVideos.slice(visibleVideos.length, visibleVideos.length + 3);
        setVisibleVideos(prevVideos => [...prevVideos, ...nextVideos]);
      }
    });
    if (node) observer.current.observe(node);
  }, [visibleVideos]);

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex flex-col space-y-4">
        <h1 className="text-2xl font-bold">B站视频嵌入测试 (滚动预加载)</h1>
        
        <Card className="p-4 mb-6">
          <h3 className="text-lg font-medium mb-2">使用说明</h3>
          <ul className="list-disc list-inside space-y-2 text-sm text-gray-600 dark:text-gray-300">
            <li>支持响应式布局，自动适应不同屏幕尺寸</li>
            <li>视频默认使用16:9的宽高比</li>
            <li>支持全屏播放功能</li>
            <li>针对移动端优化了布局和加载体验</li>
            <li>支持深色模式</li>
            <li><strong>滚动预加载：页面滚动到底部时，会自动加载更多视频。</strong></li>
          </ul>
        </Card>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 gap-4 auto-rows-fr">
          {visibleVideos.map((video, index) => {
            const isLastElement = index === visibleVideos.length - 1;
            return (
              <div key={video.id} ref={isLastElement ? lastVideoElementRef : null}>
                <BilibiliVideo
                  title={video.title}
                  videoUrl={video.videoUrl}
                  isVisible={true} // Simplified: once in visibleVideos, it's ready to be rendered
                />
              </div>
            );
          })}
        </div>
        {visibleVideos.length < allVideos.length && (
          <div className="flex justify-center items-center p-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-gray-100"></div>
            <p className="ml-2">加载中...</p>
          </div>
        )}
      </div>
    </div>
  );
} 