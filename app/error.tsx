'use client';
import { Button } from '@/components/ui/button';
export default function ErrorPage({reset}:{reset:()=>void}){return <main className="legal stack"><h1>Sahifani yuklab bo‘lmadi</h1><p>Baza ulanishi va server sozlamalarini tekshiring.</p><Button onClick={reset}>Qayta urinish</Button></main>;}
