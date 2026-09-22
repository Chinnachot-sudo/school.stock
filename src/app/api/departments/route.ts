import { NextResponse } from 'next/server';
import { readDb, writeDb } from '@/lib/db';
import { Department } from '@/types/inventory';
import { isSupabaseConfigured, supabaseAdmin as supabase } from '@/lib/supabase';

export async function GET() {
  try {
    const db = readDb();
    return NextResponse.json({
      departments: db.departments || []
    });
  } catch (error: any) {
    console.error('Error fetching departments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch departments' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, allocatedBudget, spentBudget, name } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Department ID is required' },
        { status: 400 }
      );
    }

    const db = readDb();
    const deptIndex = db.departments.findIndex(d => d.id === id);

    if (deptIndex === -1) {
      return NextResponse.json(
        { error: 'Department not found' },
        { status: 404 }
      );
    }

    const dept = db.departments[deptIndex];
    if (allocatedBudget !== undefined) dept.allocatedBudget = Number(allocatedBudget);
    if (spentBudget !== undefined) dept.spentBudget = Number(spentBudget);
    if (name) dept.name = String(name).trim();

    db.departments[deptIndex] = dept;
    writeDb(db);

    return NextResponse.json({
      success: true,
      department: dept
    });
  } catch (error: any) {
    console.error('Error updating department:', error);
    return NextResponse.json(
      { error: 'Failed to update department' },
      { status: 500 }
    );
  }
}
