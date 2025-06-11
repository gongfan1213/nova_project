"use client";

import { useUserContext } from "@/contexts/UserContext";
import { SKIP_AUTH } from "@/lib/auth-config";

export function UserInfo() {
  const { user, loading } = useUserContext();

  if (loading) {
    return (
      <div className="fixed top-4 right-4 bg-white shadow-lg rounded-lg p-3 border">
        <div className="text-sm text-gray-500">加载用户信息中...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="fixed top-4 right-4 bg-white shadow-lg rounded-lg p-3 border">
        <div className="text-sm text-red-500">未找到用户信息</div>
      </div>
    );
  }

  return (
    <div className="hidden fixed top-8 right-8 bg-white shadow-lg rounded-lg p-3 border max-w-xs">
      <div className="text-xs text-gray-500 mb-2">
        {SKIP_AUTH ? "🚀 跳过登录模式" : "🔐 正常登录模式"}
      </div>
      <div className="text-sm font-medium text-gray-900">
        {user.user_metadata?.name || user.user_metadata?.full_name || "用户"}
      </div>
      <div className="text-xs text-gray-500">{user.email}</div>
      <div className="text-xs text-gray-400 mt-1">
        ID: {user.id.substring(0, 8)}...
      </div>
    </div>
  );
} 