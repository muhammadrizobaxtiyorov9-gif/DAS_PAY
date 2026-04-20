'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { Loader2, Search, X } from 'lucide-react';
import type { Shipment } from '@prisma/client';

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
}: {
  initialShipments: any[];
}) {
  const [shipments, setShipments] = useState(initialShipments);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClient, setSelectedClient] = useState('');
  const [activeShipmentId, setActiveShipmentId] = useState<number | null>(null);

  // Extract unique clients for filter
  const clients = Array.from(new Set(initialShipments.map(s => s.client?.name || s.senderName).filter(Boolean)));

  const filteredShipments = initialShipments.filter(s => {
    const matchesSearch = 
      s.trackingCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.senderName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesClient = selectedClient ? (s.client?.name === selectedClient || s.senderName === selectedClient) : true;
    return matchesSearch && matchesClient;
  });

  return (
    <div className="flex h-[calc(100vh-140px)] w-full flex-col md:flex-row overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      {/* Sidebar Controls */}
      <div className="w-full md:w-80 border-r border-gray-200 flex flex-col bg-white">
        <div className="p-4 border-b border-gray-100 bg-gray-50/50">
          <h2 className="font-bold text-gray-900 mb-4">Yuklar xaritasi</h2>
          
          <div className="space-y-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Treking kod yoki mijoz..."
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

            {/* Client Filter */}
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
          </div>
        </div>

        {/* List of Shipments */}
        <div className="flex-1 overflow-y-auto p-2">
          {filteredShipments.length === 0 ? (
            <div className="text-center py-8 text-sm text-gray-500">Yuklar topilmadi</div>
          ) : (
            <div className="space-y-1">
              {filteredShipments.map(s => (
                <button
                  key={s.id}
                  onClick={() => setActiveShipmentId(s.id)}
                  className={`w-full text-left p-3 rounded-xl transition-all ${
                    activeShipmentId === s.id 
                      ? 'bg-blue-50 border border-blue-200 shadow-sm' 
                      : 'hover:bg-gray-50 border border-transparent'
                  }`}
                >
                  <div className="font-mono text-sm font-bold text-[#185FA5]">{s.trackingCode}</div>
                  <div className="text-sm font-medium text-gray-900 mt-0.5 truncate">{s.origin} → {s.destination}</div>
                  <div className="text-xs text-gray-500 mt-1 truncate">{s.senderName}</div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Map Area */}
      <div className="flex-1 relative bg-gray-100">
        <MapComponent 
          shipments={filteredShipments} 
          activeShipmentId={activeShipmentId}
          onMarkerClick={setActiveShipmentId}
        />
      </div>
    </div>
  );
}
