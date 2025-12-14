import { createClient, SupabaseClient } from "@supabase/supabase-js"

let supabaseInstance: SupabaseClient | null = null

export function getSupabase(): SupabaseClient {
  if (!supabaseInstance) {
    const supabaseUrl = process.env.SUPABASE_DATABASE_URL
    const supabaseKey = process.env.SUPABASE_SECRET_KEY

    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Missing Supabase environment variables")
    }

    supabaseInstance = createClient(supabaseUrl, supabaseKey)
  }
  return supabaseInstance
}

// Lazy-initialized supabase client
export const supabase = new Proxy({} as SupabaseClient, {
  get(_, prop) {
    const client = getSupabase()
    const value = client[prop as keyof SupabaseClient]
    if (typeof value === "function") {
      return value.bind(client)
    }
    return value
  },
})
