import { User, Session } from "@supabase/supabase-js";

// 是否跳过登录验证的配置
export const SKIP_AUTH = process.env.NEXT_PUBLIC_SKIP_AUTH === "true" || true; // 默认启用跳过登录

// 默认模拟用户信息
export const DEFAULT_MOCK_USER: User = {
  id: "mock-user-id-12345",
  aud: "authenticated",
  role: "authenticated",
  email: "demo@opencanvas.com",
  email_confirmed_at: new Date().toISOString(),
  phone: "",
  confirmed_at: new Date().toISOString(),
  last_sign_in_at: new Date().toISOString(),
  app_metadata: {},
  user_metadata: {
    name: "Demo User",
    full_name: "Demo User",
    avatar_url: "",
  },
  identities: [],
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

// 默认模拟会话信息
export const DEFAULT_MOCK_SESSION: Session = {
  access_token: "mock-access-token",
  refresh_token: "mock-refresh-token",
  expires_in: 3600,
  expires_at: Math.floor(Date.now() / 1000) + 3600,
  token_type: "bearer",
  user: DEFAULT_MOCK_USER,
}; 