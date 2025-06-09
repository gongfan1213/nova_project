import { Session, User } from "@supabase/supabase-js";
import { createClient } from "./server";
import { SKIP_AUTH, DEFAULT_MOCK_USER, DEFAULT_MOCK_SESSION } from "../auth-config";

export async function verifyUserAuthenticated(): Promise<
  { user: User; session: Session } | undefined
> {
  if (SKIP_AUTH) {
    // 跳过Supabase验证，直接返回模拟用户和会话
    return { user: DEFAULT_MOCK_USER, session: DEFAULT_MOCK_SESSION };
  }

  // 原始Supabase验证逻辑
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!user || !session) {
    return undefined;
  }
  return { user, session };
}
