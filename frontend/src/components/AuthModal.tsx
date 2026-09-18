import React, { useState } from 'react';
import { Bot, Building2, User, Mail, Lock, Phone, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { api } from '../services/api';
import { AuthUser } from '../types';

interface AuthModalProps {
  onSuccess: (user: AuthUser) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ onSuccess }) => {
  const [tab, setTab] = useState<'LOGIN' | 'REGISTER'>('REGISTER');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register form state
  const [businessName, setBusinessName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [phone, setPhone] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const user = await api.login({
        email: loginEmail.trim(),
        password: loginPassword,
      });
      onSuccess(user);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!businessName || !ownerName || !registerEmail || !registerPassword) {
      setError('Please fill in all required fields.');
      return;
    }
    setLoading(true);
    try {
      const user = await api.register({
        business_name: businessName.trim(),
        owner_name: ownerName.trim(),
        email: registerEmail.trim(),
        password: registerPassword,
        phone: phone.trim() || undefined,
      });
      onSuccess(user);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Registration failed. Please check your details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
      <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header Branding */}
        <div className="bg-gradient-to-r from-blue-900 via-sky-900 to-slate-900 p-6 border-b border-slate-800 text-white relative">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#00BAF2] to-[#002E6E] flex items-center justify-center shadow-lg shadow-sky-500/20 border border-sky-400/30">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight">Paytm AI Workforce</h1>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-sky-400/20 text-sky-300 border border-sky-400/30">
                  Production
                </span>
              </div>
              <p className="text-xs text-sky-200/80">Autonomous Debt Recovery & Multi-Tenant Collections Employee</p>
            </div>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-slate-800 bg-slate-900/50 p-1">
          <button
            type="button"
            onClick={() => { setTab('REGISTER'); setError(null); }}
            className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${
              tab === 'REGISTER'
                ? 'bg-sky-500/15 text-sky-400 border border-sky-500/30 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Register Business
          </button>
          <button
            type="button"
            onClick={() => { setTab('LOGIN'); setError(null); }}
            className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${
              tab === 'LOGIN'
                ? 'bg-sky-500/15 text-sky-400 border border-sky-500/30 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Merchant Sign In
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6">
          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0"></span>
              <span>{error}</span>
            </div>
          )}

          {tab === 'REGISTER' ? (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Business / Store Name *
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Apex Hardware Store"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700/80 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Owner / Manager Name *
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rajesh Kumar"
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700/80 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Work Email *
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                    <input
                      type="email"
                      required
                      placeholder="merchant@example.com"
                      value={registerEmail}
                      onChange={(e) => setRegisterEmail(e.target.value)}
                      className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700/80 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Mobile Number
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                    <input
                      type="tel"
                      placeholder="+91-9876543210"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700/80 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Secure Password *
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    placeholder="••••••••"
                    value={registerPassword}
                    onChange={(e) => setRegisterPassword(e.target.value)}
                    className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700/80 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-semibold text-sm shadow-lg shadow-sky-500/25 transition-all disabled:opacity-50"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <span>Create Merchant Account & Launch AI</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>

              <div className="flex items-center justify-center gap-2 pt-1 text-[11px] text-slate-500">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Compliant with RBI Fair Recovery Practices 2026</span>
              </div>
            </form>
          ) : (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Merchant Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                  <input
                    type="email"
                    required
                    placeholder="merchant@example.com"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700/80 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700/80 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-semibold text-sm shadow-lg shadow-sky-500/25 transition-all disabled:opacity-50"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <span>Sign In to Dashboard</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
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
