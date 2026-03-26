import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import {
  DASHBOARD_RANGE_COOKIE,
  DASHBOARD_RANGE_MAX_AGE,
  parseDashboardRange,
} from "@/lib/dashboard-range";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { range?: number | string } | null;
  const range = parseDashboardRange(body?.range?.toString());
  const cookieStore = await cookies();

  cookieStore.set(DASHBOARD_RANGE_COOKIE, String(range), {
    httpOnly: true,
    maxAge: DASHBOARD_RANGE_MAX_AGE,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });

  return NextResponse.json({ ok: true, range });
}
