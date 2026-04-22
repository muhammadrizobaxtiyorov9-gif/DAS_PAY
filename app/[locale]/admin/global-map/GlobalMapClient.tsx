'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { Loader2, Search, X, Package, Train, MapPin } from 'lucide-react';
import { wagonStatusMeta } from '@/lib/wagon-status';

const MapComponent = dynamic(() => import('./MapComponent'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center gap-2">
        <Loader2 className="h-8 w-8 animate-spin text-[#185FA5]" />
        <p className="text-sm text-gray-500 font-medium">Xarita yuklanmoqda...</p>
      </div>
    </div>
  ),
});

export default function GlobalMapClient({
  initialShipments,
  initialWagons = [],
}: {
  initialShipments: any[];
  initialWagons?: any[];
}) {
  const [activeTab, setActiveTab] = useState<'shipments' | 'wagons'>('wagons');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClient, setSelectedClient] = useState('');
  const [activeItemId, setActiveItemId] = useState<string | null>(null);

  // Extract unique clients for filter
  const clients = Array.from(new Set(initialShipments.map(s => s.client?.name || s.senderName).filter(Boolean)));

  const filteredShipments = initialShipments.filter(s => {
    const matchesSearch = 
      s.trackingCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.senderName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesClient = selectedClient ? (s.client?.name === selectedClient || s.senderName === selectedClient) : true;
    return matchesSearch && matchesClient;
  });

  const filteredWagons = initialWagons.filter(w => {
    return w.number.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="flex h-[calc(100vh-140px)] w-full flex-col md:flex-row overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      {/* Sidebar Controls */}
      <div className="w-full md:w-80 border-r border-gray-200 flex flex-col bg-white">
        <div className="p-4 border-b border-gray-100 bg-gray-50/50">
          
          <div className="flex bg-slate-200/50 p-1 rounded-lg mb-4">
            <button
              onClick={() => setActiveTab('wagons')}
              className={`flex-1 flex items-center justify-center gap-2 py-1.5 text-sm font-medium rounded-md transition-colors ${activeTab === 'wagons' ? 'bg-white text-[#185FA5] shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
            >
              <Train className="w-4 h-4" /> Vagonlar
            </button>
            <button
              onClick={() => setActiveTab('shipments')}
              className={`flex-1 flex items-center justify-center gap-2 py-1.5 text-sm font-medium rounded-md transition-colors ${activeTab === 'shipments' ? 'bg-white text-[#185FA5] shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
            >
              <Package className="w-4 h-4" /> Yuklar
            </button>
          </div>
          
          <div className="space-y-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder={activeTab === 'shipments' ? "Treking kod yoki mijoz..." : "Vagon raqami..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-white pl-9 pr-3 py-2 text-sm outline-none focus:border-[#185FA5] focus:ring-1 focus:ring-[#185FA5]"
              />
              {searchTerm && (
                <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>

            {/* Client Filter (Shipments Only) */}
            {activeTab === 'shipments' && (
              <select
                value={selectedClient}
                onChange={(e) => setSelectedClient(e.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-[#185FA5] focus:ring-1 focus:ring-[#185FA5]"
              >
                <option value="">Barcha mijozlar</option>
                {clients.map(client => (
                  <option key={client} value={client}>{client}</option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* List Items */}
        <div className="flex-1 overflow-y-auto p-2">
          {activeTab === 'shipments' ? (
            filteredShipments.length === 0 ? (
              <div className="text-center py-8 text-sm text-gray-500">Yuklar topilmadi</div>
            ) : (
              <div className="space-y-1">
                {filteredShipments.map(s => (
                  <button
                    key={s.id}
                    onClick={() => setActiveItemId(`s_${s.id}`)}
                    className={`w-full text-left p-3 rounded-xl transition-all ${
                      activeItemId === `s_${s.id}` 
                        ? 'bg-blue-50 border border-blue-200 shadow-sm' 
                        : 'hover:bg-gray-50 border border-transparent'
                    }`}
                  >
                    <div className="font-mono text-sm font-bold text-[#185FA5]">{s.trackingCode}</div>
                    <div className="text-sm font-medium text-gray-900 mt-0.5 truncate">{s.origin} → {s.destination}</div>
                    <div className="text-xs text-gray-500 mt-1 flex items-center justify-between">
                      <span className="truncate">{s.senderName}</span>
                      {s.wagons?.length > 0 && <span className="flex items-center gap-1 text-slate-400"><Train className="w-3 h-3"/> {s.wagons.length}</span>}
                    </div>
                  </button>
                ))}
              </div>
            )
          ) : (
            filteredWagons.length === 0 ? (
              <div className="text-center py-8 text-sm text-gray-500">Joylashuvi kiritilgan vagonlar yo'q</div>
            ) : (
              <div className="space-y-1">
                {filteredWagons.map(w => {
                  const s = wagonStatusMeta(w.status);
                  return (
                    <button
                      key={w.id}
                      onClick={() => setActiveItemId(`w_${w.id}`)}
                      className={`w-full text-left p-3 rounded-xl transition-all ${
                        activeItemId === `w_${w.id}` 
                          ? 'bg-blue-50 border border-blue-200 shadow-sm' 
                          : 'hover:bg-gray-50 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="font-semibold text-slate-900">{w.number}</div>
                        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${s.pill}`}>
                          {s.labelText}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 flex items-center gap-1 mt-1 truncate">
                        <MapPin className="w-3 h-3" />
                        {w.currentStation?.nameUz || `${w.currentLat?.toFixed(2)}, ${w.currentLng?.toFixed(2)}`}
                      </div>
                    </button>
                  );
                })}
              </div>
            )
          )}
        </div>
      </div>

      {/* Map Area */}
      <div className="flex-1 relative bg-gray-100">
        <MapComponent 
          shipments={activeTab === 'shipments' ? filteredShipments : []} 
          wagons={activeTab === 'wagons' ? filteredWagons : []}
          activeItemId={activeItemId}
          onMarkerClick={setActiveItemId}
          activeTab={activeTab}
        />
      </div>
    </div>
  );
}
