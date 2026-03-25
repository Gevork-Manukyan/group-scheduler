"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function getStorageKey(groupId) {
  return `group-scheduler:${groupId}:editor`;
}

function readSavedEditor(groupId) {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const value = window.localStorage.getItem(getStorageKey(groupId));

    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
}

function writeSavedEditor(groupId, editor) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(getStorageKey(groupId), JSON.stringify(editor));
}

function clearSavedEditor(groupId) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(getStorageKey(groupId));
}

function getDateParts(value) {
  const [year, month, day] = value.split("-").map(Number);

  return {
    year,
    monthIndex: month - 1,
    day,
  };
}

function toMonthKey(value) {
  const { year, monthIndex } = getDateParts(value);

  return `${year}-${String(monthIndex + 1).padStart(2, "0")}`;
}

function toDateInputValue(year, monthIndex, day) {
  return `${year}-${String(monthIndex + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function formatMonthLabel(year, monthIndex) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
  }).format(new Date(year, monthIndex, 1));
}

function buildCalendarMonths(dateSummaries) {
  const summaryMap = new Map(
    dateSummaries.map((summary) => [summary.date, summary]),
  );
  const monthKeys = [
    ...new Set(dateSummaries.map((summary) => toMonthKey(summary.date))),
  ].sort();

  return monthKeys.map((monthKey) => {
    const [yearValue, monthValue] = monthKey.split("-").map(Number);
    const year = yearValue;
    const monthIndex = monthValue - 1;
    const firstDay = new Date(year, monthIndex, 1).getDay();
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
    const cells = [];

    for (let index = 0; index < firstDay; index += 1) {
      cells.push({
        id: `${monthKey}-pad-start-${index}`,
        isPadding: true,
      });
    }

    for (let day = 1; day <= daysInMonth; day += 1) {
      const date = toDateInputValue(year, monthIndex, day);

      cells.push({
        id: date,
        date,
        day,
        summary: summaryMap.get(date) || null,
      });
    }

    while (cells.length % 7 !== 0) {
      cells.push({
        id: `${monthKey}-pad-end-${cells.length}`,
        isPadding: true,
      });
    }

    return {
      key: monthKey,
      label: formatMonthLabel(year, monthIndex),
      cells,
    };
  });
}

function getCalendarCellClass(summary, responseCount, isBusy) {
  if (!summary) {
    return "cursor-default border border-transparent bg-transparent text-[var(--muted)] opacity-25 shadow-none";
  }

  if (isBusy) {
    return "border border-[var(--danger-line)] bg-[var(--danger-soft)] text-[var(--text)] shadow-sm";
  }

  if (responseCount === 0) {
    return "border border-[var(--line)] bg-white text-[var(--text)]";
  }

  if (summary.allAvailable) {
    return "border border-[var(--success-line)] bg-[var(--success-soft)] text-[var(--text)]";
  }

  if (summary.availableCount === 0) {
    return "border border-[var(--danger-line)] bg-white text-[var(--text)]";
  }

  return "border border-[var(--line)] bg-white text-[var(--text)]";
}

function SummaryCard({ label, value, detail }) {
  return (
    <div className="rounded-3xl border border-[var(--line)] bg-white px-4 py-4">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
        {label}
      </p>
      <p className="mt-2 text-2xl font-bold tracking-tight text-[var(--text)]">
        {value}
      </p>
      <p className="mt-1 text-sm leading-6 text-[var(--muted)]">{detail}</p>
    </div>
  );
}

function CommonDatesPanel({ commonDates, commonDatesMessage, responseCount }) {
  return (
    <div className="panel-strong space-y-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
            Results
          </p>
          <h2 className="text-2xl font-bold tracking-tight text-[var(--text)]">
            Common available dates
          </h2>
          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
            Dates where no one has marked themselves as busy.
          </p>
        </div>
        <p className="text-sm font-medium text-[var(--muted)]">
          {responseCount} {responseCount === 1 ? "response" : "responses"}
        </p>
      </div>

      {commonDatesMessage ? (
        <div className="rounded-3xl border border-dashed border-[var(--line)] bg-[var(--panel-soft)] px-5 py-6 text-sm leading-6 text-[var(--muted)]">
          {commonDatesMessage}
        </div>
      ) : (
        <div className="flex flex-wrap gap-3">
          {commonDates.map((date) => (
            <div key={date.date} className="result-pill">
              <span className="font-semibold text-[var(--text)]">
                {date.label}
              </span>
              <span className="text-sm text-[var(--success)]">
                Everyone is free
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ParticipantsPanel({ responses, editorId }) {
  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
          Participants
        </p>
        <h2 className="text-2xl font-bold tracking-tight text-[var(--text)]">
          Who has responded
        </h2>
      </div>

      {responses.length === 0 ? (
        <p className="text-sm leading-6 text-[var(--muted)]">
          No one has submitted availability yet.
        </p>
      ) : (
        <div className="grid gap-3">
          {responses.map((response) => (
            <div
              key={response.id}
              className="flex items-center justify-between rounded-3xl border border-[var(--line)] bg-white px-4 py-4"
            >
              <div>
                <p className="font-semibold text-[var(--text)]">
                  {response.name}
                </p>
                <p className="text-sm text-[var(--muted)]">
                  Busy on {response.busyCount}{" "}
                  {response.busyCount === 1 ? "date" : "dates"}
                </p>
              </div>
              {editorId === response.id ? (
                <span className="rounded-full bg-[var(--accent-soft)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--accent-strong)]">
                  You
                </span>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ListBreakdownPanel({ group }) {
  return (
    <div className="panel space-y-4">
      <div className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
          Date breakdown
        </p>
        <h2 className="text-2xl font-bold tracking-tight text-[var(--text)]">
          Availability counts
        </h2>
      </div>

      <div className="grid gap-3">
        {group.dateSummaries.map((date) => {
          const percentage =
            group.responseCount > 0
              ? (date.availableCount / group.responseCount) * 100
              : 0;

          return (
            <div
              key={date.date}
              className="rounded-3xl border border-[var(--line)] bg-white px-4 py-4"
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-semibold text-[var(--text)]">
                    {date.label}
                  </p>
                  <p className="text-sm text-[var(--muted)]">
                    {date.availableCount} of {group.responseCount} people are
                    available
                  </p>
                </div>
                {date.allAvailable ? (
                  <span className="rounded-full bg-[var(--success-soft)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--success)]">
                    Full overlap
                  </span>
                ) : null}
              </div>

              <div className="mt-4 h-2 overflow-hidden rounded-full bg-[var(--panel-soft)]">
                <div
                  className="h-full rounded-full bg-[var(--accent)] transition-[width] duration-300"
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ListBusyPicker({
  group,
  busyDates,
  name,
  onNameChange,
  onToggleDate,
  onSubmit,
  isSaving,
  editor,
  feedback,
  error,
}) {
  return (
    <aside className="panel-strong h-fit">
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
          Your response
        </p>
        <h2 className="text-2xl font-bold tracking-tight text-[var(--text)]">
          Mark every date you are busy.
        </h2>
        <p className="text-sm leading-6 text-[var(--muted)]">
          Leave a date unchecked if you are free.
        </p>
      </div>

      <form onSubmit={onSubmit} className="mt-6 space-y-5">
        <label className="space-y-2">
          <span className="text-sm font-semibold text-[var(--text)]">
            Display name
          </span>
          <input
            type="text"
            value={name}
            onChange={(event) => onNameChange(event.target.value)}
            className="input-field"
            placeholder="Your name"
            maxLength={50}
          />
        </label>

        <div className="space-y-3">
          <p className="text-sm font-semibold text-[var(--text)]">
            Select busy dates
          </p>

          <div className="grid gap-3">
            {group.dateSummaries.map((date) => {
              const isSelected = busyDates.includes(date.date);

              return (
                <label
                  key={date.date}
                  className={`flex cursor-pointer items-start gap-3 rounded-3xl border px-4 py-4 transition ${
                    isSelected
                      ? "border-[var(--danger)] bg-[var(--danger-soft)]"
                      : "border-[var(--line)] bg-white"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => onToggleDate(date.date)}
                    className="mt-1 h-4 w-4 accent-[var(--danger)]"
                  />
                  <div>
                    <p className="font-semibold text-[var(--text)]">
                      {date.label}
                    </p>
                    <p className="text-sm text-[var(--muted)]">
                      Marked busy by {date.busyCount} of {group.responseCount}{" "}
                      responses
                    </p>
                  </div>
                </label>
              );
            })}
          </div>
        </div>

        {feedback ? (
          <p className="rounded-2xl border border-[var(--success-line)] bg-[var(--success-soft)] px-4 py-3 text-sm text-[var(--success)]">
            {feedback}
          </p>
        ) : null}

        {error ? (
          <p className="rounded-2xl border border-[var(--danger-line)] bg-[var(--danger-soft)] px-4 py-3 text-sm text-[var(--danger)]">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={isSaving}
          className="button-primary w-full"
        >
          {isSaving
            ? "Saving..."
            : editor
              ? "Update busy dates"
              : "Save busy dates"}
        </button>
      </form>
    </aside>
  );
}

