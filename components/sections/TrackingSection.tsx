'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Package, MapPin, Clock, CheckCircle2, Truck, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLocale, useTranslations } from '@/components/providers/LocaleProvider';

interface TrackingResult {
  trackingCode: string;
  status: 'pending' | 'processing' | 'inTransit' | 'delivered';
  origin: string;
  destination: string;
  lastUpdate: string;
  events: Array<{
    date: string;
    location: string;
    status: string;
  }>;
}

const statusIcons = {
  pending: Clock,
  processing: Package,
  inTransit: Truck,
  delivered: CheckCircle2,
};

const statusColors = {
  pending: 'text-yellow-500 bg-yellow-500/10',
  processing: 'text-blue-500 bg-blue-500/10',
  inTransit: 'text-[#185FA5] bg-[#185FA5]/10',
  delivered: 'text-green-500 bg-green-500/10',
};

/**
 * Tracking widget section for searching shipment status
 */
export function TrackingSection() {
  const { locale } = useLocale();
  const t = useTranslations();
  const [trackingCode, setTrackingCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<TrackingResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackingCode.trim()) return;

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/tracking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trackingCode: trackingCode.trim(), locale }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || t('tracking.notFound'));
      }

      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('tracking.notFound'));
    } finally {
      setIsLoading(false);
    }
  };

  const StatusIcon = result ? statusIcons[result.status] : Package;

  return (
    <section className="bg-secondary py-16 lg:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <h2 className="text-3xl font-bold text-foreground sm:text-4xl">
            {t('tracking.title')}
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            {t('tracking.subtitle')}
          </p>
        </motion.div>

        {/* Search Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mx-auto mt-10 max-w-2xl"
        >
          <form onSubmit={handleTrack} className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                value={trackingCode}
                onChange={(e) => setTrackingCode(e.target.value)}
                placeholder={t('tracking.placeholder')}
                className="h-14 pl-12 text-lg"
              />
            </div>
            <Button
              type="submit"
              size="lg"
              className="h-14 bg-[#042C53] px-8 hover:bg-[#185FA5]"
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                t('tracking.button')
              )}
            </Button>
          </form>
        </motion.div>

        {/* Results */}
        {(result || error) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-auto mt-8 max-w-2xl"
          >
            {error ? (
              <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-6 text-center">
                <Package className="mx-auto h-12 w-12 text-destructive/60" />
                <p className="mt-4 text-destructive">{error}</p>
              </div>
            ) : result ? (
              <div className="overflow-hidden rounded-xl border bg-card shadow-lg">
                {/* Status Header */}
                <div className="flex items-center justify-between border-b bg-muted/50 p-6">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {t('tracking.button')} #{result.trackingCode}
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      <div
                        className={`flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium ${
                          statusColors[result.status]
                        }`}
                      >
                        <StatusIcon className="h-4 w-4" />
                        {t(`tracking.status.${result.status}`)}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">
                      {t('tracking.lastUpdate')}
                    </p>
                    <p className="mt-1 font-medium">{result.lastUpdate}</p>
                  </div>
                </div>

                {/* Route Info */}
                <div className="flex items-center gap-4 border-b p-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      {t('tracking.origin')}
                    </div>
                    <p className="mt-1 font-medium">{result.origin}</p>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center">
                    <div className="h-0.5 w-full bg-border" />
                  </div>
                  <div className="flex-1 text-right">
                    <div className="flex items-center justify-end gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      {t('tracking.destination')}
                    </div>
                    <p className="mt-1 font-medium">{result.destination}</p>
                  </div>
                </div>

                {/* Timeline */}
                {result.events && result.events.length > 0 && (
                  <div className="p-6">
                    <div className="space-y-4">
                      {result.events.map((event, index) => (
                        <div key={index} className="flex gap-4">
                          <div className="flex flex-col items-center">
                            <div
                              className={`h-3 w-3 rounded-full ${
                                index === 0
                                  ? 'bg-[#185FA5]'
                                  : 'bg-muted-foreground/30'
                              }`}
                            />
                            {index < result.events.length - 1 && (
                              <div className="h-full w-0.5 bg-muted-foreground/20" />
                            )}
                          </div>
                          <div className="flex-1 pb-4">
                            <p className="text-sm font-medium">{event.status}</p>
                            <p className="text-sm text-muted-foreground">
                              {event.location} • {event.date}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : null}
          </motion.div>
        )}
      </div>
    </section>
  );
}


