import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
    pages: {
      signIn: "/auth/signin",
    },
  }
);

export const config = {
  matcher: [
    /*
     * 匹配所有路径，除了：
     * - api/auth (NextAuth.js 路由)
     * - _next/static (静态文件)
     * - _next/image (图片优化文件)
     * - favicon.ico (图标文件)
     * - auth/* (认证页面)
     */
    "/((?!api/auth|_next/static|_next/image|favicon.ico|auth).*)",
  ],
};

