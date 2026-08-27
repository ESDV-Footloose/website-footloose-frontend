import type { Metadata } from "next";
import Link from "next/link";
import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import {
  FiClock,
  FiUser,
  FiMail,
  FiPhone,
  FiBookOpen,
  FiCalendar,
  FiCheckCircle,
  FiXCircle,
  FiAward,
  FiArrowRight,
  FiHash,
  FiCompass,
  FiStar,
  FiLock,
} from "react-icons/fi";

import { authOptions } from "@/services/auth";
import SignOutLink from "@/components/auth/SignOutLink";

const STRAPI_API_URL = process.env.NEXT_PUBLIC_STRAPI_API_URL?.replace(
  /\/$/,
  "",
);

export const metadata: Metadata = {
  title: "Membership | ESDV Footloose",
  description: "Your ESDV Footloose membership status.",
};

async function getCurrentStrapiUser(jwt: string) {
  const response = await fetch(`${STRAPI_API_URL}/api/users/me`, {
    headers: { Authorization: `Bearer ${jwt}` },
    cache: "no-store",
  });

  if (!response.ok) {
    return null;
  }

  return response.json();
}

async function getSubscriptionState(jwt: string) {
  const response = await fetch(`${STRAPI_API_URL}/api/subscriptions/me`, {
    headers: { Authorization: `Bearer ${jwt}` },
    cache: "no-store",
  });

  if (!response.ok) {
    return null;
  }

  return response.json();
}

