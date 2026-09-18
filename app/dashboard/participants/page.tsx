'use client';
import Link from 'next/link';
import { Users,ArrowUpRight } from 'lucide-react';
import { useResource,ErrorBox,Empty } from '@/components/common';
import { Importer } from '@/components/importer';
import { dateLabel } from '@/lib/client';
import type { List } from '@/types/app';
export default function Participants(){const lists=useResource<List[]>('imports');return <><div className="page-heading"><h1>Ishtirokchilar</h1><p>Qayta foydalanish uchun ro‘yxatlar va importlar.</p></div><div className="stack"><div className="panel"><Importer onImported={()=>lists.reload()}/></div><div className="panel stack"><h2>Saqlangan ro‘yxatlar</h2><ErrorBox message={lists.error}/>{lists.data?.length?<div className="table-wrap"><table><thead><tr><th>RO‘YXAT</th><th>TURI</th><th>ISHTIROKCHILAR</th><th>YUKLANGAN</th><th/></tr></thead><tbody>{lists.data.map(l=><tr key={l.id}><td className="table-title"><span className="row"><Users size={17}/>{l.name}</span></td><td><span className="tag">{l.type==='followers'?'Obunachilar':'Ishtirokchilar'}</span></td><td>{l.valid_rows.toLocaleString()}</td><td className="muted">{dateLabel(l.created_at)}</td><td><Link className="text-link row" href={'/dashboard/new?list='+l.id}>Tanlov yaratish <ArrowUpRight size={15}/></Link></td></tr>)}</tbody></table></div>:<Empty title="Ro‘yxatlar hali yo‘q" description="Yuqoridagi import oynasi orqali birinchi ro‘yxatingizni qo‘shing."/>}</div></div></>;}
