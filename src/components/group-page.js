"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

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

export default function GroupPage({ groupId, initialGroup }) {
  const [group, setGroup] = useState(initialGroup);
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

    const savedResponse = initialGroup.responses.find(
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
  }, [groupId, hasLoadedSavedResponse, initialGroup.responses]);

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
              name and mark the dates they are busy within this range.
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

      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
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
                {group.responseCount}{" "}
                {group.responseCount === 1 ? "response" : "responses"}
              </p>
            </div>

            {commonDatesMessage ? (
              <div className="rounded-3xl border border-dashed border-[var(--line)] bg-[var(--panel-soft)] px-5 py-6 text-sm leading-6 text-[var(--muted)]">
                {commonDatesMessage}
              </div>
            ) : (
              <div className="flex flex-wrap gap-3">
                {group.commonDates.map((date) => (
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
                  <div key={date.date} className="rounded-3xl border border-[var(--line)] bg-white px-4 py-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="font-semibold text-[var(--text)]">
                          {date.label}
                        </p>
                        <p className="text-sm text-[var(--muted)]">
                          {date.availableCount} of {group.responseCount} people
                          are available
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

          <div className="panel space-y-4">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
                Participants
              </p>
              <h2 className="text-2xl font-bold tracking-tight text-[var(--text)]">
                Who has responded
              </h2>
            </div>

            {group.responses.length === 0 ? (
              <p className="text-sm leading-6 text-[var(--muted)]">
                No one has submitted availability yet.
              </p>
            ) : (
              <div className="grid gap-3">
                    {group.responses.map((response) => (
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
                        {editor?.responseId === response.id ? (
                      <span className="rounded-full bg-[var(--accent-soft)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--accent-strong)]">
                        You
                      </span>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

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

          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            <label className="space-y-2">
              <span className="text-sm font-semibold text-[var(--text)]">
                Display name
              </span>
              <input
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
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
                        onChange={() => toggleDate(date.date)}
                        className="mt-1 h-4 w-4 accent-[var(--danger)]"
                      />
                      <div>
                        <p className="font-semibold text-[var(--text)]">
                          {date.label}
                        </p>
                        <p className="text-sm text-[var(--muted)]">
                          Marked busy by {date.busyCount} of{" "}
                          {group.responseCount} responses
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

            <button type="submit" disabled={isSaving} className="button-primary w-full">
              {isSaving ? "Saving..." : editor ? "Update busy dates" : "Save busy dates"}
            </button>
          </form>
        </aside>
      </section>
    </main>
  );
}
