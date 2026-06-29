import type { Role } from "@prisma/client";
import type { DefaultSession } from "next-auth";

// Augment NextAuth types so session/token carry our app-specific fields.
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: Role;
    } & DefaultSession["user"];
  }

  interface User {
    role: Role;
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    id: string;
    role: Role;
  }
}
