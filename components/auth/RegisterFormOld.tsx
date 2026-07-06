"use client";

import Link from "next/link";
import React, { useState } from "react";
import type { Session } from "next-auth";
import { signIn, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { FiCheckCircle, FiLogOut, FiUserPlus } from "react-icons/fi";

import Button from "@/components/modules/Button";

/**
 * Properties passed to the register form component.
 */
export type RegisterFormProps = {
  /**
   * Current NextAuth session.
   */
  readonly session: Session | null;
};

/**
 * Register form for new Strapi users.
 *
 * @param registerFormProps Properties passed to the register form component.
 * @returns The register form component.
 */
export default function RegisterForm({ session }: RegisterFormProps) {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordRepeat, setPasswordRepeat] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");

    if (password !== passwordRepeat) {
      setError("The passwords do not match.");
      return;
    }

    setIsSubmitting(true);

    const response = await fetch("/api/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username,
        email,
        password,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      setIsSubmitting(false);
      setError(
        data.message ?? "Something went wrong while creating your account.",
      );
      return;
    }

    const loginResult = await signIn("credentials", {
      identifier: email,
      password,
      redirect: false,
    });

    setIsSubmitting(false);

    if (loginResult?.error) {
      setError(
        "Your account was created, but logging in failed. Please try logging in manually.",
      );
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
            You already have an active Footloose membership session.
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
          <FiUserPlus size={28} />
        </div>

        <h1 className="text-3xl font-bold">Create account</h1>

        <p className="mt-2 text-sm text-neutral-600">
          Register with your email address to create your Footloose account.
        </p>
      </div>

      <label className="flex flex-col gap-2">
        <span className="text-sm font-semibold">Username</span>
        <input
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          type="text"
          required
          autoComplete="username"
          className="rounded-md border border-black/20 px-4 py-3 outline-none transition-colors focus:border-footloose"
          placeholder="Your name"
        />
      </label>

      <label className="flex flex-col gap-2">
        <span className="text-sm font-semibold">Email</span>
        <input
          value={email}
          onChange={(event) => setEmail(event.target.value)}
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
          autoComplete="new-password"
          className="rounded-md border border-black/20 px-4 py-3 outline-none transition-colors focus:border-footloose"
          placeholder="••••••••"
        />
      </label>

      <label className="flex flex-col gap-2">
        <span className="text-sm font-semibold">Repeat password</span>
        <input
          value={passwordRepeat}
          onChange={(event) => setPasswordRepeat(event.target.value)}
          type="password"
          required
          autoComplete="new-password"
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
        {isSubmitting ? "Creating account..." : "Create account"}
      </Button>

      <p className="text-center text-sm text-neutral-600">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-semibold text-footloose hover:underline"
        >
          Log in
        </Link>
      </p>
    </form>
  );
}
