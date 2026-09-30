"use client";

import { useId, useState } from "react";
import { useRouter } from "next/navigation";
import { FiClock, FiLock } from "react-icons/fi";

import Button from "@/components/modules/Button";
import type { ReservationHallOption } from "@/services/hallReservations";

/**
 * Properties of the reservation form.
 */
export type ReservationFormProps = {
  /** Slug of the page the form is on, used to look up the halls. */
  pageSlug: string;
  /** ID of the hall reservation component the form is in, used to look up the halls. */
  sectionId: number;
  /** The halls members can choose from. */
  halls: ReservationHallOption[];
  /** Whether the member has key access, which is required to reserve a hall. */
  hasKeyAccess: boolean;
  /** Email address members without key access can request key access at. */
  keyAccessEmail: string;
  /** Earliest allowed start, formatted as yyyy-mm-ddThh:mm. */
  minStart: string;
  /** Latest allowed start, formatted as yyyy-mm-ddThh:mm. */
  maxStart: string;
  /** Maximum length of a reservation. */
  maxDurationMinutes: number;
  /** Maximum length of the reservation reason. */
  maxReasonLength: number;
};

/** Minute options of the duration. */
const MINUTE_OPTIONS = [0, 15, 30, 45];

/**
 * Pads a number to two digits.
 *
 * @param value The number to pad.
 * @returns The padded number.
 */
function pad(value: number) {
  return String(value).padStart(2, "0");
}

/**
 * Calculates when a reservation ends, for display purposes.
 *
 * @param start The start, formatted as yyyy-mm-ddThh:mm.
 * @param durationMinutes The length of the reservation.
 * @returns The end time, or null if the start is not filled in.
 */
function getEndLabel(start: string, durationMinutes: number) {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(start);
  if (!match || durationMinutes <= 0) return null;

  const [year, month, day, hour, minute] = match.slice(1).map(Number);
  const end = new Date(
    Date.UTC(year, month - 1, day, hour, minute + durationMinutes),
  );
  const time = `${pad(end.getUTCHours())}:${pad(end.getUTCMinutes())}`;
  return end.getUTCDate() === day ? time : `${time} the next day`;
}

/**
 * Form members use to reserve a hall.
 *
 * @param reservationFormProps Properties of the reservation form.
 * @returns The reservation form.
 */
