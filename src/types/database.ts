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
          logo_url: string | null
          name: string
          provider: string
          provider_id: string
          short_name: string
        }
        Insert: {
          created_at?: string
          id?: never
          logo_url?: string | null
          name: string
          provider: string
          provider_id: string
          short_name: string
        }
        Update: {
          created_at?: string
          id?: never
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
      current_round: {
        Args: never
        Returns: {
          round: number
          season_id: number
          season_name: string
        }[]
      }
      is_username_available: { Args: { candidate: string }; Returns: boolean }
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
