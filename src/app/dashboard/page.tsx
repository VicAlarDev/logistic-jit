import { createClient } from '@/lib/supabase/client';
import { redirect } from 'next/navigation';

export default async function Dashboard() {
  const supabase = await createClient();

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect('/auth/sign-in');
  } else {
    redirect('/dashboard/overview');
  }
}
