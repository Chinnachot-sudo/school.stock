import { NextResponse } from 'next/server';
import { readDb, writeDb } from '@/lib/db';
import { Category } from '@/types/inventory';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';

const DEFAULT_CATEGORIES: Category[] = [
  { id: 'cat-uniform', name: 'ชุดนักเรียนและเครื่องแบบ (Uniforms)', icon: '👕', description: 'เครื่องแบบนักเรียน เสื้อเชิ้ต กางเกง กระโปรง ชุดพละ' },
  { id: 'cat-books', name: 'หนังสือและแบบเรียน IB (Textbooks & Workbooks)', icon: '📚', description: 'หนังสือเรียน PYP, MYP, DP, CP และแบบฝึกหัด' },
  { id: 'cat-stationery', name: 'เครื่องเขียนและอุปกรณ์การเรียน (Stationery)', icon: '✏️', description: 'ปากกา ดินสอ ยางลบ ไม้บรรทัด กรรไกร สี' },
  { id: 'cat-paper', name: 'กระดาษและสมุดโรงเรียน (Paper & Notebooks)', icon: '📄', description: 'สมุดรายงานโรงเรียน กระดาษ A4 สมุดจดการบ้าน' },
  { id: 'cat-it', name: 'หมึกพิมพ์และอุปกรณ์ไอที (IT & EdTech)', icon: '💻', description: 'หมึกพิมพ์ สายต่อคอมพิวเตอร์ อุปกรณ์ไอที' },
  { id: 'cat-science', name: 'อุปกรณ์การทดลองวิทย์ (Science Lab)', icon: '🔬', description: 'หลอดทดลอง สารเคมี แว่นตานิรภัย' },
  { id: 'cat-art', name: 'อุปกรณ์ศิลปะและงานดีไซน์ (Art & Design)', icon: '🎨', description: 'สีน้ำ สีโปสเตอร์ กระดาษวาดเขียน ดินน้ำมัน' },
  { id: 'cat-pe', name: 'อุปกรณ์กีฬาและพลศึกษา (PHE & Sports)', icon: '⚽', description: 'ลูกบอล กรวยฝึกซ้อม ไม้แบดมินตัน' },
  { id: 'cat-cleaning', name: 'อุปกรณ์ทำความสะอาด (Hygiene & Facilities)', icon: '🧹', description: 'น้ำยาทำความสะอาด ทิชชู่ ถุงขยะ' },
  { id: 'cat-equipment', name: 'ครุภัณฑ์ยืม-คืน (Audio-Visual Equipment)', icon: '📽️', description: 'โปรเจคเตอร์ ไมโครโฟน สายสัญญาณ' }
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
      return NextResponse.json({ error: 'กรุณาระบุชื่อหมวดหมู่' }, { status: 400 });
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
        throw new Error(error.message || 'ไม่สามารถเพิ่มหมวดหมู่ใน Supabase ได้');
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
      return NextResponse.json({ error: `มีหมวดหมู่ "${cleanName}" อยู่แล้ว` }, { status: 400 });
    }

    db.categories.push(newCategory);
    writeDb(db);

    return NextResponse.json({
      success: true,
      category: newCategory
    });
  } catch (error: any) {
    console.error('Error creating category:', error);
    return NextResponse.json({ error: error.message || 'เกิดข้อผิดพลาดในการสร้างหมวดหมู่' }, { status: 500 });
  }
}
