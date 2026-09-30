import Link from "next/link";
import { getServerSession } from "next-auth/next";

import Container from "@/components/containers/Container";
import GoogleCalendarEmbed from "@/components/hall-reservations/GoogleCalendarEmbed";
import ReservationForm from "@/components/hall-reservations/ReservationForm";
import UpcomingReservations from "@/components/hall-reservations/UpcomingReservations";
import { authOptions } from "@/services/auth";
import {
  RESERVATION_LIMITS,
  getOwnReservations,
  getReservationHallOptions,
  getReservationMember,
  getStartInputRange,
} from "@/services/hallReservations";
import type { StrapiHall } from "@/services/strapi";

/**
 * Properties of the hall reservations component.
 */
export type HallReservationsProps = {
  /** The halls as configured in Strapi. */
  halls: StrapiHall[];
  /** Slug of the page the component is on, used to look up the halls when reserving. */
  pageSlug: string;
  /** ID of this component in Strapi, used to look up the halls when reserving. */
  sectionId: number;
};

/**
 * Shows the calendar of the halls next to the reservation form and the member's reservations.
 * Visitors who are not logged in, or whose membership is not approved yet, only see a notice.
 *
 * @param hallReservationsProps Properties of the hall reservations component.
 * @returns The hall reservations component, or nothing if no halls are configured.
 */
export default async function HallReservations({
  halls,
  pageSlug,
  sectionId,
}: HallReservationsProps) {
  if (halls.length === 0) return null;

  const session = await getServerSession(authOptions);
  const member = session?.jwt ? await getReservationMember(session.jwt) : null;

  if (!member?.approved) {
    return (
      <Container>
        <p className="border-l-4 border-footloose bg-neutral-100 px-4 py-3">
          Only members can reserve a hall and see the reservations.{" "}
          {member ? (
            <>
              You can once the board has approved your membership.{" "}
              <Link href="/membership" className="underline text-footloose">
                View your membership
              </Link>
              .
            </>
          ) : (
            <>
              Please{" "}
              <Link href="/login" className="underline text-footloose">
                log in
              </Link>{" "}
              first.
            </>
          )}
        </p>
      </Container>
    );
  }

  const now = new Date();
  const startRange = getStartInputRange(now);
  const ownReservations = await getOwnReservations(halls, member.id, now);

  return (
    <Container>
      <div className="grid grid-cols-1 gap-12 lg:grid-cols-3">
        <div className="min-w-0 lg:col-span-2">
          <GoogleCalendarEmbed
            title="Calendar"
            calendars={halls.flatMap((hall) => [
              {
                calendarId: hall.confirmedCalendarId,
                label: hall.name,
                color: hall.confirmedColor,
              },
              {
                calendarId: hall.pendingCalendarId,
                label: `${hall.name} (members)`,
                color: hall.pendingColor,
              },
            ])}
            version={now.getTime()}
          />
        </div>
        <div className="space-y-12">
          <ReservationForm
            pageSlug={pageSlug}
            sectionId={sectionId}
            halls={getReservationHallOptions(halls)}
            hasKeyAccess={member.keyAccess}
            keyAccessEmail="secretary@esdvfootloose.nl"
            minStart={startRange.min}
            maxStart={startRange.max}
            maxDurationMinutes={RESERVATION_LIMITS.maxDurationMinutes}
            maxReasonLength={RESERVATION_LIMITS.maxReasonLength}
          />
          <UpcomingReservations
            pageSlug={pageSlug}
            sectionId={sectionId}
            reservations={ownReservations}
          />
        </div>
      </div>
    </Container>
  );
}
