"use client";

import { useEffect, useState } from "react";

type LocalDateTimeProps = {
  emptyLabel?: string;
  value: Date | string | null | undefined;
};

function formatLocalDateTime(value: Date | string | null | undefined) {
  if (!value) {
    return null;
  }

  const date = value instanceof Date ? value : new Date(value);

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function LocalDateTime({
  emptyLabel = "No data",
  value,
}: LocalDateTimeProps) {
  const [formatted, setFormatted] = useState<string | null>(null);

  useEffect(() => {
    setFormatted(formatLocalDateTime(value));
  }, [value]);

  return <span suppressHydrationWarning>{formatted ?? emptyLabel}</span>;
}
