import type { Metadata } from "next";
import { redirect } from "next/navigation";

import NewPasswordForm from "@/components/auth/NewPasswordForm";

/**
 * Metadata for the reset password page.
 */
export const metadata: Metadata = {
  title: "Choose A New Password | ESDV Footloose",
  description:
    "Choose a new password for your ESDV Footloose membership account.",
};

/**
 * Reset password page for members, linked through Strapi.
 *
 * @param props.searchParams URL Query params with the reset code from Strapi.
 * @returns The reset password page.
 */
export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>;
}) {
  const { code } = await searchParams;

  // Redirect when no code is specified
  if (!code) {
    redirect("/forgot-password");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-100 px-4 pt-24">
      <section className="w-full max-w-md rounded-2xl bg-white p-8 text-black shadow-xl">
        <NewPasswordForm code={code} />
      </section>
    </main>
  );
}
