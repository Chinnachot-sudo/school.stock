import { NextResponse } from 'next/server';
import { readDb, writeDb } from '@/lib/db';
import { Category } from '@/types/inventory';
import { isSupabaseConfigured, supabaseAdmin as supabase } from '@/lib/supabase';

const DEFAULT_CATEGORIES: Category[] = [
  { id: 'cat-uniform', name: 'Uniforms & Dress Code', icon: '👕', description: 'School uniforms, polo shirts, shorts, skirts, PE kit' },
  { id: 'cat-books', name: 'IB Textbooks & Workbooks', icon: '📚', description: 'PYP, MYP, DP, CP curriculum books and workbooks' },
  { id: 'cat-stationery', name: 'Stationery & Study Supplies', icon: '✏️', description: 'Pens, pencils, erasers, rulers, scissors, art colors' },
  { id: 'cat-paper', name: 'Paper & School Notebooks', icon: '📄', description: 'School exercise notebooks, A4 reams, planners' },
  { id: 'cat-it', name: 'IT & EdTech Supplies', icon: '💻', description: 'Printer toners, computer accessories, AV cables' },
  { id: 'cat-science', name: 'Science Lab Equipment', icon: '🔬', description: 'Test tubes, lab glassware, safety goggles' },
  { id: 'cat-art', name: 'Art & Design Supplies', icon: '🎨', description: 'Watercolors, canvas, sketch pads, sculpting clay' },
  { id: 'cat-pe', name: 'PHE & Sports Equipment', icon: '⚽', description: 'Balls, cones, badminton rackets, sports gear' },
  { id: 'cat-cleaning', name: 'Hygiene & Facilities', icon: '🧹', description: 'Cleaning supplies, sanitizers, tissues' },
  { id: 'cat-equipment', name: 'Audio-Visual & Loans', icon: '📽️', description: 'Projectors, wireless microphones, adapters' }
];

export async function GET() {
  try {
    if (isSupabaseConfigured && supabase) {
      const [catRes, deptRes] = await Promise.all([
        supabase.from('categories').select('*').order('name'),
        supabase.from('departments').select('*').order('name')
      ]);

      let categories = catRes.data || [];

      // If Supabase categories table is empty, auto-seed defaults so dropdowns are never blank!
      if (categories.length === 0) {
        try {
          const { data: seeded, error: seedErr } = await supabase
            .from('categories')
            .insert(DEFAULT_CATEGORIES.map(c => ({ id: c.id, name: c.name, icon: c.icon })))
            .select();
          if (!seedErr && seeded) {
            categories = seeded;
          } else {
            categories = DEFAULT_CATEGORIES;
          }
        } catch (e) {
          categories = DEFAULT_CATEGORIES;
        }
      }

      return NextResponse.json({
        categories,
        departments: deptRes.data || []
      });
    }

    const db = readDb();
    return NextResponse.json({
      categories: db.categories || DEFAULT_CATEGORIES,
      departments: db.departments || []
    });
  } catch (error: any) {
    console.error('Error fetching categories:', error);
    return NextResponse.json({
      categories: DEFAULT_CATEGORIES,
      departments: []
    });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, icon = '🏷️', description = '' } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Category name is required' }, { status: 400 });
    }

    const cleanName = name.trim();
    const cleanIcon = icon.trim() || '🏷️';
    const cleanDesc = (description || '').trim();
    const categoryId = `cat-${Date.now()}`;

    const newCategory: Category = {
      id: categoryId,
      name: cleanName,
      icon: cleanIcon,
      description: cleanDesc
    };

    // 1. Supabase Cloud DB
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('categories')
        .insert({
          id: categoryId,
          name: cleanName,
          icon: cleanIcon
        })
        .select()
        .single();

      if (error) {
        console.error('Supabase category insert error:', error);
        throw new Error(error.message || 'Failed to insert category in Supabase');
      }

      return NextResponse.json({
        success: true,
        category: data
      });
    }

    // 2. Local JSON DB Fallback
    const db = readDb();
    if (!db.categories) db.categories = [];

    const existing = db.categories.find(c => c.name.toLowerCase() === cleanName.toLowerCase());
    if (existing) {
      return NextResponse.json({ error: `Category "${cleanName}" already exists` }, { status: 400 });
    }

    db.categories.push(newCategory);
    writeDb(db);

    return NextResponse.json({
      success: true,
      category: newCategory
    });
  } catch (error: any) {
    console.error('Error creating category:', error);
    return NextResponse.json({ error: error.message || 'Internal error creating category' }, { status: 500 });
  }
}
