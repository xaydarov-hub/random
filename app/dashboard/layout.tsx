import { redirect } from 'next/navigation';
import { getOptionalUser } from '@/lib/auth/session';
import { DashboardShell } from '@/components/dashboard-shell';
export const dynamic='force-dynamic';
export default async function DashboardLayout({children}:{children:React.ReactNode}){const user=await getOptionalUser();if(!user)redirect('/login');return <DashboardShell email={user.email??'Hisob'}>{children}</DashboardShell>;}
