import type { Metadata } from "next";
import { getServerSession } from "next-auth/next";

import RegisterForm from "@/components/auth/RegisterForm";
import { authOptions } from "@/services/auth";

/**
 * Metadata for the register page.
 */
export const metadata: Metadata = {
  title: "Register | ESDV Footloose",
  description: "Create your ESDV Footloose membership account.",
};

/**
 * Register page for new members.
 *
 * @returns The register page.
 */
export default async function RegisterPage() {
  const session = await getServerSession(authOptions);

  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-100 px-4 pt-24">
      <section className="w-full max-w-md rounded-2xl bg-white p-8 text-black shadow-xl">
        <RegisterForm session={session} />
      </section>
    </main>
  );
}
