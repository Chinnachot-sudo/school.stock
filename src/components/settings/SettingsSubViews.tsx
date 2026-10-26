'use client';

import React, { useEffect, useState } from 'react';
import {
  School,
  Tag,
  GitPullRequest,
  Hash,
  Bell,
  HardDriveDownload,
  Plus,
  Save,
  CheckCircle2,
  AlertTriangle,
  Download,
  Database,
  ShieldCheck,
  Send,
  Building2,
  Trash2,
  RefreshCw,
  Sliders,
  DollarSign,
  MapPin,
  Edit2,
  X,
  Layers
} from 'lucide-react';
import { Department } from '@/types/inventory';

function DemoDataNotice() {
  return (
    <div role="note" className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-900">
      Demo configuration only. These values are not loaded from or saved to Supabase.
    </div>
  );
}

// ============================================================================
// 1. DEPARTMENTS & CLASSES VIEW (Departments & Classes Master)
// ============================================================================
export function DepartmentsView() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetch('/api/departments', { cache: 'no-store' })
      .then(async response => {
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || 'Unable to load departments.');
        if (active) setDepartments(Array.isArray(payload.departments) ? payload.departments : []);
      })
      .catch(error => {
        if (active) setLoadError(error instanceof Error ? error.message : 'Unable to load departments.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => { active = false; };
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <School className="w-5 h-5 text-[#0B6B4F]" />
            <span>Academic Departments & Classes</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Names are loaded from Supabase. Head, staff count, and budget are not stored in the connected department table.
          </p>
        </div>

        <button type="button" disabled title="Department creation is not connected to a save API." className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-300 text-slate-600 text-xs font-bold cursor-not-allowed">
          <Plus className="w-4 h-4" />
          <span>Add Department (Unavailable)</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-bold uppercase text-[10px]">
                <th className="py-3 px-4">Database ID</th>
                <th className="py-3 px-4">Department Name (Supabase)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading && <tr><td colSpan={2} className="py-8 text-center text-slate-500">Loading departments…</td></tr>}
              {!loading && loadError && <tr><td colSpan={2} className="py-8 text-center text-rose-700">{loadError}</td></tr>}
              {!loading && !loadError && departments.length === 0 && <tr><td colSpan={2} className="py-8 text-center text-slate-500">No department records found in Supabase.</td></tr>}
              {!loading && !loadError && departments.map(d => (
                <tr key={d.id} className="hover:bg-slate-50/70 transition">
                  <td className="py-3 px-4 font-mono text-slate-500">{d.id}</td>
                  <td className="py-3 px-4 font-bold text-slate-900">{d.name}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}

// ============================================================================
// 2. PRICING & PROMOTIONS VIEW (Customer Tier Pricing & Discounts)
// ============================================================================
export function PricingPromotionsView() {
  const tiers: Array<{ role: string; label: string; discount: string; autoSubsidized: boolean }> = [];

  const promotions: Array<{ code: string; name: string; discount: string; validUntil: string; status: string }> = [];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <DemoDataNotice />
      {/* Tier Pricing Cards */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Tag className="w-5 h-5 text-[#0B6B4F]" />
            <span>Customer Tier Pricing</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Default discount policies applied during POS checkout according to customer role
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {tiers.length === 0 ? <p className="text-xs text-slate-500">No pricing rules are stored in Supabase.</p> : tiers.map((t, idx) => (
            <div key={idx} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2 text-xs">
              <div className="flex items-center justify-between font-bold text-slate-900">
                <span>{t.label}</span>
                <span className="font-mono text-[#0B6B4F] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  {t.role}
                </span>
              </div>
              <div className="text-slate-600">{t.discount}</div>
              <div className="text-[11px] text-slate-400">
                {t.autoSubsidized ? '✓ Linked to School Welfare Wallet' : 'Standard payment methods'}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Active Promotion Codes */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Active Promotional Discounts</h3>
            <p className="text-xs text-slate-500">Promotions active in school store register</p>
          </div>
          <button
            type="button"
            disabled
            className="px-3.5 py-1.5 rounded-xl bg-[#0B6B4F] hover:bg-emerald-800 text-white font-bold text-xs shadow-sm transition"
          >
            + Create Promotion
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-bold uppercase text-[10px]">
                <th className="py-2.5 px-3">Promo Code</th>
                <th className="py-2.5 px-3">Campaign Name</th>
                <th className="py-2.5 px-3">Discount Rule</th>
                <th className="py-2.5 px-3">Valid Until</th>
                <th className="py-2.5 px-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {promotions.length === 0 ? <tr><td colSpan={5} className="py-8 text-center text-slate-500">No promotion records are stored in Supabase.</td></tr> : promotions.map(p => (
                <tr key={p.code} className="hover:bg-slate-50/70 transition">
                  <td className="py-3 px-3 font-mono font-black text-[#0B6B4F]">{p.code}</td>
                  <td className="py-3 px-3 font-bold text-slate-900">{p.name}</td>
                  <td className="py-3 px-3 text-slate-600">{p.discount}</td>
                  <td className="py-3 px-3 font-mono text-slate-500">{p.validUntil}</td>
                  <td className="py-3 px-3">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      {p.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// 3. APPROVAL WORKFLOW VIEW (Requisition Approval Workflow Rules & Deduction Presets)
// ============================================================================
export function ApprovalWorkflowView() {
  const [saved, setSaved] = useState(false);
  const tier1Limit = undefined as number | undefined;
  const tier2Limit = undefined as number | undefined;

  // Deduction Reasons Presets (for Stock Issue & Approvals)
  const [deductionReasons, setDeductionReasons] = useState<Array<{ id: string; label: string; desc: string; status: string }>>([]);
  const [isAddReasonOpen, setIsAddReasonOpen] = useState(false);
  const [newReasonLabel, setNewReasonLabel] = useState('');
  const [newReasonDesc, setNewReasonDesc] = useState('');

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleAddReason = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReasonLabel.trim()) return;
    setDeductionReasons(prev => [
      ...prev,
      {
        id: `reason-${Date.now()}`,
        label: newReasonLabel.trim(),
        desc: newReasonDesc.trim() || 'Preset reason for stock issues and requisitions',
        status: 'ACTIVE'
      }
    ]);
    setNewReasonLabel('');
    setNewReasonDesc('');
    setIsAddReasonOpen(false);
  };

  const handleDeleteReason = (id: string) => {
    if (confirm('Delete this deduction preset reason?')) {
      setDeductionReasons(prev => prev.filter(r => r.id !== id));
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <DemoDataNotice />
      {/* 1. Approval Thresholds */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <GitPullRequest className="w-5 h-5 text-[#0B6B4F]" />
            <span>Multi-Level Approval Rules</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure financial thresholds and approver roles required for requisitions
          </p>
        </div>

        {saved && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Approval workflow thresholds updated successfully!</span>
          </div>
        )}

        <div className="space-y-4 text-xs">
          {/* Level 1 */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 text-sm">Tier 1: Fast-Track Auto Approval</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                System Auto-Approve
              </span>
            </div>
            <p className="text-slate-500">
              Low-value consumable office supplies (e.g. pens, paperclips, whiteboard markers)
            </p>
            <div className="flex items-center gap-3 pt-2">
              <span className="font-bold text-slate-700">Requisitions up to (฿):</span>
              <input
                type="number"
                value={tier1Limit ?? ''}
                disabled
                className="w-28 px-3 py-1.5 bg-white border border-slate-300 rounded-lg font-black text-slate-900 font-mono"
              />
            </div>
          </div>

          {/* Level 2 */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 text-sm">Tier 2: Department Head Approval</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                Head of Department
              </span>
            </div>
            <p className="text-slate-500">
              Medium requisitions for classroom materials and subject-specific textbooks
            </p>
            <div className="flex items-center gap-3 pt-2">
              <span className="font-bold text-slate-700">Requisitions between ฿{tier1Limit?.toLocaleString() ?? '—'} and (฿):</span>
              <input
                type="number"
                value={tier2Limit ?? ''}
                disabled
                className="w-28 px-3 py-1.5 bg-white border border-slate-300 rounded-lg font-black text-slate-900 font-mono"
              />
            </div>
          </div>

          {/* Level 3 */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 text-sm">Tier 3: Executive Board / Director Approval</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800">
                School Director / CFO
              </span>
            </div>
            <p className="text-slate-500">
              High-value capital equipment, laboratory apparatus, or bulk annual orders exceeding ฿{tier2Limit?.toLocaleString() ?? '—'}
            </p>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="button"
              disabled
              className="px-5 py-2.5 rounded-xl bg-[#0B6B4F] hover:bg-emerald-800 text-white font-bold transition shadow-sm cursor-pointer"
            >
              Save Workflow Settings
            </button>
          </div>
        </div>
      </div>

      {/* 2. Stock Issue / Requisition Deduction Reasons (Commerce & Approval Presets) */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-5 h-5 text-[#0B6B4F]" />
              <span>Stock Issue & Deduction Preset Reasons</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Standard reason presets available during stock issuance, write-offs, and approval audits
            </p>
          </div>

          <button
            type="button"
            disabled
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#0B6B4F] hover:bg-emerald-800 text-white text-xs font-bold transition shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Reason</span>
          </button>
        </div>

        <div className="space-y-2.5">
          {deductionReasons.length === 0 ? <p className="py-6 text-center text-xs text-slate-500">No deduction reason records are stored in Supabase.</p> : deductionReasons.map(r => (
            <div key={r.id} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-3">
              <div>
                <span className="text-xs font-bold text-slate-900 block">{r.label}</span>
                <span className="text-[11px] text-slate-500 block mt-0.5">{r.desc}</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                  {r.status}
                </span>
                <button
                  type="button"
                  disabled
                  className="p-1 text-slate-400 hover:text-rose-600 transition"
                  title="Delete Reason"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {isAddReasonOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
            <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-slate-200 overflow-hidden animate-in zoom-in-95">
              <div className="px-5 py-4 bg-[#0B6B4F] text-white flex items-center justify-between">
                <h4 className="font-bold text-sm">Add Deduction Preset Reason</h4>
                <button onClick={() => setIsAddReasonOpen(false)} className="text-white/80 hover:text-white">✕</button>
              </div>
              <form onSubmit={handleAddReason} className="p-5 space-y-3.5 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Reason Title:</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Science Experiment Supplies"
                    value={newReasonLabel}
                    onChange={e => setNewReasonLabel(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Description / Usage Scope:</label>
                  <input
                    type="text"
                    placeholder="e.g. Consumables used in lab practical exams"
                    value={newReasonDesc}
                    onChange={e => setNewReasonDesc(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl"
                  />
                </div>
                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAddReasonOpen(false)}
                    className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-[#0B6B4F] hover:bg-emerald-800 text-white font-bold"
                  >
                    Save Reason
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// 4. DOCUMENT NUMBERING VIEW (Document Sequence Formats)
// ============================================================================
export function DocumentNumberingView() {
  const formats: Array<{ type: string; prefix: string; format: string; sample: string; nextSeq: number }> = [];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <DemoDataNotice />
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Hash className="w-5 h-5 text-[#0B6B4F]" />
            <span>Document Numbering Sequence Formats</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            System prefixes and auto-incrementing serial formats used across school modules
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-bold uppercase text-[10px]">
                <th className="py-3 px-4">Document Type</th>
                <th className="py-3 px-4">Prefix</th>
                <th className="py-3 px-4">Format Pattern</th>
                <th className="py-3 px-4">Live Sample Preview</th>
                <th className="py-3 px-4 text-center">Next Sequence</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {formats.length === 0 ? <tr><td colSpan={6} className="py-8 text-center text-slate-500">No document numbering settings are stored in Supabase.</td></tr> : formats.map((f, idx) => (
                <tr key={idx} className="hover:bg-slate-50/70 transition">
                  <td className="py-3 px-4 font-bold text-slate-900">{f.type}</td>
                  <td className="py-3 px-4 font-mono font-bold text-[#0B6B4F]">{f.prefix}</td>
                  <td className="py-3 px-4 font-mono text-slate-500">{f.format}</td>
                  <td className="py-3 px-4 font-mono font-black text-slate-800 bg-slate-50 rounded">
                    {f.sample}
                  </td>
                  <td className="py-3 px-4 text-center font-mono font-bold text-slate-600">#{f.nextSeq}</td>
                  <td className="py-3 px-4 text-center">
                    <button
                      type="button"
                      disabled
                      className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold"
                    >
                      Configure
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 5. NOTIFICATIONS SETTINGS VIEW (Automated Notification Configuration)
// ============================================================================
export function NotificationsSettingsView() {
  const [lineToken, setLineToken] = useState('');
  const [notifyLowStock, setNotifyLowStock] = useState(false);
  const [notifyDailySales, setNotifyDailySales] = useState(false);
  const [notifyApprovals, setNotifyApprovals] = useState(false);
  const [saved, setSaved] = useState(false);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <DemoDataNotice />
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Bell className="w-5 h-5 text-[#0B6B4F]" />
            <span>Automated Alerts & Webhooks</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure real-time alerts via LINE Notify, Telegram, and Email
          </p>
        </div>

        {saved && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Notification webhook settings saved successfully!</span>
          </div>
        )}

        <div className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">LINE Notify Token:</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={lineToken}
                onChange={e => setLineToken(e.target.value)}
                className="flex-1 px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono text-slate-700"
              />
              <button
                type="button"
                disabled
                className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 font-bold text-slate-700 border border-slate-300"
              >
                Send Test Alert
              </button>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 space-y-2.5">
            <span className="font-bold text-slate-800 block">Notification Triggers:</span>

            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={notifyLowStock}
                onChange={e => setNotifyLowStock(e.target.checked)}
                className="w-4 h-4 text-[#0B6B4F] rounded"
              />
              <span className="font-medium text-slate-700">
                Low Stock Threshold Alert
              </span>
            </label>

            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={notifyDailySales}
                onChange={e => setNotifyDailySales(e.target.checked)}
                className="w-4 h-4 text-[#0B6B4F] rounded"
              />
              <span className="font-medium text-slate-700">
                Daily POS Shift Z-Report Summary
              </span>
            </label>

            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={notifyApprovals}
                onChange={e => setNotifyApprovals(e.target.checked)}
                className="w-4 h-4 text-[#0B6B4F] rounded"
              />
              <span className="font-medium text-slate-700">
                New Requisition Pending Approval
              </span>
            </label>
          </div>

          <div className="pt-3 flex justify-end">
            <button
              type="button"
              disabled
              className="px-5 py-2.5 rounded-xl bg-[#0B6B4F] hover:bg-emerald-800 text-white font-bold transition shadow-sm cursor-pointer"
            >
              Save Notification Preferences
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 6. BACKUP & MAINTENANCE VIEW (Database Backup & Maintenance)
// ============================================================================
export function BackupMaintenanceView() {
  const [downloading, setDownloading] = useState(false);
  const [lastBackupInfo, setLastBackupInfo] = useState<string | null>(null);
  const [csvTable, setCsvTable] = useState('items');

  const handleBackupDownload = async (format: 'json' | 'csv') => {
    try {
      setDownloading(true);
      setLastBackupInfo(null);
      const endpoint = format === 'json' ? '/api/backup' : `/api/backup?format=csv&table=${csvTable}`;
      const res = await fetch(endpoint, { cache: 'no-store' });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to download backup');
      }

      const blob = await res.blob();
      const stamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
      const filename = format === 'json'
        ? `backup_rais_inventory_${stamp}.json`
        : `backup_rais_${csvTable}_${stamp}.csv`;

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      setLastBackupInfo(`File saved to your Downloads: ${filename} (${(blob.size / 1024).toFixed(1)} KB)`);
    } catch (err: any) {
      alert('Error creating backup: ' + (err?.message || 'Network error'));
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <HardDriveDownload className="w-5 h-5 text-[#0B6B4F]" />
            <span>Database Backup & Snapshot Archives</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Download a verified data export as JSON, or choose one table to export as CSV.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/40 space-y-3 text-xs">
            <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
              <Database className="w-4 h-4 text-[#0B6B4F]" />
              <span>Full Database JSON Export</span>
            </div>
            <p className="text-slate-600">
              Includes inventory, transactions, sales, returns, users (without password hashes), permissions, and audit history.
            </p>
            <div className="pt-1">
              <button
                type="button"
                onClick={() => handleBackupDownload('json')}
                disabled={downloading}
                className="px-4 py-2.5 rounded-xl bg-[#0B6B4F] hover:bg-emerald-800 text-white font-bold inline-flex items-center gap-2 shadow-sm transition active:scale-95 cursor-pointer text-xs disabled:opacity-60"
              >
                <Download className="w-4 h-4" />
                <span>{downloading ? 'Preparing export...' : 'Download JSON Export'}</span>
              </button>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/40 space-y-3 text-xs">
            <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
              <HardDriveDownload className="w-4 h-4 text-blue-700" />
              <span>Export a Table as CSV</span>
            </div>
            <p className="text-slate-600">
              Choose a table to open its records in a spreadsheet. Provider backup status must be checked in the Supabase dashboard.
            </p>
            <div className="flex flex-wrap gap-2">
              <select
                value={csvTable}
                onChange={event => setCsvTable(event.target.value)}
                className="rounded-lg border border-blue-200 bg-white px-3 py-2 text-xs"
              >
                {['items', 'categories', 'departments', 'customers', 'invoices', 'receipts', 'receipt_returns', 'transactions', 'audit_logs', 'app_users', 'user_roles', 'roles', 'permissions', 'role_permissions'].map(table => (
                  <option key={table} value={table}>{table}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => handleBackupDownload('csv')}
                disabled={downloading}
                className="rounded-lg bg-blue-700 px-4 py-2 font-bold text-white disabled:opacity-60"
              >
                Download CSV
              </button>
            </div>
          </div>
        </div>
        {lastBackupInfo && <p className="text-xs text-[#0B6B4F]" role="status">{lastBackupInfo}</p>}
      </div>
    </div>
  );
}

// ============================================================================
// 7. STORAGE LOCATIONS VIEW (Campus Warehouses & Store Depots)
// ============================================================================
export function StorageLocationsView() {
  const [locations, setLocations] = useState<any[]>([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLoc, setEditingLoc] = useState<any>(null);
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [building, setBuilding] = useState('');
  const [desc, setDesc] = useState('');
  const [capacity, setCapacity] = useState('Standard');

  const handleOpenAdd = () => {
    setEditingLoc(null);
    setCode(`LOC-${String(locations.length + 1).padStart(2, '0')}`);
    setName('');
    setBuilding('');
    setDesc('');
    setCapacity('Standard');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (loc: any) => {
    setEditingLoc(loc);
    setCode(loc.code);
    setName(loc.name);
    setBuilding(loc.building);
    setDesc(loc.desc);
    setCapacity(loc.capacity);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this storage location?')) {
      setLocations(prev => prev.filter(l => l.id !== id));
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editingLoc) {
      setLocations(prev => prev.map(l => (l.id === editingLoc.id ? { ...l, code, name, building, desc, capacity } : l)));
    } else {
      setLocations(prev => [
        ...prev,
        {
          id: `loc-${Date.now()}`,
          code: code || `LOC-${String(locations.length + 1).padStart(2, '0')}`,
          name: name.trim(),
          building: building.trim() || 'Campus Main',
          desc: desc.trim() || 'Campus storage location',
          capacity,
          status: 'ACTIVE'
        }
      ]);
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <DemoDataNotice />
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-[#0B6B4F]" />
            <span>Campus Storage Locations & Warehouses</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage central depots, campus buildings, and departmental inventory fulfillment rooms
          </p>
        </div>

        <button type="button" disabled title="Storage locations are not connected to a database." className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-300 text-slate-600 text-xs font-bold cursor-not-allowed">
          <Plus className="w-4 h-4" />
          <span>Add Location</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-bold uppercase text-[10px]">
                <th className="py-3 px-4">Code</th>
                <th className="py-3 px-4">Location Name</th>
                <th className="py-3 px-4">Building & Room</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4 text-center">Capacity</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {locations.length === 0 ? <tr><td colSpan={7} className="py-8 text-center text-slate-500">No storage location records are available in Supabase.</td></tr> : locations.map(loc => (
                <tr key={loc.id} className="hover:bg-slate-50/70 transition">
                  <td className="py-3 px-4 font-mono font-bold text-[#0B6B4F]">{loc.code}</td>
                  <td className="py-3 px-4 font-bold text-slate-900">{loc.name}</td>
                  <td className="py-3 px-4 text-slate-600">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      {loc.building}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-500 max-w-xs truncate">{loc.desc}</td>
                  <td className="py-3 px-4 text-center">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                      {loc.capacity}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      {loc.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(loc)}
                        className="p-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded"
                        title="Edit Location"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(loc.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                        title="Delete Location"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-slate-200 overflow-hidden animate-in zoom-in-95">
            <div className="px-5 py-4 bg-[#0B6B4F] text-white flex items-center justify-between">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <Building2 className="w-4 h-4 text-emerald-300" />
                <span>{editingLoc ? 'Edit Storage Location' : 'Add Storage Location'}</span>
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-white/80 hover:text-white">✕</button>
            </div>
            <form onSubmit={handleSave} className="p-5 space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Code:</label>
                  <input
                    type="text"
                    required
                    value={code}
                    onChange={e => setCode(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Capacity:</label>
                  <select
                    value={capacity}
                    onChange={e => setCapacity(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl"
                  >
                    <option value="Standard">Standard</option>
                    <option value="High Capacity">High Capacity</option>
                    <option value="Medium">Medium</option>
                    <option value="Restricted">Restricted</option>
                    <option value="High Turnover">High Turnover</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Location Name:</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Media Studio Equipment Room"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Building & Room Number:</label>
                <input
                  type="text"
                  placeholder="e.g. Building B, Room 204"
                  value={building}
                  onChange={e => setBuilding(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Description:</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Storage for cameras, microphones, and audio kits"
                  value={desc}
                  onChange={e => setDesc(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#0B6B4F] hover:bg-emerald-800 text-white font-bold"
                >
                  {editingLoc ? 'Update Location' : 'Save Location'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// 8. UNITS OF MEASURE VIEW (CRUD Table: Code, Name, Type, Status, Actions)
// ============================================================================
export function UnitsOfMeasureView() {
  const [units, setUnits] = useState<any[]>([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<any>(null);
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [type, setType] = useState('Discrete Count');
  const [status, setStatus] = useState('ACTIVE');

  const handleOpenAdd = () => {
    setEditingUnit(null);
    setCode('');
    setName('');
    setType('Discrete Count');
    setStatus('ACTIVE');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (unit: any) => {
    setEditingUnit(unit);
    setCode(unit.code);
    setName(unit.name);
    setType(unit.type);
    setStatus(unit.status);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string, unitName: string) => {
    if (confirm(`Are you sure you want to delete unit "${unitName}"?`)) {
      setUnits(prev => prev.filter(u => u.id !== id));
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !name.trim()) return;

    if (editingUnit) {
      setUnits(prev => prev.map(u => (u.id === editingUnit.id ? { ...u, code: code.toUpperCase().trim(), name: name.trim(), type, status } : u)));
    } else {
      setUnits(prev => [
        ...prev,
        {
          id: `uom-${Date.now()}`,
          code: code.toUpperCase().trim(),
          name: name.trim(),
          type,
          status
        }
      ]);
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <DemoDataNotice />
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Hash className="w-5 h-5 text-[#0B6B4F]" />
            <span>Units of Measure (UoM) Master</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Standard inventory counting units, packaging conversions, and measurement codes
          </p>
        </div>

        <button type="button" disabled title="Units of measure are not stored in a Supabase table." className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-300 text-slate-600 text-xs font-bold cursor-not-allowed">
          <Plus className="w-4 h-4" />
          <span>Add Unit of Measure</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-bold uppercase text-[10px]">
                <th className="py-3 px-4">Code</th>
                <th className="py-3 px-4">Unit Name</th>
                <th className="py-3 px-4">Measurement Type</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {units.length === 0 ? <tr><td colSpan={5} className="py-8 text-center text-slate-500">No units of measure are stored in Supabase.</td></tr> : units.map(unit => (
                <tr key={unit.id} className="hover:bg-slate-50/70 transition">
                  <td className="py-3 px-4 font-mono font-black text-[#0B6B4F] text-xs">{unit.code}</td>
                  <td className="py-3 px-4 font-bold text-slate-900">{unit.name}</td>
                  <td className="py-3 px-4 text-slate-600">{unit.type}</td>
                  <td className="py-3 px-4 text-center">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        unit.status === 'ACTIVE'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {unit.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(unit)}
                        className="p-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded"
                        title="Edit Unit"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(unit.id, unit.name)}
                        className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                        title="Delete Unit"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-slate-200 overflow-hidden animate-in zoom-in-95">
            <div className="px-5 py-4 bg-[#0B6B4F] text-white flex items-center justify-between">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <Hash className="w-4 h-4 text-emerald-300" />
                <span>{editingUnit ? 'Edit Unit of Measure' : 'Add Unit of Measure'}</span>
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-white/80 hover:text-white">✕</button>
            </div>
            <form onSubmit={handleSave} className="p-5 space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Code (Symbol):</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. PCS, BTL"
                    value={code}
                    onChange={e => setCode(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Status:</label>
                  <select
                    value={status}
                    onChange={e => setStatus(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-semibold"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="INACTIVE">INACTIVE</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Unit Display Name:</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Piece / Unit"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Measurement Type:</label>
                <select
                  value={type}
                  onChange={e => setType(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl"
                >
                  <option value="Discrete Count">Discrete Count</option>
                  <option value="Packaging Container">Packaging Container</option>
                  <option value="Bundle Packaging">Bundle Packaging</option>
                  <option value="Paper / Stationery">Paper / Stationery</option>
                  <option value="Continuous Length">Continuous Length</option>
                  <option value="Liquid / Chemical">Liquid / Chemical</option>
                  <option value="Composite Kit">Composite Kit</option>
                  <option value="Mass / Weight">Mass / Weight</option>
                  <option value="Surface Area">Surface Area</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#0B6B4F] hover:bg-emerald-800 text-white font-bold"
                >
                  {editingUnit ? 'Update Unit' : 'Save Unit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// 9. CATEGORIES VIEW (Item Taxonomy & Master Categories)
// ============================================================================
export function CategoriesView() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetch('/api/categories', { cache: 'no-store' })
      .then(async response => {
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || 'Unable to load categories.');
        if (active) setCategories(Array.isArray(payload.categories) ? payload.categories : []);
      })
      .catch(error => {
        if (active) setLoadError(error instanceof Error ? error.message : 'Unable to load categories.');
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setCategories(prev => [
      ...prev,
      {
        id: `cat-${Date.now()}`,
        code: code.toUpperCase().trim() || `CAT-${Date.now()}`,
        name: name.trim(),
        desc: desc.trim() || 'Inventory category',
        itemCount: 0,
        status: 'ACTIVE'
      }
    ]);
    setIsModalOpen(false);
    setCode('');
    setName('');
    setDesc('');
  };

  const handleDelete = (id: string, catName: string) => {
    if (confirm(`Are you sure you want to delete category "${catName}"?`)) {
      setCategories(prev => prev.filter(c => c.id !== id));
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Database className="w-5 h-5 text-[#0B6B4F]" />
            <span>Product & Inventory Categories</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Category names shown here are loaded from the connected database.
          </p>
        </div>

        <button type="button" disabled title="Category creation is not enabled in this view." className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-300 text-slate-600 text-xs font-bold cursor-not-allowed">
          <Plus className="w-4 h-4" />
          <span>Add Category</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-bold uppercase text-[10px]">
                <th className="py-3 px-4">Database ID</th>
                <th className="py-3 px-4">Category Name (Supabase)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading && <tr><td colSpan={2} className="py-8 text-center text-slate-500">Loading categories…</td></tr>}
              {!loading && loadError && <tr><td colSpan={2} className="py-8 text-center text-rose-700">{loadError}</td></tr>}
              {!loading && !loadError && categories.length === 0 && <tr><td colSpan={2} className="py-8 text-center text-slate-500">No category records found in Supabase.</td></tr>}
              {!loading && !loadError && categories.map(cat => (
                <tr key={cat.id} className="hover:bg-slate-50/70 transition">
                  <td className="py-3 px-4 font-mono text-slate-500">{cat.id}</td>
                  <td className="py-3 px-4 font-bold text-slate-900">{cat.name}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-slate-200 overflow-hidden animate-in zoom-in-95">
            <div className="px-5 py-4 bg-[#0B6B4F] text-white flex items-center justify-between">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <Database className="w-4 h-4 text-emerald-300" />
                <span>Add Inventory Category</span>
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-white/80 hover:text-white">✕</button>
            </div>
            <form onSubmit={handleAdd} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Category Code:</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. SPORTS, CRAFT"
                  value={code}
                  onChange={e => setCode(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold uppercase"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Category Name:</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Athletics & Sports Gear"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Description:</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Athletic uniforms, basketballs, footballs, and track equipment"
                  value={desc}
                  onChange={e => setDesc(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#0B6B4F] hover:bg-emerald-800 text-white font-bold"
                >
                  Save Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// 10. SYSTEM INTEGRATIONS VIEW (Cloud Services, Database, APIs)
// ============================================================================
export function SystemIntegrationsView() {
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Database className="w-5 h-5 text-[#0B6B4F]" />
            <span>Cloud & System Integrations</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Overview and status of cloud database, authentication providers, and third-party APIs
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
          <span>Configuration Summary — Not a Live Health Check</span>
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Supabase Cloud Database */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-[#0B6B4F] flex items-center justify-center font-bold">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Supabase Cloud PostgreSQL</h3>
                <span className="text-[11px] text-slate-500">Primary Database Engine</span>
              </div>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-[#0B6B4F]">
              Project Connected
            </span>
          </div>
          <p className="text-xs text-slate-600">
            The Supabase project stores application data. This screen does not check live app connectivity or verify every table policy.
          </p>
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Region: ap-northeast-1 (Tokyo)</span>
            <span className="font-mono text-[10px] bg-slate-50 px-2 py-0.5 rounded">PostgreSQL 17.6</span>
          </div>
        </div>

        {/* Security & Authentication */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Cryptographic Auth & RBAC</h3>
                <span className="text-[11px] text-slate-500">PBKDF2 & HMAC SHA-256 Tokens</span>
              </div>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700">
              Active
            </span>
          </div>
          <p className="text-xs text-slate-600">
            This app currently uses its own password-hash and signed-cookie flow; this is not Supabase Auth. Verify security details in the server implementation.
          </p>
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Authorization model</span>
            <span className="font-semibold text-blue-700">App-defined RBAC</span>
          </div>
        </div>

        {/* Local Storage Cache */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold">
                <HardDriveDownload className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Local JSON DB Cache</h3>
                <span className="text-[11px] text-slate-500">High-speed Offline Resilience</span>
              </div>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-700">
              Development Fallback Only
            </span>
          </div>
          <p className="text-xs text-slate-600">
            Local JSON is a development fallback. It is disabled in production and is not synchronized with Supabase.
          </p>
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Storage: data/inventory_db.json</span>
            <span className="font-semibold text-purple-700">Not Production Storage</span>
          </div>
        </div>

        {/* Next.js 15 Server Core */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
                <Sliders className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Server Framework & APIs</h3>
                <span className="text-[11px] text-slate-500">Next.js 15 App Router</span>
              </div>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
              Ready
            </span>
          </div>
          <p className="text-xs text-slate-600">
            API endpoints for items, users, receipts, audit logs, and stock transactions operating on Node.js runtime.
          </p>
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>REST API Boundary: Present</span>
            <span className="font-semibold text-amber-700">Not Health-Checked</span>
          </div>
        </div>
      </div>
    </div>
  );
}


