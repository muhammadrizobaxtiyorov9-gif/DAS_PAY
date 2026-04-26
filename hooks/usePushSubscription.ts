'use client';

import { useCallback, useEffect, useState } from 'react';

type PermissionState = 'default' | 'granted' | 'denied' | 'unsupported';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; ++i) out[i] = raw.charCodeAt(i);
  return out;
}

export interface UsePushOptions {
  /** When subscribing as a client (not an admin user) */
  clientId?: number;
}

export function usePushSubscription(opts: UsePushOptions = {}) {
  const [permission, setPermission] = useState<PermissionState>('default');
  const [subscribed, setSubscribed] = useState(false);
  const [busy, setBusy] = useState(false);

  const supported = typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window;

  useEffect(() => {
    if (!supported) {
      setPermission('unsupported');
      return;
    }
    setPermission(Notification.permission as PermissionState);
    navigator.serviceWorker
      .getRegistration('/sw.js')
      .then((reg) => reg?.pushManager.getSubscription())
      .then((sub) => setSubscribed(!!sub))
      .catch(() => null);
  }, [supported]);

  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!supported) return false;
    setBusy(true);
    try {
      const reg =
        (await navigator.serviceWorker.getRegistration('/sw.js')) ||
        (await navigator.serviceWorker.register('/sw.js'));

      const perm = await Notification.requestPermission();
      setPermission(perm as PermissionState);
      if (perm !== 'granted') return false;

      const keyRes = await fetch('/api/push/vapid-public-key');
      if (!keyRes.ok) return false;
      const { publicKey } = await keyRes.json();

      const existing = await reg.pushManager.getSubscription();
      const sub =
        existing ||
        (await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey),
        }));

      const json = sub.toJSON() as { endpoint?: string; keys?: { p256dh?: string; auth?: string } };

      const res = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          endpoint: json.endpoint,
          keys: { p256dh: json.keys?.p256dh, auth: json.keys?.auth },
          ...(opts.clientId ? { clientId: opts.clientId } : {}),
        }),
      });

      if (!res.ok) return false;
      setSubscribed(true);
      return true;
    } finally {
      setBusy(false);
    }
  }, [supported, opts.clientId]);

  const unsubscribe = useCallback(async (): Promise<boolean> => {
    if (!supported) return false;
    setBusy(true);
    try {
      const reg = await navigator.serviceWorker.getRegistration('/sw.js');
      const sub = await reg?.pushManager.getSubscription();
      if (sub) {
        await fetch('/api/push/unsubscribe', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
        await sub.unsubscribe();
      }
      setSubscribed(false);
      return true;
    } finally {
      setBusy(false);
    }
  }, [supported]);

  return { supported, permission, subscribed, busy, subscribe, unsubscribe };
}
