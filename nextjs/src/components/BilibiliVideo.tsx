'use client';

import { Card } from "@/components/ui/card";
import { useState } from "react";

interface BilibiliVideoProps {
  bvid: string;
  title?: string;
  className?: string;
  autoplay?: boolean;
}

export default function BilibiliVideo({ 
  bvid, 
  title, 
  className = '', 
  autoplay = false 
}: BilibiliVideoProps) {
  const [isLoading, setIsLoading] = useState(true);
  
  // 构建Bilibili播放器URL
  const videoUrl = `//player.bilibili.com/player.html?isOutside=true&bvid=${bvid}&autoplay=${autoplay ? 1 : 0}`;

  return (
    <div className={`relative w-full ${className}`}>
      {title && (
        <h3 className="text-lg font-semibold mb-3 flex items-center">
          <span className="mr-2">📹</span>
          {title}
        </h3>
      )}
      
      <div className="relative w-full bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden" style={{ paddingTop: '56.25%' }}>
        <iframe 
          className={`absolute top-0 left-0 w-full h-full transition-opacity duration-300 ${
            isLoading ? 'opacity-0' : 'opacity-100'
          }`}
          src={videoUrl}
          scrolling="no" 
          frameBorder="0" 
          allowFullScreen={true}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          onLoad={() => setIsLoading(false)}
          title={title || `Bilibili视频 ${bvid}`}
        />
        
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="mt-2 text-sm text-muted-foreground">加载视频中...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 