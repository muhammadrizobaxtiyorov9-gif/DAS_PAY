import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { getWagonMovements } from '@/app/actions/wagons';
import { Loader2, TrendingUp, Route, Calendar, ArrowRight } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  wagon: { id: number; number: string; type: string } | null;
}

export function WagonKpiModal({ isOpen, onClose, wagon }: Props) {
  const [loading, setLoading] = useState(false);
  const [movements, setMovements] = useState<any[]>([]);

  useEffect(() => {
    if (isOpen && wagon) {
      setLoading(true);
      getWagonMovements(wagon.id).then(res => {
        if (res.success) {
          setMovements(res.movements || []);
        }
        setLoading(false);
      });
    }
  }, [isOpen, wagon]);

  if (!wagon) return null;

  const totalLoadedKm = movements.filter(m => m.isLoaded).reduce((acc, m) => acc + m.distanceKm, 0);
  const totalEmptyKm = movements.filter(m => !m.isLoaded).reduce((acc, m) => acc + m.distanceKm, 0);
  const totalKm = totalLoadedKm + totalEmptyKm;
  const emptyRatio = totalKm > 0 ? ((totalEmptyKm / totalKm) * 100).toFixed(1) : 0;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto overflow-x-hidden">
        <DialogHeader>
          <DialogTitle className="text-xl">Vagon {wagon.number} — Unumdorlik KPI</DialogTitle>
          <DialogDescription>
            {wagon.type} vagonining masofa va harakatlanish tahlili.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center p-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : (
          <div className="space-y-6 mt-4 w-full">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-blue-50 border border-blue-100">
                <div className="flex items-center gap-2 text-blue-600 mb-2">
                  <Route className="w-5 h-5" />
                  <span className="font-semibold">Jami masofa</span>
                </div>
                <div className="text-2xl font-bold text-slate-900">{totalKm} <span className="text-sm font-medium text-slate-500">km</span></div>
                <div className="text-xs text-slate-500 mt-1">Yukli: {totalLoadedKm} km / Bo'sh: {totalEmptyKm} km</div>
              </div>
              <div className="p-4 rounded-xl bg-orange-50 border border-orange-100">
                <div className="flex items-center gap-2 text-orange-600 mb-2">
                  <TrendingUp className="w-5 h-5" />
                  <span className="font-semibold">Bo'sh qatnov koeffitsiyenti</span>
                </div>
                <div className="text-2xl font-bold text-slate-900">{emptyRatio}%</div>
                <div className="text-xs text-slate-500 mt-1">Norma: &lt;30% (qancha past bo'lsa shuncha yaxshi)</div>
              </div>
              <div className="p-4 rounded-xl bg-green-50 border border-green-100">
                <div className="flex items-center gap-2 text-green-600 mb-2">
                  <Calendar className="w-5 h-5" />
                  <span className="font-semibold">Qatnovlar soni</span>
                </div>
                <div className="text-2xl font-bold text-slate-900">{movements.length} <span className="text-sm font-medium text-slate-500">ta qatnov</span></div>
                <div className="text-xs text-slate-500 mt-1">Barcha yo'nalishlar bo'yicha hisobot</div>
              </div>
            </div>

            {/* Table */}
            <h3 className="font-semibold text-slate-900 text-lg mt-6 mb-3">Harakatlar tarixi</h3>
            <div className="rounded-xl border border-slate-200 overflow-x-auto bg-white">
              <table className="w-full text-left text-sm text-slate-600 min-w-[600px]">
                <thead className="bg-slate-50 border-b border-slate-100 text-xs font-semibold uppercase text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Sana</th>
                    <th className="px-4 py-3">Yo'nalish</th>
                    <th className="px-4 py-3">Buyurtma</th>
                    <th className="px-4 py-3">Masofa</th>
                    <th className="px-4 py-3">Kunlik tezlik</th>
                    <th className="px-4 py-3 text-right">Holat</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {movements.length === 0 && (
                    <tr><td colSpan={6} className="p-6 text-center text-slate-400">Hech qanday harakat topilmadi.</td></tr>
                  )}
                  {movements.map((m) => (
                    <tr key={m.id} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div>{new Date(m.startDate).toLocaleDateString()}</div>
                        <div className="text-xs text-slate-400">
                          {m.endDate ? new Date(m.endDate).toLocaleDateString() : 'Hozirgacha'}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-slate-800">{m.fromStation?.nameUz || 'Noma\'lum'}</span>
                          <ArrowRight className="w-3 h-3 text-slate-400" />
                          <span className="font-medium text-slate-800">{m.toStation?.nameUz || 'Noma\'lum'}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {m.shipment ? (
                          <span className="text-blue-600 font-medium">{m.shipment.trackingCode}</span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium">{m.distanceKm} km</div>
                      </td>
                      <td className="px-4 py-3">
                        {m.averageDailyKm ? (
                          <div className="font-medium text-slate-900">{m.averageDailyKm.toFixed(1)} km/kun</div>
                        ) : (
                          <span className="text-slate-400">Hisoblanmagan</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {m.isLoaded ? (
                          <span className="inline-flex bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded text-xs font-semibold">Yukli</span>
                        ) : (
                          <span className="inline-flex bg-orange-50 text-orange-700 border border-orange-200 px-2 py-0.5 rounded text-xs font-semibold">Bo'sh</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