/** Formats dates nicely */
function formatDate(dateString?: string) {
  if (!dateString) return undefined;
  try {
    return new Intl.DateTimeFormat("en-UK", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(new Date(dateString));
  } catch {
    return dateString;
  }
}

export default async function MembershipPage() {
  const session = await getServerSession(authOptions);

  if (!session?.jwt) {
    redirect("/login");
  }

  const user = await getCurrentStrapiUser(session.jwt);

  if (!user) {
    redirect("/login");
  }

  /**
   * Pending users waiting for approval.
   */
  if (!user.approved) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 pb-16 pt-28 flex items-center justify-center">
        <div className="w-full max-w-lg">
          <div className="overflow-hidden rounded-3xl bg-white shadow-xl shadow-slate-200/50 border border-slate-100">
            <div className="h-3 bg-linear-to-r from-amber-400 to-amber-500" />

            <div className="p-8 sm:p-10 text-center">
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 ring-8 ring-amber-50/50">
                <FiClock className="h-10 w-10 stroke-[1.75]" />
              </div>

              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 ring-1 ring-inset ring-amber-600/20">
                Pending board approval
              </span>

              <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-900">
                Awaiting approval
              </h1>

              <p className="mt-3 text-base text-slate-700 leading-relaxed">
                Hi{" "}
                <span className="font-semibold text-slate-900">
                  {user.firstName ?? user.username}
                </span>
                , your account has been created! The Footloose board is
                currently reviewing your application. You&apos;ll get full
                access as soon as you are verified.
              </p>

              <div className="mt-8 rounded-2xl bg-slate-50 p-4 border border-slate-200 text-left flex items-start gap-3">
                <p className="text-xs text-slate-600 leading-normal">
                  Questions about your membership? Reach out to the board or
                  check back later.
                </p>
              </div>

              <div className="mt-8 pt-6 border-t border-slate-200 flex justify-center">
                <SignOutLink />
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  /**
   * Approved users: membership page
   */
  const isActiveMember = Boolean(user.activeMember);
  const isStudent = user.studyInstitutionEnum !== "Not a student";
  const fullName =
    `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || user.username;
  const initials =
    `${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}`.toUpperCase() ||
    user.username?.[0]?.toUpperCase() ||
    "?";

  const subscriptionRes = await getSubscriptionState(session.jwt);
  const subState = subscriptionRes?.data ?? null;
  const semester = subState?.semester ?? null;
  const subscription = subState?.subscription ?? null;
  const isSubEditable = subState?.isEditable ?? false;

  const registrationDeadline = semester?.registrationDeadline
    ? new Date(semester.registrationDeadline)
    : null;

  const isRegistrationOpen =
    registrationDeadline !== null && registrationDeadline > new Date();
  const selectedCourses = subscription
    ? (subState.courses ?? []).filter((c: any) =>
        subscription.courseIds.includes(c.documentId),
      )
    : [];

  return (
    <main className="min-h-screen bg-slate-50/50 px-4 pb-16 pt-24 sm:pt-28">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Profile Header */}
        <div className="relative overflow-hidden rounded-3xl bg-white p-6 sm:p-8 shadow-xl shadow-slate-200/50 border border-slate-100">
          <div className="absolute top-0 left-0 right-0 h-2 bg-footloose" />

          <div className="flex flex-col sm:flex-row sm:items-center gap-6">
            <div className="flex items-center gap-5 flex-1 min-w-0">
              <div className="flex h-16 w-16 sm:h-20 sm:w-20 shrink-0 items-center justify-center rounded-2xl bg-footloose/10 text-2xl sm:text-3xl font-bold text-footloose">
                {initials}
              </div>

              <div className="min-w-0">
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight truncate">
                  {fullName}
                </h1>
                <p className="text-sm font-medium text-slate-600 truncate">
                  {user.email}
                </p>
              </div>
            </div>

            <div className="flex sm:flex-col items-center sm:items-end gap-3 shrink-0">
              {isActiveMember ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                  <FiCheckCircle className="h-4 w-4" />
                  Active Member
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 ring-1 ring-inset ring-slate-300">
                  <FiXCircle className="h-4 w-4" />
                  Not an Active Member
                </span>
              )}

              <div className="hidden sm:block">
                <SignOutLink />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          <div className="lg:col-span-2 space-y-6">
            <SectionCard title="Personal Details" icon={<FiUser />}>
              <DetailTile
                icon={<FiUser />}
                label="Full Name"
                value={fullName}
              />
              <DetailTile
                icon={<FiMail />}
                label="Email Address"
                value={user.email}
              />
              <DetailTile
                icon={<FiCalendar />}
                label="Date of Birth"
                value={formatDate(user.dateOfBirth)}
              />
              <DetailTile
                icon={<FiPhone />}
                label="Phone Number"
                value={user.phoneNumber}
              />
            </SectionCard>

            <SectionCard title="Institution Details" icon={<FiBookOpen />}>
              <DetailTile
                icon={<FiBookOpen />}
                label="Institution"
                value={user.studyInstitutionEnum}
              />

              {isStudent ? (
                <DetailTile
                  icon={<FiMail />}
                  label="Academic Email"
                  value={user.studentEmail}
                />
              ) : (
                <>
                  <DetailTile
                    icon={<FiCalendar />}
                    label="Graduation Year"
                    value={
                      user.graduationYear
                        ? String(user.graduationYear)
                        : undefined
                    }
                  />
                  {user.motivationNotStudent && (
                    <div className="sm:col-span-2 flex items-start gap-3.5 p-4 rounded-2xl bg-slate-50/70 border border-slate-200">
                      <div className="mt-0.5 text-footloose shrink-0 text-lg">
                        <FiHash />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                          Motivation
                        </p>
                        <p className="mt-0.5 text-sm font-medium text-slate-700">
                          {user.motivationNotStudent}
                        </p>
                      </div>
                    </div>
                  )}
                </>
              )}
            </SectionCard>
          </div>

          <div className="space-y-6">
            {/* Active member card */}
            <div className="overflow-hidden rounded-3xl bg-white shadow-xl shadow-slate-200/50 border border-slate-100">
              <div className="p-6">
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-4">
                  Membership Status
                </h2>

                {isActiveMember ? (
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                      <FiAward className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        You&apos;re an active member
                      </p>
                      <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                        Thanks for helping organize events, give workshops, or
                        doing other committee work for Footloose.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-footloose/10 text-footloose">
                      <FiAward className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        Become an active member
                      </p>
                      <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                        Join a committee and help organize events, workshops,
                        and more, and get priority access to our dance classes.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="relative border-t-2 border-dashed border-slate-200">
                <span className="absolute -left-2.5 -top-2.5 h-5 w-5 rounded-full bg-slate-50/50" />
                <span className="absolute -right-2.5 -top-2.5 h-5 w-5 rounded-full bg-slate-50/50" />
              </div>

              <div className="p-6 pt-5 space-y-4">
                {isActiveMember ? (
                  <Link
                    href="/active"
                    className="group flex items-center justify-between text-sm font-semibold text-footloose"
                  >
                    View active member details
                    <FiArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                ) : (
                  <Link
                    href="/active"
                    className="flex items-center justify-center gap-2 rounded-xl bg-footloose px-4 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                  >
                    Become active
                    <FiArrowRight className="h-4 w-4" />
                  </Link>
                )}

                <p className="text-xs text-slate-600 leading-normal">
                  Questions about your membership or details? Reach out to the
                  board.
                </p>
              </div>
            </div>

            {/* Course subscriptions card */}
            <div className="overflow-hidden rounded-3xl bg-white shadow-xl shadow-slate-200/50 border border-slate-100">
              <div className="p-6">
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-4">
                  Course Subscriptions
                </h2>

                {!semester ? (
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
                      <FiCompass className="h-5 w-5" />
                    </div>

                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        No registration available
                      </p>
                      <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                        There&apos;s no active semester open for course
                        registration at the moment. Check back later.
                      </p>
                    </div>
                  </div>
                ) : !isRegistrationOpen ? (
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
                      <FiLock className="h-5 w-5" />
                    </div>

                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        Registration deadline passed
                      </p>
                      <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                        Registration for {semester.name} is closed.
                      </p>
                    </div>
                  </div>
                ) : !subscription ? (
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-footloose/10 text-footloose">
                      <FiCompass className="h-5 w-5" />
                    </div>

                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        Register for next semester
                      </p>

                      <p className="mt-1 text-xs text-slate-600">
                        {semester.name} · Registration deadline:{" "}
                        {registrationDeadline &&
                          new Intl.DateTimeFormat("en-UK", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          }).format(registrationDeadline)}
                      </p>

                      <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                        Pick your dance courses
                        {isActiveMember
                          ? ", including your priority pick per style."
                          : "."}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-xs text-slate-600">
                      <span>{semester.name}</span>
                      <span aria-hidden="true">·</span>
                      {registrationDeadline && (
                        <span>
                          Registration deadline:{" "}
                          {new Intl.DateTimeFormat("en-UK", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          }).format(registrationDeadline)}
                        </span>
                      )}
                    </div>

                    <div className="space-y-2">
                      {selectedCourses.map((course: any) => (
                        <div
                          key={course.documentId}
                          className="flex items-center justify-between gap-2 rounded-xl bg-slate-50/70 border border-slate-200 px-3 py-2"
                        >
                          <span className="text-xs font-semibold text-slate-800">
                            {course.style} &middot; {course.level}
                          </span>

                          {subscription.priorityCourseIds.includes(
                            course.documentId,
                          ) && (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-footloose">
                              <FiStar className="h-3 w-3" />
                              Priority
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="relative border-t-2 border-dashed border-slate-200">
                <span className="absolute -left-2.5 -top-2.5 h-5 w-5 rounded-full bg-slate-50/50" />
                <span className="absolute -right-2.5 -top-2.5 h-5 w-5 rounded-full bg-slate-50/50" />
              </div>

              <div className="p-6 pt-5">
                {!semester ? (
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-400">
                    <FiLock className="h-4 w-4" />
                    Course registration unavailable
                  </div>
                ) : !isRegistrationOpen ? (
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-500">
                    <FiLock className="h-4 w-4" />
                    Registration is closed
                  </div>
                ) : (
                  <Link
                    href="/membership/course-subscription"
                    className="group flex items-center justify-between text-sm font-semibold text-footloose"
                  >
                    {subscription
                      ? "Edit your subscription"
                      : "Manage course subscriptions"}
                    <FiArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                )}
              </div>
            </div>

            <div className="sm:hidden flex justify-center">
              <SignOutLink />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

/** Section wrapper for a group of related detail tiles */
function SectionCard({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-3xl bg-white p-6 sm:p-8 shadow-xl shadow-slate-200/50 border border-slate-100">
      <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
        <span className="text-footloose">{icon}</span>
        {title}
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{children}</div>
    </div>
  );
}

/** Helper tile component for layout */
function DetailTile({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value?: string | null;
}) {
  return (
    <div className="flex items-start gap-3.5 p-4 rounded-2xl bg-slate-50/70 border border-slate-200">
      <div className="mt-0.5 text-footloose shrink-0 text-lg">{icon}</div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          {label}
        </p>
        <p className="mt-0.5 text-sm font-semibold text-slate-800 truncate">
          {value || (
            <span className="font-normal italic text-slate-500">
              Not provided
            </span>
          )}
        </p>
      </div>
    </div>
  );
}
