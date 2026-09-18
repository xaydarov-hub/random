'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { useResource,Loading,ErrorBox,Pagination } from '@/components/common';
import { Button } from '@/components/ui/button';
import { GiveawayTable } from '@/components/giveaway-table';
import type { Giveaway } from '@/types/app';
export default function History(){const [page,setPage]=useState(1),[query,setQuery]=useState('');const {data,error,loading}=useResource<{items:Giveaway[];total:number}>(`giveaways?page=${page}&q=${encodeURIComponent(query)}`);return <><div className="page-heading between"><div><h1>Giveaway’lar</h1><p>Tanlovlar tarixi va saqlangan natijalar.</p></div><Button asChild><Link href="/dashboard/new"><Plus size={17}/>Yangi giveaway</Link></Button></div><div className="panel stack"><label style={{maxWidth:380}}>Giveaway qidirish<input placeholder="Nomi bo‘yicha qidirish..." value={query} onChange={e=>{setQuery(e.target.value);setPage(1);}}/></label><ErrorBox message={error}/>{loading?<Loading/>:data&&<><GiveawayTable items={data.items}/><Pagination page={page} total={data.total} setPage={setPage}/></>}</div></>;}
