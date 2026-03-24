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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      ai_cache: {
        Row: {
          cache_key: string
          created_at: string
          expires_at: string
          id: string
          organization_id: string
          response: string
        }
        Insert: {
          cache_key: string
          created_at?: string
          expires_at?: string
          id?: string
          organization_id: string
          response: string
        }
        Update: {
          cache_key?: string
          created_at?: string
          expires_at?: string
          id?: string
          organization_id?: string
          response?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_cache_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      brand_settings: {
        Row: {
          accent_color: string
          created_at: string
          favicon_url: string | null
          font_family: string
          id: string
          logo_size: number | null
          logo_size_desktop: number | null
          logo_size_mobile: number | null
          logo_url: string | null
          org_display_name: string | null
          organization_id: string
          primary_color: string
          secondary_color: string
          sidebar_color: string
          updated_at: string
        }
        Insert: {
          accent_color?: string
          created_at?: string
          favicon_url?: string | null
          font_family?: string
          id?: string
          logo_size?: number | null
          logo_size_desktop?: number | null
          logo_size_mobile?: number | null
          logo_url?: string | null
          org_display_name?: string | null
          organization_id: string
          primary_color?: string
          secondary_color?: string
          sidebar_color?: string
          updated_at?: string
        }
        Update: {
          accent_color?: string
          created_at?: string
          favicon_url?: string | null
          font_family?: string
          id?: string
          logo_size?: number | null
          logo_size_desktop?: number | null
          logo_size_mobile?: number | null
          logo_url?: string | null
          org_display_name?: string | null
          organization_id?: string
          primary_color?: string
          secondary_color?: string
          sidebar_color?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "brand_settings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_field_order: {
        Row: {
          created_at: string
          field_name: string
          id: string
          organization_id: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          field_name: string
          id?: string
          organization_id: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          field_name?: string
          id?: string
          organization_id?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_field_order_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_fields: {
        Row: {
          created_at: string
          display_order: number
          field_label: string
          field_name: string
          field_options: Json | null
          field_type: string
          id: string
          is_active: boolean
          is_required: boolean
          organization_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          field_label: string
          field_name: string
          field_options?: Json | null
          field_type: string
          id?: string
          is_active?: boolean
          is_required?: boolean
          organization_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_order?: number
          field_label?: string
          field_name?: string
          field_options?: Json | null
          field_type?: string
          id?: string
          is_active?: boolean
          is_required?: boolean
          organization_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "custom_fields_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_roles: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_default: boolean
          name: string
          organization_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_default?: boolean
          name: string
          organization_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_default?: boolean
          name?: string
          organization_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "custom_roles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      dashboard_settings: {
        Row: {
          card_id: string
          created_at: string | null
          id: string
          is_visible: boolean | null
          organization_id: string
          position: number
          updated_at: string | null
        }
        Insert: {
          card_id: string
          created_at?: string | null
          id?: string
          is_visible?: boolean | null
          organization_id: string
          position?: number
          updated_at?: string | null
        }
        Update: {
          card_id?: string
          created_at?: string | null
          id?: string
          is_visible?: boolean | null
          organization_id?: string
          position?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dashboard_settings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      email_templates: {
        Row: {
          body_html: string
          button_link: string
          button_text: string
          created_at: string
          footer_text: string
          id: string
          logo_url: string | null
          organization_id: string | null
          primary_color: string
          secondary_color: string
          subject: string
          template_type: string
          text_color: string
          updated_at: string
        }
        Insert: {
          body_html?: string
          button_link?: string
          button_text?: string
          created_at?: string
          footer_text?: string
          id?: string
          logo_url?: string | null
          organization_id?: string | null
          primary_color?: string
          secondary_color?: string
          subject?: string
          template_type: string
          text_color?: string
          updated_at?: string
        }
        Update: {
          body_html?: string
          button_link?: string
          button_text?: string
          created_at?: string
          footer_text?: string
          id?: string
          logo_url?: string | null
          organization_id?: string | null
          primary_color?: string
          secondary_color?: string
          subject?: string
          template_type?: string
          text_color?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_templates_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      interactions: {
        Row: {
          created_at: string
          id: string
          interaction_date: string | null
          lead_id: string
          note: string | null
          organization_id: string
          type: string
        }
        Insert: {
          created_at?: string
          id?: string
          interaction_date?: string | null
          lead_id: string
          note?: string | null
          organization_id: string
          type: string
        }
        Update: {
          created_at?: string
          id?: string
          interaction_date?: string | null
          lead_id?: string
          note?: string | null
          organization_id?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "interactions_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interactions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      interest_levels: {
        Row: {
          active: boolean
          created_at: string
          id: string
          label: string
          organization_id: string
          sort_order: number
          value: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          label: string
          organization_id: string
          sort_order?: number
          value: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          label?: string
          organization_id?: string
          sort_order?: number
          value?: string
        }
        Relationships: [
          {
            foreignKeyName: "interest_levels_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_origins: {
        Row: {
          active: boolean
          created_at: string
          id: string
          name: string
          organization_id: string
          sort_order: number
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          name: string
          organization_id: string
          sort_order?: number
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          name?: string
          organization_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "lead_origins_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          city: string | null
          cpf: string | null
          created_at: string
          custom_data: Json | null
          deal_value: number | null
          email: string | null
          entry_date: string | null
          id: string
          instagram: string | null
          interest_level: string | null
          main_interest: string | null
          name: string
          notes: string | null
          organization_id: string
          origin: string | null
          phone: string | null
          pipeline_stage: string | null
          responsible: string | null
          rg: string | null
          tags: string[] | null
          updated_at: string
        }
        Insert: {
          city?: string | null
          cpf?: string | null
          created_at?: string
          custom_data?: Json | null
          deal_value?: number | null
          email?: string | null
          entry_date?: string | null
          id?: string
          instagram?: string | null
          interest_level?: string | null
          main_interest?: string | null
          name: string
          notes?: string | null
          organization_id: string
          origin?: string | null
          phone?: string | null
          pipeline_stage?: string | null
          responsible?: string | null
          rg?: string | null
          tags?: string[] | null
          updated_at?: string
        }
        Update: {
          city?: string | null
          cpf?: string | null
          created_at?: string
          custom_data?: Json | null
          deal_value?: number | null
          email?: string | null
          entry_date?: string | null
          id?: string
          instagram?: string | null
          interest_level?: string | null
          main_interest?: string | null
          name?: string
          notes?: string | null
          organization_id?: string
          origin?: string | null
          phone?: string | null
          pipeline_stage?: string | null
          responsible?: string | null
          rg?: string | null
          tags?: string[] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "leads_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_members: {
        Row: {
          created_at: string
          id: string
          organization_id: string
          role: Database["public"]["Enums"]["org_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          organization_id: string
          role?: Database["public"]["Enums"]["org_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          organization_id?: string
          role?: Database["public"]["Enums"]["org_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_plans: {
        Row: {
          active: boolean
          created_at: string
          description: string | null
          id: string
          max_integrations: number | null
          max_leads: number | null
          max_users: number
          name: string
          period: string
          updated_at: string
          value: number
        }
        Insert: {
          active?: boolean
          created_at?: string
          description?: string | null
          id?: string
          max_integrations?: number | null
          max_leads?: number | null
          max_users?: number
          name: string
          period?: string
          updated_at?: string
          value: number
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string | null
          id?: string
          max_integrations?: number | null
          max_leads?: number | null
          max_users?: number
          name?: string
          period?: string
          updated_at?: string
          value?: number
        }
        Relationships: []
      }
      organizations: {
        Row: {
          active: boolean
          ai_business_model: string | null
          ai_context: string | null
          ai_services: Json | null
          ai_target_audience: string | null
          bairro: string | null
          cep: string | null
          cnpj: string | null
          complemento: string | null
          contact_email: string | null
          created_at: string
          description: string | null
          estado: string | null
          id: string
          logo_url: string | null
          max_leads: number
          max_users: number
          municipio: string | null
          name: string
          numero: string | null
          owner_id: string | null
          phone: string | null
          plan: Database["public"]["Enums"]["org_plan"]
          plan_expires_at: string | null
          plan_id: string | null
          primary_color: string | null
          rua: string | null
          slug: string
          updated_at: string
          website: string | null
        }
        Insert: {
          active?: boolean
          ai_business_model?: string | null
          ai_context?: string | null
          ai_services?: Json | null
          ai_target_audience?: string | null
          bairro?: string | null
          cep?: string | null
          cnpj?: string | null
          complemento?: string | null
          contact_email?: string | null
          created_at?: string
          description?: string | null
          estado?: string | null
          id?: string
          logo_url?: string | null
          max_leads?: number
          max_users?: number
          municipio?: string | null
          name: string
          numero?: string | null
          owner_id?: string | null
          phone?: string | null
          plan?: Database["public"]["Enums"]["org_plan"]
          plan_expires_at?: string | null
          plan_id?: string | null
          primary_color?: string | null
          rua?: string | null
          slug: string
          updated_at?: string
          website?: string | null
        }
        Update: {
          active?: boolean
          ai_business_model?: string | null
          ai_context?: string | null
          ai_services?: Json | null
          ai_target_audience?: string | null
          bairro?: string | null
          cep?: string | null
          cnpj?: string | null
          complemento?: string | null
          contact_email?: string | null
          created_at?: string
          description?: string | null
          estado?: string | null
          id?: string
          logo_url?: string | null
          max_leads?: number
          max_users?: number
          municipio?: string | null
          name?: string
          numero?: string | null
          owner_id?: string | null
          phone?: string | null
          plan?: Database["public"]["Enums"]["org_plan"]
          plan_expires_at?: string | null
          plan_id?: string | null
          primary_color?: string | null
          rua?: string | null
          slug?: string
          updated_at?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organizations_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "organization_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_methods: {
        Row: {
          active: boolean
          created_at: string
          id: string
          name: string
          organization_id: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          name: string
          organization_id: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          name?: string
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_methods_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      pipeline_stage_history: {
        Row: {
          changed_at: string | null
          changed_by: string | null
          from_stage: string | null
          id: string
          lead_id: string
          organization_id: string
          to_stage: string
        }
        Insert: {
          changed_at?: string | null
          changed_by?: string | null
          from_stage?: string | null
          id?: string
          lead_id: string
          organization_id: string
          to_stage: string
        }
        Update: {
          changed_at?: string | null
          changed_by?: string | null
          from_stage?: string | null
          id?: string
          lead_id?: string
          organization_id?: string
          to_stage?: string
        }
        Relationships: [
          {
            foreignKeyName: "pipeline_stage_history_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pipeline_stage_history_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      pipeline_stages: {
        Row: {
          active: boolean
          created_at: string
          id: string
          name: string
          organization_id: string
          sort_order: number
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          name: string
          organization_id: string
          sort_order?: number
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          name?: string
          organization_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "pipeline_stages_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      product_sales_stages: {
        Row: {
          created_at: string
          id: string
          link: string | null
          name: string
          product_id: string
          value: number
        }
        Insert: {
          created_at?: string
          id?: string
          link?: string | null
          name: string
          product_id: string
          value?: number
        }
        Update: {
          created_at?: string
          id?: string
          link?: string | null
          name?: string
          product_id?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "product_sales_stages_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          notes: string | null
          organization_id: string
          type: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          notes?: string | null
          organization_id: string
          type?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          notes?: string | null
          organization_id?: string
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          cep: string | null
          city: string | null
          cpf: string | null
          created_at: string
          email: string | null
          full_name: string
          id: string
          neighborhood: string | null
          phone: string | null
          role: string | null
          state: string | null
          street: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          cep?: string | null
          city?: string | null
          cpf?: string | null
          created_at?: string
          email?: string | null
          full_name?: string
          id: string
          neighborhood?: string | null
          phone?: string | null
          role?: string | null
          state?: string | null
          street?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          cep?: string | null
          city?: string | null
          cpf?: string | null
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          neighborhood?: string | null
          phone?: string | null
          role?: string | null
          state?: string | null
          street?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      role_permissions: {
        Row: {
          enabled: boolean
          id: string
          organization_id: string
          permission_key: string
          role: string
        }
        Insert: {
          enabled?: boolean
          id?: string
          organization_id: string
          permission_key: string
          role: string
        }
        Update: {
          enabled?: boolean
          id?: string
          organization_id?: string
          permission_key?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      sales: {
        Row: {
          created_at: string
          id: string
          lead_id: string
          notes: string | null
          organization_id: string
          payment_method: string | null
          product_id: string | null
          sale_date: string | null
          status: string
          updated_at: string
          value: number
        }
        Insert: {
          created_at?: string
          id?: string
          lead_id: string
          notes?: string | null
          organization_id: string
          payment_method?: string | null
          product_id?: string | null
          sale_date?: string | null
          status?: string
          updated_at?: string
          value?: number
        }
        Update: {
          created_at?: string
          id?: string
          lead_id?: string
          notes?: string | null
          organization_id?: string
          payment_method?: string | null
          product_id?: string | null
          sale_date?: string | null
          status?: string
          updated_at?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "sales_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      scheduled_messages: {
        Row: {
          client_id: string | null
          created_at: string
          created_by: string
          error_message: string | null
          id: string
          lead_id: string | null
          message_text: string
          organization_id: string
          phone_number: string
          scheduled_at: string
          sent_at: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          created_by: string
          error_message?: string | null
          id?: string
          lead_id?: string | null
          message_text: string
          organization_id: string
          phone_number: string
          scheduled_at: string
          sent_at?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          client_id?: string | null
          created_at?: string
          created_by?: string
          error_message?: string | null
          id?: string
          lead_id?: string | null
          message_text?: string
          organization_id?: string
          phone_number?: string
          scheduled_at?: string
          sent_at?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "scheduled_messages_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scheduled_messages_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      superadmin_roles: {
        Row: {
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      system_settings: {
        Row: {
          created_at: string | null
          id: string
          setting_key: string
          setting_value: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          setting_key: string
          setting_value?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          setting_key?: string
          setting_value?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      tags: {
        Row: {
          color: string | null
          created_at: string
          id: string
          name: string
          organization_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          id?: string
          name: string
          organization_id: string
        }
        Update: {
          color?: string | null
          created_at?: string
          id?: string
          name?: string
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tags_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      task_notifications: {
        Row: {
          created_at: string
          id: string
          message: string
          organization_id: string
          read: boolean | null
          task_id: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          organization_id: string
          read?: boolean | null
          task_id: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          organization_id?: string
          read?: boolean | null
          task_id?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_notifications_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_notifications_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_statuses: {
        Row: {
          color: string | null
          created_at: string
          id: string
          name: string
          order_index: number | null
          organization_id: string
          updated_at: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          id?: string
          name: string
          order_index?: number | null
          organization_id: string
          updated_at?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          id?: string
          name?: string
          order_index?: number | null
          organization_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_statuses_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          assigned_to: string | null
          completed: boolean
          created_at: string
          due_date: string | null
          id: string
          lead_id: string | null
          organization_id: string
          status_id: string | null
          title: string
          type: string | null
        }
        Insert: {
          assigned_to?: string | null
          completed?: boolean
          created_at?: string
          due_date?: string | null
          id?: string
          lead_id?: string | null
          organization_id: string
          status_id?: string | null
          title: string
          type?: string | null
        }
        Update: {
          assigned_to?: string | null
          completed?: boolean
          created_at?: string
          due_date?: string | null
          id?: string
          lead_id?: string | null
          organization_id?: string
          status_id?: string | null
          title?: string
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tasks_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_status_id_fkey"
            columns: ["status_id"]
            isOneToOne: false
            referencedRelation: "task_statuses"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      bootstrap_first_superadmin: {
        Args: { _user_id: string }
        Returns: boolean
      }
      get_org_role: {
        Args: { _org_id: string; _user_id: string }
        Returns: Database["public"]["Enums"]["org_role"]
      }
      get_user_org_ids: { Args: { _user_id: string }; Returns: string[] }
      has_any_superadmin: { Args: never; Returns: boolean }
      is_org_member: {
        Args: { _org_id: string; _user_id: string }
        Returns: boolean
      }
      is_superadmin: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      org_plan: "free" | "starter" | "pro" | "agency"
      org_role: "owner" | "admin" | "member" | "vendedor"
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
      org_plan: ["free", "starter", "pro", "agency"],
      org_role: ["owner", "admin", "member", "vendedor"],
    },
  },
} as const
