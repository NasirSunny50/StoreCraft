import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/utils/password";
import { loginSchema } from "@/lib/validators/auth";
import { findUserByIdentifier } from "@/lib/auth-lookup";

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  logger: {
    error(error) {
      // CredentialsSignin is an expected, user-facing failure (wrong password /
      // unknown account). We surface a friendly message in the login action, so
      // we don't need the noisy stack trace in the server logs.
      if (error.name === "CredentialsSignin") return;
      console.error(error);
    },
  },
  providers: [
    Credentials({
      credentials: {
        identifier: { label: "Mobile number or email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (raw) => {
        const parsed = loginSchema.safeParse(raw);
        if (!parsed.success) return null;

        const { identifier, password } = parsed.data;
        const user = await findUserByIdentifier(identifier);

        // Same null return for "no user" and "wrong password" — don't leak which.
        if (!user) return null;
        // Defense in depth: blocked users can never authenticate.
        if (user.isBlocked) return null;

        const ok = await verifyPassword(password, user.password);
        if (!ok) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    jwt: ({ token, user }) => {
      if (user?.id) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    session: ({ session, token }) => {
      if (token) {
        session.user.id = token.id;
        session.user.role = token.role;
      }
      return session;
    },
  },
});
