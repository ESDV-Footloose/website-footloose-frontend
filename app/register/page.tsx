import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";

import RegisterForm from "@/components/auth/RegisterForm";
import { authOptions } from "@/services/auth";
import { getSiteLibrary } from "@/services/strapi";

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

  if (session) {
    redirect("/membership");
  }

  const { privacyPolicyUrl } = await getSiteLibrary();

  return <RegisterForm privacyPolicyUrl={privacyPolicyUrl} />;
}
