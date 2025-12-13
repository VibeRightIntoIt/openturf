import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.SUPABASE_DATABASE_URL!
const supabaseKey = process.env.SUPABASE_SECRET_KEY!

export const supabase = createClient(supabaseUrl, supabaseKey)
