import type { Metadata } from "next";
import { getServerSession } from "next-auth/next";
import { notFound } from "next/navigation";
import {
  FiUsers,
  FiUnlock,
  FiMapPin,
  FiClock,
  FiLock,
  FiCalendar,
} from "react-icons/fi";

import { authOptions } from "@/services/auth";
import { getPageBanner } from "@/services/strapi";
import RichText from "@/components/modules/RichText";
import SmallBanner from "@/components/modules/SmallBanner";
import Container from "@/components/containers/Container";
import EventSubscribeButton from "@/components/events/EventSubscribeButton";

const STRAPI_API_URL = process.env.NEXT_PUBLIC_STRAPI_API_URL?.replace(
  /\/$/,
  "",
);

const EVENTS_PAGE_SLUG = "events";

/** Formats an event price for display.
 *
 * @param price The price in euros.
 * @returns The formatted euro price, or "Free" when the price is zero.
 */
const formatPrice = (price: number) =>
  price > 0 ? `€${price.toFixed(2)}` : "Free";

/** Formats an ISO date string using Amsterdam time zone.
 *
 * @param date The date string to format.
 * @returns A human-readable date and time.
 */
const formatDateTime = (date: string) =>
  new Intl.DateTimeFormat("en-GB", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Amsterdam",
  }).format(new Date(date));

/**
 * Retrieves an event by its slug from Strapi.
 *
 * @param slug The event slug.
 * @param jwt Authenticated user's Strapi JWT. Used for subscription status.
 * @returns The event data, or null if the request fails.
 */
