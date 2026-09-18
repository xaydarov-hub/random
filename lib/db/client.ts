import 'server-only';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
export const authConfigured = () => Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
export async function createServerSupabaseClient() {
  const jar = await cookies();
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: { getAll: () => jar.getAll(), setAll: (values:{name:string;value:string;options:CookieOptions}[]) => { try { values.forEach(({name,value,options}) => jar.set(name,value,options)); } catch { /* Proxy refreshes cookies for Server Components. */ } } },
  });
}
