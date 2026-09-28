import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/services/auth";

const STRAPI_API_URL = process.env.NEXT_PUBLIC_STRAPI_API_URL?.replace(
  /\/$/,
  "",
);

/**
 * Updates the authenticated user's course subscription.
 *
 * @param request Theincoming HTTP request containing subscription data.
 * @returns A JSON response containing the result from Strapi
 */
export async function PUT(request: Request) {
  const session = await getServerSession(authOptions);
  // A valid session with Strapi JWT is required to modify subscriptions.
  if (!session?.jwt)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();

  const res = await fetch(`${STRAPI_API_URL}/api/subscriptions/me`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.jwt}`,
    },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
