import { createClient } from "@supabase/supabase-js";
import { config } from "./config.js";

if (!config.supabaseUrl || !config.supabaseServiceKey) {
  if (process.env.NODE_ENV === "production") {
    throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required in production");
  }
  console.warn("Supabase credentials missing. Database features will fail.");
}

export const supabase = createClient(
  config.supabaseUrl,
  config.supabaseServiceKey
);
