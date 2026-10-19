import { NextResponse } from 'next/server';
import { getServerUser } from '@/lib/auth-server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const user = await getServerUser(request);
  if (!user) {
    return NextResponse.json(
      { authenticated: false, user: null },
      { status: 401, headers: { 'Cache-Control': 'no-store' } }
    );
  }

  return NextResponse.json(
    { authenticated: true, user },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}
