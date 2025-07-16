// NextAuth type extensions

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      is_guest: number;
      chat_count: number;
      last_chat_date: string | null;
    };
  }

  interface User {
    id: string;
    email: string;
    is_guest: number;
    chat_count: number;
    last_chat_date: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    email: string;
    is_guest: number;
    chat_count: number;
    last_chat_date: string | null;
  }
} 