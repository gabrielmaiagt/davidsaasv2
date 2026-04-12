import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

const SESSION_COOKIE = 'cfm_session';

export async function setSession(userId: string, role: string) {
  const c = await cookies();
  c.set(SESSION_COOKIE, JSON.stringify({ userId, role }), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 1 week
  });
}

export async function getSession() {
  const c = await cookies();
  const session = c.get(SESSION_COOKIE);
  if (!session) return null;
  try {
    return JSON.parse(session.value) as { userId: string; role: string };
  } catch {
    return null;
  }
}

export async function getOrganizationId() {
  const session = await getSession();
  if (!session) return null;
  // Por enquanto, o userId é o próprio organizationId (modelo 1:1)
  return session.userId;
}

export async function clearSession() {
  const c = await cookies();
  c.delete(SESSION_COOKIE);
}
