import { NextResponse } from "next/server";

const STRAPI_API_URL = process.env.NEXT_PUBLIC_STRAPI_API_URL?.replace(
  /\/$/,
  "",
);

/**
 * Requests a password reset email from Strapi.
 */
export async function POST(request: Request) {
  const { email } = await request.json();

  const response = await fetch(`${STRAPI_API_URL}/api/auth/forgot-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });

  if (!response.ok) {
    console.error("Forgot password failed:", await response.text());
  }

  // Always report success so the form doesn't reveal which emails have accounts.
  return NextResponse.json({ ok: true });
}
