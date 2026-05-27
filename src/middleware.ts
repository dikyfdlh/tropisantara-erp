import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Proteksi sederhana: redirect ke /login bila tidak ada cookie session.
// Pemeriksaan role detail dilakukan di server action/page via requireRole().
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Path-path publik yang tidak butuh login:
  // - /login dan /api/auth (login flow)
  // - /_next (Next.js assets)
  // - /favicon
  // - /brand/* (logo, ikon brand statis — wajib bisa dilihat di halaman login)
  // - /uploads/* (logo upload, dll. — bila dibutuhkan di area publik)
  // - /icon.png, /apple-icon.png (favicon convention Next.js)
  // - File static dengan ekstensi (png, jpg, svg, ico, webp, css, js, dll.)
  const isPublic =
    pathname.startsWith('/login') ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/brand') ||
    pathname.startsWith('/uploads') ||
    pathname === '/icon.png' ||
    pathname === '/apple-icon.png' ||
    /\.(png|jpe?g|svg|ico|webp|gif|css|js|woff2?|ttf|otf)$/i.test(pathname) ||
    pathname === '/';

  if (isPublic) return NextResponse.next();

  const hasSession =
    req.cookies.get('authjs.session-token') ??
    req.cookies.get('__Secure-authjs.session-token');

  if (!hasSession) {
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  // Matcher tidak menjalankan middleware untuk path-path ini.
  // Catatan: file static di /public dengan ekstensi gambar dll. tetap diizinkan
  // lewat pengecekan di dalam middleware (di atas) sebagai jaring pengaman tambahan.
  matcher: [
    '/((?!api/auth|_next/static|_next/image|favicon.ico|brand|uploads|icon.png|apple-icon.png|login).*)',
  ],
};
