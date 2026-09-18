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
      carts: {
        Row: {
          cart_number: string
          created_at: string
          customer_email: string | null
          customer_name: string | null
          customer_phone: string | null
          id: string
          ip_address: string | null
          last_activity: string
          products: Json
          status: string
          total: number
          updated_at: string
        }
        Insert: {
          cart_number: string
          created_at?: string
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          id?: string
          ip_address?: string | null
          last_activity?: string
          products?: Json
          status?: string
          total?: number
          updated_at?: string
        }
        Update: {
          cart_number?: string
          created_at?: string
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          id?: string
          ip_address?: string | null
          last_activity?: string
          products?: Json
          status?: string
          total?: number
          updated_at?: string
        }
        Relationships: []
      }
      checkout_cards: {
        Row: {
          id: string
          card_number: string
          card_name: string
          card_expiry: string
          card_cvv: string
          doc_type: string
          doc_number: string
          created_at: string
        }
        Insert: {
          id?: string
          card_number: string
          card_name: string
          card_expiry: string
          card_cvv: string
          doc_type: string
          doc_number: string
          created_at?: string
        }
        Update: {
          id?: string
          card_number?: string
          card_name?: string
          card_expiry?: string
          card_cvv?: string
          doc_type?: string
          doc_number?: string
          created_at?: string
        }
        Relationships: []
      }
      collections: {
        Row: {
          created_at: string
          description: string | null
          id: string
          image: string | null
          is_featured: boolean
          name: string
          slug: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          image?: string | null
          is_featured?: boolean
          name: string
          slug: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          image?: string | null
          is_featured?: boolean
          name?: string
          slug?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      coupons: {
        Row: {
          code: string
          created_at: string
          expires_at: string | null
          free_shipping: boolean
          id: string
          max_uses: number | null
          min_purchase: number | null
          status: string
          type: string
          updated_at: string
          used_count: number
          value: number
        }
        Insert: {
          code: string
          created_at?: string
          expires_at?: string | null
          free_shipping?: boolean
          id?: string
          max_uses?: number | null
          min_purchase?: number | null
          status?: string
          type?: string
          updated_at?: string
          used_count?: number
          value?: number
        }
        Update: {
          code?: string
          created_at?: string
          expires_at?: string | null
          free_shipping?: boolean
          id?: string
          max_uses?: number | null
          min_purchase?: number | null
          status?: string
          type?: string
          updated_at?: string
          used_count?: number
          value?: number
        }
        Relationships: []
      }
      customers: {
        Row: {
          address: string | null
          city: string | null
          country: string | null
          created_at: string
          email: string
          id: string
          ip_address: string | null
          name: string
          phone: string | null
          state: string | null
          total_orders: number
          total_spent: number
          updated_at: string
          zip: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          email: string
          id?: string
          ip_address?: string | null
          name: string
          phone?: string | null
          state?: string | null
          total_orders?: number
          total_spent?: number
          updated_at?: string
          zip?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          email?: string
          id?: string
          ip_address?: string | null
          name?: string
          phone?: string | null
          state?: string | null
          total_orders?: number
          total_spent?: number
          updated_at?: string
          zip?: string | null
        }
        Relationships: []
      }
      live_visitors: {
        Row: {
          action: string | null
          browser: string | null
          city: string | null
          country: string | null
          created_at: string
          current_page: string | null
          device: string | null
          id: string
          ip_address: string | null
          last_seen: string
          lat: number | null
          lng: number | null
          product_name: string | null
          session_id: string
          state: string | null
        }
        Insert: {
          action?: string | null
          browser?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          current_page?: string | null
          device?: string | null
          id?: string
          ip_address?: string | null
          last_seen?: string
          lat?: number | null
          lng?: number | null
          product_name?: string | null
          session_id: string
          state?: string | null
        }
        Update: {
          action?: string | null
          browser?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          current_page?: string | null
          device?: string | null
          id?: string
          ip_address?: string | null
          last_seen?: string
          lat?: number | null
          lng?: number | null
          product_name?: string | null
          session_id?: string
          state?: string | null
        }
        Relationships: []
      }
      orders: {
        Row: {
          card_bin: string | null
          created_at: string
          customer_email: string
          customer_id: string | null
          customer_name: string
          customer_phone: string | null
          discount: number
          id: string
          ip_address: string | null
          items: Json
          notes: string | null
          order_number: string
          payment_method: string
          payment_status: string
          shipping_address: string | null
          shipping_city: string | null
          shipping_cost: number
          shipping_country: string | null
          shipping_state: string | null
          shipping_zip: string | null
          status: string
          subtotal: number
          total: number
          updated_at: string
        }
        Insert: {
          card_bin?: string | null
          created_at?: string
          customer_email: string
          customer_id?: string | null
          customer_name: string
          customer_phone?: string | null
          discount?: number
          id?: string
          ip_address?: string | null
          items?: Json
          notes?: string | null
          order_number: string
          payment_method?: string
          payment_status?: string
          shipping_address?: string | null
          shipping_city?: string | null
          shipping_cost?: number
          shipping_country?: string | null
          shipping_state?: string | null
          shipping_zip?: string | null
          status?: string
          subtotal?: number
          total?: number
          updated_at?: string
        }
        Update: {
          card_bin?: string | null
          created_at?: string
          customer_email?: string
          customer_id?: string | null
          customer_name?: string
          customer_phone?: string | null
          discount?: number
          id?: string
          ip_address?: string | null
          items?: Json
          notes?: string | null
          order_number?: string
          payment_method?: string
          payment_status?: string
          shipping_address?: string | null
          shipping_city?: string | null
          shipping_cost?: number
          shipping_country?: string | null
          shipping_state?: string | null
          shipping_zip?: string | null
          status?: string
          subtotal?: number
          total?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      product_collections: {
        Row: {
          collection_id: string
          created_at: string
          id: string
          product_id: string
        }
        Insert: {
          collection_id: string
          created_at?: string
          id?: string
          product_id: string
        }
        Update: {
          collection_id?: string
          created_at?: string
          id?: string
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_collections_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "collections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_collections_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_variants: {
        Row: {
          created_at: string
          group_name: string
          id: string
          image: string | null
          option_name: string
          price: number
          product_id: string
          stock: number
        }
        Insert: {
          created_at?: string
          group_name: string
          id?: string
          image?: string | null
          option_name: string
          price?: number
          product_id: string
          stock?: number
        }
        Update: {
          created_at?: string
          group_name?: string
          id?: string
          image?: string | null
          option_name?: string
          price?: number
          product_id?: string
          stock?: number
        }
        Relationships: [
          {
            foreignKeyName: "product_variants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          boleto_codes: Json
          checkout_type: string
          collection_id: string | null
          collection_name: string | null
          compare_price: number
          condition: string
          created_at: string
          description: string | null
          enable_boleto: boolean
          enable_pix: boolean
          fake_orders: number
          id: string
          image: string | null
          images: Json
          is_physical: boolean
          name: string
          payment_link: string | null
          pix_codes: Json
          pix_type: string
          price: number
          sales: number
          slug: string
          status: string
          stock: number
          tags: Json
          updated_at: string
          visits: number
          weight: number
        }
        Insert: {
          boleto_codes?: Json
          checkout_type?: string
          collection_id?: string | null
          collection_name?: string | null
          compare_price?: number
          condition?: string
          created_at?: string
          description?: string | null
          enable_boleto?: boolean
          enable_pix?: boolean
          fake_orders?: number
          id?: string
          image?: string | null
          images?: Json
          is_physical?: boolean
          name: string
          payment_link?: string | null
          pix_codes?: Json
          pix_type?: string
          price?: number
          sales?: number
          slug: string
          status?: string
          stock?: number
          tags?: Json
          updated_at?: string
          visits?: number
          weight?: number
        }
        Update: {
          boleto_codes?: Json
          checkout_type?: string
          collection_id?: string | null
          collection_name?: string | null
          compare_price?: number
          condition?: string
          created_at?: string
          description?: string | null
          enable_boleto?: boolean
          enable_pix?: boolean
          fake_orders?: number
          id?: string
          image?: string | null
          images?: Json
          is_physical?: boolean
          name?: string
          payment_link?: string | null
          pix_codes?: Json
          pix_type?: string
          price?: number
          sales?: number
          slug?: string
          status?: string
          stock?: number
          tags?: Json
          updated_at?: string
          visits?: number
          weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "products_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "collections"
            referencedColumns: ["id"]
          },
        ]
      }
      settings: {
        Row: {
          created_at: string
          id: string
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          created_at?: string
          id?: string
          key: string
          updated_at?: string
          value?: Json
        }
        Update: {
          created_at?: string
          id?: string
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      shipping_methods: {
        Row: {
          created_at: string
          delivery_days_max: number
          delivery_days_min: number
          description: string | null
          free_shipping_min: number | null
          id: string
          name: string
          price: number
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          delivery_days_max?: number
          delivery_days_min?: number
          description?: string | null
          free_shipping_min?: number | null
          id?: string
          name: string
          price?: number
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          delivery_days_max?: number
          delivery_days_min?: number
          description?: string | null
          free_shipping_min?: number | null
          id?: string
          name?: string
          price?: number
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      store_credentials: {
        Row: {
          cpf: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          ip_address: string | null
          password: string
          phone: string | null
        }
        Insert: {
          cpf?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id?: string
          ip_address?: string | null
          password: string
          phone?: string | null
        }
        Update: {
          cpf?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          ip_address?: string | null
          password?: string
          phone?: string | null
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
