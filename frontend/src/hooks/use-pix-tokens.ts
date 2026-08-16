import { useQuery } from "@tanstack/react-query";
import { listPixTokens } from "@/lib/api/pix-tokens";

export function usePixTokens() {
  return useQuery({ queryKey: ["pix-tokens"], queryFn: listPixTokens });
}
