import { getSessionUser } from '@/lib/session';
import { redirect } from 'next/navigation';
import SignUpFace from './SignUpFace';

export default async function SignInPage() {
  const user = await getSessionUser();
  if (user) {
    redirect('/');
  }
  return <SignUpFace />;
}
