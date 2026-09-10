'use client';

import { useState } from 'react';
import { Category } from '@/types/inventory';
import { X, Plus, Trash2, Tag, CheckCircle2, AlertTriangle, Sparkles, Pencil } from 'lucide-react';

interface CategoryManageModalProps {
  categories: Category[];
  isOpen: boolean;
  onClose: () => void;
  onUpdated: () => void;
}

const QUICK_EMOJIS = ['👕', '📚', '✏️', '📄', '💻', '🔬', '🎨', '⚽', '🧹', '📽️', '🏷️', '🥪', '🍎', '🧴', '📦', '🎒'];

export default function CategoryManageModal({
  categories,
  isOpen,
  onClose,
  onUpdated
}: CategoryManageModalProps) {
  const [newCatName, setNewCatName] = useState('');
  const [newCatIcon, setNewCatIcon] = useState('🏷️');
  const [newCatDesc, setNewCatDesc] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingCat, setEditingCat] = useState<Category | null>(null);

  if (!isOpen) return null;

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) {
      setError('กรุณากรอกชื่อหมวดหมู่');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newCatName.trim(),
          icon: newCatIcon,
          description: newCatDesc.trim()
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'ไม่สามารถเพิ่มหมวดหมู่ได้');

      setNewCatName('');
      setNewCatIcon('🏷️');
      setNewCatDesc('');
      onUpdated();
    } catch (err: any) {
      setError(err.message || 'เกิดข้อผิดพลาดในการบันทึกหมวดหมู่');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCat || !editingCat.name.trim()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/categories/${editingCat.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editingCat.name.trim(),
          icon: editingCat.icon || '🏷️',
          description: editingCat.description || ''
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'ไม่สามารถแก้ไขหมวดหมู่ได้');

      setEditingCat(null);
      onUpdated();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCategory = async (id: string, name: string) => {
    if (!confirm(`คุณต้องการลบหมวดหมู่ "${name}" ใช่หรือไม่?`)) return;

    try {
      const res = await fetch(`/api/categories/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'ไม่สามารถลบหมวดหมู่ได้');

      onUpdated();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
              <Tag className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-extrabold text-base">จัดการหมวดหมู่สินค้าและพัสดุ</h2>
              <p className="text-xs text-slate-400">เพิ่ม แก้ไข หรือลบหมวดหมู่สำหรับจัดระเบียบคลังและหน้าร้าน</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-500" />
              <span>{error}</span>
            </div>
          )}

          {/* Form to Add New Category */}
          <form onSubmit={handleAddCategory} className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
            <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-blue-600" />
              <span>เพิ่มหมวดหมู่ใหม่</span>
            </h3>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                เลือกไอคอน
              </label>
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                {QUICK_EMOJIS.map(emoji => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setNewCatIcon(emoji)}
                    className={`w-8 h-8 rounded-lg text-base flex items-center justify-center transition ${
                      newCatIcon === emoji
                        ? 'bg-blue-600 text-white scale-110 shadow-sm'
                        : 'bg-white hover:bg-slate-200 border border-slate-200'
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  ชื่อหมวดหมู่ *
                </label>
                <input
                  type="text"
                  required
                  placeholder="เช่น ชุดนักเรียนและเครื่องแบบ"
                  value={newCatName}
                  onChange={e => setNewCatName(e.target.value)}
                  className="w-full text-xs bg-white border border-slate-200 rounded-xl p-2.5 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  คำอธิบาย (ไม่บังคับ)
                </label>
                <input
                  type="text"
                  placeholder="รายละเอียดสั้นๆ"
                  value={newCatDesc}
                  onChange={e => setNewCatDesc(e.target.value)}
                  className="w-full text-xs bg-white border border-slate-200 rounded-xl p-2.5 focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-500/20 active:scale-95 transition"
              >
                {isSubmitting ? 'กำลังบันทึก...' : '+ บันทึกหมวดหมู่ใหม่'}
              </button>
            </div>
          </form>

          {/* Existing Categories List */}
          <div>
            <h3 className="text-xs font-bold text-slate-700 mb-2">
              หมวดหมู่ทั้งหมด ({categories.length} หมวด)
            </h3>

            <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl bg-white overflow-hidden">
              {categories.map(cat => {
                const isEditing = editingCat?.id === cat.id;

                if (isEditing) {
                  return (
                    <form
                      key={cat.id}
                      onSubmit={handleUpdateCategory}
                      className="p-3 bg-blue-50/50 space-y-2"
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={editingCat.icon || '🏷️'}
                          onChange={e => setEditingCat({ ...editingCat, icon: e.target.value })}
                          className="w-10 text-center text-sm p-1.5 bg-white border border-slate-200 rounded-lg"
                        />
                        <input
                          type="text"
                          value={editingCat.name}
                          onChange={e => setEditingCat({ ...editingCat, name: e.target.value })}
                          className="flex-1 text-xs p-1.5 bg-white border border-slate-200 rounded-lg font-bold"
                        />
                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="px-3 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-lg"
                        >
                          บันทึก
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingCat(null)}
                          className="px-2 py-1.5 text-slate-500 text-xs"
                        >
                          ยกเลิก
                        </button>
                      </div>
                    </form>
                  );
                }

                return (
                  <div
                    key={cat.id}
                    className="p-3 flex items-center justify-between gap-3 hover:bg-slate-50 transition"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-xl shrink-0">{cat.icon || '🏷️'}</span>
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-slate-900 block truncate">
                          {cat.name}
                        </span>
                        {cat.description && (
                          <span className="text-[11px] text-slate-400 block truncate">
                            {cat.description}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => setEditingCat(cat)}
                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                        title="แก้ไขหมวดหมู่"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleDeleteCategory(cat.id, cat.name)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                        title="ลบหมวดหมู่"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
