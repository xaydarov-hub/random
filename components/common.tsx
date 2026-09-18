'use client';
import { useEffect,useState } from 'react';
import { Loader2,FolderOpen } from 'lucide-react';
import { api } from '@/lib/client';
import { Button } from './ui/button';
export function useResource<T>(path:string){
  const [state,setState]=useState<{data:T|null;error:string;loading:boolean}>({data:null,error:'',loading:true});
  const [version,setVersion]=useState(0);
  useEffect(()=>{let active=true;api<T>(path).then(data=>{if(active)setState({data,error:'',loading:false});}).catch(e=>{if(active)setState({data:null,error:e.message,loading:false});});return()=>{active=false;};},[path,version]);
  return {...state,reload:()=>setVersion(v=>v+1)};
}
export function Busy(){return <Loader2 size={17} className="busy" aria-label="Yuklanmoqda"/>;}
export function ErrorBox({message}:{message:string}){return message?<div className="error" role="alert">{message}</div>:null;}
export function Empty({title,description,children}:{title:string;description:string;children?:React.ReactNode}){return <div className="empty"><div className="empty-icon"><FolderOpen size={28}/></div><h3>{title}</h3><p>{description}</p>{children}</div>;}
export function Loading(){return <div className="stack" aria-label="Yuklanmoqda" role="status"><div className="skeleton"/><div className="skeleton"/></div>;}
export function Pagination({page,total,size=20,setPage}:{page:number;total:number;size?:number;setPage:(n:number)=>void}){return <div className="pagination"><span>{total.toLocaleString()} ta · {page} / {Math.max(1,Math.ceil(total/size))}</span><Button variant="secondary" disabled={page<=1} onClick={()=>setPage(page-1)} aria-label="Oldingi sahifa">←</Button><Button variant="secondary" disabled={page*size>=total} onClick={()=>setPage(page+1)} aria-label="Keyingi sahifa">→</Button></div>;}
