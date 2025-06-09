"use client";

import { createSupabaseClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { SKIP_AUTH, DEFAULT_MOCK_USER } from "@/lib/auth-config";

type UserContentType = {
  getUser: () => Promise<User | undefined>;
  user: User | undefined;
  loading: boolean;
};

const UserContext = createContext<UserContentType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (SKIP_AUTH) {
      // 直接设置默认用户，跳过Supabase认证
      setUser(DEFAULT_MOCK_USER);
      setLoading(false);
    } else {
      // 使用原始逻辑获取用户
      if (user || typeof window === "undefined") return;
      getUser();
    }
  }, []);

  async function getUser() {
    if (user) {
      setLoading(false);
      return user;
    }

    if (SKIP_AUTH) {
      // 跳过Supabase用户获取，直接返回模拟用户
      setUser(DEFAULT_MOCK_USER);
      setLoading(false);
      return DEFAULT_MOCK_USER;
    }

    // 原始Supabase用户获取逻辑
    const supabase = createSupabaseClient();

    const {
      data: { user: supabaseUser },
    } = await supabase.auth.getUser();
    setUser(supabaseUser || undefined);
    setLoading(false);
    return supabaseUser || undefined;
  }

  const contextValue: UserContentType = {
    getUser,
    user,
    loading,
  };

  return (
    <UserContext.Provider value={contextValue}>{children}</UserContext.Provider>
  );
}

export function useUserContext() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUserContext must be used within a UserProvider");
  }
  return context;
}
