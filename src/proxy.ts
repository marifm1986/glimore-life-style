import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const session = request.cookies.get('session')?.value;
  const userRole = request.cookies.get('user-role')?.value;
  const path = request.nextUrl.pathname;

  if (path.startsWith('/admin')) {
    if (!session) return NextResponse.redirect(new URL('/login', request.url));
    if (userRole !== 'admin') return NextResponse.redirect(new URL('/login', request.url));
  }

  if (path.startsWith('/vendor')) {
    if (!session) return NextResponse.redirect(new URL('/login', request.url));
    if (userRole !== 'vendor' && userRole !== 'admin') {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/vendor/:path*'],
};
