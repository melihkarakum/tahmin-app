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
    PostgrestVersion: "14.18"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      leagues: {
        Row: {
          country: string
          created_at: string
          id: number
          is_active: boolean
          name: string
          provider: string
          provider_id: string
        }
        Insert: {
          country: string
          created_at?: string
          id?: never
          is_active?: boolean
          name: string
          provider: string
          provider_id: string
        }
        Update: {
          country?: string
          created_at?: string
          id?: never
          is_active?: boolean
          name?: string
          provider?: string
          provider_id?: string
        }
        Relationships: []
      }
      matches: {
        Row: {
          away_score: number | null
          away_team_id: number
          created_at: string
          home_score: number | null
          home_team_id: number
          id: number
          kickoff_at: string
          provider: string
          provider_id: string
          round: number
          scored_at: string | null
          season_id: number
          status: string
          updated_at: string
        }
        Insert: {
          away_score?: number | null
          away_team_id: number
          created_at?: string
          home_score?: number | null
          home_team_id: number
          id?: never
          kickoff_at: string
          provider: string
          provider_id: string
          round: number
          scored_at?: string | null
          season_id: number
          status?: string
          updated_at?: string
        }
        Update: {
          away_score?: number | null
          away_team_id?: number
          created_at?: string
          home_score?: number | null
          home_team_id?: number
          id?: never
          kickoff_at?: string
          provider?: string
          provider_id?: string
          round?: number
          scored_at?: string | null
          season_id?: number
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "matches_away_team_id_fkey"
            columns: ["away_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_home_team_id_fkey"
            columns: ["home_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_log: {
        Row: {
          created_at: string
          kind: string
          ref: string
          user_id: string
        }
        Insert: {
          created_at?: string
          kind: string
          ref: string
          user_id: string
        }
        Update: {
          created_at?: string
          kind?: string
          ref?: string
          user_id?: string
        }
        Relationships: []
      }
      notification_settings: {
        Row: {
          match_reminders: boolean
          round_results: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          match_reminders?: boolean
          round_results?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          match_reminders?: boolean
          round_results?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      predictions: {
        Row: {
          away_goals: number
          created_at: string
          home_goals: number
          id: number
          match_id: number
          points: number | null
          result_type: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          away_goals: number
          created_at?: string
          home_goals: number
          id?: never
          match_id: number
          points?: number | null
          result_type?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          away_goals?: number
          created_at?: string
          home_goals?: number
          id?: never
          match_id?: number
          points?: number | null
          result_type?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "predictions_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "predictions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          deleted_at: string | null
          display_name: string
          id: string
          is_banned: boolean
          role: string
          terms_accepted_at: string | null
          updated_at: string
          username: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          display_name: string
          id: string
          is_banned?: boolean
          role?: string
          terms_accepted_at?: string | null
          updated_at?: string
          username: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          display_name?: string
          id?: string
          is_banned?: boolean
          role?: string
          terms_accepted_at?: string | null
          updated_at?: string
          username?: string
        }
        Relationships: []
      }
      push_tickets: {
        Row: {
          created_at: string
          id: string
          token: string
        }
        Insert: {
          created_at?: string
          id: string
          token: string
        }
        Update: {
          created_at?: string
          id?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "push_tickets_token_fkey"
            columns: ["token"]
            isOneToOne: false
            referencedRelation: "push_tokens"
            referencedColumns: ["token"]
          },
        ]
      }
      push_tokens: {
        Row: {
          created_at: string
          last_seen_at: string
          platform: string
          token: string
          user_id: string
        }
        Insert: {
          created_at?: string
          last_seen_at?: string
          platform: string
          token: string
          user_id: string
        }
        Update: {
          created_at?: string
          last_seen_at?: string
          platform?: string
          token?: string
          user_id?: string
        }
        Relationships: []
      }
      room_join_failures: {
        Row: {
          attempted_at: string
          id: number
          user_id: string
        }
        Insert: {
          attempted_at?: string
          id?: never
          user_id: string
        }
        Update: {
          attempted_at?: string
          id?: never
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "room_join_failures_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      room_members: {
        Row: {
          joined_at: string
          room_id: string
          user_id: string
        }
        Insert: {
          joined_at?: string
          room_id: string
          user_id: string
        }
        Update: {
          joined_at?: string
          room_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "room_members_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "room_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      rooms: {
        Row: {
          code: string
          created_at: string
          id: string
          name: string
          owner_id: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          name: string
          owner_id: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          name?: string
          owner_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rooms_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      scoring_config: {
        Row: {
          exact_points: number
          goal_diff_bonus: number
          id: number
          outcome_points: number
          updated_at: string
        }
        Insert: {
          exact_points?: number
          goal_diff_bonus?: number
          id?: number
          outcome_points?: number
          updated_at?: string
        }
        Update: {
          exact_points?: number
          goal_diff_bonus?: number
          id?: number
          outcome_points?: number
          updated_at?: string
        }
        Relationships: []
      }
      seasons: {
        Row: {
          created_at: string
          id: number
          is_current: boolean
          league_id: number
          name: string
          provider_season: string
        }
        Insert: {
          created_at?: string
          id?: never
          is_current?: boolean
          league_id: number
          name: string
          provider_season: string
        }
        Update: {
          created_at?: string
          id?: never
          is_current?: boolean
          league_id?: number
          name?: string
          provider_season?: string
        }
        Relationships: [
          {
            foreignKeyName: "seasons_league_id_fkey"
            columns: ["league_id"]
            isOneToOne: false
            referencedRelation: "leagues"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          created_at: string
          id: number
          logo_path: string | null
          logo_url: string | null
          name: string
          provider: string
          provider_id: string
          short_name: string
        }
        Insert: {
          created_at?: string
          id?: never
          logo_path?: string | null
          logo_url?: string | null
          name: string
          provider: string
          provider_id: string
          short_name: string
        }
        Update: {
          created_at?: string
          id?: never
          logo_path?: string | null
          logo_url?: string | null
          name?: string
          provider?: string
          provider_id?: string
          short_name?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_points: {
        Args: {
          p_away_score: number
          p_exact_points?: number
          p_goal_diff_bonus?: number
          p_home_score: number
          p_outcome_points?: number
          p_predicted_away: number
          p_predicted_home: number
        }
        Returns: {
          points: number
          result_type: string
        }[]
      }
      collect_match_reminders: {
        Args: { p_dry_run?: boolean; p_now?: string }
        Returns: {
          body: string
          title: string
          tokens: string[]
          url: string
          user_id: string
        }[]
      }
      collect_round_results: {
        Args: { p_dry_run?: boolean; p_now?: string }
        Returns: {
          body: string
          title: string
          tokens: string[]
          url: string
          user_id: string
        }[]
      }
      create_room: {
        Args: { p_name: string }
        Returns: {
          code: string
          created_at: string
          id: string
          name: string
          owner_id: string
        }
        SetofOptions: {
          from: "*"
          to: "rooms"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      current_round: {
        Args: never
        Returns: {
          round: number
          season_id: number
          season_name: string
        }[]
      }
      delete_my_account: { Args: never; Returns: undefined }
      get_my_notification_settings: {
        Args: never
        Returns: {
          match_reminders: boolean
          round_results: boolean
        }[]
      }
      get_my_prediction_history: {
        Args: { p_limit?: number }
        Returns: {
          away_score: number
          away_team_logo: string
          away_team_name: string
          away_team_short: string
          home_score: number
          home_team_logo: string
          home_team_name: string
          home_team_short: string
          kickoff_at: string
          match_id: number
          points: number
          predicted_at: string
          predicted_away: number
          predicted_home: number
          result_type: string
          round: number
          status: string
        }[]
      }
      get_my_rooms: {
        Args: never
        Returns: {
          code: string
          id: string
          is_owner: boolean
          leader_name: string
          leader_points: number
          member_count: number
          my_rank: number
          name: string
        }[]
      }
      get_my_stats: {
        Args: never
        Returns: {
          accuracy_percent: number
          exact_count: number
          last_five_rounds_points: number
          outcome_count: number
          prediction_count: number
          scored_count: number
          season_points: number
          season_rank: number
          season_total: number
        }[]
      }
      get_national_leaderboard: {
        Args: { p_limit?: number; p_round?: number }
        Returns: {
          display_name: string
          exact_count: number
          is_me: boolean
          outcome_count: number
          points: number
          rank: number
          scored_count: number
          total_count: number
          user_id: string
          username: string
        }[]
      }
      get_room_leaderboard: {
        Args: { p_room_id: string; p_round?: number }
        Returns: {
          display_name: string
          exact_count: number
          outcome_count: number
          points: number
          rank: number
          scored_count: number
          user_id: string
          username: string
        }[]
      }
      is_username_available: { Args: { candidate: string }; Returns: boolean }
      join_room: {
        Args: { p_code: string }
        Returns: {
          room_id: string
          status: string
        }[]
      }
      register_push_token: {
        Args: { p_platform: string; p_token: string }
        Returns: undefined
      }
      save_prediction: {
        Args: { p_away_goals: number; p_home_goals: number; p_match_id: number }
        Returns: {
          away_goals: number
          created_at: string
          home_goals: number
          id: number
          match_id: number
          points: number | null
          result_type: string | null
          updated_at: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "predictions"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      score_match: { Args: { p_match_id: number }; Returns: number }
      set_notification_settings: {
        Args: { p_match_reminders: boolean; p_round_results: boolean }
        Returns: undefined
      }
      unregister_push_token: { Args: { p_token: string }; Returns: undefined }
    }
    Enums: {
      [_ in never]: never
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
