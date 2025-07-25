import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";
import SessionProvider from "@/components/SessionProvider";
import { UIProvider } from "@/contexts/UIContext";

export const metadata: Metadata = {
  title: "OWON 小欧AI 助手",
  description: "专业的测试仪器智能助手，提供测试仪器相关的技术支持和解答",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">
        <SessionProvider>
          <UIProvider>
            <Header />
            <main className="pt-16">
              {children}
            </main>
          </UIProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
