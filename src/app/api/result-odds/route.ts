import { NextResponse } from "next/server";

import { fetchSupabaseRows, hasSupabaseConfig } from "@/lib/supabase-rest";

type ResultOddsRow = {
  fact_key: string;
  selected_gmean: number | string | null;
  selected_prob_pm: number | string | null;
};

function toNullableNumber(value: number | string | null | undefined) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export async function POST(request: Request) {
  if (!hasSupabaseConfig()) {
    return NextResponse.json({ odds: [] }, { status: 200 });
  }

  const body = (await request.json().catch(() => null)) as { ids?: string[] } | null;
  const ids = Array.from(new Set((body?.ids ?? []).filter(Boolean))).slice(0, 20);

  if (ids.length === 0) {
    return NextResponse.json({ odds: [] }, { status: 200 });
  }

  const rows = await fetchSupabaseRows<ResultOddsRow>(
    "strategy_bet_performance",
    {
      fact_key: `in.(${ids.join(",")})`,
      select: "fact_key,selected_prob_pm,selected_gmean",
    },
    {
      maxRows: ids.length,
      revalidateSeconds: 0,
    },
  );

  return NextResponse.json({
    odds: rows.map((row) => ({
      bookmakerProbability: toNullableNumber(row.selected_gmean),
      id: row.fact_key,
      pmProbability: toNullableNumber(row.selected_prob_pm),
    })),
  });
}
