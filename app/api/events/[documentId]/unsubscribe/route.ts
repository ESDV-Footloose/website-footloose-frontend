import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/services/auth";

const STRAPI_API_URL = process.env.NEXT_PUBLIC_STRAPI_API_URL?.replace(
  /\/$/,
  "",
);

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ documentId: string }> },
) {
  const { documentId } = await params;

  const session = await getServerSession(authOptions);
  if (!session?.jwt)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const res = await fetch(
    `${STRAPI_API_URL}/api/events/${documentId}/unsubscribe`,
    { method: "POST", headers: { Authorization: `Bearer ${session.jwt}` } },
  );
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
