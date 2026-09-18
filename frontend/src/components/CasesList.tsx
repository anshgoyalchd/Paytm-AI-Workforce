import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  MessageSquare, 
  PhoneCall, 
  Eye, 
  ArrowUpRight, 
  Clock, 
  CheckCircle2, 
  AlertTriangle,
  ChevronRight,
  Plus,
  FileText,
  UploadCloud,
  Zap,
  RefreshCw
} from 'lucide-react';
import { CollectionCase, CaseStatus } from '../types';
import { api } from '../services/api';

interface CasesListProps {
  cases: CollectionCase[];
  onSelectCase: (caseItem: CollectionCase) => void;
  isLoading: boolean;
  onAddCaseClick?: () => void;
  onCaseUpdated?: () => void;
}

export const CasesList: React.FC<CasesListProps> = ({ cases, onSelectCase, isLoading, onAddCaseClick, onCaseUpdated }) => {
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [reachingCaseId, setReachingCaseId] = useState<string | null>(null);
  const [recentActionNotice, setRecentActionNotice] = useState<{ id: string; text: string; success: boolean } | null>(null);

  const handleQuickAutoReach = async (e: React.MouseEvent, c: CollectionCase) => {
    e.stopPropagation();
    try {
      setReachingCaseId(c.id);
      const res = await api.triggerAutoReach(c.id);
      setRecentActionNotice({
        id: c.id,
        text: res.action_summary || 'Outreach dispatched successfully via Twilio!',
        success: res.success
      });
      if (onCaseUpdated) {
        onCaseUpdated();
      }
    } catch (err: any) {
      setRecentActionNotice({
        id: c.id,
        text: err.response?.data?.detail || err.message || 'Failed to dispatch touch',
        success: false
      });
    } finally {
      setReachingCaseId(null);
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const filteredCases = cases.filter((c) => {
    const matchesStatus = statusFilter === 'ALL' || c.status === statusFilter;
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      !searchQuery ||
      c.customer?.name.toLowerCase().includes(query) ||
      c.customer?.phone.includes(query) ||
      c.invoice?.invoice_number.toLowerCase().includes(query);
    return matchesStatus && matchesSearch;
  });

  const getStatusBadge = (status: CaseStatus) => {
    switch (status) {
      case 'NEW':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">NEW</span>;
      case 'CONTACT_ATTEMPTED':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">ATTEMPTED</span>;
      case 'CONTACTED':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-sky-50 text-sky-700 border border-sky-200">CONTACTED</span>;
      case 'PROMISE_TO_PAY':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">PROMISE TO PAY</span>;
      case 'DISPUTED':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">DISPUTED</span>;
      case 'ESCALATED':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-50 text-red-700 border border-red-200">ESCALATED</span>;
      case 'PAYMENT_PENDING':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-yellow-50 text-yellow-700 border border-yellow-200">PENDING CONFIRMATION</span>;
      case 'SETTLED':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">SETTLED</span>;
      case 'CLOSED':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">CLOSED</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">{status}</span>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'HIGH':
      case 'URGENT':
        return <span className="text-[10px] font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded">HIGH</span>;
      case 'MEDIUM':
        return <span className="text-[10px] font-medium text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">MED</span>;
      default:
        return <span className="text-[10px] font-normal text-slate-600 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded">LOW</span>;
    }
  };

  // Dedicated empty state for new merchants
  if (!isLoading && cases.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center rounded-xl bg-white border border-slate-200 my-4 shadow-xs">
        <div className="w-14 h-14 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center mb-4 text-[#002970]">
          <FileText className="w-7 h-7" />
        </div>
        <h3 className="text-base font-bold text-slate-900 mb-1.5">No Overdue Invoices Found</h3>
        <p className="text-xs text-slate-500 max-w-md mb-5 leading-relaxed">
          Your collection portfolio is clean! Add overdue customer invoices or upload a CSV spreadsheet to let the autonomous AI workforce begin debt recovery.
        </p>
        {onAddCaseClick && (
          <button
            onClick={onAddCaseClick}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#002970] hover:bg-[#001f54] text-white font-medium text-xs shadow-xs transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add Your First Overdue Invoice</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Action Bar & Search & Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-lg bg-white border border-slate-200 shadow-xs">
          {['ALL', 'NEW', 'CONTACTED', 'PROMISE_TO_PAY', 'DISPUTED', 'ESCALATED', 'SETTLED'].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                statusFilter === s
                  ? 'bg-[#002970] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              {s.replace('_', ' ')}
            </button>
          ))}
        </div>

        {/* Search & Add Action */}
        <div className="flex items-center gap-2.5">
          <div className="relative min-w-[240px]">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search customer, phone, invoice..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-lg text-xs bg-white border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 shadow-xs"
            />
          </div>

          {onAddCaseClick && (
            <button
              onClick={onAddCaseClick}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#002970] hover:bg-[#001f54] text-white font-medium text-xs shadow-xs transition-all shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Add Invoice</span>
            </button>
          )}
        </div>
      </div>

      {/* Autonomous Action Feedback Notice */}
      {recentActionNotice && (
        <div className={`p-3 rounded-lg text-xs flex items-center justify-between border ${
          recentActionNotice.success ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-rose-50 border-rose-200 text-rose-900'
        }`}>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-medium">{recentActionNotice.text}</span>
          </div>
          <button
            onClick={() => setRecentActionNotice(null)}
            className="text-[11px] underline ml-3 text-slate-500 hover:text-slate-800"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Cases Table */}
      <div className="overflow-hidden rounded-xl bg-white border border-slate-200 shadow-xs">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
              <th className="py-3 px-4">Customer</th>
              <th className="py-3 px-4">Invoice Details</th>
              <th className="py-3 px-4">Overdue Amount</th>
              <th className="py-3 px-4">Priority</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Channel</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {isLoading ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-400">
                  Loading portfolio cases...
                </td>
              </tr>
            ) : filteredCases.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-400">
                  No cases found matching filter criteria.
                </td>
              </tr>
            ) : (
              filteredCases.map((caseItem) => (
                <tr 
                  key={caseItem.id} 
                  className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                  onClick={() => onSelectCase(caseItem)}
                >
                  {/* Customer */}
                  <td className="py-3 px-4">
                    <div className="font-semibold text-slate-900 group-hover:text-blue-700 transition-colors">
                      {caseItem.customer?.name || 'Unknown Customer'}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {caseItem.customer?.phone} • {caseItem.customer?.preferred_language}
                    </div>
                  </td>

                  {/* Invoice */}
                  <td className="py-3 px-4">
                    <div className="font-mono text-slate-700">
                      {caseItem.invoice?.invoice_number || 'N/A'}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Opened {new Date(caseItem.opened_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                    </div>
                  </td>

                  {/* Amount */}
                  <td className="py-3 px-4">
                    <div className="font-bold text-slate-900">
                      {formatCurrency(caseItem.outstanding_amount)}
                    </div>
                    <div className="text-[10px] text-slate-500">
                      {caseItem.status === 'SETTLED' ? 'Cleared' : 'Due Balance'}
                    </div>
                  </td>

                  {/* Priority */}
                  <td className="py-3 px-4">
                    {getPriorityBadge(caseItem.priority)}
                  </td>

                  {/* Status */}
                  <td className="py-3 px-4">
                    {getStatusBadge(caseItem.status)}
                  </td>

                  {/* Channel */}
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1.5 text-slate-600">
                      {caseItem.customer?.preferred_channel === 'VOICE' ? (
                        <>
                          <PhoneCall className="w-3.5 h-3.5 text-blue-600" />
                          <span>Voice Call</span>
                        </>
                      ) : (
                        <>
                          <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                          <span>WhatsApp</span>
                        </>
                      )}
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={(e) => handleQuickAutoReach(e, caseItem)}
                        disabled={reachingCaseId === caseItem.id || caseItem.status === 'SETTLED'}
                        className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all shadow-2xs ${
                          caseItem.status === 'SETTLED'
                            ? 'opacity-40 cursor-not-allowed bg-slate-100 text-slate-400'
                            : 'bg-blue-50 hover:bg-blue-100 text-[#002970] border border-blue-200 hover:border-blue-300'
                        }`}
                        title="Run 1-Click Autonomous Outreach (Twilio Voice/WhatsApp + Cognee memory)"
                      >
                        {reachingCaseId === caseItem.id ? (
                          <>
                            <RefreshCw className="w-3 h-3 animate-spin text-blue-700" />
                            <span>Reaching...</span>
                          </>
                        ) : (
                          <>
                            <Zap className="w-3 h-3 text-amber-500 fill-amber-400" />
                            <span>Auto Reach</span>
                          </>
                        )}
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectCase(caseItem);
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all"
                      >
                        <span>Dossier</span>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
