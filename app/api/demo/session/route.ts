import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { demoEnabled,signDemoSession } from '@/lib/auth/demo';
export async function POST(request:Request){
  if(!demoEnabled())return new Response(null,{status:404});
  if(request.headers.get('origin')!==new URL(process.env.NEXT_PUBLIC_APP_URL??request.url).origin)return new Response(null,{status:403});
  (await cookies()).set('randompick_demo',signDemoSession(),{httpOnly:true,sameSite:'strict',secure:false,maxAge:8*60*60,path:'/'});
  return NextResponse.json({ok:true});
}
