'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Search, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { trackingFormSchema, type TrackingFormData } from '@/lib/validations';
import { useTranslations } from '@/components/providers/LocaleProvider';

interface TrackingFormProps {
  onResult?: (result: unknown) => void;
  onError?: (error: string) => void;
}

/**
 * Standalone tracking form component
 */
export function TrackingForm({ onResult, onError }: TrackingFormProps) {
  const t = useTranslations();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TrackingFormData>({
    resolver: zodResolver(trackingFormSchema),
  });

  const onSubmit = async (data: TrackingFormData) => {
    setIsLoading(true);

    try {
      const response = await fetch('/api/tracking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || t('tracking.notFound'));
      }

      onResult?.(result);
    } catch (error) {
      onError?.(error instanceof Error ? error.message : t('tracking.notFound'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex gap-3">
      <div className="relative flex-1">
        <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
        <Input
          {...register('trackingCode')}
          placeholder={t('tracking.placeholder')}
          className={`h-12 pl-12 ${errors.trackingCode ? 'border-destructive' : ''}`}
        />
      </div>
      <Button
        type="submit"
        className="h-12 bg-[#042C53] px-6 hover:bg-[#185FA5]"
        disabled={isLoading}
      >
        {isLoading ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          t('tracking.button')
        )}
      </Button>
    </form>
  );
}
