"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FiCheck, FiX, FiLock } from "react-icons/fi";

import Button from "@/components/modules/Button";

type ApiResponse = { error?: { message?: string } };

export default function EventSubscribeButton({
  documentId,
  isSubscribed,
  isFull,
  isPast,
  isLoggedIn,
  isMember,
  membersOnly,
  isRegistrationClosed,
  isDeregistrationClosed,
  price,
}: {
  documentId: string;
  isSubscribed: boolean;
  isFull: boolean;
  isPast: boolean;
  isLoggedIn: boolean;
  isMember: boolean;
  membersOnly: boolean;
  isRegistrationClosed: boolean;
  isDeregistrationClosed: boolean;
  /** The price applicable to the current user. */
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
      <div className="space-y-2">
        <Button
          type="button"
          disabled
          className="bg-slate-200 border-slate-200 text-slate-500 hover:bg-slate-200 hover:border-slate-200 hover:text-slate-500"
        >
          <FiLock className="h-5 w-5" />
          Log in to subscribe
        </Button>
        <p className="text-xs text-slate-500">
          <Link href="/login" className="font-semibold text-footloose">
            Log in
          </Link>{" "}
          to subscribe to this event.
        </p>
      </div>
    );
  }

  if (isSubscribed && isDeregistrationClosed) {
    return (
      <p className="text-sm font-semibold text-slate-700">
        You are subscribed. The deregistration deadline has passed, so you can
        no longer unsubscribe.
      </p>
    );
  }

  if (!isSubscribed && membersOnly && !isMember) {
    return (
      <p className="text-sm font-semibold text-slate-700">
        This event is for members only. Your membership has not been approved
        yet.
      </p>
    );
  }

  if (!isSubscribed && isRegistrationClosed) {
    return (
      <p className="text-sm font-semibold text-slate-500">
        Registration for this event is closed.
      </p>
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

      const data: ApiResponse = await res.json();

      if (!res.ok) {
        throw new Error(data.error?.message ?? "Something went wrong.");
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
            : isFull
              ? "bg-slate-200 border-slate-200 text-slate-500 hover:bg-slate-200 hover:border-slate-200 hover:text-slate-500"
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
