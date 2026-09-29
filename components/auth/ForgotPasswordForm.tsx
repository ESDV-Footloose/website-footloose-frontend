"use client";

import Link from "next/link";
import React, { useState } from "react";
import { FiUser } from "react-icons/fi";

import Button from "@/components/modules/Button";

/**
 * Forgot password form for Strapi users.
 *
 * @returns The forgot password form component.
 */
export default function ForgotPasswordForm() {
  const [identifier, setIdentifier] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setIsSubmitting(true);

    const response = await fetch("/api/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: identifier }),
    });

    setIsSubmitting(false);

    if (!response.ok) {
      setError("Something went wrong. Please try again.");
      return;
    }

    setSent(true);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-footloose/10 text-footloose">
          <FiUser size={28} />
        </div>

        <h1 className="text-3xl font-bold">Reset password</h1>

        <p className="mt-2 text-sm text-neutral-600">
          Reset the password to your Footloose account.
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

      {error && (
        <p className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {sent && (
        <p className="rounded-md bg-green-50 px-4 py-3 text-sm text-green-700">
          If an account with that email exists, a password reset email has been
          sent.
        </p>
      )}

      <Button type="submit" disabled={isSubmitting} className="justify-center">
        {isSubmitting ? "Sending password reset email..." : "Reset password"}
      </Button>

      <p className="text-center text-sm text-neutral-600">
        Remember your password?{" "}
        <Link
          href="/login"
          className="font-semibold text-footloose hover:underline"
        >
          Login
        </Link>
      </p>

      <hr className="border-t border-neutral-200" />

      <p className="text-center text-sm text-neutral-600">
        Don&apos;t have an account?{" "}
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
