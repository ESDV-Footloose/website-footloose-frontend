import type { NextAuthOptions, DefaultSession } from "next-auth";
import type { JWT } from "next-auth/jwt";
import CredentialsProvider from "next-auth/providers/credentials";

const STRAPI_API_URL = process.env.NEXT_PUBLIC_STRAPI_API_URL?.replace(
  /\/$/,
  "",
);

interface CustomUser {
  id: string;
  name?: string | null;
  email?: string | null;
  jwt: string;
  strapiUserId: number;
}

interface CustomSession extends DefaultSession {
  jwt?: string;
  id?: string;
}

interface CustomJWT extends Omit<JWT, "id"> {
  jwt?: string;
  id?: string;
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Email and password",

      credentials: {
        identifier: {
          label: "Email",
          type: "email",
        },
        password: {
          label: "Password",
          type: "password",
        },
      },

      async authorize(credentials) {
        if (!credentials?.identifier || !credentials?.password) {
          return null;
        }

        try {
          const response = await fetch(`${STRAPI_API_URL}/api/auth/local`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              identifier: credentials.identifier,
              password: credentials.password,
            }),
          });

          if (!response.ok) {
            console.error("Strapi login failed:", await response.text());
            return null;
          }

          const data = await response.json();

          return {
            id: String(data.user.id),
            name: data.user.username,
            email: data.user.email,
            jwt: data.jwt,
            strapiUserId: data.user.id,
          } as CustomUser;
        } catch (error) {
          console.error("Error during Strapi login:", error);
          return null;
        }
      },
    }),
  ],

  secret: process.env.NEXTAUTH_SECRET,

  session: {
    strategy: "jwt",
  },

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const typedUser = user as unknown as CustomUser;
        const typedToken = token as CustomJWT;

        typedToken.jwt = typedUser.jwt;
        typedToken.id = typedUser.strapiUserId.toString();
      }

      return token as JWT;
    },

    async session({ session, token }) {
      const typedSession = session as CustomSession;
      const typedToken = token as CustomJWT;

      typedSession.jwt = typedToken.jwt;
      typedSession.id = typedToken.id;

      return typedSession;
    },
  },
};
