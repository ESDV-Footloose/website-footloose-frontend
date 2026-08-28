"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { FiStar, FiCheckCircle, FiInfo, FiUsers } from "react-icons/fi";

type Course = {
  documentId: string;
  style: string;
  level: string;
  isPartnerDance: boolean;
};
type SelectionRecord = {
  role: "leader" | "follower" | "solo";
  partnerName: string;
};
type Subscription = {
  selections: {
    courseId: string;
    role: "leader" | "follower" | "solo";
    partnerName: string | null;
    isPriority: boolean;
  }[];
};

const DEFAULT_LEVEL_ORDER = ["1", "2", "3", "4", "demoteam"];
const STYLE_LEVEL_ORDER: Record<string, string[]> = {
  ballroom: ["bronze", "silver", "silverstar", "gold", "topclass"],
};

function normalize(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, "");
}

function getLevelDisplay(level: string): string {
  const match = level.match(/\((\d+)\)/);
  return match ? match[1] : level;
}

function levelSortKey(style: string, level: string): number {
  const order = STYLE_LEVEL_ORDER[normalize(style)] ?? DEFAULT_LEVEL_ORDER;
  const display = normalize(getLevelDisplay(level));
  const rawLevel = normalize(level);

  let idx = order.findIndex((o) => o === display || rawLevel.includes(o));
  if (idx === -1) idx = order.length;
  return idx;
}

