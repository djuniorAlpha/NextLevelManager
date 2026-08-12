import { useQuery } from "@tanstack/react-query";
import { getMachines } from "@/lib/api/machines";

export const MACHINES_QUERY_KEY = ["machines"] as const;

export function useMachines() {
  return useQuery({
    queryKey: MACHINES_QUERY_KEY,
    queryFn: getMachines,
    refetchOnWindowFocus: true,
    refetchInterval: 30_000,
    staleTime: 5_000,
  });
}
