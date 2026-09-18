import { LoginForm } from '@/components/login-form';
import { authConfigured } from '@/lib/db/client';
import { demoEnabled } from '@/lib/auth/demo';
export default function Login(){return <LoginForm configured={authConfigured()} demo={demoEnabled()}/>;}
