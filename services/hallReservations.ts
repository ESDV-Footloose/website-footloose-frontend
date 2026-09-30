import "server-only";

import {
  deleteEvent,
  getEvent,
  insertEvent,
  listEvents,
  type GoogleCalendarEvent,
} from "@/services/googleCalendar";
import { getPage, type StrapiHall } from "@/services/strapi";

const STRAPI_API_URL = process.env.NEXT_PUBLIC_STRAPI_API_URL?.replace(
  /\/$/,
  "",
);

/** The time zone of the website. */
export const TIME_ZONE = "Europe/Amsterdam";

/** Limits that apply to every reservation (max duration, Luna opening hours). Times are in minutes after midnight. */
export const RESERVATION_LIMITS = {
  maxDurationMinutes: 180,
  maxDaysAhead: 7,
  quietHoursStartMinutes: 2 * 60,
  quietHoursEndMinutes: 7 * 60,
  maxReasonLength: 100,
} as const;

/** Extended event property that stores which Strapi user made a reservation. */
const OWNER_PROPERTY = "strapiUserId";

/** The weekdays, in ISO order (1 = Monday). */
const WEEKDAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

/** Error with a message that can be shown to the member. */
export class ReservationError extends Error {
  constructor(
    message: string,
    public readonly status = 400,
  ) {
    super(message);
  }
}

/** The member making or managing reservations. */
export type ReservationMember = {
  /** Strapi user ID. */
  id: number;
  /** Name shown on reservations, e.g. John D. */
  name: string;
  approved: boolean;
  keyAccess: boolean;
};

/** An upcoming reservation of the current member. */
export type OwnReservation = {
  eventId: string;
  hallName: string;
  title: string;
  /** Formatted period, e.g. Tue 29 Sept, 19:30–21:00. */
  period: string;
  /** ISO timestamp of the start. */
  start: string;
  /** Whether the reservation is in the members' calendar (pendingCalendarId), rather than the board's. */
  pending: boolean;
};

/** Hall option in the reservation form. */
export type ReservationHallOption = {
  name: string;
  /** The note of the hall, or else a summary of its restrictions. */
  description: string | null;
};

/* Amsterdam time */

const wallClockFormat = new Intl.DateTimeFormat("en-GB", {
  timeZone: TIME_ZONE,
  weekday: "long",
  year: "numeric",
  month: "numeric",
  day: "numeric",
  hour: "numeric",
  minute: "numeric",
  second: "numeric",
  hourCycle: "h23",
});
const inputFormat = new Intl.DateTimeFormat("sv-SE", {
  timeZone: TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});
const periodFormat = new Intl.DateTimeFormat("en-GB", {
  timeZone: TIME_ZONE,
  weekday: "short",
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

/**
 * Converts a moment to Amsterdam date and time.
 *
 * @param date The moment to convert.
 * @returns The Amsterdam date and time, with the ISO weekday (1 = Monday).
 */
function toWallClock(date: Date) {
  const parts = Object.fromEntries(
    wallClockFormat.formatToParts(date).map((p) => [p.type, p.value]),
  );
  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: Number(parts.hour),
    minute: Number(parts.minute),
    second: Number(parts.second),
    weekday: WEEKDAYS.indexOf(parts.weekday) + 1,
  };
}

/**
 * Converts an Amsterdam date and time to a moment. Values out of range roll over.
 *
 * @returns The corresponding moment.
 */
function fromWallClock(
  year: number,
  month: number,
  day: number,
  hour = 0,
  minute = 0,
) {
  // How far Amsterdam is ahead of UTC at a moment.
  const offset = (time: number) => {
    const w = toWallClock(new Date(time));
    const wallAsUtc = Date.UTC(
      w.year,
      w.month - 1,
      w.day,
      w.hour,
      w.minute,
      w.second,
    );
    return wallAsUtc - Math.floor(time / 1000) * 1000;
  };
  const naive = Date.UTC(year, month - 1, day, hour, minute);
  // Correct the first guess, since the offset can change around a DST switch.
  return new Date(naive - offset(naive - offset(naive)));
}

/** Formats a moment as the value of a datetime-local input (yyyy-mm-ddThh:mm) in Amsterdam time. */
function toInputValue(date: Date) {
  return inputFormat.format(date).replace(" ", "T");
}

/**
 * Parses the value of a datetime-local input as Amsterdam time.
 *
 * @returns The moment, or null if the value is invalid.
 */
function parseInputValue(value: string) {
  const match =
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::\d{2}(?:\.\d+)?)?$/.exec(
      value,
    );
  if (!match) return null;
  const [year, month, day, hour, minute] = match.slice(1).map(Number);
  const date = fromWallClock(year, month, day, hour, minute);
  // Values such as 31 February or 10:60 roll over, so they don't survive the round trip.
  return toInputValue(date) === value.slice(0, 16) ? date : null;
}