async function getEvent(slug: string, jwt?: string) {
  const res = await fetch(`${STRAPI_API_URL}/api/events/slug/${slug}`, {
    headers: jwt ? { Authorization: `Bearer ${jwt}` } : {},
    cache: "no-store",
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data.data;
}

/** Generates metadata for the event detail page based on the event name.
 *
 * @param params Route parameters containing the event slug.
 * @returns Page metadata with the event name, or a default title as fallback.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const event = await getEvent(slug);
  return {
    title: event ? `${event.name} | ESDV Footloose` : "Event | ESDV Footloose",
  };
}

/**
 * Renders the detail page for an event.
 * Displays event description, date, location, price, subscription info,
 * deadlines, optional attendees list, and subscription action.
 *
 * @param params Route parameters containing the event slug.
 * @returns The event detail page, or 404 if the event does not exist.
 */
export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const session = await getServerSession(authOptions);
  const isLoggedIn = Boolean(session?.jwt);

  const [event, eventsBanner] = await Promise.all([
    getEvent(slug, session?.jwt),
    getPageBanner(EVENTS_PAGE_SLUG),
  ]);

  if (!event) notFound();

  return (
    <main className="min-h-screen">
      <SmallBanner
        title={eventsBanner?.title ?? "Events"}
        backgroundImage={eventsBanner?.backgroundImage}
      />

      <Container>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Left: event title and description */}
          <div className="lg:col-span-2">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900">
              {event.name}
            </h2>

            <div className="-mx-4 md:-mx-8 lg:-mx-16 [&>div>div]:py-0!">
              <RichText content={event.description ?? []} />
            </div>
          </div>

          {/* Right: event details sidebar */}
          <div className="lg:sticky lg:top-24 space-y-4">
            <div className="rounded-3xl bg-white p-5 shadow-xl shadow-slate-200/50 border border-slate-100 space-y-4">
              {/** Event date */}
              {event.date && (
                <div className="flex items-start gap-3">
                  <FiCalendar className="mt-0.5 h-4 w-4 shrink-0 text-footloose" />
                  <div>
                    <p className="text-sm font-semibold text-slate-800">
                      {formatDateTime(event.date)}
                    </p>
                  </div>
                </div>
              )}

              {/** Event location */}
              {event.location && (
                <div className="flex items-start gap-3">
                  <FiMapPin className="mt-0.5 h-4 w-4 shrink-0 text-footloose" />
                  <div>
                    <p className="text-sm font-semibold text-slate-800">
                      {event.location}
                    </p>
                  </div>
                </div>
              )}

              {/** Event price */}
              <div className="flex items-start gap-3">
                <span className="mt-0.5 shrink-0 text-footloose text-sm font-bold w-4 text-center">
                  €
                </span>
                <div>
                  {event.memberPrice != null ? (
                    <div className="text-sm font-semibold text-slate-800">
                      <p>Members: {formatPrice(event.memberPrice)}</p>
                      <p>Non-members: {formatPrice(event.price)}</p>
                    </div>
                  ) : (
                    <p className="text-sm font-semibold text-slate-800">
                      {formatPrice(event.price)}
                    </p>
                  )}
                </div>
              </div>

              {/** Members-only or open to all */}
              {event.requiresSubscription && event.membersOnly && (
                <div className="flex items-start gap-3">
                  <FiLock className="mt-0.5 h-4 w-4 shrink-0 text-footloose" />
                  <p className="text-sm font-semibold text-slate-800">
                    Members only
                  </p>
                </div>
              )}

              {/** Spots taken + attendees list if authenticated */}
              {event.requiresSubscription ? (
                <>
                  <div className="flex items-start gap-3">
                    <FiUsers className="mt-0.5 h-4 w-4 shrink-0 text-footloose" />

                    {isLoggedIn ? (
                      <details className="group">
                        <summary className="flex cursor-pointer list-none items-center gap-1">
                          <p className="text-sm font-semibold text-slate-800">
                            {event.spotsTaken}
                            {event.personLimit != null
                              ? ` / ${event.personLimit}`
                              : " (no limit)"}
                            {" places taken"}
                          </p>

                          <svg
                            className="h-4 w-4 shrink-0 text-footloose transition-transform group-open:rotate-180"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                            aria-hidden="true"
                          >
                            <path
                              fillRule="evenodd"
                              d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.51a.75.75 0 01-1.08 1.04l-4.25-4.51a.75.75 0 01.02-1.06z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </summary>

                        <div className="mt-2">
                          {event.attendeeNames?.length === 0 ? (
                            <p className="text-sm text-slate-600">
                              No one has subscribed yet.
                            </p>
                          ) : (
                            <ul className="space-y-1 text-sm text-slate-800">
                              {event.attendeeNames?.map(
                                (attendeeName: string, index: number) => (
                                  <li key={`${attendeeName}-${index}`}>
                                    {attendeeName}
                                  </li>
                                ),
                              )}
                            </ul>
                          )}
                        </div>
                      </details>
                    ) : (
                      <p className="text-sm font-semibold text-slate-800">
                        {event.spotsTaken}
                        {event.personLimit != null
                          ? ` / ${event.personLimit}`
                          : " (no limit)"}
                        {" places taken"}
                      </p>
                    )}
                  </div>

                  {/** Registration and deregistration deadline */}
                  {(event.registrationDeadline ||
                    event.deregistrationDeadline) && (
                    <div className="flex items-start gap-3">
                      <FiClock className="mt-0.5 h-4 w-4 shrink-0 text-footloose" />
                      <div className="space-y-1.5">
                        {event.registrationDeadline && (
                          <div>
                            <p className="text-sm font-semibold text-slate-800">
                              Registration deadline:{" "}
                              {formatDateTime(event.registrationDeadline)}
                            </p>
                          </div>
                        )}
                        {event.deregistrationDeadline && (
                          <div>
                            <p className="text-sm font-semibold text-slate-800">
                              Cancellation deadline:{" "}
                              {formatDateTime(event.deregistrationDeadline)}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex items-start gap-3">
                  <FiUnlock className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                  <p className="text-sm font-semibold text-slate-800">
                    No signup needed
                  </p>
                </div>
              )}

              <div className="relative border-t-2 border-dashed border-slate-200 pt-1">
                <span className="absolute -left-2.5 -top-1.5 h-5 w-5 rounded-full bg-slate-50/50" />
                <span className="absolute -right-2.5 -top-1.5 h-5 w-5 rounded-full bg-slate-50/50" />
              </div>

              {event.requiresSubscription && (
                <EventSubscribeButton
                  documentId={event.documentId}
                  isSubscribed={event.isSubscribed}
                  isFull={event.isFull}
                  isPast={event.isPast}
                  isLoggedIn={isLoggedIn}
                  isMember={event.isMember}
                  membersOnly={event.membersOnly}
                  isRegistrationClosed={event.isRegistrationClosed}
                  isDeregistrationClosed={event.isDeregistrationClosed}
                  price={event.applicablePrice}
                />
              )}
            </div>
          </div>
        </div>
      </Container>
    </main>
  );
}
