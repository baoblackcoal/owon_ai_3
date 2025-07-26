'use client';

export default function FaqHeader() {
  return (
    <div className="flex-1 p-2 ">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
          视频和问答集
        </h1>
        <p className="text-muted-foreground text-sm ">
          快速查找您需要的视频教程和常见问题解答
        </p>
      </div>
    </div>
  );
} 