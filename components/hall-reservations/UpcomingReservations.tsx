"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FiClock, FiTrash2 } from "react-icons/fi";

import type { OwnReservation } from "@/services/hallReservations";

/**
 * Lists the member's upcoming reservations, which they can remove.
 *
 * @param param0 The page and hall reservation component the list is in, and the member's upcoming reservations, or null if they could not be loaded.
 * @returns The list of upcoming reservations.
 */
export default function UpcomingReservations({
  pageSlug,
  sectionId,
  reservations,
}: {
  pageSlug: string;
  sectionId: number;
  reservations: OwnReservation[] | null;
}) {
  const router = useRouter();

  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  // Hides removed reservations until the refreshed list arrives.
  const [removedIds, setRemovedIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  const visible = (reservations ?? []).filter(
    (r) => !removedIds.has(r.eventId),
  );

  async function remove(reservation: OwnReservation) {
    setDeletingId(reservation.eventId);
    setError(null);
    try {
      const res = await fetch("/api/hall-reservations", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          page: pageSlug,
          section: sectionId,
          hall: reservation.hallName,
          pending: reservation.pending,
          eventId: reservation.eventId,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        // The reservation may have been moved or removed elsewhere, so reload the list.
        if (res.status === 404) router.refresh();
        throw new Error(
          data?.error?.message ?? "Could not remove the reservation.",
        );
      }
      setRemovedIds((prev) => new Set(prev).add(reservation.eventId));
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setDeletingId(null);
      setConfirmingId(null);
    }
  }

  return (
    <section>
      <h2 className="text-3xl md:text-4xl font-semibold">Your reservations</h2>

      {reservations === null ? (
        <p className="mt-2">
          We couldn&apos;t load your reservations. Try again shortly.
        </p>
      ) : visible.length === 0 ? (
        <p className="mt-2">You have no upcoming reservations.</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {visible.map((reservation) => {
            const isConfirming = confirmingId === reservation.eventId;
            const isDeleting = deletingId === reservation.eventId;
            return (
              <li
                key={reservation.eventId}
                className="rounded-md border border-l-4 border-neutral-300 border-l-footloose px-4 py-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold">{reservation.hallName}</p>
                    <p className="mt-1 flex items-center gap-1.5 text-sm">
                      <FiClock className="h-4 w-4 shrink-0 text-neutral-500" />
                      {reservation.period}
                    </p>
                    <p className="truncate text-sm text-neutral-500">
                      {reservation.title}
                    </p>
                  </div>

                  {!isConfirming && (
                    <button
                      type="button"
                      aria-label={`Remove reservation of ${reservation.hallName} on ${reservation.period}`}
                      onClick={() => setConfirmingId(reservation.eventId)}
                      className="shrink-0 rounded-md p-1.5 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-footloose cursor-pointer"
                    >
                      <FiTrash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>

                {isConfirming && (
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-neutral-200 pt-3">
                    <span className="text-sm">Remove this reservation?</span>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={isDeleting}
                        onClick={() => setConfirmingId(null)}
                        className="rounded-md border border-neutral-300 px-3 py-1 text-sm transition-colors hover:bg-neutral-100 cursor-pointer disabled:opacity-40"
                      >
                        Keep
                      </button>
                      <button
                        type="button"
                        disabled={isDeleting}
                        onClick={() => remove(reservation)}
                        className="rounded-md border border-footloose bg-footloose px-3 py-1 text-sm text-white transition-colors hover:bg-white hover:text-footloose cursor-pointer disabled:opacity-40"
                      >
                        {isDeleting ? "Removing..." : "Remove"}
                      </button>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {error && <p className="mt-2 text-footloose">{error}</p>}
    </section>
  );
}
