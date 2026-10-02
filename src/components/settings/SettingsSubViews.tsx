'use client';

import React, { useState } from 'react';
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

// ============================================================================
// 1. DEPARTMENTS & CLASSES VIEW (Departments & Classes Master)
// ============================================================================
export function DepartmentsView() {
  const [departments, setDepartments] = useState([
    { id: 'dept-1', code: 'PYP', name: 'Primary Years Programme (PYP)', head: 'Ms. Sarah Jenkins', budget: 250000, staffCount: 24 },
    { id: 'dept-2', code: 'MYP', name: 'Middle Years Programme (MYP)', head: 'Mr. David Clark', budget: 300000, staffCount: 18 },
    { id: 'dept-3', code: 'DP', name: 'Diploma Programme (DP)', head: 'Dr. Robert Miller', budget: 350000, staffCount: 15 },
    { id: 'dept-4', code: 'SCI', name: 'Science & Laboratories', head: 'Kru Prasert S.', budget: 200000, staffCount: 8 },
    { id: 'dept-5', code: 'PE', name: 'Physical Education & Athletics', head: 'Coach Marcus T.', budget: 150000, staffCount: 6 },
    { id: 'dept-6', code: 'ADM', name: 'School Administration & IT', head: 'Mr. Panyawut S.', budget: 180000, staffCount: 12 },
  ]);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newCode, setNewCode] = useState('');
  const [newName, setNewName] = useState('');
  const [newHead, setNewHead] = useState('');
  const [newBudget, setNewBudget] = useState(100000);

  const handleAddDept = (e: React.FormEvent) => {
    e.preventDefault();
    setDepartments(prev => [
      ...prev,
      {
        id: `dept-${Date.now()}`,
        code: newCode.toUpperCase(),
        name: newName,
        head: newHead || 'Department Head',
        budget: newBudget,
        staffCount: 5
      }
    ]);
    setIsAddOpen(false);
    setNewCode('');
    setNewName('');
    setNewHead('');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <School className="w-5 h-5 text-[#0B6B4F]" />
            <span>Academic Departments & Classes</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure school faculties, cost centers, and departmental requisition budgets
          </p>
        </div>

        <button
          onClick={() => setIsAddOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0B6B4F] hover:bg-emerald-800 text-white text-xs font-bold transition shadow-sm cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Department</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-bold uppercase text-[10px]">
                <th className="py-3 px-4">Code</th>
                <th className="py-3 px-4">Department / Faculty Name</th>
                <th className="py-3 px-4">Head of Department</th>
                <th className="py-3 px-4 text-center">Faculty Staff</th>
                <th className="py-3 px-4 text-right">Annual Budget Allocation (฿)</th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {departments.map(d => (
                <tr key={d.id} className="hover:bg-slate-50/70 transition">
                  <td className="py-3 px-4 font-mono font-bold text-[#0B6B4F]">{d.code}</td>
                  <td className="py-3 px-4 font-bold text-slate-900">{d.name}</td>
                  <td className="py-3 px-4 text-slate-600">{d.head}</td>
                  <td className="py-3 px-4 text-center font-bold">{d.staffCount} teachers</td>
                  <td className="py-3 px-4 text-right font-black text-slate-900 font-mono">
                    ฿{d.budget.toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      Active
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="px-6 py-4 bg-[#0B6B4F] text-white flex items-center justify-between">
              <h3 className="font-bold text-base flex items-center gap-2">
                <School className="w-5 h-5 text-emerald-300" />
                <span>Add Department</span>
              </h3>
              <button onClick={() => setIsAddOpen(false)} className="text-white/80 hover:text-white">✕</button>
            </div>
            <form onSubmit={handleAddDept} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Department Code:</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. ART, MUS, LIB"
                  value={newCode}
                  onChange={e => setNewCode(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold uppercase"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Department Name:</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Visual Arts & Media Studio"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Head of Department:</label>
                <input
                  type="text"
                  placeholder="e.g. Kru Somchai"
                  value={newHead}
                  onChange={e => setNewHead(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Annual Budget:</label>
                <input
                  type="number"
                  min="0"
                  required
                  value={newBudget}
                  onChange={e => setNewBudget(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-black text-slate-900"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#0B6B4F] hover:bg-emerald-800 text-white font-bold"
                >
                  Save Department
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
// 2. PRICING & PROMOTIONS VIEW (Customer Tier Pricing & Discounts)
// ============================================================================
export function PricingPromotionsView() {
  const [tiers, setTiers] = useState([
    { role: 'STUDENT', label: 'Enrolled Students', discount: 'Standard Store Price (0% off)', autoSubsidized: false },
    { role: 'TEACHER', label: 'Faculty & Teachers', discount: '10% Staff Welfare Discount', autoSubsidized: true },
    { role: 'PARENT', label: 'Parents / PTA Members', discount: '5% PTA Member Discount', autoSubsidized: false },
    { role: 'GENERAL', label: 'General Public / Visitors', discount: 'Full Retail Price', autoSubsidized: false },
  ]);

  const [promotions, setPromotions] = useState([
    { code: 'BACK2SCHOOL26', name: 'Back to School Uniform Bundle', discount: '15% Off when buying 3+ uniform items', validUntil: '31 Oct 2026', status: 'ACTIVE' },
    { code: 'STATIONERY10', name: 'Bulk Stationery Discount', discount: '10% Off copy paper cartons (5+ reams)', validUntil: '31 Dec 2026', status: 'ACTIVE' },
  ]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
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
          {tiers.map((t, idx) => (
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
            onClick={() => alert('New promotion code creation')}
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
              {promotions.map(p => (
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
  const [tier1Limit, setTier1Limit] = useState(1000);
  const [tier2Limit, setTier2Limit] = useState(5000);

  // Deduction Reasons Presets (for Stock Issue & Approvals)
  const [deductionReasons, setDeductionReasons] = useState([
    { id: 'teach', label: 'Instructional & Classroom Use', desc: 'Learning materials, student handouts, exercise books, textbooks', status: 'ACTIVE' },
    { id: 'activity', label: 'School Events & Co-Curricular', desc: 'Campus events, sports day, exhibitions, workshops', status: 'ACTIVE' },
    { id: 'office', label: 'Administrative & Office Operations', desc: 'Office stationery, paper, folders, general office supplies', status: 'ACTIVE' },
    { id: 'damage', label: 'Damaged / Obsolete / Expired', desc: 'Disposal of unusable, broken, or outdated inventory', status: 'ACTIVE' },
    { id: 'adjust', label: 'Periodic Stock Audit Adjustment', desc: 'Discrepancy adjustment following physical stock count', status: 'ACTIVE' },
  ]);
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
                value={tier1Limit}
                onChange={e => setTier1Limit(Number(e.target.value))}
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
              <span className="font-bold text-slate-700">Requisitions between ฿{tier1Limit.toLocaleString()} and (฿):</span>
              <input
                type="number"
                value={tier2Limit}
                onChange={e => setTier2Limit(Number(e.target.value))}
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
              High-value capital equipment, laboratory apparatus, or bulk annual orders exceeding ฿{tier2Limit.toLocaleString()}
            </p>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              onClick={handleSave}
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
            onClick={() => setIsAddReasonOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#0B6B4F] hover:bg-emerald-800 text-white text-xs font-bold transition shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Reason</span>
          </button>
        </div>

        <div className="space-y-2.5">
          {deductionReasons.map(r => (
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
                  onClick={() => handleDeleteReason(r.id)}
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
  const formats = [
    { type: 'Tax Invoice', prefix: 'INV-', format: '{YYYY}{MM}-{XXXX}', sample: 'INV-202609-0042', nextSeq: 43 },
    { type: 'Official Receipt', prefix: 'RC', format: '{YY}{MM}-{XXXX}', sample: 'RC2609-0128', nextSeq: 129 },
    { type: 'Purchase Request', prefix: 'PR-', format: '{YYYY}{MM}-{XXXX}', sample: 'PR-202609-0012', nextSeq: 13 },
    { type: 'Stock Transfer', prefix: 'TR-', format: '{YYYY}{MM}-{XXXX}', sample: 'TR-202609-0008', nextSeq: 9 },
    { type: 'Credit Note', prefix: 'CN-', format: '{YYYY}{MM}-{XXXX}', sample: 'CN-202609-0003', nextSeq: 4 },
    { type: 'Equipment Loan', prefix: 'LN-', format: '{YYYY}{MM}{DD}-{XX}', sample: 'LN-20260924-05', nextSeq: 6 },
    { type: 'Asset Register', prefix: 'AST-', format: '{YYYY}-{XXXXX}', sample: 'AST-2026-00142', nextSeq: 143 },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
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
              {formats.map((f, idx) => (
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
                      onClick={() => alert(`Reset sequence for ${f.type}`)}
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
  const [lineToken, setLineToken] = useState('********************************');
  const [notifyLowStock, setNotifyLowStock] = useState(true);
  const [notifyDailySales, setNotifyDailySales] = useState(true);
  const [notifyApprovals, setNotifyApprovals] = useState(true);
  const [saved, setSaved] = useState(false);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
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
                onClick={() => alert('Test message sent to school LINE group!')}
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
              onClick={() => {
                setSaved(true);
                setTimeout(() => setSaved(false), 3000);
              }}
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

  const handleBackupDownload = () => {
    setDownloading(true);
    setTimeout(() => {
      setDownloading(false);
      alert('Database snapshot downloaded: backup_rais_inventory_20260924.json');
    }, 1200);
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
            Create on-demand full database backups and download JSON/CSV dumps of school stock
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/40 space-y-3 text-xs">
            <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
              <Database className="w-4 h-4 text-[#0B6B4F]" />
              <span>Full Database JSON Export</span>
            </div>
            <p className="text-slate-600">
              Download complete tables including users, categories, products, receipts, and audit history.
            </p>
            <button
              onClick={handleBackupDownload}
              disabled={downloading}
              className="px-4 py-2 rounded-xl bg-[#0B6B4F] hover:bg-emerald-800 text-white font-bold flex items-center gap-1.5 shadow-sm transition active:scale-95 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{downloading ? 'Exporting...' : 'Download Full JSON Snapshot'}</span>
            </button>
          </div>

          <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/40 space-y-3 text-xs">
            <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
              <HardDriveDownload className="w-4 h-4 text-blue-700" />
              <span>Automated Daily Snapshot</span>
            </div>
            <p className="text-slate-600">
              Daily automated backups run every night at 02:00 AM ICT with 30-day retention.
            </p>
            <div className="text-[11px] font-mono text-blue-800 font-bold">
              Last Backup: Today, 02:00:14 AM (Size: 4.8 MB, 0 errors)
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 7. STORAGE LOCATIONS VIEW (Campus Warehouses & Store Depots)
// ============================================================================
export function StorageLocationsView() {
  const [locations, setLocations] = useState([
    { id: 'loc-1', code: 'LOC-MAIN', name: 'Central Warehouse', building: 'Administration Building, Fl 1', desc: 'Central logistics depot for bulk receipts & distribution', capacity: 'High Capacity', status: 'ACTIVE' },
    { id: 'loc-2', code: 'LOC-SEC', name: 'Secondary Store', building: 'Secondary School Building, Fl 2', desc: 'MYP & DP classroom supplies and textbooks', capacity: 'Standard', status: 'ACTIVE' },
    { id: 'loc-3', code: 'LOC-PRI', name: 'Primary Store', building: 'Primary School Building, Fl 1', desc: 'PYP elementary learning supplies and craft kits', capacity: 'Standard', status: 'ACTIVE' },
    { id: 'loc-4', code: 'LOC-SPORT', name: 'Sports Center Depot', building: 'Athletics Complex & Pool', desc: 'Sports equipment, athletics kits, and uniforms', capacity: 'Medium', status: 'ACTIVE' },
    { id: 'loc-5', code: 'LOC-SHOP', name: 'School Store / POS Counter', building: 'Administration Building Lobby', desc: 'Uniform retail counter and student supply sales', capacity: 'High Turnover', status: 'ACTIVE' },
    { id: 'loc-6', code: 'LOC-LAB', name: 'Science Laboratory Prep Room', building: 'Science Center, Fl 3', desc: 'Laboratory apparatus, glassware, and safe storage', capacity: 'Restricted', status: 'ACTIVE' },
  ]);

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

        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0B6B4F] hover:bg-emerald-800 text-white text-xs font-bold transition shadow-sm cursor-pointer"
        >
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
              {locations.map(loc => (
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
  const [units, setUnits] = useState([
    { id: 'uom-1', code: 'PCS', name: 'Piece / Unit', type: 'Discrete Count', status: 'ACTIVE' },
    { id: 'uom-2', code: 'BOX', name: 'Box', type: 'Packaging Container', status: 'ACTIVE' },
    { id: 'uom-3', code: 'PACK', name: 'Pack', type: 'Bundle Packaging', status: 'ACTIVE' },
    { id: 'uom-4', code: 'REAM', name: 'Ream (500 Sheets)', type: 'Paper / Stationery', status: 'ACTIVE' },
    { id: 'uom-5', code: 'ROLL', name: 'Roll', type: 'Continuous Length', status: 'ACTIVE' },
    { id: 'uom-6', code: 'BTL', name: 'Bottle', type: 'Liquid / Chemical', status: 'ACTIVE' },
    { id: 'uom-7', code: 'SET', name: 'Set / Kit', type: 'Composite Kit', status: 'ACTIVE' },
    { id: 'uom-8', code: 'KG', name: 'Kilogram (kg)', type: 'Mass / Weight', status: 'ACTIVE' },
    { id: 'uom-9', code: 'BOOK', name: 'Book', type: 'Discrete Count', status: 'ACTIVE' },
    { id: 'uom-10', code: 'SHEET', name: 'Sheet', type: 'Surface Area', status: 'ACTIVE' },
  ]);

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

        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0B6B4F] hover:bg-emerald-800 text-white text-xs font-bold transition shadow-sm cursor-pointer"
        >
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
              {units.map(unit => (
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
  const [categories, setCategories] = useState([
    { id: 'cat-1', code: 'UNIFORM', name: 'School Uniforms & Apparel', desc: 'Student shirts, skirts, trousers, PE uniforms, and ties', itemCount: 42, status: 'ACTIVE' },
    { id: 'cat-2', code: 'STATIONERY', name: 'Stationery & Writing', desc: 'Pens, pencils, erasers, notebooks, paper, markers', itemCount: 128, status: 'ACTIVE' },
    { id: 'cat-3', code: 'TEXTBOOK', name: 'Textbooks & Workbooks', desc: 'IB PYP, MYP, DP curriculum study guides and textbooks', itemCount: 65, status: 'ACTIVE' },
    { id: 'cat-4', code: 'SCIENCE', name: 'Science Laboratory Supplies', desc: 'Chemicals, test tubes, beakers, gloves, filter papers', itemCount: 34, status: 'ACTIVE' },
    { id: 'cat-5', code: 'ART_CRAFT', name: 'Visual Arts & Craft', desc: 'Paints, sketch pads, clay, brushes, canvas, palettes', itemCount: 51, status: 'ACTIVE' },
    { id: 'cat-6', code: 'IT_SUPPLY', name: 'IT & Digital Accessories', desc: 'HDMI cables, USB drives, printer toners, mouse pads', itemCount: 29, status: 'ACTIVE' },
  ]);

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
            Classify warehouse items, curriculum books, stationery, and uniforms
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0B6B4F] hover:bg-emerald-800 text-white text-xs font-bold transition shadow-sm cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Category</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-bold uppercase text-[10px]">
                <th className="py-3 px-4">Code</th>
                <th className="py-3 px-4">Category Name</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4 text-center">Items Count</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {categories.map(cat => (
                <tr key={cat.id} className="hover:bg-slate-50/70 transition">
                  <td className="py-3 px-4 font-mono font-black text-[#0B6B4F]">{cat.code}</td>
                  <td className="py-3 px-4 font-bold text-slate-900">{cat.name}</td>
                  <td className="py-3 px-4 text-slate-500">{cat.desc}</td>
                  <td className="py-3 px-4 text-center font-mono font-bold text-slate-700">{cat.itemCount} items</td>
                  <td className="py-3 px-4 text-center">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      {cat.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      type="button"
                      onClick={() => handleDelete(cat.id, cat.name)}
                      className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                      title="Delete Category"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
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
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-[#0B6B4F] border border-emerald-200">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>All Services Operational</span>
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
              Connected
            </span>
          </div>
          <p className="text-xs text-slate-600">
            Real-time synchronization for catalog items, transactions, receipts, and staff roles with Row-Level Security (RLS) enforcement.
          </p>
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Region: ap-northeast-1 (Tokyo)</span>
            <span className="font-mono text-[10px] bg-slate-50 px-2 py-0.5 rounded">v17.6 PostgreSql</span>
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
            Zero-plaintext password policy with 1,000 iterations PBKDF2 hashing, signed session cookies, and 3-Tier RBAC permission evaluation.
          </p>
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Privilege Escalation Guard: Enabled</span>
            <span className="font-semibold text-emerald-700">Strict</span>
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
              Synchronized
            </span>
          </div>
          <p className="text-xs text-slate-600">
            Secondary high-resilience cache stored on server disk to guarantee POS checkout uptime even during temporary network interruptions.
          </p>
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Storage: data/inventory_db.json</span>
            <span className="font-semibold text-purple-700">Zero Latency</span>
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
            <span>REST API Boundary: Standardized</span>
            <span className="font-semibold text-amber-700">Healthy</span>
          </div>
        </div>
      </div>
    </div>
  );
}


