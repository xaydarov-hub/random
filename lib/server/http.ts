import 'server-only';
import { NextResponse } from 'next/server';
import { z, ZodError } from 'zod';
import { getAuthenticatedUser } from '@/lib/auth/session';
import { authConfigured } from '@/lib/db/client';
import { demoEnabled } from '@/lib/auth/demo';
import { db } from '@/lib/db/sql';
import { AppError, ERROR_MESSAGES } from '@/types/errors';
export function fail(message:string, status=400): never { throw new AppError('VALIDATION_ERROR', message, status); }
export async function body<S extends z.ZodTypeAny>(request:Request, schema:S):Promise<z.output<S>> {
  if (Number(request.headers.get('content-length')??0)>9_000_000) fail('Fayl 8 MB dan katta.',413);
  const reader=request.body?.getReader(); if(!reader) fail('Ma’lumot yuborilmadi.');
  const chunks:Uint8Array[]=[]; let size=0;
  while(true){ const part=await reader.read(); if(part.done)break; size+=part.value.length; if(size>9_000_000){await reader.cancel();fail('Fayl 8 MB dan katta.',413);} chunks.push(part.value); }
  try { return schema.parse(JSON.parse(Buffer.concat(chunks).toString('utf8'))); } catch(e) { if(e instanceof ZodError)throw e; fail('JSON formati noto‘g‘ri.'); }
}
export function route(handler:(request:Request,userId:string)=>Promise<unknown>, bucket='read') {
  return async(request:Request) => {
    try {
      if (!authConfigured() && !demoEnabled()) return NextResponse.json({message:'Supabase hali sozlanmagan. README dagi sozlash bosqichlarini bajaring.'},{status:503});
      const user=await getAuthenticatedUser();
      if(request.method!=='GET') {
        const origin=request.headers.get('origin');
        if(!origin || origin!==new URL(process.env.NEXT_PUBLIC_APP_URL??request.url).origin) fail('So‘rov manbasi tasdiqlanmadi.',403);
        const sql=db();
        const [limit]=await sql`insert into rate_limits(user_id,bucket,window_start,hits) values(${user.id},${bucket},date_trunc('minute',now()),1) on conflict(user_id,bucket) do update set hits=case when rate_limits.window_start=date_trunc('minute',now()) then rate_limits.hits+1 else 1 end, window_start=date_trunc('minute',now()) returning hits`;
        if(limit.hits>(bucket==='draw'?10:90)) return NextResponse.json({message:'So‘rovlar limiti tugadi. Bir daqiqadan keyin urinib ko‘ring.'},{status:429,headers:{'Retry-After':'60'}});
      }
      const result=await handler(request,user.id);
      return result instanceof Response?result:NextResponse.json(result,{headers:{'Cache-Control':'no-store'}});
    } catch(error) {
      if(error instanceof ZodError) return NextResponse.json({message:'Maydonlarni tekshiring.',issues:error.issues.map(e=>({path:e.path,message:e.message}))},{status:400});
      if(error instanceof AppError) return NextResponse.json({code:error.code,message:error.code==='VALIDATION_ERROR'?error.message:ERROR_MESSAGES[error.code]},{status:error.statusCode});
      const unconfigured=error instanceof Error && error.message==='DATABASE_NOT_CONFIGURED';
      return NextResponse.json({message:unconfigured?'Ma’lumotlar bazasi sozlanmagan. DATABASE_URL ni kiriting.':'Amal bajarilmadi. Baza ulanishini tekshirib, qayta urinib ko‘ring.'},{status:503});
    }
  };
}
