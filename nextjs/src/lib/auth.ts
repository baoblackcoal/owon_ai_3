import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { getCloudflareContext } from '@opennextjs/cloudflare';
import bcrypt from "bcrypt";
import { z } from "zod";
import type { JWT } from "next-auth/jwt";
import type { Session } from "next-auth";

// 登录表单验证schema
const loginSchema = z.object({
  email: z.string().email("请输入有效的邮箱地址"),
  password: z.string().min(6, "密码至少6位"),
});

// 用户类型定义
interface AuthUser {
  id: string;
  email: string;
  is_guest: number;
  chat_count: number;
  last_chat_date: string | null;
}

// 用户类型定义
interface User {
  id: string;
  email: string;
  is_guest: number;
  chat_count: number;
  last_chat_date: string | null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const authConfig = (NextAuth as any)({
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "邮箱", type: "email" },
        password: { label: "密码", type: "password" }
      },
      async authorize(credentials) {
        try {
          // 验证输入
          const { email, password } = loginSchema.parse(credentials);
          
          // 获取数据库连接
          const { env } = await getCloudflareContext();
          const db = (env as unknown as { DB?: D1Database }).DB;
          
          if (!db) {
            throw new Error('数据库未绑定');
          }

          // 查询用户
          const user = await db.prepare(`
            SELECT id, email, password_hash, is_guest, chat_count, last_chat_date
            FROM User 
            WHERE email = ? AND is_guest = 0
          `).bind(email).first() as User & { password_hash: string } | null;

          if (!user || !user.password_hash) {
            return null;
          }

          // 验证密码
          const isValid = await bcrypt.compare(password, user.password_hash);
          if (!isValid) {
            return null;
          }

          return {
            id: user.id,
            email: user.email,
            is_guest: user.is_guest,
            chat_count: user.chat_count,
            last_chat_date: user.last_chat_date,
          };
        } catch (error) {
          console.error('认证失败:', error);
          return null;
        }
      }
    })
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30天
  },
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30天
  },
  callbacks: {
    async jwt({ token, user }: { token: JWT; user: AuthUser | null }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.is_guest = user.is_guest;
        token.chat_count = user.chat_count;
        token.last_chat_date = user.last_chat_date;
      }
      return token;
    },
    async session({ session, token }: { session: Session; token: JWT }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.is_guest = token.is_guest as number;
        session.user.chat_count = token.chat_count as number;
        session.user.last_chat_date = token.last_chat_date as string | null;
      }
      return session;
    }
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
});

export const { handlers, signIn, signOut, auth } = authConfig;