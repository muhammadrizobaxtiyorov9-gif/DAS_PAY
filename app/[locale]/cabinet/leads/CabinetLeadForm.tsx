'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Send } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { contactFormSchema, type ContactFormData, serviceTypes } from '@/lib/validations';
import { useRouter } from 'next/navigation';

export function CabinetLeadForm({ defaultName, defaultPhone }: { defaultName: string; defaultPhone: string }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    watch,
    formState: { errors },
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
       name: defaultName,
       phone: defaultPhone
    }
  });

  const selectedService = watch('service');
  const isRailway = selectedService === 'railway_freight';

  const onSubmit = async (data: ContactFormData) => {
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Xatolik yuz berdi");
      }

      toast.success("Ariza muvaffaqiyatli yuborildi!");
      reset({ name: defaultName, phone: defaultPhone }); // Keep name and phone
      router.refresh(); // Refresh to show the new lead in the list
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Xatolik yuz berdi");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <input type="text" {...register('honeypot')} className="hidden" tabIndex={-1} autoComplete="off" />

      {/* Basic fields disabled or hidden since they are already known */}
      <div className="space-y-4 hidden pb-4 border-b">
         <Input {...register('name')} readOnly />
         <Input {...register('phone')} readOnly />
      </div>

      <div className="space-y-2">
        <Label className="text-xs font-bold uppercase text-gray-500">Xizmat turi</Label>
        <Select onValueChange={(value) => setValue('service', value)}>
          <SelectTrigger className="h-12 bg-gray-50">
            <SelectValue placeholder="Xizmat turini tanlang" />
          </SelectTrigger>
          <SelectContent>
            {serviceTypes.map((service) => (
              <SelectItem key={service.value} value={service.value}>
                {service.value === 'railway_freight' ? 'Temir yo\'l orqali tashish' :
                 service.value === 'road_freight' ? 'Avto transport orqali tashish' :
                 service.value === 'air_freight' ? 'Havo yo\'llari orqali tashish' :
                 service.value === 'customs_clearance' ? 'Bojxona rasmiylashtiruvi' :
                 service.value === 'warehousing' ? 'Ombor xizmatlari' : 'Boshqa'}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isRailway && (
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase text-gray-500">Qayerdan (Stansiya)</Label>
            <Input {...register('fromStation')} className="h-12 bg-gray-50" placeholder="Stansiya nomi" />
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase text-gray-500">Qayerga (Stansiya)</Label>
            <Input {...register('toStation')} className="h-12 bg-gray-50" placeholder="Stansiya nomi" />
          </div>
        </div>
      )}

      <div className="space-y-2">
        <Label className="text-xs font-bold uppercase text-gray-500">Qo'shimcha ma'lumot (Vazni, hajmi)</Label>
        <Textarea
          {...register('message')}
          placeholder="Yuk haqida batafsil ma'lumot qoldiring..."
          rows={4}
          className={`bg-gray-50 ${errors.message ? 'border-red-500' : ''}`}
        />
        {errors.message && <p className="text-xs text-red-500">{errors.message.message}</p>}
      </div>

      <Button type="submit" className="w-full h-12 bg-[#042C53] hover:bg-[#185FA5] font-bold text-white transition-colors mt-2" disabled={isSubmitting}>
        {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
        Arizani yuborish
      </Button>
    </form>
  );
}
