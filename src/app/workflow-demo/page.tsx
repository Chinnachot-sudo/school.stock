'use client';

import React, { useState } from 'react';
import WorkflowStepper, { DocumentStatus } from '@/components/workflow/WorkflowStepper';
import DocumentActions from '@/components/workflow/DocumentActions';
import { ArrowLeft, CheckCircle2, Shield, Sparkles } from 'lucide-react';
import Link from 'next/link';

export default function WorkflowDemoPage() {
  const statuses: DocumentStatus[] = [
    'SUBMITTED',
    'PENDING_APPROVAL',
    'APPROVED',
    'ISSUED',
    'COMPLETED'
  ];

  const sampleHistory = {
    SUBMITTED: { actor: 'Ms. Sarah J. (Teacher)', timestamp: '24 Sep 2026, 08:30' },
    PENDING_APPROVAL: { actor: 'Automated Routing', timestamp: '24 Sep 2026, 08:31' },
    APPROVED: { actor: 'Dr. Robert M. (Director)', timestamp: '24 Sep 2026, 09:15' },
    ISSUED: { actor: 'Mr. Panyawut S. (Warehouse)', timestamp: '24 Sep 2026, 10:00' },
    COMPLETED: { actor: 'Receiving Staff', timestamp: '24 Sep 2026, 11:20' }
  };

  // Interactive live tester state
  const [liveStatus, setLiveStatus] = useState<DocumentStatus>('PENDING_APPROVAL');
  const [liveReason, setLiveReason] = useState<string | undefined>(undefined);

  return (
    <div className="max-w-5xl mx-auto space-y-8 p-4 sm:p-6 lg:p-8 animate-in fade-in duration-200">
      {/* Header & Back Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              href="/"
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition inline-flex items-center gap-1 text-xs font-semibold"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Dashboard</span>
            </Link>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span>Workflow Stepper & Document Lifecycle</span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-[#0B6B4F] border border-emerald-200">
              Visual QA Demo
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Standard 5-stage lifecycle for Requests, Goods Receipts, Issue Notes, Invoices, and Returns
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500 bg-white border border-slate-200 px-3 py-1.5 rounded-xl shadow-2xs">
          <Shield className="w-4 h-4 text-[#0B6B4F]" />
          <span>Single CTA & Audit Enforced</span>
        </div>
      </div>

      {/* Interactive Live Testing Sandbox */}
      <div className="bg-white border-2 border-[#0B6B4F]/30 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#0B6B4F]">
              <Sparkles className="w-4 h-4" />
              <span>Interactive Action Tester</span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Click the action button on the right to simulate status changes and confirm dialogs
            </p>
          </div>

          <DocumentActions
            documentId="REQ-2026-0881"
            documentType="REQUEST"
            currentStatus={liveStatus}
            userRole="SUPER_ADMIN"
            isOwner={true}
            onStatusChange={(newStatus, reason) => {
              setLiveStatus(newStatus);
              if (reason) setLiveReason(reason);
            }}
          />
        </div>

        <WorkflowStepper
          currentStatus={liveStatus}
          stepsHistory={sampleHistory}
          rejectionReason={liveReason}
        />

        <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-100">
          <span>Current Active Status: <strong className="text-slate-800 font-mono">{liveStatus}</strong></span>
          <button
            type="button"
            onClick={() => {
              setLiveStatus('SUBMITTED');
              setLiveReason(undefined);
            }}
            className="text-xs font-bold text-[#0B6B4F] hover:underline cursor-pointer"
          >
            Reset to "Submitted"
          </button>
        </div>
      </div>

      {/* Static Visual QA: Side-by-side rendering of all states */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
          All Lifecycle States (Side-by-Side Review)
        </h2>

        {statuses.map((status) => (
          <div key={status} className="bg-white border border-slate-200/90 rounded-2xl p-5 space-y-3 shadow-2xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div>
                <span className="text-[11px] font-mono font-bold text-slate-400 uppercase">State:</span>{' '}
                <span className="text-xs font-bold text-slate-900">{status}</span>
              </div>
              <DocumentActions
                documentId={`DOC-${status}`}
                documentType="REQUEST"
                currentStatus={status}
                userRole="SUPER_ADMIN"
                isOwner={true}
              />
            </div>

            <WorkflowStepper
              currentStatus={status}
              stepsHistory={sampleHistory}
            />
          </div>
        ))}

        {/* Rejected State Preview */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 space-y-3 shadow-2xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <div>
              <span className="text-[11px] font-mono font-bold text-slate-400 uppercase">State:</span>{' '}
              <span className="text-xs font-bold text-rose-600">REJECTED</span>
            </div>
          </div>
          <WorkflowStepper
            currentStatus="REJECTED"
            stepsHistory={sampleHistory}
            rejectionReason="Requested item exceeds science department quarterly allocation limit. Please contact the Department Head."
          />
        </div>
      </div>
    </div>
  );
}
