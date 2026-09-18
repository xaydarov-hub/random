import { notFound } from 'next/navigation';
import { demoEnabled } from '@/lib/auth/demo';
import { Brand } from '@/components/brand';
import { DemoEntry } from '@/components/demo-entry';
export const dynamic='force-dynamic';
export default function Demo(){if(!demoEnabled())notFound();return <main className="legal stack"><Brand/><div className="panel stack"><span className="tag">DEMO MA’LUMOT · Faqat lokal sinov</span><h1>RandomPick’ni sinab ko‘ring</h1><p>Import, filtrlar, g‘olib tanlash, tarix va eksport lokal PostgreSQL bazasi bilan ishlaydi. Boshlang‘ich ro‘yxatdagi username’lar sun’iy test ma’lumotidir.</p><p className="notice">Instagram ulanishi uchun haqiqiy Meta sozlamalari kerak. Demo rejimi production build’da ishlamaydi. Lokal ma’lumotlar .local-demo papkasida saqlanadi.</p><DemoEntry/></div></main>;}
