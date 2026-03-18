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
      baby_profiles: {
        Row: {
          created_at: string
          date_of_birth: string | null
          default_start_side: Database["public"]["Enums"]["feeding_side"]
          family_id: string
          id: string
          name: string
          unit_preference: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          date_of_birth?: string | null
          default_start_side?: Database["public"]["Enums"]["feeding_side"]
          family_id: string
          id?: string
          name: string
          unit_preference?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          date_of_birth?: string | null
          default_start_side?: Database["public"]["Enums"]["feeding_side"]
          family_id?: string
          id?: string
          name?: string
          unit_preference?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "baby_profiles_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
        ]
      }
      bottle_feeds: {
        Row: {
          amount_oz: number
          baby_profile_id: string
          caregiver_id: string | null
          content_type: Database["public"]["Enums"]["content_type"]
          created_at: string
          id: string
          notes: string | null
          timestamp: string
        }
        Insert: {
          amount_oz: number
          baby_profile_id: string
          caregiver_id?: string | null
          content_type?: Database["public"]["Enums"]["content_type"]
          created_at?: string
          id?: string
          notes?: string | null
          timestamp?: string
        }
        Update: {
          amount_oz?: number
          baby_profile_id?: string
          caregiver_id?: string | null
          content_type?: Database["public"]["Enums"]["content_type"]
          created_at?: string
          id?: string
          notes?: string | null
          timestamp?: string
        }
        Relationships: [
          {
            foreignKeyName: "bottle_feeds_baby_profile_id_fkey"
            columns: ["baby_profile_id"]
            isOneToOne: false
            referencedRelation: "baby_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bottle_feeds_caregiver_id_fkey"
            columns: ["caregiver_id"]
            isOneToOne: false
            referencedRelation: "caregivers"
            referencedColumns: ["id"]
          },
        ]
      }
      caregivers: {
        Row: {
          created_at: string
          display_name: string
          family_id: string
          id: string
          invite_email: string | null
          role: Database["public"]["Enums"]["caregiver_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          display_name: string
          family_id: string
          id?: string
          invite_email?: string | null
          role?: Database["public"]["Enums"]["caregiver_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          display_name?: string
          family_id?: string
          id?: string
          invite_email?: string | null
          role?: Database["public"]["Enums"]["caregiver_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "caregivers_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
        ]
      }
      diaper_changes: {
        Row: {
          baby_profile_id: string
          caregiver_id: string | null
          color_note: Database["public"]["Enums"]["color_note"] | null
          created_at: string
          id: string
          notes: string | null
          timestamp: string
          type: Database["public"]["Enums"]["diaper_type"]
        }
        Insert: {
          baby_profile_id: string
          caregiver_id?: string | null
          color_note?: Database["public"]["Enums"]["color_note"] | null
          created_at?: string
          id?: string
          notes?: string | null
          timestamp?: string
          type: Database["public"]["Enums"]["diaper_type"]
        }
        Update: {
          baby_profile_id?: string
          caregiver_id?: string | null
          color_note?: Database["public"]["Enums"]["color_note"] | null
          created_at?: string
          id?: string
          notes?: string | null
          timestamp?: string
          type?: Database["public"]["Enums"]["diaper_type"]
        }
        Relationships: [
          {
            foreignKeyName: "diaper_changes_baby_profile_id_fkey"
            columns: ["baby_profile_id"]
            isOneToOne: false
            referencedRelation: "baby_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "diaper_changes_caregiver_id_fkey"
            columns: ["caregiver_id"]
            isOneToOne: false
            referencedRelation: "caregivers"
            referencedColumns: ["id"]
          },
        ]
      }
      families: {
        Row: {
          created_at: string
          id: string
        }
        Insert: {
          created_at?: string
          id?: string
        }
        Update: {
          created_at?: string
          id?: string
        }
        Relationships: []
      }
      family_invites: {
        Row: {
          created_at: string
          created_by: string
          expires_at: string
          family_id: string
          id: string
          invite_code: string
          status: string
          used_at: string | null
          used_by: string | null
        }
        Insert: {
          created_at?: string
          created_by: string
          expires_at?: string
          family_id: string
          id?: string
          invite_code?: string
          status?: string
          used_at?: string | null
          used_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string
          expires_at?: string
          family_id?: string
          id?: string
          invite_code?: string
          status?: string
          used_at?: string | null
          used_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "family_invites_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
        ]
      }
      feeding_sessions: {
        Row: {
          baby_profile_id: string
          caregiver_id: string | null
          created_at: string
          duration_seconds: number | null
          end_time: string | null
          id: string
          notes: string | null
          side: Database["public"]["Enums"]["feeding_side"]
          start_time: string
        }
        Insert: {
          baby_profile_id: string
          caregiver_id?: string | null
          created_at?: string
          duration_seconds?: number | null
          end_time?: string | null
          id?: string
          notes?: string | null
          side: Database["public"]["Enums"]["feeding_side"]
          start_time: string
        }
        Update: {
          baby_profile_id?: string
          caregiver_id?: string | null
          created_at?: string
          duration_seconds?: number | null
          end_time?: string | null
          id?: string
          notes?: string | null
          side?: Database["public"]["Enums"]["feeding_side"]
          start_time?: string
        }
        Relationships: [
          {
            foreignKeyName: "feeding_sessions_baby_profile_id_fkey"
            columns: ["baby_profile_id"]
            isOneToOne: false
            referencedRelation: "baby_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feeding_sessions_caregiver_id_fkey"
            columns: ["caregiver_id"]
            isOneToOne: false
            referencedRelation: "caregivers"
            referencedColumns: ["id"]
          },
        ]
      }
      pumping_sessions: {
        Row: {
          baby_profile_id: string
          caregiver_id: string | null
          created_at: string
          duration_seconds: number | null
          end_time: string | null
          id: string
          notes: string | null
          side: Database["public"]["Enums"]["feeding_side"]
          start_time: string
          volume_oz: number | null
        }
        Insert: {
          baby_profile_id: string
          caregiver_id?: string | null
          created_at?: string
          duration_seconds?: number | null
          end_time?: string | null
          id?: string
          notes?: string | null
          side?: Database["public"]["Enums"]["feeding_side"]
          start_time: string
          volume_oz?: number | null
        }
        Update: {
          baby_profile_id?: string
          caregiver_id?: string | null
          created_at?: string
          duration_seconds?: number | null
          end_time?: string | null
          id?: string
          notes?: string | null
          side?: Database["public"]["Enums"]["feeding_side"]
          start_time?: string
          volume_oz?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "pumping_sessions_baby_profile_id_fkey"
            columns: ["baby_profile_id"]
            isOneToOne: false
            referencedRelation: "baby_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pumping_sessions_caregiver_id_fkey"
            columns: ["caregiver_id"]
            isOneToOne: false
            referencedRelation: "caregivers"
            referencedColumns: ["id"]
          },
        ]
      }
      sleep_sessions: {
        Row: {
          baby_profile_id: string
          caregiver_id: string | null
          created_at: string
          duration_seconds: number | null
          end_time: string | null
          id: string
          notes: string | null
          sleep_type: Database["public"]["Enums"]["sleep_type"]
          start_time: string
        }
        Insert: {
          baby_profile_id: string
          caregiver_id?: string | null
          created_at?: string
          duration_seconds?: number | null
          end_time?: string | null
          id?: string
          notes?: string | null
          sleep_type?: Database["public"]["Enums"]["sleep_type"]
          start_time: string
        }
        Update: {
          baby_profile_id?: string
          caregiver_id?: string | null
          created_at?: string
          duration_seconds?: number | null
          end_time?: string | null
          id?: string
          notes?: string | null
          sleep_type?: Database["public"]["Enums"]["sleep_type"]
          start_time?: string
        }
        Relationships: [
          {
            foreignKeyName: "sleep_sessions_baby_profile_id_fkey"
            columns: ["baby_profile_id"]
            isOneToOne: false
            referencedRelation: "baby_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sleep_sessions_caregiver_id_fkey"
            columns: ["caregiver_id"]
            isOneToOne: false
            referencedRelation: "caregivers"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      claim_invite: {
        Args: { _display_name: string; _invite_code: string; _user_id: string }
        Returns: Json
      }
      get_user_family_ids: { Args: { _user_id: string }; Returns: string[] }
    }
    Enums: {
      caregiver_role: "owner" | "member"
      color_note: "normal" | "unusual" | "bloody"
      content_type: "breast_milk" | "formula" | "mixed"
      diaper_type: "pee" | "poop" | "both"
      feeding_side: "left" | "right" | "both"
      sleep_type: "nap" | "night"
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
      caregiver_role: ["owner", "member"],
      color_note: ["normal", "unusual", "bloody"],
      content_type: ["breast_milk", "formula", "mixed"],
      diaper_type: ["pee", "poop", "both"],
      feeding_side: ["left", "right", "both"],
      sleep_type: ["nap", "night"],
    },
  },
} as const
