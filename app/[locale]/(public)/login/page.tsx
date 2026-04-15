'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Phone, KeyRound, Loader2, Info, Lock, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

type Step = 'phone' | 'password' | 'otp_verify';

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Step 1: Check phone number
  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.length < 9) {
      toast.error("Telefon raqamni to'g'ri kiriting");
      return;
    }
    
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/auth/check-phone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone })
      });
      const data = await res.json();
      
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Raqam topilmadi");
      }
      
      if (data.hasPassword) {
        // Has password, ask for it
        setStep('password');
      } else {
        // First time, no password. Send OTP directly.
        await sendOtpRequest();
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper to trigger OTP
  const sendOtpRequest = async () => {
    const res = await fetch('/api/auth/otp/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone })
    });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.error || "Ulanishda xatolik");
    toast.success("Tasdiqlash kodi Telegram botga yuborildi");
    setStep('otp_verify');
  };

  // Step 2: Login with Password
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 4) {
      toast.error("Parolni kiriting");
      return;
    }
    
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, password })
      });
      const data = await res.json();
      
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Login xatoligi");
      }
      
      toast.success("Muvaffaqiyatli kirildi!");
      router.push(data.redirectUrl || '/uz/cabinet');
      router.refresh();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 3: Verify OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 4) {
      toast.error("4 xonali kodni kiriting");
      return;
    }
    
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/auth/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, otp })
      });
      const data = await res.json();
      
      if (!res.ok || !data.success) throw new Error(data.error || "Kod noto'g'ri");
      
      toast.success("Muvaffaqiyatli kirildi!");
      router.push(data.redirectUrl || '/uz/cabinet');
      router.refresh();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Forgot Password → Send OTP
  const handleForgotPassword = async () => {
    setIsSubmitting(true);
    try {
      await sendOtpRequest();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-secondary min-h-[85vh] flex items-center justify-center py-16 px-4 pt-28">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-4 bg-[#185FA5]/10 rounded-full mb-4">
            <ShieldCheck className="h-10 w-10 text-[#185FA5]" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">
            Kabinetga kirish
          </h1>
          <p className="text-muted-foreground mt-2">
            {step === 'phone' && "Avval telefon raqamingizni kiriting"}
            {step === 'password' && "Kabinetga kirish uchun parolni kiriting"}
            {step === 'otp_verify' && "Telegramga yuborilgan tasdiqlash kodini kiriting"}
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-3xl shadow-xl border p-8"
        >
          <AnimatePresence mode="wait">
            {/* STEP 1: PHONE */}
            {step === 'phone' && (
              <motion.form key="phone" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} onSubmit={handlePhoneSubmit} className="space-y-6">
                <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 flex gap-3 text-sm text-blue-900 mb-6">
                  <Info className="w-5 h-5 text-[#185FA5] shrink-0" />
                  <p>Avval <b>Telegram Bot</b> orqali ro'yxatdan o'tgan raqamni kiriting.</p>
                </div>
                
                <div className="space-y-3">
                  <Label htmlFor="phone">Telefon raqam</Label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+998 90 123 45 67" className="bg-gray-50 h-14 pl-12 text-lg font-medium" required />
                  </div>
                </div>

                <Button type="submit" className="w-full h-14 text-lg font-bold bg-[#042C53] hover:bg-[#185FA5]" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin mr-2" /> : null}
                  {isSubmitting ? "Kutilmoqda..." : "Davom etish"}
                </Button>

                <div className="text-center mt-6">
                  <a href="https://t.me/DasPayLogistic_bot" target="_blank" rel="noreferrer" className="text-sm font-semibold text-[#185FA5] hover:underline">
                    Bot orqali ro'yxatdan o'tish →
                  </a>
                </div>
              </motion.form>
             )}

            {/* STEP 2: PASSWORD */}
            {step === 'password' && (
              <motion.form key="password" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} onSubmit={handlePasswordSubmit} className="space-y-6">
                <div className="text-center space-y-2 mb-6">
                  <p className="font-bold text-lg bg-gray-100 mx-auto px-4 py-1 rounded-full">{phone}</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Parol</Label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••" className="bg-gray-50 h-14 pl-12 text-lg tracking-widest" required autoFocus />
                  </div>
                </div>

                <Button type="submit" className="w-full h-14 text-lg font-bold bg-[#042C53] hover:bg-[#185FA5]" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin mr-2" /> : null}
                  Kirish
                </Button>

                <div className="flex items-center justify-between mt-6 px-1">
                  <button type="button" onClick={() => setStep('phone')} className="flex items-center gap-1 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">
                    <ArrowLeft className="w-4 h-4" /> Boshqa raqam
                  </button>
                  <button type="button" onClick={handleForgotPassword} disabled={isSubmitting} className="text-sm font-semibold text-[#185FA5] hover:underline">
                    Parolni unutdingizmi?
                  </button>
                </div>
              </motion.form>
            )}

            {/* STEP 3: OTP VERIFY */}
            {step === 'otp_verify' && (
              <motion.form key="otp" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} onSubmit={handleVerifyOtp} className="space-y-6">
                <div className="text-center space-y-2 mb-6">
                  <p className="text-sm text-muted-foreground">Kodni ushbu raqamga yubordik:</p>
                  <p className="font-bold text-lg bg-gray-100 inline-block px-4 py-1 rounded-full">{phone}</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="otp" className="text-center block">Tasdiqlash kodi</Label>
                  <div className="max-w-[200px] mx-auto relative">
                    <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input id="otp" value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 4))} placeholder="0000" className="bg-gray-50 h-16 pl-12 text-3xl tracking-widest text-center font-bold" required maxLength={4} autoFocus />
                  </div>
                </div>

                <Button type="submit" className="w-full h-14 text-lg font-bold bg-[#185FA5] hover:bg-[#042C53]" disabled={isSubmitting || otp.length !== 4}>
                  {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin mr-2" /> : null}
                  Tasdiqlash
                </Button>

                <div className="text-center mt-6">
                  <button type="button" onClick={() => { setStep('phone'); setOtp(''); }} className="text-sm font-semibold text-gray-500 hover:text-gray-900 transition-colors">
                    ← Orqaga
                  </button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
