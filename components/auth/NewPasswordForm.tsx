"use client";

import Link from "next/link";
import React, { useState } from "react";
import { FiLock } from "react-icons/fi";

import Button from "@/components/modules/Button";

/**
 * Form for choosing a new password.
 *
 * @param props.code Reset code from the password reset email.
 * @returns The new password form component.
 */
export default function NewPasswordForm({ code }: { code: string }) {
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (password !== passwordConfirmation) {
      setError("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, password, passwordConfirmation }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        setError(data?.message ?? "This reset link is invalid or has expired.");
        return;
      }

      setDone(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="flex flex-col gap-5 text-center">
        <h1 className="text-3xl font-bold">Password changed</h1>
        <p className="text-sm text-neutral-600">
          Your password has been updated. You can now log in.
        </p>
        <Link
          href="/login"
          className="font-semibold text-footloose hover:underline"
        >
          Go to login
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-footloose/10 text-footloose">
          <FiLock size={28} />
        </div>
        <h1 className="text-3xl font-bold">Choose a new password</h1>
      </div>

      <label className="flex flex-col gap-2">
        <span className="text-sm font-semibold">New password</span>
        <input
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          type="password"
          required
          minLength={6}
          autoComplete="new-password"
          className="rounded-md border border-black/20 px-4 py-3 outline-none transition-colors focus:border-footloose"
        />
      </label>

      <label className="flex flex-col gap-2">
        <span className="text-sm font-semibold">Confirm new password</span>
        <input
          value={passwordConfirmation}
          onChange={(event) => setPasswordConfirmation(event.target.value)}
          type="password"
          required
          minLength={6}
          autoComplete="new-password"
          className="rounded-md border border-black/20 px-4 py-3 outline-none transition-colors focus:border-footloose"
        />
      </label>

      {error && (
        <p className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <Button type="submit" disabled={isSubmitting} className="justify-center">
        {isSubmitting ? "Saving..." : "Set new password"}
      </Button>
    </form>
  );
}
