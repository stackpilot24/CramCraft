export { default } from 'next-auth/middleware';

// Only protect app routes — homepage (/) and auth pages stay public
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/upload/:path*',
    '/deck/:path*',
    '/study/:path*',
    '/exam/:path*',
    '/stats/:path*',
  ],
};
