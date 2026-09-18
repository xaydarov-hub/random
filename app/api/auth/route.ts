import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { authConfigured,createServerSupabaseClient } from '@/lib/db/client';
export async function POST(request:Request){
  const origin=new URL(process.env.NEXT_PUBLIC_APP_URL??request.url).origin;
  if(request.headers.get('origin')!==origin)return NextResponse.json({message:'So‘rov manbasi noto‘g‘ri.'},{status:403});
  try{
    const input=z.object({action:z.enum(['login','signup','logout']),email:z.string().email().optional(),password:z.string().min(8).max(128).optional()}).parse(await request.json());
    if(input.action==='logout'){
      (await cookies()).delete({name:'randompick_demo',path:'/'});
      if(authConfigured()){const supabase=await createServerSupabaseClient();await supabase.auth.signOut();}
      return NextResponse.json({ok:true});
    }
    if(!authConfigured())return NextResponse.json({message:'Supabase hali sozlanmagan.'},{status:503});
    if(!input.email||!input.password)return NextResponse.json({message:'Email va kamida 8 belgili parol kiriting.'},{status:400});
    const supabase=await createServerSupabaseClient();
    const {data,error}=input.action==='signup'?await supabase.auth.signUp({email:input.email,password:input.password,options:{emailRedirectTo:origin+'/auth/confirm'}}):await supabase.auth.signInWithPassword({email:input.email,password:input.password});
    if(error)return NextResponse.json({message:'Kirish amalga oshmadi. Email, parol va email tasdiqlanganini tekshiring.'},{status:400});
    return NextResponse.json({ok:true,confirmationRequired:!data.session});
  }catch{return NextResponse.json({message:'Email va parolni tekshiring.'},{status:400});}
}
