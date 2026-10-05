import { NextResponse } from 'next/server';
import { readDb, writeDb } from '@/lib/db';
import { Department } from '@/types/inventory';
import { isSupabaseConfigured, supabaseAdmin as supabase } from '@/lib/supabase';
import { requireAuth, requirePermission } from '@/lib/auth-server';

export async function GET(request: Request) {
  try {
    const authCheck = await requireAuth(request);
    if (authCheck.errorResponse) {
      return authCheck.errorResponse;
    }

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('departments').select('*').order('name');
      if (!error && data) {
        const departments: Department[] = data.map((row: any) => ({
          id: row.id,
          name: row.name,
          allocatedBudget: Number(row.allocated_budget || row.allocatedBudget) || 0,
          spentBudget: Number(row.spent_budget || row.spentBudget) || 0,
          fiscalYear: row.fiscal_year || row.fiscalYear || '2026-2027'
        }));
        return NextResponse.json({ departments });
      }
    }

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
    const authCheck = await requirePermission(request, 'iam:settings:configure');
    if (authCheck.errorResponse) {
      return authCheck.errorResponse;
    }

    const body = await request.json();
    const { id, allocatedBudget, spentBudget, name } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Department ID is required' },
        { status: 400 }
      );
    }

    if (isSupabaseConfigured && supabase) {
      const updateData: Record<string, any> = { updated_at: new Date().toISOString() };
      if (allocatedBudget !== undefined) updateData.allocated_budget = Number(allocatedBudget);
      if (spentBudget !== undefined) updateData.spent_budget = Number(spentBudget);
      if (name) updateData.name = String(name).trim();

      const { data, error } = await supabase
        .from('departments')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      const department: Department = {
        id: data.id,
        name: data.name,
        allocatedBudget: Number(data.allocated_budget || data.allocatedBudget) || 0,
        spentBudget: Number(data.spent_budget || data.spentBudget) || 0,
        fiscalYear: data.fiscal_year || data.fiscalYear || '2026-2027'
      };

      return NextResponse.json({
        success: true,
        department
      });
    }

    // Offline / Local DB fallback
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
      { error: error.message || 'Failed to update department' },
      { status: 500 }
    );
  }
}
