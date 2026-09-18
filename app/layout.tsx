import type { Metadata } from 'next';
import { Providers } from '@/components/providers';
import { APP_NAME } from '@/lib/config';
import './globals.css';
export const metadata:Metadata={title:{default:`${APP_NAME} — Adolatli tanlov, unutilmas lahza`,template:`%s | ${APP_NAME}`},description:'Instagram kommentlari va ishtirokchilar ro‘yxatidan xavfsiz, adolatli g‘olib tanlang.'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="uz" suppressHydrationWarning><body><Providers>{children}</Providers></body></html>;}
