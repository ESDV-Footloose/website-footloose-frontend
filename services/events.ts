import type { EventListItem, EventsPage } from "@/components/events/types";

const STRAPI_API_URL = process.env.NEXT_PUBLIC_STRAPI_API_URL?.replace(
  /\/$/,
  "",
);

const STRAPI_API_TOKEN = process.env.STRAPI_API_TOKEN;

export const EVENTS_PAGE_SIZE = 6;
export const EVENTS_MAX_PAGE_SIZE = 50;

type StrapiEventsResponse = {
  data: EventListItem[];
  meta: { hasMore: boolean };
};

/**
 * Builds the Authorization header for event requests.
 *
 * @param jwt Optional Strapi JWT of the signed-in user. Without it, the
 * frontend's API token is used
 * @returns The headers to send to Strapi.
 */
export function eventAuthHeaders(jwt?: string): HeadersInit {
  const token = jwt ?? STRAPI_API_TOKEN;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/**
 * Fetches one page of upcoming events from Strapi.
 *
 * @param jwt Optional Strapi JWT of the signed-in user (for members-only events).
 * @param page The 1-indexed page number.
 * @param pageSize Number of events per page.
 * @returns The events of that page and whether a next page exists.
 * @throws When Strapi responds with an error.
 */
export async function fetchEventsPage(
  jwt: string | undefined,
  page: number,
  pageSize: number,
): Promise<EventsPage> {
  const res = await fetch(
    `${STRAPI_API_URL}/api/events?page=${page}&pageSize=${pageSize}`,
    {
      headers: eventAuthHeaders(jwt),
      cache: "no-store",
    },
  );

  if (!res.ok) {
    throw new Error(`Failed to fetch events (${res.status})`);
  }

  const body: StrapiEventsResponse = await res.json();
  return { events: body.data, hasMore: body.meta.hasMore };
}
