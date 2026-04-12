import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const session = request.cookies.get('cfm_session')?.value;
  const { pathname } = request.nextUrl;

  console.log(`PROXY: [${request.method}] ${pathname} - Session: ${session ? 'Active' : 'Empty'}`);

  const isAuthRoute = pathname === '/login' || pathname === '/register';
  const isProtectedRoute = pathname.startsWith('/dashboard') || pathname === '/';

  if (!session && isProtectedRoute) {
    console.log(`PROXY: Unauthenticated access to protected route ${pathname}. Redirecting to /login`);
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (session && isAuthRoute) {
    console.log(`PROXY: Authenticated user on auth route ${pathname}. Redirecting to /dashboard`);
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  if (session && pathname === '/') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
