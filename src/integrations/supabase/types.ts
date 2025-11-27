export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)";
  };
  public: {
    Tables: {
      admission_dashboard: {
        Row: {
          allotted_school: string | null;
          block: string | null;
          campus: string | null;
          caste: string | null;
          cfr_comments: string | null;
          cfr_status: string | null;
          city: string | null;
          created_at: string | null;
          current_work: string | null;
          date_of_testing: string | null;
          district: string | null;
          exam_centre: string | null;
          exam_mode: string | null;
          final_marks: number | null;
          final_notes: string | null;
          gender: string | null;
          id: string;
          interview_date: string | null;
          interview_mode: string | null;
          joining_status: string | null;
          last_updated: string | null;
          lr_comments: string | null;
          lr_status: string | null;
          market: string | null;
          mobile_no: string;
          name: string | null;
          offer_letter_status: string | null;
          partner: string | null;
          qualification: string | null;
          qualifying_school: string | null;
          set_name: string | null;
          stage: string | null;
          status: string | null;
          triptis_notes: string | null;
          unique_number: string | null;
          updated_at: string | null;
          whatsapp_number: string | null;
        };
        Insert: {
          allotted_school?: string | null;
          block?: string | null;
          campus?: string | null;
          caste?: string | null;
          cfr_comments?: string | null;
          cfr_status?: string | null;
          city?: string | null;
          created_at?: string | null;
          current_work?: string | null;
          date_of_testing?: string | null;
          district?: string | null;
          exam_centre?: string | null;
          exam_mode?: string | null;
          final_marks?: number | null;
          final_notes?: string | null;
          gender?: string | null;
          id?: string;
          interview_date?: string | null;
          interview_mode?: string | null;
          joining_status?: string | null;
          last_updated?: string | null;
          lr_comments?: string | null;
          lr_status?: string | null;
          market?: string | null;
          mobile_no: string;
          name?: string | null;
          offer_letter_status?: string | null;
          partner?: string | null;
          qualification?: string | null;
          qualifying_school?: string | null;
          set_name?: string | null;
          stage?: string | null;
          status?: string | null;
          triptis_notes?: string | null;
          unique_number?: string | null;
          updated_at?: string | null;
          whatsapp_number?: string | null;
        };
        Update: {
          allotted_school?: string | null;
          block?: string | null;
          campus?: string | null;
          caste?: string | null;
          cfr_comments?: string | null;
          cfr_status?: string | null;
          city?: string | null;
          created_at?: string | null;
          current_work?: string | null;
          date_of_testing?: string | null;
          district?: string | null;
          exam_centre?: string | null;
          exam_mode?: string | null;
          final_marks?: number | null;
          final_notes?: string | null;
          gender?: string | null;
          id?: string;
          interview_date?: string | null;
          interview_mode?: string | null;
          joining_status?: string | null;
          last_updated?: string | null;
          lr_comments?: string | null;
          lr_status?: string | null;
          market?: string | null;
          mobile_no?: string;
          name?: string | null;
          offer_letter_status?: string | null;
          partner?: string | null;
          qualification?: string | null;
          qualifying_school?: string | null;
          set_name?: string | null;
          stage?: string | null;
          status?: string | null;
          triptis_notes?: string | null;
          unique_number?: string | null;
          updated_at?: string | null;
          whatsapp_number?: string | null;
        };
        Relationships: [];
      };
      applicant_comments: {
        Row: {
          applicant_id: string;
          comment_text: string;
          created_at: string;
          id: string;
          stage: string | null;
          updated_at: string;
          user_id: string | null;
          user_name: string;
        };
        Insert: {
          applicant_id: string;
          comment_text: string;
          created_at?: string;
          id?: string;
          stage?: string | null;
          updated_at?: string;
          user_id?: string | null;
          user_name: string;
        };
        Update: {
          applicant_id?: string;
          comment_text?: string;
          created_at?: string;
          id?: string;
          stage?: string | null;
          updated_at?: string;
          user_id?: string | null;
          user_name?: string;
        };
        Relationships: [
          {
            foreignKeyName: "applicant_comments_applicant_id_fkey";
            columns: ["applicant_id"];
            isOneToOne: false;
            referencedRelation: "admission_dashboard";
            referencedColumns: ["id"];
          },
        ];
      };
      assessment_questions: {
        Row: {
          assessment_id: string;
          created_at: string;
          custom_points: number | null;
          order_index: number;
          question_id: string;
          question_version: number;
        };
        Insert: {
          assessment_id: string;
          created_at?: string;
          custom_points?: number | null;
          order_index: number;
          question_id: string;
          question_version: number;
        };
        Update: {
          assessment_id?: string;
          created_at?: string;
          custom_points?: number | null;
          order_index?: number;
          question_id?: string;
          question_version?: number;
        };
        Relationships: [
          {
            foreignKeyName: "assessment_questions_question_id_fkey";
            columns: ["question_id"];
            isOneToOne: false;
            referencedRelation: "questions";
            referencedColumns: ["id"];
          },
        ];
      };
      campus_options: {
        Row: {
          created_at: string;
          id: string;
          is_active: boolean;
          name: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          is_active?: boolean;
          name: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          is_active?: boolean;
          name?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      filter_presets: {
        Row: {
          created_at: string | null;
          filters: Json;
          id: string;
          is_shared: boolean | null;
          name: string;
          updated_at: string | null;
          user_id: string | null;
        };
        Insert: {
          created_at?: string | null;
          filters: Json;
          id?: string;
          is_shared?: boolean | null;
          name: string;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Update: {
          created_at?: string | null;
          filters?: Json;
          id?: string;
          is_shared?: boolean | null;
          name?: string;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Relationships: [];
      };
      imported_questions: {
        Row: {
          correct_answer: Json;
          created_at: string;
          difficulty_level: Database["public"]["Enums"]["difficulty_level"];
          explanation: string | null;
          id: string;
          import_batch_id: string | null;
          imported_at: string;
          imported_by: string | null;
          is_processed: boolean;
          language: string;
          options: Json | null;
          points: number;
          question_text: string;
          question_type: Database["public"]["Enums"]["question_type"];
          tags: string[] | null;
          time_limit_seconds: number | null;
          updated_at: string;
        };
        Insert: {
          correct_answer: Json;
          created_at?: string;
          difficulty_level?: Database["public"]["Enums"]["difficulty_level"];
          explanation?: string | null;
          id?: string;
          import_batch_id?: string | null;
          imported_at?: string;
          imported_by?: string | null;
          is_processed?: boolean;
          language?: string;
          options?: Json | null;
          points?: number;
          question_text: string;
          question_type: Database["public"]["Enums"]["question_type"];
          tags?: string[] | null;
          time_limit_seconds?: number | null;
          updated_at?: string;
        };
        Update: {
          correct_answer?: Json;
          created_at?: string;
          difficulty_level?: Database["public"]["Enums"]["difficulty_level"];
          explanation?: string | null;
          id?: string;
          import_batch_id?: string | null;
          imported_at?: string;
          imported_by?: string | null;
          is_processed?: boolean;
          language?: string;
          options?: Json | null;
          points?: number;
          question_text?: string;
          question_type?: Database["public"]["Enums"]["question_type"];
          tags?: string[] | null;
          time_limit_seconds?: number | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      offer_audit_log: {
        Row: {
          action_type: string;
          applicant_id: string | null;
          created_at: string;
          details: Json | null;
          id: string;
          template_id: string | null;
          user_id: string | null;
        };
        Insert: {
          action_type: string;
          applicant_id?: string | null;
          created_at?: string;
          details?: Json | null;
          id?: string;
          template_id?: string | null;
          user_id?: string | null;
        };
        Update: {
          action_type?: string;
          applicant_id?: string | null;
          created_at?: string;
          details?: Json | null;
          id?: string;
          template_id?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "offer_audit_log_applicant_id_fkey";
            columns: ["applicant_id"];
            isOneToOne: false;
            referencedRelation: "admission_dashboard";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "offer_audit_log_template_id_fkey";
            columns: ["template_id"];
            isOneToOne: false;
            referencedRelation: "offer_templates";
            referencedColumns: ["id"];
          },
        ];
      };
      offer_history: {
        Row: {
          applicant_id: string;
          bounced_at: string | null;
          created_at: string;
          delivered_at: string | null;
          email_status: string;
          error_message: string | null;
          id: string;
          message_id: string | null;
          opened_at: string | null;
          pdf_urls: Json | null;
          sent_at: string | null;
          template_version_used: Json;
          updated_at: string;
        };
        Insert: {
          applicant_id: string;
          bounced_at?: string | null;
          created_at?: string;
          delivered_at?: string | null;
          email_status?: string;
          error_message?: string | null;
          id?: string;
          message_id?: string | null;
          opened_at?: string | null;
          pdf_urls?: Json | null;
          sent_at?: string | null;
          template_version_used: Json;
          updated_at?: string;
        };
        Update: {
          applicant_id?: string;
          bounced_at?: string | null;
          created_at?: string;
          delivered_at?: string | null;
          email_status?: string;
          error_message?: string | null;
          id?: string;
          message_id?: string | null;
          opened_at?: string | null;
          pdf_urls?: Json | null;
          sent_at?: string | null;
          template_version_used?: Json;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "offer_history_applicant_id_fkey";
            columns: ["applicant_id"];
            isOneToOne: false;
            referencedRelation: "admission_dashboard";
            referencedColumns: ["id"];
          },
        ];
      };
      offer_placeholders: {
        Row: {
          conditional_logic: Json | null;
          created_at: string;
          data_source: string;
          description: string | null;
          display_name: string;
          field_mapping: Json | null;
          id: string;
          is_active: boolean;
          placeholder_key: string;
        };
        Insert: {
          conditional_logic?: Json | null;
          created_at?: string;
          data_source: string;
          description?: string | null;
          display_name: string;
          field_mapping?: Json | null;
          id?: string;
          is_active?: boolean;
          placeholder_key: string;
        };
        Update: {
          conditional_logic?: Json | null;
          created_at?: string;
          data_source?: string;
          description?: string | null;
          display_name?: string;
          field_mapping?: Json | null;
          id?: string;
          is_active?: boolean;
          placeholder_key?: string;
        };
        Relationships: [];
      };
      offer_templates: {
        Row: {
          created_at: string;
          created_by: string | null;
          html_content: string;
          id: string;
          is_active: boolean;
          language: string;
          name: string;
          program_type: string | null;
          template_type: string;
          updated_at: string;
          version_number: number;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          html_content: string;
          id?: string;
          is_active?: boolean;
          language: string;
          name: string;
          program_type?: string | null;
          template_type: string;
          updated_at?: string;
          version_number?: number;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          html_content?: string;
          id?: string;
          is_active?: boolean;
          language?: string;
          name?: string;
          program_type?: string | null;
          template_type?: string;
          updated_at?: string;
          version_number?: number;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          created_at: string;
          display_name: string | null;
          id: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          avatar_url?: string | null;
          created_at?: string;
          display_name?: string | null;
          id?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          avatar_url?: string | null;
          created_at?: string;
          display_name?: string | null;
          id?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      question_tags: {
        Row: {
          created_at: string;
          description: string | null;
          display_name: string;
          id: string;
          slug: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          display_name: string;
          id?: string;
          slug: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          display_name?: string;
          id?: string;
          slug?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      question_versions: {
        Row: {
          change_summary: string | null;
          correct_answer: Json;
          difficulty_level: Database["public"]["Enums"]["difficulty_level"];
          edited_at: string;
          edited_by: string | null;
          explanation: string | null;
          id: string;
          language: string;
          options: Json | null;
          points: number;
          question_id: string;
          question_text: string;
          question_type: Database["public"]["Enums"]["question_type"];
          tags: string[] | null;
          time_limit_seconds: number | null;
          version_number: number;
        };
        Insert: {
          change_summary?: string | null;
          correct_answer: Json;
          difficulty_level: Database["public"]["Enums"]["difficulty_level"];
          edited_at?: string;
          edited_by?: string | null;
          explanation?: string | null;
          id?: string;
          language: string;
          options?: Json | null;
          points: number;
          question_id: string;
          question_text: string;
          question_type: Database["public"]["Enums"]["question_type"];
          tags?: string[] | null;
          time_limit_seconds?: number | null;
          version_number: number;
        };
        Update: {
          change_summary?: string | null;
          correct_answer?: Json;
          difficulty_level?: Database["public"]["Enums"]["difficulty_level"];
          edited_at?: string;
          edited_by?: string | null;
          explanation?: string | null;
          id?: string;
          language?: string;
          options?: Json | null;
          points?: number;
          question_id?: string;
          question_text?: string;
          question_type?: Database["public"]["Enums"]["question_type"];
          tags?: string[] | null;
          time_limit_seconds?: number | null;
          version_number?: number;
        };
        Relationships: [
          {
            foreignKeyName: "question_versions_question_id_fkey";
            columns: ["question_id"];
            isOneToOne: false;
            referencedRelation: "questions";
            referencedColumns: ["id"];
          },
        ];
      };
      questions: {
        Row: {
          correct_answer: Json;
          created_at: string;
          created_by: string | null;
          difficulty_level: Database["public"]["Enums"]["difficulty_level"];
          explanation: string | null;
          id: string;
          language: string;
          options: Json | null;
          points: number;
          question_text: string;
          question_type: Database["public"]["Enums"]["question_type"];
          status: Database["public"]["Enums"]["question_status"];
          tags: string[] | null;
          time_limit_seconds: number | null;
          updated_at: string;
          version_number: number;
        };
        Insert: {
          correct_answer: Json;
          created_at?: string;
          created_by?: string | null;
          difficulty_level?: Database["public"]["Enums"]["difficulty_level"];
          explanation?: string | null;
          id?: string;
          language?: string;
          options?: Json | null;
          points?: number;
          question_text: string;
          question_type: Database["public"]["Enums"]["question_type"];
          status?: Database["public"]["Enums"]["question_status"];
          tags?: string[] | null;
          time_limit_seconds?: number | null;
          updated_at?: string;
          version_number?: number;
        };
        Update: {
          correct_answer?: Json;
          created_at?: string;
          created_by?: string | null;
          difficulty_level?: Database["public"]["Enums"]["difficulty_level"];
          explanation?: string | null;
          id?: string;
          language?: string;
          options?: Json | null;
          points?: number;
          question_text?: string;
          question_type?: Database["public"]["Enums"]["question_type"];
          status?: Database["public"]["Enums"]["question_status"];
          tags?: string[] | null;
          time_limit_seconds?: number | null;
          updated_at?: string;
          version_number?: number;
        };
        Relationships: [];
      };
      system_logs: {
        Row: {
          action_type: string;
          created_at: string;
          description: string | null;
          entity_id: string | null;
          entity_type: string | null;
          id: string;
          metadata: Json | null;
          user_id: string | null;
          user_name: string | null;
        };
        Insert: {
          action_type: string;
          created_at?: string;
          description?: string | null;
          entity_id?: string | null;
          entity_type?: string | null;
          id?: string;
          metadata?: Json | null;
          user_id?: string | null;
          user_name?: string | null;
        };
        Update: {
          action_type?: string;
          created_at?: string;
          description?: string | null;
          entity_id?: string | null;
          entity_type?: string | null;
          id?: string;
          metadata?: Json | null;
          user_id?: string | null;
          user_name?: string | null;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      difficulty_level: "easy" | "medium" | "hard";
      question_status: "active" | "archived" | "draft";
      question_type:
        | "multiple_choice"
        | "true_false"
        | "short_answer"
        | "long_answer"
        | "coding"
        | "fill_in_blank";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      difficulty_level: ["easy", "medium", "hard"],
      question_status: ["active", "archived", "draft"],
      question_type: [
        "multiple_choice",
        "true_false",
        "short_answer",
        "long_answer",
        "coding",
        "fill_in_blank",
      ],
    },
  },
} as const;
