export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
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
      closet_component_presets: {
        Row: {
          category: Database["public"]["Enums"]["product_category"]
          created_at: string | null
          id: string
          is_system: boolean | null
          name: string
          preset_data: Json
          thumbnail_url: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          category: Database["public"]["Enums"]["product_category"]
          created_at?: string | null
          id?: string
          is_system?: boolean | null
          name: string
          preset_data: Json
          thumbnail_url?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          category?: Database["public"]["Enums"]["product_category"]
          created_at?: string | null
          id?: string
          is_system?: boolean | null
          name?: string
          preset_data?: Json
          thumbnail_url?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      closet_models: {
        Row: {
          created_at: string | null
          id: string
          model_data: Json
          name: string
          order_id: string | null
          thumbnail_url: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          model_data?: Json
          name?: string
          order_id?: string | null
          thumbnail_url?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Update: {
          created_at?: string | null
          id?: string
          model_data?: Json
          name?: string
          order_id?: string | null
          thumbnail_url?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "closet_models_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      cost_records: {
        Row: {
          confirmed_amount: number
          confirmed_at: string | null
          created_at: string | null
          id: string
          memo: string | null
          order_id: string | null
          payment_date: string | null
          payment_method: string | null
          purchase_order_id: string | null
          user_id: string
        }
        Insert: {
          confirmed_amount: number
          confirmed_at?: string | null
          created_at?: string | null
          id?: string
          memo?: string | null
          order_id?: string | null
          payment_date?: string | null
          payment_method?: string | null
          purchase_order_id?: string | null
          user_id?: string
        }
        Update: {
          confirmed_amount?: number
          confirmed_at?: string | null
          created_at?: string | null
          id?: string
          memo?: string | null
          order_id?: string | null
          payment_date?: string | null
          payment_method?: string | null
          purchase_order_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cost_records_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cost_records_purchase_order_id_fkey"
            columns: ["purchase_order_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          address: string | null
          address_detail: string | null
          created_at: string | null
          id: string
          memo: string | null
          name: string
          phone: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          address?: string | null
          address_detail?: string | null
          created_at?: string | null
          id?: string
          memo?: string | null
          name: string
          phone: string
          updated_at?: string | null
          user_id?: string
        }
        Update: {
          address?: string | null
          address_detail?: string | null
          created_at?: string | null
          id?: string
          memo?: string | null
          name?: string
          phone?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      generated_reports: {
        Row: {
          created_at: string | null
          id: string
          order_id: string | null
          pdf_url: string | null
          report_data: Json
          template_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          order_id?: string | null
          pdf_url?: string | null
          report_data: Json
          template_id?: string | null
          user_id?: string
        }
        Update: {
          created_at?: string | null
          id?: string
          order_id?: string | null
          pdf_url?: string | null
          report_data?: Json
          template_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "generated_reports_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "generated_reports_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "report_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory: {
        Row: {
          available_quantity: number | null
          held_quantity: number
          id: string
          product_id: string | null
          quantity: number
          updated_at: string | null
          user_id: string
          warehouse_location: string | null
        }
        Insert: {
          available_quantity?: number | null
          held_quantity?: number
          id?: string
          product_id?: string | null
          quantity?: number
          updated_at?: string | null
          user_id?: string
          warehouse_location?: string | null
        }
        Update: {
          available_quantity?: number | null
          held_quantity?: number
          id?: string
          product_id?: string | null
          quantity?: number
          updated_at?: string | null
          user_id?: string
          warehouse_location?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: true
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_transactions: {
        Row: {
          after_quantity: number
          before_quantity: number
          created_at: string | null
          id: string
          memo: string | null
          order_id: string | null
          product_id: string | null
          purchase_order_id: string | null
          quantity: number
          type: Database["public"]["Enums"]["transaction_type"]
          user_id: string
        }
        Insert: {
          after_quantity: number
          before_quantity: number
          created_at?: string | null
          id?: string
          memo?: string | null
          order_id?: string | null
          product_id?: string | null
          purchase_order_id?: string | null
          quantity: number
          type: Database["public"]["Enums"]["transaction_type"]
          user_id?: string
        }
        Update: {
          after_quantity?: number
          before_quantity?: number
          created_at?: string | null
          id?: string
          memo?: string | null
          order_id?: string | null
          product_id?: string | null
          purchase_order_id?: string | null
          quantity?: number
          type?: Database["public"]["Enums"]["transaction_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_transactions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_transactions_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_transactions_purchase_order_id_fkey"
            columns: ["purchase_order_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      order_materials: {
        Row: {
          held_quantity: number
          id: string
          memo: string | null
          order_id: string | null
          planned_quantity: number
          product_id: string | null
          shortage_quantity: number
          used_quantity: number
          user_id: string
        }
        Insert: {
          held_quantity?: number
          id?: string
          memo?: string | null
          order_id?: string | null
          planned_quantity?: number
          product_id?: string | null
          shortage_quantity?: number
          used_quantity?: number
          user_id?: string
        }
        Update: {
          held_quantity?: number
          id?: string
          memo?: string | null
          order_id?: string | null
          planned_quantity?: number
          product_id?: string | null
          shortage_quantity?: number
          used_quantity?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_materials_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_materials_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          cancellation_reason: string | null
          cancelled_at: string | null
          cancelled_from_status:
            | Database["public"]["Enums"]["order_status"]
            | null
          closet_spec: Json | null
          closet_type: string | null
          confirmed_amount: number | null
          cost_confirmed_at: string | null
          created_at: string | null
          customer_id: string | null
          id: string
          installation_checklist: Json | null
          installation_date: string | null
          measurement_date: string | null
          memo: string | null
          model_scene_data: Json | null
          order_number: string
          payment_date: string | null
          payment_method: string | null
          preparation_checklist: Json | null
          quotation_amount: number | null
          revenue_confirmed_at: string | null
          site_address: string | null
          site_memo: string | null
          site_photos: string[] | null
          status: Database["public"]["Enums"]["order_status"] | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cancelled_from_status?:
            | Database["public"]["Enums"]["order_status"]
            | null
          closet_spec?: Json | null
          closet_type?: string | null
          confirmed_amount?: number | null
          cost_confirmed_at?: string | null
          created_at?: string | null
          customer_id?: string | null
          id?: string
          installation_checklist?: Json | null
          installation_date?: string | null
          measurement_date?: string | null
          memo?: string | null
          model_scene_data?: Json | null
          order_number: string
          payment_date?: string | null
          payment_method?: string | null
          preparation_checklist?: Json | null
          quotation_amount?: number | null
          revenue_confirmed_at?: string | null
          site_address?: string | null
          site_memo?: string | null
          site_photos?: string[] | null
          status?: Database["public"]["Enums"]["order_status"] | null
          updated_at?: string | null
          user_id?: string
        }
        Update: {
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cancelled_from_status?:
            | Database["public"]["Enums"]["order_status"]
            | null
          closet_spec?: Json | null
          closet_type?: string | null
          confirmed_amount?: number | null
          cost_confirmed_at?: string | null
          created_at?: string | null
          customer_id?: string | null
          id?: string
          installation_checklist?: Json | null
          installation_date?: string | null
          measurement_date?: string | null
          memo?: string | null
          model_scene_data?: Json | null
          order_number?: string
          payment_date?: string | null
          payment_method?: string | null
          preparation_checklist?: Json | null
          quotation_amount?: number | null
          revenue_confirmed_at?: string | null
          site_address?: string | null
          site_memo?: string | null
          site_photos?: string[] | null
          status?: Database["public"]["Enums"]["order_status"] | null
          updated_at?: string | null
          user_id?: string
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
      portfolios: {
        Row: {
          category: string
          created_at: string
          description: string | null
          display_order: number
          id: string
          images: string[]
          is_featured: boolean
          is_visible: boolean
          order_id: string | null
          thumbnail_url: string | null
          title: string
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          images?: string[]
          is_featured?: boolean
          is_visible?: boolean
          order_id?: string | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          images?: string[]
          is_featured?: boolean
          is_visible?: boolean
          order_id?: string | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "portfolios_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          category: Database["public"]["Enums"]["product_category"]
          color: string | null
          created_at: string | null
          depth: number | null
          height: number | null
          id: string
          is_active: boolean | null
          memo: string | null
          min_stock: number | null
          name: string
          sku: string | null
          unit: string | null
          unit_price: number | null
          updated_at: string | null
          user_id: string
          width: number | null
        }
        Insert: {
          category: Database["public"]["Enums"]["product_category"]
          color?: string | null
          created_at?: string | null
          depth?: number | null
          height?: number | null
          id?: string
          is_active?: boolean | null
          memo?: string | null
          min_stock?: number | null
          name: string
          sku?: string | null
          unit?: string | null
          unit_price?: number | null
          updated_at?: string | null
          user_id?: string
          width?: number | null
        }
        Update: {
          category?: Database["public"]["Enums"]["product_category"]
          color?: string | null
          created_at?: string | null
          depth?: number | null
          height?: number | null
          id?: string
          is_active?: boolean | null
          memo?: string | null
          min_stock?: number | null
          name?: string
          sku?: string | null
          unit?: string | null
          unit_price?: number | null
          updated_at?: string | null
          user_id?: string
          width?: number | null
        }
        Relationships: []
      }
      purchase_order_items: {
        Row: {
          id: string
          memo: string | null
          product_id: string | null
          purchase_order_id: string | null
          quantity: number
          received_quantity: number | null
          total_price: number | null
          unit_price: number
          user_id: string
        }
        Insert: {
          id?: string
          memo?: string | null
          product_id?: string | null
          purchase_order_id?: string | null
          quantity: number
          received_quantity?: number | null
          total_price?: number | null
          unit_price: number
          user_id?: string
        }
        Update: {
          id?: string
          memo?: string | null
          product_id?: string | null
          purchase_order_id?: string | null
          quantity?: number
          received_quantity?: number | null
          total_price?: number | null
          unit_price?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchase_order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_order_items_purchase_order_id_fkey"
            columns: ["purchase_order_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_orders: {
        Row: {
          created_at: string | null
          discount_rate: number | null
          id: string
          memo: string | null
          order_date: string | null
          payment_date: string | null
          po_number: string
          status: Database["public"]["Enums"]["po_status"] | null
          subtotal_amount: number | null
          supplier_id: string | null
          supplier_name: string | null
          supplier_phone: string | null
          total_amount: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          discount_rate?: number | null
          id?: string
          memo?: string | null
          order_date?: string | null
          payment_date?: string | null
          po_number: string
          status?: Database["public"]["Enums"]["po_status"] | null
          subtotal_amount?: number | null
          supplier_id?: string | null
          supplier_name?: string | null
          supplier_phone?: string | null
          total_amount?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Update: {
          created_at?: string | null
          discount_rate?: number | null
          id?: string
          memo?: string | null
          order_date?: string | null
          payment_date?: string | null
          po_number?: string
          status?: Database["public"]["Enums"]["po_status"] | null
          subtotal_amount?: number | null
          supplier_id?: string | null
          supplier_name?: string | null
          supplier_phone?: string | null
          total_amount?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchase_orders_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      quote_requests: {
        Row: {
          address: string | null
          admin_notes: string | null
          category: string
          completed_at: string | null
          contacted_at: string | null
          created_at: string
          customer_email: string | null
          customer_name: string
          customer_phone: string
          description: string | null
          id: string
          status: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          admin_notes?: string | null
          category: string
          completed_at?: string | null
          contacted_at?: string | null
          created_at?: string
          customer_email?: string | null
          customer_name: string
          customer_phone: string
          description?: string | null
          id?: string
          status?: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          admin_notes?: string | null
          category?: string
          completed_at?: string | null
          contacted_at?: string | null
          created_at?: string
          customer_email?: string | null
          customer_name?: string
          customer_phone?: string
          description?: string | null
          id?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      report_templates: {
        Row: {
          created_at: string | null
          id: string
          is_default: boolean | null
          name: string
          template_data: Json
          type: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          name: string
          template_data: Json
          type: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          name?: string
          template_data?: Json
          type?: string
          user_id?: string | null
        }
        Relationships: []
      }
      revenue_records: {
        Row: {
          confirmed_amount: number
          confirmed_at: string | null
          created_at: string | null
          id: string
          memo: string | null
          order_id: string | null
          payment_date: string | null
          payment_method: string | null
          user_id: string
        }
        Insert: {
          confirmed_amount: number
          confirmed_at?: string | null
          created_at?: string | null
          id?: string
          memo?: string | null
          order_id?: string | null
          payment_date?: string | null
          payment_method?: string | null
          user_id?: string
        }
        Update: {
          confirmed_amount?: number
          confirmed_at?: string | null
          created_at?: string | null
          id?: string
          memo?: string | null
          order_id?: string | null
          payment_date?: string | null
          payment_method?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "revenue_records_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      schedules: {
        Row: {
          created_at: string | null
          duration_minutes: number | null
          id: string
          is_active: boolean | null
          is_completed: boolean | null
          location: string | null
          memo: string | null
          order_id: string | null
          scheduled_date: string
          scheduled_time: string | null
          title: string
          type: Database["public"]["Enums"]["schedule_type"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          duration_minutes?: number | null
          id?: string
          is_active?: boolean | null
          is_completed?: boolean | null
          location?: string | null
          memo?: string | null
          order_id?: string | null
          scheduled_date: string
          scheduled_time?: string | null
          title: string
          type: Database["public"]["Enums"]["schedule_type"]
          user_id?: string
        }
        Update: {
          created_at?: string | null
          duration_minutes?: number | null
          id?: string
          is_active?: boolean | null
          is_completed?: boolean | null
          location?: string | null
          memo?: string | null
          order_id?: string | null
          scheduled_date?: string
          scheduled_time?: string | null
          title?: string
          type?: Database["public"]["Enums"]["schedule_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "schedules_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          address: string | null
          business_number: string | null
          contact_person: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          memo: string | null
          name: string
          phone: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          address?: string | null
          business_number?: string | null
          contact_person?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          memo?: string | null
          name: string
          phone?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          address?: string | null
          business_number?: string | null
          contact_person?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          memo?: string | null
          name?: string
          phone?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      adjust_inventory: {
        Args: { p_memo?: string; p_new_quantity: number; p_product_id: string }
        Returns: Json
      }
      cancel_order_cascade: {
        Args: { p_order_id: string; p_reason?: string }
        Returns: Json
      }
      dispatch_materials_for_order: {
        Args: { p_order_id: string }
        Returns: Json
      }
      generate_order_number: { Args: never; Returns: string }
      generate_po_number: { Args: never; Returns: string }
      hold_materials_for_order: {
        Args: { p_mode?: string; p_order_id: string }
        Returns: Json
      }
      receive_purchase_order: {
        Args: { p_items?: Json; p_purchase_order_id: string }
        Returns: Json
      }
      release_held_materials: { Args: { p_order_id: string }; Returns: Json }
    }
    Enums: {
      order_status:
        | "inquiry"
        | "quotation"
        | "work"
        | "settlement_wait"
        | "revenue_confirmed"
        | "cancelled"
      po_status: "draft" | "ordered" | "received" | "settled" | "cost_confirmed"
      product_category:
        | "angle_frame"
        | "system_frame"
        | "shelf"
        | "hanger_bar"
        | "drawer"
        | "door"
        | "hardware"
        | "accessory"
        | "etc"
        | "top_panel"
        | "mirror"
        | "lighting"
        | "tray"
      schedule_type:
        | "measurement"
        | "installation"
        | "visit"
        | "delivery"
        | "other"
      transaction_type:
        | "inbound"
        | "outbound"
        | "hold"
        | "release_hold"
        | "adjustment"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      order_status: [
        "inquiry",
        "quotation",
        "work",
        "settlement_wait",
        "revenue_confirmed",
        "cancelled",
      ],
      po_status: ["draft", "ordered", "received", "settled", "cost_confirmed"],
      product_category: [
        "angle_frame",
        "system_frame",
        "shelf",
        "hanger_bar",
        "drawer",
        "door",
        "hardware",
        "accessory",
        "etc",
        "top_panel",
        "mirror",
        "lighting",
        "tray",
      ],
      schedule_type: [
        "measurement",
        "installation",
        "visit",
        "delivery",
        "other",
      ],
      transaction_type: [
        "inbound",
        "outbound",
        "hold",
        "release_hold",
        "adjustment",
      ],
    },
  },
} as const

