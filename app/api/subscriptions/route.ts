import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/services/auth";

const STRAPI_API_URL = process.env.NEXT_PUBLIC_STRAPI_API_URL?.replace(
  /\/$/,
  "",
);

export async function PUT(request: Request) {
  const session = await getServerSession(authOptions);
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
