import Link from "next/link";
import Image from "next/image";
import { FiCalendar, FiUsers, FiUnlock, FiLock } from "react-icons/fi";
import type { EventListItem, RichTextBlock } from "./types";

const STRAPI_API_URL = process.env.NEXT_PUBLIC_STRAPI_API_URL?.replace(
  /\/$/,
  "",
);

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
 * Renders a single event as a clickable card, linking to its detail page.
 *
 * @param props Card configuration.
 * @param props.event The event to display.
 * @returns A card summarizing the event's image, date, price and spots.
 */
export default function EventCard({ event }: { event: EventListItem }) {
  return (
    <Link
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
            {event.personLimit != null ? ` / ${event.personLimit}` : ""}
          </span>
        )}
      </div>
    </Link>
  );
}
