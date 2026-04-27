import { ImageResponse } from 'next/og';
import { prisma } from '@/lib/prisma';
import { shipmentStatusMeta } from '@/lib/shipment-status';

export const runtime = 'nodejs';
export const alt = 'DasPay shipment tracking';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function OpenGraphImage({ params }: { params: { code: string } }) {
  const { code } = params;

  const shipment = await prisma.shipment.findUnique({
    where: { trackingCode: code },
    select: { trackingCode: true, origin: true, destination: true, status: true },
  });

  const fallbackTitle = shipment ? shipment.trackingCode : code;
  const status = shipment?.status ?? 'pending';
  const statusMeta = shipmentStatusMeta(status, 'uz');
  const origin = shipment?.origin || '—';
  const destination = shipment?.destination || '—';

  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          background: 'linear-gradient(135deg, #042C53 0%, #0A3D6E 50%, #185FA5 100%)',
          padding: '64px',
          fontFamily: 'sans-serif',
          color: 'white',
        }}
      >
        {/* Brand row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: 'rgba(255,255,255,0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '28px',
            }}
          >
            📦
          </div>
          <div style={{ fontSize: '32px', fontWeight: 800, letterSpacing: '-0.02em' }}>DasPay</div>
        </div>

        {/* Tracking code */}
        <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column' }}>
          <div
            style={{
              fontSize: '20px',
              textTransform: 'uppercase',
              letterSpacing: '0.2em',
              opacity: 0.7,
            }}
          >
            Tracking
          </div>
          <div
            style={{
              fontSize: '72px',
              fontWeight: 800,
              fontFamily: 'monospace',
              marginTop: '8px',
              letterSpacing: '-0.02em',
            }}
          >
            {fallbackTitle}
          </div>

          {/* Route line */}
          <div
            style={{
              marginTop: '40px',
              fontSize: '36px',
              display: 'flex',
              alignItems: 'center',
              gap: '24px',
              opacity: 0.95,
            }}
          >
            <span style={{ fontWeight: 600 }}>{origin}</span>
            <span style={{ opacity: 0.5 }}>→</span>
            <span style={{ fontWeight: 600 }}>{destination}</span>
          </div>

          {/* Status pill */}
          <div
            style={{
              marginTop: '32px',
              display: 'inline-flex',
              alignSelf: 'flex-start',
              alignItems: 'center',
              gap: '12px',
              background: 'rgba(255,255,255,0.18)',
              padding: '12px 24px',
              borderRadius: '999px',
              fontSize: '24px',
              fontWeight: 600,
            }}
          >
            <span
              style={{
                width: '12px',
                height: '12px',
                borderRadius: '999px',
                background: '#10b981',
              }}
            />
            {statusMeta.labelText}
          </div>
        </div>

        {/* Footer URL */}
        <div
          style={{
            position: 'absolute',
            bottom: '40px',
            right: '64px',
            fontSize: '20px',
            opacity: 0.6,
          }}
        >
          das-pay.com
        </div>
      </div>
    ),
    { ...size },
  );
}
