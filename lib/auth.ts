import type { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { getServerSession } from 'next-auth/next';

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: 'select_account',
        },
      },
    }),
  ],
  session: { strategy: 'jwt' },
  pages: { signIn: '/auth/signin' },
  callbacks: {
    jwt({ token, account, profile }) {
      // On first sign-in, persist the provider's sub as the stable user ID
      if (account && profile) {
        token.userId = token.sub ?? token.email;
      }
      return token;
    },
    session({ session, token }) {
      // Expose userId on the session object
      if (session.user) {
        (session.user as any).id = token.userId ?? token.sub ?? token.email;
      }
      return session;
    },
  },
};

/**
 * Returns the current user's stable ID (Google sub) or null if not authenticated.
 * Use this in every API route to scope data to the signed-in user.
 */
export async function getAuthUserId(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  return (session.user as any).id ?? session.user.email ?? null;
}
