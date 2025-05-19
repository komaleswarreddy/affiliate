export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      tenants: {
        Row: {
          id: string
          name: string
          plan: string
          trial_start: string
          trial_end: string
          created_by: string
          created_at?: string
        }
        Insert: {
          id?: string
          name: string
          plan: string
          trial_start: string
          trial_end: string
          created_by: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          plan?: string
          trial_start?: string
          trial_end?: string
          created_by?: string
          created_at?: string
        }
      }
      users: {
        Row: {
          id: string
          email: string
          role: string
          tenant_id: string
          invited_by?: string
          created_at: string
        }
        Insert: {
          id: string
          email: string
          role: string
          tenant_id: string
          invited_by?: string
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          role?: string
          tenant_id?: string
          invited_by?: string
          created_at?: string
        }
      }
      invites: {
        Row: {
          id: string
          email: string
          tenant_id: string
          role: string
          created_by: string
          accepted_at?: string
          created_at: string
        }
        Insert: {
          id?: string
          email: string
          tenant_id: string
          role: string
          created_by: string
          accepted_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          tenant_id?: string
          role?: string
          created_by?: string
          accepted_at?: string
          created_at?: string
        }
      }
      subscriptions: {
        Row: {
          id: string
          tenant_id: string
          plan: string
          status: string
          start_date: string
          end_date?: string
          is_trial: boolean
          created_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          plan: string
          status: string
          start_date: string
          end_date?: string
          is_trial: boolean
          created_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          plan?: string
          status?: string
          start_date?: string
          end_date?: string
          is_trial?: boolean
          created_at?: string
        }
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
  }
} 