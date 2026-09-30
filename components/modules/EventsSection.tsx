import Link from "next/link";
import Image from "next/image";
import { getServerSession } from "next-auth/next";
import {
  FiCalendar,
  FiUsers,
  FiUnlock,
  FiLock,
  FiArrowRight,
} from "react-icons/fi";

import { authOptions } from "@/services/auth";
import Container from "@/components/containers/Container";

const STRAPI_API_URL = process.env.NEXT_PUBLIC_STRAPI_API_URL?.replace(
  /\/$/,
  "",
);

type RichTextChild = {
  text?: string;
  type?: string;
};

/** Representation of a rich text block. */
type RichTextBlock = {
  children?: RichTextChild[];
};

/** Representation of one event in the event overview */
type EventListItem = {
  /** Unique document ID of the event. */
  documentId: string;
  /** The event's name. */
  name: string;
  /** The event's website slug. */
  slug: string;
  /** The event's date. */
  date: string;
  /** The optional event image + alt text. */
  image: {
    url: string;
    alternativeText: string | null;
  } | null;
  /** The description of the event. */
  description: RichTextBlock[];
  /** The general price of the event. */
  price: number;
  /** The member price of the event. If not defined, the member price is the general price. */
  memberPrice: number | null;
  /** Whether the event is for members only or open for all. */
  membersOnly: boolean;
  /** Whether the event requires a user to subscribe. */
  requiresSubscription: boolean;
  /** The maximum number of subscriptions. */
  personLimit: number | null;
  /** How many users have subscribed for the event. */
  spotsTaken: number;
  /** Whether there are no free spots for the event. */
  isFull: boolean;
};

/**
 * Formats an event price for display.
 *
 * @param price The price in euros.
 * @returns The formatted euro price, or "Free" when the price is zero.
 */
const formatPrice = (price: number) =>
  price > 0 ? `€${price.toFixed(2)}` : "Free";

/**
 * Extracts a plain-text preview from Strapi rich text (blocks) content.
 *
 * @param blocks The rich-text blocks returned by Strapi.
 * @returns A trimmed plain-text representation of the content.
 */
function getDescriptionPreview(blocks: RichTextBlock[]): string {
  return blocks
    .map((block) =>
      (block.children ?? []).map((child) => child.text ?? "").join(""),
    )
    .join(" ")
    .trim();
}

/**
 * Retrieves upcoming events from Strapi.
 *
 * @param jwt Optional authenticated user's Strapi JWT.
 * @returns A list of upcoming events, or an empty array if the request fails.
 */
async function getUpcomingEvents(jwt?: string): Promise<EventListItem[]> {
  const res = await fetch(`${STRAPI_API_URL}/api/events/list`, {
    headers: jwt ? { Authorization: `Bearer ${jwt}` } : {},
    cache: "no-store",
  });

  if (!res.ok) return [];

  const data = await res.json();

  return data.data ?? [];
}

/**
 * Formats an event date and time for display.
 *
 * @param dateString ISO date string representing the event date.
 * @returns A human-readable date and time.
 */
function formatDate(dateString: string) {
  return new Intl.DateTimeFormat("en-UK", {
    weekday: "short",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(dateString));
}

/**
 * Renders a list of upcoming events.
 * When previewOnly = true, only the first three events are shown.
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

  const allEvents = await getUpcomingEvents(session?.jwt);
  const events = previewOnly ? allEvents.slice(0, 3) : allEvents;

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
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map((event) => (
                <Link
                  key={event.documentId}
                  href={`/events/${event.slug}`}
                  className="group overflow-hidden rounded-3xl bg-white shadow-xl shadow-slate-200/50 border border-slate-100 transition-transform hover:-translate-y-0.5"
                >
                  <div className="relative h-44 w-full bg-slate-100">
                    {event.image ? (
                      <Image
                        src={`${STRAPI_API_URL}${event.image.url}`}
                        alt={event.image.alternativeText ?? event.name}
                        fill
                        unoptimized
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-slate-400">
                        <FiCalendar className="h-10 w-10" />
                      </div>
                    )}

                    {!event.requiresSubscription ? (
                      <span className="absolute top-3 right-3 inline-flex items-center gap-1 rounded-full bg-emerald-50/95 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                        <FiUnlock className="h-3.5 w-3.5" />
                        No signup needed
                      </span>
                    ) : event.isFull ? (
                      <span className="absolute top-3 right-3 inline-flex items-center gap-1 rounded-full bg-slate-900/90 px-3 py-1 text-xs font-semibold text-white">
                        Full
                      </span>
                    ) : null}
                  </div>

                  <div className="p-5 space-y-3">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 group-hover:text-footloose transition-colors">
                        {event.name}
                      </h3>

                      <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-600">
                        <FiCalendar className="h-4 w-4 shrink-0" />
                        {formatDate(event.date)}
                      </p>
                      {event.membersOnly && (
                        <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-footloose/10 px-2.5 py-0.5 text-xs font-semibold text-footloose">
                          <FiLock className="h-3 w-3" />
                          Members only
                        </span>
                      )}
                    </div>

                    <p className="truncate text-sm text-slate-600">
                      {getDescriptionPreview(event.description)}
                    </p>

                    <span className="text-sm font-semibold text-slate-800">
                      {event.memberPrice != null
                        ? `Members ${formatPrice(event.memberPrice)} · Others ${formatPrice(event.price)}`
                        : formatPrice(event.price)}
                    </span>

                    {event.requiresSubscription && (
                      <span className="flex items-center gap-1.5 text-sm text-slate-600">
                        <FiUsers className="h-4 w-4" />
                        {event.spotsTaken}
                        {event.personLimit != null
                          ? ` / ${event.personLimit}`
                          : ""}
                      </span>
                    )}
                  </div>
                </Link>
              ))}
            </div>

            {previewOnly && allEvents.length > events.length && (
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
        )}
      </div>
    </Container>
  );
}
