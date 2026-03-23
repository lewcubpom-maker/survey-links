import { createClient } from '@supabase/supabase-js'

// ประเภทข้อมูลในฐานข้อมูล
export type Link = {
  id: number
  name: string
  link: string
  status: string
}

export type Config = {
  key: string
  value: string
}

export type Database = {
  public: {
    Tables: {
      links: {
        Row: Link
        Insert: Omit<Link, 'id'>
        Update: Partial<Omit<Link, 'id'>>
      }
      config: {
        Row: Config
        Insert: Config
        Update: Partial<Config>
      }
    }
  }
}

const supabaseUrl  = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey  = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient<Database>(supabaseUrl, supabaseKey)
