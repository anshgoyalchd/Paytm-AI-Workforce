import React, { useState } from 'react';
import { 
  Search, 
  MessageSquare, 
  PhoneCall, 
  CheckCircle2, 
  ChevronRight, 
  Plus, 
  FileText, 
  Zap, 
  RefreshCw,
  Copy,
  ExternalLink,
  CreditCard,
  QrCode
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
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  const handleQuickAutoReach = async (e: React.MouseEvent, c: CollectionCase) => {
    e.stopPropagation();
    try {
      setReachingCaseId(c.id);
      const res = await api.triggerAutoReach(c.id);
      setRecentActionNotice({
        id: c.id,
        text: res.action_summary || 'Outreach dispatched successfully via Twilio / WhatsApp!',
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

  const copyUpiLink = (e: React.MouseEvent, invoiceNum: string) => {
    e.stopPropagation();
    const link = `https://paytm.com/pay/${invoiceNum}`;
    navigator.clipboard.writeText(link);
    setCopiedLink(invoiceNum);
    setTimeout(() => setCopiedLink(null), 2500);
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
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-[#FFF8E6] text-[#D97706] border border-[#FDE68A]">NEW</span>;
      case 'CONTACT_ATTEMPTED':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-200">ATTEMPTED</span>;
      case 'CONTACTED':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-[#E6F7FD] text-[#002970] border border-[#BAE7FB]">CONTACTED</span>;
      case 'PROMISE_TO_PAY':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-[#E6F7FD] text-[#0088CC] border border-[#BAE7FB]">PROMISE TO PAY</span>;
      case 'DISPUTED':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-[#FEECEB] text-[#DC2626] border border-[#FBC5C3]">DISPUTED</span>;
      case 'ESCALATED':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-[#FEECEB] text-[#DC2626] border border-[#FBC5C3]">ESCALATED</span>;
      case 'PAYMENT_PENDING':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-50 text-amber-800 border border-amber-200">PENDING CONFIRMATION</span>;
      case 'SETTLED':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-[#E8F8F0] text-[#00B970] border border-[#A8ECC6]">SETTLED</span>;
      case 'CLOSED':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-slate-100 text-slate-600 border border-slate-200">CLOSED</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-slate-100 text-slate-700 border border-slate-200">{status}</span>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'HIGH':
      case 'URGENT':
        return <span className="text-[10px] font-bold text-[#DC2626] bg-[#FEECEB] border border-[#FBC5C3] px-2 py-0.5 rounded-md">HIGH</span>;
      case 'MEDIUM':
        return <span className="text-[10px] font-bold text-[#D97706] bg-[#FFF8E6] border border-[#FDE68A] px-2 py-0.5 rounded-md">MED</span>;
      default:
        return <span className="text-[10px] font-medium text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md">LOW</span>;
    }
  };

  // Dedicated empty state for new merchants
  if (!isLoading && cases.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl bg-white border border-[#EBF0F5] my-4 shadow-paytm">
        <div className="w-16 h-16 rounded-2xl bg-[#E6F7FD] border border-[#BAE7FB] flex items-center justify-center mb-4 text-[#002970]">
          <FileText className="w-8 h-8 text-[#00BAF2]" />
        </div>
        <h3 className="text-lg font-bold text-slate-900 mb-1.5">No Overdue Invoices Found</h3>
        <p className="text-xs text-slate-500 max-w-md mb-6 leading-relaxed">
          Your collection ledger is clean! Upload an overdue invoice to let Paytm Autonomous Collections start debt recovery across WhatsApp &amp; Voice Telephony.
        </p>
        {onAddCaseClick && (
          <button
            onClick={onAddCaseClick}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#00BAF2] hover:bg-[#009FD6] text-[#001740] font-black text-xs shadow-paytm-cyan transition-all"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Add Overdue Invoice</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Top Filter & Search Action Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-[#EBF0F5] shadow-xs">
        {/* Status Filter Chips */}
        <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto no-scrollbar">
          {[
            { id: 'ALL', label: 'All Cases' },
            { id: 'NEW', label: 'New' },
            { id: 'CONTACTED', label: 'Contacted' },
            { id: 'PROMISE_TO_PAY', label: 'Promise to Pay' },
            { id: 'DISPUTED', label: 'Disputed' },
            { id: 'ESCALATED', label: 'Escalated' },
            { id: 'SETTLED', label: 'Settled' }
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setStatusFilter(item.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                statusFilter === item.id
                  ? 'bg-[#002970] text-white shadow-paytm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Search & Add Action */}
        <div className="flex items-center gap-2.5">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search customer, phone, invoice..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl text-xs bg-[#F8FAFC] border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#00BAF2] focus:bg-white focus:ring-1 focus:ring-[#00BAF2] transition-all"
            />
          </div>

          {onAddCaseClick && (
            <button
              onClick={onAddCaseClick}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#00BAF2] hover:bg-[#009FD6] text-[#001740] font-black text-xs shadow-paytm-cyan transition-all shrink-0 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
              <span>Add Invoice</span>
            </button>
          )}
        </div>
      </div>

      {/* Autonomous Action Feedback Notice */}
      {recentActionNotice && (
        <div className={`p-3.5 rounded-xl text-xs flex items-center justify-between border shadow-xs animate-fadeIn ${
          recentActionNotice.success 
            ? 'bg-[#E8F8F0] border-[#A8ECC6] text-[#00B970]' 
            : 'bg-[#FEECEB] border-[#FBC5C3] text-[#DC2626]'
        }`}>
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-[#00B970] shrink-0" />
            <span className="font-bold text-slate-800">{recentActionNotice.text}</span>
          </div>
          <button
            onClick={() => setRecentActionNotice(null)}
            className="text-[11px] font-bold underline ml-3 text-slate-500 hover:text-slate-800"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Paytm Merchant Ledger Table */}
      <div className="overflow-hidden rounded-2xl bg-white border border-[#EBF0F5] shadow-paytm">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-[#002970]" />
            <h3 className="text-xs font-bold text-[#002970] uppercase tracking-wider">
              Merchant Debt Ledger &amp; Active Recovery Accounts
            </h3>
          </div>
          <span className="text-[11px] font-semibold text-slate-500">
            Showing {filteredCases.length} of {cases.length} invoices
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-[#F8FAFC] text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Debtor / Customer</th>
                <th className="py-3 px-4">Invoice No.</th>
                <th className="py-3 px-4">Overdue Balance</th>
                <th className="py-3 px-4">Priority</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Paytm UPI Link</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 text-[#00BAF2] animate-spin mx-auto mb-2" />
                    <span>Loading merchant collection portfolio...</span>
                  </td>
                </tr>
              ) : filteredCases.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No cases match the selected filters.
                  </td>
                </tr>
              ) : (
                filteredCases.map((caseItem) => (
                  <tr 
                    key={caseItem.id} 
                    className="hover:bg-[#E6F7FD]/20 transition-colors group cursor-pointer"
                    onClick={() => onSelectCase(caseItem)}
                  >
                    {/* Customer */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 group-hover:text-[#002970] transition-colors">
                        {caseItem.customer?.name || 'Customer'}
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                        <span>{caseItem.customer?.phone}</span>
                        <span className="text-slate-300">•</span>
                        <span className="text-slate-400">{caseItem.customer?.preferred_language || 'Hindi'}</span>
                      </div>
                    </td>

                    {/* Invoice */}
                    <td className="py-3.5 px-4">
                      <div className="font-mono font-bold text-slate-800">
                        {caseItem.invoice?.invoice_number || 'N/A'}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        Opened {new Date(caseItem.opened_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                      </div>
                    </td>

                    {/* Balance */}
                    <td className="py-3.5 px-4">
                      <div className="font-black text-slate-900 text-sm">
                        {formatCurrency(caseItem.outstanding_amount)}
                      </div>
                      <div className="text-[10px] font-semibold text-slate-400">
                        {caseItem.status === 'SETTLED' ? 'Cleared' : 'Pending'}
                      </div>
                    </td>

                    {/* Priority */}
                    <td className="py-3.5 px-4">
                      {getPriorityBadge(caseItem.priority)}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">
                      {getStatusBadge(caseItem.status)}
                    </td>

                    {/* Paytm UPI Link Pill */}
                    <td className="py-3.5 px-4" onClick={(e) => e.stopPropagation()}>
                      {caseItem.invoice?.invoice_number ? (
                        <button
                          onClick={(e) => copyUpiLink(e, caseItem.invoice!.invoice_number)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-[#E6F7FD] hover:bg-[#BAE7FB] text-[#002970] border border-[#BAE7FB] transition-colors"
                          title="Click to copy Paytm UPI deep link"
                        >
                          <QrCode className="w-3 h-3 text-[#00BAF2]" />
                          <span>{copiedLink === caseItem.invoice!.invoice_number ? 'Copied!' : 'UPI Link'}</span>
                          <Copy className="w-2.5 h-2.5 opacity-60 ml-0.5" />
                        </button>
                      ) : (
                        <span className="text-slate-400 text-[11px]">—</span>
                      )}
                    </td>

                    {/* Quick Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={(e) => handleQuickAutoReach(e, caseItem)}
                          disabled={reachingCaseId === caseItem.id || caseItem.status === 'SETTLED'}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                            caseItem.status === 'SETTLED'
                              ? 'opacity-40 cursor-not-allowed bg-slate-100 text-slate-400'
                              : 'bg-[#002970] hover:bg-[#001f54] text-white shadow-paytm'
                          }`}
                          title="Dispatch autonomous outreach via Twilio Voice / WhatsApp"
                        >
                          {reachingCaseId === caseItem.id ? (
                            <>
                              <RefreshCw className="w-3 h-3 animate-spin text-[#00BAF2]" />
                              <span>Reaching...</span>
                            </>
                          ) : (
                            <>
                              <Zap className="w-3 h-3 text-[#00BAF2] fill-current" />
                              <span>Auto Reach</span>
                            </>
                          )}
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectCase(caseItem);
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-[#F5F7FA] hover:bg-slate-200 text-slate-700 transition-all"
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
    </div>
  );
};

export default CasesList;
