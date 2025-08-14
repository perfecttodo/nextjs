import { NextResponse, NextRequest } from 'next/server';
import { SignJWT } from 'jose';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');

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
    const emailsResponse = await fetch('https://api.github.com/user/emails', {
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
    const user = await prisma.user.upsert({
      where: { githubId: userData.id.toString() },
      update: {
        email: primaryEmail,
        name: userData.name || userData.login,
      },
      create: {
        id: `github_${userData.id}`,
        githubId: userData.id.toString(),
        email: primaryEmail,
        name: userData.name || userData.login,
      },
    });

    // Issue JWT token
    const secret = new TextEncoder().encode(
      process.env.NEXTAUTH_SECRET || 'dev-secret'
    );
    const token = await new SignJWT({
      sub: user.id,
      email: user.email,
      name: user.name,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('7d')
      .setIssuedAt()
      .sign(secret);

    const res = NextResponse.redirect('/');
    res.cookies.set('app_session', token, {
      httpOnly: true,
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
    });

    return res;
  } catch (error) {
    console.error('GitHub callback error:', error);

    const signInUrl = new URL('/auth/signin', req.url);
    signInUrl.searchParams.set('error', 'GitHub authorization failed');

    return NextResponse.redirect(signInUrl);

  }
}
