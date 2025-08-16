import { getSessionUser } from '@/lib/session';
import { redirect } from 'next/navigation';
import ProfileClient from './ProfileClient';

export default async function ProfilePage() {
  const user = await getSessionUser();
  
  if (!user) {
    redirect('/auth/signin');
  }

  return <ProfileClient user={user} />;
}