/** Formats a period, e.g. Tue 29 Sept, 19:30–21:00. */
function formatPeriod(start: Date, end: Date) {
  return periodFormat.formatRange(start, end);
}

/** Returns the latest moment a reservation may start: the same time, a week from now. */
function getLatestStart(now: Date) {
  const w = toWallClock(now);
  return fromWallClock(
    w.year,
    w.month,
    w.day + RESERVATION_LIMITS.maxDaysAhead,
    w.hour,
    w.minute,
  );
}

/**
 * Returns the earliest and latest start the reservation form accepts.
 *
 * @param now The current moment.
 * @returns The earliest and latest start, formatted as the value of a datetime-local input.
 */
export function getStartInputRange(now: Date) {
  return { min: toInputValue(now), max: toInputValue(getLatestStart(now)) };
}

/* Hall rules */

/** Returns the ISO weekdays (1 = Monday) on which a reservation in the hall may start. */
function openWeekdays(hall: StrapiHall) {
  const daysOpen = hall.daysOpen as Record<string, boolean> | null;
  return WEEKDAYS.flatMap((day, i) =>
    !daysOpen || daysOpen[day.toLowerCase()] ? [i + 1] : [],
  );
}

/** Returns the earliest start of a reservation in the hall, in minutes after midnight. */
function earliestStart(hall: StrapiHall) {
  const [hours, minutes] = (hall.earliestStartTime ?? "00:00")
    .split(":")
    .map(Number);
  return hours * 60 + minutes;
}

