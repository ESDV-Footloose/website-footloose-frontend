import type { Metadata } from "next";
import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { FiClock, FiUser } from "react-icons/fi";

import { authOptions } from "@/services/auth";
import SignOutLink from "@/components/auth/SignOutLink";

const STRAPI_API_URL = process.env.NEXT_PUBLIC_STRAPI_API_URL?.replace(
  /\/$/,
  "",
);

export const metadata: Metadata = {
  title: "Membership | ESDV Footloose",
  description: "Your ESDV Footloose membership status.",
};

/**
 * Fetches the current user directly from Strapi using their JWT, so
 * approval status is always current instead of relying on a value
 * cached in the NextAuth session token.
 */
async function getCurrentStrapiUser(jwt: string) {
  const response = await fetch(`${STRAPI_API_URL}/api/users/me`, {
    headers: { Authorization: `Bearer ${jwt}` },
    cache: "no-store",
  });

  if (!response.ok) {
    return null;
  }

  return response.json();
}

export default async function MembershipPage() {
  const session = await getServerSession(authOptions);

  if (!session?.jwt) {
    redirect("/login");
  }

  const user = await getCurrentStrapiUser(session.jwt);

  if (!user) {
    redirect("/login");
  }

  if (!user.approved) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-neutral-100 px-4 pt-24">
        <section className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-xl">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 text-amber-700">
            <FiClock size={28} />
          </div>
          <h1 className="text-3xl font-bold">Awaiting approval</h1>
          <p className="mt-2 text-sm text-neutral-600">
            Hi {user.firstName ?? user.username}, your account has been created
            but still needs to be approved by the board. You'll get access to
            the membership pages as soon as that's done.
          </p>
          <SignOutLink />
        </section>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-100 px-4 pt-24">
      <section className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-xl">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-footloose/10 text-footloose">
          <FiUser size={28} />
        </div>
        <h1 className="text-3xl font-bold">
          Welcome, {user.firstName ?? user.username}
        </h1>
        <p className="mt-2 text-sm text-neutral-600">
          This is your ESDV Footloose membership page.
        </p>
        <SignOutLink />
      </section>
    </main>
  );
}
