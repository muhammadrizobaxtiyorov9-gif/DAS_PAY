'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, LogIn, Eye, EyeOff } from 'lucide-react';

export default function AdminLoginPage() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      if (res.ok) {
        const currentPath = window.location.pathname;
        const locale = currentPath.split('/')[1] || 'uz';
        window.location.href = `/${locale}/admin`;
      } else {
        const data = await res.json();
        setError(data.error || 'Noto\'g\'ri parol!');
      }
    } catch {
      setError('Server bilan ulanishda xatolik.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#f8f9fc] px-4">
      {/* Background decoration */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-40 -top-40 h-[500px] w-[500px] rounded-full bg-blue-100/40 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 h-[500px] w-[500px] rounded-full bg-indigo-100/40 blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="relative w-full max-w-[420px]"
      >
        {/* Card */}
        <div className="overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-xl shadow-gray-200/40">
          {/* Header */}
          <div className="relative overflow-hidden bg-gradient-to-br from-[#042C53] via-[#0A3D6E] to-[#185FA5] px-8 py-10 text-center">
            <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/5 blur-xl" />
            <div className="absolute -bottom-8 -left-8 h-24 w-24 rounded-full bg-white/5 blur-xl" />

            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="relative mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 shadow-lg shadow-black/10 backdrop-blur-sm"
            >
              <Shield className="h-8 w-8 text-white" />
            </motion.div>
            <h1 className="relative mt-5 text-xl font-bold text-white">DasPay Admin</h1>
            <p className="relative mt-1.5 text-sm text-blue-200">
              Xavfsiz boshqaruv paneliga kirish
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="px-8 py-8">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Maxfiy parol
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3 pr-12 text-gray-900 transition-all duration-200 placeholder:text-gray-400 focus:border-[#185FA5] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#185FA5]/20"
                  placeholder="Parolni kiriting"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-gray-400 transition-colors hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600"
              >
                {error}
              </motion.div>
            )}

            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              type="submit"
              disabled={loading}
              className="mt-6 flex w-full items-center justify-center gap-2.5 rounded-xl bg-gradient-to-r from-[#042C53] to-[#185FA5] px-4 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition-all duration-200 hover:shadow-xl hover:shadow-blue-600/30 disabled:opacity-50"
            >
              {loading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : (
                <>
                  Tizimga kirish
                  <LogIn className="h-4 w-4" />
                </>
              )}
            </motion.button>
          </form>
        </div>

        {/* Trust badge */}
        <p className="mt-6 text-center text-xs text-gray-400">
          🔒 JWT kriptografik himoya bilan ta'minlangan
        </p>
      </motion.div>
    </div>
  );
}
