import Link from "next/link";
import { getServerSession } from "next-auth/next";
import { FiArrowRight } from "react-icons/fi";

import { authOptions } from "@/services/auth";
import Container from "@/components/containers/Container";
import EventsList from "@/components/events/EventsList";
import { type EventListItem } from "@/components/events/types";
import EventCard from "@/components/events/EventCard";
import { EVENTS_PAGE_SIZE, fetchEventsPage } from "@/services/events";

/** Number of events shown when previewOnly is enabled. */
const PREVIEW_SIZE = 3;

/**
 * Renders a list of upcoming events.
 * When previewOnly, only the first three events + link to the events page are shown
 * Otherwise, events are shown six at a time with a load-more control.
 *
 * @param props Section configuration
 * @param props.heading Optional heading displayed above the event
 * @param props.previewOnly Whether to show only the first three events or all events.
 * @returns The events section containing event cards or an empty-state message.
 */
export default async function EventsSection({
  heading,
  previewOnly,
}: {
  heading?: string;
  previewOnly?: boolean;
}) {
  const session = await getServerSession(authOptions);
  const isLoggedIn = Boolean(session?.jwt);

  let events: EventListItem[] = [];
  let hasMore = false;
  try {
    ({ events, hasMore } = await fetchEventsPage(
      session?.jwt,
      1,
      previewOnly ? PREVIEW_SIZE : EVENTS_PAGE_SIZE,
    ));
  } catch {
    // Fall through to the empty state.
  }

  return (
    <Container>
      <div className="space-y-6">
        {heading && (
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
            {heading}
          </h2>
        )}

        {events.length === 0 ? (
          <div className="rounded-3xl bg-white p-8 shadow-xl shadow-slate-200/50 border border-slate-100 text-center">
            <p className="text-base text-slate-600">
              There are no events right now. Check back soon.
            </p>
            {!isLoggedIn && (
              <p className="mt-2 text-sm text-slate-500">
                <Link href="/login" className="font-semibold text-footloose">
                  Log in
                </Link>{" "}
                to also see members-only events.
              </p>
            )}
          </div>
        ) : previewOnly ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map((event) => (
                <EventCard key={event.documentId} event={event} />
              ))}
            </div>

            {hasMore && (
              <div className="flex justify-center">
                <Link
                  href="/events"
                  className="group inline-flex items-center gap-2 text-sm font-semibold text-footloose"
                >
                  View all events
                  <FiArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </div>
            )}
          </>
        ) : (
          <EventsList
            initialEvents={events}
            initialHasMore={hasMore}
            pageSize={EVENTS_PAGE_SIZE}
          />
        )}
      </div>
    </Container>
  );
}
