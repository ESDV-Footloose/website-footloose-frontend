import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";

import { authOptions } from "@/services/auth";
import {
  ReservationError,
  createReservation,
  deleteReservation,
  getReservationMember,
  type ReservationMember,
} from "@/services/hallReservations";

/**
 * Creates an error response in the same shape as Strapi errors.
 *
 * @param message Message that can be shown to the member.
 * @param status HTTP status code.
 * @returns The JSON error response.
 */
function errorResponse(message: string, status: number) {
  return NextResponse.json({ error: { message } }, { status });
}

/**
 * Runs a reservation action for the authenticated, approved member.
 *
 * @param request The incoming HTTP request with a JSON body.
 * @param action The action to perform with the request body and member.
 * @returns The JSON response.
 */
async function handle(
  request: Request,
  action: (body: unknown, member: ReservationMember) => Promise<unknown>,
) {
  const session = await getServerSession(authOptions);
  // A valid session with Strapi JWT is required to manage reservations.
  if (!session?.jwt) return errorResponse("Unauthorized", 401);

  const member = await getReservationMember(session.jwt);
  if (!member) return errorResponse("Unauthorized", 401);
  if (!member.approved) {
    return errorResponse("Only approved members can reserve a hall.", 403);
  }

  // Requiring JSON prevents other sites from submitting plain HTML forms to this route.
  if (!request.headers.get("content-type")?.includes("application/json")) {
    return errorResponse("Invalid request.", 415);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse("Invalid request.", 400);
  }

  try {
    const data = await action(body, member);
    return NextResponse.json({ data: data ?? null });
  } catch (error) {
    if (error instanceof ReservationError) {
      return errorResponse(error.message, error.status);
    }
    console.error("Hall reservation request failed:", error);
    return errorResponse(
      "There was an unexpected error, please try again later.",
      502,
    );
  }
}

/**
 * Reserves a hall for the authenticated member.
 *
 * @param request The incoming HTTP request containing the reservation.
 * @returns A JSON response containing the created reservation.
 */
export async function POST(request: Request) {
  return handle(request, (body, member) =>
    createReservation(body, member, new Date()),
  );
}

/**
 * Removes one of the authenticated member's reservations.
 *
 * @param request The incoming HTTP request containing the hall key and event ID.
 * @returns An empty JSON response.
 */
export async function DELETE(request: Request) {
  return handle(request, (body, member) =>
    deleteReservation(body, member, new Date()),
  );
}
