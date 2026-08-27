import type { Metadata } from "next";
import Link from "next/link";
import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { FiAlertCircle, FiFileText } from "react-icons/fi";

import { authOptions } from "@/services/auth";
import CourseSubscriptionForm from "./CourseSubscriptionForm";

const STRAPI_API_URL = process.env.NEXT_PUBLIC_STRAPI_API_URL?.replace(
  /\/$/,
  "",
);

export const metadata: Metadata = {
  title: "Course Subscriptions | ESDV Footloose",
  description: "Register for dance courses this semester.",
};

async function strapiFetch(path: string, jwt: string) {
  const res = await fetch(`${STRAPI_API_URL}/api/${path}`, {
    headers: { Authorization: `Bearer ${jwt}` },
    cache: "no-store",
  });
  if (!res.ok) return null;
  return res.json();
}

export default async function CourseSubscriptionPage() {
  const session = await getServerSession(authOptions);
  if (!session?.jwt) redirect("/login");

  const userData = await strapiFetch("users/me", session.jwt);
  if (!userData) redirect("/login");
  if (!userData.approved) redirect("/membership");

  const stateRes = await strapiFetch("subscriptions/me", session.jwt);

  if (!stateRes) {
    return (
      <main className="min-h-screen bg-slate-50/50 px-4 pb-16 pt-24 sm:pt-28 flex items-center justify-center">
        <div className="max-w-lg w-full rounded-3xl bg-white p-8 shadow-xl shadow-slate-200/50 border border-slate-100 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
            <FiAlertCircle className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">
            Something went wrong
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            We couldn&apos;t load your course subscriptions. Try again shortly.
          </p>
        </div>
      </main>
    );
  }

  const state = stateRes.data;
  const semester = state.semester;

  if (!semester) {
    return (
      <main className="min-h-screen bg-slate-50/50 px-4 pb-16 pt-24 sm:pt-28 flex items-center justify-center">
        <div className="max-w-lg w-full rounded-3xl bg-white p-8 shadow-xl shadow-slate-200/50 border border-slate-100 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
            <FiAlertCircle className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">
            Registration isn&apos;t open right now
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            There&apos;s no active semester open for course registration at the
            moment. Check back later.
          </p>
        </div>
      </main>
    );
  }

  const deadline = new Date(semester.registrationDeadline);

  return (
    <main className="min-h-screen bg-slate-50/50 px-4 pb-16 pt-24 sm:pt-28">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="relative overflow-hidden rounded-3xl bg-white p-6 sm:p-8 shadow-xl shadow-slate-200/50 border border-slate-100 space-y-5">
          <div className="absolute top-0 left-0 right-0 h-2 bg-footloose" />

          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
              Course Subscriptions
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              {semester.name} &middot; registration{" "}
              {state.isEditable ? "closes" : "closed"}{" "}
              {new Intl.DateTimeFormat("en-UK", {
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              }).format(deadline)}
            </p>
          </div>

          {state.isEditable && (
            <>
              <div className="relative border-t-2 border-dashed border-slate-200">
                <span className="absolute -left-2.5 -top-2.5 h-5 w-5 rounded-full bg-slate-50/50" />
                <span className="absolute -right-2.5 -top-2.5 h-5 w-5 rounded-full bg-slate-50/50" />
              </div>

              <div className="flex items-start gap-4 p-5 rounded-2xl bg-amber-50/70 border border-amber-200">
                <FiAlertCircle className="mt-0.5 h-6 w-6 shrink-0 text-amber-600" />
                <p className="text-sm text-amber-800 leading-relaxed">
                  In case there are more subscriptions for a dance course than
                  available places, places are assigned via lottery.{" "}
                  {state.isActiveMember ? (
                    <>
                      As an active member, you receive priority for one level
                      per dance style.
                    </>
                  ) : (
                    <>
                      Only active members receive priority for dance courses.{" "}
                      <Link href="/active" className="underline font-medium">
                        Learn more about active membership
                      </Link>
                      .
                    </>
                  )}
                </p>
              </div>

              <Link
                href="/association-documents"
                className="inline-flex items-center gap-2 text-sm font-semibold text-footloose"
              >
                <FiFileText className="h-5 w-5" />
                Read the registration &amp; lottery policy
              </Link>
            </>
          )}
        </div>

        <CourseSubscriptionForm
          courses={state.courses}
          isActiveMember={state.isActiveMember}
          isEditable={state.isEditable}
          subscription={state.subscription}
        />
      </div>
    </main>
  );
}
