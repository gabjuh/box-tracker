import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-change-in-production'
);

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value;
  console.log('Middleware - Path:', request.nextUrl.pathname, 'Token exists:', !!token);

  // Public paths that don't require authentication
  if (request.nextUrl.pathname.startsWith('/login') || request.nextUrl.pathname.startsWith('/moving')) {
    console.log('Public path detected:', request.nextUrl.pathname);
    // If user is logged in and tries to access login, redirect to home (but allow /moving for everyone)
    if (request.nextUrl.pathname.startsWith('/login') && token && await isValidToken(token)) {
      console.log('Valid token found, redirecting to home');
      return NextResponse.redirect(new URL('/', request.url));
    }
    console.log('Allowing access to public path');
    return NextResponse.next();
  }

  // Check if user is authenticated for protected routes
  if (!token || !(await isValidToken(token))) {
    console.log('No valid token for protected route, redirecting to login');
    return NextResponse.redirect(new URL('/login', request.url));
  }

  console.log('Valid token, allowing access to protected route');
  return NextResponse.next();
}

async function isValidToken(token: string): Promise<boolean> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    console.log('Token validation successful:', !!payload);
    return true;
  } catch (error) {
    console.log('Token validation failed:', (error as Error).message);
    return false;
  }
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|uploads).*)']
};