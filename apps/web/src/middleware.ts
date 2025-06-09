import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { SKIP_AUTH } from "@/lib/auth-config";

export async function middleware(request: NextRequest) {
  if (SKIP_AUTH) {
    // 跳过登录验证，直接允许访问
    // 如果用户访问登录相关页面，重定向到首页
    if (request.nextUrl.pathname.startsWith("/auth")) {
      const url = new URL("/", request.url);
      return NextResponse.redirect(url);
    }
    
    // 对于其他所有请求，直接通过
    return NextResponse.next();
  }
  
  // 使用原始登录验证逻辑
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
