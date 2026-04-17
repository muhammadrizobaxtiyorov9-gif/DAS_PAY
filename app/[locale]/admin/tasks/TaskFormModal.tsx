'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { createTask } from '@/app/actions/admin';
import { useRouter } from 'next/navigation';

export function TaskFormModal({ staff, leads }: { staff: any[], leads: any[] }) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    
    const formData = new FormData(e.currentTarget);
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const deadline = new Date(formData.get('deadline') as string);
    const assignedById = parseInt(formData.get('assignedById') as string);
    const assignedToId = parseInt(formData.get('assignedToId') as string);
    const priority = formData.get('priority') as string;
    const leadId = formData.get('leadId') ? parseInt(formData.get('leadId') as string) : undefined;

    if (!assignedById || !assignedToId || !title || !deadline) {
       toast.error("Barcha majburiy maydonlarni to'ldiring");
       setIsSubmitting(false);
       return;
    }

    const { success, error } = await createTask({
       title, description, deadline, assignedById, assignedToId, priority, leadId, status: 'pending'
    });

    if (success) {
       toast.success("Topshiriq muvaffaqiyatli saqlandi!");
       setOpen(false);
       router.refresh();
    } else {
       toast.error(error || "Topshiriq saqlashda xatolik");
    }
    
    setIsSubmitting(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-[#185FA5] hover:bg-[#042C53] text-white">
          <Plus className="w-4 h-4 mr-2" /> Yangi Topshiriq
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-xl">Yangi topshiriq biriktirish</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label>Topshiriq mavzusi *</Label>
            <Input name="title" required placeholder="Masalan: Yukni rasmiylashtirish" />
          </div>

          <div className="space-y-2">
            <Label>Batafsil ma'lumot</Label>
            <Textarea name="description" placeholder="Aynan nima qilinishi kerak..." rows={3} />
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div className="space-y-2">
               <Label>Kimga *</Label>
               <select name="assignedToId" required className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background disabled:cursor-not-allowed disabled:opacity-50">
                 <option value="">Tanlang...</option>
                 {staff.map(u => <option key={u.id} value={u.id}>{u.name || u.username}</option>)}
               </select>
             </div>
             <div className="space-y-2">
               <Label>Kirituvchi *</Label>
               <select name="assignedById" required className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background disabled:cursor-not-allowed disabled:opacity-50">
                 {staff.map(u => <option key={u.id} value={u.id}>{u.name || u.username}</option>)}
               </select>
             </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div className="space-y-2">
               <Label>Muddat (Deadline) *</Label>
               <Input name="deadline" type="date" required />
             </div>
             <div className="space-y-2">
               <Label>Muhimlik darajasi</Label>
               <select name="priority" className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background disabled:cursor-not-allowed disabled:opacity-50">
                 <option value="low">Past</option>
                 <option value="medium" selected>O'rta</option>
                 <option value="high">Yuqori</option>
                 <option value="urgent">Shoshilinch!</option>
               </select>
             </div>
          </div>

          <div className="space-y-2">
            <Label>Bog'langan mijoz arizasi (Ixtiyoriy)</Label>
            <select name="leadId" className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background disabled:cursor-not-allowed disabled:opacity-50">
              <option value="">Arizaga bog'lamaslik</option>
              {leads.map(lead => <option key={lead.id} value={lead.id}>{lead.name} - {lead.service}</option>)}
            </select>
          </div>

          <Button type="submit" disabled={isSubmitting} className="w-full bg-[#185FA5] mt-4">
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Topshiriqni Saqlash
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
