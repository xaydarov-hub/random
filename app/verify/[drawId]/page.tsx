import { notFound } from 'next/navigation';
import { z } from 'zod';
import { ShieldCheck,Trophy } from 'lucide-react';
import { db } from '@/lib/db/sql';
import { Brand } from '@/components/brand';
import { dateLabel } from '@/lib/client';
export const dynamic='force-dynamic';
export default async function Verify({params}:{params:Promise<{drawId:string}>}){
  const {drawId}=await params;if(!z.string().uuid().safeParse(drawId).success)notFound();
  if(!process.env.DATABASE_URL)notFound();
  const sql=db(),[draw]=await sql`select d.id,d.sequence_number,d.eligible_count,d.participant_pool_hash,d.random_method,d.created_at,g.name from draws d join giveaways g on g.id=d.giveaway_id where d.id=${drawId} and d.public=true`;
  if(!draw)notFound();const winners=await sql`select username,position,is_reserve from winners where draw_id=${drawId} order by position`;
  return <main className="legal stack"><Brand/><div className="panel stack"><span className="tag tag-green" style={{width:'fit-content'}}><ShieldCheck size={16}/>Saqlangan tanlov natijasi</span><h1>{draw.name}</h1><p className="muted">Tanlov #{draw.sequence_number} · {dateLabel(draw.created_at)}</p><div className="grid2"><div className="notice"><small>Ishtirokchilar</small><h2>{draw.eligible_count.toLocaleString()}</h2></div><div className="notice"><small>Tasodifiy tanlash usuli</small><h3>{draw.random_method}</h3></div></div>{winners.map(w=><div className="row panel" key={w.position}><Trophy color="var(--accent)"/><div><small>{w.is_reserve?'Zaxira g‘olib':'G‘olib'} #{w.position}</small><h2>@{w.username}</h2></div></div>)}<div><small>Ishtirokchilar ro‘yxatining SHA-256 hashi</small><p className="hash">{draw.participant_pool_hash}</p></div><p className="notice">Hash tanlov paytidagi ro‘yxatni belgilaydi. Bu yozuv natijaning audit ma’lumotidir; mustaqil tasodifiylik isboti emas. Boshqa ishtirokchilarning shaxsiy ma’lumotlari ochiq ko‘rsatilmaydi.</p></div></main>;
}
