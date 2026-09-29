import { NextResponse } from "next/server";

const STRAPI_API_URL = process.env.NEXT_PUBLIC_STRAPI_API_URL?.replace(
  /\/$/,
  "",
);

/**
 * Sets a new password using the code from the reset email.
 */
export async function POST(request: Request) {
  const { code, password, passwordConfirmation } = await request.json();

  const response = await fetch(`${STRAPI_API_URL}/api/auth/reset-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code, password, passwordConfirmation }),
  });

  const data = await response.json();

  if (!response.ok) {
    return NextResponse.json(
      { message: data?.error?.message ?? "Could not reset your password." },
      { status: response.status },
    );
  }

  return NextResponse.json({ ok: true });
}
