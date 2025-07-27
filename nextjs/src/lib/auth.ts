import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { getCloudflareContext } from '@opennextjs/cloudflare';
import bcrypt from "bcryptjs";
import { z } from "zod";
import type { JWT } from "next-auth/jwt";
import type { Session } from "next-auth";

// 登录表单验证schema
const loginSchema = z.object({
  email: z.string().email("请输入有效的邮箱地址"),
  password: z.string().min(6, "密码至少6位"),
});

// Admin登录表单验证schema
const adminLoginSchema = z.object({
  username: z.string().min(1, "请输入用户名"),
  password: z.string().min(1, "请输入密码"),
});

// 用户类型定义
interface AuthUser {
  id: string;
  email: string;
  is_guest: number;
  chat_count: number;
  last_chat_date: string | null;
  role: string;
  requiresPasswordChange: boolean;
}

// 用户类型定义
interface User {
  id: string;
  email: string;
  is_guest: number;
  chat_count: number;
  last_chat_date: string | null;
  role: string;
  requires_password_change: number;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const authConfig = (NextAuth as any)({
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "邮箱", type: "email" },
        username: { label: "用户名", type: "text" },
        password: { label: "密码", type: "password" }
      },
      async authorize(credentials) {
        try {
          // 获取数据库连接
          const { env } = await getCloudflareContext();
          const db = (env as unknown as { DB?: D1Database }).DB;
          
          if (!db) {
            throw new Error('数据库未绑定');
          }

          // 检查是否是admin登录（通过username字段判断）
          if (credentials?.username) {
            // Admin登录逻辑
            const { username, password } = adminLoginSchema.parse(credentials);
            
            // 查询admin用户
            const user = await db.prepare(`
              SELECT id, email, password_hash, is_guest, chat_count, last_chat_date, role, requires_password_change
              FROM User 
              WHERE id = ? AND role = 'admin'
            `).bind(username).first() as User & { password_hash: string } | null;

            if (!user) {
              return null;
            }

            // 检查密码哈希是否为空（空密码情况）
            if (!user.password_hash || user.password_hash.trim() === '') {
              // 空密码情况下，只允许使用'admin'作为密码
              if (password === 'admin') {
                return {
                  id: user.id,
                  email: user.email || '',
                  is_guest: user.is_guest,
                  chat_count: user.chat_count,
                  last_chat_date: user.last_chat_date,
                  role: user.role,
                  requiresPasswordChange: user.requires_password_change === 1,
                };
              }
              return null;
            }

            // 验证密码
            const isValid = bcrypt.compareSync(password, user.password_hash);
            if (!isValid) {
              return null;
            }

            return {
              id: user.id,
              email: user.email || '',
              is_guest: user.is_guest,
              chat_count: user.chat_count,
              last_chat_date: user.last_chat_date,
              role: user.role,
              requiresPasswordChange: user.requires_password_change === 1,
            };
          } else {
            // 普通用户登录逻辑
            const { email, password } = loginSchema.parse(credentials);
            
            // 查询用户
            const user = await db.prepare(`
              SELECT id, email, password_hash, is_guest, chat_count, last_chat_date, role, requires_password_change
              FROM User 
              WHERE email = ? AND is_guest = 0
            `).bind(email).first() as User & { password_hash: string } | null;

            if (!user || !user.password_hash) {
              return null;
            }

            // 验证密码
            const isValid = bcrypt.compareSync(password, user.password_hash);
            if (!isValid) {
              return null;
            }

            return {
              id: user.id,
              email: user.email,
              is_guest: user.is_guest,
              chat_count: user.chat_count,
              last_chat_date: user.last_chat_date,
              role: user.role,
              requiresPasswordChange: user.requires_password_change === 1,
            };
          }
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
        token.role = user.role;
        token.requiresPasswordChange = user.requiresPasswordChange;
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
        session.user.role = token.role as string;
        session.user.requiresPasswordChange = token.requiresPasswordChange as boolean;
      }
      return session;
    }
  },
  trustHost: true,
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
});

export const { handlers, signIn, signOut, auth } = authConfig;