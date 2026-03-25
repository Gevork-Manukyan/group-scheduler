import CreateGroupForm from "@/components/create-group-form";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-10 px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
      <section className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
        <div className="space-y-6">
          <div className="inline-flex items-center rounded-full border border-[var(--line)] bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-[var(--muted)] shadow-sm backdrop-blur">
            Minimal group scheduling
          </div>

          <div className="space-y-4">
            <h1 className="max-w-2xl text-4xl font-extrabold tracking-tight text-[var(--text)] sm:text-5xl">
              Choose a range or exact dates, share one link, and find the overlap.
            </h1>
            <p className="max-w-2xl text-base leading-7 text-[var(--muted)] sm:text-lg">
              Create a group, choose either an overall date range or exact
              dates, and let everyone mark the days they are busy. No accounts,
              no passwords, and no extra profile data.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="panel space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
                1. Create
              </p>
              <p className="text-sm leading-6 text-[var(--text)]">
                Name the group and choose either a date range or exact dates.
              </p>
            </div>
            <div className="panel space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
                2. Share
              </p>
              <p className="text-sm leading-6 text-[var(--text)]">
                Send the group link anywhere you want. People only need a
                display name.
              </p>
            </div>
            <div className="panel space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
                3. Compare
              </p>
              <p className="text-sm leading-6 text-[var(--text)]">
                The shared page shows which dates stay available after everyone
                marks their busy days.
              </p>
            </div>
          </div>
        </div>

        <CreateGroupForm />
      </section>
    </main>
  );
}