export default function CourseSubscriptionForm({
  courses,
  isActiveMember,
  isEditable,
  subscription,
}: {
  courses: Course[];
  isActiveMember: boolean;
  isEditable: boolean;
  subscription: Subscription | null;
}) {
  const router = useRouter();

  const [selections, setSelections] = useState<Map<string, SelectionRecord>>(
    () =>
      new Map(
        (subscription?.selections ?? []).map((s) => [
          s.courseId,
          { role: s.role, partnerName: s.partnerName ?? "" },
        ]),
      ),
  );
  const [priorities, setPriorities] = useState<Set<string>>(
    new Set(
      (subscription?.selections ?? [])
        .filter((s) => s.isPriority)
        .map((s) => s.courseId),
    ),
  );
  const [agreed, setAgreed] = useState(Boolean(subscription));
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{
    type: "error" | "success";
    text: string;
  } | null>(null);

  const coursesById = useMemo(
    () => new Map(courses.map((c) => [c.documentId, c])),
    [courses],
  );

  const stylesMap = useMemo(() => {
    const map = new Map<string, Course[]>();
    for (const course of courses) {
      if (!map.has(course.style)) map.set(course.style, []);
      map.get(course.style)!.push(course);
    }
    for (const [style, styleCourses] of map) {
      styleCourses.sort(
        (a, b) => levelSortKey(style, a.level) - levelSortKey(style, b.level),
      );
    }
    return map;
  }, [courses]);

  function selectedForStyle(style: string) {
    return (stylesMap.get(style) ?? []).filter((c) =>
      selections.has(c.documentId),
    );
  }

  function recalcPriorityForStyle(
    style: string,
    nextSelectedIds: Set<string>,
    prevPriorities: Set<string>,
  ): Set<string> {
    const styleIds = (stylesMap.get(style) ?? []).map((c) => c.documentId);
    const next = new Set(prevPriorities);
    for (const id of styleIds) next.delete(id);

    if (!isActiveMember) return next;

    const stillSelected = styleIds.filter((id) => nextSelectedIds.has(id));
    if (stillSelected.length === 1) {
      next.add(stillSelected[0]);
    } else if (stillSelected.length > 1) {
      const existing = stillSelected.find((id) => prevPriorities.has(id));
      if (existing) next.add(existing);
    }
    return next;
  }

  const blockedStyles = isActiveMember
    ? [...stylesMap.keys()].filter((style) => {
        const picked = selectedForStyle(style);
        return (
          picked.length > 1 && !picked.some((c) => priorities.has(c.documentId))
        );
      })
    : [];

  // Courses selected but missing required role/partner info.
  const incompleteCourses = courses.filter((course) => {
    const sel = selections.get(course.documentId);
    if (!sel) return false;
    if (!course.isPartnerDance) return false;
    return sel.role === "solo" || !sel.partnerName.trim();
  });

  const canSubmit =
    isEditable &&
    agreed &&
    selections.size > 0 &&
    blockedStyles.length === 0 &&
    incompleteCourses.length === 0 &&
    !submitting;

  function toggleCourse(course: Course) {
    setSelections((prev) => {
      const next = new Map(prev);
      if (next.has(course.documentId)) {
        next.delete(course.documentId);
      } else {
        next.set(course.documentId, {
          role: course.isPartnerDance ? "leader" : "solo",
          partnerName: "",
        });
      }
      const nextIds = new Set(next.keys());
      setPriorities((prevP) =>
        recalcPriorityForStyle(course.style, nextIds, prevP),
      );
      return next;
    });
  }

  function updateSelection(courseId: string, patch: Partial<SelectionRecord>) {
    setSelections((prev) => {
      const next = new Map(prev);
      const current = next.get(courseId);
      if (!current) return prev;
      next.set(courseId, { ...current, ...patch });
      return next;
    });
  }

  function setPriorityForStyle(style: string, courseId: string | null) {
    const ids = (stylesMap.get(style) ?? []).map((c) => c.documentId);
    setPriorities((prev) => {
      const next = new Set(prev);
      for (const id of ids) next.delete(id);
      if (courseId) next.add(courseId);
      return next;
    });
  }

  async function save() {
    setSubmitting(true);
    setMessage(null);
    try {
      const res = await fetch("/api/subscriptions", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          selections: [...selections.entries()].map(([courseId, sel]) => ({
            courseId,
            role: sel.role,
            partnerName:
              sel.role === "solo" ? undefined : sel.partnerName.trim(),
            isPriority: priorities.has(courseId),
          })),
          agreedToPay: agreed,
        }),
      });
      const data = await res.json();
      if (!res.ok)
        throw new Error(
          data?.error?.message ?? "Could not save subscriptions.",
        );
      router.push("/membership");
      router.refresh();
    } catch (err) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Something went wrong.",
      });
      setSubmitting(false);
    }
  }

  if (!isEditable) {
    const rows = courses.filter((c) => selections.has(c.documentId));
    return (
      <div className="rounded-3xl bg-white p-6 sm:p-8 shadow-xl shadow-slate-200/50 border border-slate-100">
        <h2 className="text-xl font-bold text-slate-900 mb-4">
          Your selections
        </h2>
        {rows.length === 0 ? (
          <p className="text-sm text-slate-600">
            You did not register for any courses.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {rows.map((course) => {
              const sel = selections.get(course.documentId)!;
              return (
                <div
                  key={course.documentId}
                  className="flex items-start justify-between gap-3 p-4 rounded-2xl bg-slate-50/70 border border-slate-200"
                >
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-wider text-slate-500">
                      {course.style}
                    </p>
                    <p className="text-sm font-semibold text-slate-800">
                      {getLevelDisplay(course.level)}
                    </p>
                    {course.isPartnerDance ? (
                      <p className="mt-1 text-sm text-slate-600">
                        {sel.role === "leader" ? "Leader" : "Follower"} with{" "}
                        {sel.partnerName || "—"}
                      </p>
                    ) : (
                      <p className="mt-1 text-sm text-slate-600">Solo dancer</p>
                    )}
                  </div>
                  {priorities.has(course.documentId) && (
                    <span className="inline-flex items-center gap-1 text-sm font-semibold text-footloose shrink-0">
                      <FiStar className="h-4 w-4" /> Priority
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  const stylesWithSelection = [...stylesMap.keys()].filter(
    (style) => selectedForStyle(style).length > 0,
  ).length;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
      {/* Course selection */}
      <div className="lg:col-span-2 space-y-5">
        {[...stylesMap.entries()].map(([style, styleCourses]) => {
          const picked = selectedForStyle(style);
          const priorityId =
            picked.find((c) => priorities.has(c.documentId))?.documentId ?? "";

          return (
            <div
              key={style}
              className="rounded-3xl bg-white p-5 sm:p-6 shadow-xl shadow-slate-200/50 border border-slate-100"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-slate-900">{style}</h3>
                {picked.length > 0 && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-footloose/10 px-3 py-1.5 text-sm font-semibold text-footloose">
                    <FiCheckCircle className="h-4 w-4" />
                    {picked.length} selected
                  </span>
                )}
              </div>

              <div className="space-y-3">
                {styleCourses.map((course) => {
                  const isSelected = selections.has(course.documentId);
                  const sel = selections.get(course.documentId);
                  const isPriority = priorities.has(course.documentId);

                  return (
                    <div
                      key={course.documentId}
                      className={`rounded-2xl border px-4 py-3.5 transition-colors ${
                        isSelected
                          ? "bg-footloose/5 border-footloose/40"
                          : "bg-slate-50/70 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      <label className="flex items-center justify-between gap-3 cursor-pointer">
                        <span className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleCourse(course)}
                            className="h-5 w-5 rounded border-slate-300 text-footloose focus:ring-footloose"
                          />
                          <span className="text-sm font-semibold text-slate-800">
                            {style} {getLevelDisplay(course.level)}
                          </span>
                        </span>
                        {isPriority && (
                          <FiStar className="h-5 w-5 text-footloose shrink-0" />
                        )}
                      </label>

                      {isSelected && course.isPartnerDance && (
                        <div className="mt-3 flex flex-wrap items-center gap-3 pl-8">
                          <div className="inline-flex rounded-lg border border-slate-300 overflow-hidden">
                            {(["leader", "follower"] as const).map((role) => (
                              <button
                                key={role}
                                type="button"
                                onClick={() =>
                                  updateSelection(course.documentId, { role })
                                }
                                className={`px-3 py-1.5 text-xs font-semibold cursor-pointer transition-colors ${
                                  sel?.role === role
                                    ? "bg-footloose text-white"
                                    : "bg-white text-slate-600 hover:bg-slate-50"
                                }`}
                              >
                                {role === "leader" ? "Leader" : "Follower"}
                              </button>
                            ))}
                          </div>
                          <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                            <FiUsers className="h-4 w-4 text-slate-400 shrink-0" />
                            <input
                              type="text"
                              placeholder="Partner's full name"
                              value={sel?.partnerName ?? ""}
                              onChange={(e) =>
                                updateSelection(course.documentId, {
                                  partnerName: e.target.value,
                                })
                              }
                              className="flex-1 rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
                            />
                          </div>
                        </div>
                      )}

                      {isSelected && !course.isPartnerDance && (
                        <p className="mt-2 pl-8 text-xs font-medium text-slate-500">
                          Registered as a solo dancer.
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>

              {isActiveMember && picked.length > 1 && (
                <div className="mt-4 flex items-center gap-3 rounded-2xl bg-amber-50/70 border border-amber-200 px-4 py-3.5">
                  <FiStar className="h-5 w-5 shrink-0 text-amber-600" />
                  <label className="text-sm font-semibold text-amber-800 shrink-0">
                    Priority pick
                  </label>
                  <select
                    value={priorityId}
                    onChange={(e) =>
                      setPriorityForStyle(style, e.target.value || null)
                    }
                    className="flex-1 rounded-lg border border-amber-300 bg-white px-3 py-2 text-sm font-medium text-slate-800"
                  >
                    <option value="">No priority</option>
                    {picked.map((course) => (
                      <option key={course.documentId} value={course.documentId}>
                        {getLevelDisplay(course.level)}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {isActiveMember && picked.length === 1 && (
                <div className="mt-4 flex items-center gap-2.5 rounded-2xl bg-footloose/5 border border-footloose/20 px-4 py-3">
                  <FiStar className="h-4 w-4 text-footloose shrink-0" />
                  <p className="text-sm font-medium text-slate-600">
                    Automatically your priority pick for {style}, since
                    it&apos;s your only selection in this style.
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Sticky summary + submit */}
      <div className="lg:sticky lg:top-24 space-y-4">
        <div className="rounded-3xl bg-white p-6 shadow-xl shadow-slate-200/50 border border-slate-100 space-y-5">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-1">
              Summary
            </h2>
            <p className="text-sm text-slate-600">
              {selections.size} course{selections.size === 1 ? "" : "s"}{" "}
              selected across {stylesWithSelection} styles
            </p>
          </div>

          {selections.size > 0 && (
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {[...selections.keys()].map((courseId) => {
                const course = coursesById.get(courseId);
                const sel = selections.get(courseId)!;
                if (!course) return null;
                return (
                  <div
                    key={courseId}
                    className="flex items-center justify-between gap-2 rounded-xl bg-slate-50/70 border border-slate-200 px-3.5 py-2.5"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate">
                        {course.style} {getLevelDisplay(course.level)}
                      </p>
                      <p className="text-sm text-slate-500 truncate">
                        {course.isPartnerDance
                          ? `${sel.role === "leader" ? "Leader" : "Follower"}${
                              sel.partnerName ? ` w/ ${sel.partnerName}` : ""
                            }`
                          : "Solo"}
                      </p>
                    </div>
                    {priorities.has(courseId) && (
                      <FiStar className="h-4 w-4 text-footloose shrink-0" />
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <div className="relative border-t-2 border-dashed border-slate-200">
            <span className="absolute -left-2.5 -top-2.5 h-5 w-5 rounded-full bg-slate-50/50" />
            <span className="absolute -right-2.5 -top-2.5 h-5 w-5 rounded-full bg-slate-50/50" />
          </div>

          <label className="flex items-start gap-3 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-0.5 h-4 w-4"
            />
            <span>
              I agree to pay the course fee if I am admitted to any selected
              course.
            </span>
          </label>

          {incompleteCourses.length > 0 && (
            <div className="flex items-start gap-2 rounded-xl bg-amber-50/70 border border-amber-200 px-3.5 py-3">
              <FiInfo className="h-4 w-4 mt-0.5 shrink-0 text-amber-600" />
              <p className="text-sm font-medium text-amber-800">
                Enter your partner&apos;s name for:{" "}
                {incompleteCourses
                  .map((c) => `${c.style} ${getLevelDisplay(c.level)}`)
                  .join(", ")}
              </p>
            </div>
          )}

          {blockedStyles.length > 0 && (
            <div className="flex items-start gap-2 rounded-xl bg-amber-50/70 border border-amber-200 px-3.5 py-3">
              <FiInfo className="h-4 w-4 mt-0.5 shrink-0 text-amber-600" />
              <p className="text-sm font-medium text-amber-800">
                Choose a priority pick for: {blockedStyles.join(", ")}
              </p>
            </div>
          )}

          {message && (
            <p
              className={`text-sm font-medium ${
                message.type === "error" ? "text-red-600" : "text-emerald-600"
              }`}
            >
              {message.text}
            </p>
          )}

          <button
            type="button"
            disabled={!canSubmit}
            onClick={save}
            className="w-full rounded-xl bg-footloose px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {submitting ? "Saving..." : "Save subscriptions"}
          </button>
        </div>
      </div>
    </div>
  );
}
