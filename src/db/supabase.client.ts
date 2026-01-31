import type { AstroCookies } from "astro";
import { createClient, type SupabaseClient as SupabaseClientBase } from "@supabase/supabase-js";
import { createServerClient, type CookieOptionsWithName } from "@supabase/ssr";
import type { Database } from "../db/database.types.ts";

const supabaseUrl = import.meta.env.SUPABASE_URL;
const supabaseAnonKey = import.meta.env.SUPABASE_KEY;

// Validate required environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    `Missing required Supabase environment variables:\n` +
      `SUPABASE_URL: ${supabaseUrl ? "✓" : "✗ missing"}\n` +
      `SUPABASE_KEY: ${supabaseAnonKey ? "✓" : "✗ missing"}\n` +
      `Make sure .env file is properly configured.`
  );
}

// Client-side Supabase client (for services that don't need auth)
export const supabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey);

// Export typed SupabaseClient for use in services
export type SupabaseClient = SupabaseClientBase<Database>;

export const DEFAULT_USR_ID = "753d4083-183c-46f1-bfba-bd3115eb9386";

// Cookie options for Supabase SSR
// In production (HTTPS), cookies must be secure. In development (HTTP localhost), secure must be false.
export const cookieOptions: CookieOptionsWithName = {
  path: "/",
  secure: import.meta.env.PROD, // true in production, false in development
  httpOnly: true,
  sameSite: "lax",
};

function parseCookieHeader(cookieHeader: string): { name: string; value: string }[] {
  return cookieHeader.split(";").map((cookie) => {
    const [name, ...rest] = cookie.trim().split("=");
    return { name, value: rest.join("=") };
  });
}

// Server-side Supabase client with SSR support
export const createSupabaseServerInstance = (context: { headers: Headers; cookies: AstroCookies }) => {
  const supabase = createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookieOptions,
    cookies: {
      getAll() {
        return parseCookieHeader(context.headers.get("Cookie") ?? "");
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => context.cookies.set(name, value, options));
      },
    },
  });

  return supabase;
};
