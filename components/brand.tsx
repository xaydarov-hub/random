import Link from 'next/link';
import { Shuffle } from 'lucide-react';
import { APP_NAME } from '@/lib/config';
export function Brand({name=APP_NAME}:{name?:string}){return <Link href="/" className="brand"><span className="brand-symbol"><Shuffle size={20}/></span>{name}<span className="brand-dot">.</span></Link>;}
