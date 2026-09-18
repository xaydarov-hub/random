import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) return response;
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, { cookies: {
    getAll: () => request.cookies.getAll(),
    setAll: (values:{name:string;value:string;options:CookieOptions}[]) => { values.forEach(({name,value})=>request.cookies.set(name,value)); response=NextResponse.next({request}); values.forEach(({name,value,options})=>response.cookies.set(name,value,options)); },
  } });
  await supabase.auth.getUser();
  return response;
}
export const config = { matcher: ['/dashboard/:path*','/api/:path*'] };
