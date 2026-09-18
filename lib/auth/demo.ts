import 'server-only';
import { createHmac,timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';
import { IS_DEMO_MODE } from '@/lib/config';
export const DEMO_USER_ID='10000000-0000-4000-8000-000000000001';
export function demoEnabled(){return IS_DEMO_MODE && Boolean(process.env.DEMO_SESSION_SECRET) && process.env.NODE_ENV==='development';}
export function signDemoSession(){const expiry=String(Date.now()+8*60*60*1000);return expiry+'.'+createHmac('sha256',process.env.DEMO_SESSION_SECRET!).update(expiry).digest('hex');}
export async function demoUser(){
  if(!demoEnabled())return null;
  const raw=(await cookies()).get('randompick_demo')?.value;if(!raw)return null;
  const [expiry,signature]=raw.split('.');if(!expiry||!signature||!/^[a-f0-9]{64}$/.test(signature)||!Number.isFinite(Number(expiry))||Number(expiry)<=Date.now())return null;
  const expected=createHmac('sha256',process.env.DEMO_SESSION_SECRET!).update(expiry).digest();
  if(!timingSafeEqual(Buffer.from(signature,'hex'),expected))return null;
  return {id:DEMO_USER_ID,email:'demo@randompick.local',app_metadata:{},user_metadata:{},aud:'authenticated',created_at:'2026-01-01T00:00:00Z'};
}
