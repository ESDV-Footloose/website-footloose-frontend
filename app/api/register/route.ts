import { NextResponse } from "next/server";

const STRAPI_API_URL = process.env.NEXT_PUBLIC_STRAPI_API_URL?.replace(
  /\/$/,
  "",
);

if (!STRAPI_API_URL) {
  throw new Error("Missing NEXT_PUBLIC_STRAPI_API_URL environment variable");
}

/**
 * Handles member registration by forwarding the request to Strapi.
 *
 * @param request Incoming registration request.
 * @returns The registration result.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();

    const response = await fetch(`${STRAPI_API_URL}/api/auth/local/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: body.username,
        email: body.email,
        password: body.password,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        {
          message:
            data?.error?.message ??
            "Something went wrong while creating your account.",
        },
        {
          status: response.status,
        },
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Registration failed:", error);

    return NextResponse.json(
      {
        message: "Something went wrong while creating your account.",
      },
      {
        status: 500,
      },
    );
  }
}
