'use client';
import { useEffect,useState } from 'react';
import { Loader2 } from 'lucide-react';
import { api } from '@/lib/client';
export function useResource<T>(path:string){
  const [state,setState]=useState<{data:T|null;error:string;loading:boolean}>({data:null,error:'',loading:true});
  const [version,setVersion]=useState(0);
  useEffect(()=>{let active=true;api<T>(path).then(data=>{if(active)setState({data,error:'',loading:false});}).catch(e=>{if(active)setState({data:null,error:e.message,loading:false});});return()=>{active=false;};},[path,version]);
  return {...state,reload:()=>setVersion(v=>v+1)};
}
export function Busy(){return <Loader2 size={17} className="busy" aria-label="Yuklanmoqda"/>;}
export function ErrorBox({message}:{message:string}){return message?<div className="error" role="alert">{message}</div>:null;}
export function Loading(){return <div className="stack" aria-label="Yuklanmoqda" role="status"><div className="skeleton"/><div className="skeleton"/></div>;}
