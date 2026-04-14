'use client';

import { useState, useCallback } from 'react';

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

interface UseTrackingReturn {
  result: TrackingResult | null;
  error: string | null;
  isLoading: boolean;
  track: (code: string) => Promise<void>;
  reset: () => void;
}

/**
 * Hook for tracking shipments
 */
export function useTracking(): UseTrackingReturn {
  const [result, setResult] = useState<TrackingResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const track = useCallback(async (code: string) => {
    if (!code.trim()) {
      setError('Please enter a tracking code');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/tracking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trackingCode: code.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Shipment not found');
      }

      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
    setIsLoading(false);
  }, []);

  return {
    result,
    error,
    isLoading,
    track,
    reset,
  };
}
