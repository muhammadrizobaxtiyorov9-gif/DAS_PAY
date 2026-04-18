import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { FeedbackForm } from './FeedbackForm';
import { CheckCircle2, Star } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function FeedbackPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const feedback = await prisma.feedback.findUnique({
    where: { token },
    include: {
      shipment: {
        select: {
          trackingCode: true,
          origin: true,
          destination: true,
          receiverName: true,
        },
      },
    },
  });

  if (!feedback) notFound();

  const alreadySubmitted = !!feedback.submittedAt;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/40 to-slate-100 px-4 py-10">
      <div className="mx-auto max-w-xl">
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl">
          <div className="bg-gradient-to-br from-[#042C53] to-[#185FA5] p-6 text-white">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 backdrop-blur">
                <Star className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-lg font-bold">Xizmat sifatini baholang</h1>
                <p className="text-xs text-white/70">DasPay — mijoz ovozi muhim</p>
              </div>
            </div>
            {feedback.shipment && (
              <div className="mt-4 rounded-xl bg-white/10 p-3 text-xs">
                <div className="font-mono font-semibold">{feedback.shipment.trackingCode}</div>
                <div className="mt-0.5 text-white/80">
                  {feedback.shipment.origin} → {feedback.shipment.destination}
                </div>
                <div className="mt-0.5 text-white/60">
                  Oluvchi: {feedback.shipment.receiverName}
                </div>
              </div>
            )}
          </div>

          <div className="p-6">
            {alreadySubmitted ? (
              <div className="flex flex-col items-center py-8 text-center">
                <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
                  <CheckCircle2 className="h-8 w-8 text-emerald-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Rahmat!</h2>
                <p className="mt-2 text-sm text-slate-500">
                  Sizning fikringiz qabul qilindi va jamoaga yetkazildi.
                </p>
                <div className="mt-4 rounded-xl bg-slate-50 px-4 py-2 text-xs text-slate-500">
                  Baho: <b>{feedback.score}/10</b>
                  {feedback.category && <> · {feedback.category}</>}
                </div>
              </div>
            ) : (
              <FeedbackForm token={token} />
            )}
          </div>
        </div>

        <p className="mt-4 text-center text-xs text-slate-400">
          Ushbu havola faqat sizning yukingiz uchun. Baholash bir marotaba yuboriladi.
        </p>
      </div>
    </div>
  );
}
