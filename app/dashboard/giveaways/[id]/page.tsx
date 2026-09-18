import { notFound } from 'next/navigation';
import { z } from 'zod';
import { GiveawayDetails } from '@/components/giveaway-detail';
export default async function Detail({params}:{params:Promise<{id:string}>}){const {id}=await params;if(!z.string().uuid().safeParse(id).success)notFound();return <GiveawayDetails id={id}/>;}
