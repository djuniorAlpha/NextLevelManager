"use client";

import { useEffect, useState } from "react";
import { formatRelativeTime } from "@/lib/format";

export function LastHeartbeat({ lastHeartbeatAt }: { lastHeartbeatAt: string | null }) {
  const [, setTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setTick((value) => value + 1), 5_000);
    return () => clearInterval(interval);
  }, []);

  return <span>{formatRelativeTime(lastHeartbeatAt)}</span>;
}
