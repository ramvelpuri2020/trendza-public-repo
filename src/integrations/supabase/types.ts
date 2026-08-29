export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          username: string | null
          onboarding_completed: boolean | null
          onboarding_step: string | null
          onboarding_data: Json | null
          style_vibe: string | null
          analysis_result: Json | null
          selected_image: string | null
          last_analysis_result: Json | null
          last_analysis_date: string | null
          user_preferences: Json | null
          payment_completed: boolean | null
          test_photo_uploaded: boolean | null
          test_photo_url: string | null
          analysis_completed: boolean | null
          last_analysis_score: number | null
          onboarding_started_at: string | null
          onboarding_completed_at: string | null
          subscription_status: string | null
          subscription_expires_at: string | null
          subscription_product_id: string | null
          subscription_platform: string | null
          trial_started_at: string | null
          trial_expires_at: string | null
          trial_converted_at: string | null
          is_in_trial: boolean | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          username?: string | null
          onboarding_completed?: boolean | null
          onboarding_step?: string | null
          onboarding_data?: Json | null
          style_vibe?: string | null
          analysis_result?: Json | null
          selected_image?: string | null
          last_analysis_result?: Json | null
          last_analysis_date?: string | null
          user_preferences?: Json | null
          payment_completed?: boolean | null
          test_photo_uploaded?: boolean | null
          test_photo_url?: string | null
          analysis_completed?: boolean | null
          last_analysis_score?: number | null
          onboarding_started_at?: string | null
          onboarding_completed_at?: string | null
          subscription_status?: string | null
          subscription_expires_at?: string | null
          subscription_product_id?: string | null
          subscription_platform?: string | null
          trial_started_at?: string | null
          trial_expires_at?: string | null
          trial_converted_at?: string | null
          is_in_trial?: boolean | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          username?: string | null
          onboarding_completed?: boolean | null
          onboarding_step?: string | null
          onboarding_data?: Json | null
          style_vibe?: string | null
          analysis_result?: Json | null
          selected_image?: string | null
          last_analysis_result?: Json | null
          last_analysis_date?: string | null
          user_preferences?: Json | null
          payment_completed?: boolean | null
          test_photo_uploaded?: boolean | null
          test_photo_url?: string | null
          analysis_completed?: boolean | null
          last_analysis_score?: number | null
          onboarding_started_at?: string | null
          onboarding_completed_at?: string | null
          subscription_status?: string | null
          subscription_expires_at?: string | null
          subscription_product_id?: string | null
          subscription_platform?: string | null
          trial_started_at?: string | null
          trial_expires_at?: string | null
          trial_converted_at?: string | null
          is_in_trial?: boolean | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      // Add new onboarding_v2 table
      onboarding_v2: {
        Row: {
          id: string
          user_id: string
          step: string
          step_data: Json | null
          completed: boolean
          started_at: string
          completed_at: string | null
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          step: string
          step_data?: Json | null
          completed?: boolean
          started_at?: string
          completed_at?: string | null
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          step?: string
          step_data?: Json | null
          completed?: boolean
          started_at?: string
          completed_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "onboarding_v2_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      // Add new user_analytics table
      user_analytics: {
        Row: {
          id: string
          user_id: string
          action: string
          data: Json | null
          timestamp: string
        }
        Insert: {
          id?: string
          user_id: string
          action: string
          data?: Json | null
          timestamp?: string
        }
        Update: {
          id?: string
          user_id?: string
          action?: string
          data?: Json | null
          timestamp?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_analytics_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      // Add new analysis_results table
      analysis_results: {
        Row: {
          id: string
          user_id: string
          image_url: string | null
          analysis_data: Json | null
          score: number | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          image_url?: string | null
          analysis_data?: Json | null
          score?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          image_url?: string | null
          analysis_data?: Json | null
          score?: number | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "analysis_results_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      saved_outfits: {
        Row: {
          created_at: string
          id: string
          image_url: string
          tags: string[] | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          image_url: string
          tags?: string[] | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string
          tags?: string[] | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_outfits_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      style_analyses: {
        Row: {
          breakdown: Json
          created_at: string
          feedback: string
          id: string
          image_url: string
          last_scan_date: string | null
          raw_analysis: string | null
          scan_date: string | null
          streak_count: number | null
          thumbnail_url: string | null
          tips: Json | null
          total_score: number
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          breakdown: Json
          created_at?: string
          feedback: string
          id?: string
          image_url: string
          last_scan_date?: string | null
          raw_analysis?: string | null
          scan_date?: string | null
          streak_count?: number | null
          thumbnail_url?: string | null
          tips?: Json | null
          total_score: number
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          breakdown?: Json
          created_at?: string
          feedback?: string
          id?: string
          image_url?: string
          last_scan_date?: string | null
          raw_analysis?: string | null
          scan_date?: string | null
          streak_count?: number | null
          thumbnail_url?: string | null
          tips?: Json | null
          total_score?: number
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_achievements: {
        Row: {
          achieved_at: string
          achievement_type: string
          id: string
          metadata: Json | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          achieved_at?: string
          achievement_type: string
          id?: string
          metadata?: Json | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          achieved_at?: string
          achievement_type?: string
          id?: string
          metadata?: Json | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_achievements_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      // Add trendza_closet_items table
      planner_outfits: {
        Row: {
          id: string
          user_id: string
          outfit_id: string | null
          planned_date: string
          notes: string | null
          outfit_data: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          outfit_id?: string | null
          planned_date: string
          notes?: string | null
          outfit_data?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          outfit_id?: string | null
          planned_date?: string
          notes?: string | null
          outfit_data?: Json
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "planner_outfits_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "planner_outfits_outfit_id_fkey"
            columns: ["outfit_id"]
            isOneToOne: false
            referencedRelation: "trendza_outfits"
            referencedColumns: ["id"]
          },
        ]
      }
      planner_generated_images: {
        Row: {
          id: string
          user_id: string
          outfit_id: string
          planned_date: string
          image_url: string | null
          status: string
          error_message: string | null
          metadata: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          outfit_id: string
          planned_date: string
          image_url?: string | null
          status?: string
          error_message?: string | null
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          outfit_id?: string
          planned_date?: string
          image_url?: string | null
          status?: string
          error_message?: string | null
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "planner_generated_images_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "planner_generated_images_outfit_id_fkey"
            columns: ["outfit_id"]
            isOneToOne: false
            referencedRelation: "trendza_outfits"
            referencedColumns: ["id"]
          },
        ]
      }
      trendza_closet_items: {
        Row: {
          id: string
          user_id: string
          source_image_url: string | null
          title: string | null
          brand: string | null
          category: string | null
          color: string | null
          season: string | null
          tags: Json
          attributes: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          source_image_url?: string | null
          title?: string | null
          brand?: string | null
          category?: string | null
          color?: string | null
          season?: string | null
          tags?: Json
          attributes?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          source_image_url?: string | null
          title?: string | null
          brand?: string | null
          category?: string | null
          color?: string | null
          season?: string | null
          tags?: Json
          attributes?: Json
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "trendza_closet_items_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      // Add trendza_outfits table
      trendza_outfits: {
        Row: {
          id: string
          user_id: string
          name: string | null
          item_ids: string[]
          score: number | null
          rationale: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name?: string | null
          item_ids?: string[]
          score?: number | null
          rationale?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string | null
          item_ids?: string[]
          score?: number | null
          rationale?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "trendza_outfits_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
