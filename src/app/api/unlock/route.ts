import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import {
  DASHBOARD_UNLOCK_COOKIE,
  DASHBOARD_UNLOCK_MAX_AGE,
  DASHBOARD_UNLOCK_TOKEN,
} from "@/lib/site-lock";

const DASHBOARD_PASSWORD = "ladaronne";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { password?: string } | null;

  if (body?.password !== DASHBOARD_PASSWORD) {
    return NextResponse.json(
      { message: "Incorrect password." },
      { status: 401 },
    );
  }

  const cookieStore = await cookies();
  cookieStore.set(DASHBOARD_UNLOCK_COOKIE, DASHBOARD_UNLOCK_TOKEN, {
    httpOnly: true,
    maxAge: DASHBOARD_UNLOCK_MAX_AGE,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });

  return NextResponse.json({ ok: true });
}
