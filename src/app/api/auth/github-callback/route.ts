import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { nextIDStr,login } from '@/lib/ID';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');

    console.log('code', code);

    if (!code) {

      const signInUrl = new URL('/auth/signin', req.url);
      signInUrl.searchParams.set('error', 'GitHub authorization failed');

      return NextResponse.redirect(signInUrl);
    }

    // Exchange code for access token
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
        redirect_uri: process.env.GITHUB_REDIRECT_URI,
      }),
    });

    const tokenData = await tokenResponse.json();


    
    if (tokenData.error) {
      console.error('GitHub token error:', tokenData);

      const signInUrl = new URL('/auth/signin', req.url);
      signInUrl.searchParams.set('error', 'GitHub authorization failed');

      return NextResponse.redirect(signInUrl);
    }

    const accessToken = tokenData.access_token;

    // Get user info from GitHub
    const userResponse = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/vnd.github.v3+json',
      },
    });

    const userData = await userResponse.json();

    // Get user email from GitHub
    const emailsResponse = await fetch('https://api.github.com/my/emails', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/vnd.github.v3+json',
      },
    });

    const emailsData = await emailsResponse.json();
    const primaryEmail = emailsData.find((email: any) => email.primary)?.email || userData.email;

    if (!primaryEmail) {
      const signInUrl = new URL('/auth/signin', req.url);
      signInUrl.searchParams.set('error', 'Could not get email from GitHub');

      return NextResponse.redirect(signInUrl);

    }

    // Create or update user
    const githubId = 'github:' + userData.id.toString();
    const user = await prisma.user.upsert({
      where: { githubId },
      update: {
        email: primaryEmail,
        name: userData.name || userData.login,
      },
      create: {
        id: await nextIDStr(),
        githubId,
        email: primaryEmail,
        name: userData.name || userData.login,
        emailVerified:true
      },
    });


    return login(user.id, user.email || '', user.name||'', req);

  } catch (error) {
    console.error('GitHub callback error:', error);

    const signInUrl = new URL('/auth/signin', req.url);
    signInUrl.searchParams.set('error', 'GitHub authorization failed 2 '+ error);

    

    return NextResponse.redirect(signInUrl);

  }
}
