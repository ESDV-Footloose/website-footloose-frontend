import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";

import LoginForm from "@/components/auth/LoginForm";
import { authOptions } from "@/services/auth";

/**
 * Metadata for the login page.
 */
export const metadata: Metadata = {
  title: "Member login | ESDV Footloose",
  description: "Log in to your ESDV Footloose membership account.",
};

/**
 * Login page for members.
 *
 * @returns The login page.
 */
export default async function LoginPage() {
  const session = await getServerSession(authOptions);

  if (session) {
    redirect("/membership");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-100 px-4 pt-24">
      <section className="w-full max-w-md rounded-2xl bg-white p-8 text-black shadow-xl">
        <LoginForm />
      </section>
    </main>
  );
}
