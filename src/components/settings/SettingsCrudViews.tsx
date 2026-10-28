'use client';

import React, { useEffect, useState } from 'react';
import { Building2, Database, Edit2, Hash, Plus, Tag, Trash2, X } from 'lucide-react';

type Field = { key: string; label: string; kind?: 'text' | 'number' | 'select'; options?: string[]; required?: boolean };
type Column = { key: string; label: string };

function CrudMasterData({ title, subtitle, endpoint, dataKey, fields, columns, defaults, category = false }: {
  title: string; subtitle: string; endpoint: string; dataKey: string; fields: Field[]; columns: Column[]; defaults: Record<string, any>; category?: boolean;
}) {
  const [records, setRecords] = useState<Record<string, any>[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [dialog, setDialog] = useState(false);
  const [editing, setEditing] = useState<Record<string, any> | null>(null);
  const [form, setForm] = useState<Record<string, any>>(defaults);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(endpoint, { cache: 'no-store' });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Could not load records from Supabase.');
      setRecords(Array.isArray(payload[dataKey]) ? payload[dataKey] : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load records from Supabase.');
    } finally { setLoading(false); }
  };

  useEffect(() => { void load(); }, [endpoint, dataKey]);

  const openAdd = () => { setEditing(null); setForm({ ...defaults }); setDialog(true); setError(''); };
  const openEdit = (record: Record<string, any>) => { setEditing(record); setForm({ ...defaults, ...record, ...(category ? { code: record.id } : {}) }); setDialog(true); setError(''); };
  const remove = async (record: Record<string, any>) => {
    if (!window.confirm(`Delete "${record.name || record.label || record.code}"?`)) return;
    setBusy(true); setError('');
    try {
      const url = category ? `${endpoint}/${encodeURIComponent(record.id)}` : `${endpoint}?id=${encodeURIComponent(record.id)}`;
      const response = await fetch(url, { method: 'DELETE' });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Delete failed.');
      await load();
    } catch (e) { setError(e instanceof Error ? e.message : 'Delete failed.'); }
    finally { setBusy(false); }
  };
  const save = async (event: React.FormEvent) => {
    event.preventDefault(); setBusy(true); setError('');
    try {
      const body = { ...form };
      if (category && editing) delete body.code;
      if (category && editing) body.name = String(form.name || '').trim();
      if (!category && editing) body.id = editing.id;
      const url = category && editing ? `${endpoint}/${encodeURIComponent(editing.id)}` : endpoint;
      const response = await fetch(url, { method: editing ? (category ? 'PUT' : 'PATCH') : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Save failed.');
      setDialog(false); await load();
    } catch (e) { setError(e instanceof Error ? e.message : 'Save failed.'); }
    finally { setBusy(false); }
  };

  return <div className="space-y-5 animate-in fade-in duration-200">
    <section className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div><h2 className="text-base font-bold text-slate-900">{title}</h2><p className="text-xs text-slate-500 mt-1">{subtitle}</p></div>
      <button type="button" onClick={openAdd} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0B6B4F] text-white text-xs font-bold"><Plus className="w-4 h-4"/>Add</button>
    </section>
    {error && <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-800">{error}</div>}
    <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"><div className="overflow-x-auto">
      <table className="w-full text-left border-collapse text-xs"><thead><tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-bold uppercase text-[10px]">{columns.map(col => <th key={col.key} className="py-3 px-4">{col.label}</th>)}<th className="py-3 px-4 text-right">Actions</th></tr></thead>
      <tbody className="divide-y divide-slate-100 text-slate-700">{loading ? <tr><td colSpan={columns.length + 1} className="py-8 text-center text-slate-500">Loading records from Supabase…</td></tr> : records.length === 0 ? <tr><td colSpan={columns.length + 1} className="py-8 text-center text-slate-500">No records found in Supabase.</td></tr> : records.map(row => <tr key={row.id} className="hover:bg-slate-50/70">{columns.map(col => <td key={col.key} className="py-3 px-4">{col.key === 'discount_percent' ? `${row[col.key]}%` : row[col.key] || '—'}</td>)}<td className="py-3 px-4"><div className="flex justify-end gap-2"><button type="button" disabled={busy} onClick={() => openEdit(row)} className="p-1.5 rounded text-slate-600 hover:bg-slate-100" aria-label="Edit"><Edit2 className="w-3.5 h-3.5"/></button><button type="button" disabled={busy} onClick={() => void remove(row)} className="p-1.5 rounded text-slate-500 hover:bg-rose-50 hover:text-rose-700" aria-label="Delete"><Trash2 className="w-3.5 h-3.5"/></button></div></td></tr>)}</tbody></table>
    </div></section>
    {dialog && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"><form onSubmit={save} className="w-full max-w-lg bg-white rounded-2xl shadow-xl overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 bg-[#0B6B4F] text-white"><h3 className="font-bold text-sm">{editing ? 'Edit' : 'Add'} {title}</h3><button type="button" onClick={() => setDialog(false)} aria-label="Close"><X className="w-4 h-4"/></button></div>
      <div className="p-5 space-y-3">{fields.map(field => <label key={field.key} className="block text-xs font-semibold text-slate-700">{field.label}{field.kind === 'select' ? <select required={field.required !== false} value={form[field.key] ?? ''} onChange={e => setForm(prev => ({ ...prev, [field.key]: e.target.value }))} className="mt-1 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2">{field.options?.map(option => <option key={option} value={option}>{option}</option>)}</select> : <input required={field.required !== false} type={field.kind === 'number' ? 'number' : 'text'} min={field.kind === 'number' ? 0 : undefined} max={field.key === 'discount_percent' ? 100 : undefined} step={field.kind === 'number' ? '0.01' : undefined} value={form[field.key] ?? ''} onChange={e => setForm(prev => ({ ...prev, [field.key]: e.target.value }))} className="mt-1 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 font-normal" />}</label>)}
        {error && <p role="alert" className="text-xs text-rose-700">{error}</p>}
      </div>
      <div className="flex justify-end gap-2 px-5 pb-5"><button type="button" disabled={busy} onClick={() => setDialog(false)} className="px-4 py-2 rounded-xl border border-slate-300 text-xs">Cancel</button><button type="submit" disabled={busy} className="px-4 py-2 rounded-xl bg-[#0B6B4F] text-white text-xs font-bold disabled:opacity-60">{busy ? 'Saving…' : 'Save'}</button></div>
    </form></div>}
  </div>;
}

export function CategoriesView() {
  return <CrudMasterData title="Product & Inventory Categories" subtitle="Manage the categories used by inventory items." endpoint="/api/categories" dataKey="categories" category defaults={{ code: '', name: '', icon: '🏷️' }} fields={[{ key: 'code', label: 'Category ID', required: true }, { key: 'name', label: 'Category name', required: true }]} columns={[{ key: 'id', label: 'Database ID' }, { key: 'name', label: 'Category name' }]} />;
}

export function StorageLocationsView() {
  return <CrudMasterData title="Campus Storage Locations & Warehouses" subtitle="Manage campus depots, buildings, and fulfillment rooms." endpoint="/api/storage-locations" dataKey="locations" defaults={{ code: '', name: '', building_room: '', description: '', capacity: '', status: 'ACTIVE' }} fields={[{ key: 'code', label: 'Code' }, { key: 'name', label: 'Location name' }, { key: 'building_room', label: 'Building & room', required: false }, { key: 'description', label: 'Description', required: false }, { key: 'capacity', label: 'Capacity', required: false }, { key: 'status', label: 'Status', kind: 'select', options: ['ACTIVE', 'INACTIVE'] }]} columns={[{ key: 'code', label: 'Code' }, { key: 'name', label: 'Location' }, { key: 'building_room', label: 'Building & room' }, { key: 'description', label: 'Description' }, { key: 'capacity', label: 'Capacity' }, { key: 'status', label: 'Status' }]} />;
}

export function UnitsOfMeasureView() {
  return <CrudMasterData title="Units of Measure (UoM) Master" subtitle="Manage the measurement units used by inventory items." endpoint="/api/units-of-measure" dataKey="units" defaults={{ code: '', name: '', type: 'Discrete Count', status: 'ACTIVE' }} fields={[{ key: 'code', label: 'Code' }, { key: 'name', label: 'Unit name' }, { key: 'type', label: 'Measurement type' }, { key: 'status', label: 'Status', kind: 'select', options: ['ACTIVE', 'INACTIVE'] }]} columns={[{ key: 'code', label: 'Code' }, { key: 'name', label: 'Unit name' }, { key: 'type', label: 'Measurement type' }, { key: 'status', label: 'Status' }]} />;
}

export function PricingPromotionsView() {
  return <div className="space-y-5"><CrudMasterData title="Customer Tier Pricing" subtitle="Manage discount percentages by customer type." endpoint="/api/customer-tier-pricing" dataKey="tiers" defaults={{ customer_type: 'STUDENT', label: 'Student', discount_percent: '0', status: 'ACTIVE' }} fields={[{ key: 'customer_type', label: 'Customer type', kind: 'select', options: ['STUDENT', 'PARENT', 'TEACHER', 'GENERAL'] }, { key: 'label', label: 'Display name' }, { key: 'discount_percent', label: 'Discount (%)', kind: 'number' }, { key: 'status', label: 'Status', kind: 'select', options: ['ACTIVE', 'INACTIVE'] }]} columns={[{ key: 'customer_type', label: 'Customer type' }, { key: 'label', label: 'Display name' }, { key: 'discount_percent', label: 'Discount' }, { key: 'status', label: 'Status' }]} /><div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900">Promotional campaign codes are not managed here.</div></div>;
}
