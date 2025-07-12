export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      admission_dashboard: {
        Row: {
          allotted_school: string | null
          block: string | null
          campus: string | null
          caste: string | null
          cfr_comments: string | null
          cfr_status: string | null
          city: string | null
          created_at: string | null
          current_work: string | null
          date_of_testing: string | null
          district: string | null
          exam_centre: string | null
          exam_mode: string | null
          final_marks: number | null
          final_notes: string | null
          gender: string | null
          id: string
          interview_date: string | null
          interview_mode: string | null
          joining_status: string | null
          last_updated: string | null
          lr_comments: string | null
          lr_status: string | null
          market: string | null
          mobile_no: string
          name: string | null
          offer_letter_status: string | null
          partner: string | null
          qualification: string | null
          qualifying_school: string | null
          set_name: string | null
          stage: string | null
          status: string | null
          triptis_notes: string | null
          unique_number: string | null
          updated_at: string | null
          whatsapp_number: string | null
        }
        Insert: {
          allotted_school?: string | null
          block?: string | null
          campus?: string | null
          caste?: string | null
          cfr_comments?: string | null
          cfr_status?: string | null
          city?: string | null
          created_at?: string | null
          current_work?: string | null
          date_of_testing?: string | null
          district?: string | null
          exam_centre?: string | null
          exam_mode?: string | null
          final_marks?: number | null
          final_notes?: string | null
          gender?: string | null
          id?: string
          interview_date?: string | null
          interview_mode?: string | null
          joining_status?: string | null
          last_updated?: string | null
          lr_comments?: string | null
          lr_status?: string | null
          market?: string | null
          mobile_no: string
          name?: string | null
          offer_letter_status?: string | null
          partner?: string | null
          qualification?: string | null
          qualifying_school?: string | null
          set_name?: string | null
          stage?: string | null
          status?: string | null
          triptis_notes?: string | null
          unique_number?: string | null
          updated_at?: string | null
          whatsapp_number?: string | null
        }
        Update: {
          allotted_school?: string | null
          block?: string | null
          campus?: string | null
          caste?: string | null
          cfr_comments?: string | null
          cfr_status?: string | null
          city?: string | null
          created_at?: string | null
          current_work?: string | null
          date_of_testing?: string | null
          district?: string | null
          exam_centre?: string | null
          exam_mode?: string | null
          final_marks?: number | null
          final_notes?: string | null
          gender?: string | null
          id?: string
          interview_date?: string | null
          interview_mode?: string | null
          joining_status?: string | null
          last_updated?: string | null
          lr_comments?: string | null
          lr_status?: string | null
          market?: string | null
          mobile_no?: string
          name?: string | null
          offer_letter_status?: string | null
          partner?: string | null
          qualification?: string | null
          qualifying_school?: string | null
          set_name?: string | null
          stage?: string | null
          status?: string | null
          triptis_notes?: string | null
          unique_number?: string | null
          updated_at?: string | null
          whatsapp_number?: string | null
        }
        Relationships: []
      }
      campus_options: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      filter_presets: {
        Row: {
          created_at: string | null
          filters: Json
          id: string
          is_shared: boolean | null
          name: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          filters: Json
          id?: string
          is_shared?: boolean | null
          name: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          filters?: Json
          id?: string
          is_shared?: boolean | null
          name?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      offer_audit_log: {
        Row: {
          action_type: string
          applicant_id: string | null
          created_at: string
          details: Json | null
          id: string
          template_id: string | null
          user_id: string | null
        }
        Insert: {
          action_type: string
          applicant_id?: string | null
          created_at?: string
          details?: Json | null
          id?: string
          template_id?: string | null
          user_id?: string | null
        }
        Update: {
          action_type?: string
          applicant_id?: string | null
          created_at?: string
          details?: Json | null
          id?: string
          template_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "offer_audit_log_applicant_id_fkey"
            columns: ["applicant_id"]
            isOneToOne: false
            referencedRelation: "admission_dashboard"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offer_audit_log_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "offer_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      offer_history: {
        Row: {
          applicant_id: string
          bounced_at: string | null
          created_at: string
          delivered_at: string | null
          email_status: string
          error_message: string | null
          id: string
          message_id: string | null
          opened_at: string | null
          pdf_urls: Json | null
          sent_at: string | null
          template_version_used: Json
          updated_at: string
        }
        Insert: {
          applicant_id: string
          bounced_at?: string | null
          created_at?: string
          delivered_at?: string | null
          email_status?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          opened_at?: string | null
          pdf_urls?: Json | null
          sent_at?: string | null
          template_version_used: Json
          updated_at?: string
        }
        Update: {
          applicant_id?: string
          bounced_at?: string | null
          created_at?: string
          delivered_at?: string | null
          email_status?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          opened_at?: string | null
          pdf_urls?: Json | null
          sent_at?: string | null
          template_version_used?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "offer_history_applicant_id_fkey"
            columns: ["applicant_id"]
            isOneToOne: false
            referencedRelation: "admission_dashboard"
            referencedColumns: ["id"]
          },
        ]
      }
      offer_placeholders: {
        Row: {
          created_at: string
          data_source: string
          description: string | null
          display_name: string
          id: string
          is_active: boolean
          placeholder_key: string
        }
        Insert: {
          created_at?: string
          data_source: string
          description?: string | null
          display_name: string
          id?: string
          is_active?: boolean
          placeholder_key: string
        }
        Update: {
          created_at?: string
          data_source?: string
          description?: string | null
          display_name?: string
          id?: string
          is_active?: boolean
          placeholder_key?: string
        }
        Relationships: []
      }
      offer_templates: {
        Row: {
          created_at: string
          created_by: string | null
          html_content: string
          id: string
          is_active: boolean
          language: string
          name: string
          program_type: string | null
          template_type: string
          updated_at: string
          version_number: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          html_content: string
          id?: string
          is_active?: boolean
          language: string
          name: string
          program_type?: string | null
          template_type: string
          updated_at?: string
          version_number?: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          html_content?: string
          id?: string
          is_active?: boolean
          language?: string
          name?: string
          program_type?: string | null
          template_type?: string
          updated_at?: string
          version_number?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
    Enums: {},
  },
} as const