function CalendarWorkspace({
  group,
  calendarMonths,
  commonDatesMessage,
  busyDates,
  name,
  onNameChange,
  onToggleDate,
  onSubmit,
  isSaving,
  editor,
  feedback,
  error,
}) {
  const busyDateSet = new Set(busyDates);

  return (
    <section className="space-y-6">
      <form onSubmit={onSubmit} className="panel-strong space-y-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
              Calendar workspace
            </p>
            <h2 className="text-3xl font-bold tracking-tight text-[var(--text)]">
              Everything in one calendar
            </h2>
            <p className="max-w-3xl text-sm leading-6 text-[var(--muted)]">
              Click any included date to mark yourself busy. The cell colors and
              counts update from the same group data used in list view.
            </p>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            label="Responses"
            value={group.responseCount}
            detail="People who have already filled in this group."
          />
          <SummaryCard
            label="Common dates"
            value={group.commonDates.length}
            detail="Dates that still work for everyone."
          />
          <SummaryCard
            label="Your busy dates"
            value={busyDates.length}
            detail="Dates you have currently marked as busy."
          />
          <SummaryCard
            label="Group dates"
            value={group.dates.length}
            detail="Total dates included in this group."
          />
        </div>

        <div className="sticky top-4 z-20 rounded-[1.75rem] border border-[var(--line)] bg-[rgba(255,255,255,0.94)] p-4 shadow-[0_20px_50px_rgba(95,74,39,0.14)] backdrop-blur">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div className="grid flex-1 gap-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
              <label className="space-y-2">
                <span className="text-sm font-semibold text-[var(--text)]">
                  Display name
                </span>
                <input
                  type="text"
                  value={name}
                  onChange={(event) => onNameChange(event.target.value)}
                  className="input-field"
                  placeholder="Your name"
                  maxLength={50}
                />
              </label>
              <div className="rounded-2xl border border-[var(--line)] bg-[var(--panel-soft)] px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
                  Your selection
                </p>
                <p className="mt-1 text-sm font-semibold text-[var(--text)]">
                  {busyDates.length} {busyDates.length === 1 ? "busy date" : "busy dates"}
                </p>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSaving}
              className="button-primary w-full xl:w-auto xl:min-w-[14.5rem]"
            >
              {isSaving
                ? "Saving..."
                : editor
                  ? "Update busy dates"
                  : "Save busy dates"}
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <span className="rounded-full border border-[var(--success-line)] bg-[var(--success-soft)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--success)]">
            Fully available
          </span>
          <span className="rounded-full border border-[var(--danger-line)] bg-[var(--danger-soft)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--danger)]">
            You marked busy
          </span>
          <span className="rounded-full border border-[var(--line)] bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
            Included date
          </span>
        </div>

        {commonDatesMessage ? (
          <div className="rounded-3xl border border-dashed border-[var(--line)] bg-[var(--panel-soft)] px-5 py-5 text-sm leading-6 text-[var(--muted)]">
            {commonDatesMessage}
          </div>
        ) : null}

        {feedback ? (
          <p className="rounded-2xl border border-[var(--success-line)] bg-[var(--success-soft)] px-4 py-3 text-sm text-[var(--success)]">
            {feedback}
          </p>
        ) : null}

        {error ? (
          <p className="rounded-2xl border border-[var(--danger-line)] bg-[var(--danger-soft)] px-4 py-3 text-sm text-[var(--danger)]">
            {error}
          </p>
        ) : null}

        <div className="space-y-8">
          {calendarMonths.map((month) => (
            <section key={month.key} className="space-y-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h3 className="text-2xl font-bold tracking-tight text-[var(--text)]">
                    {month.label}
                  </h3>
                  <p className="text-sm leading-6 text-[var(--muted)]">
                    Click any date in the group to toggle your busy status.
                  </p>
                </div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
                  Calendar view
                </p>
              </div>

              <div className="-mx-1 overflow-x-auto pb-2">
                <div className="min-w-[42rem] px-1 sm:min-w-0">
                  <div className="grid grid-cols-7 gap-2 text-center text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
                    {WEEKDAY_LABELS.map((label) => (
                      <div key={`${month.key}-${label}`}>{label}</div>
                    ))}
                  </div>

                  <div className="mt-2 grid grid-cols-7 gap-2">
                    {month.cells.map((cell) =>
                      cell.isPadding ? (
                        <div key={cell.id} className="aspect-square rounded-2xl" />
                      ) : (
                        <button
                          key={cell.id}
                          type="button"
                          disabled={!cell.summary}
                          onClick={() => {
                            if (cell.summary) {
                              onToggleDate(cell.date);
                            }
                          }}
                          className={`min-h-[6.75rem] rounded-2xl p-2 text-left transition sm:min-h-[8.5rem] xl:min-h-[9.5rem] ${getCalendarCellClass(
                            cell.summary,
                            group.responseCount,
                            busyDateSet.has(cell.date),
                          )}`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span className="text-sm font-semibold">{cell.day}</span>
                            {busyDateSet.has(cell.date) ? (
                              <span className="rounded-full bg-[var(--danger)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-white">
                                Busy
                              </span>
                            ) : cell.summary?.allAvailable ? (
                              <span className="rounded-full bg-[var(--success)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-white">
                                Open
                              </span>
                            ) : null}
                          </div>

                          {cell.summary ? (
                            <div className="mt-3 space-y-1 text-[11px] leading-4">
                              <p>{cell.summary.availableCount} available</p>
                              <p>{cell.summary.busyCount} busy</p>
                              {cell.summary.allAvailable ? (
                                <p className="font-semibold text-[var(--success)]">
                                  Everyone is free
                                </p>
                              ) : null}
                            </div>
                          ) : (
                            <p className="mt-3 text-[11px] leading-4">
                              Not in group
                            </p>
                          )}
                        </button>
                      ),
                    )}
                  </div>
                </div>
              </div>
            </section>
          ))}
        </div>
      </form>

      <div className="panel">
        <ParticipantsPanel responses={group.responses} editorId={editor?.responseId} />
      </div>
    </section>
  );
}

