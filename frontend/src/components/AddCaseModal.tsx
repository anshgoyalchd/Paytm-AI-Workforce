import React, { useState } from 'react';
import { X, FileText, Upload, User, Phone, Mail, IndianRupee, Calendar, Languages, CheckCircle2, AlertCircle } from 'lucide-react';
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
  const [email, setEmail] = useState('');
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
      setSuccessMessage(`Invoice ${invoiceNumber} registered! Autonomous AI agent ready for recovery.`);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-150 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-900/80">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-sky-400" />
              <span>Add Overdue Invoice</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Enter customer and invoice details to start autonomous collection workflows
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-slate-800 bg-slate-950/50 p-1">
          <button
            type="button"
            onClick={() => { setTab('MANUAL'); setError(null); }}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
              tab === 'MANUAL'
                ? 'bg-sky-500/15 text-sky-400 border border-sky-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Single Invoice Form
          </button>
          <button
            type="button"
            onClick={() => { setTab('CSV'); setError(null); }}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
              tab === 'CSV'
                ? 'bg-sky-500/15 text-sky-400 border border-sky-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Bulk CSV Import
          </button>
        </div>

        {/* Messages */}
        {error && (
          <div className="m-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {successMessage && (
          <div className="m-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Form Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {tab === 'MANUAL' ? (
            <form onSubmit={handleManualSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Customer Full Name *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Ramesh Sharma"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Mobile Number (+91) *
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                    <input
                      type="tel"
                      required
                      placeholder="+91-9876543210"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-400"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Invoice Number *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. INV-2026-108"
                    value={invoiceNumber}
                    onChange={(e) => setInvoiceNumber(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Outstanding Amount (₹) *
                  </label>
                  <div className="relative">
                    <IndianRupee className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                    <input
                      type="number"
                      step="0.01"
                      required
                      placeholder="18500"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-400"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Due Date *
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                    <input
                      type="date"
                      required
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white focus:outline-none focus:border-sky-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Language
                  </label>
                  <div className="relative">
                    <Languages className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                    <select
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white focus:outline-none focus:border-sky-400"
                    >
                      <option value="Hindi">Hindi</option>
                      <option value="English">English</option>
                      <option value="Hinglish">Hinglish</option>
                      <option value="Tamil">Tamil</option>
                      <option value="Telugu">Telugu</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Priority
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white focus:outline-none focus:border-sky-400"
                  >
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High (Urgent)</option>
                    <option value="LOW">Low</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Customer Email (Optional)
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                  <input
                    type="email"
                    placeholder="customer@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-400"
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-semibold text-xs shadow-lg shadow-sky-500/20 transition-all disabled:opacity-50"
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
              <div className="p-4 rounded-xl bg-slate-950 border border-dashed border-slate-700 text-center flex flex-col items-center justify-center gap-2">
                <Upload className="w-8 h-8 text-sky-400" />
                <div>
                  <p className="text-sm font-semibold text-slate-200">Upload CSV with overdue accounts</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Columns: customer_name, phone, invoice_number, amount, due_date, language
                  </p>
                </div>
                <input
                  type="file"
                  accept=".csv"
                  onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
                  className="text-xs text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-sky-500/20 file:text-sky-300 hover:file:bg-sky-500/30 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between text-xs text-slate-400 pt-2">
                <span>Need a template?</span>
                <button
                  type="button"
                  onClick={downloadSampleCSV}
                  className="text-sky-400 hover:underline font-semibold"
                >
                  Download Sample CSV
                </button>
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !csvFile}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-semibold text-xs shadow-lg shadow-sky-500/20 transition-all disabled:opacity-50"
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
