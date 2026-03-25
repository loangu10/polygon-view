"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function UnlockGate() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (pending) {
      return;
    }

    setPending(true);
    setError(null);

    try {
      const response = await fetch("/api/unlock", {
        body: JSON.stringify({ password }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { message?: string } | null;
        setError(body?.message ?? "Unable to unlock the dashboard.");
        setPending(false);
        return;
      }

      router.refresh();
    } catch {
      setError("Unable to unlock the dashboard.");
      setPending(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-8 sm:px-6">
      <div className="surface w-full max-w-md rounded-[32px] p-6 sm:p-7">
        <div className="rounded-3xl border border-slate-200/80 bg-slate-50/70 px-5 py-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            Protected
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-[-0.05em] text-slate-950">
            Enter password
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            This dashboard is locked. Access will stay unlocked in this browser for 30 days.
          </p>

          <form className="mt-5 grid gap-3" onSubmit={handleSubmit}>
            <label className="grid gap-2">
              <span className="text-xs font-medium uppercase tracking-[0.12em] text-slate-500">
                Password
              </span>
              <input
                autoFocus
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-slate-400"
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter password"
                type="password"
                value={password}
              />
            </label>

            {error ? (
              <p className="rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                {error}
              </p>
            ) : null}

            <button
              className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={pending || password.length === 0}
              type="submit"
            >
              {pending ? "Checking..." : "Unlock dashboard"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