export default function GroupPage({ groupId, initialGroup }) {
  const [group, setGroup] = useState(initialGroup);
  const [viewMode, setViewMode] = useState("calendar");
  const [name, setName] = useState("");
  const [busyDates, setBusyDates] = useState([]);
  const [editor, setEditor] = useState(null);
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");
  const [copyState, setCopyState] = useState("idle");
  const [isSaving, setIsSaving] = useState(false);
  const [hasLoadedSavedResponse, setHasLoadedSavedResponse] = useState(false);
  const [shareUrl, setShareUrl] = useState("");

  useEffect(() => {
    if (hasLoadedSavedResponse) {
      return;
    }

    const savedEditor = readSavedEditor(groupId);

    if (!savedEditor) {
      setHasLoadedSavedResponse(true);
      return;
    }

    const savedResponse = group.responses.find(
      (response) => response.id === savedEditor.responseId,
    );

    if (!savedResponse) {
      clearSavedEditor(groupId);
      setHasLoadedSavedResponse(true);
      return;
    }

    setEditor(savedEditor);
    setName(savedResponse.name);
    setBusyDates(savedResponse.busyDates);
    setHasLoadedSavedResponse(true);
  }, [groupId, group.responses, hasLoadedSavedResponse]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    setShareUrl(window.location.href);
  }, []);

  function toggleDate(date) {
    setBusyDates((currentDates) => {
      if (currentDates.includes(date)) {
        return currentDates.filter((currentDate) => currentDate !== date);
      }

      return [...currentDates, date].sort();
    });
  }

  async function handleCopyLink() {
    if (!shareUrl) {
      return;
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopyState("copied");
      window.setTimeout(() => setCopyState("idle"), 1600);
    } catch {
      setCopyState("error");
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setFeedback("");
    setIsSaving(true);

    try {
      const response = await fetch(`/api/groups/${groupId}/responses`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          busyDates,
          responseId: editor?.responseId,
          editToken: editor?.editToken,
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        if (response.status === 403) {
          clearSavedEditor(groupId);
          setEditor(null);
        }

        throw new Error(payload.error || "Unable to save your response.");
      }

      setGroup(payload.group);
      setEditor(payload.editor);
      writeSavedEditor(groupId, payload.editor);
      setFeedback(editor ? "Busy dates updated." : "Busy dates saved.");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsSaving(false);
    }
  }

  const commonDatesMessage =
    group.responseCount === 0
      ? "Waiting for the first response."
      : group.commonDates.length > 0
        ? null
        : "No date works for everyone yet.";
  const calendarMonths = buildCalendarMonths(group.dateSummaries);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-3">
          <Link
            href="/"
            className="inline-flex items-center text-sm font-semibold text-[var(--accent)] transition hover:text-[var(--accent-strong)]"
          >
            Create another group
          </Link>
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
              Shared availability
            </p>
            <h1 className="text-3xl font-extrabold tracking-tight text-[var(--text)] sm:text-4xl">
              {group.name}
            </h1>
            <p className="max-w-2xl text-base leading-7 text-[var(--muted)]">
              Share this page with your group. Everyone can submit a display
              name and mark the dates they are busy.
            </p>
          </div>
        </div>

        <div className="panel flex w-full max-w-xl flex-col gap-3">
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              readOnly
              value={shareUrl}
              className="input-field min-w-0 flex-1"
            />
            <button
              type="button"
              onClick={handleCopyLink}
              className="button-secondary whitespace-nowrap"
            >
              {copyState === "copied"
                ? "Copied"
                : copyState === "error"
                  ? "Copy failed"
                  : "Copy link"}
            </button>
          </div>
          <p className="text-sm leading-6 text-[var(--muted)]">
            Responses from this browser stay editable later using a local saved
            edit token. No account required.
          </p>
        </div>
      </div>

      <div className="panel flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
            View
          </p>
          <h2 className="text-2xl font-bold tracking-tight text-[var(--text)]">
            Switch between list and calendar layouts
          </h2>
          <p className="text-sm leading-6 text-[var(--muted)]">
            Both views use the same busy-date data and save flow.
          </p>
        </div>

        <div className="inline-flex w-full rounded-full border border-[var(--line)] bg-white p-1 sm:w-auto">
          <button
            type="button"
            onClick={() => setViewMode("list")}
            className={`flex-1 rounded-full px-4 py-2 text-sm font-semibold transition sm:flex-none ${
              viewMode === "list"
                ? "bg-[var(--accent)] text-white shadow-sm"
                : "text-[var(--muted)]"
            }`}
          >
            List view
          </button>
          <button
            type="button"
            onClick={() => setViewMode("calendar")}
            className={`flex-1 rounded-full px-4 py-2 text-sm font-semibold transition sm:flex-none ${
              viewMode === "calendar"
                ? "bg-[var(--accent)] text-white shadow-sm"
                : "text-[var(--muted)]"
            }`}
          >
            Calendar view
          </button>
        </div>
      </div>

      {viewMode === "calendar" ? (
        <CalendarWorkspace
          group={group}
          calendarMonths={calendarMonths}
          commonDatesMessage={commonDatesMessage}
          busyDates={busyDates}
          name={name}
          onNameChange={setName}
          onToggleDate={toggleDate}
          onSubmit={handleSubmit}
          isSaving={isSaving}
          editor={editor}
          feedback={feedback}
          error={error}
        />
      ) : (
        <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-6">
            <CommonDatesPanel
              commonDates={group.commonDates}
              commonDatesMessage={commonDatesMessage}
              responseCount={group.responseCount}
            />
            <ListBreakdownPanel group={group} />
            <div className="panel">
              <ParticipantsPanel
                responses={group.responses}
                editorId={editor?.responseId}
              />
            </div>
          </div>

          <ListBusyPicker
            group={group}
            busyDates={busyDates}
            name={name}
            onNameChange={setName}
            onToggleDate={toggleDate}
            onSubmit={handleSubmit}
            isSaving={isSaving}
            editor={editor}
            feedback={feedback}
            error={error}
          />
        </section>
      )}
    </main>
  );
}
