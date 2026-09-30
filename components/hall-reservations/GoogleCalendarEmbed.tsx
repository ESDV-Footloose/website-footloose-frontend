import { TIME_ZONE } from "@/services/hallReservations";

/**
 * A Google calendar shown in the embed.
 */
export type EmbeddedCalendar = {
  /** The Google calendar ID. The calendar must be public. */
  calendarId: string;
  /** Name shown in the legend. */
  label: string;
  /** Hex color of the events. */
  color: string;
};

/**
 * Properties of the Google Calendar embed.
 */
export type GoogleCalendarEmbedProps = {
  /** Title shown above the calendar. */
  title: string;
  /** The public Google calendars to show together. */
  calendars: EmbeddedCalendar[];
  /** Changes on every server render, so the calendar reloads after a reservation is made or removed. */
  version?: number;
};

/**
 * Shows public Google calendars combined in one week view, with a legend of their colors.
 *
 * @param googleCalendarEmbedProps Properties of the Google Calendar embed.
 * @returns The embedded calendar.
 */
export default function GoogleCalendarEmbed({
  title,
  calendars,
  version,
}: GoogleCalendarEmbedProps) {
  const params = new URLSearchParams({
    ctz: TIME_ZONE,
    // Matches the language of the website instead of the visitor's Google settings.
    hl: "en_GB",
    mode: "WEEK",
    // Weeks start on Monday.
    wkst: "2",
    showTitle: "0",
    showPrint: "0",
    showCalendars: "0",
    showTz: "0",
  });
  // Each color applies to the calendar added right before it.
  for (const calendar of calendars) {
    params.append("src", calendar.calendarId);
    params.append("color", calendar.color);
  }

  return (
    <section>
      <h2 className="text-3xl md:text-4xl font-semibold">{title}</h2>
      <ul className="mt-2 mb-4 flex flex-wrap gap-x-5 gap-y-1 text-sm text-neutral-600">
        {calendars.map((calendar) => (
          <li
            key={calendar.calendarId}
            className="inline-flex items-center gap-1.5"
          >
            <span
              className="h-3 w-3 rounded-sm"
              style={{ backgroundColor: calendar.color }}
            />
            {calendar.label}
          </li>
        ))}
      </ul>
      <iframe
        key={version}
        title={title}
        src={`https://calendar.google.com/calendar/embed?${params}`}
        loading="lazy"
        className="h-150 w-full border-0"
      />
    </section>
  );
}
