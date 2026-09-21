import React, { useState } from 'react';
import { X, FileText, Upload, User, Phone, Mail, IndianRupee, Calendar, Languages, CheckCircle2, AlertCircle, PlusCircle } from 'lucide-react';
import { api } from '../services/api';
import { CollectionCase } from '../types';

interface AddCaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newCase?: CollectionCase) => void;
}

export const AddCaseModal: React.FC<AddCaseModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [tab, setTab] = useState<'MANUAL' | 'CSV'>('MANUAL');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Manual Form State
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('ansh.goyalchd@gmail.com');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().split('T')[0];
  });
  const [language, setLanguage] = useState('Hindi');
  const [priority, setPriority] = useState('MEDIUM');

  // CSV Form State
  const [csvFile, setCsvFile] = useState<File | null>(null);

  if (!isOpen) return null;

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    const parsedAmount = parseFloat(amount.replace(/,/g, ''));
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Please enter a valid invoice amount greater than 0.');
      return;
    }

    setLoading(true);
    try {
      const created = await api.createCase({
        customer_name: customerName.trim(),
        customer_phone: phone.trim(),
        customer_email: email.trim() || undefined,
        invoice_number: invoiceNumber.trim(),
        amount: parsedAmount,
        due_date: dueDate,
        preferred_language: language,
        priority: priority,
      });
      setSuccessMessage(`Invoice ${invoiceNumber} successfully recorded in Paytm merchant ledger!`);
      setTimeout(() => {
        onSuccess(created);
        onClose();
      }, 1000);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create collection case. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCsvSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!csvFile) {
      setError('Please choose a valid CSV file to upload.');
      return;
    }

    setError(null);
    setSuccessMessage(null);
    setLoading(true);

    try {
      const res = await api.uploadCasesCSV(csvFile);
      setSuccessMessage(`Successfully imported ${res.imported_count} overdue invoices!`);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1200);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to parse and upload CSV file.');
    } finally {
      setLoading(false);
    }
  };

  const downloadSampleCSV = () => {
    const content = `customer_name,phone,invoice_number,amount,due_date,language\n` +
      `Ramesh Sharma,+919876543210,INV-2026-001,18500,2026-03-01,Hindi\n` +
      `Sita Patel,+919876543212,INV-2026-002,42000,2026-02-15,English\n` +
      `Vikram Singh,+919876543213,INV-2026-003,9500,2026-03-10,Hinglish\n`;
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'sample_paytm_cases.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="w-full max-w-2xl rounded-2xl bg-white border border-slate-200/90 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#002970] via-[#001f54] to-[#002970] p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
              <FileText className="w-5 h-5 text-[#00BAF2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-white font-extrabold text-lg tracking-tight">Pay<span className="text-[#00BAF2]">tm</span></span>
                <span className="text-white/60 text-xs">|</span>
                <h2 className="text-sm font-bold tracking-tight text-white">Register Overdue Invoice</h2>
              </div>
              <p className="text-xs text-white/80 mt-0.5">
                Onboard delinquent debtor into autonomous recovery workflow with verified Paytm UPI
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-slate-200 bg-slate-50/80 p-1.5 gap-1">
          <button
            type="button"
            onClick={() => { setTab('MANUAL'); setError(null); }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              tab === 'MANUAL'
                ? 'bg-white text-[#002970] shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Single Invoice Entry
          </button>
          <button
            type="button"
            onClick={() => { setTab('CSV'); setError(null); }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              tab === 'CSV'
                ? 'bg-white text-[#002970] shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Bulk CSV Upload
          </button>
        </div>

        {/* Messages */}
        {error && (
          <div className="m-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 font-medium">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {successMessage && (
          <div className="m-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2 font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Form Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {tab === 'MANUAL' ? (
            <form onSubmit={handleManualSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Customer Full Name *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Ramesh Sharma"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-white border border-slate-300 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#00BAF2] focus:ring-1 focus:ring-[#00BAF2] shadow-2xs font-semibold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Mobile Number (+91) *
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                    <input
                      type="tel"
                      required
                      placeholder="+91-9876543210"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-white border border-slate-300 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#00BAF2] focus:ring-1 focus:ring-[#00BAF2] shadow-2xs font-semibold"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Invoice Number *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. INV-2026-108"
                    value={invoiceNumber}
                    onChange={(e) => setInvoiceNumber(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#00BAF2] focus:ring-1 focus:ring-[#00BAF2] shadow-2xs font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Outstanding Amount (₹) *
                  </label>
                  <div className="relative">
                    <IndianRupee className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                    <input
                      type="number"
                      step="0.01"
                      required
                      placeholder="18500"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-white border border-slate-300 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#00BAF2] focus:ring-1 focus:ring-[#00BAF2] shadow-2xs font-semibold"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Due Date *
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                    <input
                      type="date"
                      required
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-white border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-[#00BAF2] focus:ring-1 focus:ring-[#00BAF2] shadow-2xs font-semibold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Preferred Language
                  </label>
                  <div className="relative">
                    <Languages className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                    <select
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-white border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-[#00BAF2] focus:ring-1 focus:ring-[#00BAF2] shadow-2xs font-semibold"
                    >
                      <option value="Hindi">Hindi (Sarvam AI)</option>
                      <option value="English">English</option>
                      <option value="Hinglish">Hinglish</option>
                      <option value="Tamil">Tamil</option>
                      <option value="Telugu">Telugu</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Priority Tier
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-white border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-[#00BAF2] focus:ring-1 focus:ring-[#00BAF2] shadow-2xs font-semibold"
                  >
                    <option value="MEDIUM">Medium Priority</option>
                    <option value="HIGH">High (Urgent Recovery)</option>
                    <option value="LOW">Low Priority</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Customer Email (Instant Delivery)
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    placeholder="customer@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-white border border-slate-300 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#00BAF2] focus:ring-1 focus:ring-[#00BAF2] shadow-2xs font-semibold"
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#002970] hover:bg-[#001f54] text-white font-bold text-xs shadow-paytm-card transition-all disabled:opacity-50 cursor-pointer"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <span>Register Invoice</span>
                  )}
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleCsvSubmit} className="space-y-4">
              <div className="p-8 rounded-2xl bg-slate-50 border-2 border-dashed border-slate-300 text-center flex flex-col items-center justify-center gap-3">
                <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center">
                  <Upload className="w-6 h-6 text-[#002970]" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">Upload Ledger CSV with Overdue Accounts</p>
                  <p className="text-xs text-slate-500 mt-1">
                    Columns: customer_name, phone, invoice_number, amount, due_date, language
                  </p>
                </div>
                <input
                  type="file"
                  accept=".csv"
                  onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
                  className="text-xs text-slate-600 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border file:border-slate-300 file:text-xs file:font-bold file:bg-white file:text-[#002970] hover:file:bg-slate-100 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500 pt-2">
                <span>Need an example template?</span>
                <button
                  type="button"
                  onClick={downloadSampleCSV}
                  className="text-[#00BAF2] hover:underline font-bold cursor-pointer"
                >
                  Download Sample CSV
                </button>
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !csvFile}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#002970] hover:bg-[#001f54] text-white font-bold text-xs shadow-paytm-card transition-all disabled:opacity-50 cursor-pointer"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <span>Import Invoices</span>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
