import { NextResponse, NextRequest } from "next/server";
import jwt from "jsonwebtoken";

export async function proxy(request: NextRequest) {
  const token = request.cookies.get("token")?.value;
  const pathname = request.nextUrl.pathname;

  if (token) {
    try {
      jwt.verify(token, process.env.JWT_SECRET!);
      const unAuthorizedPathnames = ["/login", "/signup"];
      const isUnAuthorized = unAuthorizedPathnames.some(
        (path) => pathname === path,
      );

      if (isUnAuthorized) {
        const decode = jwt.decode(token) as {
          id: string;
          role: "guest" | "user";
        };
        const isGuest = decode.role === "guest";
        if (isGuest) return NextResponse.next();

        return NextResponse.redirect(new URL("/home/lists", request.url));
      }
      return NextResponse.next();
    } catch {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  } else if (!token) {
    const protectedPathnames = ["/home"];
    const isProtected = protectedPathnames.some((path) =>
      pathname.startsWith(path),
    );
    if (isProtected)
      return NextResponse.redirect(new URL("/login", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/home/:path*", "/login", "/signup"],
};
