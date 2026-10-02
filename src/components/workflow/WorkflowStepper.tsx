'use client';

import React from 'react';
import { Check, Clock, XCircle, AlertCircle, Loader2 } from 'lucide-react';

export type DocumentStatus =
  | 'SUBMITTED'
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'ISSUED'
  | 'COMPLETED'
  | 'REJECTED'
  | 'CANCELLED';

export interface StepHistoryRecord {
  actor: string;
  timestamp: string;
}

export interface WorkflowStepperProps {
  currentStatus?: DocumentStatus;
  stepsHistory?: Partial<Record<DocumentStatus, StepHistoryRecord>>;
  rejectionReason?: string;
  isLoading?: boolean;
}

export const LIFECYCLE_STEPS: { key: DocumentStatus; label: string }[] = [
  { key: 'SUBMITTED', label: 'Submitted' },
  { key: 'PENDING_APPROVAL', label: 'Pending Approval' },
  { key: 'APPROVED', label: 'Approved' },
  { key: 'ISSUED', label: 'Issued' },
  { key: 'COMPLETED', label: 'Completed' },
];

export default function WorkflowStepper({
  currentStatus = 'SUBMITTED',
  stepsHistory = {},
  rejectionReason,
  isLoading = false
}: WorkflowStepperProps) {
  // 1. Loading Skeleton State
  if (isLoading) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs animate-pulse">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {[1, 2, 3, 4, 5].map((idx) => (
            <div key={idx} className="flex md:flex-col items-center gap-3 md:gap-2 flex-1">
              <div className="w-8 h-8 rounded-full bg-slate-200 shrink-0" />
              <div className="space-y-1.5 w-full max-w-[100px]">
                <div className="h-3 bg-slate-200 rounded-md" />
                <div className="h-2 bg-slate-100 rounded-md w-3/4 mx-auto" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 2. Empty / Unknown State Fallback
  if (!currentStatus) {
    return (
      <div className="bg-white border border-dashed border-slate-300 rounded-2xl p-6 text-center text-xs text-slate-400">
        No workflow status recorded for this document.
      </div>
    );
  }

  const isRejected = currentStatus === 'REJECTED';
  const isCancelled = currentStatus === 'CANCELLED';
  const currentIndex = LIFECYCLE_STEPS.findIndex(s => s.key === currentStatus);

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
      {/* Stepper Container: Horizontal on md/lg, Vertical on mobile */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-2">
        {LIFECYCLE_STEPS.map((step, idx) => {
          const isDone = !isRejected && !isCancelled && currentIndex > idx;
          const isCurrent = !isRejected && !isCancelled && currentIndex === idx;
          const isUpcoming = !isRejected && !isCancelled && currentIndex < idx;

          const history = stepsHistory[step.key];

          return (
            <React.Fragment key={step.key}>
              {/* Step Node */}
              <div className="flex md:flex-col items-center gap-3.5 md:gap-2 flex-1 text-left md:text-center">
                {/* Node Indicator */}
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold transition-all duration-200 ${
                    isDone
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : isCurrent
                      ? 'bg-blue-600 text-white ring-4 ring-blue-100 shadow-xs'
                      : 'bg-slate-100 text-slate-400 border border-slate-200'
                  }`}
                >
                  {isDone ? (
                    <Check className="w-4 h-4 stroke-[3]" />
                  ) : isCurrent ? (
                    <div className="w-2.5 h-2.5 bg-white rounded-full" />
                  ) : (
                    <span>{idx + 1}</span>
                  )}
                </div>

                {/* Step Text Info */}
                <div className="min-w-0">
                  <span
                    className={`block text-xs font-bold leading-tight ${
                      isCurrent
                        ? 'text-blue-700'
                        : isDone
                        ? 'text-slate-800'
                        : 'text-slate-400'
                    }`}
                  >
                    {step.label}
                  </span>

                  {history && (
                    <span className="block text-[10px] text-slate-500 mt-0.5 font-medium truncate">
                      {history.actor} • {history.timestamp}
                    </span>
                  )}
                </div>
              </div>

              {/* Connecting Line (Visible on Desktop) */}
              {idx < LIFECYCLE_STEPS.length - 1 && (
                <div
                  className={`hidden md:block h-0.5 flex-1 mx-2 transition-all ${
                    isDone ? 'bg-emerald-600' : 'bg-slate-200'
                  }`}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Terminal Rejection or Cancellation Banner */}
      {(isRejected || isCancelled) && (
        <div className="mt-4 p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-rose-800 text-xs animate-in fade-in">
          <XCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
          <div>
            <span className="font-bold">
              Document {isRejected ? 'Rejected' : 'Cancelled'}
            </span>
            {rejectionReason && (
              <p className="text-rose-700 mt-0.5 text-[11px] leading-relaxed">
                Reason: {rejectionReason}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
