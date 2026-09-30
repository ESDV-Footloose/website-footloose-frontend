import "server-only";
import { createSign } from "node:crypto";

/**
 * Google Calendar REST API.
 *
 * @internal
 */
const CALENDAR_API_URL = "https://www.googleapis.com/calendar/v3";

/**
 * OAuth scope that allows reading and writing calendar events.
 *
 * @internal
 */
const CALENDAR_SCOPE = "https://www.googleapis.com/auth/calendar";

/**
 * URL where access tokens are requested.
 *
 * @internal
 */
const TOKEN_URL = "https://oauth2.googleapis.com/token";

/**
 * Start / end time of event.
 */
export type GoogleCalendarEventTime = {
  /** RFC3339 timestamp, set for timed events. */
  dateTime?: string;
  /** Date (yyyy-mm-dd), set for all-day events. */
  date?: string;
  /** Time zone the event was created in. */
  timeZone?: string;
};

/**
 * Google event resource used by the website.
 */
export type GoogleCalendarEvent = {
  /** Event ID, unique within its calendar. */
  id: string;
  /** Either confirmed, tentative or cancelled. */
  status?: string;
  /** The event title. Missing when only free/busy information is shared. */
  summary?: string;
  /** The event description. */
  description?: string;
  /** Start of the event. */
  start: GoogleCalendarEventTime;
  /** End of the event (exclusive). */
  end: GoogleCalendarEventTime;
  /** Custom key-value pairs stored on the event. */
  extendedProperties?: {
    shared?: Record<string, string>;
    private?: Record<string, string>;
  };
};

/**
 * Error thrown when the Google Calendar API responds with an error.
 */
export class GoogleCalendarError extends Error {
  /**
   * @param message Description of the failed request.
   * @param status HTTP status code returned by Google.
   */
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "GoogleCalendarError";
  }
}

let tokenPromise: Promise<{ accessToken: string; expiresAt: number }> | null =
  null;

/**
 * Reads the service account from .env: GOOGLE_SERVICE_ACCOUNT_EMAIL and
 * GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY.
 *
 * @returns The email address and private key of the service account.
 */
function getCredentials() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(
    /\\n/g,
    "\n",
  );
  if (!email || !privateKey) {
    throw new Error(
      "Missing GOOGLE_SERVICE_ACCOUNT_EMAIL or GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY environment variable",
    );
  }
  return { email, privateKey };
}

/**
 * Exchanges a signed JWT for an OAuth access token, as described in
 * https://developers.google.com/identity/protocols/oauth2/service-account.
 *
 * @returns The access token and the moment it expires (ms since epoch).
 */
async function requestAccessToken() {
  const credentials = getCredentials();
  const issuedAt = Math.floor(Date.now() / 1000);

  const header = Buffer.from(
    JSON.stringify({ alg: "RS256", typ: "JWT" }),
  ).toString("base64url");
  const claims = Buffer.from(
    JSON.stringify({
      iss: credentials.email,
      scope: CALENDAR_SCOPE,
      aud: TOKEN_URL,
      iat: issuedAt,
      exp: issuedAt + 3600,
    }),
  ).toString("base64url");
  const signature = createSign("RSA-SHA256")
    .update(`${header}.${claims}`)
    .sign(credentials.privateKey, "base64url");

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: `${header}.${claims}.${signature}`,
    }),
    cache: "no-store",
  });

  if (!res.ok) {
    throw new GoogleCalendarError(
      `Could not obtain a Google access token: ${await res.text()}`,
      res.status,
    );
  }

  const data = await res.json();
  return {
    accessToken: data.access_token as string,
    expiresAt: Date.now() + Number(data.expires_in ?? 3600) * 1000,
  };
}

/**
 * Returns a valid access token, reusing the previous one until shortly before it expires.
 *
 * @returns OAuth access token for the Google Calendar API.
 */
async function getAccessToken() {
  if (tokenPromise) {
    try {
      const token = await tokenPromise;
      if (token.expiresAt - 60_000 > Date.now()) return token.accessToken;
    } catch {
      // Fall through and request a new token.
    }
  }

  tokenPromise = requestAccessToken();
  try {
    return (await tokenPromise).accessToken;
  } catch (error) {
    tokenPromise = null;
    throw error;
  }
}

