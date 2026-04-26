import { NextRequest } from 'next/server';
import { getAdminSession } from '@/lib/adminAuth';
import { subscribe } from '@/lib/events';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/stream — Server-Sent Events for real-time admin dashboard.
 * Filters: ?topics=lead,shipment,invoice
 */
export async function GET(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return new Response('unauthorized', { status: 401 });
  }

  const topics = (req.nextUrl.searchParams.get('topics') || '').split(',').filter(Boolean);

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const send = (event: string, data: unknown) => {
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
      };

      send('hello', { user: session.username, ts: Date.now() });

      const unsubscribe = subscribe((evt) => {
        if (topics.length > 0) {
          const prefix = evt.name.split('.')[0];
          if (!topics.includes(prefix)) return;
        }
        send(evt.name, { ...evt.data as object, ts: evt.ts });
      });

      // Heartbeat every 25s to keep proxies happy
      const heartbeat = setInterval(() => {
        controller.enqueue(encoder.encode(`: keep-alive ${Date.now()}\n\n`));
      }, 25_000);

      const close = () => {
        clearInterval(heartbeat);
        unsubscribe();
        try {
          controller.close();
        } catch {
          /* already closed */
        }
      };

      // Close on client disconnect
      req.signal.addEventListener('abort', close);
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
