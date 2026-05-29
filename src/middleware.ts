import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const session = request.cookies.get('session')?.value;
  const path = request.nextUrl.pathname;

  // Protect Admin dashboard routes
  if (path.startsWith('/admin')) {
    if (!session) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    
    // In mock mode, allow the path if it matches the mock role token
    if (session.startsWith('mock-session-cookie-token-')) {
      const role = session.replace('mock-session-cookie-token-', '');
      if (role !== 'admin') {
        return NextResponse.redirect(new URL('/login', request.url));
      }
      return NextResponse.next();
    }
  }

  // Protect Vendor dashboard routes
  if (path.startsWith('/vendor')) {
    if (!session) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    if (session.startsWith('mock-session-cookie-token-')) {
      const role = session.replace('mock-session-cookie-token-', '');
      if (role !== 'vendor') {
        return NextResponse.redirect(new URL('/login', request.url));
      }
      return NextResponse.next();
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/vendor/:path*'],
};
