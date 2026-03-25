type QueryValue = string | number | boolean | null | undefined;
type CountMode = "estimated" | "exact" | "planned" | false;

type FetchPageOptions = {
  countMode?: CountMode;
  from?: number;
  query?: Record<string, QueryValue>;
  to?: number;
};

export function hasSupabaseConfig() {
  return Boolean(process.env.SUPABASE_REST_URL && process.env.SUPABASE_API_KEY);
}

function getSupabaseBaseUrl() {
  const value = process.env.SUPABASE_REST_URL;

  if (!value) {
    throw new Error("Missing SUPABASE_REST_URL");
  }

  return value.endsWith("/") ? value : `${value}/`;
}

function getSupabaseHeaders(countMode: CountMode = false) {
  const apiKey = process.env.SUPABASE_API_KEY;

  if (!apiKey) {
    throw new Error("Missing SUPABASE_API_KEY");
  }

  return {
    Accept: "application/json",
    apikey: apiKey,
    Authorization: `Bearer ${apiKey}`,
    ...(countMode ? { Prefer: `count=${countMode}` } : {}),
  };
}

function parseCount(contentRange: string | null) {
  if (!contentRange) {
    return null;
  }

  const total = contentRange.split("/")[1];

  if (!total || total === "*") {
    return null;
  }

  const parsed = Number(total);
  return Number.isFinite(parsed) ? parsed : null;
}

export async function fetchSupabasePage<T>(
  table: string,
  options: FetchPageOptions = {},
) {
  const url = new URL(table, getSupabaseBaseUrl());

  Object.entries(options.query ?? {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, String(value));
    }
  });

  const response = await fetch(url, {
    cache: "no-store",
    headers: {
      ...getSupabaseHeaders(options.countMode),
      ...(options.from !== undefined && options.to !== undefined
        ? {
            Range: `${options.from}-${options.to}`,
            "Range-Unit": "items",
          }
        : {}),
    },
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Supabase REST ${table} failed (${response.status}): ${message}`);
  }

  return {
    count: parseCount(response.headers.get("content-range")),
    data: (await response.json()) as T[],
  };
}

export async function fetchSupabaseSlice<T>(
  table: string,
  options: {
    countMode?: CountMode;
    limit: number;
    query: Record<string, QueryValue>;
  },
) {
  return fetchSupabasePage<T>(table, {
    countMode: options.countMode ?? "planned",
    from: 0,
    query: {
      ...options.query,
      limit: options.limit,
    },
    to: Math.max(options.limit - 1, 0),
  });
}

export async function fetchSupabaseRows<T>(
  table: string,
  query: Record<string, QueryValue>,
  options: {
    maxRows?: number;
    pageSize?: number;
  } = {},
) {
  const pageSize = options.pageSize ?? 1000;
  const maxRows = options.maxRows;
  const rows: T[] = [];

  for (let from = 0; ; from += pageSize) {
    const to =
      maxRows === undefined
        ? from + pageSize - 1
        : Math.min(from + pageSize - 1, maxRows - 1);
    const page = await fetchSupabasePage<T>(table, {
      countMode: from === 0 ? "planned" : false,
      from,
      query,
      to,
    });

    rows.push(...page.data);

    if (page.data.length < pageSize) {
      break;
    }

    if (page.count !== null && rows.length >= page.count) {
      break;
    }

    if (maxRows !== undefined && rows.length >= maxRows) {
      break;
    }
  }

  return maxRows === undefined ? rows : rows.slice(0, maxRows);
}

export async function fetchTableSummary(table: string, timeColumn = "collected_at") {
  const page = await fetchSupabasePage<Record<string, string | null>>(table, {
    countMode: "planned",
    query: {
      limit: 1,
      order: `${timeColumn}.desc.nullslast`,
      select: timeColumn,
    },
  });

  return {
    lastSeen: page.data[0]?.[timeColumn] ?? null,
    rowCount: page.count ?? page.data.length,
  };
}
