import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";

import { authOptions } from "@/services/auth";
import {
  EVENTS_MAX_PAGE_SIZE,
  EVENTS_PAGE_SIZE,
  fetchEventsPage,
} from "@/services/events";

/** Parses a positive integer query param, falling back to a default. */
function parsePositiveInt(value: string | null, fallback: number) {
  const n = Number(value);
  return Number.isSafeInteger(n) && n > 0 ? n : fallback;
}

/**
 * Proxies a page of upcoming events from Strapi, attaching the signed-in
 * user's JWT server-side. Used by EventsList for "load more" requests.
 */
export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  const { searchParams } = new URL(request.url);

  const page = parsePositiveInt(searchParams.get("page"), 1);
  const pageSize = Math.min(
    parsePositiveInt(searchParams.get("pageSize"), EVENTS_PAGE_SIZE),
    EVENTS_MAX_PAGE_SIZE,
  );

  try {
    return NextResponse.json(
      await fetchEventsPage(session?.jwt, page, pageSize),
    );
  } catch {
    return NextResponse.json(
      { error: "Failed to load events" },
      { status: 502 },
    );
  }
}
