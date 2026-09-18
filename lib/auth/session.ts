import { createServerSupabaseClient } from '@/lib/db/client';
import { AppError } from '@/types/errors';
import { demoUser } from './demo';

/**
 * Gets the currently authenticated user from the session.
 * Throws AppError if not authenticated.
 */
export async function getAuthenticatedUser() {
  const demo=await demoUser();if(demo)return demo;
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new AppError('AUTH_REQUIRED', 'Authentication required', 401);
  }

  return user;
}

/**
 * Gets the authenticated user without throwing — returns null if not authenticated.
 */
export async function getOptionalUser() {
  const demo=await demoUser();if(demo)return demo;
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user;
  } catch {
    return null;
  }
}