/**
 * Performs an authenticated request to the Google Calendar API.
 *
 * @param apiPath The API path, relative to the calendar/v3 base URL.
 * @param init Optional fetch options.
 * @returns The response, which is guaranteed to be successful.
 */
async function calendarFetch(apiPath: string, init: RequestInit = {}) {
  const accessToken = await getAccessToken();
  const res = await fetch(`${CALENDAR_API_URL}${apiPath}`, {
    ...init,
    headers: {
      ...init.headers,
      Authorization: `Bearer ${accessToken}`,
    },
    cache: "no-store",
  });

  if (!res.ok) {
    throw new GoogleCalendarError(
      `Google Calendar request ${init.method ?? "GET"} ${apiPath} failed: ${await res.text()}`,
      res.status,
    );
  }

  return res;
}

/**
 * Builds the API path of a calendar's events collection.
 *
 * @param calendarId The Google calendar ID.
 * @returns The events API path.
 */
function eventsPath(calendarId: string) {
  return `/calendars/${encodeURIComponent(calendarId)}/events`;
}

/**
 * Lists all events of a calendar that overlap the given period.
 * Recurring events are expanded into their individual occurrences.
 *
 * @param calendarId The Google calendar ID.
 * @param timeMin Only events ending after this moment are returned.
 * @param timeMax Only events starting before this moment are returned.
 * @param filters Optional filters, e.g. sharedExtendedProperty in the form key=value.
 * @returns The events, ordered by start time.
 */
export async function listEvents(
  calendarId: string,
  timeMin: Date,
  timeMax: Date,
  filters: { sharedExtendedProperty?: string } = {},
): Promise<GoogleCalendarEvent[]> {
  const events: GoogleCalendarEvent[] = [];
  let pageToken: string | undefined;

  do {
    const params = new URLSearchParams({
      timeMin: timeMin.toISOString(),
      timeMax: timeMax.toISOString(),
      singleEvents: "true",
      orderBy: "startTime",
      maxResults: "250",
    });
    if (filters.sharedExtendedProperty) {
      params.set("sharedExtendedProperty", filters.sharedExtendedProperty);
    }
    if (pageToken) params.set("pageToken", pageToken);

    const res = await calendarFetch(`${eventsPath(calendarId)}?${params}`);
    const data = await res.json();
    events.push(...((data.items ?? []) as GoogleCalendarEvent[]));
    pageToken = data.nextPageToken;
  } while (pageToken);

  return events.filter((event) => event.status !== "cancelled");
}

/**
 * Retrieves a single event.
 *
 * @param calendarId The Google calendar ID.
 * @param eventId The event ID.
 * @returns The event, or null if it does not exist.
 */
export async function getEvent(
  calendarId: string,
  eventId: string,
): Promise<GoogleCalendarEvent | null> {
  try {
    const res = await calendarFetch(
      `${eventsPath(calendarId)}/${encodeURIComponent(eventId)}`,
    );
    return res.json();
  } catch (error) {
    if (
      error instanceof GoogleCalendarError &&
      (error.status === 404 || error.status === 410)
    ) {
      return null;
    }
    throw error;
  }
}

/**
 * Creates a new event.
 *
 * @param calendarId The Google calendar ID.
 * @param event The event to create.
 * @returns The created event.
 */
export async function insertEvent(
  calendarId: string,
  event: Omit<GoogleCalendarEvent, "id">,
): Promise<GoogleCalendarEvent> {
  const res = await calendarFetch(eventsPath(calendarId), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(event),
  });
  return res.json();
}

/**
 * Deletes an event.
 *
 * @param calendarId The Google calendar ID.
 * @param eventId The event ID.
 */
export async function deleteEvent(calendarId: string, eventId: string) {
  await calendarFetch(
    `${eventsPath(calendarId)}/${encodeURIComponent(eventId)}`,
    { method: "DELETE" },
  );
}
