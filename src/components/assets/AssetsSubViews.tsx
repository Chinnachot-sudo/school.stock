'use client';

import React, { useState } from 'react';
import {
  Briefcase,
  TrendingDown,
  Trash2,
  Repeat,
  CheckCircle2,
  Plus,
  Search,
  Filter,
  Download,
  AlertTriangle,
  Building,
  Shield,
  Layers,
  Calendar,
  DollarSign,
  QrCode,
  Tag,
  Clock,
  User,
  ArrowRight,
  Printer,
  Sparkles,
  FileCheck,
  CheckCircle,
  XCircle,
  HelpCircle,
  Camera
} from 'lucide-react';

export interface AssetItem {
  id: string;
  code: string;
  name: string;
  serial: string;
  category: string;
  location: string;
  custodian: string;
  purchaseDate: string;
  cost: number;
  status: string;
}

export interface DepreciationItem {
  code: string;
  name: string;
  cost: number;
  salvageValue: number;
  usefulLifeYears: number;
  accumulatedDepreciation: number;
  netBookValue: number;
  monthlyDepreciation: number;
  status: string;
}

export interface DisposalRecord {
  id: string;
  code: string;
  name: string;
  category: string;
  reason: string;
  reasonText: string;
  salvageValue: number;
  disposalDate: string;
  approvedBy: string;
  status: string;
}

export interface LoanRecord {
  id: string;
  assetCode: string;
  assetName: string;
  borrower: string;
  department: string;
  borrowDate: string;
  dueDate: string;
  purpose: string;
  status: string;
}

export interface AuditRecord {
  code: string;
  name: string;
  location: string;
  expectedCustodian: string;
  status: string;
  verifiedAt: string;
  verifiedBy: string;
}

