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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      ziyarat: {
        Row: {
          classification: "ziyarat" | "munajat"
          content_ar: string
          content_en: string
          created_at: string
          created_by: string | null
          id: string
          is_published: boolean
          slug: string
          title_ar: string
          title_en: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          classification: "ziyarat" | "munajat"
          content_ar: string
          content_en: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_published?: boolean
          slug: string
          title_ar: string
          title_en: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          classification?: "ziyarat" | "munajat"
          content_ar?: string
          content_en?: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_published?: boolean
          slug?: string
          title_ar?: string
          title_en?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ziyarat_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ziyarat_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      articles: {
        Row: {
          id: string
          title: string
          topic: string
          article_link: string
          cover_image_url: string | null
          cover_image_path: string | null
          short_description: string | null
          publish_date: string
          is_published: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          topic: string
          article_link: string
          cover_image_url?: string | null
          cover_image_path?: string | null
          short_description?: string | null
          publish_date?: string
          is_published?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          topic?: string
          article_link?: string
          cover_image_url?: string | null
          cover_image_path?: string | null
          short_description?: string | null
          publish_date?: string
          is_published?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      reference_books: {
        Row: { id: string; name: string; volume_count: number; description: string | null; is_active: boolean; position: number; created_at: string }
        Insert: { id?: string; name: string; volume_count: number; description?: string | null; is_active?: boolean; position?: number; created_at?: string }
        Update: { id?: string; name?: string; volume_count?: number; description?: string | null; is_active?: boolean; position?: number; created_at?: string }
        Relationships: []
      }
      audit_log: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          entity_id: string | null
          entity_type: string
          id: string
          ip: string | null
          user_cnic: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type: string
          id?: string
          ip?: string | null
          user_cnic?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type?: string
          id?: string
          ip?: string | null
          user_cnic?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      books: {
        Row: {
          archive_url: string | null
          author: string | null
          cover_url: string | null
          created_at: string
          created_by: string | null
          description: string | null
          download_url: string
          id: string
          is_published: boolean
          language: string | null
          pages: number | null
          position: number
          title: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          archive_url?: string | null
          author?: string | null
          cover_url?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          download_url: string
          id?: string
          is_published?: boolean
          language?: string | null
          pages?: number | null
          position?: number
          title: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          archive_url?: string | null
          author?: string | null
          cover_url?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          download_url?: string
          id?: string
          is_published?: boolean
          language?: string | null
          pages?: number | null
          position?: number
          title?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "books_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "books_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      cnic_login_attempts: {
        Row: {
          attempted_at: string
          cnic: string | null
          id: string
          ip: string | null
          success: boolean
        }
        Insert: {
          attempted_at?: string
          cnic?: string | null
          id?: string
          ip?: string | null
          success?: boolean
        }
        Update: {
          attempted_at?: string
          cnic?: string | null
          id?: string
          ip?: string | null
          success?: boolean
        }
        Relationships: []
      }
      hadith_references: {
        Row: {
          book_name: string
          created_at: string
          hadith_id: string
          hadith_number: string | null
          id: string
          page: string | null
          reliability_note: string | null
          volume: string | null
        }
        Insert: {
          book_name: string
          created_at?: string
          hadith_id: string
          hadith_number?: string | null
          id?: string
          page?: string | null
          reliability_note?: string | null
          volume?: string | null
        }
        Update: {
          book_name?: string
          created_at?: string
          hadith_id?: string
          hadith_number?: string | null
          id?: string
          page?: string | null
          reliability_note?: string | null
          volume?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hadith_references_hadith_id_fkey"
            columns: ["hadith_id"]
            isOneToOne: false
            referencedRelation: "hadiths"
            referencedColumns: ["id"]
          },
        ]
      }
      hadith_tags: {
        Row: {
          hadith_id: string
          tag_id: string
        }
        Insert: {
          hadith_id: string
          tag_id: string
        }
        Update: {
          hadith_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "hadith_tags_hadith_id_fkey"
            columns: ["hadith_id"]
            isOneToOne: false
            referencedRelation: "hadiths"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hadith_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      hadiths: {
        Row: {
          arabic_normalized: string | null
          arabic_text: string
          created_at: string
          created_by: string | null
          grade: string | null
          id: string
          is_published: boolean
          majlis_id: string
          notes: string | null
          position: number
          translation_en: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          arabic_normalized?: string | null
          arabic_text: string
          created_at?: string
          created_by?: string | null
          grade?: string | null
          id?: string
          is_published?: boolean
          majlis_id: string
          notes?: string | null
          position?: number
          translation_en: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          arabic_normalized?: string | null
          arabic_text?: string
          created_at?: string
          created_by?: string | null
          grade?: string | null
          id?: string
          is_published?: boolean
          majlis_id?: string
          notes?: string | null
          position?: number
          translation_en?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hadiths_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hadiths_majlis_id_fkey"
            columns: ["majlis_id"]
            isOneToOne: false
            referencedRelation: "majalis"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hadiths_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      majalis: {
        Row: {
          created_at: string
          created_by: string | null
          date: string
          description: string | null
          id: string
          is_published: boolean
          title: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          date: string
          description?: string | null
          id?: string
          is_published?: boolean
          title: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          date?: string
          description?: string | null
          id?: string
          is_published?: boolean
          title?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "majalis_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "majalis_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      tags: {
        Row: {
          created_at: string
          id: string
          name: string
          slug: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          slug: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          cnic: string
          created_at: string
          full_name: string
          id: string
          is_active: boolean
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
        }
        Insert: {
          cnic: string
          created_at?: string
          full_name: string
          id?: string
          is_active?: boolean
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
        }
        Update: {
          cnic?: string
          created_at?: string
          full_name?: string
          id?: string
          is_active?: boolean
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
        }
        Relationships: []
      }
      monthly_unique_visitors: {
        Row: { year: number; month: number; unique_visitors: number; created_at: string; updated_at: string }
        Insert: { year: number; month: number; unique_visitors?: number; created_at?: string; updated_at?: string }
        Update: { year?: number; month?: number; unique_visitors?: number; created_at?: string; updated_at?: string }
        Relationships: []
      }
      monthly_visitor_keys: {
        Row: { year: number; month: number; visitor_hash: string; first_seen_at: string }
        Insert: { year: number; month: number; visitor_hash: string; first_seen_at?: string }
        Update: { year?: number; month?: number; visitor_hash?: string; first_seen_at?: string }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      record_monthly_unique_visitor: { Args: { p_year: number; p_month: number; p_visitor_hash: string }; Returns: undefined }
      cleanup_monthly_visitor_keys: { Args: { p_retention_months?: number }; Returns: undefined }
    }
    Enums: {
      app_role: "admin" | "scholar" | "editor"
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
      app_role: ["admin", "scholar", "editor"],
    },
  },
} as const