export default function ReservationForm({
  pageSlug,
  sectionId,
  halls,
  hasKeyAccess,
  keyAccessEmail,
  minStart,
  maxStart,
  maxDurationMinutes,
  maxReasonLength,
}: ReservationFormProps) {
  const router = useRouter();
  const id = useId();

  const [hallName, setHallName] = useState(halls[0]?.name ?? "");
  const [start, setStart] = useState("");
  const [hours, setHours] = useState(1);
  const [minutes, setMinutes] = useState(0);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{
    type: "error" | "success";
    text: string;
  } | null>(null);

  const durationMinutes = hours * 60 + minutes;
  const tooLong = durationMinutes > maxDurationMinutes;
  const endLabel = getEndLabel(start, durationMinutes);
  const canSubmit =
    hasKeyAccess &&
    Boolean(hallName) &&
    Boolean(start) &&
    durationMinutes > 0 &&
    !tooLong &&
    !submitting;

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setMessage(null);
    try {
      const res = await fetch("/api/hall-reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          page: pageSlug,
          section: sectionId,
          hall: hallName,
          start,
          hours,
          minutes,
          reason,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(data?.error?.message ?? "Could not reserve the hall.");
      }

      setMessage({
        type: "success",
        text: `You reserved ${data.data.hallName} on ${data.data.period}.`,
      });
      setStart("");
      setReason("");
      router.refresh();
    } catch (err) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Something went wrong.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <h2 className="text-3xl md:text-4xl font-semibold">Reserve a hall</h2>

      <fieldset className="space-y-2">
        <legend className="mb-2 font-semibold">Hall</legend>
        {halls.map((hall) => {
          const isSelected = hall.name === hallName;
          return (
            <label
              key={hall.name}
              className={`flex cursor-pointer items-start gap-3 rounded-md border px-4 py-3 transition-colors ${
                isSelected
                  ? "border-footloose bg-footloose/5"
                  : "border-neutral-300 hover:bg-neutral-100"
              }`}
            >
              <input
                type="radio"
                name={`${id}-hall`}
                value={hall.name}
                checked={isSelected}
                onChange={() => setHallName(hall.name)}
                className="mt-1.5 h-4 w-4 accent-footloose"
              />
              <span>
                <span className="font-semibold">{hall.name}</span>
                {hall.description && (
                  <span className="block text-sm text-neutral-500">
                    {hall.description}
                  </span>
                )}
              </span>
            </label>
          );
        })}
      </fieldset>

      <div className="space-y-2">
        <label htmlFor={`${id}-start`} className="block font-semibold">
          Date and start time
        </label>
        <input
          id={`${id}-start`}
          type="datetime-local"
          required
          min={minStart}
          max={maxStart}
          value={start}
          onChange={(e) => setStart(e.target.value)}
          className="w-full rounded-md border border-neutral-300 px-3 py-2"
        />
      </div>

      <div className="space-y-2">
        <span className="block font-semibold">Duration</span>
        <div className="flex items-center gap-2">
          <select
            aria-label="Hours"
            value={hours}
            onChange={(e) => setHours(Number(e.target.value))}
            className="rounded-md border border-neutral-300 bg-white px-3 py-2"
          >
            {Array.from(
              { length: Math.floor(maxDurationMinutes / 60) + 1 },
              (_, i) => (
                <option key={i} value={i}>
                  {i}
                </option>
              ),
            )}
          </select>
          <span>hours</span>
          <select
            aria-label="Minutes"
            value={minutes}
            onChange={(e) => setMinutes(Number(e.target.value))}
            className="ml-2 rounded-md border border-neutral-300 bg-white px-3 py-2"
          >
            {MINUTE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {pad(option)}
              </option>
            ))}
          </select>
          <span>minutes</span>
        </div>
        {tooLong ? (
          <p className="text-sm text-footloose">
            A reservation can last at most {maxDurationMinutes / 60} hours.
          </p>
        ) : (
          endLabel && (
            <p className="flex items-center gap-1.5 text-sm text-neutral-500">
              <FiClock className="h-4 w-4" />
              Until {endLabel}
            </p>
          )
        )}
      </div>

      <div className="space-y-2">
        <label htmlFor={`${id}-reason`} className="block font-semibold">
          Reason <span className="font-normal text-neutral-500">(optional)</span>
        </label>
        <input
          id={`${id}-reason`}
          type="text"
          placeholder="E.g. ballroom practice"
          maxLength={maxReasonLength}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="w-full rounded-md border border-neutral-300 px-3 py-2"
        />
      </div>

      {!hasKeyAccess && (
        <p className="border-l-4 border-footloose bg-neutral-100 px-4 py-3">
          Only members with key access can reserve a hall. You can request key
          access by emailing{" "}
          <a href={`mailto:${keyAccessEmail}`} className="underline text-footloose">
            {keyAccessEmail}
          </a>
          .
        </p>
      )}

      {message && (
        <p
          role="status"
          className={`border-l-4 bg-neutral-100 px-4 py-3 ${
            message.type === "error" ? "border-footloose" : "border-green-600"
          }`}
        >
          {message.text}
        </p>
      )}

      <Button
        type="submit"
        disabled={!canSubmit}
        className="disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:cursor-not-allowed disabled:hover:bg-footloose disabled:hover:text-white"
      >
        {!hasKeyAccess && <FiLock className="h-4 w-4" />}
        {submitting ? "Reserving..." : "Reserve hall"}
      </Button>
    </form>
  );
}
