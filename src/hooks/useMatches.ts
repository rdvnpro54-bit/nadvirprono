import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type CachedMatch = Tables<"cached_matches">;

export function useMatches() {
  return useQuery({
    queryKey: ["cached-matches"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cached_matches")
        .select("*")
        .gte("kickoff", new Date().toISOString().split("T")[0])
        .order("kickoff", { ascending: true });

      if (error) throw error;
      return data as CachedMatch[];
    },
    staleTime: 5 * 60 * 1000, // 5 min client cache
    refetchInterval: 15 * 60 * 1000, // refetch every 15 min
  });
}

export function useMatch(id: string) {
  return useQuery({
    queryKey: ["cached-match", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cached_matches")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      return data as CachedMatch;
    },
  });
}

export function useTriggerFetch() {
  return useQuery({
    queryKey: ["trigger-fetch"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("fetch-matches");
      if (error) throw error;
      return data;
    },
    staleTime: 14 * 60 * 1000,
    refetchInterval: 15 * 60 * 1000,
  });
}
