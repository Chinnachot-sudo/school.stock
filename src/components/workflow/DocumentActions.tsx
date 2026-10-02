'use client';

import React, { useState } from 'react';
import { Check, X, AlertTriangle, Send, Loader2 } from 'lucide-react';
import { DocumentStatus } from './WorkflowStepper';

export type IrreversibleAction = 'REJECT' | 'CANCEL' | 'VOID' | 'REFUND' | 'STOCK_ADJUSTMENT';

interface DocumentActionsProps {
  documentId: string;
  documentType: 'REQUEST' | 'GRN' | 'ISSUE' | 'INVOICE' | 'RETURN';
  currentStatus: DocumentStatus;
  userRole: string;
  isOwner?: boolean;
  onStatusChange?: (newStatus: DocumentStatus, reason?: string) => Promise<void> | void;
}

export default function DocumentActions({
  documentId,
  documentType,
  currentStatus,
  userRole,
  isOwner = false,
  onStatusChange
}: DocumentActionsProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<DocumentStatus | null>(null);
  const [actionTitle, setActionTitle] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  // Normalize role
  const normalizedRole = (userRole || '').toUpperCase();
  const isApprover = [
    'SUPER_ADMIN',
    'ADMIN',
    'INVENTORY_MANAGER',
    'DEPARTMENT_HEAD',
    'DIRECTOR',
    'WAREHOUSE_SUPERVISOR'
  ].includes(normalizedRole);

  const isWarehouse = [
    'SUPER_ADMIN',
    'ADMIN',
    'INVENTORY_MANAGER',
    'WAREHOUSE_STAFF',
    'WAREHOUSE_SUPERVISOR'
  ].includes(normalizedRole);

  // Placeholder audit logging function
  const logAudit = (action: string, docId: string, reasonText?: string) => {
    console.log(`[AUDIT LOG] Action: ${action} | Doc: ${docId} | Actor: ${userRole} | Timestamp: ${new Date().toISOString()} | Reason: ${reasonText || 'N/A'}`);
  };

  const executeAction = async (targetStatus: DocumentStatus, actionReason?: string) => {
    try {
      setLoading(true);
      logAudit(targetStatus, documentId, actionReason);
      if (onStatusChange) {
        await onStatusChange(targetStatus, actionReason);
      }
      setIsDialogOpen(false);
      setReason('');
      setPendingAction(null);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenIrreversibleDialog = (action: DocumentStatus, title: string) => {
    setPendingAction(action);
    setActionTitle(title);
    setReason('');
    setIsDialogOpen(true);
  };

  // Determine single primary action (Hide completely if role cannot use)
  let primaryActionNode: React.ReactNode = null;

  if (currentStatus === 'PENDING_APPROVAL' && isApprover) {
    primaryActionNode = (
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={loading}
          onClick={() => handleOpenIrreversibleDialog('REJECTED', 'Reject Document')}
          className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold rounded-xl transition cursor-pointer"
        >
          Reject
        </button>
        <button
          type="button"
          disabled={loading}
          onClick={() => executeAction('APPROVED')}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer flex items-center gap-1.5"
        >
          {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          <Check className="w-4 h-4" />
          <span>Approve Document</span>
        </button>
      </div>
    );
  } else if (currentStatus === 'APPROVED' && isWarehouse) {
    primaryActionNode = (
      <button
        type="button"
        disabled={loading}
        onClick={() => executeAction('ISSUED')}
        className="px-4 py-2 bg-[#0B6B4F] hover:bg-[#095740] text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer flex items-center gap-1.5"
      >
        {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
        <Send className="w-4 h-4" />
        <span>Issue Items</span>
      </button>
    );
  } else if (currentStatus === 'SUBMITTED' && isOwner) {
    primaryActionNode = (
      <button
        type="button"
        disabled={loading}
        onClick={() => handleOpenIrreversibleDialog('CANCELLED', 'Cancel Request')}
        className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
      >
        Cancel Request
      </button>
    );
  } else if (currentStatus === 'ISSUED' && isWarehouse) {
    primaryActionNode = (
      <button
        type="button"
        disabled={loading}
        onClick={() => executeAction('COMPLETED')}
        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer flex items-center gap-1.5"
      >
        {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
        <Check className="w-4 h-4" />
        <span>Mark Completed</span>
      </button>
    );
  }

  // If no action is permitted for the current status + role, render nothing
  if (!primaryActionNode) {
    return null;
  }

  return (
    <div className="flex items-center justify-end gap-2">
      {primaryActionNode}

      {/* Irreversible Action Confirm Dialog */}
      {isDialogOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-2.5 text-rose-600 mb-2">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <h3 className="text-sm font-bold text-slate-900">
                Confirm {actionTitle || 'Irreversible Action'}
              </h3>
            </div>

            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
              This action cannot be undone and will be permanently recorded in the system audit trail. Please state your reason below.
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (pendingAction && reason.trim()) {
                  executeAction(pendingAction, reason.trim());
                }
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Reason / Remarks (Required)
                </label>
                <textarea
                  rows={3}
                  required
                  autoFocus
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Enter clear justification for this action..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsDialogOpen(false)}
                  className="px-3.5 py-2 text-slate-600 hover:bg-slate-100 text-xs font-semibold rounded-xl"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={!reason.trim() || loading}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-xs transition disabled:opacity-50"
                >
                  {loading ? 'Processing...' : 'Confirm & Log Audit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
