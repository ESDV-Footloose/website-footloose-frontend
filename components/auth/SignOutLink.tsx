"use client";
import { useState } from "react";
import { signOut } from "next-auth/react";

/**
 * Link that signs the user out and returns them to the homepage.
 *
 * @returns The sign-out link component.
 */
export default function SignOutLink() {
  const [isSigningOut, setIsSigningOut] = useState(false);

  async function handleSignOut() {
    setIsSigningOut(true);
    await signOut({ callbackUrl: "/" });
  }

  return (
    <button
      type="button"
      onClick={handleSignOut}
      disabled={isSigningOut}
      className="mt-4 text-sm font-semibold text-footloose hover:underline"
    >
      {isSigningOut ? "Logging out..." : "Log out"}
    </button>
  );
}
