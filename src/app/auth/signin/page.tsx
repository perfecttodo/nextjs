import { getSessionUser } from '@/lib/session';
import { redirect } from 'next/navigation';
import SignInClient from './SignInClient';

export default async function SignInPage() {
  const user = await getSessionUser();
  if (user) {
    redirect('/');
  }
  return <SignInClient />;
}
