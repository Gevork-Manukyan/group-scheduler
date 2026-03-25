"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import {
  buildDateRange,
  formatDateLabel,
  getLocalDateInputValue,
  MAX_GROUP_RANGE_DAYS,
  normalizeDates,
  shiftDateInputValue,
} from "@/lib/scheduler";

export default function CreateGroupForm() {
  const router = useRouter();
  const initialStartDate = getLocalDateInputValue();
  const [selectionMode, setSelectionMode] = useState("range");
  const [groupName, setGroupName] = useState("");
  const [startDate, setStartDate] = useState(initialStartDate);
  const [endDate, setEndDate] = useState(
    shiftDateInputValue(initialStartDate, 6),
  );
  const [specificDateInput, setSpecificDateInput] = useState(initialStartDate);
  const [specificDates, setSpecificDates] = useState([]);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  let rangeError = "";

  try {
    buildDateRange(startDate, endDate);
  } catch (previewError) {
    rangeError = previewError.message;
  }

  function addSpecificDate() {
    if (!specificDateInput) {
      return;
    }

    setSpecificDates((currentDates) =>
      normalizeDates([...currentDates, specificDateInput]),
    );
  }

  function removeSpecificDate(dateToRemove) {
    setSpecificDates((currentDates) =>
      currentDates.filter((date) => date !== dateToRemove),
    );
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const requestBody =
        selectionMode === "range"
          ? {
              name: groupName,
              startDate,
              endDate,
            }
          : {
              name: groupName,
              dates: specificDates,
            };

      const response = await fetch("/api/groups", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "Unable to create the group.");
      }

      router.push(`/groups/${payload.groupId}`);
    } catch (requestError) {
      setError(requestError.message);
      setIsSubmitting(false);
    }
  }

  return (
    <section className="panel-strong">
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
          Create a group
        </p>
        <h2 className="text-2xl font-bold tracking-tight text-[var(--text)]">
          Choose whether your group should use a range or exact dates.
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-5">
        <label className="space-y-2">
          <span className="text-sm font-semibold text-[var(--text)]">
            Group name
          </span>
          <input
            type="text"
            value={groupName}
            onChange={(event) => setGroupName(event.target.value)}
            placeholder="Friday dinner, project kickoff, family trip..."
            className="input-field"
            maxLength={80}
          />
        </label>

        <div className="space-y-3">
          <div className="space-y-2">
            <span className="text-sm font-semibold text-[var(--text)]">
              Date setup
            </span>
            <p className="text-sm leading-6 text-[var(--muted)]">
              Pick the simplest option for your group.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setSelectionMode("range")}
              className={`rounded-3xl border px-4 py-4 text-left transition ${
                selectionMode === "range"
                  ? "border-[var(--accent)] bg-[var(--accent-soft)]"
                  : "border-[var(--line)] bg-white"
              }`}
            >
              <p className="text-sm font-semibold text-[var(--text)]">
                Date range
              </p>
              <p className="mt-1 text-sm leading-6 text-[var(--muted)]">
                Let participants mark busy days anywhere between a start and end
                date.
              </p>
            </button>
            <button
              type="button"
              onClick={() => setSelectionMode("specific")}
              className={`rounded-3xl border px-4 py-4 text-left transition ${
                selectionMode === "specific"
                  ? "border-[var(--accent)] bg-[var(--accent-soft)]"
                  : "border-[var(--line)] bg-white"
              }`}
            >
              <p className="text-sm font-semibold text-[var(--text)]">
                Specific dates
              </p>
              <p className="mt-1 text-sm leading-6 text-[var(--muted)]">
                Only include the exact dates people should choose between.
              </p>
            </button>
          </div>

          {selectionMode === "range" ? (
            <>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="space-y-2">
                  <span className="text-sm font-medium text-[var(--text)]">
                    Start date
                  </span>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(event) => setStartDate(event.target.value)}
                    className="input-field min-w-0 flex-1"
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-medium text-[var(--text)]">
                    End date
                  </span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(event) => setEndDate(event.target.value)}
                    className="input-field min-w-0 flex-1"
                  />
                </label>
              </div>

              {rangeError ? (
                <div className="rounded-2xl border border-[var(--danger-line)] bg-[var(--danger-soft)] px-4 py-5 text-sm leading-6 text-[var(--danger)]">
                  {rangeError}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-[var(--line)] bg-[var(--panel-soft)] px-4 py-5 text-sm leading-6 text-[var(--muted)]">
                  Participants will be able to mark busy days anywhere in this
                  range. Keep the range at {MAX_GROUP_RANGE_DAYS} days or fewer
                  so the shared page stays easy to use.
                </div>
              )}
            </>
          ) : (
            <>
              <div className="flex flex-col gap-3 sm:flex-row">
                <input
                  type="date"
                  value={specificDateInput}
                  onChange={(event) => setSpecificDateInput(event.target.value)}
                  className="input-field min-w-0 flex-1"
                />
                <button
                  type="button"
                  onClick={addSpecificDate}
                  className="button-secondary whitespace-nowrap"
                >
                  Add date
                </button>
              </div>

              {specificDates.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {specificDates.map((date) => (
                    <button
                      key={date}
                      type="button"
                      onClick={() => removeSpecificDate(date)}
                      className="chip"
                    >
                      <span>{formatDateLabel(date)}</span>
                      <span className="text-[var(--muted)]">Remove</span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-[var(--line)] bg-[var(--panel-soft)] px-4 py-5 text-sm leading-6 text-[var(--muted)]">
                  Add the exact dates people should vote on.
                </div>
              )}

              <div className="rounded-2xl border border-dashed border-[var(--line)] bg-[var(--panel-soft)] px-4 py-5 text-sm leading-6 text-[var(--muted)]">
                You can include up to {MAX_GROUP_RANGE_DAYS} specific dates.
              </div>
            </>
          )}
        </div>

        {error ? (
          <p className="rounded-2xl border border-[var(--danger-line)] bg-[var(--danger-soft)] px-4 py-3 text-sm text-[var(--danger)]">
            {error}
          </p>
        ) : null}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm leading-6 text-[var(--muted)]">
            The next page gives you a shareable link and stores all responses in
            Appwrite.
          </p>
          <button
            type="submit"
            disabled={
              isSubmitting ||
              (selectionMode === "range"
                ? Boolean(rangeError)
                : specificDates.length === 0)
            }
            className="button-primary"
          >
            {isSubmitting ? "Creating group..." : "Create group"}
          </button>
        </div>
      </form>
    </section>
  );
}
