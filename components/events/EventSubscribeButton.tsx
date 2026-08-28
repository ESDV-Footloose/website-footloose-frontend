"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FiCheck, FiX } from "react-icons/fi";

import Button from "@/components/modules/Button";

export default function EventSubscribeButton({
  documentId,
  isSubscribed,
  isFull,
  isPast,
  isLoggedIn,
  price,
}: {
  documentId: string;
  isSubscribed: boolean;
  isFull: boolean;
  isPast: boolean;
  isLoggedIn: boolean;
  price: number;
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);

  if (isPast) {
    return (
      <p className="text-sm font-semibold text-slate-500">
        This event has already taken place.
      </p>
    );
  }

  if (!isLoggedIn) {
    return (
      <Link
        href="/login"
        className="inline-flex items-center justify-center rounded-md border border-footloose px-4 py-2 text-white bg-footloose hover:bg-white hover:border-footloose hover:text-footloose transition-colors duration-300 hover:cursor-pointer"
      >
        Log in to subscribe
      </Link>
    );
  }

  async function toggle() {
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch(
        `/api/events/${documentId}/${isSubscribed ? "unsubscribe" : "subscribe"}`,
        { method: "POST" },
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error?.message ?? "Something went wrong.");
      }

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  const isPaid = price > 0;

  return (
    <div className="space-y-3">
      {isPaid && !isSubscribed && (
        <label className="flex items-start gap-2.5 cursor-pointer">
          <input
            type="checkbox"
            checked={paymentConfirmed}
            onChange={(e) => setPaymentConfirmed(e.target.checked)}
            className="mt-0.5 h-4 w-4 shrink-0 accent-footloose"
          />
          <span className="text-sm leading-relaxed text-slate-700">
            I promise to pay €{price.toFixed(2)} before the event.
          </span>
        </label>
      )}

      <Button
        type="button"
        onClick={toggle}
        disabled={
          submitting ||
          (!isSubscribed && isFull) ||
          (!isSubscribed && isPaid && !paymentConfirmed)
        }
        className={
          isSubscribed
            ? "bg-slate-700 border-slate-700 hover:bg-white hover:border-slate-700 hover:text-slate-700"
            : ""
        }
      >
        {isSubscribed ? (
          <FiX className="h-5 w-5" />
        ) : (
          <FiCheck className="h-5 w-5" />
        )}

        {submitting
          ? "Saving..."
          : isSubscribed
            ? "Unsubscribe"
            : isFull
              ? "Event is full"
              : "Subscribe"}
      </Button>

      {error && <p className="text-sm font-medium text-red-600">{error}</p>}
    </div>
  );
}
