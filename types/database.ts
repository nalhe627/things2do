export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5";
  };
  public: {
    Tables: {
      agenda_items: {
        Row: {
          capacity: number | null;
          created_at: string | null;
          day_number: number | null;
          description: string | null;
          end_time: string | null;
          id: string;
          item_type: string | null;
          location_id: string | null;
          post_id: string;
          scheduled_date: string;
          speaker_or_performer: string | null;
          start_time: string | null;
          title: string;
          updated_at: string | null;
        };
        Insert: {
          capacity?: number | null;
          created_at?: string | null;
          day_number?: number | null;
          description?: string | null;
          end_time?: string | null;
          id?: string;
          item_type?: string | null;
          location_id?: string | null;
          post_id: string;
          scheduled_date: string;
          speaker_or_performer?: string | null;
          start_time?: string | null;
          title: string;
          updated_at?: string | null;
        };
        Update: {
          capacity?: number | null;
          created_at?: string | null;
          day_number?: number | null;
          description?: string | null;
          end_time?: string | null;
          id?: string;
          item_type?: string | null;
          location_id?: string | null;
          post_id?: string;
          scheduled_date?: string;
          speaker_or_performer?: string | null;
          start_time?: string | null;
          title?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "agenda_items_location_id_fkey";
            columns: ["location_id"];
            isOneToOne: false;
            referencedRelation: "locations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "agenda_items_post_id_fkey";
            columns: ["post_id"];
            isOneToOne: false;
            referencedRelation: "posts";
            referencedColumns: ["id"];
          }
        ];
      };
      locations: {
        Row: {
          address: string | null;
          city: string | null;
          country: string | null;
          created_at: string | null;
          id: string;
          latitude: number | null;
          longitude: number | null;
          name: string;
          state: string | null;
          updated_at: string | null;
          zip_code: string | null;
        };
        Insert: {
          address?: string | null;
          city?: string | null;
          country?: string | null;
          created_at?: string | null;
          id?: string;
          latitude?: number | null;
          longitude?: number | null;
          name: string;
          state?: string | null;
          updated_at?: string | null;
          zip_code?: string | null;
        };
        Update: {
          address?: string | null;
          city?: string | null;
          country?: string | null;
          created_at?: string | null;
          id?: string;
          latitude?: number | null;
          longitude?: number | null;
          name?: string;
          state?: string | null;
          updated_at?: string | null;
          zip_code?: string | null;
        };
        Relationships: [];
      };
      posts: {
        Row: {
          cost: number | null;
          created_at: string;
          description: string | null;
          end_date: string | null;
          end_time: string | null;
          how_to_find_us: string | null;
          id: string;
          image_urls: string[] | null;
          is_multi_day: boolean | null;
          location_id: string | null;
          postRankId: string | null;
          pricing_type: string | null;
          refund_policy: string | null;
          refund_policy_link: string | null;
          short_description: string | null;
          start_date: string | null;
          start_time: string | null;
          tags: string[] | null;
          ticket_link: string | null;
          title: string;
          updated_at: string;
          userId: string;
        };
        Insert: {
          cost?: number | null;
          created_at?: string;
          description?: string | null;
          end_date?: string | null;
          end_time?: string | null;
          how_to_find_us?: string | null;
          id?: string;
          image_urls?: string[] | null;
          is_multi_day?: boolean | null;
          location_id?: string | null;
          postRankId?: string | null;
          pricing_type?: string | null;
          refund_policy?: string | null;
          refund_policy_link?: string | null;
          short_description?: string | null;
          start_date?: string | null;
          start_time?: string | null;
          tags?: string[] | null;
          ticket_link?: string | null;
          title: string;
          updated_at?: string;
          userId: string;
        };
        Update: {
          cost?: number | null;
          created_at?: string;
          description?: string | null;
          end_date?: string | null;
          end_time?: string | null;
          how_to_find_us?: string | null;
          id?: string;
          image_urls?: string[] | null;
          is_multi_day?: boolean | null;
          location_id?: string | null;
          postRankId?: string | null;
          pricing_type?: string | null;
          refund_policy?: string | null;
          refund_policy_link?: string | null;
          short_description?: string | null;
          start_date?: string | null;
          start_time?: string | null;
          tags?: string[] | null;
          ticket_link?: string | null;
          title?: string;
          updated_at?: string;
          userId?: string;
        };
        Relationships: [
          {
            foreignKeyName: "posts_location_id_fkey";
            columns: ["location_id"];
            isOneToOne: false;
            referencedRelation: "locations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "posts_userid_fkey";
            columns: ["userId"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      reviews: {
        Row: {
          created_at: string;
          id: string;
          rating: number;
          reviewed_user_id: string;
          reviewer_id: string;
          text: string | null;
        };
        Insert: {
          created_at?: string;
          id?: string;
          rating: number;
          reviewed_user_id: string;
          reviewer_id: string;
          text?: string | null;
        };
        Update: {
          created_at?: string;
          id?: string;
          rating?: number;
          reviewed_user_id?: string;
          reviewer_id?: string;
          text?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "reviews_reviewed_user_id_fkey";
            columns: ["reviewed_user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reviews_reviewer_id_fkey";
            columns: ["reviewer_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      saved_events: {
        Row: {
          id: string;
          notes: string | null;
          post_id: string;
          saved_at: string;
          user_id: string;
        };
        Insert: {
          id?: string;
          notes?: string | null;
          post_id: string;
          saved_at?: string;
          user_id: string;
        };
        Update: {
          id?: string;
          notes?: string | null;
          post_id?: string;
          saved_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "saved_events_post_id_fkey";
            columns: ["post_id"];
            isOneToOne: false;
            referencedRelation: "posts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "saved_events_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      tags: {
        Row: {
          created_at: string | null;
          id: string;
          name: string;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          name: string;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          name?: string;
        };
        Relationships: [];
      };
      thingdeck: {
        Row: {
          id: number;
          postId: string | null;
          userId: string;
        };
        Insert: {
          id?: number;
          postId?: string | null;
          userId: string;
        };
        Update: {
          id?: number;
          postId?: string | null;
          userId?: string;
        };
        Relationships: [
          {
            foreignKeyName: "thingdeck_userId_fkey";
            columns: ["userId"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      users: {
        Row: {
          avatar_url: string | null;
          bio: string | null;
          created_at: string | null;
          email: string;
          full_name: string | null;
          id: string;
          location: string | null;
          updated_at: string | null;
        };
        Insert: {
          avatar_url?: string | null;
          bio?: string | null;
          created_at?: string | null;
          email: string;
          full_name?: string | null;
          id?: string;
          location?: string | null;
          updated_at?: string | null;
        };
        Update: {
          avatar_url?: string | null;
          bio?: string | null;
          created_at?: string | null;
          email?: string;
          full_name?: string | null;
          id?: string;
          location?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      viewed_events: {
        Row: {
          action: string;
          id: string;
          post_id: string;
          user_id: string;
          viewed_at: string;
        };
        Insert: {
          action: string;
          id?: string;
          post_id: string;
          user_id: string;
          viewed_at?: string;
        };
        Update: {
          action?: string;
          id?: string;
          post_id?: string;
          user_id?: string;
          viewed_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "viewed_events_post_id_fkey";
            columns: ["post_id"];
            isOneToOne: false;
            referencedRelation: "posts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "viewed_events_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
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
    : never = never
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
    : never = never
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
    : never = never
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
    : never = never
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
    : never = never
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;
