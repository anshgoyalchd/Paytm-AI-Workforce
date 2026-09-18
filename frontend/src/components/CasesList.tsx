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
  UploadCloud
} from 'lucide-react';
import { CollectionCase, CaseStatus } from '../types';

interface CasesListProps {
  cases: CollectionCase[];
  onSelectCase: (caseItem: CollectionCase) => void;
  isLoading: boolean;
  onAddCaseClick?: () => void;
}

export const CasesList: React.FC<CasesListProps> = ({ cases, onSelectCase, isLoading, onAddCaseClick }) => {
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

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
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-sky-500/10 text-paytm-cyan border border-sky-500/20">NEW</span>;
      case 'CONTACT_ATTEMPTED':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">ATTEMPTED</span>;
      case 'CONTACTED':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">CONTACTED</span>;
      case 'PROMISE_TO_PAY':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">PROMISE TO PAY</span>;
      case 'DISPUTED':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">DISPUTED</span>;
      case 'ESCALATED':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-500/15 text-red-400 border border-red-500/30">ESCALATED</span>;
      case 'PAYMENT_PENDING':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">PENDING CONFIRMATION</span>;
      case 'SETTLED':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">SETTLED</span>;
      case 'CLOSED':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-800 text-slate-400 border border-slate-700">CLOSED</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-800 text-slate-300">{status}</span>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'HIGH':
      case 'URGENT':
        return <span className="text-[10px] font-bold text-rose-400">HIGH</span>;
      case 'MEDIUM':
        return <span className="text-[10px] font-medium text-amber-400">MED</span>;
      default:
        return <span className="text-[10px] font-normal text-slate-400">LOW</span>;
    }
  };

  // Dedicated empty state for new merchants
  if (!isLoading && cases.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl bg-slate-900/40 border border-slate-800/80 my-4">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-sky-500/10 to-blue-600/10 border border-sky-500/20 flex items-center justify-center mb-4">
          <FileText className="w-8 h-8 text-sky-400" />
        </div>
        <h3 className="text-lg font-bold text-white mb-2">No Overdue Invoices Found</h3>
        <p className="text-sm text-slate-400 max-w-md mb-6 leading-relaxed">
          Your collection portfolio is clean! Add overdue customer invoices or upload a CSV spreadsheet to let the autonomous AI workforce begin debt recovery.
        </p>
        {onAddCaseClick && (
          <button
            onClick={onAddCaseClick}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-semibold text-sm shadow-lg shadow-sky-500/25 transition-all"
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
        <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-slate-900/60 border border-slate-800">
          {['ALL', 'NEW', 'CONTACTED', 'PROMISE_TO_PAY', 'DISPUTED', 'ESCALATED', 'SETTLED'].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                statusFilter === s
                  ? 'bg-paytm-blue text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              {s.replace('_', ' ')}
            </button>
          ))}
        </div>

        {/* Search & Add Action */}
        <div className="flex items-center gap-2.5">
          <div className="relative min-w-[240px]">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search customer, phone, invoice..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl text-xs bg-slate-900/60 border border-slate-800 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-paytm-cyan"
            />
          </div>

          {onAddCaseClick && (
            <button
              onClick={onAddCaseClick}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-semibold text-xs shadow-md shadow-sky-500/20 transition-all shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Add Invoice</span>
            </button>
          )}
        </div>
      </div>

      {/* Cases Table */}
      <div className="overflow-hidden rounded-2xl bg-slate-900/60 border border-slate-800">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-950/40 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              <th className="py-3 px-4">Customer</th>
              <th className="py-3 px-4">Invoice Details</th>
              <th className="py-3 px-4">Overdue Amount</th>
              <th className="py-3 px-4">Priority</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Channel</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-xs">
            {isLoading ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-500">
                  Loading portfolio cases...
                </td>
              </tr>
            ) : filteredCases.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-500">
                  No cases found matching filter criteria.
                </td>
              </tr>
            ) : (
              filteredCases.map((caseItem) => (
                <tr 
                  key={caseItem.id} 
                  className="hover:bg-slate-800/30 transition-colors group cursor-pointer"
                  onClick={() => onSelectCase(caseItem)}
                >
                  {/* Customer */}
                  <td className="py-3 px-4">
                    <div className="font-semibold text-slate-200 group-hover:text-paytm-cyan transition-colors">
                      {caseItem.customer?.name || 'Unknown Customer'}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {caseItem.customer?.phone} • {caseItem.customer?.preferred_language}
                    </div>
                  </td>

                  {/* Invoice */}
                  <td className="py-3 px-4">
                    <div className="font-mono text-slate-300">
                      {caseItem.invoice?.invoice_number || 'N/A'}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Opened {new Date(caseItem.opened_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                    </div>
                  </td>

                  {/* Amount */}
                  <td className="py-3 px-4">
                    <div className="font-bold text-white">
                      {formatCurrency(caseItem.outstanding_amount)}
                    </div>
                    <div className="text-[10px] text-slate-400">
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
                    <div className="flex items-center gap-1.5 text-slate-400">
                      {caseItem.customer?.preferred_channel === 'VOICE' ? (
                        <>
                          <PhoneCall className="w-3.5 h-3.5 text-sky-400" />
                          <span>Voice Call</span>
                        </>
                      ) : (
                        <>
                          <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                          <span>WhatsApp</span>
                        </>
                      )}
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectCase(caseItem);
                      }}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 transition-all"
                    >
                      <span>View Dossier</span>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                    </button>
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
