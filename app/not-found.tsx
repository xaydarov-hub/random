import Link from 'next/link';
import { Brand } from '@/components/brand';
export default function NotFound(){return <main className="legal stack"><Brand/><h1>Sahifa topilmadi</h1><p className="muted">Havola noto‘g‘ri yoki bu natija ommaviy ko‘rish uchun ochilmagan.</p><Link href="/dashboard" className="text-link">Boshqaruv paneliga qaytish →</Link></main>;}
