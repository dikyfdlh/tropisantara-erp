import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
import { ALL_ROLES, type Role } from '@/lib/roles';

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  session: { strategy: 'jwt', maxAge: 60 * 60 * 8 }, // 8 jam
  pages: { signIn: '/login' },
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const email = String(credentials?.email ?? '').toLowerCase().trim();
        const password = String(credentials?.password ?? '');
        if (!email || !password) return null;

        const user = await db.user.findUnique({ where: { email } });
        if (!user || !user.isActive) return null;

        const ok = await bcrypt.compare(password, user.password);
        if (!ok) return null;

        const role = ALL_ROLES.includes(user.role as Role) ? (user.role as Role) : null;
        if (!role) return null;

        return { id: user.id, email: user.email, name: user.name, role };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = (user as { id: string }).id;
        token.role = (user as { role: Role }).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as Role;
      }
      return session;
    },
  },
});
