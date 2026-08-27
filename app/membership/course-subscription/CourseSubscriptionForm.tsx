"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { FiStar, FiCheckCircle, FiInfo } from "react-icons/fi";

type Course = { documentId: string; style: string; level: string };
type Subscription = { courseIds: string[]; priorityCourseIds: string[] };

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
  const [selected, setSelected] = useState<Set<string>>(
    new Set(subscription?.courseIds ?? []),
  );
  const [priorities, setPriorities] = useState<Set<string>>(
    new Set(subscription?.priorityCourseIds ?? []),
  );
  const [agreed, setAgreed] = useState(Boolean(subscription));
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{
    type: "error" | "success";
    text: string;
  } | null>(null);

  const stylesMap = useMemo(() => {
    const map = new Map<string, Course[]>();
    for (const course of courses) {
      if (!map.has(course.style)) map.set(course.style, []);
      map.get(course.style)!.push(course);
    }
    return map;
  }, [courses]);

  function selectedForStyle(style: string, selectedSet: Set<string>) {
    return (stylesMap.get(style) ?? []).filter((c) =>
      selectedSet.has(c.documentId),
    );
  }

  /**
   * Recomputes the priority pick for a single style after a selection
   * change. Auto-assigns priority when exactly one course in the style
   * is selected; preserves an existing manual pick when 2+ remain
   * selected; clears priority entirely when none are selected.
   */
  function recalcPriorityForStyle(
    style: string,
    nextSelected: Set<string>,
    prevPriorities: Set<string>,
  ): Set<string> {
    const styleIds = (stylesMap.get(style) ?? []).map((c) => c.documentId);
    const next = new Set(prevPriorities);
    for (const id of styleIds) next.delete(id);

    if (!isActiveMember) return next;

    const stillSelected = styleIds.filter((id) => nextSelected.has(id));
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
        const picked = selectedForStyle(style, selected);
        return (
          picked.length > 1 && !picked.some((c) => priorities.has(c.documentId))
        );
      })
    : [];

  const canSubmit =
    isEditable &&
    agreed &&
    selected.size > 0 &&
    blockedStyles.length === 0 &&
    !submitting;

  function toggleCourse(course: Course) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(course.documentId)) {
        next.delete(course.documentId);
      } else {
        next.add(course.documentId);
      }
      setPriorities((prevP) =>
        recalcPriorityForStyle(course.style, next, prevP),
      );
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
          courseIds: [...selected],
          priorityCourseIds: [...priorities],
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
    const rows = courses.filter((c) => selected.has(c.documentId));
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
            {rows.map((course) => (
              <div
                key={course.documentId}
                className="flex items-center justify-between gap-3 p-4 rounded-2xl bg-slate-50/70 border border-slate-200"
              >
                <div>
                  <p className="text-sm font-semibold uppercase tracking-wider text-slate-500">
                    {course.style}
                  </p>
                  <p className="text-sm font-semibold text-slate-800">
                    {course.level}
                  </p>
                </div>
                {priorities.has(course.documentId) && (
                  <span className="inline-flex items-center gap-1 text-sm font-semibold text-footloose">
                    <FiStar className="h-4 w-4" /> Priority
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  const totalStyles = stylesMap.size;
  const stylesWithSelection = [...stylesMap.keys()].filter(
    (style) => selectedForStyle(style, selected).length > 0,
  ).length;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
      {/* Course selection */}
      <div className="lg:col-span-2 space-y-5">
        {[...stylesMap.entries()].map(([style, styleCourses]) => {
          const picked = selectedForStyle(style, selected);
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {styleCourses.map((course) => {
                  const isSelected = selected.has(course.documentId);
                  const isPriority = priorities.has(course.documentId);
                  return (
                    <label
                      key={course.documentId}
                      className={`flex items-center justify-between gap-3 rounded-2xl border px-4 py-3.5 cursor-pointer transition-colors ${
                        isSelected
                          ? "bg-footloose/5 border-footloose/40"
                          : "bg-slate-50/70 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      <span className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleCourse(course)}
                          className="h-5 w-5 rounded border-slate-300 text-footloose focus:ring-footloose"
                        />
                        <span className="text-sm font-semibold text-slate-800">
                          {course.level}
                        </span>
                      </span>
                      {isPriority && (
                        <FiStar className="h-5 w-5 text-footloose shrink-0" />
                      )}
                    </label>
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
                        {course.level}
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
              {selected.size} course{selected.size === 1 ? "" : "s"} selected
              across {stylesWithSelection} styles
            </p>
          </div>

          {selected.size > 0 && (
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {courses
                .filter((c) => selected.has(c.documentId))
                .map((course) => (
                  <div
                    key={course.documentId}
                    className="flex items-center justify-between gap-2 rounded-xl bg-slate-50/70 border border-slate-200 px-3.5 py-2.5"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate">
                        {course.style}
                      </p>
                      <p className="text-sm text-slate-500 truncate">
                        {course.level}
                      </p>
                    </div>
                    {priorities.has(course.documentId) && (
                      <FiStar className="h-4 w-4 text-footloose shrink-0" />
                    )}
                  </div>
                ))}
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
            className="w-full rounded-xl bg-footloose px-4 py-3.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {submitting ? "Saving..." : "Save subscriptions"}
          </button>
        </div>
      </div>
    </div>
  );
}
