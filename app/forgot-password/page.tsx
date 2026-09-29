import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";

import ForgotPasswordForm from "@/components/auth/ForgotPasswordForm";
import { authOptions } from "@/services/auth";

/**
 * Metadata for the forgot password page.
 */
export const metadata: Metadata = {
  title: "Reset Password | ESDV Footloose",
  description: "Reset the password for your ESDV Footloose membership account.",
};

/**
 * Forgot password page for members.
 *
 * @returns The forgot password page.
 */
export default async function ForgotPasswordPage() {
  const session = await getServerSession(authOptions);

  if (session) {
    redirect("/membership");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-100 px-4 pt-24">
      <section className="w-full max-w-md rounded-2xl bg-white p-8 text-black shadow-xl">
        <ForgotPasswordForm />
      </section>
    </main>
  );
}