/** Formats minutes after midnight as a time, e.g. 18:00. */
function formatMinutes(minutes: number) {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`;
}

/**
 * Describes when a hall can be reserved, e.g. "from Monday until Thursday, from 18:00".
 *
 * @returns The description, or null if the hall has no restrictions.
 */
function describeRestrictions(hall: StrapiHall) {
  const days = openWeekdays(hall);
  const names = days.map((day) => WEEKDAYS[day - 1]);
  const parts: string[] = [];
  if (days.length < 7) {
    const isRange =
      days.length > 2 && days[days.length - 1] - days[0] === days.length - 1;
    parts.push(
      isRange
        ? `from ${names[0]} until ${names[names.length - 1]}`
        : `on ${new Intl.ListFormat("en-GB").format(names)}`,
    );
  }
  if (earliestStart(hall) > 0)
    parts.push(`from ${formatMinutes(earliestStart(hall))}`);
  return parts.length > 0 ? parts.join(", ") : null;
}

/**
 * Returns the halls members can choose from in the reservation form.
 *
 * @param halls The halls of the hall reservation component.
 * @returns The hall options.
 */
export function getReservationHallOptions(
  halls: StrapiHall[],
): ReservationHallOption[] {
  return halls.map((hall) => {
    const restrictions = describeRestrictions(hall);
    const description =
      openWeekdays(hall).length === 0
        ? "Cannot be reserved at the moment"
        : restrictions && `Only ${restrictions}`;
    return { name: hall.name, description: hall.note?.trim() || description };
  });
}

/**
 * Checks a reservation against the general limits and the rules of the hall.
 *
 * @returns A message describing the violated rule, or null if the reservation is allowed.
 */
function checkRules(
  hall: StrapiHall,
  start: Date,
  durationMinutes: number,
  now: Date,
) {
  const limits = RESERVATION_LIMITS;
  const local = toWallClock(start);
  const startMinutes = local.hour * 60 + local.minute;
  // A reservation may last into the next day, so check the quiet hours of both days.
  const inQuietHours = [0, 24 * 60].some(
    (dayOffset) =>
      startMinutes < limits.quietHoursEndMinutes + dayOffset &&
      startMinutes + durationMinutes >
        limits.quietHoursStartMinutes + dayOffset,
  );

  if (durationMinutes <= 0)
    return "Please choose how long you want to reserve the hall.";
  if (durationMinutes > limits.maxDurationMinutes) {
    return `You cannot reserve a hall for longer than ${limits.maxDurationMinutes / 60} hours.`;
  }
  if (start < now) return "You cannot reserve a hall in the past.";
  if (start > getLatestStart(now)) {
    return "You cannot reserve a hall more than one week in advance.";
  }
  if (inQuietHours) {
    return `You cannot reserve a hall between ${formatMinutes(limits.quietHoursStartMinutes)} and ${formatMinutes(limits.quietHoursEndMinutes)}.`;
  }
  if (openWeekdays(hall).length === 0)
    return `${hall.name} cannot be reserved at the moment.`;
  if (
    !openWeekdays(hall).includes(local.weekday) ||
    startMinutes < earliestStart(hall)
  ) {
    return `${hall.name} can only be reserved ${describeRestrictions(hall)}.`;
  }
  return null;
}

/* Reservations */

/** Returns the request body as an object, so its fields can be validated. */
function toRecord(body: unknown) {
  return (typeof body === "object" && body !== null ? body : {}) as Record<
    string,
    unknown
  >;
}

/**
 * Finds the requested hall in its hall reservation component on the published page.
 * Halls are always looked up here, so the browser cannot choose which calendars are used.
 *
 * @param input The request body, containing the page slug, component ID and hall name.
 * @returns The hall, or undefined if it does not exist.
 */
async function findHall(input: Record<string, unknown>) {
  const { page, section, hall } = input;
  if (
    typeof page !== "string" ||
    !page ||
    page.length > 200 ||
    !Number.isInteger(section)
  ) {
    return undefined;
  }
  const component = (await getPage(page))?.pageSections.find(
    (s) => s.__component === "page.hall-reservation" && s.id === section,
  );
  return component?.__component === "page.hall-reservation"
    ? component.hall.find((h) => h.name === hall)
    : undefined;
}

/** Returns the members' and the board's calendar of a hall. */
function hallCalendars(hall: StrapiHall) {
  return [
    { calendarId: hall.pendingCalendarId, pending: true },
    { calendarId: hall.confirmedCalendarId, pending: false },
  ];
}

/** Checks whether the member made a reservation. */
function isOwnedBy(event: GoogleCalendarEvent, memberId: number) {
  return (
    event.extendedProperties?.shared?.[OWNER_PROPERTY] === String(memberId)
  );
}

/** Converts the start or end of a Google event to a moment. */
function eventTime(time: GoogleCalendarEvent["start"]) {
  return new Date(time.dateTime ?? time.date ?? "");
}

/**
 * Retrieves the current member from Strapi.
 *
 * @param jwt The member's Strapi JWT.
 * @returns The member, or null if the request fails.
 */
export async function getReservationMember(
  jwt: string,
): Promise<ReservationMember | null> {
  const res = await fetch(`${STRAPI_API_URL}/api/users/me`, {
    headers: { Authorization: `Bearer ${jwt}` },
    cache: "no-store",
  });
  if (!res.ok) return null;

  const user = await res.json();
  const firstName = String(user.firstName ?? "").trim();
  const lastName = String(user.lastName ?? "").trim();
  return {
    id: Number(user.id),
    name:
      [firstName, lastName ? `${lastName[0]}.` : ""]
        .filter(Boolean)
        .join(" ") || String(user.username),
    approved: Boolean(user.approved),
    // Only an explicit true grants key access.
    keyAccess: user.keyAccess === true,
  };
}

/**
 * Loads the member's reservations that have not ended yet, from both calendars of every hall.
 *
 * @param halls The halls to load the reservations of.
 * @param memberId The Strapi user ID of the member.
 * @param now The current moment.
 * @returns The reservations, ordered by start, or null if they could not be loaded.
 */
export async function getOwnReservations(
  halls: StrapiHall[],
  memberId: number,
  now: Date,
): Promise<OwnReservation[] | null> {
  // Reservations cannot start later than the latest allowed start.
  const timeMax = new Date(getLatestStart(now).getTime() + 60_000);
  try {
    const perCalendar = await Promise.all(
      halls.flatMap((hall) =>
        hallCalendars(hall).map(async ({ calendarId, pending }) => {
          const events = await listEvents(calendarId, now, timeMax, {
            sharedExtendedProperty: `${OWNER_PROPERTY}=${memberId}`,
          });
          return events
            .filter((event) => isOwnedBy(event, memberId))
            .map((event) => ({
              eventId: event.id,
              hallName: hall.name,
              title: event.summary?.trim() || hall.name,
              period: formatPeriod(
                eventTime(event.start),
                eventTime(event.end),
              ),
              start: eventTime(event.start).toISOString(),
              pending,
            }));
        }),
      ),
    );
    // ISO timestamps in UTC sort chronologically.
    return perCalendar.flat().sort((a, b) => a.start.localeCompare(b.start));
  } catch (error) {
    console.error("Could not load the member's reservations:", error);
    return null;
  }
}

/**
 * Validates a reservation request and adds the reservation to the members' calendar of the hall.
 *
 * @param body The request body sent by the reservation form.
 * @param member The member making the reservation.
 * @param now The current moment.
 * @returns The created reservation.
 * @throws ReservationError when the request is invalid or the hall is unavailable.
 */
export async function createReservation(
  body: unknown,
  member: ReservationMember,
  now: Date,
): Promise<OwnReservation> {
  if (!member.keyAccess) {
    throw new ReservationError(
      `You need key access to reserve a hall. You can request it at secretary@esdvfootloose.nl.`,
      403,
    );
  }

  const input = toRecord(body);
  const hall = await findHall(input);
  if (!hall) throw new ReservationError("Please select a hall.");

  const reason =
    typeof input.reason === "string"
      ? input.reason.replace(/\s+/g, " ").trim()
      : "";
  if (reason.length > RESERVATION_LIMITS.maxReasonLength) {
    throw new ReservationError(
      `The reason can be at most ${RESERVATION_LIMITS.maxReasonLength} characters long.`,
    );
  }

  const start =
    typeof input.start === "string" ? parseInputValue(input.start) : null;
  if (!start)
    throw new ReservationError("Please select a valid date and time.");

  const { hours, minutes } = input;
  const durationMinutes =
    typeof hours === "number" && typeof minutes === "number"
      ? hours * 60 + minutes
      : NaN;
  if (!Number.isInteger(durationMinutes)) {
    throw new ReservationError("Please select a valid duration.");
  }

  const violation = checkRules(hall, start, durationMinutes, now);
  if (violation) throw new ReservationError(violation);

  // Events in both the members' and the board's calendar block the hall.
  const end = new Date(start.getTime() + durationMinutes * 60_000);
  const conflicts = await Promise.all(
    hallCalendars(hall).map(({ calendarId }) =>
      listEvents(calendarId, start, end),
    ),
  );
  if (conflicts.some((events) => events.length > 0)) {
    throw new ReservationError(
      `${hall.name} is already occupied at that time.`,
      409,
    );
  }

  const title = reason ? `${member.name} (${reason})` : member.name;
  const event = await insertEvent(hall.pendingCalendarId, {
    summary: title,
    description: `A reservation from ${member.name}`,
    start: { dateTime: start.toISOString(), timeZone: TIME_ZONE },
    end: { dateTime: end.toISOString(), timeZone: TIME_ZONE },
    extendedProperties: { shared: { [OWNER_PROPERTY]: String(member.id) } },
  });

  return {
    eventId: event.id,
    hallName: hall.name,
    title,
    period: formatPeriod(start, end),
    start: start.toISOString(),
    pending: true,
  };
}

/**
 * Removes one of the member's upcoming reservations.
 *
 * @param body The request body, containing the page slug, component ID, hall name, whether the reservation is in the members' calendar, and the event ID.
 * @param member The member removing the reservation.
 * @param now The current moment.
 * @throws ReservationError when the reservation does not exist or cannot be removed.
 */
export async function deleteReservation(
  body: unknown,
  member: ReservationMember,
  now: Date,
) {
  const input = toRecord(body);
  const { pending, eventId } = input;
  if (
    typeof pending !== "boolean" ||
    typeof eventId !== "string" ||
    !/^[\w-]{1,1024}$/.test(eventId)
  ) {
    throw new ReservationError("Reservation not found.", 404);
  }
  const hall = await findHall(input);
  if (!hall) throw new ReservationError("Reservation not found.", 404);

  const calendarId = pending
    ? hall.pendingCalendarId
    : hall.confirmedCalendarId;
  const event = await getEvent(calendarId, eventId);
  // Members can only remove their own reservations.
  if (!event || event.status === "cancelled" || !isOwnedBy(event, member.id)) {
    throw new ReservationError("Reservation not found.", 404);
  }
  if (eventTime(event.end) <= now) {
    throw new ReservationError("This reservation has already ended.");
  }

  await deleteEvent(calendarId, eventId);
}
