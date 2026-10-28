import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getServerUser } from '@/lib/auth-server';
import { logAuditEvent } from '@/lib/audit';

export async function POST() {
  try {
    const user = await getServerUser();
    if (user) {
      await logAuditEvent({
        category: 'SECURITY',
        action: 'LOGOUT',
        details: `User ${user.username} logged out`,
        actorId: user.id,
        actorName: user.name || user.username,
        actorEmail: user.email,
        targetId: user.id,
        targetName: user.username
      });
    }
    const cookieStore = await cookies();
    cookieStore.delete('school_session');
    cookieStore.delete('school_user');
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
