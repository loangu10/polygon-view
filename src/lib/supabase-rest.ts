type QueryValue = string | number | boolean | null | undefined;
type CountMode = "estimated" | "exact" | "planned" | false;

type FetchPageOptions = {
  countMode?: CountMode;
  from?: number;
  query?: Record<string, QueryValue>;
  revalidateSeconds?: number;
  to?: number;
};

const RETRYABLE_STATUS_CODES = new Set([408, 425, 429, 500, 502, 503, 504]);
const DEFAULT_REVALIDATE_SECONDS = 45;
const SUPABASE_MAX_RETRIES = 2;

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

function shouldRetry(status: number, message: string) {
  const normalizedMessage = message.toLowerCase();

  if (RETRYABLE_STATUS_CODES.has(status)) {
    return true;
  }

  return (
    normalizedMessage.includes("statement timeout") ||
    normalizedMessage.includes('"code":"57014"') ||
    normalizedMessage.includes('"code": "57014"')
  );
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
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

  for (let attempt = 0; attempt <= SUPABASE_MAX_RETRIES; attempt += 1) {
    const response = await fetch(url, {
      headers: {
        ...getSupabaseHeaders(options.countMode),
        ...(options.from !== undefined && options.to !== undefined
          ? {
              Range: `${options.from}-${options.to}`,
              "Range-Unit": "items",
            }
          : {}),
      },
      next: {
        revalidate: options.revalidateSeconds ?? DEFAULT_REVALIDATE_SECONDS,
      },
    });

    if (response.ok) {
      return {
        count: parseCount(response.headers.get("content-range")),
        data: (await response.json()) as T[],
      };
    }

    const message = await response.text();

    if (attempt < SUPABASE_MAX_RETRIES && shouldRetry(response.status, message)) {
      await sleep(300 * 2 ** attempt);
      continue;
    }

    throw new Error(`Supabase REST ${table} failed (${response.status}): ${message}`);
  }

  throw new Error(`Supabase REST ${table} failed after retries.`);
}

export async function fetchSupabaseSlice<T>(
  table: string,
  options: {
    countMode?: CountMode;
    limit: number;
    query: Record<string, QueryValue>;
    revalidateSeconds?: number;
  },
) {
  return fetchSupabasePage<T>(table, {
    countMode: options.countMode ?? "planned",
    from: 0,
    query: {
      ...options.query,
      limit: options.limit,
    },
    revalidateSeconds: options.revalidateSeconds,
    to: Math.max(options.limit - 1, 0),
  });
}

export async function fetchSupabaseRows<T>(
  table: string,
  query: Record<string, QueryValue>,
  options: {
    countMode?: CountMode;
    maxRows?: number;
    pageSize?: number;
    revalidateSeconds?: number;
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
      countMode: from === 0 ? (options.countMode ?? false) : false,
      from,
      query,
      revalidateSeconds: options.revalidateSeconds,
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
