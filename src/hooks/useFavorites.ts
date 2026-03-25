import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export function useFavorites() {
  const { user } = useAuth();

  const { data: favorites = [], ...rest } = useQuery({
    queryKey: ["user-favorites", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("user_favorites")
        .select("*")
        .eq("user_id", user.id);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  return { favorites, ...rest };
}

export function useToggleFavorite() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ matchId, fixtureId }: { matchId: string; fixtureId: number }) => {
      if (!user) {
        toast.error("Connecte-toi pour ajouter des favoris", {
          action: { label: "Se connecter", onClick: () => window.location.href = "/login" },
        });
        throw new Error("Not authenticated");
      }

      // Check if already favorited
      const { data: existing } = await supabase
        .from("user_favorites")
        .select("id")
        .eq("user_id", user.id)
        .eq("fixture_id", fixtureId)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from("user_favorites")
          .delete()
          .eq("id", existing.id);
        if (error) throw error;
        return { action: "removed" as const };
      } else {
        const { error } = await supabase
          .from("user_favorites")
          .insert({ user_id: user.id, match_id: matchId, fixture_id: fixtureId });
        if (error) throw error;
        return { action: "added" as const };
      }
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["user-favorites"] });
      toast.success(result.action === "added" ? "Match ajouté aux favoris ⭐" : "Match retiré des favoris");
    },
    onError: (error) => {
      if (error.message !== "Not authenticated") {
        toast.error("Erreur lors de la mise à jour");
      }
    },
  });
}
