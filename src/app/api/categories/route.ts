import { NextResponse } from 'next/server';
import { readDb } from '@/lib/db';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';

export async function GET() {
  try {
    if (isSupabaseConfigured && supabase) {
      const [catRes, deptRes] = await Promise.all([
        supabase.from('categories').select('*').order('name'),
        supabase.from('departments').select('*').order('name')
      ]);

      return NextResponse.json({
        categories: catRes.data || [],
        departments: deptRes.data || []
      });
    }

    const db = readDb();
    return NextResponse.json({
      categories: db.categories,
      departments: db.departments
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
  }
}
