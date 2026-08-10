"use client";

import Link from "next/link";
import React, { useState } from "react";
import type { Session } from "next-auth";
import { signIn, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { FiCheckCircle, FiLogOut, FiUser } from "react-icons/fi";

import Button from "@/components/modules/Button";

/**
 * Properties passed to the login form component.
 */
export type LoginFormProps = {
  /**
   * Current NextAuth session.
   */
  readonly session: Session | null;
};

/**
 * Login form for Strapi users.
 *
 * @param loginFormProps Properties passed to the login form component.
 * @returns The login form component.
 */
export default function LoginForm({ session }: LoginFormProps) {
  const router = useRouter();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const strapiUserId = (session as any)?.id;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setIsSubmitting(true);

    const result = await signIn("credentials", {
      identifier,
      password,
      redirect: false,
    });

    setIsSubmitting(false);

    if (result?.error) {
      setError("Invalid email or password.");
      return;
    }

    router.refresh();
  }

  async function handleSignOut() {
    setIsSigningOut(true);

    await signOut({
      redirect: false,
    });

    setIsSigningOut(false);
    router.refresh();
  }

  if (session) {
    return (
      <div className="flex flex-col gap-6">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-green-700">
            <FiCheckCircle size={28} />
          </div>

          <h1 className="text-3xl font-bold">You are logged in</h1>

          <p className="mt-2 text-sm text-neutral-600">
            Your Footloose membership session is active.
          </p>
        </div>

        <div className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          <p className="font-semibold">Logged in successfully</p>
          {session.user?.email && <p className="mt-1">{session.user.email}</p>}
        </div>

        <Button
          onClick={handleSignOut}
          disabled={isSigningOut}
          className="justify-center"
        >
          <FiLogOut />
          <span>{isSigningOut ? "Signing out..." : "Sign out"}</span>
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-footloose/10 text-footloose">
          <FiUser size={28} />
        </div>

        <h1 className="text-3xl font-bold">Member login</h1>

        <p className="mt-2 text-sm text-neutral-600">
          Log in with your Footloose account to access your membership page.
        </p>
      </div>

      <label className="flex flex-col gap-2">
        <span className="text-sm font-semibold">Email</span>
        <input
          value={identifier}
          onChange={(event) => setIdentifier(event.target.value)}
          type="email"
          required
          autoComplete="email"
          className="rounded-md border border-black/20 px-4 py-3 outline-none transition-colors focus:border-footloose"
          placeholder="you@example.com"
        />
      </label>

      <label className="flex flex-col gap-2">
        <span className="text-sm font-semibold">Password</span>
        <input
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          type="password"
          required
          autoComplete="current-password"
          className="rounded-md border border-black/20 px-4 py-3 outline-none transition-colors focus:border-footloose"
          placeholder="••••••••"
        />
      </label>

      {error && (
        <p className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <Button type="submit" disabled={isSubmitting} className="justify-center">
        {isSubmitting ? "Signing in..." : "Sign in"}
      </Button>

      <p className="text-center text-sm text-neutral-600">
        Don't have an account?{" "}
        <Link
          href="/register"
          className="font-semibold text-footloose hover:underline"
        >
          Register
        </Link>
      </p>
    </form>
  );
}
