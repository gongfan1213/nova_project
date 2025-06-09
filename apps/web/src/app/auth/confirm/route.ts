import { type EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest } from "next/server";
import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { redirect, RedirectType } from "next/navigation";
import { SKIP_AUTH } from "@/lib/auth-config";

export async function GET(request: NextRequest) {
  // 如果启用跳过登录模式，直接重定向到首页
  if (SKIP_AUTH) {
    redirect("/", RedirectType.replace);
    return;
  }

  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next") ?? "/";
  const code = searchParams.get("code");

  const supabase = createClient();

  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    });
    if (!error) {
      // redirect user to specified redirect URL or root of app
      revalidatePath(next);
      redirect(next, RedirectType.push);
    }
  } else if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // redirect user to specified redirect URL or root of app
      revalidatePath(next);
      redirect(next, RedirectType.push);
    }
  }

  // redirect the user to an error page with some instructions
  redirect("/error");
}
