'use client';

import { useState } from 'react';
import { Lock, Loader2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export function PasswordForm({ phone, hasPassword }: { phone: string; hasPassword: boolean }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword.length < 6) {
      toast.error("Parol kamida 6 belgi bo'lishi kerak");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Parollar mos kelmadi");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/auth/set-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone,
          password: newPassword,
          currentPassword: hasPassword ? currentPassword : undefined
        })
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Xatolik');
      toast.success("Parol muvaffaqiyatli saqlandi!");
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 mt-6">
      {hasPassword && (
        <div className="space-y-2">
          <Label className="text-xs uppercase font-bold text-gray-500">Hozirgi parol</Label>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="Hozirgi parol" className="pl-12 h-14 bg-gray-50 text-lg" required />
          </div>
        </div>
      )}

      <div className="space-y-2">
        <Label className="text-xs uppercase font-bold text-gray-500">Yangi parol</Label>
        <div className="relative">
          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Kamida 6 belgi" className="pl-12 h-14 bg-gray-50 text-lg" required minLength={6} />
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-xs uppercase font-bold text-gray-500">Parolni tasdiqlang</Label>
        <div className="relative">
          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Parolni qayta kiriting" className="pl-12 h-14 bg-gray-50 text-lg" required minLength={6} />
        </div>
      </div>

      <Button type="submit" disabled={isSubmitting} className="w-full h-14 bg-[#042C53] hover:bg-[#185FA5] font-bold text-lg mt-4">
        {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Check className="w-5 h-5 mr-2" />}
        {hasPassword ? "Parolni yangilash" : "Parolni saqlash"}
      </Button>
    </form>
  );
}
