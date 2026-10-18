"use client";

import { useState } from "react";

import EventCard from "./EventCard";
import type { EventListItem, EventsPage } from "./types";

/**
 * Renders a grid of events with a "load more" control.
 *
 * @param props.initialEvents The first page, fetched server-side.
 * @param props.initialHasMore Whether a further page exists.
 * @param props.pageSize Number of events per page.
 */
export default function EventsList({
  initialEvents,
  initialHasMore,
  pageSize,
}: {
  initialEvents: EventListItem[];
  initialHasMore: boolean;
  pageSize: number;
}) {
  const [events, setEvents] = useState(initialEvents);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  async function loadMore() {
    setLoading(true);
    setError(false);

    try {
      const nextPage = page + 1;
      const res = await fetch(
        `/api/events/list?page=${nextPage}&pageSize=${pageSize}`,
      );
      if (!res.ok) throw new Error();

      const next: EventsPage = await res.json();
      setEvents((current) => [...current, ...next.events]);
      setHasMore(next.hasMore);
      setPage(nextPage);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {events.map((event) => (
          <EventCard key={event.documentId} event={event} />
        ))}
      </div>

      {error && (
        <p className="text-center text-sm text-red-600">
          Couldn&apos;t load more events. Please try again.
        </p>
      )}

      {hasMore && (
        <div className="flex justify-center">
          <button
            type="button"
            onClick={loadMore}
            disabled={loading}
            className="text-sm font-semibold text-footloose hover:underline disabled:opacity-50"
          >
            {loading ? "Loading..." : "Load more events"}
          </button>
        </div>
      )}
    </div>
  );
}
