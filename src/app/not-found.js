import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col items-start justify-center gap-5 px-4 py-10 sm:px-6">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--muted)]">
        Not found
      </p>
      <div className="space-y-3">
        <h1 className="text-4xl font-extrabold tracking-tight text-[var(--text)]">
          That group link does not exist.
        </h1>
        <p className="max-w-xl text-base leading-7 text-[var(--muted)]">
          The link may be wrong, or the group may have been removed from
          Appwrite.
        </p>
      </div>
      <Link href="/" className="button-primary">
        Create a new group
      </Link>
    </main>
  );
}
