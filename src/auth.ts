import NextAuth from "next-auth";
import { authConfig } from "./auth.config";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
    accessToken?: string;
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig); 