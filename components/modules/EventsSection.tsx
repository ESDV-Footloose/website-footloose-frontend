import Link from "next/link";
import Image from "next/image";
import { FiCalendar, FiUsers, FiUnlock } from "react-icons/fi";

import Container from "@/components/containers/Container";

const STRAPI_API_URL = process.env.NEXT_PUBLIC_STRAPI_API_URL?.replace(
  /\/$/,
  "",
);

type RichTextChild = {
  text?: string;
  type?: string;
};

type RichTextBlock = {
  children?: RichTextChild[];
};

type EventListItem = {
  documentId: string;
  name: string;
  slug: string;
  date: string;
  image: {
    url: string;
    alternativeText: string | null;
  } | null;
  description: RichTextBlock[];
  price: number;
  requiresSubscription: boolean;
  personLimit: number | null;
  spotsTaken: number;
  isFull: boolean;
};

/**
 * Extracts a plain-text preview from Strapi rich text (blocks) content.
 */
function getDescriptionPreview(blocks: RichTextBlock[]): string {
  return blocks
    .map((block) =>
      (block.children ?? []).map((child) => child.text ?? "").join(""),
    )
    .join(" ")
    .trim();
}

async function getUpcomingEvents(): Promise<EventListItem[]> {
  const res = await fetch(`${STRAPI_API_URL}/api/events/list`, {
    cache: "no-store",
  });

  if (!res.ok) return [];

  const data = await res.json();

  return data.data ?? [];
}

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

export default async function EventsSection({ heading }: { heading?: string }) {
  const events = await getUpcomingEvents();

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
              No upcoming events right now. Check back soon.
            </p>
          </div>
        ) : (
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
                  </div>

                  <p className="truncate text-sm text-slate-600">
                    {getDescriptionPreview(event.description)}
                  </p>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <span className="text-sm font-semibold text-slate-800">
                      {event.price > 0 ? `€${event.price.toFixed(2)}` : "Free"}
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
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </Container>
  );
}
