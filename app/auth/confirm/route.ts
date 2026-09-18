import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/db/client';
export async function GET(request:Request){
  const url=new URL(request.url),supabase=await createServerSupabaseClient();
  const code=url.searchParams.get('code'),hash=url.searchParams.get('token_hash');
  const result=code?await supabase.auth.exchangeCodeForSession(code):hash?await supabase.auth.verifyOtp({token_hash:hash,type:'email'}):{error:true};
  return NextResponse.redirect(new URL(result.error?'/login?error=confirmation':'/dashboard',process.env.NEXT_PUBLIC_APP_URL??url.origin));
}
