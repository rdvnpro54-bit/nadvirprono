export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      admin_logs: {
        Row: {
          action: string
          admin_email: string
          created_at: string
          details: Json | null
          id: string
        }
        Insert: {
          action: string
          admin_email: string
          created_at?: string
          details?: Json | null
          id?: string
        }
        Update: {
          action?: string
          admin_email?: string
          created_at?: string
          details?: Json | null
          id?: string
        }
        Relationships: []
      }
      ai_learning_stats: {
        Row: {
          avg_actual_winrate: number
          avg_predicted_prob: number
          bet_type: string | null
          calibration_error: number
          common_loss_pattern: string | null
          confidence_level: string
          consensus_passed: boolean | null
          day_of_week: string | null
          id: string
          league_name: string
          losses: number
          odds_bracket: string | null
          roi: number | null
          sport: string
          streak_mode_active: boolean | null
          total_predictions: number
          updated_at: string
          winrate: number
          wins: number
        }
        Insert: {
          avg_actual_winrate?: number
          avg_predicted_prob?: number
          bet_type?: string | null
          calibration_error?: number
          common_loss_pattern?: string | null
          confidence_level: string
          consensus_passed?: boolean | null
          day_of_week?: string | null
          id?: string
          league_name?: string
          losses?: number
          odds_bracket?: string | null
          roi?: number | null
          sport: string
          streak_mode_active?: boolean | null
          total_predictions?: number
          updated_at?: string
          winrate?: number
          wins?: number
        }
        Update: {
          avg_actual_winrate?: number
          avg_predicted_prob?: number
          bet_type?: string | null
          calibration_error?: number
          common_loss_pattern?: string | null
          confidence_level?: string
          consensus_passed?: boolean | null
          day_of_week?: string | null
          id?: string
          league_name?: string
          losses?: number
          odds_bracket?: string | null
          roi?: number | null
          sport?: string
          streak_mode_active?: boolean | null
          total_predictions?: number
          updated_at?: string
          winrate?: number
          wins?: number
        }
        Relationships: []
      }
      cache_metadata: {
        Row: {
          id: string
          last_fetched_at: string | null
          last_reset_date: string
          request_count_today: number
        }
        Insert: {
          id?: string
          last_fetched_at?: string | null
          last_reset_date?: string
          request_count_today?: number
        }
        Update: {
          id?: string
          last_fetched_at?: string | null
          last_reset_date?: string
          request_count_today?: number
        }
        Relationships: []
      }
      cached_matches: {
        Row: {
          ai_score: number
          anomaly_label: string | null
          anomaly_reason: string | null
          anomaly_score: number
          away_logo: string | null
          away_score: number | null
          away_team: string
          consensus_passed: boolean | null
          context_penalties_total: number | null
          created_at: string
          data_completeness_score: number | null
          fetched_at: string
          fixture_id: number
          home_logo: string | null
          home_score: number | null
          home_team: string
          id: string
          is_free: boolean
          kickoff: string
          league_country: string | null
          league_name: string
          league_tier: number | null
          pred_analysis: string | null
          pred_away_win: number
          pred_btts_prob: number
          pred_confidence: string
          pred_draw: number
          pred_home_win: number
          pred_over_prob: number
          pred_over_under: number
          pred_score_away: number
          pred_score_home: number
          pred_value_bet: boolean
          sport: string
          status: string
          streak_mode_level: string | null
          suspect_score: number | null
          validation_score: number | null
        }
        Insert: {
          ai_score?: number
          anomaly_label?: string | null
          anomaly_reason?: string | null
          anomaly_score?: number
          away_logo?: string | null
          away_score?: number | null
          away_team: string
          consensus_passed?: boolean | null
          context_penalties_total?: number | null
          created_at?: string
          data_completeness_score?: number | null
          fetched_at?: string
          fixture_id: number
          home_logo?: string | null
          home_score?: number | null
          home_team: string
          id?: string
          is_free?: boolean
          kickoff: string
          league_country?: string | null
          league_name: string
          league_tier?: number | null
          pred_analysis?: string | null
          pred_away_win?: number
          pred_btts_prob?: number
          pred_confidence?: string
          pred_draw?: number
          pred_home_win?: number
          pred_over_prob?: number
          pred_over_under?: number
          pred_score_away?: number
          pred_score_home?: number
          pred_value_bet?: boolean
          sport?: string
          status?: string
          streak_mode_level?: string | null
          suspect_score?: number | null
          validation_score?: number | null
        }
        Update: {
          ai_score?: number
          anomaly_label?: string | null
          anomaly_reason?: string | null
          anomaly_score?: number
          away_logo?: string | null
          away_score?: number | null
          away_team?: string
          consensus_passed?: boolean | null
          context_penalties_total?: number | null
          created_at?: string
          data_completeness_score?: number | null
          fetched_at?: string
          fixture_id?: number
          home_logo?: string | null
          home_score?: number | null
          home_team?: string
          id?: string
          is_free?: boolean
          kickoff?: string
          league_country?: string | null
          league_name?: string
          league_tier?: number | null
          pred_analysis?: string | null
          pred_away_win?: number
          pred_btts_prob?: number
          pred_confidence?: string
          pred_draw?: number
          pred_home_win?: number
          pred_over_prob?: number
          pred_over_under?: number
          pred_score_away?: number
          pred_score_home?: number
          pred_value_bet?: boolean
          sport?: string
          status?: string
          streak_mode_level?: string | null
          suspect_score?: number | null
          validation_score?: number | null
        }
        Relationships: []
      }
      daily_briefings: {
        Row: {
          avg_confidence: number | null
          daily_focus: string | null
          date: string
          generated_at: string | null
          leagues_analyzed: number | null
          matches_discarded: number | null
          mode: string
          picks_retained: number | null
        }
        Insert: {
          avg_confidence?: number | null
          daily_focus?: string | null
          date: string
          generated_at?: string | null
          leagues_analyzed?: number | null
          matches_discarded?: number | null
          mode?: string
          picks_retained?: number | null
        }
        Update: {
          avg_confidence?: number | null
          daily_focus?: string | null
          date?: string
          generated_at?: string | null
          leagues_analyzed?: number | null
          matches_discarded?: number | null
          mode?: string
          picks_retained?: number | null
        }
        Relationships: []
      }
      league_performance: {
        Row: {
          blacklist_expires_at: string | null
          blacklist_reason: string | null
          blacklisted_at: string | null
          consecutive_bad_weeks: number
          id: string
          is_blacklisted: boolean
          league_name: string
          losses: number
          roi: number
          sport: string
          total_picks: number
          updated_at: string
          winrate: number
          wins: number
        }
        Insert: {
          blacklist_expires_at?: string | null
          blacklist_reason?: string | null
          blacklisted_at?: string | null
          consecutive_bad_weeks?: number
          id?: string
          is_blacklisted?: boolean
          league_name: string
          losses?: number
          roi?: number
          sport?: string
          total_picks?: number
          updated_at?: string
          winrate?: number
          wins?: number
        }
        Update: {
          blacklist_expires_at?: string | null
          blacklist_reason?: string | null
          blacklisted_at?: string | null
          consecutive_bad_weeks?: number
          id?: string
          is_blacklisted?: boolean
          league_name?: string
          losses?: number
          roi?: number
          sport?: string
          total_picks?: number
          updated_at?: string
          winrate?: number
          wins?: number
        }
        Relationships: []
      }
      league_tiers: {
        Row: {
          historical_winrate: number | null
          league_name: string
          sample_size: number | null
          sport: string
          tier: number
          updated_at: string | null
        }
        Insert: {
          historical_winrate?: number | null
          league_name: string
          sample_size?: number | null
          sport?: string
          tier?: number
          updated_at?: string | null
        }
        Update: {
          historical_winrate?: number | null
          league_name?: string
          sample_size?: number | null
          sport?: string
          tier?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      match_results: {
        Row: {
          actual_away_score: number | null
          actual_home_score: number | null
          away_team: string
          created_at: string
          fixture_id: number
          home_team: string
          id: string
          kickoff: string
          league_name: string
          pred_away_win: number
          pred_home_win: number
          predicted_confidence: string
          predicted_winner: string
          resolved_at: string | null
          result: string | null
          sport: string
        }
        Insert: {
          actual_away_score?: number | null
          actual_home_score?: number | null
          away_team: string
          created_at?: string
          fixture_id: number
          home_team: string
          id?: string
          kickoff: string
          league_name: string
          pred_away_win?: number
          pred_home_win?: number
          predicted_confidence?: string
          predicted_winner: string
          resolved_at?: string | null
          result?: string | null
          sport?: string
        }
        Update: {
          actual_away_score?: number | null
          actual_home_score?: number | null
          away_team?: string
          created_at?: string
          fixture_id?: number
          home_team?: string
          id?: string
          kickoff?: string
          league_name?: string
          pred_away_win?: number
          pred_home_win?: number
          predicted_confidence?: string
          predicted_winner?: string
          resolved_at?: string | null
          result?: string | null
          sport?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          activated_by: string | null
          created_at: string
          email: string
          expires_at: string | null
          id: string
          is_premium: boolean
          plan: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          activated_by?: string | null
          created_at?: string
          email: string
          expires_at?: string | null
          id?: string
          is_premium?: boolean
          plan?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          activated_by?: string | null
          created_at?: string
          email?: string
          expires_at?: string | null
          id?: string
          is_premium?: boolean
          plan?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_favorites: {
        Row: {
          created_at: string
          fixture_id: number
          id: string
          match_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          fixture_id: number
          id?: string
          match_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          fixture_id?: number
          id?: string
          match_id?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      weekly_reports: {
        Row: {
          best_bet_type: string | null
          best_league: string | null
          consensus_rate: number | null
          created_at: string
          fallback_rate: number | null
          id: string
          losses: number
          report_data: Json | null
          roi: number
          streak_mode_effectiveness: number | null
          total_picks: number
          week_end: string
          week_start: string
          winrate: number
          wins: number
          worst_league: string | null
        }
        Insert: {
          best_bet_type?: string | null
          best_league?: string | null
          consensus_rate?: number | null
          created_at?: string
          fallback_rate?: number | null
          id?: string
          losses?: number
          report_data?: Json | null
          roi?: number
          streak_mode_effectiveness?: number | null
          total_picks?: number
          week_end: string
          week_start: string
          winrate?: number
          wins?: number
          worst_league?: string | null
        }
        Update: {
          best_bet_type?: string | null
          best_league?: string | null
          consensus_rate?: number | null
          created_at?: string
          fallback_rate?: number | null
          id?: string
          losses?: number
          report_data?: Json | null
          roi?: number
          streak_mode_effectiveness?: number | null
          total_picks?: number
          week_end?: string
          week_start?: string
          winrate?: number
          wins?: number
          worst_league?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_list_users: {
        Args: never
        Returns: {
          created_at: string
          email: string
          id: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user"],
    },
  },
} as const