// ============================================================================
// 1. ASSET REGISTER VIEW (Fixed Assets Register & Master)
// ============================================================================
export function AssetRegisterView({
  onRunVerification,
  onRunDepreciation
}: {
  onRunVerification?: () => void;
  onRunDepreciation?: () => void;
} = {}) {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Asset Register State
  const [assets, setAssets] = useState<AssetItem[]>([]);

  // New Asset Form State
  const [newCode, setNewCode] = useState(`AST-2024-${String(assets.length + 1).padStart(3, '0')}`);
  const [newName, setNewName] = useState('');
  const [newSerial, setNewSerial] = useState('');
  const [newCat, setNewCat] = useState('IT_COMPUTER');
  const [newLoc, setNewLoc] = useState('');
  const [newCustodian, setNewCustodian] = useState('');
  const [newCost, setNewCost] = useState(25000);
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);

  const handleAddAsset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newCode.trim()) return;

    setAssets(prev => [
      {
        id: `ast-${Date.now()}`,
        code: newCode,
        name: newName,
        serial: newSerial || 'N/A',
        category: newCat,
        location: newLoc || 'Central Store',
        custodian: newCustodian || 'Admin Office',
        purchaseDate: newDate,
        cost: Number(newCost) || 0,
        status: 'IN_USE',
      },
      ...prev
    ]);

    setIsAddModalOpen(false);
    setNewName('');
    setNewSerial('');
    setNewLoc('');
    setNewCustodian('');
    setNewCode(`AST-2024-${String(assets.length + 2).padStart(3, '0')}`);
  };

  const filteredAssets = assets.filter(a => {
    const matchSearch =
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.code.toLowerCase().includes(search.toLowerCase()) ||
      a.serial.toLowerCase().includes(search.toLowerCase()) ||
      a.location.toLowerCase().includes(search.toLowerCase()) ||
      a.custodian.toLowerCase().includes(search.toLowerCase());
    const matchCat = selectedCategory === 'ALL' || a.category === selectedCategory;
    const matchStatus = selectedStatus === 'ALL' || a.status === selectedStatus;
    return matchSearch && matchCat && matchStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'IN_USE':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">Active / In Use</span>;
      case 'ON_LOAN':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">On Loan</span>;
      case 'MAINTENANCE':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">Maintenance</span>;
      case 'DISPOSED':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">Disposed</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">{status}</span>;
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* Control Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="flex flex-1 items-center gap-2 w-full">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search asset tag, name, serial number, room, custodian..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#0B6B4F]"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-medium"
          >
            <option value="ALL">All Categories</option>
            <option value="IT_COMPUTER">IT & Computers</option>
            <option value="AUDIO_VISUAL">Audio-Visual & Sound</option>
            <option value="SCIENCE_LAB">Science & Laboratories</option>
            <option value="MUSIC_ARTS">Music & Performing Arts</option>
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-medium"
          >
            <option value="ALL">All Status</option>
            <option value="IN_USE">Active / In Use</option>
            <option value="ON_LOAN">On Loan</option>
            <option value="MAINTENANCE">Maintenance</option>
          </select>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {onRunVerification && (
            <button
              type="button"
              onClick={onRunVerification}
              className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold shadow-2xs transition shrink-0 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Run Verification</span>
            </button>
          )}

          {onRunDepreciation && (
            <button
              type="button"
              onClick={onRunDepreciation}
              className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold shadow-2xs transition shrink-0 cursor-pointer"
            >
              <TrendingDown className="w-4 h-4 text-blue-600" />
              <span>Run Depreciation</span>
            </button>
          )}

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-[#0B6B4F] hover:bg-[#095740] text-white text-xs font-bold shadow-sm transition shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Register New Asset</span>
          </button>
        </div>
      </div>

      {/* Asset Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-500 font-bold border-b border-slate-200 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Asset Tag / Serial</th>
                <th className="py-3 px-4">Asset Name & Category</th>
                <th className="py-3 px-4">Location & Custodian</th>
                <th className="py-3 px-4 text-right">Cost (THB)</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAssets.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No asset records found matching your filters.
                  </td>
                </tr>
              ) : (
                filteredAssets.map(asset => (
                  <tr key={asset.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3.5 px-4">
                      <span className="font-mono font-bold text-slate-900 block">{asset.code}</span>
                      <span className="font-mono text-[11px] text-slate-400 block mt-0.5">S/N: {asset.serial}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-slate-900 block">{asset.name}</span>
                      <span className="text-[11px] text-slate-500 block mt-0.5">{asset.category.replace('_', ' ')}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="text-slate-800 block flex items-center gap-1">
                        <Building className="w-3 h-3 text-slate-400" />
                        {asset.location}
                      </span>
                      <span className="text-[11px] text-slate-500 block mt-0.5 flex items-center gap-1">
                        <User className="w-3 h-3 text-slate-400" />
                        {asset.custodian}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-semibold text-slate-900">
                      ฿{asset.cost.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {getStatusBadge(asset.status)}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => alert(`QR Tag for [${asset.code}] - ${asset.name}\nReady to print label sticker.`)}
                        className="p-1.5 hover:bg-slate-100 text-slate-600 rounded-lg inline-flex items-center gap-1 text-[11px] font-semibold border border-slate-200"
                        title="Print Barcode / QR Tag"
                      >
                        <QrCode className="w-3.5 h-3.5 text-slate-700" />
                        <span>Tag</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 animate-in zoom-in-95 duration-150">
            <h3 className="text-base font-bold text-slate-900 mb-1 flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-[#0B6B4F]" />
              <span>Register New School Asset</span>
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Add capital equipment to Roong Aroon International School fixed asset registry
            </p>

            <form onSubmit={handleAddAsset} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Asset Tag (ID)</label>
                  <input
                    type="text"
                    value={newCode}
                    onChange={(e) => setNewCode(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Serial Number (S/N)</label>
                  <input
                    type="text"
                    value={newSerial}
                    onChange={(e) => setNewSerial(e.target.value)}
                    placeholder="e.g. SN-8839210"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Asset Name / Description</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. MacBook Pro 14' M3 Pro"
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Category</label>
                  <select
                    value={newCat}
                    onChange={(e) => setNewCat(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                  >
                    <option value="IT_COMPUTER">IT & Computers</option>
                    <option value="AUDIO_VISUAL">Audio-Visual & Sound</option>
                    <option value="SCIENCE_LAB">Science & Laboratories</option>
                    <option value="MUSIC_ARTS">Music & Performing Arts</option>
                    <option value="FURNITURE">Campus Furniture & Fixtures</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Acquisition Cost (THB)</label>
                  <input
                    type="number"
                    value={newCost}
                    onChange={(e) => setNewCost(Number(e.target.value))}
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Room / Location</label>
                  <input
                    type="text"
                    value={newLoc}
                    onChange={(e) => setNewLoc(e.target.value)}
                    placeholder="e.g. Lab 2, Building A"
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Custodian / Responsible</label>
                  <input
                    type="text"
                    value={newCustodian}
                    onChange={(e) => setNewCustodian(e.target.value)}
                    placeholder="e.g. Kru Somchai (Science)"
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#0B6B4F] hover:bg-[#095740] text-white rounded-xl font-bold"
                >
                  Save & Print Tag
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
// 2. ASSET DEPRECIATION VIEW (Depreciation Calculation)
// ============================================================================
export function AssetDepreciationView() {
  const [fiscalYear, setFiscalYear] = useState('2024');

  const items: DepreciationItem[] = [];

  const totalCost = items.reduce((acc, curr) => acc + curr.cost, 0);
  const totalAccum = items.reduce((acc, curr) => acc + curr.accumulatedDepreciation, 0);
  const totalNBV = items.reduce((acc, curr) => acc + curr.netBookValue, 0);

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* Financial KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm">
          <span className="text-xs text-slate-500 font-medium block">Total Historical Acquisition Cost</span>
          <span className="text-xl font-black text-slate-900 font-mono mt-1 block">
            ฿{totalCost.toLocaleString()}
          </span>
          <span className="text-[11px] text-slate-400 mt-1 block">Straight-Line Method</span>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm">
          <span className="text-xs text-slate-500 font-medium block">Total Accumulated Depreciation</span>
          <span className="text-xl font-black text-rose-600 font-mono mt-1 block">
            -฿{totalAccum.toLocaleString()}
          </span>
          <span className="text-[11px] text-rose-500 mt-1 block">Accumulated depreciation to current period</span>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm bg-gradient-to-br from-emerald-50/50 to-white">
          <span className="text-xs text-emerald-800 font-semibold block">Net Book Value (NBV)</span>
          <span className="text-xl font-black text-[#0B6B4F] font-mono mt-1 block">
            ฿{totalNBV.toLocaleString()}
          </span>
          <span className="text-[11px] text-[#0B6B4F] mt-1 block">Ready for FY Audit Balance Sheet</span>
        </div>
      </div>

      {/* Action Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-700">
            <Calendar className="w-4 h-4 text-[#0B6B4F]" />
            <span className="font-semibold">Fiscal Year:</span>
            <select
              value={fiscalYear}
              onChange={(e) => setFiscalYear(e.target.value)}
              className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg font-bold"
            >
              <option value="2024">FY 2024 (AY 2024-2025)</option>
              <option value="2023">FY 2023 (AY 2023-2024)</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => alert('Depreciation run completed for current fiscal month.\nJournal entries posted to General Ledger (GL).')}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#0B6B4F] hover:bg-[#095740] text-white text-xs font-bold rounded-xl shadow-sm transition"
          >
            <Sparkles className="w-4 h-4" />
            <span>Post Monthly Depreciation to GL</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-500 font-bold border-b border-slate-200 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Asset Code & Description</th>
                <th className="py-3 px-4 text-center">Life (Yrs)</th>
                <th className="py-3 px-4 text-right">Cost</th>
                <th className="py-3 px-4 text-right">Monthly Depr.</th>
                <th className="py-3 px-4 text-right">Accumulated Depr.</th>
                <th className="py-3 px-4 text-right">Net Book Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 text-xs">
                    <TrendingDown className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <span>No depreciating fixed assets recorded.</span>
                  </td>
                </tr>
              ) : (
                items.map(item => (
                  <tr key={item.code} className="hover:bg-slate-50/60 transition">
                    <td className="py-3 px-4">
                      <span className="font-mono font-bold text-slate-900 block">{item.code}</span>
                      <span className="text-slate-600 block">{item.name}</span>
                    </td>
                    <td className="py-3 px-4 text-center font-mono font-semibold text-slate-700">
                      {item.usefulLifeYears}y
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-900">
                      ฿{item.cost.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-600">
                      ฿{item.monthlyDepreciation.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-semibold text-rose-600">
                      -฿{item.accumulatedDepreciation.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-[#0B6B4F]">
                      ฿{item.netBookValue.toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 3. ASSET DISPOSAL VIEW (Asset Disposal & Write-off)
// ============================================================================
export function AssetDisposeView() {
  const [disposals, setDisposals] = useState<DisposalRecord[]>([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [assetCode, setAssetCode] = useState('');
  const [assetName, setAssetName] = useState('');
  const [reason, setReason] = useState('UNREPAIRABLE_DEFECT');
  const [notes, setNotes] = useState('');
  const [salvage, setSalvage] = useState(0);

  const handleCreateDisposal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assetCode.trim() || !assetName.trim()) return;

    setDisposals(prev => [
      {
        id: `disp-${Date.now()}`,
        code: assetCode,
        name: assetName,
        category: 'GENERAL',
        reason,
        reasonText: notes || 'Approved for decommissioning',
        salvageValue: Number(salvage) || 0,
        disposalDate: new Date().toISOString().split('T')[0],
        approvedBy: 'Pending Director Approval',
        status: 'PENDING_APPROVAL'
      },
      ...prev
    ]);

    setIsModalOpen(false);
    setAssetCode('');
    setAssetName('');
    setNotes('');
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Trash2 className="w-5 h-5 text-rose-600" />
            <span>Asset Write-off & Disposal Protocol</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Log damaged, outdated, lost, or donated assets and remove from active balance sheet
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-sm transition"
        >
          <Plus className="w-4 h-4" />
          <span>New Disposal Request</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-500 font-bold border-b border-slate-200 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Asset Tag / Name</th>
                <th className="py-3 px-4">Disposal Reason & Justification</th>
                <th className="py-3 px-4">Approved By</th>
                <th className="py-3 px-4 text-right">Salvage Value</th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {disposals.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400 text-xs">
                    <Trash2 className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <span>No asset disposal or write-off records found.</span>
                  </td>
                </tr>
              ) : (
                disposals.map(disp => (
                  <tr key={disp.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3 px-4">
                      <span className="font-mono font-bold text-slate-900 block">{disp.code}</span>
                      <span className="text-slate-600 block">{disp.name}</span>
                    </td>
                    <td className="py-3 px-4 max-w-xs">
                      <span className="font-semibold text-slate-900 block">{disp.reason.replace('_', ' ')}</span>
                      <span className="text-[11px] text-slate-500 block truncate">{disp.reasonText}</span>
                    </td>
                    <td className="py-3 px-4 text-slate-700 font-medium">
                      {disp.approvedBy}
                      <span className="text-[11px] text-slate-400 block">{disp.disposalDate}</span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-semibold text-slate-900">
                      ฿{disp.salvageValue.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {disp.status === 'APPROVED' ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Written Off
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          Pending Sign-off
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 animate-in zoom-in-95 duration-150">
            <h3 className="text-base font-bold text-slate-900 mb-1 flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-rose-600" />
              <span>Submit Asset Disposal Request</span>
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Write off defective or obsolete asset from school inventory
            </p>

            <form onSubmit={handleCreateDisposal} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Asset Code</label>
                <input
                  type="text"
                  value={assetCode}
                  onChange={(e) => setAssetCode(e.target.value)}
                  placeholder="e.g. AST-2019-082"
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Asset Name</label>
                <input
                  type="text"
                  value={assetName}
                  onChange={(e) => setAssetName(e.target.value)}
                  placeholder="e.g. Yamaha PA Speaker Model 12"
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Disposal Reason</label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                >
                  <option value="UNREPAIRABLE_DEFECT">Damaged / Unrepairable</option>
                  <option value="OBSOLETE">Technologically Obsolete</option>
                  <option value="LOST_STOLEN">Lost or Stolen</option>
                  <option value="DONATION">Charity Donation / Transfer</option>
                  <option value="AUCTION_SALE">Sale / Auction</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Salvage Proceeds / Scrap Value (฿)</label>
                <input
                  type="number"
                  value={salvage}
                  onChange={(e) => setSalvage(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Investigation Notes & Approval Ref</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Enter details of damage or board approval ref..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold"
                >
                  Submit for Board Approval
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
// 4. ASSET BORROW VIEW (Asset Loan & Custody)
// ============================================================================
export function AssetBorrowView() {
  const [loans, setLoans] = useState<LoanRecord[]>([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newCode, setNewCode] = useState('');
  const [newName, setNewName] = useState('');
  const [newBorrower, setNewBorrower] = useState('');
  const [newDept, setNewDept] = useState('Primary');
  const [newDue, setNewDue] = useState('');
  const [newPurpose, setNewPurpose] = useState('');

  const handleCreateLoan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCode.trim() || !newBorrower.trim()) return;

    setLoans(prev => [
      {
        id: `loan-${Date.now()}`,
        assetCode: newCode,
        assetName: newName || 'School Equipment',
        borrower: newBorrower,
        department: newDept,
        borrowDate: new Date().toISOString().split('T')[0],
        dueDate: newDue || new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
        purpose: newPurpose || 'Academic Activity',
        status: 'ON_LOAN'
      },
      ...prev
    ]);

    setIsModalOpen(false);
    setNewCode('');
    setNewName('');
    setNewBorrower('');
    setNewPurpose('');
  };

  const handleReturn = (loanId: string) => {
    setLoans(prev => prev.map(l => l.id === loanId ? { ...l, status: 'RETURNED' } : l));
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Repeat className="w-5 h-5 text-amber-600" />
            <span>Equipment & Asset Loan Ledger</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Track teacher & staff loans for cameras, projectors, audio kits, and mobile lab equipment
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-[#0B6B4F] hover:bg-[#095740] text-white text-xs font-bold rounded-xl shadow-sm transition"
        >
          <Plus className="w-4 h-4" />
          <span>Check Out Asset</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-500 font-bold border-b border-slate-200 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Asset Tag & Item</th>
                <th className="py-3 px-4">Borrower & Dept</th>
                <th className="py-3 px-4">Loan Period</th>
                <th className="py-3 px-4">Purpose</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loans.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 text-xs">
                    <Repeat className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <span>No equipment currently on loan or overdue.</span>
                  </td>
                </tr>
              ) : (
                loans.map(loan => (
                  <tr key={loan.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3 px-4">
                      <span className="font-mono font-bold text-slate-900 block">{loan.assetCode}</span>
                      <span className="text-slate-600 block">{loan.assetName}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-900 block">{loan.borrower}</span>
                      <span className="text-[11px] text-slate-500 block">{loan.department}</span>
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px]">
                      <span className="text-slate-700 block">Out: {loan.borrowDate}</span>
                      <span className={`block font-semibold ${loan.status === 'OVERDUE' ? 'text-rose-600' : 'text-slate-500'}`}>
                        Due: {loan.dueDate}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600 max-w-xs truncate">
                      {loan.purpose}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {loan.status === 'ON_LOAN' && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          On Loan
                        </span>
                      )}
                      {loan.status === 'OVERDUE' && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 animate-pulse">
                          Overdue
                        </span>
                      )}
                      {loan.status === 'RETURNED' && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Returned
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {loan.status !== 'RETURNED' && (
                        <button
                          onClick={() => handleReturn(loan.id)}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold transition"
                        >
                          Return
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 animate-in zoom-in-95 duration-150">
            <h3 className="text-base font-bold text-slate-900 mb-1 flex items-center gap-2">
              <Repeat className="w-5 h-5 text-[#0B6B4F]" />
              <span>Asset Loan Checkout</span>
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Issue equipment loan slip to school personnel
            </p>

            <form onSubmit={handleCreateLoan} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Asset Tag</label>
                <input
                  type="text"
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value)}
                  placeholder="e.g. AST-2024-002"
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Equipment Name</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Epson Laser Projector"
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Borrower Name</label>
                  <input
                    type="text"
                    value={newBorrower}
                    onChange={(e) => setNewBorrower(e.target.value)}
                    placeholder="e.g. Kru Somchai"
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Due Date</label>
                  <input
                    type="date"
                    value={newDue}
                    onChange={(e) => setNewDue(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Event / Usage Purpose</label>
                <input
                  type="text"
                  value={newPurpose}
                  onChange={(e) => setNewPurpose(e.target.value)}
                  placeholder="e.g. Parent-Teacher Conference Presentation"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#0B6B4F] hover:bg-[#095740] text-white rounded-xl font-bold"
                >
                  Confirm Checkout
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
// 5. ASSET VERIFICATION VIEW (Annual Asset Physical Verification)
// ============================================================================
export function AssetVerificationView() {
  const [scanInput, setScanInput] = useState('');
  const [lastScanned, setLastScanned] = useState<string | null>(null);

  const [auditList, setAuditList] = useState<AuditRecord[]>([]);

  const handleScanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!scanInput.trim()) return;

    const codeToFind = scanInput.trim().toUpperCase();
    const itemIndex = auditList.findIndex(item => item.code.toUpperCase() === codeToFind);

    if (itemIndex >= 0) {
      setAuditList(prev => prev.map((item, idx) => {
        if (idx === itemIndex) {
          return {
            ...item,
            status: 'VERIFIED',
            verifiedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
            verifiedBy: 'Current Auditor (Barcode Scan)'
          };
        }
        return item;
      }));
      setLastScanned(`Matched: ${auditList[itemIndex].name} (${codeToFind}) - Verified!`);
    } else {
      setLastScanned(`Tag ${codeToFind} not found in current audit batch.`);
    }

    setScanInput('');
  };

  const verifiedCount = auditList.filter(a => a.status === 'VERIFIED').length;
  const totalCount = auditList.length;
  const progressPct = totalCount > 0 ? Math.round((verifiedCount / totalCount) * 100) : 0;

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* Audit Progress Card */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="space-y-1">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-[#0B6B4F]" />
            <span>Annual Asset Physical Verification</span>
          </h3>
          <p className="text-xs text-slate-500">
            Scan QR asset barcodes across campus rooms and reconcile with central asset master
          </p>
        </div>

        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="w-48 bg-slate-100 rounded-full h-3 overflow-hidden border border-slate-200">
            <div
              className="bg-[#0B6B4F] h-full transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <span className="font-mono font-bold text-sm text-[#0B6B4F] shrink-0">
            {verifiedCount}/{totalCount} ({progressPct}%)
          </span>
        </div>
      </div>

      {/* Barcode Scanner Bar */}
      <div className="bg-gradient-to-r from-emerald-900 to-[#0B6B4F] text-white p-5 rounded-2xl shadow-sm">
        <form onSubmit={handleScanSubmit} className="flex flex-col sm:flex-row gap-3 items-center">
          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
            <QrCode className="w-5 h-5 text-white" />
          </div>

          <div className="flex-1 w-full">
            <label className="block text-xs font-semibold text-emerald-100 mb-1">
              Barcode / RFID / Asset Tag Scanner Input:
            </label>
            <input
              type="text"
              value={scanInput}
              onChange={(e) => setScanInput(e.target.value)}
              placeholder="Point hand scanner or type asset tag (e.g. AST-2023-089)..."
              autoFocus
              className="w-full px-4 py-2.5 bg-white text-slate-900 rounded-xl text-xs font-mono font-bold placeholder:font-sans focus:outline-none focus:ring-2 focus:ring-white"
            />
          </div>

          <button
            type="submit"
            className="w-full sm:w-auto px-5 py-2.5 bg-white text-[#0B6B4F] hover:bg-emerald-50 rounded-xl font-bold text-xs shadow-sm transition shrink-0 cursor-pointer"
          >
            Verify Tag
          </button>
        </form>

        {lastScanned && (
          <div className="mt-3 text-xs bg-white/10 px-3.5 py-1.5 rounded-lg border border-white/20 font-mono">
            {lastScanned}
          </div>
        )}
      </div>

      {/* Audit Checklist Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-500 font-bold border-b border-slate-200 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Asset Code</th>
                <th className="py-3 px-4">Asset Description</th>
                <th className="py-3 px-4">Assigned Location</th>
                <th className="py-3 px-4">Verification Audit Timestamp</th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {auditList.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400 text-xs">
                    <CheckCircle2 className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <span>No assets currently scheduled for physical verification audit.</span>
                  </td>
                </tr>
              ) : (
                auditList.map(item => (
                  <tr key={item.code} className="hover:bg-slate-50/60 transition">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      {item.code}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-slate-900 block">{item.name}</span>
                      <span className="text-[11px] text-slate-500 block">Custodian: {item.expectedCustodian}</span>
                    </td>
                    <td className="py-3 px-4 text-slate-700">
                      {item.location}
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-600">
                      {item.verifiedAt}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {item.status === 'VERIFIED' ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 inline-flex items-center gap-1">
                          <CheckCircle className="w-3 h-3 text-emerald-600" />
                          Verified
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 inline-flex items-center gap-1">
                          <HelpCircle className="w-3 h-3 text-amber-600" />
                          Pending Scan
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
