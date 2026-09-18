'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/client';
import { Button } from './ui/button';
import { Busy,ErrorBox } from './common';
export function DemoEntry(){const router=useRouter(),[busy,setBusy]=useState(false),[error,setError]=useState('');return <div className="stack"><ErrorBox message={error}/><Button disabled={busy} onClick={async()=>{setBusy(true);try{await api('demo/session',{});router.replace('/dashboard');router.refresh();}catch(e){setError((e as Error).message);setBusy(false);}}}>{busy&&<Busy/>}Demo ish maydoniga kirish →</Button></div>;}
